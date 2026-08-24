# Customer App replacement — REMIX Final Salon App

**Date:** 2026-08-24  
**Decision:** the retired Customer PWA `freewebsite859-sudo/custmer-Fresh-app-`
(`https://custmer-fresh-app.vercel.app`) is replaced by:

| | Current Customer App |
|---|---|
| Repository | https://github.com/freewebsite859-sudo/REMIX-Final-salon-app- |
| Live origin | https://remix-final-salon-app.vercel.app/ |
| Main Website route | `/app/customer` → 307 to that origin |
| PKCE allowlist | `packages/auth/src/redirects.ts` |

## What operators must set

On the **Main Website** Vercel project:

```env
NEXORA_CUSTOMER_PWA_ORIGIN=https://remix-final-salon-app.vercel.app
```

On the **Customer App** Vercel project (`remix-final-salon-app`):

```env
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<shared project anon/publishable key>
```

On **Supabase** → Authentication → URL Configuration → Redirect URLs, add:

```
https://remix-final-salon-app.vercel.app/auth/callback
https://remix-final-salon-app.vercel.app/reset-password
```

The retired `custmer-fresh-app.vercel.app` origin is no longer on the default
PKCE allowlist.

## Auth integration

Apply `subapp-sync-artifacts/phase22/customer-app/*.patch` on
`REMIX-Final-salon-app-@2977c1b`. That series vendors `@nexora/auth`, mounts
`<AuthProvider>`, gates the app with `requireCustomerAccount()`, and adds a
Back to Main Website header control.

This sandbox cannot push to `freewebsite859-sudo/REMIX-Final-salon-app-`
(GitHub App is read-only there). From a machine where the repo PAT works:

```bash
git clone https://github.com/freewebsite859-sudo/REMIX-Final-salon-app-.git
cd REMIX-Final-salon-app-
git checkout -b nexora-auth-integration
git am path/to/subapp-sync-artifacts/phase22/customer-app/*.patch
git push -u origin nexora-auth-integration
# then open a PR against main
```

Verified locally on `2977c1b` after the series: `tsc --noEmit` 0 errors and
`npm run build` passed.
