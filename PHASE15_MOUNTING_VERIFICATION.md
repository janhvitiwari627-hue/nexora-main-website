# Phase 15 — Mounting Verification

**Date:** 2026-08-24  
**Branch:** `arena/01a03415-nexora-main-website`  
**Scope:** Main Website, Job Portal, Beauty Industry catalog, and vendored Template App

## Result

**Mounting contracts: PASS.** Every browser entry point now has a guarded React mount and a StrictMode-safe `App mounted successfully` diagnostic. Auth-owning apps have one provider and one cleaned-up Supabase auth listener. The Beauty Industry catalog is intentionally provider-free and hands authentication to the canonical Main Website.

This is a repository/build verification. A real browser console session was not available in this sandbox because no Chromium executable is installed; therefore the exact console line was verified in source and emitted production bundles, while HTTP production smoke checks verified that each HTML entry serves its `#root`.

## App-by-app checks

| App | React mount | Auth boundary/listener | Router | Supabase/env | Location lifecycle | Result |
|---|---|---|---|---|---|---|
| Main Website | Next/vinext framework root → `NexoraRoot` | One shared `@nexora/auth` `AuthProvider`; one listener with unsubscribe | `NexoraApp` path state + `popstate` | Shared cached client; literal `NEXT_PUBLIC_*` reads; fail-closed validation | Shared singleton `useLocation`; user ID comes from provider session | PASS |
| Job Portal | `createRoot(#root)` with missing-root guard | One `AuthProvider`; shell listener removed; provider owns the only listener and cleans it up | `resolveJobPortalRoute()` + `popstate` | Vite `VITE_*` reads; canonical project/key validation | `useLocationSync()` is mounted once and arms only for an authenticated user | PASS |
| Beauty Industry | `createRoot(#root)` with missing-root guard | No auth provider by design; no direct Supabase client; canonical login/signup handoff | Tab router (`currentTab`) | No client/env dependency by design | Not applicable | PASS |
| Template App | `createRoot(#root)` with missing-root guard | One new self-contained `AuthProvider`; `AuthModalProvider` remains the separate UI-modal provider; one auth listener | `RootRouter` pathname state | Vite env + canonical client validation | Not applicable | PASS |

## Fixes applied during verification

- Added `App mounted successfully` diagnostics with module-level guards so React StrictMode does not report duplicate successful mounts.
- Added clear `#root` guards to all Vite entry points.
- Added the missing Main Website `/login`, `/signup`, `/auth/login`, and `/auth/signup` route branches. Production smoke checks now render the login screen instead of falling through to the homepage.
- Removed the Job Portal shell's second `supabase.auth.onAuthStateChange` subscription. Provider state now handles sign-out synchronization without a duplicate listener.
- Converted the Template App's `useAuth()` from a per-component Supabase listener into one root `AuthProvider` context. This removes the many listener copies created by wizard screens and workspace components.
- Changed Template App password recovery to consume provider state instead of creating a screen-level auth listener.
- Added a named `TemplateWorkspaceHost` handoff component so the Main Website continues to route the external Template deployment through the guarded portal handoff.
- Added `npm run test:phase15` and `tests/phase15-mounting-verification.test.mjs` covering roots, providers, auth listeners, env validation, routers, and GPS loop guards.

## Verification commands

### Contract and static verification

- `npm run test:phase15` — **7/7 passed**
- `npm run test:contracts` — **164/164 passed**
- Phase 3/4/5/6/7/8/10/12 contracts — **38/38 passed**
- `npm run typecheck` — **passed**
- Root `npm run lint` with validated portal-origin variables — **0 errors, 17 existing warnings**
- Job Portal `npm run lint` — **passed**

### Production builds

- Main Website `npm run build` with non-secret verification env values and validated portal origins — **passed**
  - vinext production build completed
  - Sites Worker artifact validation completed
- Job Portal `npm run build` — **passed**
- Beauty Industry `npm run build` — **passed**
- Template App `npm run build` — **passed** (Vite client + bundled server)
- Missing-env fail-closed check — **passed**; production build stops with `VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required`

The Vite builds report existing large-chunk warnings. The vinext build reports the existing `middleware.ts` deprecation warning. Neither is a mounting failure.

The isolated `tsc --noEmit` checks for Beauty Industry and Template App still report pre-existing unrelated UI/domain typing errors in those imported surfaces. Their production Vite builds complete successfully, and the Phase 15 lifecycle checks introduce no TypeScript errors in the modified auth/mount paths.

### Production HTTP smoke checks

Started the built Main Website with validated non-secret verification values and requested:

- `/` → HTTP 200
- `/login` → HTTP 200, login screen rendered
- `/signup` → HTTP 200
- `/auth/login` → HTTP 200, login screen rendered
- `/auth/signup` → HTTP 200
- `/auth/forgot-password` → HTTP 200
- `/salons` → HTTP 200
- `/job-portal/` → HTTP 200, `#root` present
- `/distributors-beauty-industry/` → HTTP 200, `#root` present

Standalone production previews for Job Portal, Beauty Industry, and Template App also returned HTTP 200 with `#root` present.

## Limitations

- No live Supabase session or browser geolocation was exercised. The sandbox has no test accounts/live-auth connectivity configured.
- No Chromium executable was installed, so browser-level observation of the console line and React runtime hook warnings remains a deployment-environment check. Static contracts, production compilation, strict-mode-safe guards, listener cleanup, and HTTP serving were verified here.
- The Beauty Industry and Template App typecheck failures are unrelated pre-existing UI/domain mismatches; they do not occur in the root or Job Portal verification paths and do not prevent their production builds.
