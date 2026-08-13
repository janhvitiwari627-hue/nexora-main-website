# SECTIONS 4 & 5 — Live Migration Alignment & Authorization Source

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## Overall status

| Section | Live DB | Static (repo) |
| --- | --- | --- |
| 4. Live migration alignment | **BLOCKED** (no live access) | **DONE** — findings below |
| 5. Authorization source | **UNVERIFIED (live trigger/RPC)** | **PASS (static)** — findings below |

Live Supabase access is still unavailable (no CLI / token / connection string; sandbox
egress blocked). Consistent with the audit rules, **no live PASS is recorded** and no
migration was applied. The static analysis below is repository evidence only.

---

# SECTION 4 — LIVE MIGRATION ALIGNMENT

## 4.1 Live comparison — BLOCKED

Cannot compare repo migrations against `supabase.migrations` / live `pg_policies` /
`pg_proc` without a connection. All live-only detections (applied-but-absent, applied-twice,
live-vs-committed drift, old-policy-still-active) remain **UNVERIFIED**.

## 4.2 Static findings (repo migrations only)

### 4.2.1 Migration ordering — OK (with one caveat)
- Main workspace: date-prefixed `YYYYMMDD_*.sql`, chronologically ordered.
- Two same-date files `20260812_phase3_rbac_verification.sql` and
  `20260812_phase7_shared_location_security.sql` — order resolves by filename (phase3 < phase7),
  no cross-dependency observed.
- Job workspace: `20260808170NNN_*` sequence, strictly ordered. ✅

### 4.2.2 Idempotency — mostly OK
`create table if not exists`, `create or replace function`, `drop policy if exists`,
`if not exists (select 1 from pg_policies …)`, and DO-block schema-drift guards are used
consistently. Phase 3 migration (`20260812_phase3_rbac_verification.sql`) is idempotent and
drift-safe (checks `information_schema.columns` before creating policies). ✅

### 4.2.3 ⚠️ Migration references missing tables (12+ tables undefined in repo)
These are referenced by policies/grants/DO-blocks but have **no `CREATE TABLE` anywhere in the
repository** — they must exist live (created out-of-band or by earlier lost migrations):

- Core: `organizations`, `organization_members` (has `owner_gate_select` policy!), 
  `organization_member_permissions`, `admin_users`
- Salon: `salon_media`
- Customer: `booking_items`, `booking_status_history`, `payments`, `refunds`,
  `favorite_salons` (referenced by Phase 3 DO block), `notifications` (has `grant all`)
- Partner: `salon_setup_proposal_versions`

**Impact:** `owner_gate_select on public.organization_members` in
`20260804_shop_owner_phase2_full.sql` will error at apply time if `organization_members` does
not exist live. This is the highest-priority live-alignment item to confirm.

### 4.2.4 ⚠️ Missing `bookings` INSERT authorization
Repo migrations define only `bookings_customer_own` (SELECT), `bookings_owner_read` (SELECT),
`bookings_owner_update` (UPDATE) — **no `for insert` policy on `public.bookings`**, and no
customer booking-creation RPC in the main repo (only `quote_booking_refund`,
`update_booking_status_secure`, and commission triggers). Booking creation is therefore either
(a) performed by the Customer PWA against a separate mechanism, or (b) currently unconstrained.
**Must be verified live** — this is a potential customer-write path without a declared RLS rule.

### 4.2.5 Broad / permissive policies (reviewed)
| Policy | Scope | Verdict |
| --- | --- | --- |
| `platform_revenue_rules_read` — `using (true)` to `authenticated` | global commission config | ⚠️ broad read to all authenticated; low-sensitivity config, but flag for review |
| `staff_public_read` — `using (true)` to `anon,authenticated` | staff directory | ✅ acceptable — `staff` has no phone/salary/email columns (name/role/bio/is_active only) |
| `salon_hours_public_read` — `using (true)` to `anon,authenticated` | public hours | ✅ acceptable (public data) |
| `services_public_read`, `offers_public_read`, `spw_public_read_published` | public catalog | ✅ filtered (`is_active` / `is_published`) |

No conflicting permissive policy pairs found in the repo (owner/customer policies are
mutually-exclusive predicates via `private.can_manage_salon_settings` vs `auth.uid()`). Live
`pg_policies` must confirm no stale duplicate policies remain.

### 4.2.6 Naming drift
Index `reviews_salon_idx … on public.reviews (…)` is declared but the customer table is
`customer_reviews` — a rename artifact to verify live.

---

# SECTION 5 — AUTHORIZATION SOURCE

## 5.1 Static verdict: PASS (repository code)

Authorization is correctly sourced from server-side identity, **not** client inputs.

### ✅ Correct authority chain (verified in code + migrations)

1. **Identity:** `auth.uid()` — `packages/auth/src/service.ts` `verifyCurrentUser()` calls
   `client.auth.getUser()` (server), never trusts the persisted session blob alone.
2. **Role:** `profiles.platform_role` on an **active** row is the only role authority
   (`service.ts` `requireActiveProfile()`; `access.ts` `requireRole(...)`).
3. **Owner/salon:** `owner_salon_ids()` derives salons exclusively from `auth.uid()` through
   `organization_members` (`access.ts` `requireOwnerWorkspace()`); `is_salon_owner(uuid)` wraps
   `private.can_manage_salon_settings`.
4. **Partner:** `requirePartnerMembership()` selects `growth_partners` `.eq("user_id", auth.uid())`
   and rejects mismatches; `is_proposal_attributed(uuid)` keys to `private.current_growth_partner_id()`.
5. **Proposal assignment:** `partner_proposals_select` / `owner_proposals_select` policies scope
   `salon_setup_proposals` to attributed partner / salon owner.
6. **Jobs:** `job_current_role()` reads `job_user_roles` by `auth.uid()`;
   `job_is_admin()` requires BOTH `job_user_roles.role='admin'` AND an active admin `profiles`
   row; `job_is_active_salon_member()` checks membership by `auth.uid()` + active status. All
   are `security definer`, fail-closed.

### ✅ Self-promotion prevented
`guard_profile_platform_role()` trigger (`20260805_permanent_profile_role_guard.sql`):
- non-`service_role` (and non-postgres/supabase_admin) INSERT must be `platform_role = 'customer'`;
- non-`service_role` UPDATE of `platform_role` raises;
- trigger `execute` granted to `service_role` only.
`assign_platform_role(uuid,text)` is `service_role`-only. `normalizeSignupRole()` refuses `admin`.

### ✅ Rejected authorization sources (none present in code)
Grep across `app/`, `packages/`, `job-portal/src/` found **zero** uses of:
`raw_user_meta_data`, `app_metadata`, `user_metadata`, `localStorage`/`sessionStorage` role
flags. `?role=` query param is read **only** for login-screen pre-selection
(`readAuthQueryParams()`, `requested = params.get("role")`); the authoritative role always
comes from the server profile. `returnTo` is sanitized (`startsWith("/")` and not `//`).

### ⚠️ One non-authorization note (UI-only)
`job-portal/src/services/backend.ts:785` matches `card.email === input.targetSeekerEmail` to
resolve a candidate for messaging. This is a **lookup convenience**, not an authorization
decision (the write is gated by RLS/RPC). Flag for review but not a P0/P1 authorization issue.

### 5.2 Live verification — BLOCKED
The static code is correct, but the audit requires proof that the live database actually has:
- the `guard_profile_platform_role` trigger installed and firing,
- `service_role`-only grants on `assign_platform_role` and `guard_profile_platform_role`,
- `job_current_role()` / `job_is_admin()` / `job_is_active_salon_member()` present with the
  committed definitions,
- no `authenticated` execute grant on any role-assignment function.

These require live `pg_proc` / `pg_trigger` / `information_schema.routine_privileges` inspection.

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| LIVE MIGRATION ALIGNMENT | **BLOCKED** (no live DB) |
| MIGRATION ORDERING (static) | PASS |
| IDEMPOTENCY (static) | PASS |
| MIGRATION → MISSING TABLES | **FAIL (static)** — 12+ tables undefined in repo, incl. `organization_members` referenced by a policy |
| BOOKINGS INSERT AUTHORIZATION | **UNVERIFIED** (no insert policy/RPC in repo) |
| BROAD/PERMISSIVE POLICIES | PASS (2 intentional public reads; 1 config read flagged) |
| AUTHORIZATION SOURCE (static) | **PASS** |
| SELF-PROMOTION GUARD (static) | **PASS** |
| FORBIDDEN SOURCES (URL/localStorage/meta) | **PASS** (none found) |
| LIVE TRIGGER/RPC/GRANT VERIFICATION | **BLOCKED** |

## EXACT REMAINING BLOCKERS
1. Live Supabase access (CLI token / read-only Postgres connection / service-role key) + sandbox
   egress to `*.supabase.co`.
2. Confirm live existence of `organizations` / `organization_members` (and the 10 other
   undefined tables) and that `owner_gate_select` did not fail/err.
3. Confirm how `bookings` rows are inserted (customer write path) under RLS.
4. Confirm live trigger + grants for `guard_profile_platform_role` / `assign_platform_role`.

## NEXT REQUIRED ACTION
Provide Supabase read access; then run the live SQL in
`scripts/live_schema_inventory.sql` plus a `pg_proc`/`pg_trigger`/`routine_privileges` query to
convert these static findings into verified live evidence. Phase 6 remains unstarted.
