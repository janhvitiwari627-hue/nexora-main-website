# Phase 5 — Canonical Auth Service rollout (Customer, Owner, Growth Partner)

**Shared patch:** `phase5-canonical-auth-service.patch`
**Apply after:** each PWA’s Phase 2 `auth-integration.patch`
**Vendored path:** `src/vendor/nexora-auth/`
**Result:** that directory must be **byte-identical** to
`packages/auth` in `nexora-main-website` (`src/*` plus `package.json`).

The same patch is used for:

* Customer PWA — `freewebsite859-sudo/custmer-Fresh-app-`
* Owner PWA — `promptaivideo4-coder/PINK-NEXORA-AAP-`
* Growth Partner PWA — `diamondpeomotion-cyber/pink-growth-partner-aap-`

Do **not** create incompatible per-app auth-service variants.

## What it adds

* `@nexora/auth` **1.1.0**
* Auth Service contract **1.0.0** (`service.ts`)
* The twelve canonical methods on `createAuthService()` and `useAuth()`
* Phase 2 aliases kept: `setPassword`, `completeAuthCallback`, `refresh`
* Canonical `AUTH_ROUTES` under `/auth/*`
* Signup verification resend and PKCE/recovery handling through the service

Security is unchanged and must not be weakened:

* a session is not authorization
* `profiles.platform_role` on an active row is the only role authority
* missing / inactive profiles fail closed and sign out
* URL params and localStorage never grant a role
* admin is never self-service
* PKCE + redirect allowlisting stay mandatory

## Apply

```bash
# after the Phase 2 auth-integration.patch is already on the branch
git apply /path/to/integration-packages/phase5-canonical-auth-service.patch
npm install
npx tsc --noEmit   # Growth Partner is clean; Customer/Owner may still have
                   # pre-existing unrelated tsc errors
npm run build
```

`git apply --check` must pass on the Phase 2-vendored tree.

## After apply

Compare every file under `src/vendor/nexora-auth/` with
`nexora-main-website/packages/auth` (`package.json` at the package root,
everything else under `src/`). They must match byte-for-byte.

Then migrate that PWA’s screens from remaining `supabase.auth.*` calls
(and from the Phase 2 aliases) onto `useAuth()` / `createAuthService()`.
That app-specific UI work is **out of this patch** so the three repos
keep one identical vendor tree.

Refs: PR #48, PR #49, PR #50, PR #51.
