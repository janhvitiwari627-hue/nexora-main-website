import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const growthPartnerRules = await readFile(
  new URL("../supabase/migrations/20260801_growth_partner_commission_and_hold.sql", import.meta.url),
  "utf8",
);
const ownerPayoutRules = await readFile(
  new URL("../supabase/migrations/20260801_owner_daily_payout_2200_ist.sql", import.meta.url),
  "utf8",
);
const verification = await readFile(
  new URL("../supabase/migrations/20260801_business_rules_verification.sql", import.meta.url),
  "utf8",
);

// Rule 3 — Growth Partner earns 10% of the platform fee.
test("Growth Partner commission is 10% of the platform fee and never touches the Owner 90%", () => {
  assert.match(growthPartnerRules, /growth_partner_share_of_platform_bps integer not null default 1000/);
  assert.match(growthPartnerRules, /owner_share_bps = 9000/);
  assert.match(growthPartnerRules, /platform_share_bps = 1000/);
  assert.match(growthPartnerRules, /owner_share_bps \+ platform_share_bps = 10000/);
  assert.match(growthPartnerRules, /growth_partner_share_of_platform_bps = 1000/);
  // The GP share is derived from the platform fee, not from the booking total.
  assert.match(
    growthPartnerRules,
    /growth_partner_paise := floor\(v_platform \* rules\.growth_partner_share_of_platform_bps \/ 10000\.0\)/,
  );
  // The Owner takes the rounding remainder, so no value leaks out of a booking.
  assert.match(growthPartnerRules, /v_owner := v_net_gross - v_platform/);
  assert.match(growthPartnerRules, /commission_rate_bps integer not null default 1000 check \(commission_rate_bps = 1000\)/);
});

test("Growth Partner commission accrues from the active attribution on completion only", () => {
  assert.match(growthPartnerRules, /create table if not exists public\.growth_partner_commissions/);
  assert.match(growthPartnerRules, /booking_id uuid not null unique/);
  assert.match(growthPartnerRules, /from public\.shop_attributions a[\s\S]*?a\.status = 'active'[\s\S]*?a\.effective_until is null/);
  assert.match(growthPartnerRules, /if not is_completed then[\s\S]*?return existing\.id/);
  assert.match(growthPartnerRules, /create trigger trg_nexora_growth_partner_commission /);
  assert.match(growthPartnerRules, /create trigger trg_nexora_growth_partner_commission_insert /);
});

// Rule 4 — the commission is held for 7 days.
test("Growth Partner commission is held for exactly 7 days from completion", () => {
  assert.match(growthPartnerRules, /growth_partner_hold_days integer not null default 7/);
  assert.match(growthPartnerRules, /growth_partner_hold_days = 7/);
  assert.match(growthPartnerRules, /hold_days integer not null default 7 check \(hold_days = 7\)/);
  assert.match(growthPartnerRules, /completed \+ make_interval\(days => rules\.growth_partner_hold_days\)/);
  // The hold is anchored to completion, so a late accrual is not re-held.
  assert.match(growthPartnerRules, /check \(completed_at is null or hold_until >= completed_at\)/);
  assert.match(
    growthPartnerRules,
    /update public\.growth_partner_commissions c[\s\S]*?set status = 'payable'[\s\S]*?where c\.status = 'held'[\s\S]*?c\.hold_until <= p_now/,
  );
});

test("refund, cancellation and dispute unwind or extend the Growth Partner hold", () => {
  assert.match(growthPartnerRules, /void_statuses text\[\] not null default array\['cancelled'/);
  assert.match(growthPartnerRules, /status = case when existing\.status = 'paid' then 'clawed_back' else 'void' end/);
  assert.match(growthPartnerRules, /if is_disputed then[\s\S]*?hold_until = greatest\(hold_until, now\(\) \+ make_interval\(days => rules\.growth_partner_hold_days\)\)/);
});

test("commission ledger is server-owned and readable only by its Growth Partner", () => {
  assert.match(growthPartnerRules, /alter table public\.growth_partner_commissions enable row level security/);
  assert.match(growthPartnerRules, /revoke all on table public\.growth_partner_commissions from anon, authenticated/);
  assert.match(growthPartnerRules, /growth_partner_id = private\.current_growth_partner_id\(\)/);
  assert.doesNotMatch(growthPartnerRules, /grant (insert|update|delete)[\s\S]{0,80}growth_partner_commissions to authenticated/);
  assert.match(growthPartnerRules, /security_invoker = true/);
});

// Rule 5 — Owner payout runs daily at 22:00 IST and the V1 hook is retired.
test("Owner payout is scheduled daily at 22:00 Asia/Kolkata", () => {
  // The cut-off itself is a locked constant, so it lives with the other constants.
  assert.match(growthPartnerRules, /owner_payout_hour_local integer not null default 22/);
  assert.match(growthPartnerRules, /owner_payout_hour_local = 22/);
  assert.match(growthPartnerRules, /payout_timezone = 'Asia\/Kolkata'/);
  // 22:00 IST is 16:30 UTC, and India runs no daylight saving.
  assert.match(ownerPayoutRules, /'nexora-owner-daily-payout',\s*'30 16 \* \* \*'/);
  assert.match(ownerPayoutRules, /make_interval\(hours => rules\.owner_payout_hour_local\)/);
  assert.match(ownerPayoutRules, /if p_as_of < scheduled and not p_force then/);
});

test("the V1_LOCKED payout hook is superseded by a live v2 implementation", () => {
  assert.match(ownerPayoutRules, /v1_hook_superseded/);
  assert.match(ownerPayoutRules, /create or replace function public\.process_owner_payouts/);
  assert.match(ownerPayoutRules, /select public\.run_owner_daily_payouts\(p_as_of, 'process_owner_payouts', false\)/);
  assert.match(ownerPayoutRules, /Unlocked from V1_LOCKED on 2026-08-01/);
  assert.match(growthPartnerRules, /payout_engine_version text not null default 'v2'/);
  assert.match(ownerPayoutRules, /engine_version text not null default 'v2'/);
});

test("a payout run is idempotent per local payout day", () => {
  assert.match(ownerPayoutRules, /constraint owner_payout_runs_unique_day unique \(run_date\)/);
  assert.match(ownerPayoutRules, /constraint owner_payouts_unique_salon_per_run unique \(run_id, salon_id\)/);
  assert.match(ownerPayoutRules, /constraint owner_payout_items_unique_booking unique \(booking_id\)/);
  assert.match(ownerPayoutRules, /on conflict \(run_date\) do nothing/);
  assert.match(ownerPayoutRules, /if run\.status = 'completed' and not p_force then\s*return run;/);
  assert.match(ownerPayoutRules, /on conflict \(booking_id\) do nothing/);
});

test("only clean, fully collected bookings are settled at the locked 90%", () => {
  assert.match(ownerPayoutRules, /continue when money\.refunded_paise > 0/);
  assert.match(ownerPayoutRules, /continue when money\.dispute_status = any \(rules\.dispute_statuses\)/);
  assert.match(ownerPayoutRules, /continue when money\.payment_status = any \(rules\.payment_hold_statuses\)/);
  assert.match(ownerPayoutRules, /owner_share_bps integer not null default 9000 check \(owner_share_bps = 9000\)/);
  // The nightly pass also matures Growth Partner holds.
  assert.match(ownerPayoutRules, /perform public\.release_growth_partner_commissions\(p_as_of\)/);
});

test("payout tables are server-written and Owner-readable only for their own salon", () => {
  for (const table of ["owner_payout_runs", "owner_payouts", "owner_payout_items"]) {
    assert.match(ownerPayoutRules, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(ownerPayoutRules, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`));
  }
  assert.match(ownerPayoutRules, /using \(private\.can_manage_salon_settings\(salon_id\)\)/);
  assert.match(ownerPayoutRules, /grant execute on function public\.run_owner_daily_payouts\(timestamptz, text, boolean\) to service_role/);
  assert.doesNotMatch(ownerPayoutRules, /grant execute on function public\.run_owner_daily_payouts[^\n]*to authenticated/);
});

// Rule 6 — refund policy is stated once, on the server.
test("refund policy is full beyond 24 hours and partial inside the window", () => {
  assert.match(verification, /refund_full_window_hours integer not null default 24/);
  assert.match(verification, /refund_full_window_hours = 24/);
  assert.match(verification, /lead > rules\.refund_full_window_hours/);
  assert.match(verification, /refund_kind := 'full'/);
  assert.match(verification, /refund_kind := 'partial'/);
  assert.match(verification, /floor\(p_paid_paise \* rules\.refund_partial_share_bps \/ 10000\.0\)/);
});

// All six rules must be provable from the database itself.
test("every locked business rule is verifiable through verify_business_rules", () => {
  assert.match(verification, /create or replace function public\.verify_business_rules\(\)/);
  for (const ruleId of [
    "payment_25_75",
    "split_owner_90_platform_10",
    "gp_commission_10pct_of_platform",
    "gp_hold_7_days",
    "owner_payout_daily_2200_ist",
    "refund_full_over_24h",
  ]) {
    assert.match(verification, new RegExp(`'${ruleId}'`));
  }
  assert.match(verification, /status := case[\s\S]*?then 'MISSING'/);
  assert.match(verification, /grant execute on function public\.verify_business_rules\(\) to authenticated, service_role/);
});

test("locked constants cannot drift without failing a check constraint", () => {
  assert.match(growthPartnerRules, /constraint platform_revenue_rules_locked check \(/);
  assert.match(growthPartnerRules, /advance_share_bps = 2500/);
  assert.match(growthPartnerRules, /final_share_bps = 7500/);
  assert.match(growthPartnerRules, /advance_share_bps \+ final_share_bps = 10000/);
  assert.match(verification, /constraint platform_revenue_rules_refund_locked check \(/);
});

test("business rule changes are auditable", () => {
  assert.match(growthPartnerRules, /create table if not exists public\.business_rule_events/);
  assert.match(growthPartnerRules, /insert into public\.business_rule_events[\s\S]*?'accrued'/);
  assert.match(ownerPayoutRules, /insert into public\.business_rule_events[\s\S]*?'completed'/);
});

test("money helpers stay schema tolerant and never trust the client", () => {
  // Money is resolved from the booking row on the server, in paise, as integers.
  assert.match(growthPartnerRules, /create or replace function private\.booking_money/);
  assert.match(growthPartnerRules, /'total_amount_paise', 'total_paise', 'final_amount_paise'/);
  for (const sql of [growthPartnerRules, ownerPayoutRules, verification]) {
    // No embedded credentials, and every definer function pins its search_path.
    assert.doesNotMatch(sql, /SUPABASE_SERVICE|service_role_key|sk_live|rzp_live/i);
    assert.match(sql, /set search_path = ''/);
  }
});
