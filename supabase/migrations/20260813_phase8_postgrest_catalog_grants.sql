-- ===========================================================================
-- PHASE 8 — restore PostgREST-compatible public catalog grants
-- Shared Supabase project: qwaehqsmodekbgvnaavz
--
-- Phase 7 revoked table-level SELECT and left only column grants. PostgREST
-- requires has_table_privilege(..., 'SELECT') before it will expose a table,
-- which produced live "permission denied for table salon_public_websites".
-- RLS still decides which rows are visible. Legacy salon coordinates and
-- private business-location identity columns stay revoked.
-- ===========================================================================

begin;

grant select on table public.salon_public_websites to anon, authenticated;

do $block$
declare
  extra text;
begin
  select string_agg(format('%I', column_name), ', ')
    into extra
  from information_schema.columns
  where table_schema = 'public' and table_name = 'salon_public_websites'
    and column_name not in ('salon_id','slug','template_key','config','is_published','published_at');
  if extra is not null then
    execute 'revoke select (' || extra || ') on public.salon_public_websites from anon, authenticated';
  end if;
end
$block$;

grant select on table public.salons to anon, authenticated;

do $block$
declare
  hidden text;
begin
  select string_agg(format('%I', column_name), ', ')
    into hidden
  from information_schema.columns
  where table_schema = 'public' and table_name = 'salons'
    and column_name in ('latitude','longitude','lat','lng','location_latitude','location_longitude');
  if hidden is not null then
    execute 'revoke select (' || hidden || ') on public.salons from anon, authenticated';
  end if;
end
$block$;

do $block$
declare
  extra text;
begin
  if to_regclass('public.business_locations') is null then
    return;
  end if;
  execute 'grant select on table public.business_locations to anon, authenticated';
  select string_agg(format('%I', column_name), ', ')
    into extra
  from information_schema.columns
  where table_schema = 'public' and table_name = 'business_locations'
    and column_name not in (
      'salon_id','latitude','longitude','address_label','approval_status',
      'submitted_at','approved_at','updated_at'
    );
  if extra is not null then
    execute 'revoke select (' || extra || ') on public.business_locations from anon, authenticated';
  end if;
end
$block$;

create or replace function public.verify_phase8_catalog_grants()
returns table(check_name text, passed boolean, detail text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  select 'salon_public_websites_table_select',
         has_table_privilege('anon', 'public.salon_public_websites', 'SELECT')
           and has_table_privilege('authenticated', 'public.salon_public_websites', 'SELECT'),
         'PostgREST can see salon_public_websites'
  union all
  select 'salons_table_select',
         has_table_privilege('anon', 'public.salons', 'SELECT')
           and has_table_privilege('authenticated', 'public.salons', 'SELECT'),
         'PostgREST can see salons'
  union all
  select 'business_locations_table_select',
         to_regclass('public.business_locations') is null
           or (
             has_table_privilege('anon', 'public.business_locations', 'SELECT')
             and has_table_privilege('authenticated', 'public.business_locations', 'SELECT')
           ),
         'PostgREST can see business_locations when present';
$fn$;

revoke all on function public.verify_phase8_catalog_grants() from public, anon;
grant execute on function public.verify_phase8_catalog_grants() to authenticated, service_role;

commit;
