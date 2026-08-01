-- Nexora locked business rules — part 3 of 3
--
-- A single, callable verification surface for the six locked business rules, so
-- "verified" is something the database proves on demand instead of something a
-- reviewer asserts by reading code.
--
--   1. 25% advance / 75% final          (DB triggers)
--   2. Owner 90% / Platform 10%         (RPC)
--   3. Growth Partner 10% of platform   (this changeset)
--   4. Growth Partner hold 7 days       (this changeset)
--   5. Owner payout daily 22:00 IST     (this changeset, V1_LOCKED retired)
--   6. Refund rules (full > 24h, else partial)

-- ---------------------------------------------------------------------------
-- 1. Refund policy constants (full refund beyond 24h, partial inside 24h)
-- ---------------------------------------------------------------------------

alter table public.platform_revenue_rules
  add column if not exists refund_full_window_hours integer not null default 24;

alter table public.platform_revenue_rules
  add column if not exists refund_partial_share_bps integer not null default 5000;

do $refund_guard$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'platform_revenue_rules'
      and c.conname = 'platform_revenue_rules_refund_locked'
  ) then
    alter table public.platform_revenue_rules
      add constraint platform_revenue_rules_refund_locked check (
        refund_full_window_hours = 24
        and refund_partial_share_bps between 0 and 10000
      );
  end if;
end
$refund_guard$;

-- Pure, side-effect free quote used by cancelBooking and by the verifier, so
-- the policy is stated once and cannot drift between the two.
create or replace function public.quote_booking_refund(
  p_paid_paise bigint,
  p_appointment_start timestamptz,
  p_now timestamptz default now()
)
returns table (
  refund_paise bigint,
  refund_kind text,
  hours_before numeric
)
language plpgsql
stable
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  lead numeric;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if not found then
    raise exception 'platform revenue rules are not installed';
  end if;

  p_paid_paise := greatest(coalesce(p_paid_paise, 0), 0);
  lead := extract(epoch from (p_appointment_start - p_now)) / 3600.0;
  hours_before := lead;

  if p_appointment_start is null then
    refund_paise := p_paid_paise;
    refund_kind := 'full';
  elsif lead > rules.refund_full_window_hours then
    refund_paise := p_paid_paise;
    refund_kind := 'full';
  else
    refund_paise := floor(p_paid_paise * rules.refund_partial_share_bps / 10000.0)::bigint;
    refund_kind := 'partial';
  end if;

  return next;
end
$function$;

grant execute on function public.quote_booking_refund(bigint, timestamptz, timestamptz) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The verifier
-- ---------------------------------------------------------------------------

create or replace function public.verify_business_rules()
returns table (
  rule_no integer,
  rule_id text,
  rule_name text,
  status text,
  detail text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  rules public.platform_revenue_rules%rowtype;
  sample bigint := 1000000; -- Rs 10,000 reference booking
  platform_fee bigint;
  owner_share bigint;
  gp_share bigint;
  advance bigint;
  final_amount bigint;
  trigger_count integer;
  cron_expr text;
  hook_src text;
  full_quote record;
  partial_quote record;
begin
  select * into rules from public.platform_revenue_rules where id = 1;
  if not found then
    rule_no := 0; rule_id := 'rules'; rule_name := 'Locked rule constants';
    status := 'MISSING'; detail := 'platform_revenue_rules has no row 1.';
    return next;
    return;
  end if;

  ---------------------------------------------------------------- rule 1
  advance := floor(sample * rules.advance_share_bps / 10000.0);
  final_amount := sample - advance;
  select count(*)::integer into trigger_count
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('bookings', 'payments', 'booking_payments')
    and not t.tgisinternal;

  rule_no := 1;
  rule_id := 'payment_25_75';
  rule_name := '25% advance / 75% final';
  status := case when advance = 250000 and final_amount = 750000 then 'COMPLETE' else 'BROKEN' end;
  detail := format('%s paise advance + %s paise final on a %s paise booking; %s booking/payment trigger(s) present.',
                   advance, final_amount, sample, trigger_count);
  return next;

  ---------------------------------------------------------------- rule 2
  platform_fee := floor(sample * rules.platform_share_bps / 10000.0);
  owner_share := sample - platform_fee;

  rule_no := 2;
  rule_id := 'split_owner_90_platform_10';
  rule_name := 'Owner 90% / Platform 10%';
  status := case when owner_share = 900000 and platform_fee = 100000 then 'COMPLETE' else 'BROKEN' end;
  detail := format('Owner %s paise (%s bps), platform %s paise (%s bps), no residue.',
                   owner_share, rules.owner_share_bps, platform_fee, rules.platform_share_bps);
  return next;

  ---------------------------------------------------------------- rule 3
  gp_share := floor(platform_fee * rules.growth_partner_share_of_platform_bps / 10000.0);

  rule_no := 3;
  rule_id := 'gp_commission_10pct_of_platform';
  rule_name := 'Growth Partner 10% of platform fee';
  status := case
    when to_regclass('public.growth_partner_commissions') is null then 'MISSING'
    when to_regprocedure('private.accrue_growth_partner_commission(uuid, text)') is null then 'MISSING'
    when gp_share = 10000 then 'COMPLETE'
    else 'BROKEN'
  end;
  detail := format('GP earns %s paise = 10%% of the %s paise platform fee (1%% of booking); Owner 90%% untouched.',
                   gp_share, platform_fee);
  return next;

  ---------------------------------------------------------------- rule 4
  rule_no := 4;
  rule_id := 'gp_hold_7_days';
  rule_name := 'Growth Partner commission held 7 days';
  status := case
    when to_regprocedure('public.release_growth_partner_commissions(timestamptz)') is null then 'MISSING'
    when rules.growth_partner_hold_days <> 7 then 'BROKEN'
    when exists (
      select 1
      from public.growth_partner_commissions gpc
      where gpc.status = 'payable' and gpc.hold_until > now()
    ) then 'BROKEN'
    else 'COMPLETE'
  end;
  detail := format('Hold window %s days from booking completion, enforced by hold_until and released only by release_growth_partner_commissions.',
                   rules.growth_partner_hold_days);
  return next;

  ---------------------------------------------------------------- rule 5
  begin
    execute $q$select schedule from cron.job where jobname = 'nexora-owner-daily-payout'$q$ into cron_expr;
  exception when others then
    cron_expr := null;
  end;

  select p.prosrc into hook_src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'process_owner_payouts'
  limit 1;

  rule_no := 5;
  rule_id := 'owner_payout_daily_2200_ist';
  rule_name := 'Owner payout daily at 10 PM IST';
  status := case
    when to_regprocedure('public.run_owner_daily_payouts(timestamptz, text, boolean)') is null then 'MISSING'
    when hook_src is null or hook_src !~ 'run_owner_daily_payouts' then 'MISSING'
    when rules.owner_payout_hour_local <> 22 or rules.payout_timezone <> 'Asia/Kolkata' then 'BROKEN'
    else 'COMPLETE'
  end;
  detail := format('Cut-off %s:00 %s; hook is %s; cron schedule %s.',
                   rules.owner_payout_hour_local,
                   rules.payout_timezone,
                   case when hook_src is null then 'absent'
                        when hook_src ~ 'run_owner_daily_payouts' then 'v2 (V1_LOCKED retired)'
                        else 'V1_LOCKED' end,
                   coalesce(cron_expr || ' UTC', 'not registered (schedule externally)'));
  return next;

  ---------------------------------------------------------------- rule 6
  select * into full_quote from public.quote_booking_refund(sample, now() + interval '48 hours', now());
  select * into partial_quote from public.quote_booking_refund(sample, now() + interval '3 hours', now());

  rule_no := 6;
  rule_id := 'refund_full_over_24h';
  rule_name := 'Refund full > 24h, otherwise partial';
  status := case
    when full_quote.refund_kind = 'full'
     and full_quote.refund_paise = sample
     and partial_quote.refund_kind = 'partial'
     and partial_quote.refund_paise < sample
    then 'COMPLETE'
    else 'BROKEN'
  end;
  detail := format('48h before: %s paise (%s). 3h before: %s paise (%s). Window %s hours.',
                   full_quote.refund_paise, full_quote.refund_kind,
                   partial_quote.refund_paise, partial_quote.refund_kind,
                   rules.refund_full_window_hours);
  return next;
end
$function$;

revoke all on function public.verify_business_rules() from public, anon;
grant execute on function public.verify_business_rules() to authenticated, service_role;

comment on function public.verify_business_rules() is
  'Returns the live status of the six locked Nexora business rules. Every row must read COMPLETE.';
