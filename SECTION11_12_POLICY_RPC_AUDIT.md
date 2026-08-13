# SECTIONS 11 & 12 — POLICY QUALITY & FUNCTION/RPC SECURITY

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website` (+ `job-portal/` workspace)
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE VERIFICATION BLOCKED — static pattern audit complete

No Supabase access (CLI/token/connection absent; egress blocked). **No live PASS is recorded.**
Everything below is repository truth (migration files), not live `pg_policies`/`pg_proc` truth.

---

# SECTION 11 — POLICY QUALITY

## 11.1 Policy checklist (static, across ~90 policies in both workspaces)

| Rule | Static result |
| --- | --- |
| Correct `TO` role | ✅ mostly — `to anon,authenticated` only for public-read projections; `to authenticated` for all others |
| Ownership/assignment predicate | ✅ `auth.uid() = user_id` / `= customer_id` / `current_growth_partner_id()` / `can_manage_salon_settings(salon_id)` |
| No broad authenticated mutation | ✅ mutations always gated by an ownership predicate |
| INSERT uses `WITH CHECK` | ✅ (`customer_settings_owner`, `saved_payment_methods_owner`, reviews `_insert_own`, `notifications_self_all`, `job_saved_jobs_own`, candidate `_insert_own`) |
| UPDATE uses `USING` **and** `WITH CHECK` | ✅ (`salons_owner_update_own`, `owner_gate_update`, `profiles_update_own`, `job_posts_member_update`, candidate `_update_own`) |
| DELETE uses ownership predicate | ✅ (`customer_reviews_delete_own`, `job_posts_member_delete_draft`, `job_notifications_delete_own`) |
| SELECT policy exists for UPDATE | ✅ owner/customer read policies pair with write policies |
| `auth.uid()` null cannot pass | ✅ helper functions return false/null on null caller; policies compare `= auth.uid()` |
| No user_metadata authorization | ⚠️ see 11.3 — metadata used at **signup** only, normalized + guarded |
| No excessive OR leaking rows | ✅ (see 11.2 `job_is_admin` note) |
| Policy helper not manipulable by row input | ✅ helpers ignore row input; take `auth.uid()`-derived identity or a column they re-check server-side |
| Indexed columns support RLS predicates | ✅ mostly (see Section 3 index list); ⚠️ `user_id`/`customer_id`/`salon_id` indexes present on the hot tables |

## 11.2 `USING (true)` / `WITH CHECK (true)` findings

`WITH CHECK (true)` — **none** (0 occurrences). ✅

`USING (true)` — **3 occurrences**, all SELECT (no mutation):

| Policy | Verdict |
| --- | --- |
| `platform_revenue_rules_read` → authenticated, `using (true)` | ⚠️ broad read of global commission config to every authenticated user. Low sensitivity; flag to restrict or accept |
| `staff_public_read` → anon+authenticated, `using (true)` | ✅ acceptable — `staff` table has no phone/email/salary columns |
| `salon_hours_public_read` → anon+authenticated, `using (true)` | ✅ acceptable — public hours |

No broad **mutation** with `true` exists. ✅

## 11.3 `raw_user_meta_data` usage

20 occurrences, **all inside auth `handle_new_user()` / profile auto-create triggers**, reading
`signup_role`, `full_name`, `name`, `phone`, `job_role`/`role` (jobs). Assessment:

- Used **only at account creation**, then normalized through `private.normalize_platform_role()`
  with a **fixed alias whitelist** — never read directly for authorization at request time.
- The permanent-role guard (`guard_profile_platform_role`) prevents the normalized role from being
  self-changed afterwards.
- Jobs trigger (`job_register_role`/`handle_new_user`) reads `job_role`/`role`/`app_context` only
  during signup, gated by `app_context='jobs'`.

**Verdict:** metadata is used for **initial provisioning**, not authorization. ⚠️ This is the
standard Supabase pattern but should be documented as an explicit risk acceptance; the role value
is client-supplied at signup and only constrained by the alias whitelist + permanent-role guard.

## 11.4 Grants to PUBLIC / anon (review)

- `grant … to public` — **none** on tables. ✅
- `grant … to anon` — only public-read tables (`salons` allowlist columns, `offers`, `services`,
  `staff`, `salon_hours`, `salon_public_websites`, `business_locations`) and the two public job
  views + public job functions (`job_is_admin`, `job_is_active_salon_member`, `job_email_portal_role`).
- ⚠️ **`job_is_admin()` and `job_is_active_salon_member(uuid)` granted EXECUTE to `anon`**
  (`20260808170200_jobs_rls_storage.sql:514-515`). These are read-only booleans keyed to
  `auth.uid()` (anon → false), so low risk, but granting an admin-check helper to anon is an
  unnecessary surface and contradicts "restricted grants" best practice. Flag P2.
- ✅ No `grant` to anon on private/financial tables (`payments`, `payouts`, commissions, etc.).

## 11.5 Views (`security_invoker`)

| View | Final state | Grants | Verdict |
| --- | --- | --- | --- |
| `growth_partner_commission_summary` | `security_invoker=true` | (authenticated) | ✅ RLS-preserving |
| `owner_payout_summary` | `security_invoker=true` | (authenticated) | ✅ RLS-preserving |
| `public_job_listings` | `security_invoker=false` (definer) | anon+authenticated | ⚠️ see finding V1 |
| `public_job_salon_profiles` | `security_invoker=false` (definer) | anon+authenticated | ⚠️ see finding V1 |
| `job_employer_candidate_cards` | `security_invoker=true` | authenticated | ✅ RLS-preserving |

**Finding V1 (P2):** `public_job_listings` and `public_job_salon_profiles` are
`security_invoker=false`, so they **bypass RLS** on the underlying `job_posts`/`salons` tables.
This is **documented and intentional** (`20260808170700_jobs_public_views.sql`: "intentionally run
as the owner … expose an explicit allowlist of non-sensitive columns … independently enforce
active, published, unexpired"). The safety relies entirely on the view WHERE-clause re-applying the
visibility rules. It is acceptable **only if** the WHERE filters are complete and stay in sync with
the RLS policies; the migration history shows this state was flipped twice (`security_invoker`
true→false→true→false), which is a maintenance-risk smell. Flag for live confirmation + a comment
asserting the invariant.

---

# SECTION 12 — FUNCTION / RPC SECURITY

## 12.1 Privileged RPC checklist (static)

Audited functions: `review_salon_setup`, `approve_proposal`, `publish_salon_website`,
`save_growth_partner_salon_setup`, `ensure_growth_partner_identity`, `update_booking_status_secure`,
`update_salon_profile_secure`, `approve_job`, `reject_job`, `publish_job`, `submit_job_for_approval`,
`process_payment_webhook`, `ingest_payment_webhook`, `process_owner_payouts`,
`release_growth_partner_commissions`, `mark_growth_partner_commissions_paid`,
`mark_owner_payouts_paid`, `assign_platform_role`.

| Requirement | Result |
| --- | --- |
| Explicit `auth.uid()` check | ✅ all mutating RPCs (`caller := auth.uid()` / `job_assert_authenticated()`; raise if null) |
| Role lookup from protected table | ✅ `profiles.platform_role` (active) / `job_user_roles` (active) |
| Ownership/assignment check | ✅ `can_manage_salon_settings`, `current_growth_partner_id`, `submitted_by_partner_id`, `job_is_active_salon_member` |
| Valid input validation | ⚠️ payload validation delegated to `private.validate_salon_setup_payload` — **undefined in repo** (Section 9 F2) |
| Valid state-transition validation | ✅ explicit status matrices (`review_salon_setup`, `update_booking_status_secure`, `approve_job`) |
| Fixed/empty `search_path` | ✅ `set search_path=''` (or `=pg_catalog`) on all audited functions |
| Qualified table names | ✅ `public.`/`private.`/`storage.` qualified everywhere in `search_path=''` bodies |
| PUBLIC execute revoked | ❌ `review_salon_setup` not revoked (Section 9 F3) |
| anon execute revoked | ✅ mutating RPCs revoked from anon/public |
| authenticated execute only when appropriate | ✅ |
| service_role only for admin/server | ✅ settlement/webhook/role-assign RPCs are `service_role`-only |
| No silent RLS bypass | ⚠️ `set_config('app.job_trusted_status_change','yes')` in `approve_job` implies a trigger consumes it — **confirm live** (Section 10) |
| No user-controlled dynamic SQL | ✅ no `EXECUTE`/`format()` with client input in RPC bodies (only migration-time `%I` over fixed arrays) |
| Idempotency (payment/booking) | ✅ `p_idempotency_key`, `ingest_payment_webhook(…idempotency_key…)`, `payment_webhook_events_idempotency_idx`, `on conflict` |
| Audit logging for sensitive changes | ⚠️ `job_audit_log` written by job approval ✅; main approval/publish writes `salon_setup_proposal_versions` + `notifications` but **not** `audit_events` (Section 9 F4) |

## 12.2 Cross-cutting FAIL/PARTIAL (carried forward, now consolidated)

| # | Severity | Finding | Section |
| --- | --- | --- | --- |
| F1 | P0 | `private.publish_salon_setup()` called but undefined in repo | 9 |
| F2 | P0 | `private.validate_salon_setup_payload()` called but undefined in repo | 9, 12 |
| F3 | P1 | `review_salon_setup` lacks `revoke … from public, anon` | 9, 12 |
| F4 | P2 | no canonical `audit_events` write on approve/publish | 9, 12 |
| F5 | P2 | `job_is_admin()` / `job_is_active_salon_member()` EXECUTE granted to `anon` | 11, 12 |
| F6 | P2 | `public_job_listings` / `public_job_salon_profiles` are `security_invoker=false` (documented but RLS-bypassing) | 11 |
| F7 | P2 | `platform_revenue_rules_read` `using(true)` to all authenticated | 11 |

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| LIVE POLICY/RPC INSPECTION | **BLOCKED** |
| POLICY QUALITY (static) | **PASS** with 4 P2 notes (11.2/11.4/11.5) |
| FUNCTION/RPC SECURITY (static) | **PARTIAL** — 2 P0, 1 P1, 4 P2 findings (12.2) |
| DANGEROUS PATTERN SCAN | **DONE** — no `WITH CHECK(true)`, no `auth.role()`, no `user_metadata` authz, no PUBLIC table grants, no unrevoked anon mutations |

## EXACT REMAINING BLOCKERS
1. Supabase access (read + isolated write) + seeded accounts + sandbox egress.
2. Resolve F1/F2/F3 before production (functions must be defined + grant-hardened).
3. Live-confirm: `job_posts` status-transition trigger, view WHERE invariants, `platform_revenue_rules` exposure intent.

## NEXT REQUIRED ACTION
Fix F1–F3 (minimum) and decide F4–F7, then re-run with live access. Phase 6 remains unstarted;
no live PASS is recorded.
