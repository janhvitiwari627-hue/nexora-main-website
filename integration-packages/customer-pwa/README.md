# Customer PWA — Phase 2 centralized auth integration

**Target repo:** `freewebsite859-sudo/custmer-Fresh-app-` (branch `main`)
**Base verified:** `ff93504467b0`
**Patch:** `auth-integration.patch`
**Build verified:** `npm run build` passes on the locked base after applying the patch.

> This patch targets the current target-repository `main` listed below. It is
> self-contained and can be applied directly. The older
> `supabase-integration.patch` is retained as the historical Phase 1/data-layer
> artifact but no longer applies cleanly after upstream `main` moved; do not
> apply it on top of the current base unless you have first reset to its old
> locked commit.

## What changes

| Area | Change |
|---|---|
| Shared auth package | Vendors `@nexora/auth` under `src/vendor/nexora-auth/` and aliases `@nexora/auth` to it in Vite/TypeScript. |
| Supabase client | `src/lib/supabaseClient.ts` now re-exports the shared validated client (`qwaehqsmodekbgvnaavz`, anon/publishable key only, PKCE, namespaced storage). |
| React auth state | Mounts `<AuthProvider>` in `src/main.tsx`; `App.tsx` consumes `useAuth()` instead of maintaining its own session listener. |
| Customer role gate | A session is not enough: only an active `profiles.platform_role = 'customer'` can enter. Other active roles receive the role-conflict flow and are signed out of this PWA. |
| Login / signup / reset | Auth actions now call shared helpers (`signIn`, `signUp`, `signInWithGoogle`, `sendPasswordReset`, `setPassword`) with the package's mapped errors and PKCE-safe redirects. |
| Demo bypass | The `?demo=true` fake account/session path is removed so no customer production screen can bypass Supabase. |
| Recovery | PKCE password recovery is handled through the shared provider; the reset surface is shown on `PASSWORD_RECOVERY`. |

The existing app-specific customer profile loader remains responsible for the
customer-only columns (`preferred_city`, rewards, wallet, etc.). Shared auth
owns identity, session, profile existence, and basic role normalization.

## Apply

```bash
git clone https://github.com/freewebsite859-sudo/custmer-Fresh-app-.git
cd custmer-Fresh-app-
git checkout main
git am /path/to/integration-packages/customer-pwa/auth-integration.patch
cp .env.example .env
npm install
npm run build
```

The old `supabase-integration.patch` is historical only on the current target
base; `auth-integration.patch` is sufficient.

## Deployment checklist

1. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_ANON_KEY` to the shared project's anon/publishable key.
   Never use a service-role key in the browser.
3. When proxied behind the main site, keep `VITE_APP_BASE_PATH=/app/customer/`.
4. Ensure the main-website auth origin and this PWA origin are in the Supabase
   Redirect URLs list. For local/preview origins beyond the defaults, set
   `VITE_NEXORA_ALLOWED_AUTH_ORIGINS=https://this-pwa.example,https://main-site.example`.
5. Apply and verify PR #48's database migration before rollout:
   `select * from public.verify_phase1_auth();` must return all passed.

## Phase 5 — Canonical Auth Service

After this Phase 2 patch, apply the **same** shared file
`../phase5-canonical-auth-service.patch` (see
`../PHASE5_CANONICAL_AUTH_SERVICE.md`). It updates
`src/vendor/nexora-auth/` to `@nexora/auth` 1.1.0 / Auth Service contract
1.0.0. Do not fork a Customer-only auth service.

## Phase 6 — Customer account authorization

After Phase 2 and Phase 5, apply the shared 1.2.0 package and this app's root
gate in order:

```bash
git apply ../phase6-unified-app-auth.patch
git apply phase6-unified-auth.patch
```

The app calls `requireCustomerAccount()` before loading customer state. This
re-verifies the Supabase user and requires an active `customer` profile; a raw
session or local role state is not authorization. Login, signup, recovery,
password update, and logout use the canonical provider.
