# Shop Owner PWA Integration Package

**Target repo:** `promptaivideo4-coder/PINK-NEXORA-AAP-` (branch `main`)  
**Patch:** `supabase-integration.patch`  
**Coverage:** live Supabase owner data + proposal review + v3 same-origin mount  
**Verified:** applies to locked `main` (`49ffe780` base), `npx tsc --noEmit`, and `npm run build` pass after applying.

## Task coverage

The patch replaces the Shop Owner PWA's business-data mocks with the shared
Supabase data layer:

- `ownerRepository.ts` resolves only the owner's salon through
  `organization_members` and RLS-scoped CRUD for services, staff, bookings,
  offers, reviews, and publish visibility.
- Dashboard, bookings, services, staff, reviews, profile, and wallet screens
  show live data with honest loading/error/empty states.
- Owner wallet is read-only. The server payout engine settles eligible rows
  daily at 22:00 IST under the locked 90% owner / 10% platform rule.
- `ProposalReview` calls the role-checked `review_salon_setup` RPC for approve,
  request changes, reject, and publish. Publish preserves partner attribution
  and only then makes the salon visible in the customer catalog.
- No service-role key is used in the browser.
- `vite.config.ts` reads `VITE_APP_BASE_PATH`; use `/app/owner/` behind the
  main website and `/` for a standalone deployment.

Device-only preferences and drafts may remain local because they are not a
business-data source of truth.

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
2. Apply the owner schema and role/RLS migrations from this main repository,
   including `20260804_shop_owner_phase2_full.sql` and
   `20260805_permanent_profile_role_guard.sql`.
3. Set `VITE_APP_BASE_PATH=/app/owner/` for the unified path-based deployment.
4. Configure the main website's `NEXORA_OWNER_PWA_ORIGIN` to the owner PWA
   deployment origin. The browser continues to see the main website origin.
