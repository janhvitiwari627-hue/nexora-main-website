-- Nexora v3 — permanent platform role guard
--
-- profiles.platform_role is the only role authority. A URL, client metadata
-- field, or browser storage value must never promote an authenticated user.
-- The auth trigger and trusted server migrations can assign a role; ordinary
-- authenticated clients cannot change it after the profile is created.

create or replace function public.guard_profile_platform_role()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin', 'supabase_auth_admin') then
    if tg_op = 'INSERT' and new.platform_role <> 'customer' then
      raise exception 'profiles.platform_role is assigned permanently by Nexora';
    end if;
    if tg_op = 'UPDATE' and new.platform_role is distinct from old.platform_role then
      raise exception 'profiles.platform_role is assigned permanently by Nexora';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_platform_role_guard on public.profiles;
create trigger trg_profiles_platform_role_guard
before insert or update of platform_role on public.profiles
for each row execute function public.guard_profile_platform_role();

revoke all on function public.guard_profile_platform_role() from public, anon, authenticated;
grant execute on function public.guard_profile_platform_role() to service_role;
