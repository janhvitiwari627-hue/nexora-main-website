# SECTION 7 — SHOP OWNER RBAC / RLS

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE TESTS BLOCKED — static analysis complete

Live ALLOW/DENY evidence requires authenticated Supabase test accounts (Owner A / Owner B across
two organizations, plus a Customer and Partner) and a connection to `qwaehqsmodekbgvnaavz`.
Neither is available (no CLI / token / connection string; sandbox egress blocked). **No live PASS
is recorded.** No data was created or modified.

---

## The owner gate (verified statically)

The entire Owner RBAC surface is built on two `security definer`, `search_path=''` functions that
resolve ownership **server-side** from `auth.uid()` — never from a client-supplied salon ID:

**`private.can_manage_salon_settings(p_salon_id)`** (`20260807_phase8_security_and_isolation.sql`):
```sql
exists (
  select 1
  from public.salons s
  join public.organization_members om on om.organization_id = s.organization_id
  join public.profiles p on p.id = om.user_id
  where s.id = p_salon_id
    and om.user_id = caller
    and om.is_active = true
    and p.platform_role = 'business_user'
    and p.is_active = true
)
```

**`public.owner_salon_ids()`** (`20260808_production_gates_and_blockers.sql`): same joins,
plus `is_active_platform_role('business_user')`, `s.is_active = true`, `s.deleted_at is null`.

This single gate satisfies the four mandated verification points:

| Verification point | Status (static) |
| --- | --- |
| Owner/manager membership is active | ✅ `om.is_active = true` AND `p.is_active = true` |
| Organization membership belongs to target salon organization | ✅ join on `om.organization_id = s.organization_id` |
| Removed/inactive membership loses access | ✅ `is_active` checks fail-closed |
| UPDATE uses both `USING` and `WITH CHECK` | ✅ `salons_owner_update_own`, `owner_gate_update`, `*_owner_all` all use `using … with check …` |
| Forge salon ID | ✅ denied — ownership resolved via `auth.uid()`; a forged ID simply fails the policy |

---

## 7.1 ALLOW (owned/authorized salons)

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| O1 | Read own salon | `salons_owner_read_own` / `owner_gate_select` via `can_manage_salon_settings(id)` | ✅ | UNVERIFIED |
| O2 | Update own salon profile | `salons_owner_update_own` (`using` + `with check`) | ✅ | UNVERIFIED |
| O3 | Manage own services | `services_owner_all` (`for all`) | ✅ | UNVERIFIED |
| O4 | Manage own staff | `staff_owner_all` | ✅ | UNVERIFIED |
| O5 | Manage own offers | `offers_owner_all` | ✅ | UNVERIFIED |
| O6 | Manage own hours | `salon_hours_owner_all` | ✅ | UNVERIFIED |
| O7 | Read own salon bookings | `bookings_owner_read` via `can_manage_salon_settings(salon_id)` | ✅ | UNVERIFIED |
| O8 | Allowed booking operations | `update_booking_status_secure` — owner branch requires `can_manage_salon_settings` | ✅ | UNVERIFIED |
| O9 | Read/edit website config | `spw_owner_read` (read); write via `owner_gate_update` on `salon_public_websites` | ✅ | UNVERIFIED |
| O10 | Read assigned proposals | `owner_proposals_select` (`is_salon_owner(salon_id)`) | ✅ | UNVERIFIED |
| O11 | Request proposal changes | `review_salon_setup('request_changes')` — owner-gated | ✅ | UNVERIFIED |
| O12 | Approve/reject assigned proposal | `approve_proposal` → `review_salon_setup('approve')` owner-gated | ✅ | UNVERIFIED |
| O13 | Publish own salon website | `publish_salon_website` → `review_salon_setup('publish')` owner-gated | ✅ | UNVERIFIED |
| O14 | Read own earnings/payouts | `owner_payouts_owner_read`, `owner_payout_items_owner_read` via `can_manage_salon_settings` | ✅ | UNVERIFIED |
| O15 | Manage own media | `salon_media_owner_read/write/update/delete` on `storage.objects` (`salon-media` bucket) via `can_manage_salon_settings(storage_path_uuid(name,'salon'))` | ✅ | UNVERIFIED |

## 7.2 DENY (unrelated salon / protected data)

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| N1 | Update unrelated salon | `salons_owner_update_own` fails for non-member salon | ✅ | UNVERIFIED |
| N2 | Manage unrelated services/staff/offers/hours | `*_owner_all` via `can_manage_salon_settings(salon_id)` | ✅ | UNVERIFIED |
| N3 | Read unrelated private bookings | `bookings_owner_read` via `can_manage_salon_settings(salon_id)` | ✅ | UNVERIFIED |
| N4 | Read unrelated customer private data | no owner policy on customer tables (`customer_settings`, `saved_payment_methods`, `customer_reviews` are `auth.uid()`-scoped) | ✅ | UNVERIFIED |
| N5 | Approve unrelated proposal | `review_salon_setup` checks `can_manage_salon_settings(proposal.salon_id)` | ✅ | UNVERIFIED |
| N6 | Publish unrelated website | same owner gate | ✅ | UNVERIFIED |
| N7 | Read unrelated Owner finances | `owner_payouts_owner_read` via `can_manage_salon_settings(salon_id)` | ✅ | UNVERIFIED |
| N8 | Forge salon ID | ownership resolved server-side from `auth.uid()` | ✅ | UNVERIFIED |
| N9 | Gain permission via frontend role change | `guard_profile_platform_role` blocks `platform_role` update; role not read from client | ✅ | UNVERIFIED |

---

## 7.3 Notes / minor observations

1. **Delete not granted on `bookings` / `salon_public_websites`** — owner policies for these are
   select/update only (no `for delete`); under RLS, missing DELETE policy = deny = fail-closed.
   Likely intentional (bookings shouldn't be hard-deleted). Flag for confirmation, not a P0.
2. **`services`/`staff`/`offers`/`salon_hours` have overlapping policies** — `*_owner_all`
   (phase2, `for all`) plus `owner_gate_select/insert/update` (production gates). Both restrict to
   `can_manage_salon_settings`, so they are **additive, not conflicting**. Live `pg_policies` must
   confirm no stale duplicates.
3. **`organization_members` has no `CREATE TABLE` in the repo** (see Section 3/4) — the owner gate
   depends on this table existing live with `organization_id` + `is_active` + `user_id` columns.

---

## Ready-to-run live verification (read-only first)

```sql
-- owner gate functions + active-membership predicate
select proname, prosrc
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and proname in
  ('can_manage_salon_settings','owner_salon_ids','review_salon_setup','is_salon_owner');

-- owner-scoped policies (confirm USING + WITH CHECK on UPDATE)
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and policyname like '%owner%' or policyname like '%_owner_all'
order by tablename, cmd;

-- storage policies for salon-media
select policyname, cmd, qual, with_check
from pg_policies where schemaname='storage' and policyname like 'salon_media%';
```

Then run the ALLOW/DENY matrix with two owners in different organizations (Owner A acts on own
salon = ALLOW; on Owner B's salon = DENY; Customer/Partner = DENY on all owner surfaces).

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| OWNER ALLOW TESTS (live) | **BLOCKED** |
| OWNER DENY TESTS (live) | **BLOCKED** |
| OWNER RBAC RULES (static) | **PASS** |
| ACTIVE MEMBERSHIP ENFORCED | **PASS (static)** |
| ORG↔SALON MEMBERSHIP BINDING | **PASS (static)** |
| UPDATE USING + WITH CHECK | **PASS (static)** |
| FORGE SALON ID PREVENTED | **PASS (static)** |
| FRONTEND ROLE CHANGE PREVENTED | **PASS (static)** |

## EXACT REMAINING BLOCKERS
1. Supabase access + seeded Owner A/B (two organizations), Customer, Partner accounts + sandbox egress.
2. Live confirmation `organization_members` exists with the columns the owner gate joins on.
3. Live confirmation no stale/duplicate owner policies and no missing DELETE grants.

## NEXT REQUIRED ACTION
Provide Supabase read/write access for isolated test records; run the live ALLOW/DENY matrix.
Phase 6 remains unstarted; no live PASS is recorded.
