# Shop Owner PWA — Phase 2 Supabase integration

**Target repo:** `promptaivideo4-coder/PINK-NEXORA-AAP-` (branch `main`)  
**Patch:** `supabase-integration.patch`  
**Base:** locked `main` `49ffe780`
**Coverage:** live owner workspace, permanent role gate, env-only auth, honest empty states, proposal review, and v3 same-origin mount
**Verified:** patch applies to the locked head; `npx tsc --noEmit` and `npm run build` pass after applying.

## Delivered

- `ownerRepository.ts` is the single owner data layer. It resolves salons
  only through active `organization_members`; it never falls back to the
  public verified-salon catalog.
- Dashboard, bookings, customers, customer profile, services, staff, reviews,
  profile/hours, website status, marketing offers, analytics, and wallet views
  use shared Supabase rows or show an honest loading/error/empty/unavailable
  state. Seeded customers, revenue charts, payout transactions, stylist lists,
  marketing campaigns, and website gallery demos are not rendered.
- Owner wallet is read-only. The server payout engine settles eligible rows
  daily at 22:00 IST under the locked 90% owner / 10% platform rule.
- `ProposalReview` calls the role-checked `review_salon_setup` RPC for approve,
  request changes, reject, and publish. Publish preserves partner attribution
  and only then makes the salon visible in the customer catalog.
- App startup verifies `profiles.platform_role === 'business_user'` and
  `is_active === true`. A valid Supabase session alone cannot enter the Owner
  PWA; other roles are signed out and shown the role-conflict screen.
- Browser and API auth use `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` from deployment environment only. The previous
  hardcoded anon JWT fallback is removed.
- `vite.config.ts` reads `VITE_APP_BASE_PATH`; use `/app/owner/` behind the
  main website. VitePWA receives the same path as manifest `start_url` and
  `scope`, so the generated worker cannot intercept another portal or the
  public site.

Device-only preferences such as theme/language/install flags may remain local.
They are not business-data sources of truth. Unsupported storage/media or
manual-appointment operations explicitly say they are unavailable instead of
claiming success.

## Apply

```bash
git clone https://github.com/promptaivideo4-coder/PINK-NEXORA-AAP-.git
cd PINK-NEXORA-AAP-
git checkout main
git am /path/to/integration-packages/owner-pwa/supabase-integration.patch
cp .env.example .env
# VITE_APP_BASE_PATH=/app/owner/ when mounted through the main website
npm install && npx tsc --noEmit && npm run build
```

## Backend and host checklist

1. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co` and the
   publishable/anon `VITE_SUPABASE_ANON_KEY`. Never add `service_role` to the
   browser build.
2. Confirm the shared migrations are applied, including
   `20260804_shop_owner_phase2_full.sql` and
   `20260805_permanent_profile_role_guard.sql`.
3. Set `VITE_APP_BASE_PATH=/app/owner/` for the unified path-based deployment.
4. Configure the main website's `NEXORA_OWNER_PWA_ORIGIN` to the owner PWA
   deployment origin. The browser continues to see the main website origin.
