# Apply Missing Migrations to Live Supabase qwaehqsmodekbgvnaavz

Live DB audit 2026-08-02 showed these tables/functions MISSING live:
- growth_partner_commissions, owner_payout_runs, owner_payouts, owner_payout_items
- platform_revenue_rules, business_rule_events, verify_business_rules()
- customer_settings, saved_payment_methods, customer_feedback
- support_tickets.created_by, reviews columns, rewards, wallet_transactions
- profiles auto-create trigger handle_new_user

This guide applies all missing migrations in correct order.

## Order to Apply (via Supabase Dashboard SQL Editor or CLI)

Open https://supabase.com/dashboard/project/qwaehqsmodekbgvnaavz/sql/new and run each file content in exact sequential order:

1. `supabase/migrations/20260729_complete_salon_proposal_publish.sql` — review_salon_setup publish + attribution
2. `supabase/migrations/20260729_fix_proposal_owner_resolution.sql` — owner resolution private.resolve_setup_owner
3. `supabase/migrations/20260801_growth_partner_commission_and_hold.sql` — Rule 3: GP 10% platform fee, Rule 4: 7-day hold, growth_partner_commissions ledger
4. `supabase/migrations/20260801_owner_daily_payout_2200_ist.sql` — Rule 5: Owner payout daily 22:00 IST, owner_payout_runs/items
5. `supabase/migrations/20260801_business_rules_verification.sql` — refund quote + verify_business_rules() self-test
6. `supabase/migrations/20260802_customer_phase1_schema.sql` — customer_settings, saved_payment_methods, customer_feedback, rewards, wallet_transactions
7. `supabase/migrations/20260803_customer_phase1_completion.sql` — customer_reviews, profile balance guards, loyalty point redemption
8. `supabase/migrations/20260803_profiles_auto_create_fix.sql` — handle_new_user trigger, profile role auto-creation and backfill
9. `supabase/migrations/20260804_shop_owner_phase2_full.sql` — salons/services/staff/offers/salon_hours/bookings/salon_public_websites RLS
10. `supabase/migrations/20260805_permanent_profile_role_guard.sql` — permanent profiles.platform_role guard trigger
11. `supabase/migrations/20260806_growth_partner_identity.sql` — ensure_growth_partner_identity() bootstrap RPC
12. `supabase/migrations/20260807_phase8_security_and_isolation.sql` — audit_events, payment_webhook_events, update_booking_status_secure()
13. `supabase/migrations/20260808_production_gates_and_blockers.sql` — verify_production_gates(), owner/partner table RLS gates
14. `supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql` — profiles RLS with admin policies, assign_platform_role()
15. `supabase/migrations/20260812_phase3_rbac_verification.sql` — verify_phase3_rbac(), approve_proposal(), publish_salon_website()
16. `supabase/migrations/20260812_phase7_shared_location_security.sql` — user_private_locations, business_locations, save_my_private_location()
17. `supabase/migrations/20260813_organization_members_invited_by_index.sql` — organization_members indexing
18. `supabase/migrations/20260813_phase8_postgrest_catalog_grants.sql` — PostgREST catalog grants
19. `supabase/migrations/20260813_review_salon_setup_grants.sql` — review_salon_setup execute permissions
20. `supabase/migrations/20260821000101_m28_phase1a_unified_salon_foundation.sql` — themes, service_categories, product_categories, products, booking_services, booking_slot_holds, salon_media
21. `supabase/migrations/20260821000201_m29_phase1a_razorpay_foundation.sql` — payment_orders, payments, Razorpay verification RPCs
22. `supabase/migrations/20260821000301_m30_phase1a_storage_foundation.sql` — salon-media storage bucket & object policies
23. `supabase/migrations/20260821000401_m31_phase1a_authoritative_booking_creation.sql` — create_authoritative_customer_booking(), booking_request_keys
24. `supabase/migrations/20260821000501_m32_phase2_canonical_foundation.sql` — salons.theme_id, phase2_set_salon_theme()
25. `supabase/migrations/20260821000601_m33_phase2a_hardening.sql` — named membership unique constraint, soft delete on catalog/media
26. `supabase/migrations/20260821000701_m34_phase2b_final_hardening.sql` — FK delete RESTRICT rules, active_* security barrier views
27. `supabase/migrations/20260821000801_m35_phase2c_canonical_theme_slugs.sql` — canonical theme public slugs verification
28. `supabase/migrations/20260823000100_universal_auth_location_compatibility.sql` — user_locations compatibility table & sync trigger
29. `supabase/migrations/20260824_phase6_user_locations_compat.sql` — user_locations user_id PK reconciliation & RLS

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

```text
# Main Website (Next/vinext)
NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key, NOT service_role>

# Customer / Owner / Growth Partner PWAs (Vite)
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<the same anon/publishable key>
```

All 3 roles now create account on shared project, RLS ensures own data only, published data appears in Customer PWA via fetchCatalog() filter verified=true, is_active=true, is_published=true, deleted_at null.
