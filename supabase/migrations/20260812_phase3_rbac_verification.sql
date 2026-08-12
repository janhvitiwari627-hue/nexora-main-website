-- ============================================================================
-- Nexora — Phase 3 RBAC verification helpers
-- Date: 2026-08-12
-- Shared project: qwaehqsmodekbgvnaavz
--
-- Named helpers used by Owner / Partner / Customer PWAs:
--   public.is_salon_owner(uuid)
--   public.is_proposal_attributed(uuid)
--   public.approve_proposal(uuid, text)
--   public.publish_salon_website(uuid, text)
--
-- These wrap the existing Phase 8 / production-gate functions. They do not
-- weaken RLS. Every statement is idempotent. Safe to re-apply. No data reset.
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. is_salon_owner — public wrapper around private.can_manage_salon_settings
-- ---------------------------------------------------------------------------
create or replace function public.is_salon_owner(p_salon_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if p_salon_id is null then
    return false;
  end if;
  return private.can_manage_salon_settings(p_salon_id);
end
$fn$;

revoke all on function public.is_salon_owner(uuid) from public, anon;
grant execute on function public.is_salon_owner(uuid) to authenticated, service_role;

comment on function public.is_salon_owner(uuid) is
  'True when auth.uid() is an active business_user with an active organization membership for the salon.';

-- ---------------------------------------------------------------------------
-- 2. is_proposal_attributed — partner owns the proposal via auth.uid()
-- ---------------------------------------------------------------------------
create or replace function public.is_proposal_attributed(p_proposal_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  partner uuid := private.current_growth_partner_id();
begin
  if p_proposal_id is null or partner is null then
    return false;
  end if;
  return exists (
    select 1
    from public.salon_setup_proposals p
    where p.id = p_proposal_id
      and p.growth_partner_id = partner
  );
end
$fn$;

revoke all on function public.is_proposal_attributed(uuid) from public, anon;
grant execute on function public.is_proposal_attributed(uuid) to authenticated, service_role;

comment on function public.is_proposal_attributed(uuid) is
  'True when the caller''s growth_partners row is the attributed author of the proposal.';

-- ---------------------------------------------------------------------------
-- 3. approve_proposal — owner-only wrapper around review_salon_setup('approve')
-- ---------------------------------------------------------------------------
create or replace function public.approve_proposal(
  p_proposal_id uuid,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  salon uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select salon_id into salon
  from public.salon_setup_proposals
  where id = p_proposal_id;

  if salon is null then
    raise exception 'setup proposal not found';
  end if;
  if not public.is_salon_owner(salon) then
    raise exception 'Shop Owner permission required';
  end if;

  return public.review_salon_setup(p_proposal_id, 'approve', p_notes);
end
$fn$;

revoke all on function public.approve_proposal(uuid, text) from public, anon;
grant execute on function public.approve_proposal(uuid, text) to authenticated;

comment on function public.approve_proposal(uuid, text) is
  'Owner-only: approve a submitted salon setup proposal. Delegates to review_salon_setup.';

-- ---------------------------------------------------------------------------
-- 4. publish_salon_website — owner-only wrapper around review_salon_setup('publish')
-- ---------------------------------------------------------------------------
create or replace function public.publish_salon_website(
  p_proposal_id uuid,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  salon uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select salon_id into salon
  from public.salon_setup_proposals
  where id = p_proposal_id;

  if salon is null then
    raise exception 'setup proposal not found';
  end if;
  if not public.is_salon_owner(salon) then
    raise exception 'Shop Owner permission required';
  end if;

  return public.review_salon_setup(p_proposal_id, 'publish', p_notes);
end
$fn$;

revoke all on function public.publish_salon_website(uuid, text) from public, anon;
grant execute on function public.publish_salon_website(uuid, text) to authenticated;

comment on function public.publish_salon_website(uuid, text) is
  'Owner-only: publish an approved/submitted salon website. Delegates to review_salon_setup.';

-- ---------------------------------------------------------------------------
-- 5. Customer / Owner / Partner RLS — belt-and-braces if earlier migrations
--    were not applied. Policies are created only when missing.
-- ---------------------------------------------------------------------------
do $x$
begin
  -- Customer: own bookings only
  if to_regclass('public.bookings') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'bookings' and policyname = 'customer_own_bookings_select'
    ) then
      create policy customer_own_bookings_select
        on public.bookings for select to authenticated
        using (customer_id = auth.uid());
    end if;
  end if;

  -- Customer: own favourite salons
  if to_regclass('public.favorite_salons') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'favorite_salons' and policyname = 'customer_own_favorites'
    ) then
      create policy customer_own_favorites
        on public.favorite_salons for all to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    end if;
  end if;

  -- Owner: proposals for owned salons (read)
  if to_regclass('public.salon_setup_proposals') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'salon_setup_proposals' and policyname = 'owner_proposals_select'
    ) then
      create policy owner_proposals_select
        on public.salon_setup_proposals for select to authenticated
        using (public.is_salon_owner(salon_id));
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'salon_setup_proposals' and policyname = 'partner_proposals_select'
    ) then
      create policy partner_proposals_select
        on public.salon_setup_proposals for select to authenticated
        using (public.is_proposal_attributed(id));
    end if;
  end if;
end
$x$;

-- ---------------------------------------------------------------------------
-- 6. Operator verification
-- ---------------------------------------------------------------------------
create or replace function public.verify_phase3_rbac()
returns table (check_name text, status text, detail text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  owner_fn boolean;
  attr_fn boolean;
  approve_fn boolean;
  publish_fn boolean;
begin
  owner_fn := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_salon_owner'
  );
  check_name := 'is_salon_owner installed';
  status := case when owner_fn then 'COMPLETE' else 'MISSING' end;
  detail := 'public.is_salon_owner(uuid) wraps private.can_manage_salon_settings.';
  return next;

  attr_fn := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_proposal_attributed'
  );
  check_name := 'is_proposal_attributed installed';
  status := case when attr_fn then 'COMPLETE' else 'MISSING' end;
  detail := 'public.is_proposal_attributed(uuid) keys to private.current_growth_partner_id().';
  return next;

  approve_fn := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'approve_proposal'
  );
  check_name := 'approve_proposal installed';
  status := case when approve_fn then 'COMPLETE' else 'MISSING' end;
  detail := 'Owner-only RPC; delegates to review_salon_setup(approve).';
  return next;

  publish_fn := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'publish_salon_website'
  );
  check_name := 'publish_salon_website installed';
  status := case when publish_fn then 'COMPLETE' else 'MISSING' end;
  detail := 'Owner-only RPC; delegates to review_salon_setup(publish).';
  return next;
end
$fn$;

revoke all on function public.verify_phase3_rbac() from public, anon;
grant execute on function public.verify_phase3_rbac() to authenticated, service_role;

comment on function public.verify_phase3_rbac() is
  'Phase 3 RBAC verification: named helpers and owner/partner RPCs.';
