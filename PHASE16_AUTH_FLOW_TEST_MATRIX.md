# Phase 16 — Auth Flow Test Matrix

**Date:** 2026-08-24  
**Branch:** `arena/01a03415-nexora-main-website`  
**Scope:** Main Website, Job Portal, Beauty Industry catalog, Template App, Customer PWA patch, Owner PWA patch, Growth Partner PWA patch

## Result

**Static auth-flow matrix: PASS.** All 13 required scenarios are represented for every auth-owning surface carried by this repository. The expected provider transitions are fail-closed:

```text
SIGNED_IN  -> authenticated UI after active profile resolution
SIGNED_OUT -> anonymous/guest UI with session and profile cleared
```

The Beauty Industry surface is intentionally provider-free. It never creates a session; it always hands login and signup to the canonical Main Website.

Live account creation, email delivery, refresh-token rotation and expired-session behavior require credentials and a reachable Supabase deployment. Those live checks were not run from this sandbox.

## Matrix

| # | Scenario | Main Website | Job Portal | Template App | Customer/Owner/Partner patches |
|---:|---|---|---|---|---|
| 1 | Anonymous visit | `anonymous`, guest route | null session, `welcome` | null user, guest/protected gate | login/guest branches present |
| 2 | Login | canonical `signIn` | provider `signIn` | `signInWithPassword` | shared provider `signIn` |
| 3 | Session persistence after refresh | `persistSession` + `getSession` | `persistSession` + `getSession` | `persistSession` + `getSession` | shared client/provider contract |
| 4 | Signup | canonical `signUp` | Jobs signup exception + provider | `signUpWithPassword` | shared provider `signUp` |
| 5 | Profile creation | `handle_new_user` trigger inserts `profiles` | shared trigger + profile lookup | shared trigger + auth profile state | shared `resolveProfile` + profile trigger |
| 6 | Profile loading | `resolveProfile` / active-profile gate | current-user `profiles` query | provider session/user state | active profile gate |
| 7 | Logout | optimistic null state before request | optimistic `session/profile` clear before request | optimistic context clear before request | provider/sign-out path clears guest state |
| 8 | Re-login | provider accepts a new authenticated session | same | same | same |
| 9 | Forgot password | `sendPasswordReset` / PKCE recovery URL | `forgotPassword` | `sendPasswordReset` | shared reset helper |
| 10 | Reset password | recovery route + `updatePassword` | reset screen + `updatePassword` | recovery screen consumes provider state + update | shared password update helper |
| 11 | Token refresh | explicit `TOKEN_REFRESHED` handling | explicit `TOKEN_REFRESHED` handling | listener applies refreshed session | shared provider `TOKEN_REFRESHED` handling |
| 12 | Expired session | typed `session_expired` + `/auth/expired` | expired-session error routes to guest/login | invalid/expired recovery messaging + guest gate | typed `session_expired` handling |
| 13 | Auth listener cleanup | `subscription.unsubscribe()` | `subscription.unsubscribe()` | `subscription.unsubscribe()` | provider and recovery listener cleanup in patch |

## Expected state transitions

### Main Website

- `SIGNED_IN` is deferred through `applySession`, resolves the current `profiles` row, and exposes `status: "authenticated"` only with a valid active profile.
- `SIGNED_OUT` is handled optimistically by `signOutCallback`: it increments the revision, clears `session` and `profile`, then requests server sign-out.
- A missing/inactive profile fails closed and signs the session out.
- Refresh uses the persisted PKCE session and re-runs profile authorization.

### Job Portal

- The provider is mounted once at `src/main.tsx` and owns the only auth listener.
- `SIGNED_IN`, `INITIAL_SESSION`, `USER_UPDATED`, and recovery events resolve provider state; `TOKEN_REFRESHED` updates the session without a profile race.
- `SIGNED_OUT` clears `session`, `profile`, and the session ref before awaiting the network call. This prevents stale workspace identity if the session is already expired or offline.
- The shell observes provider state and returns to `welcome` when a provider-owned sign-out arrives, including a cross-tab sign-out.

### Template App

- The root `AuthProvider` owns one listener for all screens; individual wizard screens no longer subscribe independently.
- The provider restores `getSession`, keeps loading bounded by a timeout, and consumes all auth events without calling auth methods from inside the listener.
- `signOutFromProvider` clears context before awaiting Supabase sign-out.
- Password recovery reads provider session state; the reset screen has no second auth listener.

### Customer, Owner, and Growth Partner PWA integrations

These are patch-based external apps in this repository, so their matrix is verified from the checked-in `auth-integration.patch` and README contracts. Each patch mounts the shared provider, uses the shared PKCE/session/profile helpers, includes token-expiry mapping, and cleans up listeners. Their live builds and live-user transitions must be rerun in each target repository after applying the patch.

## Verification commands

- `npm run test:phase16` — **13/13 passed**
- `npm run test:phase15` — **7/7 passed**
- `npm run test:contracts` — **164/164 passed** before the Phase 16-only test was added; Phase 15/16 targeted contracts also pass after the auth lifecycle changes
- `npm run typecheck` — **passed**
- Root `npm run lint` with validated portal-origin variables — **0 errors**, existing warnings only
- Job Portal `npm run lint` — **passed**
- Main Website production build — **passed**
- Job Portal integrated production build — **passed**
- Beauty Industry production build — **passed**
- Template App production build — **passed**

## Live verification limitation

No live Supabase credentials/test accounts or installed Chromium browser were available in this environment. Consequently, this phase does not claim that a real email was delivered, a real profile was inserted, a real refresh token rotated, or a real expired JWT was observed in a browser. The repository contracts and production builds verify the implementation paths; deployment acceptance should execute the same 13 rows against a disposable test account in a network-enabled environment.
