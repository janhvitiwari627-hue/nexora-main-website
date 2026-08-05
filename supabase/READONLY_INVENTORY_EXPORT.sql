-- ============================================================================
-- Nexora — Read-Only Live Backend Inventory Export
-- Run in: Supabase Dashboard → SQL Editor (project qwaehqsmodekbgvnaavz)
-- Purpose: Release Blocker #3 — export the live schema/RLS/RPC/function/
--          bucket/cron inventory to compare against frontend requirements
--          (docs/LIVE_BACKEND_INVENTORY.md).
-- Safety: 100% SELECT statements. No DDL, no DML, no grants, no writes.
-- ============================================================================

-- 1. TABLES: existence, row estimates, RLS enabled/forced, owner
select
  c.relname as table_name,
  c.reltuples::bigint as approx_rows,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2. RLS POLICIES: per table, per command, per role
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. TABLES WITH RLS ENABLED BUT ZERO POLICIES (fail-closed = unreadable;
--    confirm that is intentional for each row returned)
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  )
order by c.relname;

-- 4. FUNCTIONS/RPCs: name, security definer?, owner, granted to whom
select
  p.proname as function_name,
  n.nspname as schema,
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as owner,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by n.nspname, p.proname;

-- 5. SECURITY-DEFINER FUNCTIONS (elevated privilege surface — review each)
select n.nspname || '.' || p.proname as definer_function,
       pg_get_userbyid(p.proowner) as runs_as
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef and n.nspname in ('public', 'private')
order by 1;

-- 6. NEXORA GATE HELPERS + VERIFICATION RPCs PRESENCE
select proname, nspname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where proname in (
  'can_manage_salon_settings','current_growth_partner_id','is_active_platform_role',
  'owner_salon_ids','storage_path_uuid','require_role',
  'verify_security_isolation','verify_production_gates',
  'update_booking_status_secure','update_salon_profile_secure',
  'ingest_payment_webhook','process_payment_webhook',
  'create_customer_booking','save_growth_partner_salon_setup','review_salon_setup',
  'bootstrap_shop_owner','ensure_growth_partner_identity','verify_business_rules',
  'run_owner_daily_payouts','release_growth_partner_commissions','quote_booking_refund'
)
order by nspname, proname;

-- 7. RUN THE SHIPPED VERIFICATION SURFACES (if migrations applied)
-- select * from public.verify_security_isolation();
-- select * from public.verify_production_gates();
-- select * from public.verify_business_rules();

-- 8. STORAGE BUCKETS: privacy flag (must be false for signed-URL-only)
select id, name, public, created_at
from storage.buckets
order by name;

-- 9. STORAGE POLICIES
select bucket_id, name as policy_name, action, roles, using_expression, with_check_expression
from (
  select o.policyname as name, o.tablename, o.qual as using_expression,
         o.with_check as with_check_expression, o.cmd as action, o.roles,
         null::text as bucket_id
  from pg_policies o
  where o.schemaname = 'storage' and o.tablename = 'objects'
) s
order by name;

-- 10. TRIGGERS: audit + guard triggers installed
select event_object_table as table_name, trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 11. pg_cron JOBS (owner daily payout 22:00 IST + GP hold release)
select jobid, schedule, command, nodename, active
from cron.job
order by jobid;

-- 12. pg_cron RECENT RUN HISTORY (last 20)
select jobid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 20;

-- 13. REALTIME PUBLICATION TABLES
select pubname, tablename
from pg_publication_tables
order by pubname, tablename;

-- 14. AUTH TRIGGERS (profiles auto-create + permanent role guard)
select tgname, tgrelid::regclass as table_name
from pg_trigger
where tgname in (
  'trg_profiles_platform_role_guard','on_auth_user_created',
  'trg_audit_salons_active','trg_audit_bookings_status','trg_audit_profiles_active',
  'trg_audit_events_immutable','trg_payment_webhook_immutable'
)
order by tgname;

-- 15. COLUMN DRIFT CHECK vs frontend expectations
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'offers' and column_name in ('title','description','discount_type','discount_value','is_active','salon_id'))
    or (table_name = 'support_tickets' and column_name in ('created_by','user_id','status'))
    or (table_name = 'refunds' and column_name in ('booking_id','amount_paise','status'))
    or (table_name = 'payment_events' and column_name in ('booking_id','status'))
    or (table_name = 'commission_events' and column_name in ('growth_partner_id','amount_paise'))
    or (table_name = 'partner_payouts' and column_name in ('growth_partner_id','partner_id','amount_paise'))
    or (table_name = 'partner_payout_accounts' and column_name in ('user_id','growth_partner_id'))
  )
order by table_name, column_name;

-- 16. MONEY COLUMNS: confirm integer minor units (no fractional types)
select table_name, column_name, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
  and column_name like '%paise%'
order by table_name, column_name;

-- 17. INDEXES ON HIGH-TRAFFIC LOOKUP PATHS (sanity)
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('salons','bookings','profiles','growth_partners','salon_setup_proposals','audit_events')
order by tablename, indexname;

-- END OF READ-ONLY EXPORT.
-- Compare each result set against docs/LIVE_BACKEND_INVENTORY.md and record
-- deltas in the release sign-off. Nothing in this file mutates state.
