-- ============================================================================
-- Nexora — LIVE schema inventory (READ-ONLY)
-- Project: qwaehqsmodekbgvnaavz
-- Run in the Supabase SQL editor. Does NOT modify any data or schema.
-- Produces: RLS state, tenant columns, PKs, FKs, grants, policies, indexes.
-- ============================================================================

-- 1. RLS enablement per table
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Row-owner / tenant (uuid identity) columns
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and data_type = 'uuid'
  and column_name in ('id','user_id','owner_id','customer_id','salon_id','organization_id',
                      'growth_partner_id','candidate_user_id','employer_id','created_by','partner_id')
order by table_name, column_name;

-- 3. Primary keys
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- 4. Foreign keys
select tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_col
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;

-- 5. Grants by role
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;

-- 6. Policies by operation (SELECT/INSERT/UPDATE/DELETE/ALL)
select tablename, policyname, cmd, roles::text, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 7. Indexes (RLS predicate coverage)
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
