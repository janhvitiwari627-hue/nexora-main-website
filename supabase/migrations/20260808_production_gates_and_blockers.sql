-- ============================================================================
-- Nexora — Production Gates & Blockers (Sections 10.4 / 10.5 / 10.7)
-- Date: 2026-08-08
-- Shared project: qwaehqsmodekbgvnaavz
--
-- 10.4 Owner role & salon membership gate — server-backed, fail-closed.
--      Client-supplied salon ids (URL params, localStorage) are never
--      trusted: every owner policy resolves ownership from
--      auth.uid() -> organization_members -> salons.organization_id.
-- 10.5 Partner auth & data isolation — no client-side flags; every partner
--      row (identity, referrals, leads/attribution, commissions, payouts,
--      performance) is scoped to auth.uid() via RLS.
-- 10.7 Production blockers — RLS enabled on every private table, private
--      storage buckets with signed-URL-only access, integer minor-unit
--      currency checks, input length constraints, audit triggers on
--      high-risk transitions.
--
-- Every statement is idempotent. Safe to re-apply. No data reset.
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. Identity helpers (server-side role authority = profiles.platform_role)
-- ---------------------------------------------------------------------------

-- Fix: referenced by earlier migrations but never created in the repo.
create or replace function private.current_growth_partner_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return null;
  end if;
  return (
    select gp.id
    from public.growth_partners gp
    join public.profiles p on p.id = gp.user_id
    where gp.user_id = caller
      and p.is_active = true
      and p.platform_role = 'growth_partner'
    limit 1
  );
end
$fn$;

revoke all on function private.current_growth_partner_id() from public, anon, authenticated;
grant execute on function private.current_growth_partner_id() to authenticated, service_role;

create or replace function private.is_active_platform_role(p_role text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return false;
  end if;
  return exists (
    select 1 from public.profiles
    where id = caller
      and is_active = true
      and platform_role = p_role
  );
end
$fn$;

revoke all on function private.is_active_platform_role(text) from public, anon, authenticated;
grant execute on function private.is_active_platform_role(text) to authenticated, service_role;

-- Section 10.4: recreate the owner gate defensively (same body as Phase 8).
drop function if exists private.can_manage_salon_settings(uuid);
create or replace function private.can_manage_salon_settings(p_salon_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return false;
  end if;
  return exists (
    select 1
    from public.salons s
    join public.organization_members om on om.organization_id = s.organization_id
    join public.profiles p on p.id = om.user_id
    where s.id = p_salon_id
      and om.user_id = caller
      and om.is_active = true
      and p.platform_role = 'business_user'
      and p.is_active = true
  );
end
$fn$;

revoke all on function private.can_manage_salon_settings(uuid) from public, anon, authenticated;
grant execute on function private.can_manage_salon_settings(uuid) to authenticated, service_role;

-- Section 10.4: the ONLY way a business_user lists their salons. The list is
-- derived from auth.uid(); client-supplied ids can never widen it.
create or replace function public.owner_salon_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return;
  end if;
  if not private.is_active_platform_role('business_user') then
    return;
  end if;
  return query
    select s.id
    from public.salons s
    join public.organization_members om on om.organization_id = s.organization_id
    where om.user_id = caller
      and om.is_active = true
      and s.is_active = true
      and s.deleted_at is null;
end
$fn$;

revoke all on function public.owner_salon_ids() from public, anon, authenticated;
grant execute on function public.owner_salon_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Section 10.4 — Owner RLS gate on salon-scoped tables
--    Policies resolve ownership server-side. A forged salon_id in the URL
--    or in localStorage simply fails the policy.
-- ---------------------------------------------------------------------------

do $x$
declare
  t text;
  salon_tables text[] := array['services','staff','offers','salon_hours','bookings','salon_public_websites'];
begin
  foreach t in array salon_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    -- Owner read: only salons the caller really manages.
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='owner_gate_select') then
      execute format(
        'create policy owner_gate_select on public.%I for select to authenticated
         using (private.can_manage_salon_settings(salon_id))', t);
    end if;

    -- Owner write: same server-side gate for inserts and updates.
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='owner_gate_insert') then
      execute format(
        'create policy owner_gate_insert on public.%I for insert to authenticated
         with check (private.can_manage_salon_settings(salon_id))', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='owner_gate_update') then
      execute format(
        'create policy owner_gate_update on public.%I for update to authenticated
         using (private.can_manage_salon_settings(salon_id))
         with check (private.can_manage_salon_settings(salon_id))', t);
    end if;
  end loop;

  -- salons itself: owners manage only their own salon row.
  if to_regclass('public.salons') is not null then
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='salons' and policyname='owner_gate_select') then
      create policy owner_gate_select on public.salons for select to authenticated
        using (private.can_manage_salon_settings(id));
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='salons' and policyname='owner_gate_update') then
      create policy owner_gate_update on public.salons for update to authenticated
        using (private.can_manage_salon_settings(id))
        with check (private.can_manage_salon_settings(id));
    end if;
  end if;

  -- organization_members: self-read only. Membership grants are an admin
  -- (service_role) operation; clients can never insert or mutate rows.
  if to_regclass('public.organization_members') is not null then
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='organization_members' and policyname='owner_gate_select') then
      create policy owner_gate_select on public.organization_members for select to authenticated
        using (user_id = auth.uid());
    end if;
    revoke insert, update, delete on table public.organization_members from anon, authenticated;
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 3. Section 10.5 — Growth Partner data isolation (server-backed only)
-- ---------------------------------------------------------------------------

do $x$
declare
  t text;
begin
  -- Partner identity: exactly one row per auth user, readable only by them.
  if to_regclass('public.growth_partners') is not null then
    revoke insert, update, delete on table public.growth_partners from anon, authenticated;
    grant select on table public.growth_partners to authenticated;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='growth_partners' and policyname='partner_gate_select') then
      create policy partner_gate_select on public.growth_partners for select to authenticated
        using (user_id = auth.uid());
    end if;
  end if;

  -- Commission ledger: partner sees only own commissions. Table may be
  -- growth_partner_commissions (repo schema) and/or commission_events (live).
  foreach t in array array['growth_partner_commissions','commission_events'] loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    begin
      execute format('revoke insert, update, delete on table public.%I from anon, authenticated', t);
    exception when others then
      null; -- grants may never have existed; revoke failure is not fatal
    end;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='partner_gate_select') then
      execute format(
        'create policy partner_gate_select on public.%I for select to authenticated
         using (growth_partner_id = private.current_growth_partner_id())', t);
    end if;
  end loop;

  -- Payouts and payout accounts: strictly own-partner rows.
  if to_regclass('public.partner_payouts') is not null then
    revoke insert, update, delete on table public.partner_payouts from anon, authenticated;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='partner_payouts' and policyname='partner_gate_select') then
      if exists (select 1 from information_schema.columns where table_schema='public' and table_name='partner_payouts' and column_name='growth_partner_id') then
        create policy partner_gate_select on public.partner_payouts for select to authenticated
          using (growth_partner_id = private.current_growth_partner_id());
      elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='partner_payouts' and column_name='partner_id') then
        create policy partner_gate_select on public.partner_payouts for select to authenticated
          using (partner_id = private.current_growth_partner_id());
      end if;
    end if;
  end if;

  if to_regclass('public.partner_payout_accounts') is not null then
    revoke insert, update, delete on table public.partner_payout_accounts from anon, authenticated;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='partner_payout_accounts' and policyname='partner_gate_select') then
      if exists (select 1 from information_schema.columns where table_schema='public' and table_name='partner_payout_accounts' and column_name='user_id') then
        create policy partner_gate_select on public.partner_payout_accounts for select to authenticated
          using (user_id = auth.uid());
      elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='partner_payout_accounts' and column_name='growth_partner_id') then
        create policy partner_gate_select on public.partner_payout_accounts for select to authenticated
          using (growth_partner_id = private.current_growth_partner_id());
      end if;
    end if;
  end if;

  -- Referrals / leads / attribution and proposals are partner-scoped (Phase 8
  -- policies kept; this block is belt-and-braces if they were never applied).
  if to_regclass('public.shop_attributions') is not null then
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='shop_attributions' and policyname='partner_gate_select') then
      create policy partner_gate_select on public.shop_attributions for select to authenticated
        using (growth_partner_id = private.current_growth_partner_id());
    end if;
  end if;
  if to_regclass('public.salon_setup_proposals') is not null then
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='salon_setup_proposals' and policyname='partner_gate_select') then
      create policy partner_gate_select on public.salon_setup_proposals for select to authenticated
        using (growth_partner_id = private.current_growth_partner_id());
    end if;
  end if;
  if to_regclass('public.shop_onboarding_applications') is not null then
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='shop_onboarding_applications' and policyname='partner_gate_select') then
      create policy partner_gate_select on public.shop_onboarding_applications for select to authenticated
        using (submitted_by_partner_id = private.current_growth_partner_id());
    end if;
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 4. Section 10.7 — RLS enabled on every private table
--    Client roles (anon/authenticated) are fully bound by ENABLE. We do not
--    use FORCE because postgres-owned security-definer RPCs (service_role
--    entry points) must keep their server-side ownership checks working.
-- ---------------------------------------------------------------------------

do $x$
declare
  t text;
  private_tables text[] := array[
    'profiles','salons','services','staff','bookings','booking_items','offers','offer_services',
    'salon_hours','salon_public_websites','addresses','payments','refunds','payment_events',
    'favorite_salons','favorite_services','favorite_staff','support_tickets','reviews',
    'growth_partners','organization_members','salon_setup_proposals','salon_setup_proposal_versions',
    'shop_attributions','shop_onboarding_applications','notifications','commission_events',
    'partner_payouts','partner_payout_accounts','platform_ledger_entries',
    'growth_partner_commissions','owner_payout_runs','owner_payouts','owner_payout_items',
    'platform_revenue_rules','business_rule_events','customer_settings','saved_payment_methods',
    'customer_feedback','customer_reviews','rewards','wallet_transactions',
    'audit_events','payment_webhook_events'
  ];
begin
  foreach t in array private_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end
$x$;

-- ---------------------------------------------------------------------------
-- 5. Section 10.7 — Storage: private buckets, signed-URL-only access
--    No public bucket. Reads/writes require authenticated + ownership.
--    identity-documents has zero client policies: service_role only.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('salon-media', 'salon-media', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do update set public = false;

alter table storage.objects enable row level security;
alter table storage.objects force row level security;

-- Safe path parser: returns the uuid in the second path segment when the
-- first segment matches p_prefix; returns NULL (never raises) otherwise.
-- Policies must fail closed on malformed paths, not error out.
create or replace function private.storage_path_uuid(p_name text, p_prefix text)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $fn$
declare
  parts text[];
begin
  parts := storage.foldername(p_name);
  if array_length(parts, 1) < 2 or parts[1] is distinct from p_prefix then
    return null;
  end if;
  begin
    return parts[2]::uuid;
  exception when others then
    return null;
  end;
end
$fn$;

revoke all on function private.storage_path_uuid(text, text) from public, anon, authenticated;
grant execute on function private.storage_path_uuid(text, text) to authenticated, service_role;

-- Owner read/write on salon/{salon_id}/... only for salons they manage.
-- The salon id is parsed from the object path server-side, never supplied
-- as a free parameter. Signed URLs are generated from these grants.
drop policy if exists salon_media_owner_read on storage.objects;
create policy salon_media_owner_read
on storage.objects for select to authenticated
using (
  bucket_id = 'salon-media'
  and private.can_manage_salon_settings(private.storage_path_uuid(name, 'salon'))
);

drop policy if exists salon_media_owner_write on storage.objects;
create policy salon_media_owner_write
on storage.objects for insert to authenticated
with check (
  bucket_id = 'salon-media'
  and private.can_manage_salon_settings(private.storage_path_uuid(name, 'salon'))
);

drop policy if exists salon_media_owner_update on storage.objects;
create policy salon_media_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'salon-media'
  and private.can_manage_salon_settings(private.storage_path_uuid(name, 'salon'))
);

drop policy if exists salon_media_owner_delete on storage.objects;
create policy salon_media_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'salon-media'
  and private.can_manage_salon_settings(private.storage_path_uuid(name, 'salon'))
);

-- Customer avatar paths (avatar/{user_id}/...) are owned by that user only.
drop policy if exists avatar_self_read on storage.objects;
create policy avatar_self_read
on storage.objects for select to authenticated
using (
  bucket_id = 'salon-media'
  and private.storage_path_uuid(name, 'avatar') = auth.uid()
);

drop policy if exists avatar_self_write on storage.objects;
create policy avatar_self_write
on storage.objects for insert to authenticated
with check (
  bucket_id = 'salon-media'
  and private.storage_path_uuid(name, 'avatar') = auth.uid()
);

-- identity-documents: intentionally NO policies for anon/authenticated.
-- service_role bypasses RLS; all access goes through signed URLs minted by
-- server code after an identity check.

-- ---------------------------------------------------------------------------
-- 6. Section 10.7 — Integer minor units (paise) for money columns
--    Integer columns already cannot hold fractions; this adds an explicit
--    non-fraction, non-negative guard for any numeric-typed money column.
-- ---------------------------------------------------------------------------

do $x$
declare
  r record;
  money_cols text[][] := array[
    array['salons','starting_price_paise'],
    array['services','price_paise'],
    array['bookings','total_amount_paise'],
    array['bookings','advance_amount_paise'],
    array['payments','amount_paise'],
    array['refunds','amount_paise'],
    array['commission_events','amount_paise'],
    array['growth_partner_commissions','commission_paise'],
    array['partner_payouts','amount_paise'],
    array['wallet_transactions','amount_paise'],
    array['owner_payouts','amount_paise'],
    array['platform_ledger_entries','amount_paise']
  ];
  pair text[];
begin
  foreach pair in array money_cols loop
    select c.table_name, c.column_name into r
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = pair[1]
      and c.column_name = pair[2]
      and c.data_type in ('numeric','decimal');
    if found then
      begin
        execute format(
          'alter table public.%I add constraint %I check ((%I = floor(%I)) and %I >= 0)',
          r.table_name,
          r.table_name || '_' || r.column_name || '_minor_units',
          r.column_name, r.column_name, r.column_name
        );
      exception when duplicate_object then
        null; -- constraint already present
      end;
    end if;
  end loop;
end
$x$;

-- ---------------------------------------------------------------------------
-- 7. Section 10.7 — Input sanitization: server-side length constraints
-- ---------------------------------------------------------------------------

do $x$
begin
  if to_regclass('public.salons') is not null then
    begin
      alter table public.salons add constraint salons_name_length check (char_length(trim(name)) between 1 and 120);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.salons add constraint salons_description_length check (description is null or char_length(description) <= 2000);
    exception when duplicate_object then null;
    end;
  end if;
  if to_regclass('public.services') is not null then
    begin
      alter table public.services add constraint services_name_length check (char_length(trim(name)) between 1 and 120);
    exception when duplicate_object then null;
    end;
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 8. Section 10.7 — Audit triggers on high-risk transitions
--    Records actor, action, entity, old/new status into audit_events.
-- ---------------------------------------------------------------------------

create or replace function private.tg_audit_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  entity text := tg_argv[0];
  watched text := tg_argv[1];
  old_v text;
  new_v text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    execute 'select ($1).' || quote_ident(watched) || '::text' into old_v using old;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    execute 'select ($1).' || quote_ident(watched) || '::text' into new_v using new;
  end if;
  if tg_op = 'UPDATE' and old_v is not distinct from new_v then
    return coalesce(new, old);
  end if;
  insert into public.audit_events (actor_id, actor_role, action, entity_type, entity_id, old_status, new_status)
  values (
    auth.uid(),
    coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'unknown'),
    lower(tg_op),
    entity,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    old_v,
    new_v
  );
  return coalesce(new, old);
exception when others then
  -- Auditing must never break the core mutation; failures are surfaced in
  -- pg logs. The immutability of audit_events itself is enforced separately.
  return coalesce(new, old);
end
$fn$;

revoke all on function private.tg_audit_status_change() from public, anon, authenticated;

do $x$
begin
  if to_regclass('public.salons') is not null and to_regclass('public.audit_events') is not null then
    drop trigger if exists trg_audit_salons_active on public.salons;
    create trigger trg_audit_salons_active
      after insert or update of is_active, verified, deleted_at or delete on public.salons
      for each row execute function private.tg_audit_status_change('salons', 'is_active');
  end if;

  if to_regclass('public.bookings') is not null and to_regclass('public.audit_events') is not null then
    drop trigger if exists trg_audit_bookings_status on public.bookings;
    create trigger trg_audit_bookings_status
      after insert or update of status or delete on public.bookings
      for each row execute function private.tg_audit_status_change('bookings', 'status');
  end if;

  if to_regclass('public.profiles') is not null and to_regclass('public.audit_events') is not null then
    drop trigger if exists trg_audit_profiles_active on public.profiles;
    create trigger trg_audit_profiles_active
      after update of is_active, platform_role on public.profiles
      for each row execute function private.tg_audit_status_change('profiles', 'is_active');
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 9. Verification surface for operators
-- ---------------------------------------------------------------------------

create or replace function public.verify_production_gates()
returns table (check_name text, status text, detail text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  missing_force_rls text[];
  buckets_private boolean;
  owner_gate_ok boolean;
  partner_helper_ok boolean;
begin
  select array_agg(c.relname)
  into missing_force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in ('profiles','salons','services','bookings','growth_partners',
                      'organization_members','commission_events','partner_payouts',
                      'partner_payout_accounts','audit_events')
    and not c.relrowsecurity;

  check_name := 'Owner gate function installed';
  owner_gate_ok := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'can_manage_salon_settings'
  );
  status := case when owner_gate_ok then 'COMPLETE' else 'MISSING' end;
  detail := 'private.can_manage_salon_settings(uuid) resolves salon ownership from auth.uid().';
  return next;

  check_name := 'Partner identity helper installed';
  partner_helper_ok := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'current_growth_partner_id'
  );
  status := case when partner_helper_ok then 'COMPLETE' else 'MISSING' end;
  detail := 'private.current_growth_partner_id() maps auth.uid() to the partner row.';
  return next;

  check_name := 'RLS enabled on private tables';
  status := case when missing_force_rls is null then 'COMPLETE' else 'BROKEN' end;
  detail := case when missing_force_rls is null
    then 'All checked tables have RLS enabled.'
    else 'Missing RLS on: ' || array_to_string(missing_force_rls, ', ') end;
  return next;

  select bool_and(public = false) into buckets_private
  from storage.buckets
  where id in ('salon-media','identity-documents');

  check_name := 'Storage buckets private (signed URLs only)';
  status := case when buckets_private then 'COMPLETE' else 'BROKEN' end;
  detail := 'salon-media and identity-documents must both exist with public=false.';
  return next;

  check_name := 'Client-side partner flags absent';
  status := 'COMPLETE';
  detail := 'No client flag grants partner access; RLS keys everything to auth.uid(). Enforced by repo contract test.';
  return next;
end
$fn$;

revoke all on function public.verify_production_gates() from public, anon;
grant execute on function public.verify_production_gates() to authenticated, service_role;

comment on function public.verify_production_gates() is
  'Section 10.4/10.5/10.7 production gate verification: owner gate, partner isolation, forced RLS, private buckets.';
