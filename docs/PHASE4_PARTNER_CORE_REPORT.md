# PHASE 4 — PARTNER CORE (GROWTH PARTNER ONBOARDING, PROPOSALS & COMMISSIONS)

**Date:** 2026-08-25  
**Architect Role:** Senior Database + Full-Stack Architect  
**Ecosystem:** Nexora Multi-App Ecosystem  
**Target Supabase Instance:** `https://qwaehqsmodekbgvnaavz.supabase.co`  
**Phase Status:** **PHASE 4 COMPLETE (PASSED)**

---

## 1. EXECUTIVE SUMMARY

Phase 4 establishes and validates the complete **Partner Core** subsystem across the Nexora platform. Growth Partners can securely register, author salon proposals, track salon attributions, and accrue commissions on completed bookings under strict server-authoritative and RLS-enforced business rules.

---

## 2. GOVERNING ARCHITECTURE & CONTRACTS

### 2.1 Growth Partner Identity Bootstrap
- **Role Verification:** Growth Partners must possess `profiles.platform_role = 'growth_partner'`.
- **Identity Generation:** Handled by `public.ensure_growth_partner_identity()` RPC (`security definer`), which generates:
  - `partner_code`: `NXGP-<10_CHARS>`
  - `referral_code`: `REF-<10_CHARS>`
  - Status: `'applied'` / `'active'`
- **Direct Write Protection:** Clients cannot insert or alter partner codes or commission rates.

### 2.2 Proposal Submission & Owner Resolution
- **Proposal Creation:** Written to `public.salon_setup_proposals` and `public.shop_onboarding_applications` via `save_growth_partner_salon_setup()`.
- **Owner Resolution:** Gated by `private.resolve_setup_owner()`, which verifies the target shop owner's existence, phone/email, and `platform_role = 'business_user'`.

### 2.3 Shop Attribution & Multi-Partner Isolation
- **Attribution Ledger:** Tracked in `public.shop_attributions` (`salon_id`, `growth_partner_id`, `status = 'active'`).
- **RLS Isolation:** Enforced via `attributions_partner_read` (`growth_partner_id = private.current_growth_partner_id()`). Partner A can never see Partner B's attributed salons.

### 2.4 Approval Lock & Publish Survival
- **Owner Review:** The assigned Shop Owner reviews the proposal via `public.review_salon_setup(p_proposal_id, 'approve' | 'publish' | 'request_changes')` or `public.approve_proposal()` / `public.publish_salon_website()`.
- **Publish Action:**
  1. Validates that the salon is not attributed to a different active growth partner.
  2. Updates `public.salons` (`verified = true`, `is_active = true`, `accepts_online_bookings = true`).
  3. Updates `public.salon_public_websites` (`is_published = true`, `published_at = now()`).
  4. Inserts/locks `public.shop_attributions` row.
  5. Sets proposal status to `'published'`.
- **Survival Guarantee:** Once published, non-approvers / third parties cannot re-approve, alter attribution, or hijack ownership.

### 2.5 Commission & 7-Day Maturation Hold Rules
- **Rule 3 (10% Platform Fee):** `commission_rate_bps = 1000` (10% of platform revenue, 1% of gross booking amount).
- **Rule 4 (7-Day Maturation Hold):** Commissions accrue with `status = 'held'` and `hold_until = accrued_at + interval '7 days'`.
- **Accrual Automation:** Trigger `trg_nexora_growth_partner_commission` on `public.bookings` automatically computes and records commissions when `status = 'completed'`.
- **Release Automation:** Function `public.release_growth_partner_commissions()` advances matured rows (`status = 'held' AND hold_until <= now()`) to `status = 'payable'` via pg_cron.

---

## 3. VERIFICATION & EXIT EVIDENCE

| Exit Gate Requirement | Verification Method | Result | Evidence |
|---|---|---|---|
| **Attribution Isolation** | Cross-partner RLS check | **PASS** | `attributions_partner_read` policy restricts reads to `current_growth_partner_id()` |
| **Publish Survival** | Proposal state machine & attribution lock | **PASS** | `review_salon_setup` asserts attribution lock on publish; non-owner calls raise exception |
| **Split & Hold Math** | DB Check constraints & trigger assertions | **PASS** | `commission_rate_bps = 1000`, `hold_days = 7`, `hold_until` verified in `tests/phase4-partner-core.test.mjs` |
| **No Client Direct Writes** | RLS revoke on commission ledger | **PASS** | `growth_partner_commissions` is server/trigger-written only |

---

## 4. TEST SUITE EXECUTION

Executed Phase 4 test suite:
```bash
node --test tests/phase4-partner-core.test.mjs tests/phase3-growth-partner-package-contract.test.mjs tests/proposal-flow-contract.test.mjs
```

**Results:**
- `Phase 4.1: Growth Partner identity bootstrap is server-authoritative` — **PASS**
- `Phase 4.2: Partner shop attributions and proposals are isolated via RLS` — **PASS**
- `Phase 4.3: Shop proposal approval and publish flow enforce owner resolution` — **PASS**
- `Phase 4.4: 10% platform fee commission split and 7-day maturation hold are locked` — **PASS**
- `Phase 4.5: Commission ledger mutations are revoked from client direct writes` — **PASS**
- `Proposal flow contract` (5/5) — **PASS**
- `Growth partner package contract` (6/6) — **PASS**

**Total: 16/16 tests PASSED.**

---

## 5. EXIT SIGN-OFF

```text
PHASE 4 EXIT GATE: PASSED
```

The Growth Partner Core subsystem is authoritative, isolated, and compliant with all platform business rules.
