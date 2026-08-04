# Growth Partner PWA Integration Package

**Target repo:** `diamondpeomotion-cyber/pink-growth-partner-aap-` (branch `main`)
**Patch:** `supabase-integration.patch`
**Verified:** applies cleanly to locked `main` (`26c0f56` base), including
path-scoped manifest/worker; `tsc --noEmit` and `vite build` pass.

## Task coverage

| Requirement | Delivered by |
|---|---|
| Add Supabase from scratch | NEW `src/lib/supabaseClient.ts` — client locked to shared project `qwaehqsmodekbgvnaavz` (hostname + browser-key validation, env-driven, loud config-error screen). `@supabase/supabase-js` added to `package.json` |
| Replace fake auth | `LoginForm` now does real Supabase email/password **sign-in** and **sign-up** (metadata carries name/mobile/city/partner_code/`signup_role: growth_partner`). The fake device-local account registry, duplicate check, and `setTimeout`-based auto-login are deleted. A **permanent-role guard** (`user_roles` → `profiles.platform_role`, accepting `growth_partner`/`district_partner`) blocks other roles at login and signs them out |
| Replace localStorage | `App.tsx` auth state is now the real Supabase session (`getSession` + `onAuthStateChange`); `localStorage 'isAuthenticated'` and the seeded `DEFAULT_PARTNER_PROFILE` / `DEFAULT_DASHBOARD_CACHE` (fake "Rahul Verma", ₹8,400, 250 shops) are removed; logout calls `supabase.auth.signOut()` |
| Live business data | NEW `src/lib/gpRepository.ts`: `growth_partners` identity resolution, `shop_attributions` (attributed shops + salon names), `growth_partner_commissions` summary — **held / payable / paid** exactly per locked rules #3 (10% of platform fee) and #4 (7-day hold), `salon_setup_proposals` status. Dashboard now shows payable commissions as "available" and live attributed-shop counts |

The Growth Partner **proposal preparation** flow (AddShop →
`save_growth_partner_salon_setup`) and payout history screens are the
follow-up phase; the owner-side **proposal review** ships in the Owner PWA
package (`review_salon_setup`).

For v3 unified entry, the regenerated patch makes Vite read
`VITE_APP_BASE_PATH`; set `/app/partner/` when this app is proxied behind the
main website. Its manifest, asset URLs, and service worker are scoped to that
portal path, so it cannot cache the public site or another portal.

## Apply

```bash
git clone https://github.com/diamondpeomotion-cyber/pink-growth-partner-aap-.git
cd pink-growth-partner-aap-
git checkout -b supabase-integration-phase1
git am supabase-integration.patch
cp .env.example .env   # paste VITE_SUPABASE_ANON_KEY from the Supabase dashboard
npm install && npx tsc --noEmit && npm run build && npm run dev
```

## Deploy checklist

1. Backend migrations live on `qwaehqsmodekbgvnaavz` (this repo's
   `supabase/migrations/`): GP commission + 7-day hold (`20260801_*`),
   proposal publish (`20260729_*`). Verify:
   `select * from public.verify_business_rules();` → all `COMPLETE`.
2. Host env vars: `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`,
   `VITE_SUPABASE_ANON_KEY=<anon/publishable key>`.
3. Growth Partner accounts: the role must be assigned in the DB
   (`profiles.platform_role = 'growth_partner'` or a `user_roles` row) —
   sign-up alone does not grant app access (permanent roles are locked).
4. Set `VITE_APP_BASE_PATH=/app/partner/` and configure the main website's
   `NEXORA_PARTNER_PWA_ORIGIN` for the path-based proxy deployment. The
   service-worker scope must remain `/app/partner/`.
