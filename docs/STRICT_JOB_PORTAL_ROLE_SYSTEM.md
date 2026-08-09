# Strict Job Portal Role System

## Source of truth

Jobs authorization uses `public.job_user_roles`, not URL state or local storage:

```sql
create table public.job_user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('job_seeker','employer','admin')),
  account_status text not null default 'active'
    check (account_status in ('active','suspended','deleted')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`user_id` is the primary key, so an auth user can hold exactly one Jobs role. Supabase Auth already enforces unique normalized email identities. The `job_register_role(requested_role)` RPC assigns once and returns `PORTAL_ROLE_MISMATCH:<existing_role>` on every attempted change. Direct insert/update/delete grants on `job_user_roles` are revoked from browser roles. Signup metadata uses `app_context='jobs'` and `job_role` so the trusted auth trigger creates the assignment.

Wrong-role signup/login error:

```text
An account with this email already exists as a Job Seeker/Employer.
Please use a different email or log in.
```

## Dashboard routing

Canonical integrated dashboards:

```text
job_seeker → /job-portal/dashboard/seeker
employer   → /job-portal/dashboard/employer
```

Compatibility aliases redirect safely:

```text
/dashboard/seeker  → /job-portal/dashboard/seeker
/dashboard/employer → /job-portal/dashboard/employer
```

The Job Portal URL resolver marks dashboard and resource routes as protected and attaches a required role. Before rendering a protected destination, the app loads `job_user_roles` through RLS, hydrates the workspace for the server role, and ignores or canonicalizes a mismatched URL. Employer and seeker switch controls do not exist.

## RLS isolation summary

- `job_user_roles`: users read only their row; no browser role mutation.
- `job_seeker_profiles`: candidate owns writes; employer read requires an application relationship; admin is server-authorized.
- `job_candidate_*`: owner writes; employer reads only through related applications. Resume access additionally requires the selected application relationship.
- `job_posts`: public reads only published, active, unexpired jobs; active salon members manage their salon's jobs.
- `job_saved_jobs`, `job_saved_searches`: `user_id = auth.uid()` and `job_seeker` role.
- `job_applications`: candidate reads own; employer reads only jobs belonging to active salon membership. Status writes are RPC-only.
- `job_interview_*`, `job_offers`: candidate or active related salon member only; transitions are RPC-only.
- `job_conversations`, `job_messages`: only the candidate and employer participant IDs.
- `job_notifications`, `job_support_*`, `job_reports`: own rows or admin policy.
- `job_audit_log`: admin read; browser writes revoked.
- Private Storage paths authorize owner/application/salon relationship; no private bucket was made public.

Critical workflows continue through `publish_job`, `submit_job_application`, `shortlist_application`, `create_interview_request`, `send_job_offer`, and `mark_candidate_hired`.

## Auth flow

1. Signup selects `job_seeker` or `employer` and sends it in auth metadata.
2. Signup activates immediately because verification email was intentionally disabled.
3. Trusted trigger creates the single `job_user_roles` row.
4. Login authenticates the password, calls `job_register_role` as a validation check, and signs out on mismatch.
5. `getUserRole()` reads the authoritative assignment; no fallback role is trusted.
6. Dashboard route derives from that role.
7. RLS re-checks every database call even if UI routing is bypassed.

## Integrity verification

Live staging verification retained after this routing update:

- 35 Jobs tables, all 35 with RLS
- 57 Jobs policies
- 9 Jobs migrations
- 7 required Storage buckets
- 6 Realtime tables
- 15/15 backend acceptance tests
- 7/7 password recovery tests
