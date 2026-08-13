# SECTION 3 — LIVE SCHEMA INVENTORY

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE INVENTORY — BLOCKED (no live Supabase access)

The audit rules are explicit: *"Repository migration को live database का proof न मानें"*
and *"Live Supabase state inspect करें."* A **live** schema inventory requires a
connection to `qwaehqsmodekbgvnaavz`. None is available in this environment:

| Capability | State |
| --- | --- |
| `supabase` CLI | absent |
| `SUPABASE_ACCESS_TOKEN` / Management API token | absent |
| Service-role key / Postgres connection string | absent |
| Network egress from sandbox to `*.supabase.co` | blocked |

Therefore **no live RLS / policy / grant / index value below is asserted as live truth.**
Everything in the "Declared" columns is extracted from the repository migrations only and
must be re-verified against the live database with the SQL script at the end of this report
(or the Supabase dashboard).

---

## Inventory legend

- **Declared** = present in repository migrations (NOT live-verified).
- **—** = not found in repository migrations (may or may not exist live; must be checked).
- **UNVERIFIED** = requires live inspection.

---

## 1. CORE IDENTITY

| Table | In repo | RLS (declared) | Owner/tenant column | PK | Grants (declared) | Policies (declared) |
| --- | --- | --- | --- | --- | --- | --- |
| `profiles` | ✅ | enabled | `id` (= `auth.uid()`) | `id uuid` | authenticated (RLS-scoped) | `profiles_select_own`, `profiles_insert_own`, `profiles_update_own` |
| `organizations` | ❌ (referenced only) | — | — | — | — | — |
| `organization_members` | ❌ (referenced + policy, no CREATE) | — | `user_id`? | — | `grant select … to authenticated` | `owner_gate_select` |
| `organization_member_permissions` | ❌ | — | — | — | — | — |
| `admin_users` | ❌ | — | — | — | — | — |

⚠️ **Repo gap:** `organizations` and `organization_members` have policies/grants in the
migrations but **no `CREATE TABLE`**. `owner_gate_select` is created `on public.organization_members`
without the table being defined anywhere in the repo. These must be located/verified live.

## 2. SALON

| Table | In repo | RLS | Owner/tenant | PK | Grants | Policies |
| --- | --- | --- | --- | --- | --- | --- |
| `salons` | ✅ | enabled | `owner_id` / org membership | `id uuid` | authenticated | `salons_owner_read_own`, `salons_owner_update_own`, `owner_gate_select`, `owner_gate_update` |
| `services` | ✅ | enabled | `salon_id` | `id uuid` | `grant all … authenticated` | `services_owner_all`, `services_public_read` |
| `staff` | ✅ | enabled | `salon_id` | `id uuid` | `grant all … authenticated` | `staff_owner_all`, `staff_public_read` |
| `offers` | ✅ | enabled | `salon_id` | `id uuid` | `grant all … authenticated` | `offers_owner_all`, `offers_public_read` |
| `salon_hours` | ✅ | enabled | `salon_id` | `id uuid` | `grant all … authenticated` | `salon_hours_owner_all`, `salon_hours_public_read` |
| `salon_public_websites` | ✅ | enabled | `salon_id` | `id uuid` | — | `spw_owner_read`, `spw_public_read_published` |
| `salon_media` | ❌ | — | — | — | — | — |

## 3. CUSTOMER

| Table | In repo | RLS | Owner/tenant | PK | Grants | Policies |
| --- | --- | --- | --- | --- | --- | --- |
| `bookings` | ✅ | enabled | `customer_id`/`user_id` (drift-safe) | `id uuid` | `grant all … authenticated` | `bookings_customer_own`, `bookings_owner_read`, `bookings_owner_update` |
| `booking_items` | ❌ | — | — | — | — | — |
| `booking_status_history` | ❌ | — | — | — | — | — |
| `customer_settings` | ✅ | enabled | `user_id` | `id uuid` | — | — (verify) |
| `favorite_salons` | ❌ (referenced in RLS DO block, no CREATE) | — | `user_id` | — | — | `customer_own_favorites` (add-if-missing) |
| `customer_reviews` | ✅ | enabled | `user_id` / `salon_id` | `id uuid` | — | — (verify) |
| `payments` | ❌ | — | — | — | — | — |
| `refunds` | ❌ | — | — | — | — | — |
| `notifications` | ❌ (referenced + `grant all`, no CREATE) | — | `user_id` | — | `grant all … authenticated` | — |
| `saved_payment_methods` | ✅ | enabled | `user_id` | `id uuid` | — | — (verify) |

⚠️ **Repo gaps:** `booking_items`, `booking_status_history`, `payments`, `refunds`,
`favorite_salons`, `notifications` are absent from repo migrations (some are referenced).
`notifications` has `grant all on table … to authenticated` but no `CREATE TABLE`.

## 4. PARTNER

| Table | In repo | RLS | Owner/tenant | PK | Grants | Policies |
| --- | --- | --- | --- | --- | --- | --- |
| `growth_partners` | ✅ | enabled | `user_id` | `id uuid` | `grant select … authenticated` | `partner_gate_select` |
| `shop_attributions` | ✅ | enabled | `growth_partner_id` | `id uuid` | `grant select … authenticated` | `partner_gate_select` |
| `salon_setup_proposals` | ✅ | enabled | `growth_partner_id` / `salon_id` | `id uuid` | `grant select … authenticated` | `partner_gate_select`, `owner_proposals_select`, `partner_proposals_select` |
| `salon_setup_proposal_versions` | ❌ (referenced, no CREATE) | — | `proposal_id` | — | — | — |
| `growth_partner_commissions` | ✅ | enabled | `growth_partner_id` | `id uuid` | service_role (settlement) | — (verify) |
| `partner_payout_accounts` | ✅ | enabled | `partner_id` | `id uuid` | — | `partner_gate_select` |
| `partner_payouts` | ✅ | enabled | `partner_id` | `id uuid` | — | `partner_gate_select` |
| `shop_onboarding_applications` | ✅ | enabled | `partner_id` | `id uuid` | `grant select … authenticated` | `partner_gate_select` |

## 5. JOBS (job-portal workspace, `job-portal/supabase/migrations/`)

All Job tables have RLS **enabled** via a `DO` loop over the table array, and a `DO` block
drops+recreates all `job_%` policies idempotently. Declared (unverified) policy highlights:

| Table | In repo | Owner/tenant | Policies (declared) |
| --- | --- | --- | --- |
| `job_user_roles` | ✅ | `user_id` | `job_roles_select_own` |
| `job_seeker_profiles` | ✅ | `user_id` | `job_candidate_profile_select_own_or_related`, `…_insert_own`, `…_update_own` |
| `job_employer_profiles` | ✅ | `user_id` | (verify — in `jobs_rls_storage.sql`) |
| `job_salon_members` | ✅ | `user_id` + `salon_id` | (verify) |
| `job_posts` | ✅ | `salon_id` | (verify) |
| `job_applications` | ✅ | `candidate_user_id` | (verify) |
| `job_interview_requests` | ✅ | `candidate_user_id`/`salon_id` | (verify) |
| `job_offers` | ✅ | `candidate_user_id` | (verify) |
| `job_notifications` | ✅ | `user_id` | (verify) |
| `job_messages` | ✅ | conversation/participant | (verify) |
| `job_support_tickets` | ✅ | `user_id` | (verify) |

Plus (declared): `job_skills`, `job_candidate_skills`, `job_candidate_experience`,
`job_candidate_education`, `job_candidate_certifications`, `job_candidate_resumes`,
`job_candidate_preferences`, `job_salon_profiles`, `job_salon_locations`,
`job_employer_verifications`, `job_post_skills`, `job_saved_jobs`,
`job_application_status_history`, `job_interview_schedule_history`, `job_saved_searches`,
`job_conversations`, `job_portfolio_items`, `job_support_messages`, `job_reports`,
`job_blocked_employers`, `job_audit_log`, `job_account_deletion_requests`.

## 6. Declared grants (functions — RLS helper surface)

Key server-owned (service_role-only) vs authenticated RPC grants:

- **service_role only:** `assign_platform_role`, `process_owner_payouts`,
  `process_payment_webhook`, `ingest_payment_webhook`, `release_growth_partner_commissions`,
  `mark_growth_partner_commissions_paid`, `mark_owner_payouts_paid`, `run_owner_daily_payouts`,
  `review_business_location`, `backfill_growth_partner_commissions`, `guard_profile_*`,
  `handle_new_user`, `log_audit`, `verify_phase1_auth`.
- **authenticated (fail-closed in body):** `is_salon_owner`, `is_proposal_attributed`,
  `approve_proposal`, `publish_salon_website`, `owner_salon_ids`, `update_booking_status_secure`,
  `update_salon_profile_secure`, `require_role`, `current_user_role`, `verify_phase3_rbac`.

## 7. Declared indexes (RLS predicate support)

Main: `profiles_platform_role_idx (platform_role) where is_active`, `bookings_salon_idx`,
`customer_reviews_salon_idx`, `customer_reviews_user_idx`, `offers_salon_idx`,
`services_salon_idx`, `staff_salon_idx`, `saved_payment_methods_user_idx`,
`wallet_transactions_user_idx`, `growth_partner_commissions_partner_status_idx`, etc.

Jobs: `job_applications_candidate_idx`, `job_applications_job_status_idx`,
`job_salon_members_user_idx`, `job_notifications_user_idx`, `job_messages_conversation_idx`,
`job_user_roles_role_idx`, `job_posts_salon_status_idx`, `job_posts_search_idx (gin)`,
`job_posts_title_trgm_idx`, and more (64 total `CREATE INDEX` statements across both workspaces).

⚠️ **Naming drift to verify live:** an index is declared `reviews_salon_idx … on public.reviews`
while the customer table is `customer_reviews` — likely a rename artifact. Confirm live.

---

## What must be verified LIVE (blocked items)

1. Existence of the 12+ tables absent from repo migrations (`organizations`,
   `organization_members`, `organization_member_permissions`, `admin_users`, `salon_media`,
   `booking_items`, `booking_status_history`, `payments`, `refunds`, `favorite_salons`,
   `notifications`, `salon_setup_proposal_versions`) — do they exist live and are they RLS-gated?
2. Actual RLS enablement per table (repo `ALTER TABLE … ENABLE RLS` may not reflect live).
3. Actual grants per role (`anon`, `authenticated`, `service_role`) via `information_schema.role_table_grants`.
4. Actual policies per operation (SELECT/INSERT/UPDATE/DELETE) via `pg_policies`.
5. Missing indexes on RLS predicates (e.g. `salon_id`, `user_id`, `customer_id`) via `pg_indexes`.

Run the SQL below in the Supabase SQL editor (read-only) to produce the live inventory.

---

## READY-TO-RUN LIVE INSPECTION (read-only SQL)

```sql
-- 1. RLS enablement
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Row-owner / tenant columns (uuid identity columns)
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and data_type = 'uuid'
  and column_name in ('id','user_id','owner_id','customer_id','salon_id','organization_id',
                      'growth_partner_id','candidate_user_id','employer_id','created_by','partner_id')
order by table_name, column_name;

-- 3. Primary keys
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- 4. Foreign keys
select tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_col
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;

-- 5. Grants by role
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;

-- 6. Policies by operation
select tablename, policyname, cmd, roles::text, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 7. Indexes (RLS predicate coverage)
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```
