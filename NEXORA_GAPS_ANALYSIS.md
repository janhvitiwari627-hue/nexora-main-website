# NEXORA — MISSING ITEMS & GAPS ANALYSIS

**Date:** 2026-08-24 · **Branch:** `arena/01a031b0-nexora-main-website` · **Scope:** Phases 2–7 rollout (canonical auth contract → entry points) plus the production signup incident, audited against the actual repository and the live deployment.

Every finding below was verified against code, tests, or the live system — file paths are cited so each item is independently checkable.

---

## 1. Status matrix — what is DONE in this repo

| Phase | Deliverable | Status | Evidence |
|---|---|---|---|
| 2 — Canonical auth contract | `job-portal/src/lib/supabase.ts` (PKCE, `nexora.auth.qwaehqsmodekbgvnaavz`, full validation); shared validator hardened (malformed key, `sb_secret_`, non-HTTPS); template-app client pinned | ✅ | `packages/auth/src/env.ts`, `tests/phase2-canonical-auth-contract.test.mjs` (16/16) |
| 3 — AuthProvider | `job-portal/src/auth/AuthProvider.tsx`, exact context surface, 6 events, single listener, unsubscribe cleanup | ✅ | `tests/phase3-job-portal-auth-provider-contract.test.mjs` (8/8) |
| Incident — "Unable to create account" | Root cause found (raw postgrest plain-object throws + `instanceof Error` masking); all 25+ raw throws normalized; 11 catch sites fixed; `PGRST202` explained | ✅ code-side | `job-portal/src/utils/errors.ts`, `tests/job-portal-error-surface-contract.test.mjs` (9/9) |
| 4 — Profile synchronization | `auth.users.id → profiles.id` own-row only; `platform_role`/`is_active` read-only; role self-assignment refused client-side | ✅ | `tests/phase4-job-portal-profile-sync-contract.test.mjs` (8/8) |
| 5 — Location synchronization | `useLocationSync` bound to canonical `@nexora/location`; SIGNED_IN-gated watchPosition; no fabrication | ✅ | `tests/phase5-job-portal-location-sync-contract.test.mjs` (8/8) |
| 6 — Location DB contract | `user_locations` compat mirror, one-way sync trigger, own-row RLS ×4 verbs, no anon; PGlite runtime proof | ✅ SQL authored | `supabase/migrations/20260824_phase6_user_locations_compat.sql`, `tests/phase6-location-db-runtime.test.mjs` |
| 7 — Entry points | All four apps audited; exactly-once wrapping; nested-provider guard | ✅ | `tests/phase7-app-entry-point-contract.test.mjs` (8/8) |

---

## 2. CRITICAL gaps (P0 — production is affected today)

### P0-1 · The database migrations have not been applied to the live project
- The signup pre-check RPC `job_email_portal_role` exists **only** in `job-portal/supabase/migrations/20260808170800_jobs_permanent_portal_roles.sql` — a migration set **separate** from the canonical `supabase/migrations/`. Nothing in the repo shows it was ever applied to live project `qwaehqsmodekbgvnaavz`; a 404 `PGRST202` here is the prime suspect for the production "Unable to create account" failure.
- The new Phase 6 migration (`20260824_phase6_user_locations_compat.sql`) is authored and runtime-proven, but **unapplied**.
- **Action:** apply both migration sets (SQL editor or `supabase db push`), run `NOTIFY pgrst, 'reload schema';`, then confirm `select * from verify_phase6_user_locations_contract();` and `verify_phase7_location_security();` are all-green.

### P0-2 · All fixes live only on the working branch — production still runs the broken code
- Every Phase 2–7 change and the signup-error fix is on `arena/01a031b0-nexora-main-website` (7 commits, `1a1a4ef..6dd51f6`). `main` and the Vercel deployment are untouched.
- **Action:** open/merge a PR from the working branch, redeploy, and re-test signup with DevTools → Network.

### P0-3 · Production signup form ships demo values
- `JobSeekerSignupScreen.tsx:18-25`: `fullName` defaults to `'Jane Doe'`, `email` to `'jane@example.com'`, and **Terms of Service is pre-ticked** (`agreedToTerms = useState(true)`); the employer screen also pre-ticks terms (`EmployerSignupScreen.tsx:21`).
- Real users submitting the untouched form will try to register `jane@example.com` (duplicate → confusing error), and pre-consented ToS is a compliance problem.
- **Action:** empty defaults, terms unchecked. One-line changes; intentionally left out of the phase work because it changes product behavior — needs sign-off.

---

## 3. HIGH gaps (P1 — architectural debt / correctness risk)

### P1-1 · The Job Portal runs TWO auth state machines
- `App.tsx` still owns its bespoke bootstrap (`getSession()` + its own `onAuthStateChange` listener at `App.tsx:179`) *alongside* the Phase 3 `AuthProvider`. That is 2 listeners and 2 sources of truth (the Phase 3 spec tolerated this; the provider was mounted non-invasively).
- Risk: divergent state on edge transitions (e.g. recovery links, multi-tab sign-out).
- **Action (Phase 8 candidate):** migrate `App.tsx` to consume `useAuth()`/`onPasswordRecovery` and delete its private listener.

### P1-2 · `is_active` is fetched but not enforced in the Sub-App
- The Main Website fails closed (inactive profile ⇒ signed out). The Job Portal's `AuthProvider` exposes `profile.is_active` read-only but takes no action on `false`.
- **Action:** decide policy (sign out vs. banner) and enforce in `applySession`.

### P1-3 · No CI — every contract suite is local-only
- `.github/workflows/` does not exist. The 100+ contract/runtime tests (including RLS proofs) only run when someone remembers to.
- **Action:** add a workflow running `npm run test:contracts`, `npm run test:security`, and the two sub-app typechecks on PR.

### P1-4 · Pre-existing failures on `main` (not introduced by this work; reproduced on base commit `6d5ceac`)
- `phase6-unified-app-auth-contract`: expects `TemplateWorkspaceHost` in `app/nexora-app.tsx` — missing.
- `phase4-canonical-auth-hub` + `phase5-canonical-auth-service`: `AUTH_ROUTES` canonical-route assertions fail.
- **Action:** triage whether code regressed or the contracts are stale; currently masks real regressions in those suites.

### P1-5 · The other Sub-Apps (separate repos) have not received Phases 2–7
- Customer/Owner/Growth-Partner PWAs integrate via `integration-packages/*/auth-integration.patch` + `phase6-unified-auth.patch`. No new patch set carries the Phase 2 validation hardening (malformed-key / `sb_secret_` / non-HTTPS checks) or the Phase 3–5 provider/location patterns to them.
- **Action:** cut a Phase 2+ refresh of the vendored `@nexora/auth` in each integration package.

---

## 4. MEDIUM gaps (P2 — UX and hygiene)

| # | Gap | Detail / evidence | Suggested action |
|---|---|---|---|
| P2-1 | No "resend verification email" UI in the Job Portal | Only `ForgotPasswordScreen` exists; with email-confirmation ON, a user whose link expired is stuck (the improved no-session message tells them to check their inbox, but offers no button) | Add resend via `supabase.auth.resend({ type: 'signup' })` |
| P2-2 | No location-permission UX in the Job Portal | `useLocationSync` runs headless; when permission is denied there is no badge/prompt like the Main Website's `LocationBadge` | Reuse `app/lib/location/LocationBadge.tsx` pattern |
| P2-3 | `user_locations` mirror has no consumer yet | The compat table satisfies the Phase 6 contract, but no Sub-App reads it; if nothing ever will, schedule deprecation instead | Track consumers; revisit in 1–2 phases |
| P2-4 | supabase-js version skew | Root `2.95.0` vs job-portal `^2.109.0` (two nested copies). Bundle/type dedupe is in place (`vite resolve.dedupe` + tsconfig `paths`), but version alignment would remove the class of problem | Align on one version at the workspace root |
| P2-5 | OAuth providers unverified | Signup screens offer Google/Apple; no evidence Apple (esp.) is configured in the live Supabase project — would fail at redirect | Verify provider config or hide buttons |
| P2-6 | Env documentation drift | `job-portal/.env.example` predates Phase 2 validation (accuracy of key-format guidance unchecked); root `.env.example` likewise | Refresh examples with the canonical URL + key-shape rules |

---

## 5. LOW gaps (P3 — cosmetic / process)

- **Report sprawl:** 30+ phase/audit `.md` files at repo root make navigation hard; an index (`docs/REPORTS.md`) would help.
- **`docs/customer-supabaseClient.fixed.ts`** is a stale one-off artifact superseded by the integration packages.
- **`beauty-industry/tmp.txt`, `fix.cjs`** — leftover scratch files in a shipped app directory.
- **Job Portal `npm run lint` is only `tsc --noEmit`** — no ESLint coverage for the Sub-App while the root repo has a full ESLint setup.

---

## 6. Recommended execution order

1. **P0-1 / P0-2** — apply migrations to `qwaehqsmodekbgvnaavz`, merge the branch, redeploy, re-test signup (Network tab: `rpc/job_email_portal_role` → expect 200).
2. **P0-3** — clear demo defaults + unticked terms (needs product sign-off, 10 minutes of work).
3. **P1-1 / P1-2** — Phase 8: consolidate the Job Portal onto `useAuth()` and enforce `is_active`.
4. **P1-3** — CI workflow so the 150+ tests gate every PR.
5. **P1-4** — triage the three stale/broken contracts on `main`.
6. **P1-5** — regenerate integration packages for the external PWAs.
7. P2 items opportunistically alongside the above.

---

## 7. What is explicitly NOT a gap (checked and intentional)

- **Beauty Industry has no AuthProvider/Supabase client** — by architecture: static catalog with canonical `/login?returnTo=` handoff; it must never mint sessions (`beauty-industry/src/auth.ts`).
- **Template App keeps its own `AuthModalProvider`** — operator-approved vendored design; tests forbid a `@nexora/auth` dependency.
- **`user_locations` accepts direct own-row writes** — required by the Phase 6 compat contract; the one-way sync + monotonic guard prevents it from competing with the canonical authority.
- **Signup role metadata (`job_role`) in `auth.signUp` options** — advisory only; the server (`job_register_role`, `ROLE_NOT_ALLOWED`, `auth.uid()`-keyed) remains the sole role authority, now also refused client-side for privileged roles.
