# PHASE 3.2 — SCHEMA RECONCILIATION & MIGRATION CONSOLIDATION REPORT

**Date:** 2026-08-25  
**Architect Role:** Senior Database + Full-Stack Architect  
**Ecosystem:** Nexora Multi-App Ecosystem  
**Target Supabase Instance:** `https://qwaehqsmodekbgvnaavz.supabase.co`  
**Phase Status:** **PHASE 3.2 COMPLETE**

---

## 1. EXECUTIVE SUMMARY

Phase 3.2 resolves the migration divergence identified during the Phase 3.1 audit by consolidating the canonical database migrations (`M28` through `M35`) from the template integration package directly into the authoritative root `supabase/migrations/` directory. 

The complete, sequential migration chain now comprises **29 ordered migrations** from `20260729_complete_salon_proposal_publish.sql` through `20260824_phase6_user_locations_compat.sql`.

---

## 2. CONSOLIDATED CANONICAL MIGRATION INVENTORY

| # | Migration File | Scope / Domain | Key Entities & RPCs Created |
|---|---|---|---|
| 1 | `20260729_complete_salon_proposal_publish.sql` | Proposals & Publish | `review_salon_setup()`, proposal attribution |
| 2 | `20260729_fix_proposal_owner_resolution.sql` | Partner Proposals | `save_growth_partner_salon_setup()`, `private.resolve_setup_owner()` |
| 3 | `20260801_growth_partner_commission_and_hold.sql` | Partner Commission Ledger | `growth_partner_commissions`, `platform_revenue_rules`, 10% / 7-day hold triggers |
| 4 | `20260801_owner_daily_payout_2200_ist.sql` | Daily Settlements | `owner_payout_runs`, `owner_payouts`, `owner_payout_items`, 22:00 IST cron |
| 5 | `20260801_business_rules_verification.sql` | Business Rules | `quote_booking_refund()`, `verify_business_rules()` |
| 6 | `20260802_customer_phase1_schema.sql` | Customer PWA Core | `customer_settings`, `saved_payment_methods`, `customer_feedback`, `rewards`, `wallet_transactions` |
| 7 | `20260803_customer_phase1_completion.sql` | Customer Reviews & Loyalty | `customer_reviews`, `credit_wallet()`, `credit_reward_points()`, `redeem_loyalty_points()` |
| 8 | `20260803_profiles_auto_create_fix.sql` | Profile Auto-Creation | `handle_new_user()` trigger on `auth.users`, initial profile backfill |
| 9 | `20260804_shop_owner_phase2_full.sql` | Owner Core | `salons`, `services`, `staff`, `offers`, `salon_hours`, `bookings`, `salon_public_websites` |
| 10 | `20260805_permanent_profile_role_guard.sql` | Identity Role Security | `guard_profile_platform_role()` trigger (restricts role promotion) |
| 11 | `20260806_growth_partner_identity.sql` | Partner Identity | `ensure_growth_partner_identity()`, referral code bootstrap |
| 12 | `20260807_phase8_security_and_isolation.sql` | Security & Webhooks | `audit_events`, `payment_webhook_events`, `update_booking_status_secure()` |
| 13 | `20260808_production_gates_and_blockers.sql` | Gate Verification | `verify_production_gates()`, owner/partner RLS policies |
| 14 | `20260811_phase1_centralized_auth_profiles_rls.sql` | Centralized Profiles RLS | `profiles` admin policies, `assign_platform_role()`, `set_profile_active()` |
| 15 | `20260812_phase3_rbac_verification.sql` | RBAC Self-Test | `verify_phase3_rbac()`, `approve_proposal()`, `publish_salon_website()` |
| 16 | `20260812_phase7_shared_location_security.sql` | Private Location | `user_private_locations`, `business_locations`, `save_my_private_location()` |
| 17 | `20260813_organization_members_invited_by_index.sql` | Tenant Memberships | `organization_members` indexing |
| 18 | `20260813_phase8_postgrest_catalog_grants.sql` | PostgREST Schema Grants | `verify_phase8_catalog_grants()` |
| 19 | `20260813_review_salon_setup_grants.sql` | Proposal Grants | `review_salon_setup()` execute permissions |
| 20 | `20260821000101_m28_phase1a_unified_salon_foundation.sql` | Unified Salon Foundation | `themes`, `service_categories`, `product_categories`, `products`, `booking_services`, `booking_slot_holds`, `salon_media` |
| 21 | `20260821000201_m29_phase1a_razorpay_foundation.sql` | Razorpay Foundation | `payment_orders`, `payments`, `confirm_verified_razorpay_payment()`, `get_booking_payment_quote()` |
| 22 | `20260821000301_m30_phase1a_storage_foundation.sql` | Media Storage | `salon-media` private storage bucket & object RLS policies |
| 23 | `20260821000401_m31_phase1a_authoritative_booking_creation.sql` | Authoritative Bookings | `booking_request_keys`, `create_authoritative_customer_booking()` |
| 24 | `20260821000501_m32_phase2_canonical_foundation.sql` | Theme & Salon Linking | `salons.theme_id`, `phase2_set_salon_theme()` |
| 25 | `20260821000601_m33_phase2a_hardening.sql` | Membership Uniqueness & Soft Delete | Named constraint `organization_members_organization_user_key`, `deleted_at` across catalog & media |
| 26 | `20260821000701_m34_phase2b_final_hardening.sql` | Foreign Key Restrict & Views | `ON DELETE RESTRICT` rules on business FKs, security barrier views (`active_services`, `active_products`, `active_service_categories`) |
| 27 | `20260821000801_m35_phase2c_canonical_theme_slugs.sql` | Canonical Theme Slugs | Slugs locked: `full_service_family_salon`, `barber_mens_grooming`, `hair_studio_color_bar`, `beauty_skin_spa`, `nail_lash_studio` |
| 28 | `20260823000100_universal_auth_location_compatibility.sql` | Location Compatibility | `user_locations` compatibility mirror & trigger |
| 29 | `20260824_phase6_user_locations_compat.sql` | User Location Key Reconciliation | `user_locations` primary key reconciliation (`user_id PK`) & RLS |

---

## 3. RECONCILIATION & RESOLUTION MATRIX

| Entity / Concern | Legacy / Draft Implementation | Canonical Reconciled Architecture | Resolution Action in Phase 3.2 |
|---|---|---|---|
| **Root Tenant Entity** | `businesses` (Draft M03) | `salons` (Canonical Live) | `salons` locked as single root tenant; draft `businesses` deprecated. |
| **Membership Constraint** | Bare index on `(organization_id, user_id)` | Named constraint `organization_members_organization_user_key` | Enforced via M33 + `phase2a_repair_membership_duplicates()`. |
| **Catalog Themes** | Implicit / dynamic strings | 5 Seeded Canonical Themes (`public.themes`) with unique slugs | Reconciled via M18/M28/M35. |
| **Service Provenance** | Unlinked custom strings | Nullable FKs to `themes`, `service_categories`, `predefined_services` | Provenance links established in M17/M28 without altering custom services. |
| **FK Delete Rules** | `ON DELETE CASCADE` | `ON DELETE RESTRICT` for salon-owned entities | M34 asserts `RESTRICT` on `services`, `products`, `staff`, `salon_media` -> `salons`. |
| **Booking Creation** | Direct client REST `INSERT` | RPC `create_authoritative_customer_booking()` | Gated in M31; advance math (25%) and line-item snapshots enforced atomically. |
| **Slot Holds** | Draft `session_token` based | Canonical `(customer_id, idempotency_key)` in M28 | Reconciled in M28; double-booking race conditions prevented. |
| **Business Locations** | Multiple divergent schemas | `salon_id` PK with administrative approval workflow | Reconciled in M28 & 20260812; approved rows feed discovery queries. |
| **User GPS Privacy** | Public/broad table | `user_private_locations` (own-row only) + `user_locations` mirror | Enforced in 20260812 & 20260824. |

---

## 4. NEXT PHASE TRANSITION (PHASE 3.3)

With the migration chain consolidated and the schema contract reconciled:
- **Phase 3.3 Focus:** RLS Hardening & Multi-Tenant Isolation Verification.
- **Verification Target:** Run integration test suites against PGlite/live fixtures to prove that Owner A cannot read Owner B's salon, unapproved bookings cannot be forged, and private GPS telemetry remains inaccessible across users.
