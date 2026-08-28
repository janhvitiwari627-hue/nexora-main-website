-- Nexora Jobs: report the email-confirmation state alongside the portal role.
--
-- WHY: sign-up refused an already-registered email with "Please sign in
-- through the Job Seeker portal" — the screen the user was already on. The
-- unrecoverable case was an account whose verification email was never
-- opened: it can neither sign up (duplicate email) nor sign in ("Email not
-- confirmed"). job_email_portal_role only reported the role, so the client
-- could not tell "already registered" from "registered but never verified"
-- and could not offer a resend-verification recovery path.
--
-- This is additive: job_email_portal_role stays untouched, and the client
-- falls back to it when this function is absent, so deployments that have not
-- applied this migration keep working.

begin;

create or replace function public.job_email_portal_state(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(t)
  from (
    select coalesce(r.role, 'unassigned') as portal_role,
           (u.email_confirmed_at is not null) as email_confirmed
    from auth.users u
    left join public.job_user_roles r on r.user_id = u.id
    where lower(u.email) = lower(trim(p_email))
      and u.deleted_at is null
    order by u.created_at
    limit 1
  ) t
$$;

comment on function public.job_email_portal_state(text) is
  'Returns {portal_role, email_confirmed} for an email, or null when no account exists. Powers explicit portal signup validation and duplicate-email recovery.';

revoke execute on function public.job_email_portal_state(text) from public;
grant execute on function public.job_email_portal_state(text) to anon,authenticated;

commit;
