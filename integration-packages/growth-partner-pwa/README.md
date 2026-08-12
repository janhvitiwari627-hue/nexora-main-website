# Growth Partner PWA — Phase 2 centralized auth integration

**Target repo:** `diamondpeomotion-cyber/pink-growth-partner-aap-` (branch `main`)
**Base verified:** `e00f0ed1acea`
**Patch:** `auth-integration.patch`
**Verification:** `npx tsc --noEmit` and `npm run build` pass on the locked base after applying the patch.

> This patch targets the current growth-partner repository `main` listed below
> and is self-contained. The older `supabase-integration.patch` is retained as
> the historical data-layer artifact but no longer applies after upstream moved;
> apply this auth patch directly on the verified base unless working from that
> older locked commit.

## What changes

| Area | Change |
|---|---|
| Shared auth package | Vendors `@nexora/auth` under `src/vendor/nexora-auth/` and aliases `@nexora/auth` to it in Vite/TypeScript. |
| Supabase client | `src/lib/supabaseClient.ts` re-exports the shared validated client with strict project validation, browser-safe key rejection, PKCE, and the shared namespaced storage key. The previous implicit-flow client is removed. |
| React auth state | Mounts `<AuthProvider>` in `src/main.tsx`; `App.tsx` uses `useAuth()` (`isAuthenticated`, `loading`, `profile`, `signOut`) instead of a bespoke session effect. |
| Partner role gate | Only an active `profiles.platform_role = 'growth_partner'` can enter. The vendored role layer accepts the legacy `district_partner` spelling as the same Growth Partner role for compatibility with existing accounts. |
| Login form | Email/password sign-in uses `signIn()` from shared auth; successful role resolution by the provider enters the app, while inactive/wrong-role accounts are rejected. |
| Sign-up / reset | Sign-up still creates the partner metadata (`mobile`, `city`, `partner_code`) but no longer claims or trusts a client role. Password reset uses the shared Supabase/PKCE redirect model. |
| Recovery UI | The existing reset screen is retained and is driven by PKCE recovery state instead of hash-token detection. |

The Growth Partner repositories, commission ledger, onboarding, and payouts
screens are unchanged; this patch only centralizes how identity, sessions, and
role authorization are established.

## Apply

```bash
git clone https://github.com/diamondpeomotion-cyber/pink-growth-partner-aap-.git
cd pink-growth-partner-aap-
git checkout main
git am /path/to/integration-packages/growth-partner-pwa/auth-integration.patch
cp .env.example .env
npm install
npx tsc --noEmit && npm run build
```

The old `supabase-integration.patch` is historical only on the current target
base; `auth-integration.patch` is sufficient.

## Deployment checklist

1. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_ANON_KEY` to the shared project's anon/publishable key.
3. Keep `VITE_APP_BASE_PATH=/app/partner/` when deployed behind the main website.
4. Add this PWA and the central website to Supabase Authentication → URL
   Configuration → Redirect URLs. For non-default preview origins, set
   `VITE_NEXORA_ALLOWED_AUTH_ORIGINS`.
5. Apply and verify PR #48's database migration before rollout:
   `select * from public.verify_phase1_auth();` must return all passed.
6. Partner access remains server-owned: sign-up alone does not grant access.
   Nexora ops must assign the active Growth Partner role.

## Phase 5 — Canonical Auth Service

After this Phase 2 patch, apply the **same** shared file
`../phase5-canonical-auth-service.patch` (see
`../PHASE5_CANONICAL_AUTH_SERVICE.md`). It updates
`src/vendor/nexora-auth/` to `@nexora/auth` 1.1.0 / Auth Service contract
1.0.0. Do not fork a Growth Partner-only auth service.

## Phase 6 — Growth Partner membership authorization

After Phase 2 and Phase 5, apply the shared 1.2.0 package and this app's root
gate in order:

```bash
git apply ../phase6-unified-app-auth.patch
git apply phase6-unified-auth.patch
```

The app requires an active `growth_partner` profile and a
`growth_partners.user_id = auth.uid()` row. There is no separate membership
`status` requirement. Public signup requests only the allowed `customer` role;
Growth Partner access remains operations-provisioned and cannot be self-granted.
