-- Nexora locked business rules — part 1 of 3
--
-- Implements the two missing Growth Partner money rules on the trusted server:
--   * Growth Partner earns 10% of the platform fee (platform keeps 10% of the
--     booking, Owner keeps 90%, so the GP share is 1% of the booking value and
--     never reduces the Owner's 90%).
--   * Growth Partner commission is held for 7 days after the booking completes
--     before it becomes payable, and is voided / clawed back on refund,
--     cancellation, no-show or dispute.
--
-- The migration is idempotent and does not assume the exact column names used by
-- the existing bookings/payments schema: booking money is resolved through
-- jsonb key probes so the locked rules keep working across schema revisions.

-- ---------------------------------------------------------------------------
-- 0. Schemas and shared audit log
-- ---------------------------------------------------------------------------

create schema if not exists private;

create table if not exists public.business_rule_events (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null,
  event text not null,
  booking_id uuid,
  severity text not null default 'info' check (severity in ('info', 'warning', 'error')),
  detail text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_rule_events_rule_created_idx
  on public.business_rule_events (rule_id, created_at desc);

create index if not exists business_rule_events_booking_idx
  on public.business_rule_events (booking_id)
  where booking_id is not null;

-- ---------------------------------------------------------------------------
-- 1. Locked revenue rule constants (single row, pinned by check constraint)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_revenue_rules (
  id smallint primary key default 1,
  owner_share_bps integer not null default 9000,
  platform_share_bps integer not null default 1000,
  growth_partner_share_of_platform_bps integer not null default 1000,
  growth_partner_hold_days integer not null default 7,
  advance_share_bps integer not null default 2500,
  final_share_bps integer not null default 7500,
  owner_payout_hour_local integer not null default 22,
  payout_timezone text not null default 'Asia/Kolkata',
  owner_payout_enabled boolean not null default true,
  payout_engine_version text not null default 'v2',
  completion_statuses text[] not null default array['completed', 'service_completed', 'fulfilled', 'closed'],
  void_statuses text[] not null default array['cancelled', 'canceled', 'refunded', 'fully_refunded', 'no_show', 'rejected', 'expired'],
  dispute_statuses text[] not null default array['disputed', 'dispute_open', 'chargeback', 'under_review', 'escalated', 'open', 'raised'],
  payment_hold_statuses text[] not null default array['pending', 'created', 'initiated', 'failed', 'authorized', 'advance_paid', 'partially_paid', 'unpaid', 'awaiting_final'],
  updated_at timestamptz not null default now()
);

do $rules_guard$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'platform_revenue_rules'
      and c.conname = 'platform_revenue_rules_singleton'
  ) then
    alter table public.platform_revenue_rules
      add constraint platform_revenue_rules_singleton check (id = 1);
  end if;

  -- The commercial split is locked. Any attempt to drift the split, the GP
  -- share of platform revenue, the hold window or the payout hour fails here.
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'platform_revenue_rules'
      and c.conname = 'platform_revenue_rules_locked'
  ) then
    alter table public.platform_revenue_rules
      add constraint platform_revenue_rules_locked check (
        owner_share_bps = 9000
        and platform_share_bps = 1000
        and owner_share_bps + platform_share_bps = 10000
        and growth_partner_share_of_platform_bps = 1000
        and growth_partner_hold_days = 7
        and advance_share_bps = 2500
        and final_share_bps = 7500
        and advance_share_bps + final_share_bps = 10000
        and owner_payout_hour_local = 22
        and payout_timezone = 'Asia/Kolkata'
      );
  end if;
end
$rules_guard$;

insert into public.platform_revenue_rules (id)
values (1)
on conflict (id) do update
  set owner_share_bps = 9000,
      platform_share_bps = 1000,
      growth_partner_share_of_platform_bps = 1000,
      growth_partner_hold_days = 7,
      advance_share_bps = 2500,
      final_share_bps = 7500,
      owner_payout_hour_local = 22,
      payout_timezone = 'Asia/Kolkata',
      updated_at = now();

alter table public.platform_revenue_rules enable row level security;
alter table public.business_rule_events enable row level security;

revoke all on table public.platform_revenue_rules from anon, authenticated;
revoke all on table public.business_rule_events from anon, authenticated;
grant select on table public.platform_revenue_rules to authenticated;

drop policy if exists platform_revenue_rules_read on public.platform_revenue_rules;
create policy platform_revenue_rules_read
  on public.platform_revenue_rules
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. Schema-tolerant readers for the existing bookings/payments tables
-- ---------------------------------------------------------------------------

create or replace function private.jsonb_number(p_row jsonb, p_keys text[])
returns numeric
language plpgsql
immutable
set search_path = ''
as $function$
declare
  candidate text;
  value jsonb;
  parsed numeric;
begin
  if p_row is null then return null; end if;
  foreach candidate in array p_keys loop
    value := p_row -> candidate;
    if value is null or jsonb_typeof(value) = 'null' then continue; end if;
    parsed := null;
    begin
      if jsonb_typeof(value) = 'number' then
        parsed := (value #>> '{}')::numeric;
      elsif jsonb_typeof(value) = 'string' then
        parsed := nullif(trim(value #>> '{}'), '')::numeric;
      end if;
    exception when others then
      parsed := null;
    end;
    if parsed is not null then return parsed; end if;
  end loop;
  return null;
end
$function$;

create or replace function private.jsonb_text(p_row jsonb, p_keys text[])
returns text
language plpgsql
immutable
set search_path = ''
as $function$
declare
  candidate text;
  value jsonb;
  parsed text;
begin
  if p_row is null then return null; end if;
  foreach candidate in array p_keys loop
    value := p_row -> candidate;
    if value is null or jsonb_typeof(value) = 'null' then continue; end if;
    parsed := nullif(trim(value #>> '{}'), '');
    if parsed is not null then return parsed; end if;
  end loop;
  return null;
end
$function$;

create or replace function private.jsonb_uuid(p_row jsonb, p_keys text[])
returns uuid
language plpgsql
immutable
set search_path = ''
as $function$
declare
  raw text := private.jsonb_text(p_row, p_keys);
begin
  if raw is null then return null; end if;
  return raw::uuid;
exception when others then
  return null;
end
$function$;

create or replace function private.jsonb_timestamp(p_row jsonb, p_keys text[])
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $function$
declare
  raw text := private.jsonb_text(p_row, p_keys);
begin
  if raw is null then return null; end if;
  return raw::timestamptz;
exception when others then
  return null;
end
$function$;

create or replace function private.jsonb_boolean(p_row jsonb, p_keys text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $function$
declare
  candidate text;
  value jsonb;
begin
  if p_row is null then return null; end if;
  foreach candidate in array p_keys loop
    value := p_row -> candidate;
    if value is null or jsonb_typeof(value) = 'null' then continue; end if;
    if jsonb_typeof(value) = 'boolean' then return (value #>> '{}')::boolean; end if;
  end loop;
  return null;
end
$function$;

-- Resolves the physical column that stores a booking concept, so triggers and
-- payout scans can stay index friendly without hardcoding one schema revision.
create or replace function private.booking_column(p_candidates text[])
returns text
language sql
stable
set search_path = ''
as $function$
  select c.column_name
  from information_schema.columns c
  join unnest(p_candidates) with ordinality as u(name, ord)
    on u.name = c.column_name
  where c.table_schema = 'public'
    and c.table_name = 'bookings'
  order by u.ord
  limit 1
$function$;

-- Canonical money view of one booking row, derived from the locked 90/10 split
-- when the source schema does not persist the split itself.
create or replace function private.booking_money(p_booking jsonb)
returns table (
  booking_id uuid,
  salon_id uuid,
  status text,
  payment_status text,
  dispute_status text,
  completed_at timestamptz,
  gross_paise bigint,
  refunded_paise bigint,
  platform_fee_paise bigint,
  owner_share_paise bigint,
  growth_partner_paise bigint
)
language plpgsql
stable
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  v_gross numeric;
  v_refunded numeric;
  v_platform numeric;
  v_owner numeric;
  v_net_gross numeric;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if not found then
    raise exception 'platform revenue rules are not installed';
  end if;

  booking_id := private.jsonb_uuid(p_booking, array['id', 'booking_id']);
  salon_id := private.jsonb_uuid(p_booking, array['salon_id', 'shop_id', 'business_id']);
  status := lower(coalesce(private.jsonb_text(p_booking, array['status', 'booking_status']), ''));
  payment_status := lower(coalesce(private.jsonb_text(p_booking, array['payment_status', 'payment_state', 'pay_status']), ''));
  dispute_status := lower(coalesce(private.jsonb_text(p_booking, array['dispute_status', 'dispute_state']), ''));
  if private.jsonb_boolean(p_booking, array['is_disputed', 'has_dispute', 'dispute_raised']) then
    dispute_status := 'disputed';
  end if;
  completed_at := coalesce(
    private.jsonb_timestamp(p_booking, array['completed_at', 'service_completed_at', 'fulfilled_at', 'closed_at']),
    private.jsonb_timestamp(p_booking, array['updated_at', 'created_at'])
  );

  v_gross := coalesce(private.jsonb_number(p_booking, array[
    'total_amount_paise', 'total_paise', 'final_amount_paise', 'grand_total_paise',
    'amount_paise', 'total_price_paise', 'booking_amount_paise', 'payable_amount_paise'
  ]), 0);
  v_refunded := coalesce(private.jsonb_number(p_booking, array[
    'refunded_amount_paise', 'refund_amount_paise', 'total_refunded_paise', 'refunded_paise'
  ]), 0);

  v_gross := greatest(v_gross, 0);
  v_refunded := least(greatest(v_refunded, 0), v_gross);
  v_net_gross := v_gross - v_refunded;

  -- Prefer a persisted platform fee; otherwise apply the locked 10% share.
  v_platform := private.jsonb_number(p_booking, array[
    'platform_fee_paise', 'platform_commission_paise', 'platform_share_paise',
    'platform_amount_paise', 'commission_paise'
  ]);
  if v_platform is null then
    v_platform := floor(v_net_gross * rules.platform_share_bps / 10000.0);
  else
    -- Reduce a persisted fee proportionally when part of the booking was refunded.
    v_platform := case
      when v_gross > 0 then floor(greatest(v_platform, 0) * v_net_gross / v_gross)
      else 0
    end;
  end if;
  v_platform := least(greatest(v_platform, 0), v_net_gross);

  -- The Owner always keeps the remainder, so rounding never leaks value and the
  -- Owner's locked 90% is never reduced by the Growth Partner commission.
  v_owner := private.jsonb_number(p_booking, array[
    'owner_earning_paise', 'owner_amount_paise', 'owner_payout_paise', 'owner_share_paise',
    'salon_earning_paise', 'salon_amount_paise', 'shop_earning_paise'
  ]);
  if v_owner is null or v_owner + v_platform > v_net_gross then
    v_owner := v_net_gross - v_platform;
  end if;
  v_owner := greatest(v_owner, 0);

  gross_paise := v_net_gross::bigint;
  refunded_paise := v_refunded::bigint;
  platform_fee_paise := v_platform::bigint;
  owner_share_paise := v_owner::bigint;
  growth_partner_paise := floor(v_platform * rules.growth_partner_share_of_platform_bps / 10000.0)::bigint;
  return next;
end
$function$;

-- ---------------------------------------------------------------------------
-- 3. Growth Partner commission ledger (10% of platform fee, 7 day hold)
-- ---------------------------------------------------------------------------

create table if not exists public.growth_partner_commissions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique,
  growth_partner_id uuid not null references public.growth_partners (id) on delete restrict,
  salon_id uuid not null references public.salons (id) on delete restrict,
  attribution_id uuid,
  booking_gross_paise bigint not null default 0 check (booking_gross_paise >= 0),
  platform_fee_paise bigint not null default 0 check (platform_fee_paise >= 0),
  commission_paise bigint not null default 0 check (commission_paise >= 0),
  commission_rate_bps integer not null default 1000 check (commission_rate_bps = 1000),
  status text not null default 'held'
    check (status in ('held', 'payable', 'paid', 'void', 'clawed_back')),
  hold_days integer not null default 7 check (hold_days = 7),
  accrued_at timestamptz not null default now(),
  completed_at timestamptz,
  hold_until timestamptz not null,
  released_at timestamptz,
  paid_at timestamptz,
  payout_reference text,
  voided_at timestamptz,
  void_reason text,
  source_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The 7 day hold is measured from booking completion, never from the accrual
-- timestamp: a booking completed before this migration (or accrued late by the
-- backfill) is already past its hold and must be payable immediately.
do $hold_window_guard$
begin
  alter table public.growth_partner_commissions
    drop constraint if exists growth_partner_commissions_hold_window;

  alter table public.growth_partner_commissions
    add constraint growth_partner_commissions_hold_window
    check (completed_at is null or hold_until >= completed_at);
end
$hold_window_guard$;

create index if not exists growth_partner_commissions_partner_status_idx
  on public.growth_partner_commissions (growth_partner_id, status, hold_until);

create index if not exists growth_partner_commissions_release_idx
  on public.growth_partner_commissions (hold_until)
  where status = 'held';

create index if not exists growth_partner_commissions_salon_idx
  on public.growth_partner_commissions (salon_id);

-- Link the ledger to bookings only when the bookings table really exists.
do $fk_guard$
begin
  if to_regclass('public.bookings') is not null
     and not exists (
       select 1
       from pg_constraint c
       join pg_class t on t.oid = c.conrelid
       join pg_namespace n on n.oid = t.relnamespace
       where n.nspname = 'public'
         and t.relname = 'growth_partner_commissions'
         and c.conname = 'growth_partner_commissions_booking_fk'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public' and table_name = 'bookings' and column_name = 'id'
     ) then
    begin
      alter table public.growth_partner_commissions
        add constraint growth_partner_commissions_booking_fk
        foreign key (booking_id) references public.bookings (id) on delete cascade;
    exception when others then
      raise notice 'nexora: skipped bookings foreign key on growth_partner_commissions (%).', sqlerrm;
    end;
  end if;
end
$fk_guard$;

alter table public.growth_partner_commissions enable row level security;

revoke all on table public.growth_partner_commissions from anon, authenticated;
grant select on table public.growth_partner_commissions to authenticated;

-- A Growth Partner may read only its own commission rows. Nothing but the
-- trusted server (service_role / definer functions) can write them.
drop policy if exists growth_partner_commissions_owner_read on public.growth_partner_commissions;
create policy growth_partner_commissions_owner_read
  on public.growth_partner_commissions
  for select
  to authenticated
  using (
    growth_partner_id = private.current_growth_partner_id()
    or private.can_manage_salon_settings(salon_id)
  );

create or replace function private.touch_growth_partner_commission()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end
$function$;

drop trigger if exists trg_growth_partner_commissions_touch on public.growth_partner_commissions;
create trigger trg_growth_partner_commissions_touch
  before update on public.growth_partner_commissions
  for each row
  execute function private.touch_growth_partner_commission();

-- ---------------------------------------------------------------------------
-- 4. Accrual: 10% of the platform fee, held for 7 days from completion
-- ---------------------------------------------------------------------------

create or replace function private.accrue_growth_partner_commission(
  p_booking_id uuid,
  p_source text default 'trigger'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  booking jsonb;
  money record;
  partner_id uuid;
  attribution_id uuid;
  existing public.growth_partner_commissions%rowtype;
  completed timestamptz;
  commission_id uuid;
  is_completed boolean;
  is_void boolean;
  is_disputed boolean;
begin
  if p_booking_id is null then return null; end if;
  select * into rules from public.platform_revenue_rules where id = 1;
  if not found then
    raise exception 'platform revenue rules are not installed';
  end if;
  if to_regclass('public.bookings') is null then
    raise exception 'public.bookings is required for Growth Partner commission accrual';
  end if;

  select to_jsonb(b) into booking from public.bookings b where b.id = p_booking_id;
  if booking is null then return null; end if;

  select * into money from private.booking_money(booking);
  select * into existing
  from public.growth_partner_commissions c
  where c.booking_id = p_booking_id
  for update;

  is_completed := money.status = any (rules.completion_statuses);
  is_void := money.status = any (rules.void_statuses);
  is_disputed := money.dispute_status = any (rules.dispute_statuses);

  -- Refund / cancellation / no-show: void the hold, or claw back a paid one.
  if is_void or money.gross_paise = 0 then
    if existing.id is not null then
      update public.growth_partner_commissions
      set status = case when existing.status = 'paid' then 'clawed_back' else 'void' end,
          commission_paise = case when existing.status = 'paid' then existing.commission_paise else 0 end,
          voided_at = now(),
          void_reason = coalesce(nullif(money.status, ''), 'refunded'),
          source_event = p_source
      where id = existing.id;

      insert into public.business_rule_events (rule_id, event, booking_id, severity, detail, context)
      values (
        'gp_commission_10pct_of_platform',
        case when existing.status = 'paid' then 'clawback' else 'void' end,
        p_booking_id,
        'warning',
        format('Growth Partner commission %s because the booking moved to %s.',
               case when existing.status = 'paid' then 'clawed back' else 'voided' end,
               coalesce(nullif(money.status, ''), 'a non-earning state')),
        jsonb_build_object('previous_status', existing.status, 'booking_status', money.status)
      );
    end if;
    return existing.id;
  end if;

  if not is_completed then
    -- Nothing accrues before the booking is completed.
    return existing.id;
  end if;

  if money.salon_id is null then
    insert into public.business_rule_events (rule_id, event, booking_id, severity, detail)
    values ('gp_commission_10pct_of_platform', 'skipped', p_booking_id, 'warning',
            'Booking has no resolvable salon, so no Growth Partner attribution could be applied.');
    return null;
  end if;

  select a.growth_partner_id, a.id
  into partner_id, attribution_id
  from public.shop_attributions a
  where a.salon_id = money.salon_id
    and a.status = 'active'
    and a.effective_until is null
  order by a.effective_from desc nulls last
  limit 1;

  if partner_id is null then
    -- Salon was onboarded without an active Growth Partner: platform keeps 100%
    -- of its 10%. This is a normal, non-error outcome.
    return null;
  end if;

  completed := coalesce(money.completed_at, now());

  insert into public.growth_partner_commissions as c (
    booking_id, growth_partner_id, salon_id, attribution_id,
    booking_gross_paise, platform_fee_paise, commission_paise, commission_rate_bps,
    status, hold_days, accrued_at, completed_at, hold_until, source_event
  )
  values (
    p_booking_id, partner_id, money.salon_id, attribution_id,
    money.gross_paise, money.platform_fee_paise, money.growth_partner_paise,
    rules.growth_partner_share_of_platform_bps,
    'held', rules.growth_partner_hold_days, now(), completed,
    completed + make_interval(days => rules.growth_partner_hold_days),
    p_source
  )
  on conflict (booking_id) do update
    set growth_partner_id = excluded.growth_partner_id,
        salon_id = excluded.salon_id,
        attribution_id = excluded.attribution_id,
        booking_gross_paise = excluded.booking_gross_paise,
        platform_fee_paise = excluded.platform_fee_paise,
        commission_paise = excluded.commission_paise,
        completed_at = excluded.completed_at,
        hold_until = excluded.hold_until,
        status = case when c.status in ('void', 'clawed_back') then 'held' else c.status end,
        voided_at = null,
        void_reason = null,
        source_event = excluded.source_event
    where c.status <> 'paid'
  returning id into commission_id;

  if commission_id is null then
    return existing.id;
  end if;

  if is_disputed then
    update public.growth_partner_commissions
    set hold_until = greatest(hold_until, now() + make_interval(days => rules.growth_partner_hold_days))
    where id = commission_id and status = 'held';
  end if;

  insert into public.business_rule_events (rule_id, event, booking_id, severity, detail, context)
  values (
    'gp_commission_10pct_of_platform', 'accrued', p_booking_id, 'info',
    format('Growth Partner accrued %s paise (10%% of a %s paise platform fee), held until %s.',
           money.growth_partner_paise, money.platform_fee_paise,
           to_char(completed + make_interval(days => rules.growth_partner_hold_days), 'YYYY-MM-DD HH24:MI')),
    jsonb_build_object(
      'growth_partner_id', partner_id,
      'salon_id', money.salon_id,
      'platform_fee_paise', money.platform_fee_paise,
      'commission_paise', money.growth_partner_paise,
      'hold_days', rules.growth_partner_hold_days
    )
  );

  return commission_id;
end
$function$;

-- ---------------------------------------------------------------------------
-- 5. Booking lifecycle trigger (never blocks the booking transaction)
-- ---------------------------------------------------------------------------

create or replace function private.tg_growth_partner_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target uuid := private.jsonb_uuid(to_jsonb(new), array['id', 'booking_id']);
begin
  perform private.accrue_growth_partner_commission(target, 'booking_status_trigger');
  return null;
exception when others then
  insert into public.business_rule_events (rule_id, event, booking_id, severity, detail)
  values ('gp_commission_10pct_of_platform', 'error', target, 'error', sqlerrm);
  return null;
end
$function$;

do $trigger_guard$
declare
  status_col text;
begin
  if to_regclass('public.bookings') is null then
    raise notice 'nexora: public.bookings not found, Growth Partner accrual trigger was not installed.';
    return;
  end if;

  select private.booking_column(array['status', 'booking_status']) into status_col;
  if status_col is null then
    raise notice 'nexora: no status column on public.bookings, Growth Partner accrual trigger was not installed.';
    return;
  end if;

  execute 'drop trigger if exists trg_nexora_growth_partner_commission on public.bookings';
  execute format(
    'create trigger trg_nexora_growth_partner_commission '
    'after update of %1$I on public.bookings '
    'for each row when (old.%1$I is distinct from new.%1$I) '
    'execute function private.tg_growth_partner_commission()',
    status_col
  );

  -- Bookings imported or migrated in an already-completed state still accrue.
  execute 'drop trigger if exists trg_nexora_growth_partner_commission_insert on public.bookings';
  execute format(
    'create trigger trg_nexora_growth_partner_commission_insert '
    'after insert on public.bookings '
    'for each row when (new.%1$I is not null) '
    'execute function private.tg_growth_partner_commission()',
    status_col
  );
end
$trigger_guard$;

-- ---------------------------------------------------------------------------
-- 6. Hold release (7 days) and payout marking
-- ---------------------------------------------------------------------------

create or replace function public.release_growth_partner_commissions(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  released integer := 0;
begin
  with matured as (
    update public.growth_partner_commissions c
    set status = 'payable',
        released_at = p_now
    where c.status = 'held'
      and c.hold_until <= p_now
      and c.commission_paise > 0
    returning c.id
  )
  select count(*) into released from matured;

  if released > 0 then
    insert into public.business_rule_events (rule_id, event, severity, detail, context)
    values ('gp_hold_7_days', 'released', 'info',
            format('%s Growth Partner commission(s) completed the locked 7 day hold.', released),
            jsonb_build_object('released', released, 'as_of', p_now));
  end if;

  return released;
end
$function$;

create or replace function public.mark_growth_partner_commissions_paid(
  p_commission_ids uuid[],
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
    update public.growth_partner_commissions c
    set status = 'paid',
        paid_at = now(),
        payout_reference = nullif(trim(coalesce(p_reference, '')), '')
    where c.id = any (p_commission_ids)
      and c.status = 'payable'
    returning c.id
  )
  select count(*) into paid from settled;

  return paid;
end
$function$;

-- Backfill helper for bookings completed before this migration.
create or replace function public.backfill_growth_partner_commissions(
  p_limit integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  status_col text;
  statement text;
  candidate record;
  processed integer := 0;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if to_regclass('public.bookings') is null then
    raise exception 'public.bookings is required for the Growth Partner backfill';
  end if;

  select private.booking_column(array['status', 'booking_status']) into status_col;
  if status_col is null then
    raise exception 'no status column found on public.bookings';
  end if;

  statement := format(
    'select b.id from public.bookings b '
    'left join public.growth_partner_commissions c on c.booking_id = b.id '
    'where c.booking_id is null and lower(coalesce(b.%I::text, '''')) = any($1) limit $2',
    status_col
  );

  for candidate in execute statement using rules.completion_statuses, greatest(p_limit, 0) loop
    perform private.accrue_growth_partner_commission(candidate.id, 'backfill');
    processed := processed + 1;
  end loop;

  return processed;
end
$function$;

revoke all on function public.release_growth_partner_commissions(timestamptz) from public, anon, authenticated;
revoke all on function public.mark_growth_partner_commissions_paid(uuid[], text) from public, anon, authenticated;
revoke all on function public.backfill_growth_partner_commissions(integer) from public, anon, authenticated;
grant execute on function public.release_growth_partner_commissions(timestamptz) to service_role;
grant execute on function public.mark_growth_partner_commissions_paid(uuid[], text) to service_role;
grant execute on function public.backfill_growth_partner_commissions(integer) to service_role;

-- Read-only summary for the Growth Partner dashboard. security_invoker keeps the
-- caller's RLS in force, so a partner can only ever total its own rows.
create or replace view public.growth_partner_commission_summary
with (security_invoker = true) as
select
  c.growth_partner_id,
  count(*) filter (where c.status = 'held') as held_count,
  coalesce(sum(c.commission_paise) filter (where c.status = 'held'), 0) as held_paise,
  min(c.hold_until) filter (where c.status = 'held') as next_release_at,
  count(*) filter (where c.status = 'payable') as payable_count,
  coalesce(sum(c.commission_paise) filter (where c.status = 'payable'), 0) as payable_paise,
  coalesce(sum(c.commission_paise) filter (where c.status = 'paid'), 0) as paid_paise
from public.growth_partner_commissions c
group by c.growth_partner_id;

grant select on public.growth_partner_commission_summary to authenticated;
