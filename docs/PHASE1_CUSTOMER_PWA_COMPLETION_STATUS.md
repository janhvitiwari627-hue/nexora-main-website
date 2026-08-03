# Phase 1 — Customer PWA Completion: Evidence-Based Status

**Date:** 2026-08-03 · **Verified by:** Arena session `arena/019fc556-nexora-main-website`
**Repos inspected:** `janhvitiwari627-hue/nexora-main-website` (this repo, shared DB migrations) · `freewebsite859-sudo/custmer-Fresh-app-` (Customer PWA, read-only at `main` = `4eff314`, "Merge pull request #16")
**Backend:** shared Supabase project `qwaehqsmodekbgvnaavz` (live REST surface **not** probed — no publishable key is stored in either repo, by design; evidence is repo-documented per the frozen Phase 0 audit).

## TL;DR

| Area | State |
|---|---|
| Customer PWA frontend | **~95% complete** — previous app-repo sessions (PR #14/15/16) already implemented the live pipeline. |
| Shared backend (this repo) | **2 gaps closed here today** by `supabase/migrations/20260803_customer_phase1_completion.sql`: `customer_reviews` provisioning + balance-ledger enforcement. |
| Remaining app-side patch | 1 small patch delivered ready-to-apply in `docs/phase1-customer-pwa/APPLY_AND_PATCH.md` (redeem via RPC). |
| Product decision needed | Server-side **accrual** of Glow Points (booking completion / referral) — see Task 7 notes. |

Evidence is file:line-based. The Phase 0 frozen audit
(`NEXORA_PHASE0_FREEZE_AND_EVIDENCE_AUDIT.md`) is untouched by design.

---

## Task 1 — Remove guest authentication bypass; enforce real Customer session — ✅ PASS (no changes needed)

- App gating (`custmer-Fresh-app/src/App.tsx` ≈ L136–170): `applySession()` requires a real Supabase session, then `verifyPlatformAccess()` → `waitForProfile()` and demands `is_active === true` + a valid `platform_role`; on mismatch it shows `role-conflict` and calls `signOut()`. Password-recovery links are handled separately (`isRecoveryLink()` ≈ L120–122) and never treated as login.
- No `guest` code path exists; the only matches are cosmetic display fallbacks (`RewardsScreen.tsx` L127–128, L169 — label/`GLOW-GUEST` when a profile has not loaded) with **no auth effect**.
- This repo's `app/nexora-app.tsx` BookingPage likewise redirects unauthenticated users to `/login?role=customer&returnTo=…` and shows a role-mismatch guard for non-customer roles.

## Task 2 — Use shared Supabase environment variables only — ✅ PASS (no changes needed)

- Single client entry: `src/lib/supabaseClient.ts` — reads **only** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, validates hostname == `qwaehqsmodekbgvnaavz.supabase.co` and rejects anything else at startup (`validateSupabaseConfig`, L58–73); invalid config renders a loud "Configuration required" state (`supabaseConfigError`, L103–106) — no silent drift to other projects.
- No other file in the app reads Supabase env vars. `GEMINI_API_KEY` (server.ts / api/suggest-times.ts) is an unrelated AI helper, server-side only.
- This repo's `app/nexora-app.tsx` uses `NEXT_PUBLIC_SUPABASE_URL ?? VITE_SUPABASE_URL` (+ ANON_KEY) against the same shared project.
- The real anon key is **not** committed anywhere (placeholder `PASTE_REAL_ANON_KEY_HERE` in `docs/customer-supabaseClient.fixed.ts`) — confirmed by scanning both repos.

## Task 3 — Replace `MOCK_SALONS` with approved/published shops — ✅ PASS (already completed by PR #14/15 line of work)

- `MOCK_SALONS` does not exist anywhere in the Customer PWA source.
- `src/lib/salonRepository.ts` reads live `salons` + `salon_public_websites` and only maps owner-published sites; unrated salons render a "New" tag instead of fake badges (file header, D2-approved).
- `src/data/mockData.ts` remains solely for static brand assets (`LOGO_URL`, `BANNER_URL`, `WELCOME_BG_URL`, `LOGO_SQUARE`) — no salon/business data.
- This repo surfaces the same live filter: published (`is_published = true`) + `verified` + `is_active` + not deleted (`fetchCatalog()` in `app/nexora-app.tsx`).

## Task 4 — Fetch services, staff and available slots from Supabase — ✅ PASS (with one noted scope limit)

- Services: live `services` table, `is_active` + `is_bookable_online` filter (`salonRepository.ts`; same query in this repo's BookingPage).
- Staff: mapped from the published site config `salon_public_websites.config.staff` (`mapStaff` in `salonRepository.ts`).
- Slots: generated from the salon's **real opening hours** on an hourly grid with a rolling real 7-day window (`SalonDetailScreen.tsx` L121–123, `CheckoutScreen.tsx` L39–81) — no hardcoded slots.
- **Scope note:** slot generation is opening-hours-derived; it does not subtract existing bookings/staff occupancy. Conflict safety comes from the server: `create_customer_booking` is the only write path and is the tested contract. Booking-aware availability is a backend feature request (would extend the existing RPC contract — deliberately **not** invented here per Task 6).

## Task 5 — Create and fetch only the logged-in customer's bookings — ✅ PASS

- Create: `createCustomerBooking()` → `rpc('create_customer_booking', …)` with crypto idempotency key (`bookingRepository.ts` L30–58); every call re-validates the session token first (`App.tsx` L799–802).
- Fetch: `listCustomerBookings()` filters `.eq('created_by', userId)` ordered by appointment (`bookingRepository.ts` ≈ L192–210), with `booking_items` joined per booking; realtime refresh keeps devices in sync.
- Server-side RLS on `bookings` is the enforcement layer; the UI filter matches it.

## Task 6 — Use the existing tested booking/payment contract; no new tables — ✅ PASS

- The app mirrors this repo's proven pipeline exactly: session → `rpc(create_customer_booking)` → `functions.invoke('razorpay-create-order', { stage: 'advance' })` with `Authorization: Bearer <access_token>` → checkout.js → Razorpay with the **server-computed** 25% advance (`bookingRepository.ts` header + L61–156; upstream in `app/nexora-app.tsx` BookingPage).
- Razorpay secret never reaches the browser (only `key_id`/`order_id` returned by the Edge Function).
- No new booking/payment DB objects were introduced by the app or by today's migration.

## Task 7 — Migrate favorites, reviews, rewards, memberships, preferences, notifications from mock/localStorage **where backend support exists**

| Feature | Backend support | App state | Verdict |
|---|---|---|---|
| Favorites | `favorite_salons/services/staff` live + RLS (audit L306) | `favoritesRepository.ts` — live tables + realtime | ✅ Done |
| Notifications | `notifications` live, `recipient_user_id` + RLS (audit L300) | `serverNotifications.ts` — live table + realtime; prudent missing-table fallback | ✅ Done |
| Preferences | `customer_settings` (added by `20260802` migration here) | `settingsRepository.ts` — live row + one-time import of pre-unification localStorage toggles | ✅ Done |
| Feedback/Support | `customer_feedback`, `support_tickets.created_by` (`20260802` migration) | `supportRepository.ts` | ✅ Done |
| Reviews | ⚠️ **was split-brain** — app targets `customer_reviews` (`reviewsRepository.ts` L1–10), but that table only existed as an unapplied file in the app repo (`db/customer_reviews.sql`); this repo's `20260802` migration extended the separate live `reviews` table. Audit L326: `customer_reviews` ❌ MISSING → reviews fell back to session-only | **Closed here today** — `customer_reviews` provisioned in this repo (`20260803_customer_phase1_completion.sql` §1) with the exact contract the app already consumes (RLS + realtime) | ✅ Fixed (backend) |
| Rewards / wallet | Ledger (`rewards`, `wallet_transactions`) + `credit_wallet` / `credit_reward_points` RPCs (`20260802` migration §6) | ⚠️ `RewardsScreen.tsx` bypassed the RPCs with direct client-side `profiles` arithmetic (earn: L287–290, redeem: L330–335) — silently broken the moment RLS denies it, and exploitable: nothing differentiated a UI write from any other client's write, and the mint RPCs were callable by any authenticated user (default PUBLIC grant) | ✅ Fixed here (backend lockdown §2–3) + app patch delivered in `docs/phase1-customer-pwa/APPLY_AND_PATCH.md` |
| Memberships | none (intentional) | honest "plans are coming soon" UI, no fake data (`ProfileScreen.tsx` L778–785) | ✅ Correct as-is per "where backend support exists" |

## What today's migration changes (shared backend, this repo)

`supabase/migrations/20260803_customer_phase1_completion.sql` — idempotent, safe to re-apply:

1. Provisions `public.customer_reviews` (exact app contract: table, indexes, RLS owner policies, realtime publication — guarded).
2. Adds `trg_nexora_guard_profile_balance_columns` (BEFORE UPDATE on `profiles`): blocks browser-side changes to `loyalty_points` / `wallet_balance_paise`; only `service_role` or server RPCs carrying the transaction-local `nexora.balance_writer` marker may change them. Normal profile edits (name, avatar, city…) are unaffected.
3. Re-issues `credit_wallet` / `credit_reward_points` with the marker and **revokes** them from `public`/`anon`/`authenticated` (explicit `service_role` grant keeps Edge Functions working).
4. Adds `public.redeem_loyalty_points(p_points, p_wallet_credit_paise, p_title)` — self-service (`auth.uid()`), row-lock balance re-check, ledger rows on both sides, and **tier-locked** to the app's published vouchers (500→₹100, 1000→₹250).
5. Adds `public.verify_customer_phase1_backend()` — run it like `verify_business_rules()`; every row must read `COMPLETE`.

**Product decision queued (not implemented — freezing an earning rule server-side needs sign-off):** Glow Points *accrual* on real booking completion / verified referral (currently the client toasts "+250" and hand-writes points, which the new guard blocks). Recommended: reuse the schema-tolerant completion machinery from the locked GP-commission layer (`completion_statuses`, dynamic status column) in a follow-up migration once the earning rate is confirmed as product law.

## Apply checklist (owner)

1. Supabase Dashboard → SQL Editor → run `supabase/migrations/20260802_customer_phase1_schema.sql` (if not already applied) then `20260803_customer_phase1_completion.sql`.
2. Run `select * from public.verify_customer_phase1_backend();` → all rows `COMPLETE`.
3. In the Customer PWA repo apply `docs/phase1-customer-pwa/APPLY_AND_PATCH.md` (one handler swap), set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` on the host, redeploy.
4. Regression: booking advance flow must pass unchanged (contract untouched).
