begin;

-- Compatibility layer for all Nexora sub-apps. The canonical private GPS
-- source remains user_private_locations; this table provides the requested
-- stable user_locations contract without weakening the existing RLS model.
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  updated_at timestamptz not null default now()
);
create unique index if not exists user_locations_one_per_user on public.user_locations(user_id);
alter table public.user_locations enable row level security;
revoke all on table public.user_locations from public, anon, authenticated;
grant select, insert, update, delete on public.user_locations to authenticated;

drop policy if exists user_locations_select_own on public.user_locations;
create policy user_locations_select_own on public.user_locations for select to authenticated using (user_id = auth.uid());
drop policy if exists user_locations_insert_own on public.user_locations;
create policy user_locations_insert_own on public.user_locations for insert to authenticated with check (user_id = auth.uid());
drop policy if exists user_locations_update_own on public.user_locations;
create policy user_locations_update_own on public.user_locations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists user_locations_delete_own on public.user_locations;
create policy user_locations_delete_own on public.user_locations for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_private_location_to_user_locations()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  insert into public.user_locations(user_id, latitude, longitude, updated_at)
  values (new.user_id, new.latitude, new.longitude, now())
  on conflict (user_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    updated_at = now();
  return new;
end
$fn$;

drop trigger if exists trg_sync_private_location_to_user_locations on public.user_private_locations;
create trigger trg_sync_private_location_to_user_locations
after insert or update on public.user_private_locations
for each row execute function public.sync_private_location_to_user_locations();

-- Existing profiles are richer than the minimal requested contract. Keep the
-- established platform_role authorization field and expose a compatibility
-- role field that clients cannot mutate after creation.
alter table public.profiles add column if not exists role text;
update public.profiles set role = platform_role where role is null;

create or replace function public.sync_profile_compat_fields()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if tg_op = 'INSERT' then
    new.role := coalesce(new.role, new.platform_role, 'customer');
    new.email := coalesce(new.email, (select u.email from auth.users u where u.id = new.id));
  else
    new.role := old.role;
  end if;
  return new;
end
$fn$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before insert or update on public.profiles
for each row execute function public.sync_profile_compat_fields();

update public.profiles p
set email = coalesce(p.email, u.email), role = p.platform_role
from auth.users u
where u.id = p.id;

commit;
