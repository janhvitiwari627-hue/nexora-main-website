# NEXORA — SUPABASE BACKEND AUDIT & GAPS ANALYSIS (FRESH)

**Date:** 2026-08-27 · **Branch:** `arena/01a03ec5-nexora-main-website` · **Auditor:** Agent (Arena.ai)
**Scope:** All in-repo apps (Main Website, Job Portal, Beauty Industry) audited against the versioned schema. External PWAs audited via their integration packages only.
**Target Supabase Project:** `https://qwaehqsmodekbgvnaavz.supabase.co`
**Method:** Static cross-reference of every `rpc()` / `from()` call site against every SQL artifact in the repository. Live DB unreachable from the audit sandbox (egress blocked) — live-state items are marked **[LIVE?]** and need a one-time dashboard check.

---

## 1. EXECUTIVE SUMMARY

| # | Finding | Severity | Fix status in this PR |
|---|---|---|---|
| F-1 | 19 marketplace RPCs called by the homepage are **not version-controlled anywhere** in the repo | 🔴 P0 | Reference migration authored (`supabase/migrations/20260827_supplementary_marketplace_rpcs.sql`) — **diff against live before applying** |
| F-2 | Live DB has drifted from version control (offers table alone: app expects 15+ columns, versioned schema has 8) | 🔴 P0 | Documented; needs a live schema export (see §5) |
| F-3 | **Three separate migration sets** fragment the schema source of truth | 🟠 P1 | Documented with consolidation path |
| F-4 | Job Portal signup ships demo defaults + pre-ticked ToS | 🔴 P0 | ✅ **FIXED in this PR** |
| F-5 | No CI — 112+ contract tests only run locally | 🟠 P1 | ✅ **FIXED in this PR** (`.github/workflows/ci.yml`) |
| F-6 | Env example docs predate the publishable-key validation | 🟡 P2 | ✅ **FIXED in this PR** (`.env.example` refreshed) |
| F-7 | Migrations M28–M35 + job-portal set + Phase 6 set unapplied on live **[LIVE?]** | 🔴 P0 | Manual step — `supabase/APPLY_LIVE_DB_GUIDE.md` |
| F-8 | pg_cron jobs (owner payouts 22:00 IST, GP hold release hourly) unscheduled **[LIVE?]** | 🟠 P1 | Manual step — scheduling SQL is in the migrations |
| F-9 | Dual auth state machines in Job Portal `App.tsx` | 🟠 P1 | Open (Phase 8 candidate) |
| F-10 | Inactive-profile enforcement missing in sub-apps | 🟠 P1 | Open (policy decision needed) |

---

## 2. INVENTORY — WHAT EACH APP CALLS

### 2.1 Main Website (`app/nexora-app.tsx`, `packages/auth`)

**RPCs called (19):**
`marketplace_search` (×2), `marketplace_salon_stats` (×2), `marketplace_categories`, `marketplace_homepage_sections`, `marketplace_membership_plans`, `marketplace_offers`, `marketplace_partner_promos`, `marketplace_popular_services`, `marketplace_recommendations`, `marketplace_search_suggestions`, `marketplace_slots`, `marketplace_sponsored`, `marketplace_trending`, `marketplace_top_rated`, `marketplace_next_slots`, `my_membership_status`, `my_recently_viewed`, `record_marketplace_event`, `resolve_partner_code` (plus `owner_salon_ids` from `packages/auth`).

**Tables read directly (9):** `salon_public_websites`, `salons`, `services`, `staff`, `offers`, `salon_hours`, `favorite_salons`, `profiles`, `business_locations` (+ `growth_partners` in `packages/auth`).

### 2.2 Job Portal (`job-portal/` — workspace in this repo)

**RPCs (9):** `job_email_portal_role` (×2), `mark_application_viewed` (×2), `get_job_applicant_cards` (×2), `submit_job_application`, `shortlist_application`, `reject_job`, `reject_application`, `mark_candidate_hired`, `job_register_role`, `get_job_conversation_summaries`, `create_job_post`.

**Tables (9):** `job_posts`, `job_notifications`, `profiles`, `job_user_roles`, `job_saved_jobs`, `job_salon_members`, `job_applications`, `job_seeker_profiles`, `job_messages`.

### 2.3 Beauty Industry / Distributors (`beauty-industry/` — workspace in this repo)

**Tables (9):** `messages`, `user_locations` (×2), `profiles_supplier` (×2), `products` (×2), `users`, `supplier_products`, `rfqs_enquiries`, `quotes`, `profiles_buyer`.

### 2.4 External PWAs (separate repos — integration packages only)

Customer (`remix-final-salon-app`), Owner (`shop-onwer-pink-nexora-aap` / `pink-nexora-aap`), Growth Partner (`pink-growth-partner`), Template (`final-new-app-templete`) — all consume the shared `@nexora/auth` package contract (project ref `qwaehqsmodekbgvnaavz`, PKCE, namespaced storage key). Their data-plane calls are **not auditable from this repo** — see §5 action A-4.

---

## 3. SCHEMA-VS-CODE CROSS-REFERENCE (the core of this audit)

### 3.1 RPC coverage matrix

| App RPC | Defined in repo SQL? | Notes |
|---|---|---|
| All 19 `marketplace_*` / `my_*` / `resolve_partner_code` / `record_marketplace_event` | ❌ **NO** | Not in `supabase/migrations/`, not in `job-portal/supabase/migrations/`, not in `beauty-industry/src/db/` |
| All 11 `job_*` RPCs | ✅ Yes | In `job-portal/supabase/migrations/` (separate set — see F-3) |
| `owner_salon_ids`, auth/profile functions | ✅ Yes | Canonical set |
| Money engine (`create_authoritative_customer_booking`, Razorpay, payouts) | ✅ Yes | Canonical set, M28–M35 |

**Evidence the marketplace RPCs exist in the LIVE database (unversioned):** `app/nexora-app.tsx` comments state *"Security-definer marketplace_search already works when PostgREST cannot see column-only GRANTs"* — i.e. the function is live and was applied outside version control (SQL editor). The homepage works in production **only because** of this unversioned surface.

### 3.2 Table drift (versioned schema vs app expectations)

| Table | Versioned columns | App expects | Delta |
|---|---|---|---|
| `offers` | 8 (id, salon_id, title, description, discount_type, discount_value, is_active, created_at) | 15+ (terms, maximum/minimum_paise, valid_from/until, code, membership_only, eligible_services, remaining_global…) | 🔴 live-extended, unversioned |
| `salons` | (via references) | gender_category, landmark, location_* overrides, rating_average… | 🟠 partially versioned |
| `marketplace_categories`, `marketplace_events`, `recently_viewed`, `membership_plans`, sponsored shops/brands/videos tables | ❌ none | required by RPC contracts | 🔴 existence unknown **[LIVE?]** |

### 3.3 Three migration sets (F-3)

1. `supabase/migrations/` — 29 canonical migrations (money engine, RLS, auth, locations)
2. `job-portal/supabase/migrations/` — 10 job-portal migrations (jobs core/functions/RLS/seed/security/views/roles/approval)
3. `beauty-industry/src/db/` — schema.sql + 3 migrations (supplier onboarding, RLS, location sync)

**Risk:** applying one set without the others, or applying them out of order, breaks the shared project. `supabase/APPLY_LIVE_DB_GUIDE.md` covers only set 1.

---

## 4. FIXES SHIPPED IN THIS PR

| Fix | Files | Detail |
|---|---|---|
| ✅ F-4 demo defaults | `job-portal/src/components/auth/JobSeekerSignupScreen.tsx`, `EmployerSignupScreen.tsx` | Empty `fullName`/`email`/`phone`; ToS unticked (`useState(false)`). Kills the `jane@example.com` duplicate-registration failure and the pre-consent compliance problem. |
| ✅ F-5 CI pipeline | `.github/workflows/ci.yml` | Two jobs: contracts+security tests (with typecheck) and lint (main + job-portal), Node 22, on every push/PR to `main`. |
| ✅ F-6 env docs | `.env.example` | Publishable-key format (`sb_publishable_…`) documented; canonical URL/key-source note; guidance matching `packages/auth` validation. |
| ✅ F-1 reference migration | `supabase/migrations/20260827_supplementary_marketplace_rpcs.sql` | Reference implementations of the 6 catalog RPCs buildable on versioned tables (categories, salon_stats, top_rated, trending, offers, popular_services). **Header instructs diffing against live definitions before applying** — live DB already has unversioned variants. |

---

## 5. REMEDIATION SEQUENCE (post-merge)

```
A-1  Export the live schema FIRST (before any apply):
     Supabase Dashboard → Database → Backups/SQL editor:
       select prosrc, proconfig from pg_proc where proname like 'marketplace_%';
       \d+ public.offers   (and the other drifted tables)
     Store the export in supabase/live-export/ — this closes the version-control gap
     revealed by F-1/F-2 and makes the supplementary migration safely diffable.

A-2  Diff the reference migration (20260827_…) against the live definitions and
     either adopt it or replace it with the live bodies, then version-control.

A-3  Apply outstanding migrations per supabase/APPLY_LIVE_DB_GUIDE.md
     (M28–M35 canonical; then the job-portal set; then beauty-industry set).
     Run `NOTIFY pgrst, 'reload schema';` after each set.

A-4  Cut a Phase-2+ refresh of the vendored @nexora/auth in the three external
     PWA repos (patches in subapp-sync-artifacts/patches/).

A-5  Schedule the two pg_cron jobs (owner payouts 16:30 UTC daily; GP hold
     release hourly) — SQL is in 20260801_owner_daily_payout_2200_ist.sql.

A-6  Consolidate the Job Portal's legacy auth listener into useAuth() (F-9)
     and decide the inactive-profile policy for sub-apps (F-10).
```

---

## 6. WHAT CANNOT BE VERIFIED FROM THIS REPO

- Whether the live DB currently has the marketplace RPCs (strong evidence yes — see §3.1)
- OAuth provider configuration (Google/Apple) in the Supabase dashboard
- Storage bucket quotas/CORS for `salon-media`
- Whether M28–M35 + the job-portal migrations were ever applied (the prior gaps doc says no; re-verify — **[LIVE?]**)

Each is a dashboard check; none blocks this PR.
