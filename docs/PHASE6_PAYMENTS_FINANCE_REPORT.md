# PHASE 6 — PAYMENTS & FINANCIAL ENGINE REPORT

**Date:** 2026-08-25  
**Architect Role:** Senior Database + Full-Stack Architect  
**Ecosystem:** Nexora Multi-App Ecosystem  
**Target Supabase Instance:** `https://qwaehqsmodekbgvnaavz.supabase.co`  
**Phase Status:** **PHASE 6 COMPLETE (PASSED)**

---

## 1. EXECUTIVE SUMMARY

Phase 6 verifies and finalizes the **Payments & Financial Engine** across the Nexora platform. Money state transitions are strictly server-authoritative and backed by HMAC signature verification from Razorpay webhooks. The system enforces the locked six business rules, integer minor unit (paise) math, daily 22:00 IST owner settlements, and 7-day Growth Partner commission maturation holds.

---

## 2. THE SIX LOCKED BUSINESS RULES & FINANCIAL ENGINE

### Rule 1: 25% Advance / 75% Due Booking Structure
- **Formula:** `advance_paise = ceil(total_paise / 4)` (`advance_share_bps = 2500`).
- **Balance Due:** `remaining_paise = total_paise - advance_paise`.
- **Integrity Constraint:** Direct client booking inserts cannot specify custom price or advance values. Calculated exclusively in `create_authoritative_customer_booking()`.

### Rule 2: 90/10 Revenue Split
- **Salon Owner Share:** 90% of gross booking (`owner_share_bps = 9000`).
- **Platform Fee:** 10% of gross booking (`platform_share_bps = 1000`).
- **Zero Residue:** `owner_share_paise + platform_fee_paise = booking_gross_paise`.

### Rule 3: Growth Partner 10% Platform Revenue Commission
- **GP Share:** 10% of Nexora's platform fee (`growth_partner_share_of_platform_bps = 1000`).
- **Gross Equivalent:** 1% of the total booking gross amount.
- **Owner Protection:** The GP commission is paid strictly out of platform revenue; the Salon Owner's 90% share is never reduced.

### Rule 4: 7-Day Growth Partner Commission Maturation Hold
- **Accrual:** Accrues in `public.growth_partner_commissions` on booking completion with `status = 'held'`.
- **Maturation:** `hold_days = 7`, `hold_until = accrued_at + interval '7 days'`.
- **Release:** Automated pg_cron runner executes `release_growth_partner_commissions()` to advance matured rows to `status = 'payable'`.

### Rule 5: Daily Salon Owner Settlements at 22:00 IST
- **Schedule:** Daily at 22:00 Asia/Kolkata (`16:30 UTC`, cron `30 16 * * *`).
- **Settlement RPC:** `run_owner_daily_payouts(p_run_at, p_timezone, p_dry_run)`.
- **Ledger Entries:** Generates records in `public.owner_payout_runs`, `public.owner_payouts`, and `public.owner_payout_items`.
- **Idempotency:** Exactly one payout run per calendar day per salon.

### Rule 6: Refund Policy Engine
- **Quote RPC:** `quote_booking_refund(p_paid_paise, p_appointment_start, p_now)`.
- **Full Window (> 24 Hours):** 100% full refund (`refund_kind = 'full'`).
- **Inside Window (< 24 Hours):** 50% partial refund (`refund_kind = 'partial'`).

---

## 3. SERVER-AUTHORITATIVE RAZORPAY INTEGRATION

1. **Order Creation:** `record_razorpay_order()` locks the booking quote and generates a verified Razorpay order in `public.payment_orders`.
2. **Signature Verification:** Edge Functions verify `X-Razorpay-Signature` using server-only HMAC secrets before calling `confirm_verified_razorpay_payment()`.
3. **Webhook Ingestion & Idempotency:** `ingest_verified_payment_webhook()` records raw payloads in `public.payment_webhook_events` and transitions payment records atomically via `process_payment_webhook()`.
4. **Client Privilege Revocation:** Direct client `INSERT` / `UPDATE` on `payment_orders`, `payments`, and `growth_partner_commissions` is completely revoked.

---

## 4. VERIFICATION EVIDENCE & TEST SUITE

Executed Phase 6 financial contract tests:
```bash
node --test tests/phase6-payments-finance.test.mjs tests/business-rules-contract.test.mjs
```

**Results:**
- `Phase 6.1: Server-authoritative Razorpay orders/payments schema` — **PASS**
- `Phase 6.2: Razorpay server-only verification and confirmation RPCs` — **PASS**
- `Phase 6.3: 25% fixed advance calculation math is strictly enforced in SQL` — **PASS**
- `Phase 6.4: Owner daily payouts scheduled at 22:00 IST with 90% settlement` — **PASS**
- `Phase 6.5: Growth Partner 10% commission and 7-day maturation hold` — **PASS**
- `Phase 6.6: Refund policy engine quotes 100% full or 50% partial based on 24h window` — **PASS**
- `Business rules contract suite (15/15)` — **PASS**

**Total: 21/21 tests PASSED.**

---

## 5. EXIT SIGN-OFF

```text
PHASE 6 EXIT GATE: PASSED
```

The Payments & Financial Engine is fully server-authoritative, idempotent, and verified against all platform financial invariants.
