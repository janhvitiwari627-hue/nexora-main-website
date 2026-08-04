# Phase 3 — Growth Partner PWA Supabase integration

**Target repo:** `diamondpeomotion-cyber/pink-growth-partner-aap-`  
**Current locked base:** `2832af2cb2c478c08b67e18fae2ff370beac419b`  
**Artifact:** `integration-packages/growth-partner-pwa/supabase-integration.patch`

## Delivered

- Real Supabase Auth session on boot/login/refresh.
- Exact `profiles.platform_role = 'growth_partner'` + `is_active` gate;
  other roles are signed out.
- Removed fake `isAuthenticated`, seeded partner identity, fake dashboard
  cache, local registration registry, and timeout-based fake auth.
- Added server-owned `ensure_growth_partner_identity()` migration/RPC. It
  creates deterministic `partner_code` and `referral_code` only for an active
  Growth Partner profile.
- Added live `growth_partners`, `shop_attributions`,
  `growth_partner_commissions`, `salon_setup_proposals`, and notifications
  repositories.
- Replaced Add Shop demo submission with:
  1. server identity bootstrap,
  2. `shop_onboarding_applications` insert,
  3. validated `save_growth_partner_salon_setup` RPC with `p_submit = true`.
- Dashboard, attributed shops, profile, commission/reward, payout, proposal
  status, and notification views now read server data or show honest empty/error
  states.
- All Supabase URL/key reads are Vite env-only; no JWT fallback remains.
- Canonical `/app/partner/` base, manifest, scoped service worker, and optional
  raw-origin redirect are included.

## Verification

Applied to a fresh checkout of the current locked Growth Partner `main`:

```text
patch apply       PASS
npx tsc --noEmit  PASS
npm run build     PASS
```

Main repository contract suite now includes
`tests/phase3-growth-partner-package-contract.test.mjs`.

## Backend action

Apply the new migration in the shared Supabase project before enabling the Add
Shop submit flow:

```text
supabase/migrations/20260806_growth_partner_identity.sql
```

The migration is also included in the main repository live-DB runner.
