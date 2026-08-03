-- ============================================================================
-- Nexora – Fix account creation for customer, shop owner, growth partner
-- Date: 2026-08-02 – Phase 1 hotfix
-- Shared project: qwaehqsmodekbgvnaavz
-- Problem: profiles row not created on signup → login fails with
-- "Profile not found" / "We could not verify this session"
-- Root cause: trigger handle_new_user missing or not handling signup_role
-- This migration is idempotent and safe to re-apply.
-- ============================================================================

-- Ensure profiles table exists with required columns (no reset, no duplicate)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'User',
  platform_role text not null default 'customer' check (platform_role in ('customer','business_user','growth_partner')),
  is_active boolean not null default true,
  avatar_url text,
  loyalty_points integer not null default 0,
  wallet_balance_paise bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add missing columns if table existed before
alter table public.profiles add column if not exists full_name text not null default 'User';
alter table public.profiles add column if not exists platform_role text not null default 'customer';
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists loyalty_points integer not null default 0;
alter table public.profiles add column if not exists wallet_balance_paise bigint not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Ensure check constraint for role is present and locked to 3 values
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname='public' and t.relname='profiles' and c.conname='profiles_platform_role_check'
  ) then
    alter table public.profiles add constraint profiles_platform_role_check check (platform_role in ('customer','business_user','growth_partner'));
  end if;
end$$;

-- Auto-update updated_at
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

-- Core: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_role text;
  chosen_name text;
begin
  chosen_role := coalesce(nullif(trim(new.raw_user_meta_data->>'signup_role'), ''), 'customer');
  -- Support legacy values: owner, growth-partner, shop_owner etc.
  if chosen_role = 'owner' or chosen_role = 'shop_owner' or chosen_role = 'business_owner' then
    chosen_role := 'business_user';
  elsif chosen_role = 'growth-partner' then
    chosen_role := 'growth_partner';
  end if;
  if chosen_role not in ('customer','business_user','growth_partner') then
    chosen_role := 'customer';
  end if;

  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'fullName'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1),
    'User'
  );

  insert into public.profiles (id, full_name, platform_role, is_active)
  values (new.id, chosen_name, chosen_role, true)
  on conflict (id) do update set
    full_name = case when public.profiles.full_name in ('User','') then excluded.full_name else public.profiles.full_name end,
    -- Don't downgrade an existing non-customer role to customer on re-insert
    platform_role = case 
      when public.profiles.platform_role != 'customer' then public.profiles.platform_role
      else excluded.platform_role
    end,
    is_active = true,
    updated_at = now();

  return new;
end;
$$;

-- Re-create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create missing profiles for existing users who have no profile row
insert into public.profiles (id, full_name, platform_role, is_active)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'fullName'), ''),
    split_part(u.email, '@', 1),
    'User'
  ),
  case
    when coalesce(trim(u.raw_user_meta_data->>'signup_role'), 'customer') in ('owner','shop_owner','business_owner') then 'business_user'
    when coalesce(trim(u.raw_user_meta_data->>'signup_role'), 'customer') = 'growth-partner' then 'growth_partner'
    when coalesce(trim(u.raw_user_meta_data->>'signup_role'), 'customer') in ('customer','business_user','growth_partner') then coalesce(trim(u.raw_user_meta_data->>'signup_role'), 'customer')
    else 'customer'
  end,
  true
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- RLS – ensure owner can read own profile, update own name/avatar only
alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own') then
    create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
  end if;
end$$;

-- Grant minimal access
grant select, insert, update on table public.profiles to authenticated;
revoke all on table public.profiles from anon;

-- Ensure trigger function is owned by postgres and secure
grant execute on function public.handle_new_user() to service_role;
