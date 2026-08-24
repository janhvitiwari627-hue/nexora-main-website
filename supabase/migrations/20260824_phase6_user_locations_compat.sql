-- ============================================================================
-- PHASE 6 — LOCATION DATABASE CONTRACT
-- Shared Supabase project: qwaehqsmodekbgvnaavz
--
-- The canonical secure location system (Phase 7 migration) remains the ONLY
-- location authority:
--
--     browser GPS
--        ↓
--     save_my_private_location(...)        ← validates + derives identity
--        ↓
--     auth.uid()
--        ↓
--     user_private_locations               ← canonical, one row per identity
--        ↓
--     compatibility synchronization        ← trigger in THIS migration
--        ↓
--     user_locations                       ← derived compat mirror
--
-- public.user_locations exists only for Sub-Apps that still read/write the
-- legacy name. It is populated by the canonical pipeline and never competes
-- with it: nothing here writes back into user_private_locations, and no new
-- write RPC is introduced. Direct access is possible but strictly own-row:
-- auth.uid() = user_id for SELECT / INSERT / UPDATE / DELETE, with no public
-- or anonymous access of any kind.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Compatibility table — same physical validity rules as the canonical row
-- ---------------------------------------------------------------------------

create table if not exists public.user_locations (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  accuracy_m  double precision check (accuracy_m is null or accuracy_m between 0 and 100),
  captured_at timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint user_locations_not_null_island check (not (latitude = 0 and longitude = 0))
);

comment on table public.user_locations is
  'Legacy-compatibility mirror of user_private_locations, maintained by the canonical pipeline (save_my_private_location -> sync trigger). Not a second location authority. Direct access is own-row only via RLS.';
comment on column public.user_locations.captured_at is
  'Original device GPS timestamp copied from the canonical row (or supplied by a legacy own-row write). Never a fabricated coordinate.';

alter table public.user_locations enable row level security;

-- No public or anonymous access. authenticated goes through RLS only.
revoke all on table public.user_locations from public, anon, authenticated;
grant select, insert, update, delete on table public.user_locations to authenticated;
grant all on table public.user_locations to service_role;

-- ---------------------------------------------------------------------------
-- 2. Own-row policies: auth.uid() = user_id for all four verbs
-- ---------------------------------------------------------------------------

drop policy if exists user_locations_select_own on public.user_locations;
create policy user_locations_select_own
  on public.user_locations
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_locations_insert_own on public.user_locations;
create policy user_locations_insert_own
  on public.user_locations
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_locations_update_own on public.user_locations;
create policy user_locations_update_own
  on public.user_locations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_locations_delete_own on public.user_locations;
create policy user_locations_delete_own
  on public.user_locations
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Compatibility synchronization: canonical row → compat row (one way)
--
-- SECURITY DEFINER so the mirror write succeeds regardless of which verified
-- path (RPC or own-row RLS write) touched the canonical table. It copies only
-- values that already passed the canonical validation; identity is the
-- canonical row's user_id, which RLS/RPC already proved is auth.uid().
-- ---------------------------------------------------------------------------

create or replace function private.sync_user_locations_compat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' then
    delete from public.user_locations where user_id = old.user_id;
    return old;
  end if;

  insert into public.user_locations (
    user_id, latitude, longitude, accuracy_m, captured_at, updated_at
  ) values (
    new.user_id, new.latitude, new.longitude, new.accuracy_m, new.captured_at, now()
  )
  on conflict (user_id) do update set
    latitude    = excluded.latitude,
    longitude   = excluded.longitude,
    accuracy_m  = excluded.accuracy_m,
    captured_at = excluded.captured_at,
    updated_at  = now()
  -- The canonical pipeline never regresses the mirror to an older fix.
  where excluded.captured_at >= public.user_locations.captured_at;

  return new;
end
$fn$;

revoke all on function private.sync_user_locations_compat() from public, anon, authenticated;

drop trigger if exists user_private_locations_sync_compat on public.user_private_locations;
create trigger user_private_locations_sync_compat
  after insert or update or delete on public.user_private_locations
  for each row execute function private.sync_user_locations_compat();

-- ---------------------------------------------------------------------------
-- 4. Operator verification surface (metadata only; no private coordinates)
-- ---------------------------------------------------------------------------

create or replace function public.verify_phase6_user_locations_contract()
returns table(check_name text, passed boolean, detail text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  select 'user_locations_rls', c.relrowsecurity, 'user_locations RLS enabled'
  from pg_class c where c.oid = 'public.user_locations'::regclass
  union all
  select 'user_locations_policy_count', count(*) = 4, count(*)::text || ' own-row policies (select/insert/update/delete)'
  from pg_policies where schemaname = 'public' and tablename = 'user_locations'
  union all
  select 'user_locations_all_verbs_own_row',
         bool_and(coalesce(qual, with_check) like '%auth.uid()%user_id%'
                  or coalesce(qual, with_check) like '%user_id%auth.uid()%'),
         'every policy compares auth.uid() with user_id'
  from pg_policies where schemaname = 'public' and tablename = 'user_locations'
  union all
  select 'user_locations_no_anon_access',
         not has_table_privilege('anon', 'public.user_locations', 'select')
     and not has_table_privilege('anon', 'public.user_locations', 'insert')
     and not has_table_privilege('anon', 'public.user_locations', 'update')
     and not has_table_privilege('anon', 'public.user_locations', 'delete'),
         'anon has no privilege on user_locations'
  union all
  select 'compat_sync_trigger',
         count(*) = 1,
         'user_private_locations -> user_locations sync trigger present'
  from pg_trigger
  where tgrelid = 'public.user_private_locations'::regclass
    and tgname = 'user_private_locations_sync_compat'
    and not tgisinternal;
$fn$;

revoke all on function public.verify_phase6_user_locations_contract() from public, anon;
grant execute on function public.verify_phase6_user_locations_contract() to authenticated, service_role;

commit;
