# Landing Refactor & Bundle Optimization — Completion Report

**Date:** 2026-08-29
**Scope:** `integration-packages/template-app/files/` (React 19 + Vite 6 SPA)
**Prompt:** PART 3 of `LANDING_REFACTOR_AUDIT_AND_COMPLETION_PROMPT.md`
**Result:** ✅ All acceptance criteria met. Entry chunk **2,269.05 kB → 97.79 kB (−96%)**, all 54 emitted chunks **< 500 kB**, `vite build` **zero warnings**, `tsc --noEmit` **exit 0**, runtime smoke test **7/7**, root repo lint/typecheck/build **green**, **zero new test failures**.

---

## 1. Before → After (bundle)

Baseline (measured in the audit turn, same env vars):

| Metric | Before | After |
|---|---|---|
| Entry chunk (`index-*.js`) | **2,269.05 kB** (gzip 540.69 kB) | **97.79 kB** (gzip 29.29 kB) |
| Chunks > 500 kB | 1 (entry) | **0** (largest: 392.83 kB shared site-sections chunk) |
| Build warnings | 2 (chunk size + `supabaseClient` dynamic-vs-static) | **0** |
| Lazy chunks | 1 (LocationMap) | 40+ (10 tabs, dashboard shell, 14 wizard steps, 3 modules, 5 theme renderers, booking flow, live preview, LocationMap) |
| `Landing.tsx` | 4,408 lines, 1 component | **37 lines** (branch) + 26 modules under `src/screens/landing/` |

Initial JS for the public landing path is now: entry (97.79) + react-vendor (202.56) + supabase-vendor (173.02) + motion-vendor (128.89) + icons-vendor (69.14) + index.css — **≈ 671 kB unminified-total for the vendors that the SPA shell genuinely needs at boot**; every owner screen, wizard step, theme renderer, and the booking flow download on demand.

### Final chunk table (top 20 of 54; all < 500 kB)

| Size | Gzip | Chunk |
|---:|---:|---|
| 392.83 kB | 93.43 kB | `SiteServiceDirectory-*.js` (shared public-site sections: galleries, service directory, video mgmt, i18n) |
| 202.56 kB | 63.60 kB | `react-vendor-*.js` |
| 173.02 kB | 45.62 kB | `supabase-vendor-*.js` |
| 164.88 kB | 37.11 kB | `SiteBookingFullFlow-*.js` (lazy: loads when a visitor taps Book) |
| 151.81 kB | 44.50 kB | `LocationMap-*.js` (lazy, pre-existing) |
| 128.89 kB | 42.38 kB | `motion-vendor-*.js` |
| 124.12 kB | 24.76 kB | `OwnerDashboard-*.js` (lazy module) |
| **97.79 kB** | **29.29 kB** | **`index-*.js` (entry)** |
| 80.51 kB | 20.29 kB | `StepServices-*.js` (lazy step) |
| 69.14 kB | 14.04 kB | `icons-vendor-*.js` |
| 68.34 kB | 14.44 kB | `PreviewPane-*.js` (shared, lazy-reachable) |
| 64.08 kB | 15.88 kB | `DashboardScreen-*.js` (lazy dashboard shell) |
| 58.63 kB | 14.64 kB | `StepSocials-*.js` |
| 50.77 kB | 13.88 kB | `SiteHeader-*.js` (shared) |
| 39.63 kB | 8.76 kB | `StaffManagementModule-*.js` (lazy module) |
| 36.12 kB | 9.87 kB | `StepPhotos-*.js` |
| 30.62 kB | 7.44 kB | `NailLashStudioTemplateRenderer-*.js` (lazy per-theme renderer) |
| 29.13 kB | 6.31 kB | `WebsiteTab-*.js` (lazy tab) |
| 28.81 kB | 7.80 kB | `StepTeam-*.js` |
| 21.23 kB | 3.84 kB | `ServicesTab-*.js` (lazy tab) |

Remaining tab chunks: OverviewTab 16.20, PaymentsTab 17.29, BookingsTab 13.00, BrandingTab 18.59, ReferralTab 19.57, ShareTab 4.26, SettingsTab 3.24, StaffTab 3.21 kB — all lazy.

---

## 2. New structure — `src/screens/landing/`

```
src/screens/Landing.tsx                  37 lines  — public entry; branches welcome vs (lazy) dashboard;
                                                   props contract byte-compatible with the monolith
src/screens/landing/
├── types.ts                             53  — DashboardTab, LandingProps, Appointment, DashboardNotification
├── DashboardContext.tsx                172  — context + useDashboard() + the full typed state contract
├── useDashboardState.ts                971  — ALL dashboard state/handlers moved verbatim; builds the context value
├── DashboardScreen.tsx                 245  — shell: provider + sidebar slot + header + lazy tab slots + modal slots
├── DashboardSidebar.tsx                268  — desktop docked nav + mobile tab pills (the shared tab-bar chrome)
├── WelcomeScreen.tsx                    63  — pre-publish public welcome page
├── TabSkeleton.tsx                      20  — Suspense fallback matching the dashboard card layout
├── ScreenSkeleton.tsx                   13  — Suspense fallback for full-screen lazy surfaces (also used by App.tsx)
├── tabs/                                     — all 10 owner tabs, each React.lazy-loaded:
│   ├── OverviewTab.tsx                 381
│   ├── WebsiteTab.tsx                  624
│   ├── ServicesTab.tsx                 590
│   ├── BookingsTab.tsx                 114
│   ├── StaffTab.tsx                     77
│   ├── PaymentsTab.tsx                 311
│   ├── ShareTab.tsx                     97
│   ├── SettingsTab.tsx                  86
│   ├── ReferralTab.tsx                  23
│   └── BrandingTab.tsx                  22
└── modals/                                   — the 7 dashboard overlays (context-wired):
    ├── NewAppointmentModal.tsx         123
    ├── ServiceDrawerModal.tsx          167
    ├── PackageDrawerModal.tsx          133
    ├── VoiceModal.tsx                  134
    ├── AiSuggestModal.tsx              180
    ├── LiveSiteModal.tsx                67  — keeps TemplateRenderer lazy inside the preview
    └── HelpCenterModal.tsx              69
```

**Architecture:** `DashboardScreen` owns no state; `useDashboardState` holds every piece of the old monolith's state (declarations and handler bodies moved **verbatim** — mechanical line-slicing, no logic edits) and exposes it through `DashboardContext`. Tabs, modals, and chrome consume `useDashboard()`. `Landing.tsx` splits the old conditional-hooks pattern (early return before hooks) into two proper components — the pre-existing Rules-of-Hooks violation is fixed as a side effect.

**Public landing never downloads owner screens:** `Landing` statically imports only `WelcomeScreen`; `DashboardScreen` is `React.lazy` behind a `Suspense` and only loads once `publishState === 'published'`.

## 3. All changes

| File | Change |
|---|---|
| `src/screens/Landing.tsx` | 4,408-line monolith → 37-line branch (see structure above) |
| `src/screens/landing/**` | **new** — 26 modules (structure above) |
| `src/App.tsx` | 17 static screen/module imports → `React.lazy` + `Suspense` (justified deviation, see §5) |
| `src/components/TemplateRenderer.tsx` | 5 full-site theme renderers → lazy per-theme chunks |
| `src/components/SiteBookingHost.tsx` | `SiteBookingFullFlow` → lazy (downloads on first Book CTA) |
| `src/components/PublicSalonView.tsx` | `TemplateRenderer` → lazy |
| `src/lib/savedServiceService.ts` | removed 6 shadowing `await import('./supabaseClient')` lines (static import already existed) — kills the dynamic-vs-static warning |
| `vite.config.ts` | vendor `manualChunks`: react/react-dom/scheduler, `@supabase/*`, motion/motion-dom/motion-utils, lucide-react. Leaflet deliberately not grouped (stays in lazy LocationMap chunk). `chunkSizeWarningLimit` untouched (500 kB) |
| `scripts/smoke-landing-refactor.mjs` | **new** — jsdom runtime smoke test (7 checks) |
| `scripts/lib/vite-env-shim.mjs` | **new** — in-memory `import.meta.env` shim so the smoke test can run under node/tsx (never affects Vite builds) |
| `integration-packages/template-app/README.md` | provenance updated (see §6) |

Untouched, as pinned: `main.tsx`, `lib/useAuth.ts`, `lib/supabaseClient.ts`, `components/LoginModal.tsx`, `components/PasswordResetPage.tsx`, `lib/location.ts`, `package.json`, `.env.example`.

## 4. Verification status

Run from `integration-packages/template-app/files/` (root `node_modules` + `files/node_modules` installed):

| Check | Command | Result |
|---|---|---|
| Template build | `VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npx vite build` | ✅ exit 0, **0 warnings**, 54 chunks all < 500 kB |
| Template types | `npx tsc --noEmit` | ✅ exit 0 |
| Runtime smoke | `node --import tsx scripts/smoke-landing-refactor.mjs` | ✅ **7/7** (welcome; shell+lazy Overview via context; Services tab on real click; New Appointment modal; forcedActiveTab share/payments/bookings) |
| Root lint | `npm run lint` | ✅ exit 0, 0 errors / 0 warnings |
| Root typecheck | `npm run typecheck` | ✅ exit 0 |
| Root build | `NEXT_PUBLIC_SUPABASE_* + 4×NEXORA_*_PWA_ORIGIN npm run build` | ✅ exit 0 (same pre-existing npm deprecation notices + Next.js route-classification info as baseline) |
| Contract tests | `node --import tsx --test tests/{back-to-main-website,phase2,phase6,phase7,phase8,phase10,phase11,phase12,phase15,phase16,phase17}-*.test.mjs` | ✅ 90/94 pass — **4 failures are pre-existing at HEAD `a96ae6a`** (A/B-verified via `git stash`: identical failures with this refactor stashed). Details §5 |

### Runtime evidence for the jsdom caveat

framer-motion exit animations never complete in jsdom, so `AnimatePresence` keeps a switching-away tab mounted and `mode="wait"` can gate a second consecutive switch. Verified **identical or worse on the pre-refactor monolith** (checked out from git and driven through the same scenario): the original also dual-mounts tabs after a switch, and its whole nav bar disappears after one switch. The smoke test therefore mounts a fresh tree per tab scenario — which mirrors how each lazy path first loads in a browser.

## 5. Deviations & judgement calls

1. **`src/App.tsx` was modified** (17 imports → `React.lazy`). The prompt allowed "changes limited to what is strictly required and justified": refactoring Landing alone left the entry at 927 kB because App.tsx statically imported all 14 wizard steps and 3 feature modules; the < 500 kB target is unreachable without lazy-loading them. No behavior change — every render site is wrapped in `<Suspense fallback={<ScreenSkeleton …/>}>`. The Landing props contract itself is unchanged; both `<Landing>` render sites in App.tsx are untouched.
2. **`DashboardScreen` state is centralized in one context** rather than prop-drilling ~60 fields into 10 tabs + 7 modals. This kept the extraction mechanical (JSX moved verbatim, zero logic edits) and is the standard incremental pattern for splitting a 4.4k-line monolith without behavior risk.
3. **4 pre-existing contract-test failures** (phase7: NexoraRoot regex; phase11 ×2: storage-key scan trips over `files/node_modules/@supabase/auth-js/*.d.ts` — an artifact of the sandbox having deps installed; phase17: customer-pwa patch assertion). All verified identical at baseline HEAD with this refactor stashed — **not caused by this work**, and left untouched (fixing them is out of scope and phase11's would mean touching test files that pin nothing relevant).
4. **`PublicSalonView` / `SiteBookingHost` / `TemplateRenderer` lazy conversions** were needed because `main.tsx` (pinned) statically imports `PublicSalonView`; splitting inside the non-pinned components was the only compliant way to get the public-site tree out of the entry chunk.
5. Wizard steps get a brief `ScreenSkeleton` fallback on **first** load of each step chunk (cached afterwards). This is the intended code-splitting UX; step-to-step transitions after warm cache are instant, and AnimatePresence enter animations are unaffected.

## 6. Documentation & hygiene

- `integration-packages/template-app/README.md` provenance section updated: `files/` is the vendored HEAD `8d7bb251fab0c6d640c99f7d95a1daf38f41abe4` plus (a) the pre-existing `supabaseClient.ts` rebinding and (b) this refactor — the stale "byte-identical" claim is corrected and every changed file is listed.
- `node_modules/` and `dist/` under `files/` remain gitignored (root `.gitignore` covers `integration-packages/*/files/{node_modules,dist}`); nothing large is committed.

## 7. Acceptance criteria — final scorecard

- [x] Landing.tsx < ~500 lines (37) — owner tabs in `src/screens/landing/tabs/`
- [x] All 10 owner tabs lazy-loaded with Suspense fallbacks (`TabSkeleton`, dashboard card layout)
- [x] `vite build`: zero warnings, every chunk < 500 kB (largest 392.83 kB; no `chunkSizeWarningLimit` change)
- [x] `npx tsc --noEmit` in files/: exit 0
- [x] Root repo: lint 0/0, typecheck clean, build exit 0 (no new warnings vs baseline)
- [x] Contract tests: 90/94 pass; 4 failures pre-existing at HEAD (stash-verified), zero new failures
- [x] Landing default export + props contract unchanged; App.tsx changes limited to lazy-loading imports (justified in §5.1)
- [x] README provenance updated; this completion report written
