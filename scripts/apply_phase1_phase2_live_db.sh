#!/usr/bin/env bash
set -euo pipefail
# Apply Phase 1 + Phase 2 missing migrations to live Supabase qwaehqsmodekbgvnaavz
# Usage: ./scripts/apply_phase1_phase2_live_db.sh "postgresql://postgres.qwaehqsmodekbgvnaavz:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
# Or use Supabase Dashboard SQL Editor and paste each file.

DB_URL="${1:-}"
if [[ -z "$DB_URL" ]]; then
  echo "Usage: $0 <postgres-connection-string> OR open supabase/APPLY_LIVE_DB_GUIDE.md and apply via Dashboard"
  echo "Connection string format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
  exit 64
fi

migrations=(
  "supabase/migrations/20260729_complete_salon_proposal_publish.sql"
  "supabase/migrations/20260729_fix_proposal_owner_resolution.sql"
  "supabase/migrations/20260801_growth_partner_commission_and_hold.sql"
  "supabase/migrations/20260801_owner_daily_payout_2200_ist.sql"
  "supabase/migrations/20260801_business_rules_verification.sql"
  "supabase/migrations/20260802_customer_phase1_schema.sql"
  "supabase/migrations/20260803_profiles_auto_create_fix.sql"
  "supabase/migrations/20260804_shop_owner_phase2_full.sql"
)

for f in "${migrations[@]}"; do
  echo "Applying $f ..."
  psql "$DB_URL" -f "$f"
  echo "✓ $f applied"
done

echo "Verifying..."
psql "$DB_URL" -c "select * from public.verify_business_rules();"
psql "$DB_URL" -c "select tgname from pg_trigger where tgrelid='auth.users'::regclass;"
psql "$DB_URL" -c "select table_name from information_schema.tables where table_schema='public' and table_name in ('customer_settings','saved_payment_methods','customer_feedback','owner_payout_runs','growth_partner_commissions');"

echo "All Phase 1 + Phase 2 migrations applied to live DB"
