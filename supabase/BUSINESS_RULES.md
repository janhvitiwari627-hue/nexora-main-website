# Nexora Locked Business Rules

Status of the six locked rules after the `20260801_*` changeset.

| # | Rule | Status | Enforced by |
|---|------|--------|-------------|
| 1 | 25% advance / 75% final | COMPLETE (pre-existing) | DB triggers on the payment flow |
| 2 | Owner 90% / Platform 10% | COMPLETE (pre-existing) | Settlement RPC |
| 3 | Growth Partner 10% of platform fee | **COMPLETE (new)** | `private.accrue_growth_partner_commission` + booking triggers |
| 4 | GP commission held 7 days | **COMPLETE (new)** | `hold_until` column + `public.release_growth_partner_commissions` |
| 5 | Owner payout daily 10 PM | **COMPLETE (new)** | `public.run_owner_daily_payouts` on pg_cron `30 16 * * *` UTC |
| 6 | Refund full > 24h, else partial | COMPLETE (pre-existing) | `cancelBooking`, now also quoted by `public.quote_booking_refund` |

Run this at any time — every row must read `COMPLETE`:

```sql
select * from public.verify_business_rules();
```

## Migrations in this changeset

1. `20260801_growth_partner_commission_and_hold.sql` — locked constants, the GP
   commission ledger, accrual triggers, and the 7 day hold.
2. `20260801_owner_daily_payout_2200_ist.sql` — payout runs/items, eligibility,
   the 22:00 IST schedule, and retirement of the `V1_LOCKED` hook.
3. `20260801_business_rules_verification.sql` — refund quote helper and the
   `verify_business_rules()` self-test.

All three are idempotent and safe to re-apply.

## Rule 3 — Growth Partner earns 10% of the platform fee

On a ₹10,000 booking:

```
booking gross      1,000,000 paise
platform fee  10%    100,000 paise
owner share   90%    900,000 paise   <- never reduced by the GP commission
GP commission 10% of platform fee = 10,000 paise (1% of the booking)
platform net         90,000 paise
```

- Commission is written to `public.growth_partner_commissions`, one row per
  booking (`booking_id` is unique), attributed through the **active**
  `shop_attributions` row for the salon.
- The Owner takes the rounding remainder (`owner = gross - platform_fee`), so a
  booking never leaks value. Verified at 99,999 paise: 9,999 + 90,000 = 99,999.
- A salon with no active Growth Partner simply accrues nothing; the platform
  keeps its full 10%. That is a normal outcome, not an error.
- `commission_rate_bps` is constrained to `1000`, so a row storing any other
  rate cannot be inserted.

## Rule 4 — 7 day hold

- `hold_until = completed_at + 7 days`, and `hold_days` is constrained to `7`.
- The hold is anchored to **booking completion**, not to the accrual timestamp,
  so a backfilled or late-accrued booking is not punished with a fresh 7 days.
- Only `public.release_growth_partner_commissions(now())` flips `held` to
  `payable`, and only when `hold_until <= now()`. It runs hourly on pg_cron
  (`5 * * * *`) and again inside every payout run.
- Refund / cancellation / no-show voids a held commission; if it was already
  paid it becomes `clawed_back`. An open dispute pushes `hold_until` out by
  another 7 days.

## Rule 5 — Owner payout daily at 10 PM IST

- `public.run_owner_daily_payouts(p_as_of, p_source, p_force)` refuses to settle
  before 22:00 `Asia/Kolkata` unless `p_force` is true.
- Scheduled with pg_cron as `30 16 * * *` UTC. India observes no daylight
  saving, so 16:30 UTC is 22:00 IST year round.
- Idempotent per local payout day: `owner_payout_runs.run_date` is unique, a
  completed run short-circuits, and `owner_payout_items.booking_id` is unique so
  a booking can never be paid twice.
- Eligibility excludes anything refunded, disputed, or not fully collected
  (a booking sitting on `advance_paid` is not settled).
- The old `V1_LOCKED` hook is **replaced, not deleted**: `process_owner_payouts`
  still exists and now delegates to the v2 engine, so existing callers keep
  working. The prior definition is recorded in `business_rule_events`.

## Operating the payout

```sql
-- Dry run outside the window (returns null, logs 'too_early'):
select public.run_owner_daily_payouts(now(), 'manual', false);

-- Force a catch-up run for today:
select public.run_owner_daily_payouts(now(), 'manual', true);

-- Backfill commissions for bookings completed before this changeset:
select public.backfill_growth_partner_commissions(5000);

-- Mark a batch settled once the payment provider confirms:
select public.mark_owner_payouts_paid(array['<payout-id>']::uuid[], 'utr-123');
select public.mark_growth_partner_commissions_paid(array['<commission-id>']::uuid[], 'utr-124');
```

## Security posture

- Every ledger table has RLS on, and `anon` / `authenticated` are revoked from
  all writes. Only definer functions and `service_role` write money rows.
- A Growth Partner reads only its own commissions; an Owner reads only payouts
  for a salon they manage (`private.can_manage_salon_settings`).
- Both reporting views use `security_invoker = true`, so totals cannot be used
  to read around RLS.
- Every function pins `set search_path = ''`.
- No credentials appear in any migration; the frontend continues to use only the
  public anon key.

## Deployment notes

- `pg_cron` must be available. If it is not, the migration logs a notice and
  the schedule must be created externally (Edge Function or external cron)
  calling `run_owner_daily_payouts` at 22:00 IST. `verify_business_rules()`
  reports `not registered (schedule externally)` in that case.
- The booking money reader probes column names (`total_amount_paise`,
  `platform_fee_paise`, `completed_at`, …) rather than hardcoding one schema
  revision. If the live `bookings` table uses different names, add them to the
  candidate arrays in `private.booking_money`.
- Confirm the accrual trigger attached after deploy:

```sql
select tgname from pg_trigger
where tgrelid = 'public.bookings'::regclass and not tgisinternal;
```

- The migrations were executed end to end against a real PostgreSQL instance
  (PGlite) with a stand-in schema, covering: accrual on completion, the exact
  7 day hold, refund void, payout refusal before the cut-off, payout idempotency
  on re-run, exclusion of refunded/disputed/advance-only bookings, rounding at
  odd amounts, and the drift constraints on all locked constants.
