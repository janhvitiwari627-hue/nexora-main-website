# Customer PWA — current target: REMIX Final Salon App

**Current target repo:** `freewebsite859-sudo/REMIX-Final-salon-app-` (branch `main`)
**Current base:** `2977c1bb73bd`
**Live deployment:** https://remix-final-salon-app.vercel.app/
**Current apply path:** `subapp-sync-artifacts/phase22/customer-app/` (`git am` series)

This package **replaces** the retired Customer PWA
`freewebsite859-sudo/custmer-Fresh-app-` (historical base `ff93504467b0`).
The Main Website `/app/customer` portal and the PKCE allowlist now point at
`https://remix-final-salon-app.vercel.app`.

The historical `auth-integration.patch` in this folder still documents the
retired `custmer-Fresh-app-` Phase 2 wiring (PR #48). Do **not** apply that
mail patch to REMIX — the file layout is different (`AuthPage.tsx` /
`src/lib/supabase.ts` instead of `LoginScreen` / `supabaseClient.ts`).
`npm run build` on the REMIX tree is the current verification command.

## Apply on the current Customer App

```bash
git clone https://github.com/freewebsite859-sudo/REMIX-Final-salon-app-.git
cd REMIX-Final-salon-app-
git checkout main
git checkout -b nexora-auth-integration
git am /path/to/subapp-sync-artifacts/phase22/customer-app/*.patch
cp .env.example .env
npm install
npx tsc --noEmit && npm run build
```

## What the Phase 22 series does

| Area | Change |
|---|---|
| Shared auth package | Vendors `@nexora/auth` under `src/vendor/nexora-auth/` and aliases `@nexora/auth` in Vite/TypeScript. |
| Supabase client | `src/lib/supabase.ts` re-exports the shared validated client (`qwaehqsmodekbgvnaavz`, anon/publishable key only, PKCE, namespaced storage). |
| React auth state | Mounts `<AuthProvider>` in `src/main.tsx`; `App.tsx` consumes `useAuth()` plus `requireCustomerAccount()`. |
| Customer role gate | Only an active `profiles.platform_role = 'customer'` can enter. Other roles are signed out. |
| Login / signup / reset | `AuthPage` / `PasswordResetModal` call shared `signIn`, `signUp`, `sendPasswordReset`. |

## Deployment checklist

1. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_ANON_KEY` to the shared project's anon/publishable key.
   Never use a service-role key in the browser.
3. When opened through the main site, `/app/customer` is a 307 to
   `NEXORA_CUSTOMER_PWA_ORIGIN` (must be `https://remix-final-salon-app.vercel.app`).
4. Add this origin to Supabase → Authentication → URL Configuration →
   Redirect URLs. For extra preview origins set
   `VITE_NEXORA_ALLOWED_AUTH_ORIGINS`.
5. Apply and verify PR #48's database migration before rollout:
   `select * from public.verify_phase1_auth();` must return all passed.

## Historical artifacts (retired Customer App)

These files targeted `custmer-Fresh-app-` @ `ff93504467b0` and are kept so
existing contract tests still have a Phase 2 mail patch to inspect:

- `auth-integration.patch`
- `phase6-unified-auth.patch`
- `back-to-main-website.patch`
- `supabase-integration.patch` (older still)

Do not apply them on REMIX.
