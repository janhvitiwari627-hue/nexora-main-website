# NEXORA — PHASE 0 FREEZE AND EVIDENCE AUDIT

**Date:** 2026-08-03
**Auditor:** Arena Integration Architect (Automated)
**Mode:** READ-ONLY — no code modified, no commit, no push, no deployment, no schema change.
**PRD Status:** The attached PRD file (`Nexora_Master_Integration_PRD_v2.1_FINAL.docx`) was not found on disk. This audit was conducted against the four live repositories, existing Supabase schema evidence, existing documentation, and the prior audit at `AUDIT_PHASE0.md`. All findings are evidence-based from direct code inspection.

---

## 1. EXECUTIVE SUMMARY

The Nexora ecosystem consists of four applications intended to share one Supabase project (`qwaehqsmodekbgvnaavz`). Only the **Main Website** and **Customer PWA** have meaningful Supabase integration. The **Owner PWA** uses Supabase only for authentication — all business data (bookings, services, staff, customers, wallet, revenue, reviews) is stored in **localStorage** with hardcoded placeholder values. The **Growth Partner PWA** has **zero Supabase integration** — authentication is entirely fake localStorage, and all business data (shops, attributions, commissions, payouts, rewards) is hardcoded or localStorage-only.

**Overall completion estimate: ~25%** based on evidence. Auth + catalog + booking flow work for the Main Website and Customer PWA. All other features across all apps are either MISSING, localStorage-backed, or broken against the live database schema.

---

## 2. REPOSITORY AND BRANCH INVENTORY

| # | Repository | Path | Default Branch | Remote |
|---|-----------|------|----------------|--------|
| 1 | Main Website | `/home/user/nexora-main-website` | `main` | `github.com/janhvitiwari627-hue/nexora-main-website` |
| 2 | Customer PWA | `/home/user/custmer-Fresh-app` | `main` | `github.com/freewebsite859-sudo/custmer-Fresh-app-` |
| 3 | Shop Owner PWA | `/home/user/PINK-NEXORA-AAP` | `main` | `github.com/promptaivideo4-coder/PINK-NEXORA-AAP-` |
| 4 | Growth Partner PWA | `/home/user/pink-growth-partner-aap` | `main` | `github.com/diamondpeomotion-cyber/pink-growth-partner-aap-` |

---

## 3. INSPECTED COMMIT SHAs

| Repository | SHA | Latest Commit Message |
|-----------|-----|----------------------|
| Main Website | `8e6a0e180035ffe67ceb1d5638d7794547ef721a` | `Merge pull request #7` |
| Customer PWA | `4eff31469914679f6a5c6443eaf3ad851a883240` | `Merge pull request #16` |
| Owner PWA | `49ffe780c542dc693269c063cde6185cf5c86b61` | `preserve proxied auth session when browser blocks Supabase` |
| Growth Partner PWA | `26c0f56a96492f644c534d337afc3408b30b44a7` | `fix(add-shop): scroll the app shell, not the window` |

---

## 4. FRAMEWORK AND PACKAGE MANAGER MATRIX

| Repository | Framework | Version | Package Manager | Node Requirement | Language |
|-----------|----------|---------|----------------|-----------------|----------|
| Main Website | Next.js + Vite (vinext/Cloudflare) | Next 16.2.6, React 19.2.6 | npm (`npm ci`) | `>=22.13.0` | TypeScript 5.9.3 |
| Customer PWA | Vite + React | React 19.0.1, Vite 6.2.3 | npm | None specified | TypeScript ~5.8.2 |
| Owner PWA | Vite + React + PWA (vite-plugin-pwa) | React 19.0.1, Vite 6.2.3 | npm | None specified | TypeScript ~5.8.2 |
| Growth Partner PWA | Vite + React | React 19.0.1, Vite 6.2.3 | npm | None specified | TypeScript ~5.8.2 |

**Additional Dependencies:**
- Main Website: `@supabase/supabase-js@2.95.0`, `drizzle-orm`, Cloudflare Workers
- Customer PWA: `@supabase/supabase-js@^2.110.8`, `@google/genai`, `framer-motion`, `recharts`
- Owner PWA: `@supabase/supabase-js@^2.110.8`, `@google/genai`, `helmet`, `multer`, `qrcode.react`, `vite-plugin-pwa`
- Growth Partner PWA: `@google/genai`, `html-to-image`, `qrcode.react`, `recharts` — **no `@supabase/supabase-js` dependency**

---

## 5. CURRENT DEPLOYMENT URL AND HOSTING MATRIX

| Repository | Hosting Config | Build Command | Output | Deployment URL |
|-----------|---------------|---------------|--------|----------------|
| Main Website | `vercel.json` (Next.js) | `npm run build:next` → `next build` | `.next` | UNVERIFIED |
| Customer PWA | `vercel.json` (Vite SPA) | `npm run build` → `vite build` | `dist/` | UNVERIFIED |
| Owner PWA | `vercel.json` (Vite + Express SSR) | `npm run build` → `vite build + esbuild server.ts` | `dist/` | UNVERIFIED |
| Growth Partner PWA | `vercel.json` (Vite SPA + PWA) | `npm run build` → `vite build` | `dist/` | UNVERIFIED |

**Status: UNVERIFIED** — No live deployment URLs could be confirmed from repository inspection alone.

---

## 6. ENVIRONMENT VARIABLE MATRIX

| Repository | Env Var Names | Required Values | Default/Fallback |
|-----------|--------------|----------------|-----------------|
| Main Website | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (also accepts `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | Supabase URL + Anon Key | `""` (empty — no fallback) |
| Customer PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase URL + Anon Key | **None** — shows error if missing |
| Owner PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase URL + Anon Key | **Hardcoded fallbacks** to `qwaehqsmodekbgvnaavz` |
| Growth Partner PWA | **None** | N/A | N/A — no Supabase integration |

**Critical Finding:** Owner PWA has **hardcoded Supabase anon key JWT** in source code (4 files):
- `api/auth/login.ts` (line 4)
- `api/auth/signup.ts` (line 4)
- `src/lib/supabase.ts` (line 11)

The anon key is designed for browser use (role: `anon`), but embedding it in source rather than env vars means key rotation requires a code change and redeploy. **Severity: P2**.

---

## 7. SUPABASE PROJECT REFERENCE COMPARISON

| Repository | Project Ref | Source of Truth | Validation |
|-----------|------------|----------------|------------|
| Main Website | `qwaehqsmodekbgvnaavz` | Migrations reference, docs, AUDIT_PHASE0.md | ✅ PASS |
| Customer PWA | `qwaehqsmodekbgvnaavz` | `src/lib/supabaseClient.ts` line 3 (`SUPABASE_PROJECT_REF` constant) + hostname validation | ✅ PASS |
| Owner PWA | `qwaehqsmodekbgvnaavz` | `src/lib/supabase.ts` line 10 (`DEFAULT_SUPABASE_URL`), `api/auth/login.ts` line 3 | ✅ PASS |
| Growth Partner PWA | **NONE** | Zero Supabase imports, zero Supabase references | ❌ FAIL |

**Verdict:** All three repos with Supabase integration reference the same project `qwaehqsmodekbgvnaavz`. The Growth Partner PWA is completely disconnected.

---

## 8. AUTHENTICATION AND ROLE AUDIT

### 8.1 Role Contract

The codebase defines three platform roles in `profiles.platform_role`:
- `customer` — Customer PWA, website booking flow
- `business_user` — Owner PWA, website owner dashboard
- `growth_partner` — Growth Partner PWA, website GP dashboard

This is consistent across Main Website (`app/nexora-app.tsx` line 107) and Customer PWA (`src/lib/authRoles.ts` lines 3–6). The Owner PWA registers with `signup_role: 'business_user'` (`RegistrationStepper.tsx` line 46).

### 8.2 Per-Repository Auth Status

| Repository | Auth Method | Status | Evidence |
|-----------|-----------|--------|----------|
| Main Website | Supabase Auth → `profiles.platform_role` lookup | ✅ PASS | `nexora-app.tsx` lines 150–171: getSession → select platform_role → setAuthState |
| Customer PWA | Supabase Auth → `authRoles.ts` role routing | ✅ PASS | Auth screen routing in `App.tsx`, role guard in booking flow |
| Owner PWA | Supabase Auth via Vercel `/api/auth/*` proxy | ✅ PASS | `lib/supabase.ts` `authenticateThroughApp()` → proxy → `setSession()` |
| Growth Partner PWA | **Fake localStorage auth** | ❌ FAIL | `LoginForm.tsx` line 215: `localStorage.setItem('isAuthenticated', 'true')` after 900ms setTimeout. No Supabase call. |

### 8.3 Auth Role Routing

| App | Customer Route | Owner Route | GP Route |
|-----|---------------|------------|---------|
| Main Website | `/dashboard/customer` | `/dashboard/business_user` | `/dashboard/growth_partner` |
| Customer PWA | `home` screen (default) | `owner-dashboard` screen | `gp-dashboard` screen |
| Owner PWA | N/A | `dashboard` screen (default) | N/A |
| Growth Partner PWA | N/A | N/A | `dashboard` screen (fake auth) |

### 8.4 Auth Gaps

| Issue | Severity | File | Detail |
|-------|---------|------|--------|
| Partner PWA: no Supabase auth | **P0** | `pink-growth-partner-aap/src/components/LoginForm.tsx` | Entire auth is localStorage. No `profiles` row created. |
| Partner PWA: no `@supabase/supabase-js` dependency | **P0** | `pink-growth-partner-aap/package.json` | Not in dependencies |
| Owner PWA: no role check after auth | **P1** | `PINK-NEXORA-AAP/src/App.tsx` | Auth state changes → navigates to dashboard, but never checks `platform_role` |
| Customer PWA: email confirmation may not be configured | **P1** | `custmer-Fresh-app/DEPLOY.md` | SMTP not configured per docs |

---

## 9. ROUTING AND CROSS-APP NAVIGATION AUDIT

### 9.1 Main Website Routes

All routes handled by a single `NexoraApp` component in `app/nexora-app.tsx` (1,303 lines):

| Route | Component | Auth Required | Role Guard |
|-------|----------|--------------|------------|
| `/` | `HomePage` | No | No |
| `/salons` | `CatalogPage` | No | No |
| `/salons/:slug` | `SalonPage` | No (booking needs auth) | Booking requires customer role |
| `/booking/:slug` | `BookingPage` | Yes | customer only |
| `/login` | `AuthPage` | No | No |
| `/signup` | `AuthPage` | No | No |
| `/terms`, `/privacy`, `/cancellation-refund` | `LegalPage` | No | No |
| `/customer`, `/owner`, `/growth-partner` | `RoleEntry` | No | No (portal landing) |
| `/dashboard` | `DashboardPage` | Yes | Checks platform_role |
| `/dashboard/customer` | Dashboard + role workspace | Yes | customer |
| `/dashboard/business_user` | Dashboard + role workspace | Yes | business_user |
| `/dashboard/growth_partner` | Dashboard + role workspace | Yes | growth_partner |

### 9.2 Customer PWA Routes (Screen-based)

| Screen | Data Source | Real Supabase |
|--------|-----------|--------------|
| Home | `fetchPublicSalons()` | ✅ |
| SalonDetail | `fetchPublicSalons()` | ✅ |
| Bookings | `listCustomerBookings()` | ✅ |
| Checkout | `createCustomerBooking()` → `createAdvanceOrder()` | ✅ |
| Favorites | `loadFavorites()` | ✅ |
| Notifications | `loadServerNotifications()` | ✅ |
| Profile | `updateProfile()`, `uploadAvatar()` | ✅ |
| Settings | `loadSettings()`, `saveSettings()` → `customer_settings` | ❌ (table missing) |
| SavedAddresses | `addressesRepository` | ✅ |
| PaymentMethods | `paymentMethodsRepository` → `saved_payment_methods` | ❌ (table missing) |
| Support | `supportRepository` → `support_tickets` | ❌ (column `created_by` missing) |
| Reviews | `reviewsRepository` → `customer_reviews` | ❌ (table missing — degrades gracefully) |

### 9.3 Owner PWA Routes (Screen-based)

| Screen | Data Source | Real Supabase |
|--------|-----------|--------------|
| Dashboard | **Hardcoded** (₹45,800 revenue, 24 bookings, etc.) | ❌ |
| Bookings | **Hardcoded** (3 mock bookings with names, prices) | ❌ |
| ServicesList | **localStorage** (`nexora_services`) | ❌ |
| NewService | **localStorage** (`nexora_services`) | ❌ |
| ServiceDetail | **localStorage** (`nexora_services`) | ❌ |
| StaffManagement | **localStorage** (`nexora_staff_list`) | ❌ |
| NewStaff | **localStorage** (`nexora_staff_list`) | ❌ |
| StaffDetail | **localStorage** (`nexora_staff_list`) | ❌ |
| Customers | **Hardcoded** (4 mock customers with names, phones, histories) | ❌ |
| CustomerProfile | **localStorage** (`selected_customer_data`) | ❌ |
| NewAppointment | **localStorage** (form draft) | ❌ |
| Wallet | **Hardcoded** (mock transactions) | ❌ |
| RevenueAnalytics | **Hardcoded** (static chart data) | ❌ |
| Reviews | **Hardcoded** (mock review objects) | ❌ |
| Profile | **localStorage** (name, email, phone, business details) | ❌ |
| Marketing | **localStorage** + Gemini AI (partial) | ❌ |
| WebsiteDashboard | **localStorage** (`store_is_published`) | ❌ |
| Settings | Supabase health check only (`services.select('id').limit(1)`) | 🟡 (connectivity only) |
| Login | Supabase Auth via proxy | ✅ |
| RegistrationStepper | Supabase Auth via proxy | ✅ |
| ResetPassword | Supabase Auth | ✅ |

### 9.4 Growth Partner PWA Routes (Screen-based)

| Screen | Data Source | Real Supabase |
|--------|-----------|--------------|
| Login/Signup | **Fake localStorage** | ❌ |
| Dashboard | **localStorage** + **Hardcoded** (`DEFAULT_DASHBOARD_CACHE`) | ❌ |
| AddShop | **localStorage** (`add_shop_form_draft`) + `alert()` success | ❌ |
| MyShops | **localStorage** | ❌ |
| Profile | **localStorage** (`nexora_partner_profile`) | ❌ |
| Rewards | **localStorage** (`simulatedQualifyingCount`) | ❌ |
| Notifications | **Hardcoded** | ❌ |
| Payouts | **Hardcoded** | ❌ |
| WebsiteSettings | **localStorage** (`store_is_published`, `add_shop_form_draft`) | ❌ |
| Support | **localStorage** | ❌ |
| AccountSettings | **localStorage** (`nexora_partner_profile`) | ❌ |

---

## 10. SCREEN-TO-DATA INVENTORY

### 10.1 Main Website (abbreviated — key screens only)

| Route | Role | Tables Read | Tables Written | RPCs Used | Realtime | Status |
|-------|------|------------|---------------|----------|---------|--------|
| `/` (home) | public | `salon_public_websites`, `salons` | — | — | No | ✅ PASS |
| `/salons` | public | `salon_public_websites`, `salons` | — | — | No | ✅ PASS |
| `/salons/:slug` | public/customer | `salon_public_websites`, `salons`, `services`, `salon_hours` | — | — | No | ✅ PASS |
| `/booking/:slug` | customer | `salon_public_websites`, `salons`, `services` | `bookings`, `booking_items` | `create_customer_booking` | No | ✅ PASS |
| `/login`, `/signup` | public | `profiles` | `auth.users`, `profiles` | — | No | ✅ PASS |
| `/dashboard` | authenticated | `profiles` | — | — | No | ✅ PASS |
| `/dashboard/business_user` | business_user | `salons`, `salon_setup_proposals`, `salon_public_websites`, `shop_attributions` | — | `review_salon_setup`, `bootstrap_shop_owner` | No | ✅ PASS |
| `/dashboard/growth_partner` | growth_partner | `growth_partners`, `shop_onboarding_applications` | `growth_partners`, `shop_onboarding_applications` | `save_growth_partner_salon_setup` | No | ✅ PASS |

### 10.2 Customer PWA (key screens)

| Screen | Role | Tables Read | Tables Written | RPCs | Realtime | Status |
|--------|------|------------|---------------|------|---------|--------|
| Home | customer | `salons`, `services`, `salon_public_websites` | — | — | No | ✅ |
| Bookings | customer | `bookings`, `booking_items` | — | — | ✅ bookings | ✅ |
| Checkout | customer | — | `bookings`, `booking_items` | `create_customer_booking` | No | ✅ |
| Favorites | customer | `favorite_salons`, `favorite_services`, `favorite_staff` | `favorite_*` | — | ✅ favorites | ✅ |
| Notifications | customer | `notifications` | `notifications` (mark read) | — | ✅ notifications | ✅ |
| Profile | customer | `profiles` | `profiles` | — | ✅ profile | ✅ |
| Addresses | customer | `addresses` | `addresses` | — | ✅ addresses | ✅ |
| Settings | customer | `customer_settings` | `customer_settings` | — | ✅ settings | ❌ **FAIL** (table missing) |
| PaymentMethods | customer | `saved_payment_methods` | `saved_payment_methods` | — | ✅ | ❌ **FAIL** (table missing) |
| Support | customer | `support_tickets` | `support_tickets` | — | ✅ | ❌ **FAIL** (`created_by` column missing) |
| Reviews | customer | `customer_reviews` | `customer_reviews` | — | ✅ | ❌ **FAIL** (table missing; degrades gracefully) |

### 10.3 Owner PWA — ALL BUSINESS SCREENS

**Status: ❌ FAIL — 100% localStorage/hardcoded. Zero real DB operations for business data.**

| Screen | Data Source | Real DB | Issue |
|--------|-----------|---------|-------|
| Dashboard | Hardcoded values | No | `formatPrice(45800)`, `24` bookings, etc. |
| Bookings | Hardcoded `initialBookings` array | No | 3 mock bookings (Ananya Sharma, Amit Patel, Priya Kapoor) |
| Services | localStorage `nexora_services` | No | Device-only, not synced |
| Staff | localStorage `nexora_staff_list` | No | Device-only, not synced |
| Customers | Hardcoded `INITIAL_CUSTOMERS` array | No | 4 mock customers with full histories |
| Wallet | Hardcoded `initialTransactions` array | No | Mock transactions |
| Revenue | Hardcoded chart data | No | Static revenue numbers |
| Reviews | Hardcoded review objects | No | Mock reviews |

### 10.4 Growth Partner PWA — ALL SCREENS

**Status: ❌ FAIL — 100% localStorage/hardcoded. Zero Supabase connection.**

| Screen | Data Source | Real DB | Issue |
|--------|-----------|---------|-------|
| Auth | localStorage `isAuthenticated` | No | Fake auth, no profiles row |
| Dashboard | localStorage + `DEFAULT_DASHBOARD_CACHE` | No | ₹8,400 available, 250 shops, ₹42,500 monthly |
| AddShop | localStorage `add_shop_form_draft` | No | `alert()` on submit, no DB write |
| Profile | localStorage `nexora_partner_profile` | No | `Rahul Verma`, `NX-RJ-8842` |
| Rewards | localStorage `simulatedQualifyingCount` | No | Simulated rewards |
| Payouts | Hardcoded | No | Mock payout data |
| Notifications | Hardcoded | No | Mock notifications |

---

## 11. SUPABASE BACKEND INVENTORY

### 11.1 Tables Verified LIVE (from prior audit evidence)

| Table | Status | Data | RLS |
|-------|--------|------|-----|
| `salons` | ✅ LIVE | 1 row ("vijay salon") | Anon-readable |
| `services` | ✅ LIVE | 1 row ("hair cut" ₹60) | Anon-readable |
| `salon_public_websites` | ✅ LIVE | 1 row | Anon-readable |
| `profiles` | ✅ LIVE | RLS-protected | ✅ |
| `bookings` | ✅ LIVE | RLS-protected | ✅ |
| `booking_items` | ✅ LIVE | RLS-protected | ✅ |
| `payments` | ✅ LIVE | RLS-protected | ✅ |
| `refunds` | ✅ LIVE | RLS-protected | ✅ |
| `payment_events` | ✅ LIVE | RLS-protected | ✅ |
| `notifications` | ✅ LIVE | RLS-protected | ✅ |
| `reviews` | ✅ LIVE | Empty | Anon-readable |
| `staff` | ✅ LIVE | Empty | Anon-readable |
| `offers` / `offer_services` | ✅ LIVE | RLS-protected | ✅ |
| `salon_hours` | ✅ LIVE | RLS-protected | ✅ |
| `addresses` | ✅ LIVE | RLS-protected | ✅ |
| `favorite_salons/services/staff` | ✅ LIVE | RLS-protected | ✅ |
| `support_tickets` | ✅ LIVE | RLS-protected | ✅ (but missing `created_by` column) |
| `growth_partners` | ✅ LIVE | RLS-protected | ✅ |
| `shop_onboarding_applications` | ✅ LIVE | RLS-protected | ✅ |
| `salon_setup_proposals` | ✅ LIVE | Empty | Anon-readable |
| `salon_setup_proposal_versions` | ✅ LIVE | Empty | Anon-readable |
| `shop_attributions` | ✅ LIVE | RLS-protected | ✅ |
| `organization_members` | ✅ LIVE | RLS-protected | ✅ |
| `commission_events` | ✅ LIVE | RLS-protected | ✅ |
| `partner_payouts` | ✅ LIVE | RLS-protected | ✅ |
| `partner_payout_accounts` | ✅ LIVE | RLS-protected | ✅ |
| `platform_ledger_entries` | ✅ LIVE | RLS-protected | ✅ |

### 11.2 Tables MISSING LIVE (migrations exist but never applied)

| Table/Object | Required By | Status |
|-------------|-----------|--------|
| `customer_settings` | Customer PWA Settings screen | ❌ MISSING |
| `saved_payment_methods` | Customer PWA PaymentMethods screen | ❌ MISSING |
| `customer_feedback` | Customer PWA feedback | ❌ MISSING |
| `customer_reviews` | Customer PWA Reviews (degrades gracefully) | ❌ MISSING |
| `support_tickets.created_by` | Customer PWA Support screen | ❌ MISSING COLUMN |
| `growth_partner_commissions` | 20260801 migration (Rule 3) | ❌ MISSING |
| `owner_payout_runs` / `owner_payouts` / `owner_payout_items` | 20260801 migration (Rule 5) | ❌ MISSING |
| `platform_revenue_rules` | 20260801 migration | ❌ MISSING |
| `business_rule_events` | 20260801 migration | ❌ MISSING |
| `verify_business_rules()` | 20260801 migration | ❌ MISSING |
| `salon_profiles` | Owner PWA (separate schema) | ❌ MISSING |
| `wallets` | Customer/Owner wallet features | ❌ MISSING |
| `memberships` | Customer membership | ❌ MISSING |
| `rewards` | Customer rewards | ❌ MISSING |
| `sponsored_shops/brands/videos` | Website marketing | ❌ MISSING |

### 11.3 RPCs

| RPC | Status | Evidence |
|-----|--------|----------|
| `create_customer_booking` | UNVERIFIED (referenced in code, requires auth) | Used by Main Website + Customer PWA |
| `save_growth_partner_salon_setup` | UNVERIFIED | Used by Main Website + Customer PWA |
| `review_salon_setup` | UNVERIFIED | Used by Main Website + Customer PWA |
| `bootstrap_shop_owner` | UNVERIFIED | Used by Main Website + Customer PWA |
| `quote_booking_refund` | UNVERIFIED | Migration exists, not applied |
| `run_owner_daily_payouts` | ❌ NOT LIVE | Migration not applied |
| `release_growth_partner_commissions` | ❌ NOT LIVE | Migration not applied |
| `verify_business_rules()` | ❌ NOT LIVE | Migration not applied |

### 11.4 Realtime Publication

UNVERIFIED — Customer PWA subscribes to 9 tables via `postgres_changes` channels. Requires Supabase Realtime enabled on each table. Cannot verify without database admin access.

### 11.5 Edge Functions

| Function | Status | Evidence |
|---------|--------|----------|
| `razorpay-create-order` | UNVERIFIED | Referenced in `bookingRepository.ts` and `nexora-app.tsx`, requires auth session |

### 11.6 Storage

| Bucket | Status | Evidence |
|--------|--------|----------|
| Avatar bucket (Customer PWA) | UNVERIFIED | `profileRepository.ts` references `AVATAR_BUCKET`, uses `storage.from().getPublicUrl()` |

### 11.7 pg_cron

| Job | Status | Evidence |
|-----|--------|----------|
| `nexora-owner-daily-payout` | ❌ NOT LIVE | Dependencies (`owner_payout_runs` etc.) missing |
| `nexora-gp-hold-release` | ❌ NOT LIVE | Dependencies (`growth_partner_commissions`) missing |

---

## 12. MOCK/LOCALSTORAGE/HARDCODED DATA INVENTORY

### 12.1 Main Website

| Item | Type | File | Line | Severity |
|------|------|------|------|---------|
| Duplicate file: `nexora-app.tsx` | Copy | `nexora-app.tsx` (root) is byte-for-byte identical to `app/nexora-app.tsx` | — | P2 |

### 12.2 Customer PWA

| Item | Type | File | Line | Severity |
|------|------|------|------|---------|
| `INITIAL_LOCATION` | Hardcoded default | `src/data/mockData.ts` | 12–15 | P2 (default Jaipur, overridable by GPS) |
| `LOGO_URL`, `BANNER_URL` | Static assets | `src/data/mockData.ts` | 3–9 | P2 (asset URLs, not business data) |
| `nexora_user_location` | localStorage | `src/App.tsx` | 252, 718 | P2 (UI preference, not business data) |
| `nexora_app_installed`, `nexora_pwa_dismissed` | localStorage | Various | — | P2 (PWA UX, not business data) |
| Legacy migration keys | localStorage | `src/lib/legacyLocalData.ts` | — | P2 (one-time migration, purges after) |

**Verdict:** Customer PWA localStorage usage is clean — **no business data in localStorage**. All localStorage is for PWA UX state or legacy migration.

### 12.3 Owner PWA — CRITICAL

| Item | Type | File | Line(s) | Severity |
|------|------|------|---------|---------|
| Business name, GST, address | localStorage + hardcoded | `src/screens/Profile.tsx` | 54–58 | **P0** |
| Full name, email, phone | localStorage + hardcoded | `src/screens/Profile.tsx` | 110–112 | **P0** |
| Services | localStorage `nexora_services` | `src/screens/NewService.tsx` | 114, 146 | **P0** |
| Staff | localStorage `nexora_staff_list` | `src/screens/NewStaff.tsx` | 114, 125 | **P0** |
| Dashboard revenue | Hardcoded `₹45,800` | `src/screens/Dashboard.tsx` | 31 | **P0** |
| Dashboard bookings | Hardcoded `24` | `src/screens/Dashboard.tsx` | — | **P0** |
| Bookings data | Hardcoded 3 mock bookings | `src/screens/Bookings.tsx` | 24–50 | **P0** |
| Customers | Hardcoded 4 mock customers | `src/screens/Customers.tsx` | 31–80+ | **P0** |
| Customer names (Ananya Sharma, etc.) | Hardcoded | Multiple screens | — | **P0** |
| Wallet transactions | Hardcoded | `src/screens/Wallet.tsx` | 45+ | **P0** |
| Revenue analytics | Hardcoded chart data | `src/screens/RevenueAnalytics.tsx` | 47+ | **P0** |
| Reviews | Hardcoded mock objects | `src/screens/Reviews.tsx` | — | **P0** |
| Business hours/schedules | localStorage `nexora_schedules` | `src/screens/Profile.tsx` | 90 | **P0** |
| Auto-confirm, SMS, marketing prefs | localStorage | `src/screens/Profile.tsx` | 72–84 | **P1** |

### 12.4 Growth Partner PWA — CRITICAL

| Item | Type | File | Line(s) | Severity |
|------|------|------|---------|---------|
| Auth flag | localStorage `isAuthenticated` | `src/App.tsx` | 95, 217 | **P0** |
| Partner profile (name, mobile, email, code, UPI) | localStorage + hardcoded | `src/App.tsx` | 57–66, `LoginForm.tsx` | **P0** |
| Dashboard cache (₹8,400, 250 shops, ₹42,500) | localStorage + hardcoded | `src/App.tsx` | 68–75 | **P0** |
| Registered partners list | localStorage | `src/components/LoginForm.tsx` | 172, 216 | **P0** |
| Shop form draft | localStorage | `src/components/AddShop.tsx` | 134, 930 | **P0** |
| Store published flag | localStorage | `src/components/AddShop.tsx` | 204, 216 | **P0** |
| Simulated qualifying count | localStorage | `src/components/dashboard/RewardsScreen.tsx` | 49–54 | **P0** |
| Sample demo files | Hardcoded | `src/components/AddShop.tsx` | 570+ | **P1** |
| Fake forgot-password (1200ms timeout) | Hardcoded | `src/components/LoginForm.tsx` | `handleSendResetLink` | **P0** |

---

## 13. BOOKING WORKFLOW AUDIT

### 13.1 Canonical Booking Flow (Main Website + Customer PWA)

1. Customer selects services on salon page
2. Client calls `create_customer_booking` RPC with services, salon, time
3. RPC creates booking + booking_items → returns booking_id
4. Client calls `createAdvanceOrder` (fetches `/functions/v1/razorpay-create-order`)
5. Razorpay checkout opens (25% advance)
6. On success, payment status tracked via `paymentStatus.ts` → polls `bookings` table

**Status: ✅ PASS** — Flow is implemented end-to-end in code. However:
- `create_customer_booking` RPC: **UNVERIFIED** (requires auth session)
- `razorpay-create-order` edge function: **UNVERIFIED**
- Razorpay keys: **UNVERIFIED** (not in repo, presumably in Supabase edge function env)

### 13.2 Owner PWA Booking Flow

**Status: ❌ FAIL** — Bookings are hardcoded mock data. No connection to `bookings` table. No ability to view, manage, or update real customer bookings.

### 13.3 Growth Partner PWA Booking Flow

**Status: ❌ FAIL** — No booking awareness at all. Shop onboarding "submits" to localStorage with `alert()` success.

---

## 14. PAYMENT AND REFUND AUDIT

### 14.1 Payment Flow

| Component | Status | Evidence |
|-----------|--------|----------|
| 25% advance booking | ✅ Code exists | `bookingRepository.ts` → RPC → edge function |
| 75% final payment | UNVERIFIED | Referenced in business rules, no UI path confirmed |
| Payment status tracking | ✅ Code exists | `paymentStatus.ts` polls `bookings` table |
| Razorpay integration | UNVERIFIED | Edge function not verifiable without auth |

### 14.2 Refund Flow

| Component | Status | Evidence |
|-----------|--------|----------|
| Refund policy (full >24h, partial ≤24h) | ✅ Migration exists | `20260801_business_rules_verification.sql` |
| `quote_booking_refund` RPC | ❌ NOT LIVE | Migration not applied |
| `refunds` table | ✅ LIVE | Exists but no `booking_id` column per prior audit |
| Refund UI in Customer PWA | ❌ MISSING | Cancel booking modal exists but no refund status display |

---

## 15. PARTNER ATTRIBUTION AND COMMISSION AUDIT

| Component | Status | Evidence |
|-----------|--------|---------|
| `growth_partners` table | ✅ LIVE | Used by Main Website + Customer PWA |
| `shop_attributions` table | ✅ LIVE | Used by Main Website owner dashboard |
| `shop_onboarding_applications` table | ✅ LIVE | Used by Main Website + Customer PWA |
| `salon_setup_proposals` table | ✅ LIVE | Used by Main Website |
| `review_salon_setup` RPC | UNVERIFIED | Referenced in code |
| `save_growth_partner_salon_setup` RPC | UNVERIFIED | Referenced in code |
| `growth_partner_commissions` table | ❌ NOT LIVE | Migration not applied |
| Commission accrual triggers | ❌ NOT LIVE | Migration not applied |
| 7-day hold | ❌ NOT LIVE | Migration not applied |
| Owner daily payout | ❌ NOT LIVE | Migration not applied |
| Partner PWA attribution | ❌ NOT CONNECTED | Zero Supabase integration |
| Partner PWA commission ledger | ❌ NOT CONNECTED | localStorage/hardcoded only |

---

## 16. REVIEW ELIGIBILITY AUDIT

| Component | Status | Evidence |
|-----------|--------|---------|
| `reviews` table (legacy) | ✅ LIVE | Empty, anon-readable |
| `customer_reviews` table (new) | ❌ NOT LIVE | Customer PWA migration exists, not applied |
| Customer PWA review write | ❌ FAIL (degrades gracefully) | `reviewsRepository.ts` → catches missing table, keeps in session |
| Customer PWA review persistence | ❌ FAIL | Reviews lost on refresh |
| Owner PWA reviews | ❌ FAIL | Hardcoded mock reviews |
| Review eligibility check (verified booking) | ❌ MISSING | No server-side check |

---

## 17. RLS AND SECURITY AUDIT

### 17.1 RLS Coverage

| Category | Status | Detail |
|----------|--------|--------|
| Public tables (salons, services, etc.) | ✅ | Anon-readable, correct |
| User-owned tables (profiles, bookings, etc.) | ✅ | RLS-protected, correct |
| Money tables (payments, commissions, etc.) | ✅ | RLS-protected |
| `customer_settings` | ❌ NOT LIVE | Table doesn't exist |
| `saved_payment_methods` | ❌ NOT LIVE | Table doesn't exist |

### 17.2 Security Issues

| Issue | Severity | Repository | File | Detail |
|-------|---------|-----------|------|--------|
| Hardcoded anon key in source | **P2** | Owner PWA | `src/lib/supabase.ts:11`, `api/auth/login.ts:4`, `api/auth/signup.ts:4` | Key rotation requires code change |
| Partner PWA: no auth at all | **P0** | Growth Partner PWA | `src/components/LoginForm.tsx` | Anyone can "log in" |
| Partner PWA: no RLS protection | **P0** | Growth Partner PWA | All screens | No Supabase = no data isolation |
| Owner PWA: no role-based screen guard | **P1** | Owner PWA | `src/App.tsx` | Auth state checked but `platform_role` not verified |
| Owner PWA: localStorage data = no server isolation | **P0** | Owner PWA | All business screens | Data is device-local, no cross-device sync |
| `refunds` table missing `booking_id` | **P1** | Database | — | Schema drift from expected |

---

## 18. REALTIME AND OFFLINE BEHAVIOUR AUDIT

### 18.1 Realtime Usage

| Repository | Tables Subscribed | Status |
|-----------|-----------------|--------|
| Main Website | None | N/A (no realtime in main website) |
| Customer PWA | `bookings`, `favorites`, `addresses`, `profile`, `notifications`, `settings`, `payment_methods`, `reviews`, `support_tickets` | **UNVERIFIED** (requires Realtime enabled on each table) |
| Owner PWA | None | ❌ No realtime subscriptions |
| Growth Partner PWA | None | ❌ No Supabase at all |

### 18.2 Offline Behaviour

| Repository | Offline Support | Status |
|-----------|---------------|--------|
| Main Website | Service worker (Cloudflare) | PARTIAL |
| Customer PWA | Basic (browser caching) | PARTIAL |
| Owner PWA | Service worker + IndexedDB sync queue | PARTIAL — sync queue exists but **nothing replays to Supabase** |
| Growth Partner PWA | Service worker (vite-plugin-pwa) + offline banner | PARTIAL — works because everything is localStorage |

---

## 19. BUILD/TYPECHECK/LINT/TEST RESULTS

### 19.1 Main Website (`nexora-main-website`)

| Command | Result | Exit Code | Detail |
|---------|--------|-----------|--------|
| `npm ci` | ✅ PASS | 0 | 267 packages installed |
| `npx next build` | ❌ FAIL | 1 | Google Fonts fetch failure (network unavailable in sandbox). Not a code defect — environmental. |
| Tests (4/5 suites) | ✅ PASS | 0 | `auth-config` (2/2), `booking-role-guard` (6/6), `business-rules` (15/15), `proposal-flow` (5/5) — 28/29 pass |
| `rendered-html.test.mjs` | ❌ FAIL | 1 | Requires build artifact (expected in sandbox without network) |

### 19.2 Customer PWA (`custmer-Fresh-app`)

| Command | Result | Exit Code | Detail |
|---------|--------|-----------|--------|
| `npm install` | ✅ PASS | 0 | 526 packages installed |
| `npx tsc --noEmit` | ✅ PASS | 0 | No type errors |
| `npx vite build` | ✅ PASS | 0 | 2,181 modules transformed, 1,058 kB JS |

### 19.3 Owner PWA (`PINK-NEXORA-AAP`)

| Command | Result | Exit Code | Detail |
|---------|--------|-----------|--------|
| `npm install` | ✅ PASS | 0 | 364 packages installed |
| `npx tsc --noEmit` | ✅ PASS | 0 | No type errors |
| `npx vite build` | ✅ PASS | 0 | Built in 11.75s, PWA generated |

### 19.4 Growth Partner PWA (`pink-growth-partner-aap`)

| Command | Result | Exit Code | Detail |
|---------|--------|-----------|--------|
| `npm install` | ✅ PASS | 0 | 542 packages installed |
| `npx tsc --noEmit` | ✅ PASS | 0 | No type errors |
| `npx vite build` | ✅ PASS | 0 | Built in 14.14s, 1,915 kB JS |

---

## 20. PRD REQUIREMENT TRACEABILITY MATRIX

**Note:** The PRD file was not found on disk. This matrix is based on the PRD requirements as described in the user's Phase 0 instructions.

| PRD Requirement | Main Website | Customer PWA | Owner PWA | GP PWA | Status |
|----------------|-------------|-------------|----------|--------|--------|
| One shared Supabase backend | ✅ | ✅ | 🟡 (auth only) | ❌ | PARTIAL |
| Canonical server-backed booking | ✅ | ✅ | ❌ | ❌ | PARTIAL |
| Role-based authentication | ✅ | ✅ | 🟡 (no role guard) | ❌ | PARTIAL |
| RLS-based data isolation | ✅ | ✅ | N/A (no DB) | N/A | PARTIAL |
| Cross-app realtime updates | — | ✅ | ❌ | ❌ | PARTIAL |
| No fake production success | ✅ | ✅ | ❌ | ❌ | FAIL |
| No duplicate source of truth | ✅ | ✅ | ❌ (localStorage) | ❌ (localStorage) | FAIL |
| Customer booking workflow | ✅ | ✅ | — | — | PASS |
| Owner salon management | ✅ (proposals) | — | ❌ (localStorage) | — | FAIL |
| Growth Partner onboarding | ✅ | — | — | ❌ (fake) | FAIL |
| Commission tracking | UNVERIFIED | — | — | ❌ | UNVERIFIED |
| Payout processing | ❌ (not applied) | — | — | ❌ | FAIL |
| Review system | — | ❌ (table missing) | ❌ (mock) | — | FAIL |
| Wallet/Rewards | — | ❌ (client-side) | ❌ (mock) | ❌ (mock) | FAIL |

---

## 21. CONFIRMED DEFECTS WITH FILE PATHS AND LINE REFERENCES

### P0 — Critical (Blocks Production)

| # | Repository | File | Line | Current Behaviour | Required Behaviour | Phase |
|---|-----------|------|------|------------------|--------------------|-------|
| D01 | Growth Partner PWA | `src/components/LoginForm.tsx` | 215 | Auth sets `localStorage('isAuthenticated', 'true')` with 900ms timeout | Supabase Auth with `growth_partner` role | Phase 1 |
| D02 | Growth Partner PWA | `src/App.tsx` | 95 | `localStorage.getItem('isAuthenticated')` as auth check | Supabase auth session check | Phase 1 |
| D03 | Growth Partner PWA | `src/App.tsx` | 57–75 | `DEFAULT_PARTNER_PROFILE` and `DEFAULT_DASHBOARD_CACHE` hardcoded | Real data from Supabase `growth_partners`, `commission_events`, etc. | Phase 1 |
| D04 | Growth Partner PWA | `src/components/AddShop.tsx` | 3945 | `alert('Shop registration details submitted')` — no backend call | Write to `shop_onboarding_applications` via Supabase | Phase 1 |
| D05 | Growth Partner PWA | `package.json` | — | `@supabase/supabase-js` not in dependencies | Add as dependency | Phase 1 |
| D06 | Owner PWA | `src/screens/Dashboard.tsx` | 31 | Hardcoded `₹45,800` revenue, `24` bookings | Query real bookings/payments from Supabase | Phase 1 |
| D07 | Owner PWA | `src/screens/Bookings.tsx` | 24–50 | 3 hardcoded mock bookings | Query real `bookings` table | Phase 1 |
| D08 | Owner PWA | `src/screens/NewService.tsx` | 114, 146 | Services in localStorage `nexora_services` | Write to Supabase `services` table | Phase 1 |
| D09 | Owner PWA | `src/screens/NewStaff.tsx` | 114, 125 | Staff in localStorage `nexora_staff_list` | Write to Supabase `staff` table | Phase 1 |
| D10 | Owner PWA | `src/screens/Customers.tsx` | 31–80 | 4 hardcoded mock customers | Query real customers from bookings | Phase 1 |
| D11 | Owner PWA | `src/screens/Wallet.tsx` | 45+ | Hardcoded mock transactions | Query real `payments` table | Phase 1 |
| D12 | Owner PWA | `src/screens/RevenueAnalytics.tsx` | 47+ | Hardcoded chart data | Query real revenue data | Phase 1 |
| D13 | Owner PWA | `src/screens/Reviews.tsx` | — | Hardcoded mock reviews | Query real `reviews`/`customer_reviews` | Phase 1 |
| D14 | Owner PWA | `src/screens/Profile.tsx` | 54–112 | All business details in localStorage with hardcoded defaults | Read/write from `profiles` + salon data in Supabase | Phase 1 |

### P1 — High (Blocks Features)

| # | Repository | File | Line | Current Behaviour | Required Behaviour | Phase |
|---|-----------|------|------|------------------|--------------------|-------|
| D15 | Customer PWA | `src/lib/settingsRepository.ts` | 71 | Queries `customer_settings` — table missing | Apply `20260802_customer_phase1_schema.sql` | Phase 0 (migration) |
| D16 | Customer PWA | `src/lib/paymentMethodsRepository.ts` | 56 | Queries `saved_payment_methods` — table missing | Apply migration | Phase 0 (migration) |
| D17 | Customer PWA | `src/lib/supportRepository.ts` | 32 | Queries `support_tickets.created_by` — column missing | Apply migration | Phase 0 (migration) |
| D18 | Customer PWA | `src/lib/reviewsRepository.ts` | 42 | Queries `customer_reviews` — table missing | Apply migration | Phase 0 (migration) |
| D19 | Database | `20260801_*` migrations | — | 3 business-rule migrations never applied | Apply to shared Supabase project | Phase 0 (migration) |
| D20 | Owner PWA | `src/App.tsx` | 167–206 | Auth state change → dashboard, no `platform_role` check | Verify `platform_role === 'business_user'` | Phase 1 |
| D21 | Owner PWA | `src/screens/Settings.tsx` | 62 | Only does `services.select('id').limit(1)` health check | Full settings management against Supabase | Phase 1 |
| D22 | Owner PWA | `src/lib/sync-manager.ts` | 16 | IndexedDB sync-queue registered but never replays | Implement Supabase replay for offline actions | Phase 2 |
| D23 | Database | `refunds` table | — | No `booking_id` column | Add column or map existing | Phase 1 |

### P2 — Medium

| # | Repository | File | Line | Current Behaviour | Required Behaviour | Phase |
|---|-----------|------|------|------------------|--------------------|-------|
| D24 | Main Website | `nexora-app.tsx` (root) | — | Byte-for-byte duplicate of `app/nexora-app.tsx` | Remove root copy | Phase 1 |
| D25 | Owner PWA | `src/lib/supabase.ts` | 11 | Hardcoded anon key JWT in source | Use env var only | Phase 1 |
| D26 | Owner PWA | `api/auth/login.ts` | 4 | Hardcoded anon key JWT in source | Use env var only | Phase 1 |
| D27 | Customer PWA | `src/data/mockData.ts` | 12–15 | `INITIAL_LOCATION` hardcoded to Jaipur | Use GPS or user preference | Phase 2 |

---

## 22. MISSING OR UNVERIFIED DEPENDENCIES

| Dependency | Repository | Status | Impact |
|-----------|-----------|--------|--------|
| `@supabase/supabase-js` | Growth Partner PWA | **MISSING** from `package.json` | Cannot connect to Supabase |
| Supabase Realtime enabled | All tables | **UNVERIFIED** | Customer PWA realtime may silently fail |
| Razorpay API keys | Edge function env | **UNVERIFIED** | Payment flow may fail |
| SMTP configuration | Supabase Auth | **UNVERIFIED** | Email confirmation may not work |
| Google Fonts | Main Website build | **UNVERIFIED** (network-dependent) | Build fails without network |
| Gemini API key | Customer, Owner, Partner PWAs | **UNVERIFIED** | AI features may fail |

---

## 23. DEPLOYMENT AND RELEASE BLOCKERS

| # | Blocker | Severity | Detail |
|---|---------|---------|--------|
| B01 | Growth Partner PWA: zero Supabase integration | **P0** | Must add `@supabase/supabase-js`, create client, implement auth |
| B02 | Owner PWA: all business data is localStorage/hardcoded | **P0** | Must connect every screen to Supabase |
| B03 | 20260801 migrations not applied | **P0** | Business rules 3/4/5 not live |
| B04 | 20260802 customer schema migration not applied | **P1** | Customer PWA features broken |
| B05 | Growth Partner PWA fake auth | **P0** | No security, no data isolation |
| B06 | Owner PWA no role guard | **P1** | A logged-in customer could access owner screens |
| B07 | Deployment URLs unverified | **P2** | Cannot confirm live state |
| B08 | Realtime publication unverified | **P1** | Customer PWA subscriptions may be silent no-ops |

---

## 24. PRIORITIZED PHASE 1 IMPLEMENTATION PLAN

### Phase 1A — Foundation (Week 1)

1. **Apply unapplied migrations** to shared Supabase project (`qwaehqsmodekbgvnaavz`):
   - `20260801_growth_partner_commission_and_hold.sql`
   - `20260801_owner_daily_payout_2200_ist.sql`
   - `20260801_business_rules_verification.sql`
   - `20260802_customer_phase1_schema.sql`
   - Verify with `SELECT * FROM public.verify_business_rules()`

2. **Growth Partner PWA: Add Supabase client**
   - Add `@supabase/supabase-js` to `package.json`
   - Create `src/lib/supabase.ts` with project-ref validation
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.example`

3. **Growth Partner PWA: Replace fake auth**
   - Replace `LoginForm.tsx` localStorage auth with Supabase Auth
   - Register with `signup_role: 'growth_partner'`
   - Add `onAuthStateChange` listener in `App.tsx`

### Phase 1B — Owner PWA Business Data (Week 2)

4. **Owner PWA: Connect Dashboard to real data**
   - Query `bookings` for today's count and revenue
   - Query `payments` for revenue totals
   - Add Supabase realtime subscription for bookings

5. **Owner PWA: Connect Services to Supabase**
   - Replace `nexora_services` localStorage with `services` table CRUD
   - Maintain offline-first UI with eventual sync

6. **Owner PWA: Connect Staff to Supabase**
   - Replace `nexora_staff_list` localStorage with `staff` table CRUD

7. **Owner PWA: Connect Customers to Supabase**
   - Derive customer list from `bookings` + `profiles`
   - Remove hardcoded `INITIAL_CUSTOMERS`

8. **Owner PWA: Add role guard**
   - Verify `platform_role === 'business_user'` on auth state change

### Phase 1C — Growth Partner PWA Business Data (Week 3)

9. **Growth Partner PWA: Connect AddShop to Supabase**
   - Replace `alert()` with real `shop_onboarding_applications` insert
   - Connect to `save_growth_partner_salon_setup` RPC

10. **Growth Partner PWA: Connect Dashboard to real data**
    - Read `growth_partners`, `commission_events`, `partner_payouts`

11. **Growth Partner PWA: Connect Profile to Supabase**
    - Replace localStorage `nexora_partner_profile` with `growth_partners` table

### Phase 1D — Cross-App Integration (Week 4)

12. **Verify Realtime publication** on all subscribed tables
13. **Verify Razorpay edge function** end-to-end
14. **Remove duplicate `nexora-app.tsx`** from main website root
15. **Remove hardcoded anon keys** from Owner PWA source
16. **End-to-end booking flow test** across Main Website → Customer PWA → Owner PWA

---

## 25. RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R01 | Migrations fail on live DB | Medium | High | Test on staging first; all migrations are idempotent |
| R02 | Realtime not enabled on tables | Medium | High | Verify via Supabase dashboard before Phase 1 |
| R03 | Razorpay edge function missing/broken | Medium | High | Verify function exists; create if missing |
| R04 | Owner PWA localStorage→Supabase migration data loss | Low | Medium | Provide one-time migration utility; keep localStorage as fallback during transition |
| R05 | Growth Partner PWA full rewrite needed | Medium | High | Prioritize auth + shop onboarding first; dashboard data second |
| R06 | Schema drift between migrations and live DB | Low | High | Run `verify_business_rules()` after each migration |
| R07 | Email confirmation not configured | Medium | Medium | Configure SMTP or use magic link auth |
| R08 | Google Fonts build failure | Low | Low | Use local font fallback or `next/font/local` |

---

## 26. OVERALL COMPLETION ESTIMATE

Based **only** on evidence from code inspection:

| Area | Completion | Evidence |
|------|-----------|---------|
| Main Website (public) | ~70% | Auth, catalog, booking, legal pages work; homepage sections sparse |
| Customer PWA (core) | ~60% | Auth, booking, favorites, notifications work; settings, payment methods, support, reviews broken |
| Owner PWA | ~15% | Auth works; all business features are localStorage/hardcoded |
| Growth Partner PWA | ~5% | UI shell exists; zero backend integration |
| Shared Supabase backend | ~50% | Core tables exist; business-rule and customer-phase1 migrations unapplied |
| Cross-app integration | ~20% | Shared project ref verified; no cross-app data flow except booking |
| **Overall** | **~25%** | Weighted by feature completeness across all apps |

---

## 27. EXACT FILES THAT PHASE 1 IS EXPECTED TO MODIFY

### Growth Partner PWA (`pink-growth-partner-aap`)
- `package.json` — add `@supabase/supabase-js`
- `src/lib/supabase.ts` — **NEW FILE** — Supabase client initialization
- `src/App.tsx` — replace localStorage auth with Supabase auth
- `src/components/LoginForm.tsx` — replace fake auth with Supabase auth
- `src/components/AddShop.tsx` — connect to `shop_onboarding_applications` + `save_growth_partner_salon_setup` RPC
- `src/components/Dashboard.tsx` — read from Supabase
- `src/components/dashboard/ProfileScreen.tsx` — read/write `growth_partners`
- `src/components/dashboard/RewardsScreen.tsx` — read from `commission_events`
- `src/components/dashboard/PayoutsScreen.tsx` — read from `partner_payouts`
- `src/components/dashboard/WebsiteSettingsScreen.tsx` — connect to `salon_public_websites`
- `src/components/dashboard/AccountSettingsScreen.tsx` — Supabase-backed settings
- `.env.example` — add Supabase env vars

### Owner PWA (`PINK-NEXORA-AAP`)
- `src/screens/Dashboard.tsx` — replace hardcoded with Supabase queries
- `src/screens/Bookings.tsx` — replace hardcoded with `bookings` table
- `src/screens/ServicesList.tsx` — replace localStorage with `services` table
- `src/screens/NewService.tsx` — replace localStorage with `services` table
- `src/screens/ServiceDetail.tsx` — replace localStorage with `services` table
- `src/screens/NewStaff.tsx` — replace localStorage with `staff` table
- `src/screens/StaffManagement.tsx` — replace localStorage with `staff` table
- `src/screens/StaffDetail.tsx` — replace localStorage with `staff` table
- `src/screens/Customers.tsx` — replace hardcoded with `bookings` derived data
- `src/screens/CustomerProfile.tsx` — replace localStorage with Supabase
- `src/screens/Wallet.tsx` — replace hardcoded with `payments` table
- `src/screens/RevenueAnalytics.tsx` — replace hardcoded with real analytics
- `src/screens/Reviews.tsx` — replace hardcoded with `reviews`/`customer_reviews`
- `src/screens/Profile.tsx` — replace localStorage with `profiles` + salon data
- `src/App.tsx` — add `platform_role` verification
- `src/lib/supabase.ts` — remove hardcoded anon key, use env var only
- `api/auth/login.ts` — remove hardcoded anon key
- `api/auth/signup.ts` — remove hardcoded anon key

### Customer PWA (`custmer-Fresh-app`)
- No code changes expected until migrations are applied
- After migration: verify settings, payment methods, support, reviews work

### Main Website (`nexora-main-website`)
- `nexora-app.tsx` (root) — **DELETE** duplicate file
- No other code changes expected

### Database (Supabase)
- Apply `20260801_*` migrations (3 files)
- Apply `20260802_customer_phase1_schema.sql`
- Enable Realtime on required tables
- Verify `razorpay-create-order` edge function

---

## PHASE 0 EXIT GATE VERIFICATION

| Criterion | Status |
|-----------|--------|
| All four repositories inspected | ✅ |
| PRD mapped to existing system | ⚠️ PRD file not on disk; mapped to stated requirements |
| Current branches and commit SHAs recorded | ✅ |
| Build/test results recorded | ✅ |
| Environment-variable differences documented | ✅ |
| Shared Supabase project reference verified | ✅ (`qwaehqsmodekbgvnaavz`) |
| Mock and localStorage business-data usage documented | ✅ |
| RLS, roles and authentication gaps documented | ✅ |
| Deployment URLs and route ownership documented | ✅ (URLs UNVERIFIED) |
| No application code changed | ✅ |
| No database schema changed | ✅ |
| No production data changed | ✅ |
| No commit performed | ✅ |
| No push performed | ✅ |
| No deployment performed | ✅ |

---

**Phase 0 Status: PARTIAL**

The audit is substantively complete. The PRD document file was not found on disk, so the traceability matrix was built against the stated Phase 0 requirements rather than the formal PRD document. All other Phase 0 exit criteria are satisfied.

---

*End of Phase 0 audit. No files were modified, no commits made, no pushes performed, no deployments executed, no database schema changed, no production data altered.*
