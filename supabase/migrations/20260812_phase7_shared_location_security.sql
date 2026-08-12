-- ============================================================================
-- PHASE 7 — one private user location + approved business location system
-- Shared Supabase project: qwaehqsmodekbgvnaavz
--
-- Identity is always auth.users.id / auth.uid(). Platform roles do not widen
-- private GPS access. Owner, Partner, Customer and Template routes therefore
-- reuse one row without making that row visible to one another.
-- ============================================================================

begin;

create schema if not exists private;
revoke all on schema private from public, anon;

-- ---------------------------------------------------------------------------
-- 1. PRIVATE USER GPS — exactly one row per global auth.users identity
-- ---------------------------------------------------------------------------

create table if not exists public.user_private_locations (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  latitude              double precision not null check (latitude between -90 and 90),
  longitude             double precision not null check (longitude between -180 and 180),
  accuracy_m            double precision not null check (accuracy_m between 0 and 100),
  altitude_m            double precision,
  altitude_accuracy_m   double precision check (altitude_accuracy_m is null or altitude_accuracy_m >= 0),
  speed_mps             double precision check (speed_mps is null or speed_mps >= 0),
  heading_degrees       double precision check (heading_degrees is null or heading_degrees between 0 and 360),
  captured_at           timestamptz not null,
  updated_at            timestamptz not null default now(),
  constraint user_private_locations_not_null_island check (not (latitude = 0 and longitude = 0))
);

comment on table public.user_private_locations is
  'Private last real device GPS fix. One row per auth.users.id; never a business location or fabricated fallback.';
comment on column public.user_private_locations.captured_at is
  'Original navigator.geolocation position timestamp. UI must label loaded rows saved/stale, never live.';

alter table public.user_private_locations enable row level security;

revoke all on table public.user_private_locations from public, anon, authenticated;
grant select, insert, update, delete on table public.user_private_locations to authenticated;
grant all on table public.user_private_locations to service_role;

drop policy if exists user_private_location_read_own on public.user_private_locations;
create policy user_private_location_read_own
  on public.user_private_locations
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_private_location_insert_own on public.user_private_locations;
create policy user_private_location_insert_own
  on public.user_private_locations
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_private_location_update_own on public.user_private_locations;
create policy user_private_location_update_own
  on public.user_private_locations
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_private_location_delete_own on public.user_private_locations;
create policy user_private_location_delete_own
  on public.user_private_locations
  for delete to authenticated
  using (user_id = auth.uid());

-- The browser cannot choose a target user_id. The global identity is derived
-- inside PostgreSQL from auth.uid() and is checked again by RLS.
create or replace function public.save_my_private_location(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision,
  p_altitude_m double precision default null,
  p_altitude_accuracy_m double precision default null,
  p_speed_mps double precision default null,
  p_heading_degrees double precision default null,
  p_captured_at timestamptz default now()
)
returns void
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_latitude is null or p_latitude not between -90 and 90
     or p_longitude is null or p_longitude not between -180 and 180
     or (p_latitude = 0 and p_longitude = 0) then
    raise exception 'invalid GPS coordinates' using errcode = '22023';
  end if;
  if p_accuracy_m is null or p_accuracy_m not between 0 and 100 then
    raise exception 'GPS accuracy is not distance-safe' using errcode = '22023';
  end if;
  if p_captured_at is null or p_captured_at > now() + interval '5 minutes' then
    raise exception 'invalid GPS timestamp' using errcode = '22023';
  end if;

  insert into public.user_private_locations (
    user_id, latitude, longitude, accuracy_m, altitude_m,
    altitude_accuracy_m, speed_mps, heading_degrees, captured_at, updated_at
  ) values (
    caller, p_latitude, p_longitude, p_accuracy_m, p_altitude_m,
    p_altitude_accuracy_m, p_speed_mps, p_heading_degrees, p_captured_at, now()
  )
  on conflict (user_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    accuracy_m = excluded.accuracy_m,
    altitude_m = excluded.altitude_m,
    altitude_accuracy_m = excluded.altitude_accuracy_m,
    speed_mps = excluded.speed_mps,
    heading_degrees = excluded.heading_degrees,
    captured_at = excluded.captured_at,
    updated_at = now()
  -- An old tab cannot overwrite a newer device reading.
  where excluded.captured_at >= public.user_private_locations.captured_at;
end
$fn$;

create or replace function public.clear_my_private_location()
returns void
language sql
security invoker
set search_path = ''
as $fn$
  delete from public.user_private_locations where user_id = auth.uid();
$fn$;

revoke all on function public.save_my_private_location(double precision,double precision,double precision,double precision,double precision,double precision,double precision,timestamptz) from public, anon;
grant execute on function public.save_my_private_location(double precision,double precision,double precision,double precision,double precision,double precision,double precision,timestamptz) to authenticated;
revoke all on function public.clear_my_private_location() from public, anon;
grant execute on function public.clear_my_private_location() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. BUSINESS/SALON COORDINATES — separate data with explicit approval
-- ---------------------------------------------------------------------------

create table if not exists public.business_locations (
  salon_id          uuid primary key references public.salons(id) on delete cascade,
  latitude          double precision not null check (latitude between -90 and 90),
  longitude         double precision not null check (longitude between -180 and 180),
  address_label     text check (address_label is null or char_length(address_label) <= 300),
  approval_status   text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  submitted_by      uuid not null references auth.users(id),
  submitted_at      timestamptz not null default now(),
  approved_by       uuid references auth.users(id),
  approved_at       timestamptz,
  rejection_reason  text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  updated_at        timestamptz not null default now(),
  constraint business_locations_not_null_island check (not (latitude = 0 and longitude = 0)),
  constraint business_locations_approval_metadata check (
    (approval_status = 'approved' and approved_at is not null)
    or approval_status <> 'approved'
  )
);

comment on table public.business_locations is
  'Salon coordinates, separate from private user GPS. Public only after backend approval and marketplace publication.';

alter table public.business_locations enable row level security;

revoke all on table public.business_locations from public, anon, authenticated;
-- Public and authenticated callers receive only non-identity columns. RLS then
-- limits public rows to approved, published salons and owner rows to own salons.
grant select (salon_id, latitude, longitude, address_label, approval_status, submitted_at, approved_at, updated_at)
  on public.business_locations to anon, authenticated;
grant all on table public.business_locations to service_role;

-- This boolean helper prevents the policy's publication check from being
-- accidentally suppressed by RLS on the underlying salons/website tables.
create or replace function public.is_public_business_location_salon(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from public.salons s
    join public.salon_public_websites w on w.salon_id = s.id
    where s.id = p_salon_id
      and s.verified = true
      and s.is_active = true
      and s.deleted_at is null
      and w.is_published = true
  );
$fn$;
revoke all on function public.is_public_business_location_salon(uuid) from public;
grant execute on function public.is_public_business_location_salon(uuid) to anon, authenticated, service_role;

-- The public catalog must be able to resolve only published website rows before
-- joining approved business coordinates. Restore the narrow browser grant used
-- by fetchCatalog; the existing is_published RLS policy still controls rows.
revoke select on table public.salon_public_websites from anon, authenticated;
grant select (salon_id, slug, template_key, config, is_published, published_at)
  on public.salon_public_websites to anon, authenticated;

drop policy if exists business_location_public_approved on public.business_locations;
create policy business_location_public_approved
  on public.business_locations
  for select to anon, authenticated
  using (
    approval_status = 'approved'
    and public.is_public_business_location_salon(salon_id)
  );

drop policy if exists business_location_owner_read_own on public.business_locations;
create policy business_location_owner_read_own
  on public.business_locations
  for select to authenticated
  using (private.can_manage_salon_settings(salon_id));

-- Direct browser writes are revoked. This RPC derives both owner and salon
-- authorization server-side and always resets changed coordinates to pending.
create or replace function public.submit_my_business_location(
  p_salon_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_address_label text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null or not private.can_manage_salon_settings(p_salon_id) then
    raise exception 'Shop Owner permission required' using errcode = '42501';
  end if;
  if p_latitude is null or p_latitude not between -90 and 90
     or p_longitude is null or p_longitude not between -180 and 180
     or (p_latitude = 0 and p_longitude = 0) then
    raise exception 'invalid business coordinates' using errcode = '22023';
  end if;

  insert into public.business_locations (
    salon_id, latitude, longitude, address_label, approval_status,
    submitted_by, submitted_at, approved_by, approved_at, rejection_reason, updated_at
  ) values (
    p_salon_id, p_latitude, p_longitude, nullif(trim(p_address_label), ''), 'pending',
    caller, now(), null, null, null, now()
  )
  on conflict (salon_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    address_label = excluded.address_label,
    approval_status = 'pending',
    submitted_by = caller,
    submitted_at = now(),
    approved_by = null,
    approved_at = null,
    rejection_reason = null,
    updated_at = now();

  return 'pending';
end
$fn$;

-- Approval is a backend operation. No frontend bundle receives service_role.
create or replace function public.review_business_location(
  p_salon_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  next_status text := case when p_approve then 'approved' else 'rejected' end;
begin
  update public.business_locations
  set approval_status = next_status,
      approved_by = auth.uid(),
      approved_at = case when p_approve then now() else null end,
      rejection_reason = case when p_approve then null else nullif(trim(p_reason), '') end,
      updated_at = now()
  where salon_id = p_salon_id;
  if not found then raise exception 'business location not found'; end if;
  return next_status;
end
$fn$;

revoke all on function public.submit_my_business_location(uuid,double precision,double precision,text) from public, anon;
grant execute on function public.submit_my_business_location(uuid,double precision,double precision,text) to authenticated;
revoke all on function public.review_business_location(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.review_business_location(uuid,boolean,text) to service_role;

-- Stop the broad salons table grant from leaking unapproved legacy coordinate
-- columns. Preserve every other live column dynamically so schema drift does
-- not break Owner/Customer clients. RLS still controls rows.
do $block$
declare
  readable_columns text;
  writable_columns text;
begin
  revoke select on table public.salons from anon, authenticated;
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into readable_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'salons'
    and column_name not in ('latitude','longitude','lat','lng','location_latitude','location_longitude');
  if readable_columns is not null then
    execute 'grant select (' || readable_columns || ') on public.salons to anon, authenticated';
  end if;

  -- A table-level UPDATE grant would override column revokes, so replace it
  -- with safe column grants while existing owner RLS continues to restrict rows.
  revoke update on table public.salons from anon, authenticated;
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into writable_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'salons'
    and column_name not in (
      'id','organization_id','created_at',
      'latitude','longitude','lat','lng','location_latitude','location_longitude'
    );
  if writable_columns is not null then
    execute 'grant update (' || writable_columns || ') on public.salons to authenticated';
  end if;
end
$block$;

-- ---------------------------------------------------------------------------
-- 3. Operator verification surface (metadata only; no private coordinates)
-- ---------------------------------------------------------------------------

create or replace function public.verify_phase7_location_security()
returns table(check_name text, passed boolean, detail text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  select 'private_location_rls', c.relrowsecurity, 'user_private_locations RLS enabled'
  from pg_class c where c.oid = 'public.user_private_locations'::regclass
  union all
  select 'business_location_rls', c.relrowsecurity, 'business_locations RLS enabled'
  from pg_class c where c.oid = 'public.business_locations'::regclass
  union all
  select 'private_policy_count', count(*) = 4, count(*)::text || ' own-row policies'
  from pg_policies where schemaname = 'public' and tablename = 'user_private_locations'
  union all
  select 'business_public_approved_only', count(*) = 1, 'approved-public policy present'
  from pg_policies
  where schemaname = 'public' and tablename = 'business_locations'
    and policyname = 'business_location_public_approved';
$fn$;

revoke all on function public.verify_phase7_location_security() from public, anon;
grant execute on function public.verify_phase7_location_security() to authenticated, service_role;

commit;
