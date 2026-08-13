# SECTION 10 — JOBS RBAC / RLS

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website` (Jobs lives in `job-portal/` workspace)
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE TESTS BLOCKED — static analysis complete

Live ALLOW/DENY evidence requires authenticated Jobs test accounts (Job Seeker A/B, Employer A/B
on different salons, Admin) plus a connection to `qwaehqsmodekbgvnaavz`. Unavailable (no CLI /
token / connection string; sandbox egress blocked). **No live PASS is recorded.** No data was
created or modified.

---

## Jobs authority chain (verified statically)

Three `security definer`, `search_path=''` helpers anchor all Jobs authorization from `auth.uid()`:

- **`job_current_role()`** → `job_user_roles.role` where `user_id = auth.uid()` and `account_status='active'`.
- **`job_is_admin()`** → active `job_user_roles.role='admin'` **OR** active `profiles.platform_role='admin'`.
- **`job_is_active_salon_member(salon_id)`** → active `job_salon_members` row for `auth.uid()` with
  `member_role in ('owner','manager','recruiter')` AND `job_user_roles.role in ('employer','admin')`
  AND active salon (`s.is_active`, `s.deleted_at is null`).
- **`job_can_manage_application(id)`** → admin OR active salon member of the job's salon.

**Jobs shell entry is NOT gated by the main platform role** (verified): the main website only links
`window.location.assign("/job-portal")`; the Jobs SPA derives authority exclusively from
`job_user_roles` (its own role table), never from `profiles.platform_role` for seeker/employer.
Admin is the only place main `platform_role='admin'` is honored (and that's an additive OR).

---

## 10.1 Job Seeker ALLOW

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| S1 | Own role/profile | `job_roles_select_own` (`user_id=auth.uid()`); `job_candidate_profile_select_own_or_related` (self branch) | ✅ | UNVERIFIED |
| S2 | Own resume | `job_candidate_resumes_read` (own/related) + `job_candidate_resumes_write` (self) | ✅ | UNVERIFIED |
| S3 | Own skills/portfolio | `job_candidate_skills_*`, `job_candidate_experience_*`, `job_portfolio_read_related`/`write_own` | ✅ | UNVERIFIED |
| S4 | Own saved jobs | `job_saved_jobs_own` (`for all`, `user_id=auth.uid()`, seeker role) | ✅ | UNVERIFIED |
| S5 | Own applications | `job_applications_read_related` (`candidate_user_id=auth.uid()`) | ✅ | UNVERIFIED |
| S6 | Own interviews/offers/messages | `job_interviews_read_related`, `job_offers_read_related`, `job_messages_read_participant` (candidate branch) | ✅ | UNVERIFIED |
| S7 | Own notifications/support | `job_notifications_read_own`, `job_support_tickets_read` (own) | ✅ | UNVERIFIED |

## 10.2 Job Seeker DENY

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| N1 | Other seeker private profile | `…_select_own_or_related` restricts to self / admin / active-salon-member-of-applied-job | ✅ | UNVERIFIED |
| N2 | Other seeker applications | `job_applications_read_related` (`candidate_user_id` OR `can_manage_application` OR admin) | ✅ | UNVERIFIED |
| N3 | Employer-only mutations | `job_posts_member_update` etc. require `job_is_active_salon_member` | ✅ | UNVERIFIED |
| N4 | Admin approval | `approve_job`/`reject_job` require `job_is_admin()` (`ROLE_NOT_ALLOWED`) | ✅ | UNVERIFIED |
| N5 | Protected job-post management | `job_posts_member_update`/`_delete_draft` member-gated | ✅ | UNVERIFIED |

## 10.3 Employer ALLOW

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| E1 | Server-backed employer membership | `job_is_active_salon_member` (active member + employer role + active salon) | ✅ | UNVERIFIED |
| E2 | Own salon/employer profile | `job_salon_profiles_member_update`, `job_employer_profiles_update_own` | ✅ | UNVERIFIED |
| E3 | Own job posts | `job_posts_member_update` / `_delete_draft` via active membership | ✅ | UNVERIFIED |
| E4 | Own application pipeline | `job_applications_read_related` via `job_can_manage_application` | ✅ | UNVERIFIED |
| E5 | Candidate details for own jobs | `job_candidate_profile_select_own_or_related` (active-salon-member-of-applied-job branch); `job_resume_employer_read` | ✅ | UNVERIFIED |
| E6 | Own interviews/offers/messages | `job_interviews_read_related` (`job_is_active_salon_member`), `job_offer_related_access` | ✅ | UNVERIFIED |

## 10.4 Employer DENY

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| N6 | Unrelated employer records | all employer policies key to `job_is_active_salon_member(salon_id)` | ✅ | UNVERIFIED |
| N7 | Unrelated candidate data | candidate read requires self / applied-to-own-job / admin | ✅ | UNVERIFIED |
| N8 | Self-approval of protected verification | `job_verifications_read` = `submitted_by=auth.uid()` (read only); approval is admin-only (approve/reject RPCs) | ✅ | UNVERIFIED |
| N9 | Forged salon membership | `job_is_active_salon_member` joins `job_salon_members` by `auth.uid()` + active status — a forged `salon_id` fails | ✅ | UNVERIFIED |
| N10 | Direct admin mutation | `approve_job`/`reject_job`/`publish_job` require `job_is_admin()` | ✅ | UNVERIFIED |

---

## 10.5 Observations

1. **`job_is_admin()` is an OR of two sources** — active `job_user_roles.role='admin'` **or** active
   `profiles.platform_role='admin'`. This means a main-platform admin is implicitly a Jobs admin.
   Intentional (single admin identity), but it is the one place platform role *does* influence Jobs;
   seeker/employer roles do not. Flag for confirmation, not a P0.
2. **Storage policies use `storage.foldername(name)` UUID parsing** (`job_verification_member_access`,
   `job_offer_related_access`) — the UUID regex guard is correct, but this pattern is more fragile
   than a column FK; verify the buckets enforce this at upload time too.
3. **`job_posts_member_update` has `with check(… and created_by is not null)`** — a subtle constraint;
   confirm it does not block legitimate member edits where `created_by` is null for legacy posts.
4. Admin approval writes `job_audit_log` (✅ canonical audit) and uses `set_config('app.job_trusted_status_change','yes',true)` before the status update — a trust-flag that a hardening trigger must consume; verify that trigger exists live (`job_posts` status transition guard).

---

## Ready-to-run live verification (read-only first)

```sql
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.proname in ('job_current_role','job_is_admin','job_is_active_salon_member',
                    'job_can_manage_application','approve_job','reject_job','publish_job','submit_job_for_approval');

select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename like 'job\_%' escape '\'
order by tablename, cmd;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name in ('approve_job','reject_job','submit_job_for_approval','publish_job')
order by routine_name, grantee;
```

Then exercise live: Seeker A own profile/application/resume = ALLOW; Seeker B = DENY; Employer A
own salon pipeline = ALLOW; Employer B / unrelated salon = DENY; Employer self-approve = DENY;
Admin approve = ALLOW; `UPDATE job_posts` status directly = DENY.

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| JOB SEEKER ALLOW TESTS (live) | **BLOCKED** |
| JOB SEEKER DENY TESTS (live) | **BLOCKED** |
| EMPLOYER ALLOW TESTS (live) | **BLOCKED** |
| EMPLOYER DENY TESTS (live) | **BLOCKED** |
| JOBS RBAC RULES (static) | **PASS** |
| JOBS SHELL NOT GATED BY PLATFORM ROLE | **PASS (static)** — authority from `job_user_roles` |
| ADMIN APPROVAL SERVER-ENFORCED | **PASS (static)** |
| FORGED MEMBERSHIP PREVENTED | **PASS (static)** |

## EXACT REMAINING BLOCKERS
1. Supabase access + seeded Seeker A/B, Employer A/B (two salons), Admin accounts + sandbox egress.
2. Live confirmation of the `job_posts` status-transition trigger (consumes `app.job_trusted_status_change`).
3. Live confirmation of the Jobs RLS policies/grant surface (idempotent drop+recreate migration may differ live).

## NEXT REQUIRED ACTION
Provide Supabase read/write access for isolated test records; run the live ALLOW/DENY matrix.
Phase 6 remains unstarted; no live PASS is recorded.
