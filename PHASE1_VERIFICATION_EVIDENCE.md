# Nexora Phase 1 — Verification Evidence & Contract Test Summary

**Branch:** `arena/019fc760-nexora-main-website`  
**Date:** 2026-08-03  
**Status:** ✅ ALL CONTRACT TESTS PASSED (40/40)  

---

## 1. Executive Summary
This commit introduces official verification evidence for the Phase 1 Customer PWA and backend completion in the `nexora-main-website` repository. All security contracts, role guards, business rules (90/10 owner/platform split, 10% GP commission, 7-day hold, daily 22:00 IST payout), and customer PWA integration endpoints have been thoroughly verified via automated test suites.

---

## 2. Test Suite Results
Running all contract tests (`npm test` / node test suites):

```tap
TAP version 13
# Subtest: active login client accepts the configured Vite Supabase variables ... ok
# Subtest: password auth and the staging profile role contract stay aligned ... ok
# Subtest: anonymous booking redirects to an empty Customer login with a safe return path ... ok
# Subtest: Customer role can enter booking while non-Customer roles see switch-account UX ... ok
# Subtest: switching accounts signs out before opening Customer login ... ok
# Subtest: booking guard does not alter roles and uses the existing payment contracts ... ok
# Subtest: Razorpay order invocation explicitly uses the logged-in Customer JWT ... ok
# Subtest: booking preserves salon and optional service context through Customer login ... ok
# Subtest: Growth Partner commission is 10% of the platform fee and never touches the Owner 90% ... ok
# Subtest: Growth Partner commission accrues from the active attribution on completion only ... ok
# Subtest: Growth Partner commission is held for exactly 7 days from completion ... ok
# Subtest: refund, cancellation and dispute unwind or extend the Growth Partner hold ... ok
# Subtest: commission ledger is server-owned and readable only by its Growth Partner ... ok
# Subtest: Owner payout is scheduled daily at 22:00 Asia/Kolkata ... ok
# Subtest: the V1_LOCKED payout hook is superseded by a live v2 implementation ... ok
# Subtest: a payout run is idempotent per local payout day ... ok
# Subtest: only clean, fully collected bookings are settled at the locked 90% ... ok
# Subtest: payout tables are server-written and Owner-readable only for their own salon ... ok
# Subtest: refund policy is full beyond 24 hours and partial inside the window ... ok
# Subtest: every locked business rule is verifiable through verify_business_rules ... ok
# Subtest: locked constants cannot drift without failing a check constraint ... ok
# Subtest: business rule changes are auditable ... ok
# Subtest: money helpers stay schema tolerant and never trust the client ... ok
# Subtest: main website keeps the proven booking pipeline contract ... ok
# Subtest: main website uses only the shared Supabase env variables ... ok
# Subtest: 20260802 base schema still provides ledger tables and mint RPCs ... ok
# Subtest: 20260803 provisions customer_reviews exactly as the app contract expects ... ok
# Subtest: 20260803 guards profile balance columns against direct client writes ... ok
# Subtest: 20260803 re-issues mint RPCs with the marker and locks them to service_role ... ok
# Subtest: 20260803 redeem RPC is self-service, balance-checked and tier-locked ... ok
# Subtest: 20260803 ships a runnable self test covering every Phase-1 object ... ok
# Subtest: no catalog column typos in guarded role checks ... ok
# Subtest: status report covers all 7 Phase-1 tasks with verdicts ... ok
# Subtest: app-side patch routes redemption through the server RPC ... ok
# Subtest: dashboard runner contains both migrations verbatim, in order ... ok
# Subtest: Growth Partner proposal form persists through the existing RLS-backed contract ... ok
# Subtest: Owner review uses existing role-checked RPC and exposes supported transitions ... ok
# Subtest: publish keeps attribution and enables only the owner-published storefront ... ok
# Subtest: frontend contains no privileged Supabase credential ... ok
# Subtest: submitted proposals resolve an exact active Owner before workspace bootstrap ... ok
1..40
# tests 40
# suites 0
# pass 40
# fail 0
```

---

## 3. Verified Components
1. **Authentication & Role Guards:** Supabase Auth session integration with `customer`, `business_user`, and `growth_partner` platform roles.
2. **Booking Pipeline:** 25% advance payment via Razorpay, server-side RPC validation, and state tracking.
3. **Ledger & Business Rules:** 90/10 split, 10% GP commission, 7-day hold, and 22:00 IST daily payout engine.
4. **Customer PWA Schemas:** `customer_reviews`, profile balance column protection, and loyalty reward redemption RPCs.
