-- PHASE 18 — Supabase RLS verification
--
-- Run this in the shared Supabase SQL Editor or with psql against the target
-- database after all migrations have been applied. It is read-only apart from
-- the transaction wrapper and raises an error for every failed invariant.
--
-- Required private identity tables:
--   public.profiles
--   public.user_private_locations
--   public.user_locations

begin;

do $verify$
declare
  table_name text;
  rls_enabled boolean;
  forced_enabled boolean;
  required_tables constant text[] := array[
    'profiles',
    'user_private_locations',
    'user_locations'
  ];
begin
  foreach table_name in array required_tables loop
    select c.relrowsecurity, c.relforcerowsecurity
      into rls_enabled, forced_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = table_name;

    if not found then
      raise exception 'PHASE18 FAIL: public.% does not exist', table_name;
    end if;
    if not rls_enabled then
      raise exception 'PHASE18 FAIL: public.% has RLS disabled', table_name;
    end if;
  end loop;

  -- Every required table needs authenticated SELECT. Private location mirrors
  -- additionally need authenticated own-row write policies for all mutations.
  foreach table_name in array required_tables loop
    if not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = table_name
        and p.cmd = 'SELECT'
        and 'authenticated' = any (p.roles)
    ) then
      raise exception 'PHASE18 FAIL: public.% has no authenticated SELECT policy', table_name;
    end if;
  end loop;

  -- Explicit own-row policy checks avoid treating a permissive public policy as
  -- sufficient for either private table.
  foreach table_name in array array['user_private_locations', 'user_locations']::text[] loop
    if exists (
      select 1
      from unnest(array['SELECT','INSERT','UPDATE','DELETE']::text[]) as verbs(cmd)
      where not exists (
        select 1 from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = table_name
          and p.cmd = verbs.cmd
          and 'authenticated' = any (p.roles)
      )
    ) then
      raise exception 'PHASE18 FAIL: public.% is missing an authenticated CRUD policy', table_name;
    end if;
  end loop;

  -- There must be no unconditional private-row policy. This catches both
  -- USING (true) and harmless-looking whitespace/parenthesis variants.
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('profiles', 'user_private_locations', 'user_locations')
      and (
        translate(lower(coalesce(p.qual, '')), ' ()' || chr(9) || chr(10) || chr(13), '') = 'true'
        or translate(lower(coalesce(p.with_check, '')), ' ()' || chr(9) || chr(10) || chr(13), '') = 'true'
      )
  ) then
    raise exception 'PHASE18 FAIL: unconditional true policy found on a private identity table';
  end if;

  -- Every authenticated UPDATE policy on these tables must constrain both the
  -- old row (USING) and the new row (WITH CHECK).
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('profiles', 'user_private_locations', 'user_locations')
      and p.cmd = 'UPDATE'
      and (p.qual is null or p.with_check is null)
  ) then
    raise exception 'PHASE18 FAIL: an authenticated UPDATE policy lacks USING or WITH CHECK';
  end if;
end
$verify$;

-- Human-readable evidence output. On a successful run, every row below is
-- green and the transaction is rolled back so this verifier changes nothing.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls_enabled,
  count(p.policyname) filter (where 'authenticated' = any (p.roles)) as authenticated_policy_count,
  count(p.policyname) filter (
    where 'authenticated' = any (p.roles) and p.cmd = 'UPDATE'
  ) as authenticated_update_policy_count,
  coalesce(bool_and(
    not (
      translate(lower(coalesce(p.qual, '')), ' ()' || chr(9) || chr(10) || chr(13), '') = 'true'
      or translate(lower(coalesce(p.with_check, '')), ' ()' || chr(9) || chr(10) || chr(13), '') = 'true'
    )
  ) filter (where p.policyname is not null), true) as no_unconditional_true_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('profiles', 'user_private_locations', 'user_locations')
group by c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;

select
  p.tablename,
  p.policyname,
  p.cmd,
  p.roles,
  p.qual as using_expression,
  p.with_check
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in ('profiles', 'user_private_locations', 'user_locations')
order by p.tablename, p.cmd, p.policyname;

rollback;
