# Apply Missing Migrations to Live Supabase qwaehqsmodekbgvnaavz

Live DB audit 2026-08-02 showed these tables/functions MISSING live:
- growth_partner_commissions, owner_payout_runs, owner_payouts, owner_payout_items
- platform_revenue_rules, business_rule_events, verify_business_rules()
- customer_settings, saved_payment_methods, customer_feedback
- support_tickets.created_by, reviews columns, rewards, wallet_transactions
- profiles auto-create trigger handle_new_user

This guide applies all missing migrations in correct order.

## Order to Apply (via Supabase Dashboard SQL Editor)

Open https://supabase.com/dashboard/project/qwaehqsmodekbgvnaavz/sql/new and run each file content in order:

1. `supabase/migrations/20260729_complete_salon_proposal_publish.sql` - review_salon_setup publish + attribution
2. `supabase/migrations/20260729_fix_proposal_owner_resolution.sql` - owner resolution private.resolve_setup_owner
3. `supabase/migrations/20260801_growth_partner_commission_and_hold.sql` - Rule 3: GP 10% of platform fee, Rule 4: 7-day hold, tables growth_partner_commissions, commission ledger
4. `supabase/migrations/20260801_owner_daily_payout_2200_ist.sql` - Rule 5: Owner payout daily 22:00 IST, tables owner_payout_runs, owner_payouts, owner_payout_items, cron 30 16 * * *
5. `supabase/migrations/20260801_business_rules_verification.sql` - refund quote + verify_business_rules() self-test
6. `supabase/migrations/20260802_customer_phase1_schema.sql` - Phase 1 Customer: customer_settings, saved_payment_methods, customer_feedback, support_tickets created_by, reviews columns, rewards, wallet_transactions, credit_wallet(), credit_reward_points()
7. `supabase/migrations/20260803_profiles_auto_create_fix.sql` - Fix account creation for customer/business_user/growth_partner, handle_new_user trigger, backfill missing profiles, RLS
8. `supabase/migrations/20260804_shop_owner_phase2_full.sql` - Phase 2 Shop Owner full: salons/services/staff/offers/salon_hours/bookings/salon_public_websites RLS owner own only, is_salon_visible_in_customer_app()
9. `supabase/migrations/20260805_permanent_profile_role_guard.sql` - v3 permanent `profiles.platform_role` guard; ordinary authenticated clients cannot insert/promote owner or partner roles or mutate an assigned role

## Verification After Apply

```sql
-- Should show 6 rows COMPLETE
select * from public.verify_business_rules();

-- Should show 1 row per existing auth user without profile before, now backfilled
select count(*) from public.profiles;

-- Should show auth trigger and permanent role guard
select tgname from pg_trigger where tgrelid='auth.users'::regclass and tgname='on_auth_user_created';
select tgname from pg_trigger where tgrelid='public.profiles'::regclass and tgname='trg_profiles_platform_role_guard';

-- Customer Phase 1 tables now exist
select table_name from information_schema.tables where table_schema='public' and table_name in ('customer_settings','saved_payment_methods','customer_feedback','rewards','wallet_transactions');

-- Owner Phase 2 RLS
select policyname, tablename from pg_policies where schemaname='public' and tablename in ('salons','services','bookings','owner_payouts','customer_settings') order by tablename, policyname;

-- Published visibility check
select public.is_salon_visible_in_customer_app(id) as visible, name from public.salons limit 5;
```

## Apply via Supabase CLI (alternative)

```bash
supabase link --project-ref qwaehqsmodekbgvnaavz
supabase db push
# or
psql "postgresql://postgres.qwaehqsmodekbgvnaavz:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20260801_growth_partner_commission_and_hold.sql
# Repeat for each file in order
```

## Env Vars Required for App

```
VITE_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (anon public, NOT service_role)
NEXT_PUBLIC_SUPABASE_URL=same
NEXT_PUBLIC_SUPABASE_ANON_KEY=same
```

All 3 roles now create account on shared project, RLS ensures own data only, published data appears in Customer PWA via fetchCatalog() filter verified=true, is_active=true, is_published=true, deleted_at null.
