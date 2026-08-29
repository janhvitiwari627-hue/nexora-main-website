# Arena Agent Work Audit + Landing.tsx Completion Prompt

**Audit date:** 2026-08-29 · **Branch:** `arena/01a04c34-nexora-main-website`
**Scope:** Full audit of the arena agent's reported work in this repo, status of the pending
"Refactor Landing.tsx Monolith" task, and a ready-to-use completion prompt for the
incomplete work.

---

## PART 1 — Task 1: "Remove Dead Code and Optimize Bundle Size" → ✅ COMPLETE (re-verified)

The previous arena-agent session's report (`DEAD_CODE_AUDIT_AND_BUNDLE_OPTIMIZATION.md`)
was audited claim-by-claim against the current tree. **Every claim holds.**

| Reported claim | Audit result |
|---|---|
| Named files (`src/hooks/useSalons.ts`, `useProfessionals.ts`, `useServices.ts`, `useCategories.ts`, `src/lib/catalog.ts`, `src/lib/catalogData.ts`) don't exist | ✅ True — 0 hits by filename, reference, and git-history search |
| Dead code removed (`parseSupabaseAuthError`, `OfferCard`, unused derivations, dead `PortalGateway` state, unused imports) | ✅ Verified absent from `app/nexora-app.tsx` |
| Dead files deleted (`app/lib/portalOrigins.ts`, `app/lib/database.types.ts`, `packages/auth/src/database.types.ts` — 1,113 lines) | ✅ Deleted; zero dangling imports |
| Contract-locked code kept with documented suppressions (`useCustomerSuggestions` destructure, `AdminUnavailable`) | ✅ Present with justification comments |
| Strict JSON payload typing via `app/lib/websiteConfig.ts` (5 ad-hoc casts replaced) | ✅ Module present; 8 usages wired; `Website.config` is `unknown` |
| Lint 0 errors / 0 warnings | ✅ Re-run this session: `npm run lint` → 0 problems (main-site eslint + job-portal tsc) |
| Typecheck clean | ✅ `npm run typecheck` → exit 0 |
| Build 0 warnings; vendor chunk splitting (app chunk 600 kB → 317 kB) | ✅ Verified last session end-to-end (build exit 0, zero `(!)` lines, artifact validated) |
| Tests: no regressions (2 pre-existing failures documented) | ✅ Confirmed pre-existing via pristine-tree runs |

**Environmental note (not a work gap):** the sandbox resets `node_modules/` between
sessions (it is excluded from snapshots). Re-run `npm run install:ci` before verifying
builds in a fresh session. The work itself is committed on the branch
(commit `3ab3623`, re-committed this session after a history reset).

---

## PART 2 — Task 2: "Refactor Landing.tsx Monolith, Optimize Bundle & Verify Build Integrity" → ❌ NOT STARTED (0% complete)

**No work exists for this task.** Evidence:

* `git log --all -- integration-packages/template-app` → only the base vendoring
  commit (`202a17a`). No refactor commits, no report file, no extracted components.
* `integration-packages/template-app/files/src/screens/Landing.tsx` is still a
  **4,408-line monolith** (spec said ~4,430 — matches the *current* untouched state).
* **Zero** `React.lazy` imports for any owner screen. The only lazy component in the
  entire app is `LocationMap` (inside `LocationPickerModal.tsx`).

### Requirement-by-requirement status

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Split Landing.tsx; owner screens 18–25 as lazy feature components | ❌ | All 10 owner tab sections are inline in Landing.tsx (see map below) |
| 2 | Entry chunk below Vite thresholds, no inflated `chunkSizeWarningLimit` | ❌ | Measured this session: **entry chunk = 2,269.05 kB (gzip 540.69 kB)** + `(!) Some chunks are larger than 500 kB` warning. (Worse than the 1,286 kB quoted in the spec — that number is stale.) A second warning exists: `supabaseClient.ts is dynamically imported … but also statically imported` (from `await import('./supabaseClient')` in `savedServiceService.ts`) |
| 3 | Suspense fallbacks on all lazy routes | ❌ | No lazy routes exist yet; nothing wrapped. (Baseline pattern exists: `LocationPickerModal` wraps its lazy `LocationMap` in `<Suspense>` with a skeleton fallback — lines 17, 240–252) |
| 4 | `npm run build` & `npx tsc` zero regression | ❌ (not attempted) | Baseline captured: `npx tsc --noEmit` inside `files/` → **exit 0** (clean today; refactor must keep it clean) |
| 5 | Integration test suite passes | ❌ (not attempted) | Baseline: root contract tests that read template-app sources pass today |

### Landing.tsx internal map (measured, for the executor)

```
Lines 1–112     imports (58 lucide icons, motion, 20+ modules) + Props/Appointment types
Line  113       export default function Landing(...) — single component
Lines 117–360   welcome page branch (publishState !== 'published')
Lines 974–1318  dashboard shell: sidebar + tab bar (desktop/mobile)
Lines 1319–1690 TAB overview    (owner screen 18)
Lines 1691–2302 TAB website     (owner screen 19)  ← embeds TemplateRenderer (2283)
Lines 2303–2885 TAB services    (not in App.tsx navigator; reachable via tab bar)
Lines 2886–2992 TAB bookings    (owner screen 21)
Lines 2993–3063 TAB staff       (not in App.tsx navigator; opens StaffManagementModule)
Lines 3064–3367 TAB payments    (owner screen 23)
Lines 3368–3458 TAB share       (owner screen 24)
Lines 3459–3539 TAB settings    (owner screen 25)
Lines 3540–3556 TAB referral    (owner screen 26 in DASHBOARD_TABS order — see below)
Lines 3557–4408 TAB branding    (+ TemplateRenderer at 4334)
```

`App.tsx` `DASHBOARD_TABS = ['overview','website','bookings','payments','share','settings','referral','branding']`
maps to screens **18–25** (`18 + tabIndex`); `services`/`staff` tabs exist only inside
Landing's tab bar. `getCurrentScreen()`/`navigateToScreen()` in `App.tsx` (lines 276–311)
is the "Universal 25-screen navigator" that must keep working.

### Hard constraints discovered by this audit (must be communicated to the executor)

1. **Build prerequisites.** The template app is NOT built by the root `npm run build`
   (only job-portal + beauty-industry are). Building it requires:
   1. `npm run install:ci` **at the repo root first** — the vendored
      `src/lib/supabaseClient.ts` imports `../../../../../packages/auth/src`, whose
      `@supabase/supabase-js` dependency resolves from the root `node_modules`;
   2. `npm install --no-audit --no-fund` inside `integration-packages/template-app/files/`;
   3. `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars (shared project
      `qwaehqsmodekbgvnaavz`; anon-key-shaped value, never a service key).
2. **Vendored-artifact provenance.** `integration-packages/template-app/README.md`
   documents `files/` as a "byte-identical audit artifact" of upstream
   `templateapp67-oss/FINAL-NEW-APP-TEMPLETE-` — but that is already stale: the Nexora
   integration modified `files/src/lib/supabaseClient.ts` to bind to the root
   `packages/auth`. In-place refactoring is the de-facto workflow; the executor MUST
   update the README provenance section to record that `files/` now carries in-repo
   changes on top of vendored HEAD `8d7bb25`.
3. **Contract tests read template-app sources.** `tests/phase15-mounting-verification`,
   `phase16-auth-flow-matrix`, `phase17-location-flow-matrix`, `phase10/11/12-parity`,
   `back-to-main-website`, `phase2-canonical-auth`, `phase6-unified-app-auth`,
   `phase7-app-entry-point`, `phase8-final-verification` all read files under
   `integration-packages/template-app/files/` (main.tsx, useAuth.ts, supabaseClient.ts,
   LoginModal.tsx, PasswordResetPage.tsx, location.ts, package.json, .env.example).
   **None pin Landing.tsx internals** — but none of the pinned files may break.
4. **Public API of Landing must not change.** `App.tsx` renders `<Landing …>` at two
   sites (dashboard module ~line 345, wizard view ~line 455) with the exact props
   contract (`data, setData, onNext, goToStep, onOpenStaffManagement, forcedActiveTab,
   onTabChange, onThemeChange`). Keep the default export + props identical.
5. **`.gitignore` hygiene is already fixed by this audit** (entries added for
   `integration-packages/*/files/node_modules/` and `…/dist/`). Do not commit build
   artifacts.
6. **Lazy precedent to follow:** `LocationPickerModal.tsx` lines 17/240–252
   (`const LocationMap = lazy(() => import('./LocationMap'))` + `<Suspense>` skeleton).
7. **Known warnings to eliminate:** (a) chunk-size warning; (b) the
   dynamic-vs-static import warning for `supabaseClient.ts` — convert the
   `await import('./supabaseClient')` calls in `savedServiceService.ts` to static
   imports (the module is statically imported everywhere else, so the dynamic import
   buys nothing and only emits the warning).

---

## PART 3 — COMPLETION PROMPT (hand this to the executing agent)

```text
ROLE: Frontend Architect

TASK: Refactor the Template App Landing.tsx Monolith, Optimize Its Bundle, and
Verify Build Integrity.

CONTEXT

- This is the Nexora main-website repo. The Template App lives at
  integration-packages/template-app/files/ (React 19 + Vite 6 SPA, deployed
  separately at https://final-new-app-templete.vercel.app; the main website only
  307-redirects /app/template to it).
- Dead-code cleanup and main-website bundle audit are ALREADY COMPLETE
  (see DEAD_CODE_AUDIT_AND_BUNDLE_OPTIMIZATION.md). Do NOT redo that work and do
  NOT touch app/, packages/, job-portal/, or beauty-industry/ except to verify
  no regressions.
- Current state of the target (audited):
  - src/screens/Landing.tsx is a 4,408-line single component mixing the public
    landing/welcome view with TEN inline owner dashboard tab screens.
  - Owner screens 18–25 are the DASHBOARD_TABS in src/App.tsx
    (['overview','website','bookings','payments','share','settings','referral',
    'branding'] → screen id = 18 + tabIndex); 'services' and 'staff' tabs exist
    only inside Landing's tab bar and must be extracted too.
  - Measured baseline build: single entry chunk 2,269 kB (gzip 541 kB) + a
    500 kB chunk-size warning + a "dynamically imported but also statically
    imported" warning for src/lib/supabaseClient.ts (from
    src/lib/savedServiceService.ts).
  - Only existing lazy import: LocationMap in components/LocationPickerModal.tsx
    (lazy + Suspense skeleton — follow this pattern).
  - Baseline `npx tsc --noEmit` inside files/ is CLEAN — it must stay clean.

REQUIREMENTS

1. MONOLITH REFACTORING
   - Split src/screens/Landing.tsx into modular feature components under a new
     directory, e.g. src/screens/landing/:
       * the public shell (welcome page + published public preview) stays small;
       * each owner tab becomes its own component file
         (OverviewTab, WebsiteTab, ServicesTab, BookingsTab, StaffTab,
         PaymentsTab, ShareTab, SettingsTab, ReferralTab, BrandingTab);
       * shared tab-bar/sidebar chrome, the Appointment type, and extracted
         helpers/hooks go into shared modules.
   - Keep `export default function Landing(...)` and its full props contract
     EXACTLY as-is (src/App.tsx renders it at two sites and must need zero
     changes). The "Universal 25-screen navigator"
     (getCurrentScreen/navigateToScreen in App.tsx) must keep working.
   - Clear separation: public landing code must not import owner-tab modules
     statically.

2. BUNDLE SIZE REDUCTION
   - Lazy-load every owner tab feature component with React.lazy + dynamic
     import(), so the public landing path never downloads owner screens.
   - Wrap each lazy route in <Suspense> with a real fallback (skeleton matching
     the dashboard card layout — follow LocationPickerModal's pattern).
   - Add vendor manualChunks in files/vite.config.ts (react/react-dom/scheduler,
     @supabase/supabase-js, motion, lucide-react; leaflet stays lazy via
     LocationMap). Do NOT raise chunkSizeWarningLimit.
   - Convert the `await import('./supabaseClient')` calls in
     src/lib/savedServiceService.ts to static imports to kill the
     dynamic-vs-static import warning.
   - TARGET: every emitted chunk < 500 kB and a warning-free `vite build`
     (entry chunk should drop from 2,269 kB to a few hundred kB).

3. BUILD & TYPE INTEGRITY
   - Setup (root first — the template app imports root packages/auth):
       npm run install:ci                                   # at repo root
       cd integration-packages/template-app/files
       npm install --no-audit --no-fund
   - Verify, from integration-packages/template-app/files/:
       VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co \
       VITE_SUPABASE_ANON_KEY=<anon-shaped key> npx vite build   # 0 warnings
       npx tsc --noEmit                                          # exit 0
   - Verify root repo is unaffected (from repo root):
       npm run lint && npm run typecheck
       NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co \
       NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-shaped key> \
       NEXORA_CUSTOMER_PWA_ORIGIN=https://remix-final-salon-app.vercel.app \
       NEXORA_OWNER_PWA_ORIGIN=https://shop-onwer-pink-nexora-aap.vercel.app \
       NEXORA_PARTNER_PWA_ORIGIN=https://pink-growth-partner.vercel.app \
       NEXORA_TEMPLATE_PWA_ORIGIN=https://final-new-app-templete.vercel.app \
       npm run build

4. VISUAL QA (Suspense verification)
   - Run the dev server (npm run dev inside files/ with the same env vars) and
     verify: welcome screen; wizard steps 1–16; dashboard screens 18–25 via the
     TopBar navigator; each tab shows the Suspense fallback while loading (no
     blank flash, no layout jump); staff/services tabs still open; theme change
     still propagates; login modal + password reset still mount.

5. INTEGRATION TESTS
   - From repo root run the contract suites that read template-app sources:
       node --import tsx --test tests/back-to-main-website.test.mjs \
         tests/phase15-mounting-verification.test.mjs \
         tests/phase16-auth-flow-matrix.test.mjs \
         tests/phase17-location-flow-matrix.test.mjs \
         tests/phase10-env-parity-contract.test.mjs \
         tests/phase11-storage-key-parity-contract.test.mjs \
         tests/phase12-dependency-parity-contract.test.mjs \
         tests/phase2-canonical-auth-contract.test.mjs \
         tests/phase6-unified-app-auth-contract.test.mjs \
         tests/phase7-app-entry-point-contract.test.mjs \
         tests/phase8-final-verification.test.mjs
   - Do not modify any file these tests pin (main.tsx, useAuth.ts,
     supabaseClient.ts, LoginModal.tsx, PasswordResetPage.tsx, location.ts,
     package.json, .env.example) unless a test change is unavoidable — if so,
     explain why in the report.

6. DOCUMENTATION & HYGIENE
   - Update integration-packages/template-app/README.md provenance section:
     files/ now carries in-repo changes on top of vendored HEAD 8d7bb25
     (record the refactor).
   - Never commit node_modules/ or dist/ under files/ (root .gitignore already
     covers integration-packages/*/files/{node_modules,dist}).
   - Write a completion report (root-level markdown, repo convention) with:
     before/after chunk sizes, the file map of the new landing/ directory,
     verification command outputs, and any deviations.

ACCEPTANCE CRITERIA

- [ ] Landing.tsx (or its LandingScreen replacement) < ~500 lines; owner tabs
      live in separate files under src/screens/landing/tabs/
- [ ] All 10 owner tabs lazy-loaded with Suspense fallbacks
- [ ] vite build: zero warnings, every chunk < 500 kB
- [ ] npx tsc --noEmit (in files/): exit 0
- [ ] Root repo: npm run lint 0/0, npm run typecheck clean, npm run build
      exit 0 with zero warnings
- [ ] All 11 contract test files above pass
- [ ] Landing default export + props contract unchanged; App.tsx untouched
      (or changes limited to what is strictly required and justified)
- [ ] README provenance updated; completion report written
```

---

## PART 4 — Summary

| Task | Status | Owner of remaining work |
|---|---|---|
| 1. Dead code + bundle + lint/build clean (main website) | ✅ Complete & re-verified | — |
| 2. Landing.tsx monolith refactor (Template App) | ❌ 0% — not started | Execute PART 3 prompt |

The quoted baseline in the task spec was stale: the real entry chunk is
**2,269 kB**, not 1,286 kB, and the monolith is 4,408 lines, not ~4,430. The
completion prompt above embeds the corrected, measured baseline and every
constraint discovered during this audit.
