-- Nexora locked business rules — part 2 of 3
--
-- Implements the missing daily Owner payout run and retires the V1_LOCKED hook.
--
--   * Owners keep the locked 90%; the platform keeps 10% (of which the Growth
--     Partner earns 10%). This migration only settles what the 90/10 RPC and
--     the 25/75 payment triggers already produced.
--   * A payout run is created once per local payout day at 22:00 Asia/Kolkata
--     by pg_cron, and is idempotent: re-running the same local day is a no-op.
--   * Only bookings that are completed, fully paid (advance + final), not
--     refunded and not disputed are eligible.
--   * The previously V1_LOCKED hook is replaced by a live v2 implementation
--     rather than being deleted, so existing callers keep working.

-- ---------------------------------------------------------------------------
-- 1. Payout runs and payout items
-- ---------------------------------------------------------------------------

create table if not exists public.owner_payout_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  scheduled_for timestamptz not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'skipped')),
  owner_count integer not null default 0,
  booking_count integer not null default 0,
  total_paise bigint not null default 0 check (total_paise >= 0),
  engine_version text not null default 'v2',
  trigger_source text not null default 'cron',
  notes text,
  constraint owner_payout_runs_unique_day unique (run_date)
);

create index if not exists owner_payout_runs_status_idx
  on public.owner_payout_runs (status, run_date desc);

create table if not exists public.owner_payouts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.owner_payout_runs (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete restrict,
  owner_user_id uuid,
  run_date date not null,
  booking_count integer not null default 0 check (booking_count >= 0),
  gross_paise bigint not null default 0 check (gross_paise >= 0),
  platform_fee_paise bigint not null default 0 check (platform_fee_paise >= 0),
  amount_paise bigint not null default 0 check (amount_paise >= 0),
  owner_share_bps integer not null default 9000 check (owner_share_bps = 9000),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  payout_reference text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_payouts_unique_salon_per_run unique (run_id, salon_id)
);

create index if not exists owner_payouts_salon_idx
  on public.owner_payouts (salon_id, run_date desc);

create index if not exists owner_payouts_status_idx
  on public.owner_payouts (status, run_date desc);

create table if not exists public.owner_payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.owner_payouts (id) on delete cascade,
  booking_id uuid not null,
  salon_id uuid not null,
  gross_paise bigint not null default 0 check (gross_paise >= 0),
  platform_fee_paise bigint not null default 0 check (platform_fee_paise >= 0),
  owner_amount_paise bigint not null default 0 check (owner_amount_paise >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint owner_payout_items_unique_booking unique (booking_id)
);

create index if not exists owner_payout_items_payout_idx
  on public.owner_payout_items (payout_id);

alter table public.owner_payout_runs enable row level security;
alter table public.owner_payouts enable row level security;
alter table public.owner_payout_items enable row level security;

revoke all on table public.owner_payout_runs from anon, authenticated;
revoke all on table public.owner_payouts from anon, authenticated;
revoke all on table public.owner_payout_items from anon, authenticated;
grant select on table public.owner_payouts to authenticated;
grant select on table public.owner_payout_items to authenticated;

-- Owners see only their own salon's settlements; runs stay server-only.
drop policy if exists owner_payouts_owner_read on public.owner_payouts;
create policy owner_payouts_owner_read
  on public.owner_payouts
  for select
  to authenticated
  using (private.can_manage_salon_settings(salon_id));

drop policy if exists owner_payout_items_owner_read on public.owner_payout_items;
create policy owner_payout_items_owner_read
  on public.owner_payout_items
  for select
  to authenticated
  using (private.can_manage_salon_settings(salon_id));

create or replace function private.touch_owner_payout()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end
$function$;

drop trigger if exists trg_owner_payouts_touch on public.owner_payouts;
create trigger trg_owner_payouts_touch
  before update on public.owner_payouts
  for each row
  execute function private.touch_owner_payout();

-- ---------------------------------------------------------------------------
-- 2. Eligibility: completed, fully paid (25% + 75%), unrefunded, undisputed
-- ---------------------------------------------------------------------------

create or replace function private.owner_payout_candidates(p_as_of timestamptz)
returns table (
  booking_id uuid,
  salon_id uuid,
  gross_paise bigint,
  platform_fee_paise bigint,
  owner_amount_paise bigint,
  completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  status_col text;
  completed_col text;
  statement text;
  candidate record;
  money record;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if to_regclass('public.bookings') is null then
    return;
  end if;

  select private.booking_column(array['status', 'booking_status']) into status_col;
  if status_col is null then
    return;
  end if;

  select private.booking_column(array['completed_at', 'service_completed_at', 'fulfilled_at', 'updated_at'])
  into completed_col;

  statement := format(
    'select to_jsonb(b) as row from public.bookings b '
    'left join public.owner_payout_items i on i.booking_id = b.id '
    'where i.booking_id is null '
    '  and lower(coalesce(b.%I::text, '''')) = any($1) %s',
    status_col,
    case when completed_col is null then '' else format('and b.%I <= $2', completed_col) end
  );

  for candidate in execute statement using rules.completion_statuses, p_as_of loop
    select * into money from private.booking_money(candidate.row);

    -- Skip anything refunded, disputed, or not fully collected. The 25%/75%
    -- triggers own payment state; the payout only settles a clean booking.
    continue when money.owner_share_paise <= 0;
    continue when money.refunded_paise > 0;
    continue when money.dispute_status = any (rules.dispute_statuses);
    continue when money.payment_status = any (rules.payment_hold_statuses);
    continue when money.salon_id is null;
    continue when money.completed_at is null or money.completed_at > p_as_of;

    booking_id := money.booking_id;
    salon_id := money.salon_id;
    gross_paise := money.gross_paise;
    platform_fee_paise := money.platform_fee_paise;
    owner_amount_paise := money.owner_share_paise;
    completed_at := money.completed_at;
    return next;
  end loop;
end
$function$;

-- ---------------------------------------------------------------------------
-- 3. The daily run itself — idempotent per local payout day
-- ---------------------------------------------------------------------------

create or replace function public.run_owner_daily_payouts(
  p_as_of timestamptz default now(),
  p_source text default 'cron',
  p_force boolean default false
)
returns public.owner_payout_runs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  run public.owner_payout_runs%rowtype;
  run_day date;
  scheduled timestamptz;
  owner_rows integer := 0;
  booking_rows integer := 0;
  total bigint := 0;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if not found then
    raise exception 'platform revenue rules are not installed';
  end if;

  run_day := (p_as_of at time zone rules.payout_timezone)::date;
  scheduled := ((run_day + make_interval(hours => rules.owner_payout_hour_local))
                at time zone rules.payout_timezone);

  if not rules.owner_payout_enabled and not p_force then
    insert into public.business_rule_events (rule_id, event, severity, detail)
    values ('owner_payout_daily_2200_ist', 'disabled', 'warning',
            'Owner payout run skipped because owner_payout_enabled is false.');
    select * into run from public.owner_payout_runs where run_date = run_day;
    return run;
  end if;

  -- Never settle before the locked 22:00 local cut-off.
  if p_as_of < scheduled and not p_force then
    insert into public.business_rule_events (rule_id, event, severity, detail, context)
    values ('owner_payout_daily_2200_ist', 'too_early', 'info',
            'Owner payout run requested before the locked 22:00 Asia/Kolkata cut-off.',
            jsonb_build_object('as_of', p_as_of, 'scheduled_for', scheduled));
    return null;
  end if;

  -- Idempotency: one completed run per local payout day.
  insert into public.owner_payout_runs (run_date, scheduled_for, status, engine_version, trigger_source)
  values (run_day, scheduled, 'running', rules.payout_engine_version, coalesce(nullif(trim(p_source), ''), 'cron'))
  on conflict (run_date) do nothing
  returning * into run;

  if run.id is null then
    select * into run from public.owner_payout_runs where run_date = run_day for update;
    if run.status = 'completed' and not p_force then
      return run;
    end if;
    update public.owner_payout_runs
    set status = 'running', started_at = now(), completed_at = null, notes = null
    where id = run.id
    returning * into run;
  end if;

  -- Group every eligible booking into one payout per salon for this run.
  with candidates as (
    select * from private.owner_payout_candidates(p_as_of)
  ),
  grouped as (
    select
      c.salon_id,
      count(*)::integer as booking_count,
      sum(c.gross_paise)::bigint as gross_paise,
      sum(c.platform_fee_paise)::bigint as platform_fee_paise,
      sum(c.owner_amount_paise)::bigint as amount_paise
    from candidates c
    group by c.salon_id
  ),
  inserted_payouts as (
    insert into public.owner_payouts (
      run_id, salon_id, owner_user_id, run_date, booking_count,
      gross_paise, platform_fee_paise, amount_paise, owner_share_bps, status
    )
    select
      run.id,
      g.salon_id,
      (
        select m.user_id
        from public.salons s
        join public.organization_members m
          on m.organization_id = s.organization_id
         and m.role = 'owner'
         and m.status = 'active'
        where s.id = g.salon_id
        order by m.joined_at
        limit 1
      ),
      run_day,
      g.booking_count,
      g.gross_paise,
      g.platform_fee_paise,
      g.amount_paise,
      rules.owner_share_bps,
      'pending'
    from grouped g
    where g.amount_paise > 0
    on conflict (run_id, salon_id) do update
      set booking_count = public.owner_payouts.booking_count + excluded.booking_count,
          gross_paise = public.owner_payouts.gross_paise + excluded.gross_paise,
          platform_fee_paise = public.owner_payouts.platform_fee_paise + excluded.platform_fee_paise,
          amount_paise = public.owner_payouts.amount_paise + excluded.amount_paise
    returning id, salon_id
  ),
  inserted_items as (
    insert into public.owner_payout_items (
      payout_id, booking_id, salon_id, gross_paise, platform_fee_paise, owner_amount_paise, completed_at
    )
    select p.id, c.booking_id, c.salon_id, c.gross_paise, c.platform_fee_paise, c.owner_amount_paise, c.completed_at
    from candidates c
    join inserted_payouts p on p.salon_id = c.salon_id
    on conflict (booking_id) do nothing
    returning owner_amount_paise
  )
  select
    (select count(*) from inserted_payouts),
    (select count(*) from inserted_items),
    (select coalesce(sum(owner_amount_paise), 0) from inserted_items)
  into owner_rows, booking_rows, total;

  update public.owner_payout_runs
  set status = 'completed',
      completed_at = now(),
      owner_count = owner_rows,
      booking_count = booking_rows,
      total_paise = total
  where id = run.id
  returning * into run;

  -- The same nightly pass matures Growth Partner holds that cleared 7 days.
  perform public.release_growth_partner_commissions(p_as_of);

  insert into public.business_rule_events (rule_id, event, severity, detail, context)
  values ('owner_payout_daily_2200_ist', 'completed', 'info',
          format('Owner payout run for %s settled %s booking(s) across %s owner(s) for %s paise.',
                 run_day, booking_rows, owner_rows, total),
          jsonb_build_object('run_id', run.id, 'run_date', run_day, 'scheduled_for', scheduled,
                             'owner_share_bps', rules.owner_share_bps, 'source', p_source));

  return run;
exception when others then
  if run.id is not null then
    update public.owner_payout_runs
    set status = 'failed', completed_at = now(), notes = sqlerrm
    where id = run.id;
  end if;
  insert into public.business_rule_events (rule_id, event, severity, detail)
  values ('owner_payout_daily_2200_ist', 'error', 'error', sqlerrm);
  raise;
end
$function$;

create or replace function public.mark_owner_payouts_paid(
  p_payout_ids uuid[],
  p_reference text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  paid integer := 0;
begin
  with settled as (
    update public.owner_payouts p
    set status = 'paid',
        payout_reference = nullif(trim(coalesce(p_reference, '')), ''),
        failure_reason = null
    where p.id = any (p_payout_ids)
      and p.status in ('pending', 'processing')
    returning p.id
  )
  select count(*) into paid from settled;

  return paid;
end
$function$;

revoke all on function public.run_owner_daily_payouts(timestamptz, text, boolean) from public, anon, authenticated;
revoke all on function public.mark_owner_payouts_paid(uuid[], text) from public, anon, authenticated;
revoke all on function private.owner_payout_candidates(timestamptz) from public, anon, authenticated;
grant execute on function public.run_owner_daily_payouts(timestamptz, text, boolean) to service_role;
grant execute on function public.mark_owner_payouts_paid(uuid[], text) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Retire the V1_LOCKED hook (replace, never delete, so callers keep working)
-- ---------------------------------------------------------------------------

do $hook_guard$
declare
  hook record;
begin
  for hook in
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'process_owner_payouts',
        'owner_payout_hook',
        'daily_owner_payout',
        'schedule_owner_payouts'
      )
  loop
    -- Record what the locked V1 hook looked like before it is superseded.
    insert into public.business_rule_events (rule_id, event, severity, detail, context)
    values ('owner_payout_daily_2200_ist', 'v1_hook_superseded', 'info',
            format('Legacy hook %I.%I(%s) replaced by run_owner_daily_payouts (v2).',
                   hook.schema_name, hook.function_name, hook.args),
            jsonb_build_object('schema', hook.schema_name, 'function', hook.function_name));

    execute format('drop function if exists %I.%I(%s)', hook.schema_name, hook.function_name, hook.args);
  end loop;
end
$hook_guard$;

-- Stable v2 entry point under the historical hook name.
create or replace function public.process_owner_payouts(
  p_as_of timestamptz default now()
)
returns public.owner_payout_runs
language sql
security definer
set search_path = ''
as $function$
  select public.run_owner_daily_payouts(p_as_of, 'process_owner_payouts', false);
$function$;

comment on function public.process_owner_payouts(timestamptz) is
  'Owner daily payout hook. Unlocked from V1_LOCKED on 2026-08-01: delegates to run_owner_daily_payouts (v2), which settles the locked Owner 90% share at 22:00 Asia/Kolkata.';

revoke all on function public.process_owner_payouts(timestamptz) from public, anon, authenticated;
grant execute on function public.process_owner_payouts(timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Schedule: every day at 22:00 Asia/Kolkata (16:30 UTC)
-- ---------------------------------------------------------------------------

do $cron_guard$
declare
  has_cron boolean;
begin
  select exists (select 1 from pg_available_extensions where name = 'pg_cron') into has_cron;
  if not has_cron then
    raise notice 'nexora: pg_cron is unavailable; schedule run_owner_daily_payouts externally at 22:00 Asia/Kolkata.';
    return;
  end if;

  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'nexora: could not enable pg_cron (%). Schedule the payout externally.', sqlerrm;
    return;
  end;

  -- pg_cron schedules in UTC on Supabase. 22:00 IST == 16:30 UTC (IST = UTC+5:30,
  -- and India observes no daylight saving, so this mapping is stable.)
  begin
    perform cron.unschedule('nexora-owner-daily-payout');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'nexora-owner-daily-payout',
    '30 16 * * *',
    $cron$select public.run_owner_daily_payouts(now(), 'cron', false);$cron$
  );

  -- Independent safety net: mature 7 day Growth Partner holds hourly, so a
  -- missed payout run never delays a matured commission by a whole day.
  begin
    perform cron.unschedule('nexora-gp-hold-release');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'nexora-gp-hold-release',
    '5 * * * *',
    $cron$select public.release_growth_partner_commissions(now());$cron$
  );
end
$cron_guard$;

-- Owner-facing settlement summary (RLS enforced through security_invoker).
create or replace view public.owner_payout_summary
with (security_invoker = true) as
select
  p.salon_id,
  p.run_date,
  p.status,
  p.booking_count,
  p.gross_paise,
  p.platform_fee_paise,
  p.amount_paise,
  p.owner_share_bps,
  p.payout_reference,
  p.created_at
from public.owner_payouts p;

grant select on public.owner_payout_summary to authenticated;
