# SECTION 9 — OWNER-ONLY APPROVAL AND PUBLISHING

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE TESTS BLOCKED — static analysis complete (with FAIL findings)

Live RPC testing requires Supabase access + seeded accounts (Owner, Partner, Customer). Unavailable
(no CLI / token / connection string; egress blocked). **No live PASS is recorded.**

Static inspection of the approval/publish RPC chain produced **two hard FAIL findings** and one
partial, detailed below. These are repository-truth, not live-truth.

---

## RPC chain inspected

`approve_proposal(uuid,text)` → `review_salon_setup(id,'approve',notes)`
`publish_salon_website(uuid,text)` → `review_salon_setup(id,'publish',notes)`
`review_salon_setup` → `private.publish_salon_setup(proposal, caller)` (on publish)

---

## Verification checklist

| # | Requirement | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Authenticated user required | ✅ PASS | `if caller is null then raise 'authentication required'` |
| 2 | Active Owner/manager membership required | ✅ PASS | `can_manage_salon_settings(proposal.salon_id)` → active `organization_members` + active `profiles` + `business_user` |
| 3 | Proposal belongs to target salon | ✅ PASS | proposal fetched by id, gate checks `proposal.salon_id` |
| 4 | Proposal in valid status | ✅ PASS | whitelist matrix; else `invalid setup review transition` |
| 5 | Growth Partner cannot publish | ✅ PASS (static) | partner role fails `can_manage_salon_settings` (requires business_user) |
| 6 | Customer cannot publish | ✅ PASS (static) | customer role fails owner gate |
| 7 | Unrelated Owner cannot call | ✅ PASS (static) | membership join on `om.organization_id = s.organization_id` |
| 8 | Direct table update cannot bypass RPC | ✅ PASS | `salon_setup_proposals` has no INSERT/UPDATE/DELETE grant/policy to `authenticated` |
| 9 | Function writes audit event | ⚠️ **PARTIAL** | writes `salon_setup_proposal_versions` + `notifications` (change trail) but **no** `audit_events` / `log_audit` insert |
| 10 | Trusted server identity | ✅ PASS | `security definer` + `caller := auth.uid()` |
| 11 | Restricted EXECUTE grants | ❌ **FAIL** | `approve_proposal` & `publish_salon_website` are revoked from public/anon ✅, but **`review_salon_setup` has NO `revoke … from public, anon`** → retains Postgres default PUBLIC EXECUTE |
| 12 | PUBLIC and anon cannot execute | ❌ **FAIL** | `review_salon_setup` not revoked → PUBLIC EXECUTE (mitigated only by in-body `auth.uid()` null check) |
| 13 | Fixed/empty `search_path` | ✅ PASS | `set search_path = ''` on all three functions |
| 14 | No SQL injection | ⚠️ **PARTIAL** | parameterized queries + `action` whitelist (`lower(trim())` compared to fixed strings); **but `private.validate_salon_setup_payload()` is undefined in repo** (payload validation surface unverifiable) |

---

## Hard findings

### F1 (P0) — `private.publish_salon_setup()` is called but not defined in the repository
`review_salon_setup` executes `perform private.publish_salon_setup(proposal, caller)` on the
`publish` action, but **no `CREATE FUNCTION private.publish_salon_setup` exists anywhere in the
migration tree**. Consequences:
- If the function does not exist live, every `publish` action raises
  `function private.publish_salon_setup(...) does not exist` — **publishing is broken**.
- If it exists live (created out-of-band), then the committed schema is incomplete and the
  publish implementation is **unauditable from the repository** (live-vs-committed drift).

### F2 (P0) — `private.validate_salon_setup_payload()` is called but not defined in the repository
`save_growth_partner_salon_setup` executes `perform private.validate_salon_setup_payload(p_payload)`
on every create/edit, but **no `CREATE FUNCTION private.validate_salon_setup_payload` exists in the
repo**. Same two consequences as F1 — either the partner proposal write path is broken live, or its
input-validation surface is invisible to this audit.

### F3 (P1) — `review_salon_setup` lacks explicit EXECUTE revocation
`approve_proposal` / `publish_salon_website` are correctly `revoke all … from public, anon; grant …
to authenticated`, but the underlying `review_salon_setup` is never revoked. PostgreSQL grants
EXECUTE to PUBLIC by default on `CREATE FUNCTION`. The in-body `caller is null` guard blocks
anonymous execution, but the grant surface does not satisfy "restricted EXECUTE grants /
PUBLIC and anon cannot execute" as a hard control. Recommend:
`revoke all on function public.review_salon_setup(uuid,text,text) from public, anon;`

### F4 (P2) — No canonical audit event
The publish/approve flow records a `salon_setup_proposal_versions` row (`change_source='shop_owner'`,
`changed_by=caller`) and a `notifications` row, but does **not** insert into `public.audit_events`
(which exists, is RLS-gated, and has a `log_audit(…)` helper granted to `service_role` only). The
version row is a reasonable change trail, but it does not meet "writes audit event" against the
canonical audit table.

---

## SQL-injection assessment (functions that exist)

- All queries are parameterized (`where id = p_proposal_id`, etc.).
- `p_action` is normalized (`lower(trim())`) and compared against a **fixed whitelist**
  (`approve`/`publish`/`request_changes`/`grant_edit`/`reject`); no dynamic SQL.
- `p_notes` is only ever bound as a value (version `change_note`, notification `message`), never
  interpolated into identifiers.
- No `format()` / identifier interpolation exists in the runtime approval/publish path (the
  `format(%I)` usage is confined to migration-time `DO` blocks, which are admin-only).
- **Residual risk**: the payload is validated by `private.validate_salon_setup_payload`, which is
  undefined in-repo (F2) — so the actual payload-validation/injection surface cannot be confirmed.

---

## Ready-to-run live verification (read-only first)

```sql
-- existence of the two "called but undefined" private helpers
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.proname in ('publish_salon_setup','validate_salon_setup_payload');

-- EXECUTE grants on the approval/publish RPCs (who can call)
select r.routine_schema, r.routine_name, grantee, privilege_type
from information_schema.routine_privileges r
where r.routine_name in ('review_salon_setup','approve_proposal','publish_salon_website')
order by r.routine_name, grantee;
```

Then exercise live: Owner approve/publish own proposal = ALLOW; Growth Partner publish = DENY;
Customer publish = DENY; unrelated Owner publish = DENY; `UPDATE salon_setup_proposals` directly =
DENY; `select * from audit_events` after publish = confirm an event (expected FAIL until F4 is fixed).

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| LIVE RPC TESTS | **BLOCKED** |
| AUTHENTICATED + ACTIVE OWNER + OWN SALON + VALID STATUS | **PASS (static)** |
| PARTNER/CUSTOMER/UNRELATED-OWNER DENIED | **PASS (static)** |
| DIRECT UPDATE CANNOT BYPASS | **PASS (static)** |
| TRUSTED SERVER IDENTITY + EMPTY search_path | **PASS (static)** |
| NO SQL INJECTION (parameterized + action whitelist) | **PASS (static, existing functions)** |
| RESTRICTED EXECUTE GRANTS / anon cannot execute | **FAIL (static)** — `review_salon_setup` unrevoked |
| FUNCTION WRITES AUDIT EVENT | **PARTIAL (static)** — version trail only, no `audit_events` |
| MISSING `publish_salon_setup` / `validate_salon_setup_payload` | **FAIL (static)** — undefined in repo |

## EXACT REMAINING BLOCKERS
1. Supabase access + seeded Owner/Partner/Customer accounts + sandbox egress (live confirmation).
2. Resolve F1/F2: locate or commit `private.publish_salon_setup` and
   `private.validate_salon_setup_payload` definitions (publish + partner-proposal write depend on them).
3. Apply F3 hardening (`revoke … from public, anon` on `review_salon_setup`).
4. Decide F4 (add canonical `audit_events` write, or accept version-trail as the audit record).

## NEXT REQUIRED ACTION
Do not proceed to Phase 6. Fix F1/F2/F3 (at minimum) before treating approval/publish as
production-ready. Phase 6 remains unstarted; no live PASS is recorded.
