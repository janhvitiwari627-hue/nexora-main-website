# Phase 2 — Shop Owner PWA completion evidence

**Target:** `promptaivideo4-coder/PINK-NEXORA-AAP-`  
**Base:** `49ffe780c542dc693269c063cde6185cf5c86b61`  
**Artifact:** `integration-packages/owner-pwa/supabase-integration.patch`

## Scope completed

- Supabase-backed owner repository for salon, services, staff, bookings,
  payouts, reviews, offers, hours, website visibility, and proposals.
- Strict `organization_members` salon resolution; no fallback to public catalog
  rows.
- `profiles.platform_role = 'business_user'` and `is_active = true` gate before
  Owner UI renders. Other roles are signed out and shown a role-conflict state.
- Hardcoded Supabase anon JWT removed from browser and API auth code. Deployment
  env is required.
- Owner dashboard metrics derive from bookings, payouts, salon rating, and live
  proposal state.
- Customer directory and customer profile derive from live owner-salon
  bookings. Private profile fields remain protected by RLS.
- Analytics, marketing, website status/gallery, manual appointment, wallet,
  and booking-staff assignment screens no longer fabricate success or sample
  business data; unsupported contracts show an honest unavailable/empty state.
- Proposal review uses the existing `review_salon_setup` RPC and preserves
  attribution through publish.
- Owner PWA supports `VITE_APP_BASE_PATH=/app/owner/`, receives the same value
  as manifest `start_url`/`scope`, and optionally redirects raw deployments via
  `VITE_CANONICAL_ORIGIN` for the v3 same-origin deployment.

## Verification

The patch was applied to a fresh clone of the locked Owner PWA `main` branch:

```text
npx tsc --noEmit  PASS
npm run build     PASS
hardcoded anon JWT scan  PASS
patch apply       PASS
```

The main repository contract suite includes
`tests/phase2-owner-package-contract.test.mjs`.

## Required staging smoke test

After the migration and deployment env are live, verify with two accounts:

1. Owner profile (`business_user`) can load only its own salon, services,
   bookings, proposals, and payouts.
2. Customer or Growth Partner profile cannot enter the Owner PWA and is signed
   out with the role-conflict state.
3. Owner publishing a proposal makes the salon visible only when the server
   sets the approved/published visibility fields.
4. No owner screen displays seeded customer, revenue, payout, stylist, offer,
   or gallery values when the corresponding server rows are empty.
