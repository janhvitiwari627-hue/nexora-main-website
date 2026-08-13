# SECTION 6 — CUSTOMER RBAC / RLS

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE TESTS BLOCKED — static analysis complete

Live ALLOW/DENY evidence requires authenticated Supabase test accounts (Customer A / Customer B,
Owner, Partner) and a connection to `qwaehqsmodekbgvnaavz`. Neither is available (no CLI / token /
connection string; sandbox egress blocked). **No live PASS is recorded.** No data was created or
modified.

The table below maps each required test to its **repo-declared** rule and a static verdict; live
confirmation of every row remains **UNVERIFIED**.

---

## 6.1 ALLOW (customer self) — declared rules vs. live

| # | Test | Declared rule (repo) | Static | Live |
| --- | --- | --- | --- | --- |
| A1 | Create booking for authenticated self | ⚠️ **no `INSERT` policy / no booking-create RPC in this repo** (customer PWA is a separate deployment `custmer-fresh-app`) | **GAP** | UNVERIFIED |
| A2 | Read own booking | `bookings_customer_own` SELECT `auth.uid() = customer_id` | OK | UNVERIFIED |
| A3 | Read own booking items | `booking_items` table **not in repo** | GAP | UNVERIFIED |
| A4 | Read own payment/refund display state | `payments`/`refunds` **not in repo** | GAP | UNVERIFIED |
| A5 | Read/update own customer settings | `customer_settings_owner` `for all` `auth.uid()=user_id` | OK | UNVERIFIED |
| A6 | Read/write own favourites | `customer_own_favorites` (Phase 3 DO block, add-if-missing) | OK (drift-guarded) | UNVERIFIED |
| A7 | Create/manage own allowed review | `customer_reviews_insert_own/update_own/delete_own` `auth.uid()=user_id` | OK | UNVERIFIED |
| A8 | Read own notifications | `notifications_self_all` `for all` `user_id=auth.uid()` | OK | UNVERIFIED |
| A9 | Perform allowed cancellation | `update_booking_status_secure` — customer branch requires `customer_id = caller` | OK | UNVERIFIED |
| A10 | Update only customer-editable fields | `profiles_update_own` (scoped); `guard_profile_platform_role` blocks `platform_role` change | OK | UNVERIFIED |

## 6.2 DENY (customer cannot act on others / protected data) — declared rules vs. live

| # | Test | Declared rule (repo) | Static | Live |
| --- | --- | --- | --- | --- |
| D1 | Create booking for another customer ID | depends on booking-create path (**not in repo**) | GAP | UNVERIFIED |
| D2 | Read another customer's booking | `bookings_customer_own` restricts to `customer_id = auth.uid()` | OK | UNVERIFIED |
| D3 | Update/delete another customer's booking | `bookings_owner_update` requires `can_manage_salon_settings`; customer update only via RPC with `is_customer` check | OK | UNVERIFIED |
| D4 | Read another customer's payment/refund | `payments`/`refunds` **not in repo** | GAP | UNVERIFIED |
| D5 | Change protected booking ownership | no declared path; RPC uses `auth.uid()` + profile role | OK | UNVERIFIED |
| D6 | Change salon ownership | `salons_owner_update_own` → `can_manage_salon_settings`; `organization_members` gate | OK | UNVERIFIED |
| D7 | Falsify booking status | `update_booking_status_secure` role/ownership matrix | OK | UNVERIFIED |
| D8 | Falsify payment/refund/settlement state | settlement RPCs are `service_role`-only (`mark_*_paid`, `process_*`) | OK | UNVERIFIED |
| D9 | Manage salon settings | `salons_owner_update_own`, `private.can_manage_salon_settings` (owner-only) | OK | UNVERIFIED |
| D10 | Manage services/staff/offers/hours | `*_owner_all` policies via `can_manage_salon_settings` | OK | UNVERIFIED |
| D11 | Edit proposals | `salon_setup_proposals` select restricted to owner/partner; no customer policy | OK | UNVERIFIED |
| D12 | Publish salon website | `publish_salon_website` requires `is_salon_owner` (owner-only) | OK | UNVERIFIED |
| D13 | Read Owner/Partner private financial data | `partner_payouts`/`owner_payouts`/commissions gated to owner/partner; customer has no grant/policy | OK | UNVERIFIED |

---

## 6.3 Booking creation — trusted identity question

**Finding: cannot be verified from this repository.** The main website repo has **no booking
`INSERT` policy and no booking-creation RPC**. Booking creation is owned by the Customer PWA
(`custmer-fresh-app.vercel.app`), which is a **separate repository not present in this workspace**.

- The only booking mutation surface in this repo is `update_booking_status_secure`, which is
  correctly identity-trusted: `security definer`, `caller := auth.uid()`, active-profile role
  resolution from `profiles.platform_role`, `is_customer := booking_record.customer_id = caller`,
  and an explicit `customers may only update their own bookings` guard.
- The ALLOW test "create booking for authenticated self" and DENY test "create booking for another
  customer ID" therefore require inspecting the **Customer PWA** backend + the live `bookings`
  insert policy/RPC on `qwaehqsmodekbgvnaavz`. That is outside this repo and unverifiable here.

**Risk:** if the live `bookings` table has no `for insert` policy, an authenticated client could
potentially insert a row with an arbitrary `customer_id`. This is the single highest-priority
customer RLS item to confirm live.

---

## 6.4 Ready-to-run live test (SQL + PostgREST)

Once access is available, produce positive ALLOW and negative DENY evidence with two seeded
customer accounts and a partner/owner account. Read-only inspection first:

```sql
-- bookings insert/update/delete policies
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename in ('bookings','booking_items','payments','refunds',
      'customer_settings','favorite_salons','customer_reviews','notifications','saved_payment_methods')
order by tablename, cmd;

-- grants to authenticated on customer tables
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public' and grantee='authenticated'
  and table_name in ('bookings','booking_items','payments','refunds','customer_settings',
      'favorite_salons','customer_reviews','notifications','saved_payment_methods')
order by table_name, privilege_type;

-- does a bookings INSERT policy or creation RPC exist?
select proname, pg_get_function_identity_arguments(oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and proname ilike '%booking%' order by proname;
```

Then run the ALLOW/DENY matrix via `auth.getUser()`-authenticated clients (Customer A acts,
Customer B must be denied; Partner/Owner must be denied customer financial writes).

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| CUSTOMER ALLOW TESTS (live) | **BLOCKED** |
| CUSTOMER DENY TESTS (live) | **BLOCKED** |
| CUSTOMER RBAC RULES (static) | **PARTIAL** — settings/favourites/reviews/notifications/cancellation OK; **booking create + booking_items + payments/refunds absent from repo** |
| BOOKING CREATE USES TRUSTED IDENTITY | **UNVERIFIED** (owned by Customer PWA, outside this repo) |
| PROTECTED FIELDS / STATUS FALSIFICATION | **PASS (static)** — `security definer` RPC + `service_role`-only settlement |

## EXACT REMAINING BLOCKERS
1. Supabase access + seeded test accounts (Customer A/B, Owner, Partner) + sandbox egress.
2. Live confirmation of `bookings` INSERT policy / creation RPC (highest priority — potential
   arbitrary-`customer_id` insert if unguarded).
3. Live confirmation of `booking_items`, `payments`, `refunds`, `favorite_salons`, `notifications`
   existence and RLS.
4. Customer PWA backend (separate repo) for the booking-creation identity path.

## NEXT REQUIRED ACTION
Provide Supabase read/write access for isolated test records; then execute the live ALLOW/DENY
matrix. Phase 6 remains unstarted; no live PASS is recorded.
