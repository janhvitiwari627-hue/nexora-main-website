# Owner PWA — Phase 2 centralized auth integration

**Target repo:** `promptaivideo4-coder/PINK-NEXORA-AAP-` (branch `main`)
**Base verified:** `47fb48e7767e`
**Patch:** `auth-integration.patch`
**Build verified:** `npm run build` passes on the locked base after applying the patch.

> This patch targets the current owner-repository `main` listed below and is
> self-contained. The older `supabase-integration.patch` is retained as the
> historical owner/data-layer artifact but no longer applies to current
> upstream `main`; apply this auth patch directly on the verified base unless
> working from that older locked commit.

## What changes

| Area | Change |
|---|---|
| Shared auth package | Vendors `@nexora/auth` under `src/vendor/nexora-auth/` and aliases `@nexora/auth` to it in Vite/TypeScript. |
| Supabase client | `src/lib/supabase.ts` now re-exports the shared validated client: shared project only, browser-safe key validation, PKCE, and shared storage key. The hardcoded anon fallback/proxy token handling is removed from the browser path. |
| React auth state | Mounts `<AuthProvider>` in `src/main.tsx`; `App.tsx` consumes `useAuth()` rather than manually calling `getSession()`/`onAuthStateChange()`. |
| Permanent role gate | Owner access requires an active `profiles.platform_role = 'business_user'`. Any other active role is sent to `role-conflict` and signed out. |
| Login / registration | `Login.tsx` and `RegistrationStepper.tsx` call `signIn()`/`signUp()` from shared auth instead of the old proxy/token helper. Sign-up requests `role: 'business_user'` through package metadata. |
| Recovery | Password reset uses `sendPasswordReset()` and the shared recovery URL policy; `App.tsx` routes the reset surface on `PASSWORD_RECOVERY`. |
| Demo bypass | The local demo-mode login bypass is removed. |

No salon, booking, staff, wallet, or website-builder data contract is changed by
this patch. It is deliberately limited to auth/session/role plumbing so the
larger production screens remain reviewable independently.

## Apply

```bash
git clone https://github.com/promptaivideo4-coder/PINK-NEXORA-AAP-.git
cd PINK-NEXORA-AAP-
git checkout main
git am /path/to/integration-packages/owner-pwa/auth-integration.patch
cp .env.example .env
npm install
npm run build
```

The old `supabase-integration.patch` is historical only on the current target
base; `auth-integration.patch` is sufficient.

## Deployment checklist

1. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_ANON_KEY` to the shared project's anon/publishable key.
   The previous hardcoded key fallback must not be relied on in production.
3. Keep `VITE_APP_BASE_PATH=/app/owner/` when deployed behind the main website.
4. Add this PWA and the central website to Supabase Authentication → URL
   Configuration → Redirect URLs. For non-default previews, set
   `VITE_NEXORA_ALLOWED_AUTH_ORIGINS` as a comma-separated allowlist.
5. Apply and verify PR #48's database migration before rollout:
   `select * from public.verify_phase1_auth();` must return all passed.

## Phase 5 — Canonical Auth Service

After this Phase 2 patch, apply the **same** shared file
`../phase5-canonical-auth-service.patch` (see
`../PHASE5_CANONICAL_AUTH_SERVICE.md`). It updates
`src/vendor/nexora-auth/` to `@nexora/auth` 1.1.0 / Auth Service contract
1.0.0. Do not fork an Owner-only auth service.

## Notes

`npx tsc --noEmit` still reports unrelated pre-existing target-repo errors in
Razorpay API route typings and `Settings.tsx`; no changed auth file contributes
to those errors. The production Vite + esbuild build passes.
