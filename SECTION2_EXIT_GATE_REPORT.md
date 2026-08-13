# SECTION 2 EXIT GATE — FINAL REPORT

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

FINAL REPORT — ONLY THIS FORMAT
==================================================

SECTION 1 RESULT RECEIVED: FAIL
SUPABASE CONNECTION: BLOCKED
SUPABASE PROJECT ID: FAIL (not reachable from sandbox — no CLI/token/connection; `fetch`/curl to *.supabase.co blocked)
PROJECT HEALTH: BLOCKED
ALL APPS USE SAME PROJECT: UNVERIFIED (repo config declares `qwaehqsmodekbgvnaavz` everywhere; cannot confirm live)
LIVE SCHEMA INVENTORY: BLOCKED (repo-declared inventory produced in SECTION3_LIVE_SCHEMA_INVENTORY.md)
ALL EXPOSED TABLES HAVE RLS: PARTIAL (repo migrations enable RLS on ~24 main + ~33 jobs tables; 12+ tables referenced but NOT defined in repo — unverifiable live)
MIGRATION ALIGNMENT: PARTIAL (static ordering/idempotency PASS; live `supabase.migrations`/`pg_policies` unverifiable; 2 referenced private functions + 12+ tables undefined in repo)
AUTHORIZATION SOURCE: PASS (static — auth.uid() + active profiles.platform_role + org/salon/partner/jobs membership; no URL/localStorage/meta authorization)
NO SELF-ROLE PROMOTION: PASS (static — `guard_profile_platform_role` trigger + `assign_platform_role` service_role-only + `normalizeSignupRole` refuses admin)

CUSTOMER OWN-BOOKING ACCESS: BLOCKED
CUSTOMER OWN-RECORD ACCESS: BLOCKED (static rules OK: settings/favourites/reviews/notifications policies present)
CUSTOMER CROSS-USER READ DENIAL: BLOCKED (static rule present: `bookings_customer_own` `auth.uid()=customer_id`)
CUSTOMER CROSS-USER WRITE DENIAL: BLOCKED (booking INSERT policy/RPC absent from repo — flagged)
CUSTOMER PROTECTED-FIELD DENIAL: BLOCKED (static OK via `guard_profile_platform_role` + service_role-only settlement)

OWNER OWN-SALON ACCESS: BLOCKED
OWNER OWN-SALON MUTATIONS: BLOCKED (static OK: `*_owner_all` + `salons_owner_update_own` with USING+WITH CHECK)
OWNER UNRELATED-SALON DENIAL: BLOCKED (static OK: `can_manage_salon_settings(salon_id)`)
OWNER PRIVATE-DATA ISOLATION: BLOCKED (static OK)
OWNER MEMBERSHIP ENFORCEMENT: BLOCKED (static OK: active `organization_members` + active profile)

PARTNER IDENTITY: BLOCKED
PARTNER ASSIGNED-PROPOSAL ACCESS: BLOCKED (static OK: `current_growth_partner_id()`)
PARTNER DRAFT MUTATIONS: BLOCKED (static OK: `save_growth_partner_salon_setup` draft/changes_requested only)
PARTNER UNRELATED-PROPOSAL DENIAL: BLOCKED (static OK)
PARTNER DIRECT-PUBLISH DENIAL: BLOCKED (static OK: `review_salon_setup`/`publish_salon_website` owner-gated)
PARTNER CUSTOMER-DATA DENIAL: BLOCKED (static OK)
PARTNER FINANCIAL-DATA DENIAL: BLOCKED (static OK: commission mutation RPCs service_role-only)

OWNER-ONLY APPROVAL: BLOCKED (static PASS; ⚠️ depends on undefined `publish_salon_setup` for publish, not approve)
OWNER-ONLY PUBLISH: BLOCKED (static PASS on gate; **F1 P0 — `private.publish_salon_setup` undefined in repo**)
PROPOSAL STATE TRANSITIONS: BLOCKED (static PASS: RPC matrix Draft→Submitted→ChangesRequested→Resubmitted→Approved/Rejected→Published)

JOB SEEKER ISOLATION: BLOCKED (static PASS)
EMPLOYER ISOLATION: BLOCKED (static PASS)
JOB MEMBERSHIP ENFORCEMENT: BLOCKED (static PASS: `job_is_active_salon_member`)

POLICY QUALITY: PASS (static — no `WITH CHECK(true)`; 3 benign `USING(true)` SELECTs; indexed RLS predicates)
RPC/FUNCTION SECURITY: PARTIAL (static — 2 P0 missing functions, 1 P1 unrevoked RPC)
VIEW SECURITY: PARTIAL (static — 2 jobs views `security_invoker=false`, documented/intentional)
STORAGE SECURITY: PASS (static — private buckets, ownership-scoped; 1 P2 partner-asset gap)
REALTIME ISOLATION: PASS (static — per-user channel, RLS tables, full cleanup; main app uses no Realtime)
OFFLINE DATA SECURITY: PASS (static — main is not a PWA host; jobs SW caches public GETs only; no outbox; 1 P3 stale-timestamp UX)
NO SERVICE-ROLE EXPOSURE: PASS (static + git-history scan — client validator actively rejects service keys)
NO FRONTEND AUTHORIZATION TRUST: PASS (static — no URL/localStorage/meta role authority)

RLS RUNTIME TESTS: PASS 1/1 (embedded PGlite, NOT live Supabase — `phase7-rls-runtime.test.mjs`)
SECURITY TESTS: PASS 49/49 (phase7-rls-runtime + phase7-location-security + production-auth-security-contract + returnto-security)
SUPABASE SECURITY ADVISOR: BLOCKED (requires dashboard/CLI access)
SUPABASE PERFORMANCE ADVISOR: BLOCKED (requires dashboard/CLI access)

MIGRATIONS INSPECTED: 27 total — 17 `supabase/migrations/` (20260729…20260813) + 10 `job-portal/supabase/migrations/` (20260808170000…20260808170900)
MIGRATIONS MISSING: (a) definitions for `private.publish_salon_setup` and `private.validate_salon_setup_payload` (called but never defined); (b) CREATE TABLE for `organizations`, `organization_members`, `organization_member_permissions`, `admin_users`, `salon_media`, `booking_items`, `booking_status_history`, `payments`, `refunds`, `favorite_salons`, `notifications`, `salon_setup_proposal_versions`
MIGRATIONS APPLIED DURING AUDIT: NONE
DATABASE CHANGES MADE: NONE

P0 FINDINGS: 2
1. F1 — `private.publish_salon_setup(proposal, caller)` called by `review_salon_setup` but NOT defined anywhere in the repository (Section 9).
2. F2 — `private.validate_salon_setup_payload(p_payload)` called by `save_growth_partner_salon_setup` but NOT defined anywhere in the repository (Section 9).

P1 FINDINGS: 2
1. F3 — `public.review_salon_setup(uuid,text,text)` lacks `revoke … from public, anon` (retains PUBLIC EXECUTE) (Section 9/12).
2. F-schema — `owner_gate_select` policy created on `public.organization_members`, which has no CREATE TABLE in the repo; owner gate depends on this table existing live (Sections 3/4/7).

P2 FINDINGS: 5
1. F4 — approve/publish writes `salon_setup_proposal_versions` + `notifications` but not canonical `audit_events` (Section 9).
2. F5 — `job_is_admin()` and `job_is_active_salon_member(uuid)` EXECUTE granted to `anon` (Section 11).
3. F6 — `public_job_listings` / `public_job_salon_profiles` are `security_invoker=false` (RLS-bypassing, documented) (Section 11).
4. F7 — `platform_revenue_rules_read` `using(true)` to all authenticated (Section 11).
5. F13 — no partner-scoped "assigned draft assets" storage policy in main repo (Section 13).

P3 FINDINGS: 4
1. F14 — `salon-public-media` is a permanent public bucket (intentional; confirm no private writes) (Section 13).
2. F15 — main website declares no Realtime for booking/notification/proposal status (confirm PWA delivery path) (Section 14).
3. F15-offline — cached job listings have no visible stale/last-updated indicator (Section 15).
4. F16 — `.env.acceptance.example` documents a (commented, placeholder) service-role slot (Section 16, informational).

ALL MISSING/PARTIAL/UNVERIFIED ITEMS:
1. LIVE Supabase access — no CLI/token/connection; sandbox egress to *.supabase.co blocked (blocks every live ALLOW/DENY matrix, live schema, advisors).
2. Section 1 deliverable — never provided/found, so its completion + P0/P1 state cannot be confirmed.
3. Definitions of `private.publish_salon_setup` and `private.validate_salon_setup_payload` (P0).
4. `revoke … from public, anon` on `review_salon_setup` (P1).
5. Live existence of the 12+ referenced-but-undefined tables, incl. `organization_members` (P1).
6. Live confirmation of `job_posts` status-transition trigger and view WHERE invariants (P2).
7. Partner "assigned draft assets" storage requirement confirmation (P2/P3).

CONFLICTING POLICIES/FUNCTIONS:
1. Overlapping (additive, not conflicting) owner policies: `services_owner_all`/`staff_owner_all`/`offers_owner_all`/`salon_hours_owner_all` vs `owner_gate_select/insert/update` — same predicate, both restrict to `can_manage_salon_settings`; verify no stale duplicates live.
2. Overlapping partner policies: `partner_gate_select` vs `partner_proposals_select` on `salon_setup_proposals` — both partner-scoped; verify no stale duplicates live.
3. Jobs view `security_invoker` flipped true→false→true→false across migrations — final state is `security_invoker=false` for the two public views; confirm intent is captured in a comment.

EXACT BLOCKERS:
1. Attempt: live Supabase inspection via `supabase` CLI / Management API / Postgres connection / service-role key.
   Exact error: CLI absent; no SUPABASE_ACCESS_TOKEN/service-role/connection string in environment; `node fetch` and `curl` to `https://qwaehqsmodekbgvnaavz.supabase.co` fail with `OpenSSL SSL_connect: SSL_ERROR_SYSCALL` / `fetch failed` (sandbox egress restriction). Platform web-fetch reaches the REST endpoint but only returns `{"message":"No API key found in request"}` (cannot send an `apikey` header).
   Fallback attempted: searched repo/env for embedded keys (none — only placeholders); ran embedded-PGlite RLS runtime test (passed); ran static contract/security suites (passed).
   Required action: provide `SUPABASE_ACCESS_TOKEN` (CLI/API) OR a read-only Postgres connection string OR a service-role key, plus safe seeded test accounts (Customer A/B, Owner A/B, Growth Partner A/B, Job Seeker A/B, Employer A/B, role-less), and enable sandbox egress to *.supabase.co.
2. Attempt: resolve the two P0 missing functions from any branch/history.
   Exact error: `git grep` across all branches/history finds no definition of `private.publish_salon_setup` or `private.validate_salon_setup_payload`.
   Fallback attempted: none possible (source not in repo).
   Required action: author and commit both functions (publish + payload validation), or confirm they exist live out-of-band and re-add their SQL to the repo.

SECTION 2 RESULT: FAIL
SECTION 3 READINESS: NOT READY
NEXT REQUIRED ACTION: Provide Section 1 + live Supabase access (credentials + seeded accounts + egress), and resolve P0 F1/F2 and P1 F3 before re-running the live matrix. Do NOT start Section 3.

---

## Evidence backing the PASS entries above (automated, runnable now)

- **RLS runtime (embedded PGlite):** `node --test tests/phase7-rls-runtime.test.mjs` → **1/1 PASS**.
  Asserts: customer reads only own private GPS (`user_id = CUSTOMER`); owner reads only own (`OWNER_A`); partner reads **none** (`partnerRows.length === 0`); `assert.rejects` on cross-user/partner business-location writes; published-only catalog visibility. (Local PGlite, NOT live Supabase.)
- **Security suite:** `npm run test:security` → **49/49 PASS** (returnto 16 assertions, production-auth-security-contract, phase7-location-security, phase7-rls-runtime).
- **Contract suite:** `npm run test:contracts` → **260/260 PASS** (incl. phase3-rbac-contract, proposal-flow-contract, booking-role-guard, job-admin-approval, path-routing, production gates).
- **No service-role exposure:** `git grep` + full-history `git log -S/-G` for `SUPABASE_SERVICE_ROLE_KEY`, `service_role_key`, `eyJ…` JWT, `sk_live`/`rzp_live`, private keys → **0 real occurrences**; `packages/auth/src/env.ts` actively rejects service keys in browser config.
- **No frontend authorization:** zero uses of `raw_user_meta_data`/`localStorage`/`sessionStorage` role authority in request paths (metadata only read at signup and normalized).

All live (BLOCKED) rows require real Supabase access and are not asserted here as PASS.
