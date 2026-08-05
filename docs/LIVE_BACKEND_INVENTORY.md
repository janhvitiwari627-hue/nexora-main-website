# Nexora — Section 10.3 Live Backend Inventory (Read-Only Audit)

Date: 2026-08-05 · Project: `qwaehqsmodekbgvnaavz` · Mode: read-only, no writes attempted.

**Evidence basis.** This sandbox has no Supabase credentials (`NEXT_PUBLIC_SUPABASE_ANON_KEY` is not
present and no service key may be used from a frontend audit). Live statuses below are therefore
carried from the latest verified live probe in the repository — the Phase 0 Freeze & Evidence Audit
(`NEXORA_PHASE0_FREEZE_AND_EVIDENCE_AUDIT.md`, anon-key + OpenAPI probes, 2026-08-02) — cross-checked
against every migration and frontend query in the current tree. Each row lists the exact verification
needed at release time. Nothing was mutated.

Legend: LIVE = probed live 2026-08-02 · MISSING = migration exists, never applied · UNVERIFIED = needs a credentialed probe.

## Frontend Dependency → Backend Object Matrix

| Frontend Dependency | Expected Backend Object | Live Status | Security Status | Required Action | Verification |
|---|---|---|---|---|---|
| Auth: signup/login/logout/resend/reset (main site + PWAs) | `auth.users`, profiles auto-create trigger, SMTP provider | LIVE (trigger `20260803_profiles_auto_create_fix`) | Profiles RLS ✅; SMTP = default Supabase mailer ⚠️ | Apply `supabase/AUTH_EMAIL_AND_OAUTH_SETUP.md` §1–§4 | Send test signup + reset email; confirm SPF/DKIM headers |
| Role resolution everywhere | `profiles(platform_role,is_active)` + `20260805_permanent_profile_role_guard.sql` | LIVE | Role guard trigger ✅, RLS ✅ | None | `select` from anon must fail; role update from JWT must raise |
| Catalog / homepage (`fetchCatalog`) | `salon_public_websites(is_published)`, `salons(verified,is_active,deleted_at)` | LIVE (1 row each) | Public projection reads OK ✅ | None | anon probe returns only published/verified rows |
| Offers strip | `offers(title,description,discount_type,discount_value,is_active)` | LIVE but ⚠️ live table lacks `title` per 2026-08-02 probe | Owner gate now enforced (this release) | Reconcile live `offers` columns with `20260804` schema (add `title` or migrate query) | `\d offers` vs migration column list |
| Salon detail → Customer PWA booking handoff | `salons.id` public projection | LIVE | ✅ | None | deep-link `/salons/<slug>` renders |
| Booking creation (Customer PWA) | RPC `create_customer_booking` | UNVERIFIED | Must be security definer with `auth.uid()` ownership | Probe RPC as anon (must 401) and as customer | `select rpc create_customer_booking` via authenticated client |
| Proposal authoring (Partner PWA) | RPC `save_growth_partner_salon_setup` | UNVERIFIED (migration `20260729_fix_proposal_owner_resolution`) | Partner-scoped via `private.current_growth_partner_id()` — helper now created by this release | Apply `20260808_production_gates_and_blockers.sql` | Call as non-partner → must raise |
| Proposal review/publish (Owner PWA) | RPC `review_salon_setup` | UNVERIFIED (migration `20260729_complete_salon_proposal_publish`) | Owner resolution server-side | Apply; test cross-owner call | Call with foreign salon id → must raise |
| Owner onboarding | RPC `bootstrap_shop_owner` | UNVERIFIED | service-side membership grant | Verify membership rows only admin-writable | `insert into organization_members` as authenticated → denied |
| Business rules (10% commission, 7-day hold, 22:00 IST payouts) | `platform_revenue_rules`, `business_rule_events`, RPC `verify_business_rules()` | ❌ MISSING LIVE (migrations never applied) | n/a | Apply `20260801_business_rules_verification.sql` + commission/payout migrations | `select * from verify_business_rules()` all COMPLETE |
| GP commissions & hold release | `growth_partner_commissions`, RPC `release_growth_partner_commissions`, pg_cron `nexora-gp-hold-release` | ❌ MISSING LIVE | RLS revoke + partner-scoped policies shipped this release | Apply `20260801_growth_partner_commission_and_hold.sql` then cron job | Cron row visible; partner A cannot read partner B rows |
| Owner daily payout 22:00 IST | `owner_payout_runs/owner_payouts/owner_payout_items`, RPC `run_owner_daily_payouts`, pg_cron `nexora-owner-daily-payout` | ❌ MISSING LIVE | service_role only ✅ in migration | Apply `20260801_owner_daily_payout_2200_ist.sql` then cron job | Cron row visible; payout rows anon-denied |
| Partner identity (Partner PWA) | `growth_partners`, RPC `ensure_growth_partner_identity()` | LIVE table, RPC in `20260806` | Self-only read ✅; writes revoked (this release) | Apply this release's migration | Non-partner call raises; second call idempotent |
| Partner referrals/leads/attribution | `shop_attributions`, `salon_setup_proposals`, `shop_onboarding_applications` | LIVE | Partner-scoped policies ✅ (phase 8 + this release) | None after migration apply | Cross-partner select returns 0 rows |
| Partner commissions/payouts screens | `commission_events`, `partner_payouts`, `partner_payout_accounts` (live legacy schema) | LIVE | ⚠️ legacy columns; self-only policies added this release | Apply this release; reconcile with `growth_partner_commissions` going forward | `verify_production_gates()` COMPLETE |
| Customer settings / payment methods / feedback / reviews (Customer PWA) | `customer_settings`, `saved_payment_methods`, `customer_feedback`, `customer_reviews` | ❌ MISSING LIVE | RLS in migrations | Apply `20260802/20260803` customer phase migrations | Tables exist; anon denied |
| Support tickets (Customer PWA) | `support_tickets.created_by` | LIVE table, ❌ COLUMN MISSING | RLS ✅ | Add column (`20260803_customer_phase1_completion.sql` covers it) | `\d support_tickets` shows `created_by` |
| Wallets / rewards / memberships | `wallets`, `rewards`, `memberships` | ❌ MISSING LIVE | n/a | Decision: defer (UI static) or migrate | n/a until product decision |
| Sponsored content (homepage) | `sponsored_shops/brands/videos` | ❌ MISSING LIVE | n/a | Homepage degrades to placeholder (shipped) | n/a |
| Payments | Edge Function `razorpay-create-order`, `payment_webhook_events` | UNVERIFIED / webhook table in `20260807` | Signature verify + idempotency in migration | Deploy Edge Function with server-only keys; apply `20260807` | Webhook replay returns same result; bad signature rejected |
| Storage (avatars, salon media, KYC) | Buckets `salon-media`, `identity-documents` | UNVERIFIED (avatar bucket referenced) | This release: both private, signed-URL-only policies | Apply this release; remove any public URLs | `select public from storage.buckets` both false; public GET 400 |
| Realtime (Customer PWA 9 channels) | `alter publication supabase_realtime add table …` | UNVERIFIED | Enable per table | Enable publication for the 9 subscribed tables | `select * from pg_publication_tables` |
| Security surface verification | RPC `verify_security_isolation()`, `verify_production_gates()` | `20260807` not yet applied; new gate RPC shipped this release | n/a | Apply both migrations | Both RPCs return COMPLETE on all rows |

## Gap Summary

1. **Never-applied migrations** (P0): `20260801_*` (business rules, commission/hold, owner payouts),
   `20260802/20260803` (customer phase 1 + completion incl. `support_tickets.created_by`),
   `20260804` (shop owner phase 2 full), `20260805` (role guard), `20260806` (GP identity),
   `20260807` (phase 8 security), `20260808` (this release). Apply in filename order with
   `supabase db push` or `psql -f` as documented in `supabase/APPLY_LIVE_DB_GUIDE.md`.
2. **Live schema drift**: `offers.title` missing, `refunds`/`payment_events` lack `booking_id`,
   `commission_events` uses original ledger columns. Owner/Partner code paths must consume the
   post-migration schema; do not patch queries to match drift.
3. **External dependencies**: SMTP provider, Razorpay Edge Function + webhook secret, Realtime
   publication, pg_cron jobs — all external-configuration items tracked in the Final Audit Report.
