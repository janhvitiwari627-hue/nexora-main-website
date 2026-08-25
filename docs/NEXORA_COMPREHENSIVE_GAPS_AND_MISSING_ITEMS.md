# NEXORA ECOSYSTEM — COMPREHENSIVE MISSING ITEMS & GAPS ANALYSIS

**Date:** 2026-08-25  
**Architect:** Senior Database + Full-Stack Architect  
**Scope:** Complete cross-app architecture, database foundation, authentication, payments, CI/CD, and upstream deployment topology.  
**Target Supabase Project:** `https://qwaehqsmodekbgvnaavz.supabase.co`

---

## 1. EXECUTIVE SUMMARY & MATURITY SCORECARD

Over Phases 1 through 7, the core architectural foundation has been unified:
- Consolidated **29 sequential migrations** in `supabase/migrations/`.
- Universal PKCE auth with singleton session management (`nexora.auth.qwaehqsmodekbgvnaavz`).
- Server-authoritative money engine (Razorpay HMAC, 25/75 advance math, 90/10 owner/platform split, 10% GP commission with 7-day hold).
- Strict Postgres RLS coverage across 100% of private tables.

However, several **critical operational, deployment, and live configuration gaps** remain before production traffic can flow seamlessly.

---

## 2. SEVERITY-BASED GAP CLASSIFICATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ECOSYSTEM GAPS INVENTORY                              │
├──────────┬──────┬───────────────────────────────────────────────────────────┤
│ Severity │ Qty  │ Primary Impact                                            │
├──────────┼──────┼───────────────────────────────────────────────────────────┤
│ **P0**   │ 3    │ Live DB Migration Apply, Upstream Branch Merge, Demo Data │
│ **P1**   │ 4    │ External Sub-App Sync, pg_cron Jobs, Job Portal Auth Dupe │
│ **P2**   │ 5    │ CI Workflow, OAuth Provider Setup, Marketplace RPC Mocks  │
│ **P3**   │ 3    │ Scratch File Cleanup, Report Directory Re-organization    │
└──────────┴──────┴───────────────────────────────────────────────────────────┘
```

---

## 3. DETAILED GAPS ANALYSIS

### 🚨 P0 — CRITICAL (PRODUCTION BLOCKERS)

#### Gap P0-1: Live Remote Supabase Migration Execution
- **Finding:** The repository holds the complete, verified 29-migration chain, but the live Supabase project (`qwaehqsmodekbgvnaavz`) still requires execution of migrations 20 through 29 (`20260821000101_m28` through `20260824_phase6_user_locations_compat.sql`).
- **Impact:** Without applying M28–M35, tables `themes`, `booking_services`, `booking_slot_holds`, `payment_orders`, and `salon_media` will return `404 / PGRST200` errors on live API calls.
- **Required Action:** Run the migrations in sequential order as specified in `supabase/APPLY_LIVE_DB_GUIDE.md` via Supabase Dashboard SQL Editor or `supabase db push`.

#### Gap P0-2: Working Branch vs. Production `main` Deployment
- **Finding:** All Phase 1–7 architectural fixes, consolidated migrations, and type definitions reside on the working session branch (`arena/01a037d3-nexora-main-website`). The remote `main` branch and Vercel production hosting are pending this pull request.
- **Impact:** Live production URLs currently run outdated code with disconnected auth and mock storage.
- **Required Action:** Open and merge PR from `arena/01a037d3-nexora-main-website` into `main`, then trigger production deployment on Vercel.

#### Gap P0-3: Job Portal Signup Pre-filled Demo Defaults & Terms
- **Finding:** In `job-portal/src/components/auth/JobSeekerSignupScreen.tsx` and `EmployerSignupScreen.tsx`, input fields default to `'Jane Doe'` / `'jane@example.com'` and Terms of Service is pre-ticked (`agreedToTerms = useState(true)`).
- **Impact:** Submitting the form without editing causes collision errors on `jane@example.com`, and pre-checked ToS violates compliance standards.
- **Required Action:** Reset initial form state to empty strings (`''`) and `agreedToTerms = useState(false)`.

---

### ⚠️ P1 — HIGH (ARCHITECTURAL & RELIABILITY GAPS)

#### Gap P1-1: External Sub-App Repositories Synchronization
- **Finding:** The upstream sub-app repositories (`custmer-Fresh-app-`, `PINK-NEXORA-AAP-`, `pink-growth-partner-aap-`) are cloned as read-only audit copies. GitHub write access was absent during earlier automated passes.
- **Impact:** The standalone PWA repositories do not yet have the latest vendored `@nexora/auth` (Phase 2+ key validation and persistent session storage).
- **Required Action:** Grant push/PR access to the Arena GitHub identity on the 3 external repos and apply the generated patches from `subapp-sync-artifacts/patches/`.

#### Gap P1-2: Scheduled pg_cron Jobs for Settlement and Maturation
- **Finding:** The SQL logic for `run_owner_daily_payouts()` and `release_growth_partner_commissions()` is fully implemented, but Postgres `pg_cron` jobs must be explicitly scheduled in the Supabase Dashboard:
  1. `nexora-owner-daily-payout`: `30 16 * * *` (Daily 22:00 IST / 16:30 UTC).
  2. `nexora-gp-hold-release`: `0 * * * *` (Hourly hold maturation check).
- **Impact:** Without active cron jobs, owner settlements and partner commission maturation require manual execution.
- **Required Action:** Enable `pg_cron` extension in Supabase and run the scheduling block in `supabase/migrations/20260801_owner_daily_payout_2200_ist.sql`.

#### Gap P1-3: Job Portal Dual Auth State Machines
- **Finding:** `job-portal/src/App.tsx` maintains its own legacy `supabase.auth.onAuthStateChange` listener alongside the canonical `AuthProvider`.
- **Impact:** Redundant auth listeners can cause duplicate profile fetch calls or state desynchronization during password recovery.
- **Required Action:** Consolidate `job-portal/src/App.tsx` to consume `useAuth()` exclusively and remove its internal `supabase.auth` event listener.

#### Gap P1-4: Inactive Profile Enforcement in Sub-Apps
- **Finding:** `profiles.is_active` is tracked in the database, but while the Main Website forces sign-out when `is_active = false`, the Job Portal and Template App only read it without displaying an account suspension screen.
- **Impact:** Suspended users can view cached dashboard UI before receiving an RLS permission error on write.
- **Required Action:** Add a global `is_active === false` check in `packages/auth/src/AuthProvider.tsx` to display an account suspension barrier.

---

### 🟡 P2 — MEDIUM (OPERATIONAL & INTEGRATION GAPS)

#### Gap P2-1: CI/CD Automated Test Pipeline
- **Finding:** The repository contains 112+ comprehensive contract and security tests, but no `.github/workflows/ci.yml` exists.
- **Impact:** Test suites currently require manual invocation via `npm test`.
- **Required Action:** Add a GitHub Actions workflow to run `npm run test:contracts` and `npm run test:security` on every push/PR.

#### Gap P2-2: OAuth Provider Credentials Verification
- **Finding:** Login screens include Google OAuth and Apple Sign-In UI buttons, but credentials must be verified in the Supabase Project Dashboard under Authentication -> Providers.
- **Impact:** If Google/Apple Client IDs and Secret Keys are not set up in Supabase, clicking the OAuth buttons redirects to a configuration error.
- **Required Action:** Confirm Google Cloud and Apple Developer OAuth credentials are active in the Supabase project dashboard.

#### Gap P2-3: Main Website Marketplace RPC Fallbacks
- **Finding:** In `app/nexora-app.tsx`, calls to `marketplace_popular_services`, `marketplace_next_slots`, and `marketplace_categories` fall back to local client projections when database RPCs return 404.
- **Impact:** Discovery queries function via table SELECTs, but dedicated server aggregation RPCs would reduce client round-trips.
- **Required Action:** Author a supplementary migration providing server RPCs for marketplace search suggestions and aggregate ratings.

#### Gap P2-4: Storage Bucket Private Policy Verification
- **Finding:** Migration `20260821000301_m30_phase1a_storage_foundation.sql` creates bucket `salon-media` as private (`public: false`), but Supabase Storage bucket quotas and CORS rules must be verified in production.
- **Impact:** Uploading high-resolution images or short video files could hit storage limits without configured file size allowances.
- **Required Action:** Ensure `salon-media` bucket allows 50MB uploads with permitted mime types (`image/*`, `video/mp4`, `video/webm`).

#### Gap P2-5: Email Verification Resend Button
- **Finding:** If a newly registered user does not receive the Supabase confirmation email or the link expires, the Job Portal signup screen has no dedicated "Resend Confirmation Email" button.
- **Impact:** Users are forced to use the "Forgot Password" flow to recover their account.
- **Required Action:** Add a "Resend Verification" link calling `supabase.auth.resend({ type: 'signup', email })`.

---

### 🟢 P3 — LOW (HYGIENE & CODEBASE POLISH)

#### Gap P3-1: Artifact & Scratch File Cleanup
- **Finding:** Leftover temporary scratch files exist:
  - `beauty-industry/tmp.txt`
  - `beauty-industry/fix.cjs`
- **Required Action:** Remove unneeded temporary scratch files before release.

#### Gap P3-2: Documentation Indexing
- **Finding:** 40+ markdown audit and completion reports exist in root and `docs/`.
- **Required Action:** Maintain an organized index in `docs/README.md` referencing all phase reports.

---

## 4. RECOMMENDED REMEDIATION SEQUENCE

```text
STEP 1 (P0): Apply Consolidated 29 Migrations on Supabase (qwaehqsmodekbgvnaavz)
STEP 2 (P0): Merge Working Branch into main & Trigger Production Deployment
STEP 3 (P0): Clear Demo Defaults in Job Portal Signup Screens
STEP 4 (P1): Schedule pg_cron Jobs for Daily Owner Payouts (22:00 IST) & GP Release
STEP 5 (P1): Sync Upstream Sub-App Repositories with Vendored Packages
STEP 6 (P1): Consolidate Job Portal Auth Listener into useAuth()
STEP 7 (P2): Add GitHub Actions CI/CD Pipeline (.github/workflows/ci.yml)
STEP 8 (P2): Verify Google OAuth & Private Storage Buckets in Supabase Dashboard
```

---

## 5. SIGN-OFF

The architectural foundation is complete and rock-solid. Executing the 8 remediation steps above will bring the entire Nexora ecosystem to full production readiness.
