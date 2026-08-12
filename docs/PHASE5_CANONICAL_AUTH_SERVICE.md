# Phase 5 — Canonical Auth Service

**Status:** implemented and verified · **Date:** 2026-08-12
**Package:** `@nexora/auth` **1.1.0**
**Auth Service contract:** **1.0.0**

Phase 5 is the single implementation every Nexora surface must use for
sign-up, sign-in, recovery, session reads, PKCE callbacks and role gates.
Main Website screens no longer call `supabase.auth.*` directly.

---

## 1. Why this exists

Phases 1–4 produced a shared client, a shared `AuthProvider`, and a
canonical `/auth/*` hub. Screens still reached around that stack:

* login / signup / reset on the Main Website called `client.auth.*`
* PWAs vendored Phase 2 helpers (`setPassword`, `completeAuthCallback`, `refresh`)
* password floors and role routing drifted between surfaces

A raw Supabase session is still **not** authorization. The only role
authority remains an active `profiles.platform_role` row.

---

## 2. Canonical method inventory

`packages/auth/src/service.ts` — `createAuthService(client)`:

| Method | Responsibility |
| --- | --- |
| `signUp()` | Public signup. Admin is never self-service. Password ≥ 8. |
| `signIn()` | Password login, then `getUser()` + active-profile check. |
| `signOut()` | End the session. |
| `sendPasswordReset()` | Neutral PKCE recovery email. |
| `updatePassword()` | Requires a verified user; re-checks the active profile. |
| `resendVerification()` | Signup confirmation email via the central callback. |
| `getCurrentUser()` | Verified user after an active-profile check. |
| `getSession()` | `null` when anonymous; invalid profiles are signed out. |
| `refreshSession()` | Refresh, then re-authorize. |
| `handleAuthCallback()` | PKCE exchange + user verify + active profile. |
| `requireAuth()` | Fail closed: session + user + active profile. |
| `requireRole()` | `requireAuth()` plus an allow-list on `profile.role`. |

`AuthProvider` / `useAuth()` expose every name above. Phase 2 aliases
remain until every PWA is migrated:

* `setPassword` → `updatePassword`
* `completeAuthCallback` → `handleAuthCallback`
* `refresh` → `refreshSession`

Do not add a second root `onAuthStateChange` listener.

---

## 3. Security behaviour

1. A Supabase session alone does not authorize access.
2. Identity-returning operations call `auth.getUser()`.
3. Active `profiles.platform_role` is the only role authority.
4. Missing, inactive or invalid profiles fail closed and are signed out.
5. URL parameters and localStorage never select or grant a role.
6. RLS / network failures stay typed (`forbidden`, `network`,
   `profile_missing`). They are never reported as a role failure.
7. Admin remains unavailable for public self-service signup.
8. PKCE and centralized redirect validation remain mandatory.

---

## 4. Main Website

`app/nexora-app.tsx` contains **no** `.auth.` calls. Covered flows:

* signup and login
* verification resend
* PKCE callback and `/auth/verify`
* logout
* password reset request / update
* session expiry
* current-session reads
* portal `requireAuth` / `requireRole` gates

Routing after a verified profile:

* **Customer** may resume only a validated local `returnTo`
* **Owner / Growth Partner / Delivery Partner / Admin** always continue
  to their server-profile home (`homePathForRole`)
* Delivery and Admin homes remain the authenticated
  “portal not mounted” fallbacks

Legacy compatibility routes stay: `/login`, `/signup`,
`/forgot-password`, `/reset-password`.

Canonical `AUTH_ROUTES` now use `/auth/*` exclusively.

---

## 5. External PWA rollout

One byte-identical patch:

`integration-packages/phase5-canonical-auth-service.patch`

Apply it **after** each PWA’s Phase 2 `auth-integration.patch`. It must
reproduce `packages/auth` under `src/vendor/nexora-auth/`.

Do not create per-app auth-service variants.

See `integration-packages/PHASE5_CANONICAL_AUTH_SERVICE.md`.

---

## 6. Verification

```bash
npm install
./node_modules/.bin/tsc --noEmit
npm run test:contracts
npm run build
```

Refs: PR #48 (Phase 1), PR #49 (Phase 2), PR #50 (Phase 3), PR #51 (Phase 4).
