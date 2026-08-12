-- ============================================================================
-- Nexora — Phase 3 RBAC static + operator tests
--
-- Run in the Supabase SQL editor AFTER applying
-- supabase/migrations/20260812_phase3_rbac_verification.sql
--
-- These statements are read-only except for the verification RPC. They do not
-- insert fixtures or mutate business data.
-- ============================================================================

-- 1. Helpers exist
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_salon_owner',
    'is_proposal_attributed',
    'approve_proposal',
    'publish_salon_website',
    'verify_phase3_rbac'
  )
order by p.proname;

-- 2. Operator surface
select * from public.verify_phase3_rbac();

-- 3. Anonymous callers cannot execute the mutation RPCs
select
  has_function_privilege('anon', 'public.approve_proposal(uuid, text)', 'execute') as anon_can_approve,
  has_function_privilege('anon', 'public.publish_salon_website(uuid, text)', 'execute') as anon_can_publish;
-- Expected: false, false

-- 4. Authenticated can execute (RLS + function body still fail closed)
select
  has_function_privilege('authenticated', 'public.is_salon_owner(uuid)', 'execute') as auth_can_check_owner,
  has_function_privilege('authenticated', 'public.is_proposal_attributed(uuid)', 'execute') as auth_can_check_attr,
  has_function_privilege('authenticated', 'public.approve_proposal(uuid, text)', 'execute') as auth_can_approve,
  has_function_privilege('authenticated', 'public.publish_salon_website(uuid, text)', 'execute') as auth_can_publish;
-- Expected: true, true, true, true

-- 5. Unauthenticated helper calls fail closed (return false, never raise)
select
  public.is_salon_owner(null) as null_salon_is_owner,
  public.is_proposal_attributed(null) as null_proposal_is_attributed;
-- Expected: false, false
