# Phase 1 — Centralized Supabase Auth & Environment Configuration

**Status:** implemented and verified · **Date:** 2026-08-11
**Shared project:** `qwaehqsmodekbgvnaavz`

---

## 1. What Phase 1 delivers

| Deliverable | Location |
|---|---|
| Supabase client initialization helper | `packages/auth/src/client.ts` + `packages/auth/src/env.ts` |
| Database SQL migration (profiles, roles, RLS) | `supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql` |
| Auth Provider / Context (login, signup, persistence, PKCE) | `packages/auth/src/AuthProvider.tsx` + `packages/auth/src/session.ts` |
| Clean error handling for auth states | `packages/auth/src/errors.ts` |
| Cross-origin redirect / PKCE policy | `packages/auth/src/redirects.ts` |
| Role vocabulary + alias layer | `packages/auth/src/roles.ts` |
| Main-website binding | `app/lib/supabaseClient.ts`, `app/lib/auth/index.ts` |
| Automated verification | `tests/phase1-centralized-auth.test.mjs`, `scripts/verify-phase1-sql.mjs` |

`packages/auth` is framework-agnostic and dependency-light so the Customer,
Shop Owner, Growth Partner and Delivery PWAs can consume the identical module.

---

## 2. Requirement 1 — the same Supabase project everywhere

`env.ts` is the only place that decides which project a bundle talks to. It
reads `NEXT_PUBLIC_SUPABASE_*` (Next/vinext) or `VITE_SUPABASE_*` (Vite PWAs)
and then **validates** the result:

* the host must be `qwaehqsmodekbgvnaavz.supabase.co` — a bundle pointed at any
  other project is treated as *unconfigured* rather than silently creating a
  second, parallel user directory (this is the exact drift that broke the
  Customer PWA previously, see `docs/CUSTOMER_AUTH_SHARING_FIX.md`);
* a key whose JWT payload says `"role":"service_role"` is rejected outright, so
  a privileged key can never ship in a browser bundle;
* missing URL vs. missing key vs. malformed URL are reported distinctly.

Because every app resolves the same project, `auth.users` rows — and therefore
identities — are literally shared.

```
NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
# Vite PWAs use the same values under VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

> **Vite note:** `import.meta.env` must be read as a full static expression.
> Vite's dev module-runner throws on dynamic access, which is why `env.ts`
> spells out each key.

---

## 3. Requirement 2 — cross-origin auth (PKCE)

Each PWA has its own origin, so a `localStorage` session on the website is
invisible to the Customer PWA. **Tokens are never copied between origins.**

The model implemented in `redirects.ts`:

1. The Main Website hosts the central auth surface: `/login`, `/signup`,
   `/auth/callback`, `/forgot-password`, `/reset-password`.
2. A PWA needing a session sends the user to the central login with a
   `returnTo` pointing back at its own origin.
3. `returnTo` is validated against a **strict origin allowlist**. Anything
   unknown (`https://evil.example.com`, `//evil.com`, `javascript:`,
   `/\evil.com`) is discarded and replaced with a safe default. This is what
   prevents open-redirect / token-phishing.
4. The destination origin runs its **own PKCE exchange** against the shared
   project. Only a single-use `code` travels in the URL; the `code_verifier`
   never leaves the destination's storage.

All clients are created with `flowType: "pkce"`, `persistSession: true`,
`autoRefreshToken: true`, `detectSessionInUrl: true`, and a namespaced
`storageKey` so multiple Nexora surfaces on one origin share exactly one
session slot instead of fighting over the default key.

Configure the allowlist per environment:

```
NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS=https://app-a.example,https://app-b.example
```

`supabaseRedirectAllowlist()` prints the exact list to paste into
**Supabase → Authentication → URL Configuration → Redirect URLs**. It must
match, or Supabase will refuse the redirect.

---

## 4. Requirement 3 — schema, roles and RLS

### Roles

The live database already used `customer` / `business_user` / `growth_partner`,
with a permanent role guard and contract tests depending on those values. Phase 1
therefore **extends** rather than renames — no live row, policy or app breaks:

| Requested in spec | Canonical value stored | Notes |
|---|---|---|
| `user` | `customer` | alias |
| `shop_owner` | `business_user` | alias |
| — | `growth_partner` | existing role, preserved |
| `delivery_partner` | `delivery_partner` | **new** |
| `admin` | `admin` | **new**, never self-service |

Aliases are normalized in two mirrored places — `roles.ts` (TypeScript) and
`private.normalize_platform_role()` (SQL) — and a test asserts they agree.

### profiles

`public.profiles.id` is a 1:1 FK to `auth.users(id)` with `on delete cascade`.
Phase 1 adds `phone`, `email`, `last_seen_at`, `role_assigned_at`,
`role_assigned_by`.

### RLS

`ENABLE` **and** `FORCE ROW LEVEL SECURITY`, with:

* `profiles_select_own` / `profiles_insert_own` / `profiles_update_own` — scoped to `auth.uid()`
* `profiles_select_admin` / `profiles_update_admin` — via `private.is_admin()`
* `anon` has **no** access to identities
* `DELETE` is granted to nobody; removal cascades from `auth.users`

Defence in depth beyond RLS:

* **Column-level grants** — `authenticated` may only update
  `full_name, avatar_url, phone, last_seen_at, updated_at`. The prior
  table-wide `UPDATE` grant is explicitly revoked first, otherwise it would
  have overridden the column list.
* **`guard_profile_platform_role()`** — `platform_role` is immutable for any
  non-service caller; a client cannot self-promote.
* **`guard_profile_financial_fields()`** — `wallet_balance_paise` and
  `loyalty_points` are server-ledger only.
* **`assign_platform_role()` / `set_profile_active()`** — the only supported
  promotion / suspension paths.

> **RLS gotcha handled here:** a policy is evaluated as the *calling* role, so
> `private.is_admin()` must be `EXECUTE`-able by `authenticated`. Without that
> grant every query on `profiles` fails with *"permission denied for function
> is_admin"*. The live-SQL harness caught exactly this.

---

## 5. Auth Provider

```tsx
import { AuthProvider, useAuth } from "@/app/lib/auth";

<AuthProvider>{children}</AuthProvider>

const { status, user, profile, role, error, signIn, signUp, signOut } = useAuth();
```

State machine: `initializing → authenticated | anonymous | unconfigured`.

* restores a persisted session on boot;
* subscribes to `onAuthStateChange` (multi-tab, token refresh);
* resolves the server profile that carries the authoritative role;
* **fails closed** — a session without an active, valid profile is signed out;
* guards against out-of-order async resolutions via a revision counter, so a
  fast login/logout cycle cannot resurrect a stale identity;
* `useRoleGuard(["business_user"])` gives a ready-made authorization decision.

The role **always** comes from `profiles.platform_role`, never from a URL,
never from `localStorage`.

---

## 6. Error handling

`errors.ts` maps failures to stable codes — `invalid_credentials`,
`email_not_confirmed`, `email_taken`, `weak_password`, `signup_disabled`,
`session_expired`, `pkce_failed`, `oauth_failed`, `rate_limited`, `network`,
`offline`, `profile_missing`, `profile_inactive`, `forbidden`,
`not_configured`, `unknown` — each with a user-safe message, a `retryable`
flag, and the original `cause` retained for debugging.

Two deliberate rules:

* **Unknown messages pass through verbatim.** Masking an unexpected Supabase
  error ("project is paused", "provider not enabled") is what made the earlier
  login incident undebuggable.
* **Recovery never reveals whether an email exists** —
  `neutralRecoveryMessage()`.

---

## 7. Verification

```bash
npm run test:phase1        # 50 behavioural + contract tests, then the SQL harness
npm run verify:phase1:sql  # applies the migration to a real Postgres engine
npm run test:contracts     # full suite: 192 tests
```

`scripts/verify-phase1-sql.mjs` runs the migration on **PGlite** (WASM
Postgres) against a Supabase-shaped fixture (`auth.users`, the `anon` /
`authenticated` / `service_role` roles, and a PostgREST-style `auth.uid()`).
It proves behaviour that static assertions cannot:

```
33/33 checks passed
  ✓ migration applies cleanly, and is idempotent on re-apply
  ✓ alias user→customer, shop_owner→business_user, delivery→delivery_partner
  ✓ self-assigned "admin" at signup is refused
  ✓ a user sees only their own profile; an admin sees all; anon sees none
  ✓ a user cannot promote themselves, credit their own wallet,
    edit another user's row, or insert a privileged profile
  ✓ deleting an auth user cascades to the profile
```

The only substitution the harness makes is dropping the `pgcrypto` extension
line, which PGlite lacks and Supabase always has.

Results: **TypeScript clean**, **production build passes**, **all auth routes
render 200**, **no new lint problems** (the 2 pre-existing errors are unchanged).

---

## 8. Rollout checklist

1. Apply the migration (Dashboard → SQL Editor, or `psql -f`).
2. `select * from public.verify_phase1_auth();` → every row `passed = true`.
3. Set the Redirect URLs in Supabase to match `supabaseRedirectAllowlist()`.
4. Set the identical `SUPABASE_URL` / `ANON_KEY` in **every** app deployment.
5. Promote administrators with
   `select public.assign_platform_role('<uuid>', 'admin');` (service_role only).

## 9. Notes for the PWA rollout (Phase 2)

`packages/auth` is self-contained. Each PWA can vendor or symlink it, then:

```ts
import { AuthProvider, useAuth, buildLoginUrl } from "@nexora/auth";

// Bounce an anonymous visitor to the central login and come back here.
window.location.assign(
  buildLoginUrl({
    centralOrigin: "https://nexora-main-website.vercel.app",
    returnTo: window.location.href,
    role: "customer",
  }),
);
```

Add each new origin to `DEFAULT_ALLOWED_AUTH_ORIGINS` (or the env var) **and**
to the Supabase Redirect URL list — both, or the handoff will be refused.

## Main Website mount (Phase 3)

The main website mounts the shared `AuthProvider` exactly once in
`app/NexoraRoot.tsx`. Both `app/page.tsx` and the catch-all route render that
root, so every central auth page observes the same PKCE session and profile
state as every portal route. `NexoraApp` consumes `useAuth()` and no longer owns
a second inline Supabase session/profile subscription.

Customer, Owner, and Growth Partner portals remain role-gated same-origin
paths (`/app/customer`, `/app/owner`, `/app/partner`). Delivery Partner and
Administrator accounts are authenticated and role-verified before receiving an
explicit "not mounted" fallback; no unimplemented portal dashboard is copied
into the main website.

## Main Website canonical auth hub (Phase 4)

The Main Website is the canonical auth surface for the Nexora ecosystem:

| Route | Responsibility |
| --- | --- |
| `/auth/login` | Password and optional Google PKCE login |
| `/auth/signup` | Self-service account creation with a server-authoritative role |
| `/auth/forgot-password` | Neutral password-recovery request |
| `/auth/reset-password` | PKCE recovery-session validation and password update |
| `/auth/verify` | Email verification through the same secure PKCE flow as the callback |
| `/auth/callback` | PKCE exchange, active-profile verification, and role routing |
| `/auth/logout` | Shared-provider sign-out followed by a validated same-origin path |
| `/auth/continue` | Wait for provider restoration, then resume login or the verified role portal |

Existing links to `/login`, `/signup`, `/forgot-password`, and
`/reset-password` remain compatibility routes; newly rendered links use the
canonical `/auth/*` paths. Redirect parameters cannot supply an absolute,
protocol-relative, backslash-smuggled, query-bearing, or fragment-bearing
logout/continuation path. Customer deep links are resumed only after that
same-origin validation. Other authenticated roles always continue to their
server-profile role home, so URL parameters cannot select another portal.
Delivery Partner and Administrator role homes intentionally resolve to their
authenticated "portal not mounted" fallbacks until those apps are deployed.

## Canonical Auth Service (Phase 5)

`@nexora/auth` **1.1.0** adds the versioned Auth Service contract **1.0.0** in
`packages/auth/src/service.ts`. Every consumer — Main Website and every PWA —
must use `createAuthService()` / `useAuth()` for the twelve canonical
operations (`signUp`, `signIn`, `signOut`, `sendPasswordReset`,
`updatePassword`, `resendVerification`, `getCurrentUser`, `getSession`,
`refreshSession`, `handleAuthCallback`, `requireAuth`, `requireRole`).

A Supabase session is still not authorization. Identity-returning calls
verify the current user; an active `profiles.platform_role` is the only
role authority; missing or inactive profiles fail closed and sign out.
Phase 2 aliases (`setPassword`, `completeAuthCallback`, `refresh`) remain
until external consumers migrate. `AUTH_ROUTES` now point at `/auth/*`;
the Main Website keeps `/login`, `/signup`, `/forgot-password` and
`/reset-password` as compatibility routes only.

See `docs/PHASE5_CANONICAL_AUTH_SERVICE.md`.
