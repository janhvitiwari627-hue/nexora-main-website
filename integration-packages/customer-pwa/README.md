# Customer PWA — production cleanup and same-origin mount

**Target repo:** `freewebsite859-sudo/custmer-Fresh-app-` (branch `main`)  
**Patch:** `supabase-integration.patch` (single commit, 5 files, +17/−64)  
**Verified:** applies cleanly to the locked repository `main` (`4eff314` base).

## Task coverage

The locked Customer PWA main branch already contains the real Supabase catalog,
booking, profile, favorites, reviews, settings, payment-methods, support,
notifications, and address repositories. This patch closes the remaining
production-boundary gap:

| Requirement | Delivered by |
|---|---|
| No demo bypass | Removes the `?demo=true` account/session path and the seeded Demo Customer |
| Customer PWA only | Removes Owner/Growth Partner dashboard imports and render branches; non-customer roles show the role-conflict flow and are signed out |
| No copied role routes | Removes `owner-dashboard` and `gp-dashboard` screens from the Customer `Screen` contract and role helper |
| Same-origin mount | Vite `base` reads `VITE_APP_BASE_PATH` and `.env.example` documents `/app/customer/` |

The patch intentionally keeps device-only UX storage (location/install flags and
the one-time legacy migration). It does not treat that as business data.

## Apply

```bash
git clone https://github.com/freewebsite859-sudo/custmer-Fresh-app-.git
cd custmer-Fresh-app-
git checkout main
git am /path/to/integration-packages/customer-pwa/supabase-integration.patch
cp .env.example .env
# For the unified main website deployment set VITE_APP_BASE_PATH=/app/customer/
npm install && npx tsc --noEmit && npm run build
```

## Deploy checklist

1. The app must use the locked Supabase project:
   `https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the host's
   publishable/anon key. Never add a service-role key to the browser build.
3. Set `VITE_APP_BASE_PATH=/app/customer/` when the main website proxies this
   app through `/app/customer/*`; use `/` for a standalone deployment.
4. Apply and verify the shared customer schema migrations:
   `select * from public.verify_customer_phase1_backend();`.

The customer app's own `profiles.platform_role` check remains authoritative; a
Customer PWA URL cannot grant access to Owner or Growth Partner functionality.
