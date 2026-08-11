-- ============================================================================
-- Nexora — PHASE 1: Centralized Auth, Profiles, Roles and RLS
-- Date:    2026-08-11
-- Project: qwaehqsmodekbgvnaavz  (the ONE shared project for every Nexora app)
--
-- WHAT THIS DOES
--   1. Verifies/creates public.profiles linked 1:1 to auth.users(id).
--   2. Extends the role vocabulary with 'delivery_partner' and 'admin' while
--      KEEPING the live canonical values 'customer', 'business_user' and
--      'growth_partner'. Product aliases (user / shop_owner) are normalized
--      server-side, so no existing row, policy or app has to change.
--   3. Re-asserts the permanent role guard: platform_role can only be set by
--      the signup trigger or service_role. A client can never self-promote.
--   4. Standard RLS so a user reads/writes only their own profile, and admins
--      get read/administrative access through a non-recursive helper.
--
-- SAFETY
--   * Fully idempotent — safe to re-apply.
--   * No DROP TABLE, no data reset, no renames of live values.
--   * Additive only: existing customer/owner/partner flows keep working.
--
-- APPLY
--   Supabase Dashboard → SQL Editor → paste → Run
--   (or) psql "$SUPABASE_DB_URL" -f this_file.sql
--   Then verify:  select * from public.verify_phase1_auth();
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Prerequisites
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- `private` holds SECURITY DEFINER helpers that must never be callable by a
-- browser client. Nothing in this schema is exposed through PostgREST.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. profiles — one row per auth.users identity, shared by every Nexora app
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  full_name            text        not null default 'User',
  platform_role        text        not null default 'customer',
  is_active            boolean     not null default true,
  avatar_url           text,
  loyalty_points       integer     not null default 0,
  wallet_balance_paise bigint      not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Columns added over time; each guarded so re-application is a no-op.
alter table public.profiles add column if not exists full_name            text        not null default 'User';
alter table public.profiles add column if not exists platform_role        text        not null default 'customer';
alter table public.profiles add column if not exists is_active            boolean     not null default true;
alter table public.profiles add column if not exists avatar_url           text;
alter table public.profiles add column if not exists loyalty_points       integer     not null default 0;
alter table public.profiles add column if not exists wallet_balance_paise bigint      not null default 0;
alter table public.profiles add column if not exists created_at           timestamptz not null default now();
alter table public.profiles add column if not exists updated_at           timestamptz not null default now();

-- Phase 1 additions: contact + auditability for the new partner/admin roles.
alter table public.profiles add column if not exists phone           text;
alter table public.profiles add column if not exists email           text;
alter table public.profiles add column if not exists last_seen_at    timestamptz;
alter table public.profiles add column if not exists role_assigned_at timestamptz not null default now();
alter table public.profiles add column if not exists role_assigned_by uuid references auth.users (id);

comment on table  public.profiles is
  'Canonical Nexora identity. One row per auth.users id, shared by the website and every PWA.';
comment on column public.profiles.platform_role is
  'Authoritative role. Only the signup trigger or service_role may set it (see guard_profile_platform_role).';

-- ---------------------------------------------------------------------------
-- 2. Role vocabulary
--    Live values stay canonical; delivery_partner and admin are added.
--      user       → customer          (alias)
--      shop_owner → business_user     (alias)
-- ---------------------------------------------------------------------------
do $$
begin
  -- Replace the old 3-value constraint with the 5-value Phase 1 constraint.
  if exists (
    select 1
    from pg_constraint c
    join pg_class      t on t.oid = c.conrelid
    join pg_namespace  n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'profiles'
      and c.conname = 'profiles_platform_role_check'
  ) then
    alter table public.profiles drop constraint profiles_platform_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_platform_role_check
    check (platform_role in ('customer','business_user','growth_partner','delivery_partner','admin'));
end
$$;

-- Alias normalizer. Mirrors packages/auth/src/roles.ts exactly.
create or replace function private.normalize_platform_role(raw text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select case lower(regexp_replace(coalesce(trim(raw), ''), '\s+', '_', 'g'))
    when 'customer'          then 'customer'
    when 'user'              then 'customer'
    when 'client'            then 'customer'
    when 'consumer'          then 'customer'
    when 'business_user'     then 'business_user'
    when 'business-user'     then 'business_user'
    when 'shop_owner'        then 'business_user'
    when 'shop-owner'        then 'business_user'
    when 'shopowner'         then 'business_user'
    when 'owner'             then 'business_user'
    when 'business_owner'    then 'business_user'
    when 'merchant'          then 'business_user'
    when 'vendor'            then 'business_user'
    when 'growth_partner'    then 'growth_partner'
    when 'growth-partner'    then 'growth_partner'
    when 'growthpartner'     then 'growth_partner'
    when 'partner'           then 'growth_partner'
    when 'delivery_partner'  then 'delivery_partner'
    when 'delivery-partner'  then 'delivery_partner'
    when 'deliverypartner'   then 'delivery_partner'
    when 'delivery'          then 'delivery_partner'
    when 'rider'             then 'delivery_partner'
    when 'courier'           then 'delivery_partner'
    -- 'admin' is intentionally NOT mapped here: it is never self-service.
    else null
  end;
$$;

comment on function private.normalize_platform_role(text) is
  'Maps any accepted role alias to a canonical platform_role. Returns null for unknown or privileged input.';

-- ---------------------------------------------------------------------------
-- 3. Role helpers (non-recursive, safe inside RLS policies)
--
--    A policy on public.profiles must never SELECT public.profiles directly:
--    that recurses. These helpers are SECURITY DEFINER and bypass RLS.
-- ---------------------------------------------------------------------------
create or replace function private.current_platform_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.platform_role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active
  limit 1;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(private.current_platform_role() = 'admin', false);
$$;

-- Callable by the browser: lets an app ask "what am I?" in one round trip
-- without exposing anyone else's row.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select private.current_platform_role();
$$;

-- An RLS policy is evaluated as the CALLING role, so any helper used inside a
-- policy must be executable by `authenticated` — otherwise every query on the
-- table fails with "permission denied for function". These helpers are
-- SECURITY DEFINER and disclose only the caller's own role, so granting
-- execute leaks nothing: `anon` is still excluded entirely.
revoke all on function private.current_platform_role() from public, anon;
revoke all on function private.is_admin()              from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_platform_role() to authenticated;
grant execute on function private.is_admin()              to authenticated;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Signup trigger — the ONLY creator of a profile row
--
--    Reads raw_user_meta_data.signup_role, normalizes aliases, and refuses to
--    grant 'admin'. Runs for every app because they share auth.users.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  chosen_role    text;
  chosen_name    text;
begin
  requested_role := nullif(trim(new.raw_user_meta_data->>'signup_role'), '');
  chosen_role    := private.normalize_platform_role(requested_role);

  -- Unknown alias, missing value, or an attempt to self-assign 'admin'
  -- all collapse to the least-privileged role.
  if chosen_role is null then
    chosen_role := 'customer';
  end if;

  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'fullName'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'User'
  );

  insert into public.profiles (id, full_name, platform_role, is_active, email, phone)
  values (
    new.id,
    chosen_name,
    chosen_role,
    true,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do update set
    full_name = case
      when public.profiles.full_name in ('User', '') then excluded.full_name
      else public.profiles.full_name
    end,
    -- Never downgrade an established non-customer role on a repeat insert.
    platform_role = case
      when public.profiles.platform_role <> 'customer' then public.profiles.platform_role
      else excluded.platform_role
    end,
    email      = coalesce(public.profiles.email, excluded.email),
    is_active  = true,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in step with a verified email change.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- 6. Permanent role guard (v4)
--
--    profiles.platform_role is assigned once, server-side. An ordinary
--    authenticated client cannot insert a privileged role or change its own.
--    Only the trigger (postgres/supabase_auth_admin) or service_role may.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_platform_role()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  trusted  boolean;
begin
  trusted := jwt_role = 'service_role'
             or current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin');

  if not trusted then
    -- platform_role is immutable for everyone except service_role and the
    -- signup trigger. Even an admin must go through assign_platform_role().
    if tg_op = 'INSERT' and new.platform_role <> 'customer' then
      raise exception 'profiles.platform_role is assigned permanently by Nexora'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.platform_role is distinct from old.platform_role then
      raise exception 'profiles.platform_role is assigned permanently by Nexora'
        using errcode = '42501';
    end if;
    -- A user must not reactivate an account that staff deactivated;
    -- administrators may suspend/restore accounts.
    if tg_op = 'UPDATE'
       and new.is_active is distinct from old.is_active
       and not private.is_admin() then
      raise exception 'profiles.is_active is managed by Nexora'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.platform_role is distinct from old.platform_role then
    new.role_assigned_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_platform_role_guard on public.profiles;
create trigger trg_profiles_platform_role_guard
  before insert or update on public.profiles
  for each row execute function public.guard_profile_platform_role();

revoke all on function public.guard_profile_platform_role() from public, anon, authenticated;
grant execute on function public.guard_profile_platform_role() to service_role;

-- Balance/points are server-ledger fields: block direct client mutation.
create or replace function public.guard_profile_financial_fields()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  trusted  boolean;
begin
  trusted := jwt_role = 'service_role'
             or current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin');

  if not trusted and tg_op = 'UPDATE' then
    if new.wallet_balance_paise is distinct from old.wallet_balance_paise
       or new.loyalty_points is distinct from old.loyalty_points then
      raise exception 'Wallet and loyalty balances are maintained by the Nexora server ledger'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_financial_guard on public.profiles;
create trigger trg_profiles_financial_guard
  before update on public.profiles
  for each row execute function public.guard_profile_financial_fields();

revoke all on function public.guard_profile_financial_fields() from public, anon, authenticated;
grant execute on function public.guard_profile_financial_fields() to service_role;

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
--
--    Model:
--      * a user sees and edits exactly their own row
--      * admins may read every row and update operational fields
--      * anon has no access at all
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
-- Not even the table owner may bypass these policies.
alter table public.profiles force row level security;

drop policy if exists profiles_select_own          on public.profiles;
drop policy if exists profiles_insert_own          on public.profiles;
drop policy if exists profiles_update_own          on public.profiles;
drop policy if exists profiles_select_admin        on public.profiles;
drop policy if exists profiles_update_admin        on public.profiles;
drop policy if exists profiles_no_delete           on public.profiles;
drop policy if exists profiles_self_select         on public.profiles;
drop policy if exists profiles_self_update         on public.profiles;

-- SELECT: own row.
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- SELECT: admins see everyone (helper is SECURITY DEFINER → no recursion).
create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (private.is_admin());

-- INSERT: only for yourself. The trigger normally does this; the policy
-- exists so a legitimate self-heal cannot create someone else's row.
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE: own row. platform_role / is_active / balances are additionally
-- protected by the guard triggers above, so this cannot escalate privilege.
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE: admins may administer any row (still subject to the guards unless
-- the call arrives with service_role).
create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- DELETE: nobody. Identity removal cascades from auth.users only.
revoke delete on table public.profiles from anon, authenticated;

-- Column-level hardening. The earlier migration granted table-wide UPDATE,
-- which would override the column list below, so it is revoked first.
revoke all    on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant  select on table public.profiles to authenticated;
grant  insert on table public.profiles to authenticated;
-- A client may only ever write its own presentational fields. platform_role,
-- is_active, wallet_balance_paise and loyalty_points are NOT writable here;
-- staff operations go through assign_platform_role() / service_role.
grant  update (full_name, avatar_url, phone, last_seen_at, updated_at)
              on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Admin provisioning (service_role only — no public admin signup)
-- ---------------------------------------------------------------------------
create or replace function public.assign_platform_role(target_user uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized text;
  updated    public.profiles;
  jwt_role   text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and not private.is_admin() then
    raise exception 'Only Nexora administrators may assign platform roles'
      using errcode = '42501';
  end if;

  normalized := case when lower(trim(new_role)) = 'admin'
                     then 'admin'
                     else private.normalize_platform_role(new_role) end;
  if normalized is null then
    raise exception 'Unknown platform role: %', new_role using errcode = '22023';
  end if;

  update public.profiles
     set platform_role    = normalized,
         role_assigned_at = now(),
         role_assigned_by = auth.uid(),
         updated_at       = now()
   where id = target_user
  returning * into updated;

  if not found then
    raise exception 'No profile for user %', target_user using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke all on function public.assign_platform_role(uuid, text) from public, anon, authenticated;
grant execute on function public.assign_platform_role(uuid, text) to service_role;

comment on function public.assign_platform_role(uuid, text) is
  'Service-role/admin only. The single supported way to promote a user (including to admin).';

-- Suspend / restore an account. Admins call this instead of writing is_active
-- directly, because that column is not in the authenticated UPDATE grant.
create or replace function public.set_profile_active(target_user uuid, active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  updated  public.profiles;
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and not private.is_admin() then
    raise exception 'Only Nexora administrators may change account status'
      using errcode = '42501';
  end if;

  if target_user = auth.uid() and not active then
    raise exception 'An administrator cannot deactivate their own account'
      using errcode = '22023';
  end if;

  update public.profiles
     set is_active  = active,
         updated_at = now()
   where id = target_user
  returning * into updated;

  if not found then
    raise exception 'No profile for user %', target_user using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke all on function public.set_profile_active(uuid, boolean) from public, anon;
grant execute on function public.set_profile_active(uuid, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Backfill — every existing auth.users identity gets a profile
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, platform_role, is_active, email)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'fullName'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'User'
  ),
  coalesce(private.normalize_platform_role(u.raw_user_meta_data->>'signup_role'), 'customer'),
  true,
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Fill in emails captured before the column existed.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is distinct from u.email
   and p.email is null;

-- ---------------------------------------------------------------------------
-- 10. Indexes
-- ---------------------------------------------------------------------------
create index if not exists profiles_platform_role_idx on public.profiles (platform_role) where is_active;
create index if not exists profiles_email_idx         on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- 11. Self-test — run after applying
-- ---------------------------------------------------------------------------
create or replace function public.verify_phase1_auth()
returns table (check_name text, passed boolean, detail text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  return query select
    'profiles table exists'::text,
    to_regclass('public.profiles') is not null,
    coalesce(to_regclass('public.profiles')::text, 'missing');

  return query select
    'profiles.id references auth.users'::text,
    exists (
      select 1 from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'profiles' and c.contype = 'f'
        and pg_get_constraintdef(c.oid) ilike '%auth.users%'
    ),
    'foreign key to auth.users(id) on delete cascade';

  return query select
    'role vocabulary has 5 values'::text,
    (select pg_get_constraintdef(c.oid) from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relname = 'profiles'
        and c.conname = 'profiles_platform_role_check')
      ilike '%delivery_partner%admin%',
    coalesce((select pg_get_constraintdef(c.oid) from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'profiles' and c.conname = 'profiles_platform_role_check'), 'missing');

  return query select
    'RLS enabled and forced'::text,
    (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass),
    'relrowsecurity + relforcerowsecurity';

  return query select
    'RLS policies present'::text,
    (select count(*) >= 5 from pg_policies where schemaname = 'public' and tablename = 'profiles'),
    (select string_agg(policyname, ', ' order by policyname) from pg_policies
      where schemaname = 'public' and tablename = 'profiles');

  return query select
    'signup trigger installed'::text,
    exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal),
    'on_auth_user_created → handle_new_user()';

  return query select
    'role guard installed'::text,
    exists (select 1 from pg_trigger where tgname = 'trg_profiles_platform_role_guard' and not tgisinternal),
    'platform_role is immutable for non-service callers';

  return query select
    'no auth.users without a profile'::text,
    not exists (select 1 from auth.users u left join public.profiles p on p.id = u.id where p.id is null),
    (select coalesce(count(*)::text, '0') || ' orphaned users'
       from auth.users u left join public.profiles p on p.id = u.id where p.id is null);

  return query select
    'anon has no access to profiles'::text,
    not has_table_privilege('anon', 'public.profiles', 'select'),
    'anon must not read identities';

  return query select
    'alias normalizer maps product roles'::text,
    private.normalize_platform_role('user') = 'customer'
      and private.normalize_platform_role('shop_owner') = 'business_user'
      and private.normalize_platform_role('delivery') = 'delivery_partner'
      and private.normalize_platform_role('admin') is null,
    'user→customer, shop_owner→business_user, delivery→delivery_partner, admin→null';
end;
$$;

revoke all on function public.verify_phase1_auth() from public, anon, authenticated;
grant execute on function public.verify_phase1_auth() to service_role;

commit;

-- ============================================================================
-- POST-APPLY CHECKLIST
--
--   1. select * from public.verify_phase1_auth();       -- all passed = true
--
--   2. Supabase Dashboard → Authentication → URL Configuration
--      Site URL:      https://nexora-main-website.vercel.app
--      Redirect URLs (one per line — must match packages/auth/src/redirects.ts):
--        https://nexora-main-website.vercel.app/auth/callback
--        https://nexora-main-website.vercel.app/reset-password
--        https://custmer-fresh-app.vercel.app/auth/callback
--        https://custmer-fresh-app.vercel.app/reset-password
--        https://shop-onwer-pink-nexora-aap.vercel.app/auth/callback
--        https://shop-onwer-pink-nexora-aap.vercel.app/reset-password
--        https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app/auth/callback
--        https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app/reset-password
--        http://localhost:3000/auth/callback
--        http://localhost:3000/reset-password
--
--   3. Promote an administrator (service_role context only):
--        select public.assign_platform_role('<user-uuid>', 'admin');
--
--   4. Every app must ship the SAME values:
--        NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL =
--          https://qwaehqsmodekbgvnaavz.supabase.co
--        NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY = <anon key>
-- ============================================================================
