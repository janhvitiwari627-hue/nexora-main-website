# NEXORA — PHASE 0 COMPLETE AUDIT REPORT
Date: 2026-08-02 · Auditor: Lead Production Engineer · Mode: READ-ONLY (no code modified, no commit, no push)

Shared Supabase project verified live: `qwaehqsmodekbgvnaavz` (anon-key read probes + OpenAPI probes + repo migration cross-check).

Legend: ✅ COMPLETE · 🟡 PARTIAL · ❌ MISSING · 💥 BROKEN · 🔁 DUPLICATE · ⚠️ UNVERIFIED (needs auth/creds to confirm)

---

## 1. LIVE DATABASE (shared Supabase `qwaehqsmodekbgvnaavz`)

### 1.1 Tables verified EXISTING live
| Table | Status | Data | Notes |
|---|---|---|---|
| `salons` | ✅ | 1 row | "vijay salon", jaipur, verified, is_active, accepts_online_bookings |
| `services` | ✅ | 1 row | "hair cut" ₹60, is_active + is_bookable_online |
| `salon_public_websites` | ✅ | 1 row | slug `salon-0df31e6c…`, is_published=true, published 2026-07-29 |
| `profiles` | ✅ | RLS | anon denied; trigger-created per auth user |
| `bookings` / `booking_items` | ✅ | RLS | anon denied (correct) |
| `payments` | ✅ | RLS | anon denied (correct) |
| `refunds` | ✅ | RLS | ⚠️ NO `booking_id` column — schema differs from assumptions |
| `payment_events` | ✅ | RLS | ⚠️ NO `booking_id` column |
| `notifications` | ✅ | RLS | columns per 20260729 migrations (recipient_user_id…) |
| `reviews` | ✅ | EMPTY | anon-readable; zero rows |
| `staff` | ✅ | EMPTY | anon-readable; zero rows |
| `offers` / `offer_services` | ✅ | RLS | ⚠️ `offers.title` does NOT exist — different columns |
| `salon_hours` | ✅ | RLS | hint-verified |
| `addresses` | ✅ | RLS | |
| `favorite_salons` / `favorite_services` / `favorite_staff` | ✅ | RLS | |
| `support_tickets` | ✅ | RLS | 💥 NO `created_by`, NO `user_id` column — customer PWA queries `created_by` → runtime FAIL |
| `growth_partners` | ✅ | RLS | |
| `shop_onboarding_applications` | ✅ | RLS | |
| `salon_setup_proposals` | ✅ | EMPTY | anon-readable |
| `salon_setup_proposal_versions` | ✅ | EMPTY | anon-readable |
| `shop_attributions` | ✅ | RLS | |
| `organization_members` | ✅ | RLS | |
| `commission_events` | ✅ | RLS | ⚠️ NO `booking_id` column — original ledger design |
| `partner_payouts` | ✅ | RLS | ⚠️ NO `amount_paise` column — original design |
| `partner_payout_accounts` | ✅ | RLS | hint-verified |
| `platform_ledger_entries` | ✅ | RLS | |

### 1.2 Tables MISSING live (repo migrations exist but were NEVER applied)
| Table / Object | Required by | Consequence |
|---|---|---|
| `growth_partner_commissions` | 20260801 migration (Rule 3) | GP commission ledger does not exist |
| `owner_payout_runs` / `owner_payouts` / `owner_payout_items` | 20260801 migration (Rule 5) | Daily 10 PM owner payout engine does not exist |
| `platform_revenue_rules` | 20260801 migration | Locked constants (90/10, 25/75, hold 7d) not in DB |
| `business_rule_events` | 20260801 migration | Audit log missing |
| `verify_business_rules()` | 20260801 migration | NOT in schema cache → business-rule self-test absent |
| `wallets` | Customer/Owner wallet features | no wallet table |
| `memberships` | Customer membership | no membership table |
| `rewards` | Customer rewards | no rewards table |
| `time_slots` (and any slots table) | slot availability | no slot table (slots are client-derived) |
| `sponsored_shops` / `sponsored_brands` / `sponsored_videos` | Website marketing sections | none exist |
| `customer_settings` | Customer PWA settings | settings save/load FAILS |
| `saved_payment_methods` | Customer PWA saved UPI/cards | add/load UPI/cards FAILS |
| `customer_feedback` | Customer PWA feedback | feedback FAILS |
| `salon_profiles` | Owner PWA (supabase/schema.sql) | owner schema never applied to shared project |
| `booking_payments` | assumed by some code paths | missing (payments table is the real source) |

### 1.3 RPCs / Functions
- ❌ `verify_business_rules()` — absent (schema-cache verified).
- ⚠️ `create_customer_booking`, `save_growth_partner_salon_setup`, `review_salon_setup`, `bootstrap_shop_owner`, `quote_booking_refund`, `run_owner_daily_payouts`, `release_growth_partner_commissions` — functions-with-args cannot be probed via REST GET; NOT verifiable without an authenticated session. However, every table they depend on from the 20260801 changeset is missing, so Rules 3–5 are almost certainly not live.
- ⚠️ Edge function `razorpay-create-order` — needs auth session; UNVERIFIED.
- ⚠️ pg_cron jobs (`nexora-owner-daily-payout`, `nexora-gp-hold-release`) — need service role; UNVERIFIED, and their dependencies are missing anyway.

### 1.4 RLS / Grants
- Anon-readable (correct): `salons`, `services`, `salon_public_websites`, `reviews`, `staff`, `salon_setup_proposals`, `salon_setup_proposal_versions`.
- RLS-restricted (correct): profiles, bookings, payments, notifications, favorites, addresses, growth_partners, attributions, etc.
- ✅ No duplicates found among live tables.
- ⚠️ Two parallel ledger designs exist: original `commission_events` / `partner_payouts` / `platform_ledger_entries` vs. new migration tables (`growth_partner_commissions`, `owner_payouts`). New tables are NOT live, so currently the original design is what exists — but nothing writes to it either.

---

## 2. MAIN WEBSITE (nexora-main-website)
| Area | Status | Detail |
|---|---|---|
| Auth (login/signup/roles) | ✅ | Supabase auth + profiles platform_role; role-guarded dashboards |
| Catalog / salon pages | ✅ | Live from `salon_public_websites` + `salons` (published+verified only) |
| Booking + 25% advance | ✅ | `create_customer_booking` RPC → `razorpay-create-order` edge fn → Razorpay checkout |
| Owner review/publish proposals | ✅ | `review_salon_setup`, `save_growth_partner_salon_setup`, attributions |
| PWA install (role-aware) | ✅ | 3 manifests + prompt |
| Homepage sections | 🟡 | Only hero + published-salons strip + role cards. ❌ Categories, Top Rated, Trending, Nearby, Recommended, Offers, Available Slots, Sponsored Shops/Brands/Videos, Membership, About |
| Smart Search | 🟡 | `/salons` page has client-side text filter only — not "smart" (no categories/nearby/ranking) |
| Customer dashboard | 🟡 | Role cards only; no bookings/wallet/notifications view |
| Legal pages | ✅ | terms/privacy/refund |
| 🔁 DUPLICATE | 🔁 | Root `nexora-app.tsx` is an exact byte-for-byte duplicate of `app/nexora-app.tsx` (68,966 bytes both) |
| Tests | ✅ | 5 suites / 29 static contract tests (auth-config, booking-role-guard, business-rules, proposal-flow, rendered-html) |
| Build/Deploy | 🟡 | Vercel (next build) + Cloudflare (wrangler/vinext) configs present; build requires env vars; live deployment env UNVERIFIED |

## 3. CUSTOMER PWA
| Area | Status | Detail |
|---|---|---|
| Authentication | ✅ | Supabase, validated project ref; legacy localStorage migration purges business keys |
| Profiles | ✅ | `profiles` single row, update-only |
| Shops/Services/Staff | ✅ | `fetchPublicSalons` from salons/services/salon_public_websites (live) |
| Slots | ✅ | Derived from real opening hours (no mock slots; client-generated grid) |
| Bookings + 25% advance | ✅ | Same proven pipeline as website; realtime subscription to bookings |
| Notifications | ✅ | `notifications` table + realtime |
| Favorites | ✅ | favorite_* tables + realtime |
| Addresses | ✅ | `addresses` table |
| Reviews / Ratings | 💥 | `reviews` table EXISTS live but app keeps reviews in session memory only — App.tsx comment: "no reviews/referrals table yet". NOT persisted, not cross-device. Ratings never written. |
| Referral code / invited friends | 🟡 | Session-scoped only, no table |
| Rewards / Wallet | 🟡 | Reads/writes `profiles.loyalty_points` + `wallet_balance_paise` client-side (⚠️ insecure pattern; columns unverified). No rewards/membership/wallet tables exist |
| Membership | 🟡 | Static tier config only |
| Settings | 💥 | `customer_settings` table MISSING live → load/save errors (falls back to defaults) |
| Saved UPI / cards | 💥 | `saved_payment_methods` table MISSING live → add/list/delete errors |
| Support tickets | 💥 | `support_tickets` has no `created_by` column → query fails |
| Feedback | 💥 | `customer_feedback` table MISSING |
| Scan-UPI QR | 🟡 | demo sample-UPI fallback on scan (simulated) — demo-only, flagged |
| mockData.ts | ✅ | Static asset URLs only (logo/banner) — not business data |
| Realtime | ⚠️ | Used broadly; requires Realtime enabled on tables — UNVERIFIED |
| Email confirmation | ⚠️ | DEPLOY.md: SMTP not configured → signup may stay `email_not_confirmed` |

## 4. OWNER PWA
| Area | Status | Detail |
|---|---|---|
| Authentication | ✅ | Supabase auth via Vercel `/api/auth/*` proxy; signup/login/reset |
| Own salon / salon_profiles | 💥 | `salon_profiles` schema never applied to shared project; registration creates auth user only |
| Dashboard/Bookings | 💥 | localStorage (`nexora_*` keys) — no Supabase |
| Services / ServiceDetail | 💥 | localStorage |
| Staff / StaffDetail / StaffManagement | 💥 | localStorage |
| New Appointment | 💥 | localStorage draft + in-memory |
| Customers / CustomerProfile | 💥 | localStorage |
| Wallet / Transactions | 💥 | localStorage |
| Reviews | 💥 | localStorage |
| Revenue Analytics | 💥 | localStorage |
| Offers / Tags | 💥 | localStorage |
| Publish status | ❌ | No link to `salon_public_websites` / `is_published` |
| Offline sync | 🟡 | IndexedDB sync-queue exists (`CREATE_APPOINTMENT`, `UPDATE_PROFILE`, `CREATE_CLIENT`) but NOTHING replays those to Supabase |
| Marketing (WhatsApp/Gemini) | 🟡 | Campaigns localStorage; AI calls partial |
| Supabase usage | 🟡 | Only Login/Profile/RegistrationStepper/ResetPassword/Settings/Splash — auth only |

## 5. PARTNER PWA
| Area | Status | Detail |
|---|---|---|
| Supabase integration (any) | ❌ | ZERO — no supabase import anywhere in src/ |
| Auth | 💥 | Fake localStorage auth (`nexora_registered_partners`, `isAuthenticated`) |
| Add Shop | 💥 | localStorage/IndexedDB only |
| Website Proposal | 💥 | localStorage |
| Owner Approval status | ❌ | Not connected |
| Attribution | ❌ | Not connected |
| Commission Ledger | ❌ | Not connected |
| 7-day hold / payout | ❌ | Not connected |
| Rewards/gamification | 🟡 | localStorage UI only |
| PWA shell | ✅ | manifests, sw, install flow |

## 6. DEPLOYMENT / ENV / REALTIME / FUNCTIONS
| Item | Status | Detail |
|---|---|---|
| Vercel configs | ✅ | All 4 repos have vercel.json (Vite/Next) |
| Env vars | ⚠️ | All require VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY; owner/customer validate ref; live deployment env UNVERIFIED |
| Razorpay edge function | ⚠️ | Referenced (`razorpay-create-order`) — not verifiable without auth |
| Realtime | ⚠️ | Customer PWA subscribes to bookings/settings/favorites/notifications/profile — needs Realtime enabled |
| pg_cron | ❌ | Payout/GP-release cron objects not in DB (dependencies missing) |
| SMTP | ⚠️ | Not configured per DEPLOY.md |

## 7. LOCKED BUSINESS RULES — LIVE STATUS
| # | Rule | Repo | Live DB |
|---|---|---|---|
| 1 | 25% advance / 75% final | ✅ migrations/tests | ✅ (pre-existing triggers; payments table live) |
| 2 | Owner 90% / Platform 10% | ✅ | ✅ (settlement logic pre-existing) |
| 3 | GP 10% of platform fee | ✅ migration | ❌ tables/functions NOT applied |
| 4 | GP hold 7 days | ✅ migration | ❌ NOT applied |
| 5 | Owner payout daily 22:00 IST | ✅ migration | ❌ NOT applied |
| 6 | Refund full >24h else partial | ✅ | 🟡 quote function unverified; refunds table exists |

## 8. TOP PRODUCTION GAPS (ranked)
1. **Partner PWA: 100% disconnected** (auth, shop, proposal, attribution, commission, payout all fake/local).
2. **Owner PWA: business layer 100% localStorage** (bookings, services, staff, wallet, customers, reviews).
3. **20260801 migrations never applied to shared DB** → Rules 3/4/5 dead in production.
4. **Main website homepage sections missing** (Categories/Top Rated/Trending/Nearby/Recommended/Offers/Slots/Sponsored/Membership/About/Smart search).
5. **Customer PWA gaps**: reviews not persisted; settings/payment-methods/feedback/support-tickets broken vs live schema; rewards client-side.
6. **Duplicate file** in main website repo.
7. Deployment envs, Realtime, edge functions, SMTP unverified.

---
*End of Phase 0 audit. No files modified, no commits, no pushes.*
