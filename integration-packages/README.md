# Nexora PWA — Supabase Integration Packages

**Date:** 2026-08-04 · **Shared Supabase project:** `qwaehqsmodekbgvnaavz`
(all 6 locked business rules verified — see `supabase/BUSINESS_RULES.md`)

Ready-to-apply Supabase integration packages for the Nexora PWAs and Template
App. Phase 2 app patches are mail patches where documented; Phase 5 and Phase 6
are ordered `git apply` patches. Each app README identifies its locked
current-`main` base, exact stack, deployment configuration, and verification.

`supabase-integration.patch` is the original production/data-layer
integration. `auth-integration.patch` is Phase 2: it rolls the merged
`packages/auth` module from PR #48 out to each PWA as a self-contained patch.
Apply `auth-integration.patch` directly to the current target-repository
`main` bases documented in each README. The older `supabase-integration.patch`
files are retained as historical artifacts but no longer apply after those
upstream branches moved.

| Package | Target repo | Task | Status |
|---|---|---|---|
| `customer-pwa/` | `freewebsite859-sudo/REMIX-Final-salon-app-` (replaces retired `custmer-Fresh-app-`) | Current Customer PWA at `https://remix-final-salon-app.vercel.app`; apply `subapp-sync-artifacts/phase22/customer-app/` on `2977c1b`. Historical `auth-integration.patch` still documents the retired `custmer-Fresh-app-` base `ff93504467b0` | ✅ Current target live; Phase 22 series ready |
| `owner-pwa/` | `promptaivideo4-coder/PINK-NEXORA-AAP-` | Live owner workspace, role gate, env-only auth, proposal review, honest server states; Phase 2 shared `@nexora/auth` wiring | ✅ Ready (`auth-integration.patch`; build verified on `47fb48e7767e`) |
| `growth-partner-pwa/` | `diamondpeomotion-cyber/pink-growth-partner-aap-` | Live Auth, server referral identity, attribution, proposal submission, commissions, scoped PWA; Phase 2 shared `@nexora/auth` wiring | ✅ Ready (`auth-integration.patch`; tsc + build verified on `e00f0ed1acea`) |
| `template-app/` | `templateapp67-oss/NEW-TAMPLETE-APP` | Canonical provider/client adapters and server-backed Owner workspace resolution | ✅ Phase 6 stack ready on `cfaedcad`; copy the documented replacement files |

## Why patches instead of direct PRs?

The integration bot currently has write access only to this repo
(`nexora-main-website`). It has **read-only** access to the three PWA repos,
so PRs cannot be pushed there directly. Once the GitHub App is granted write
access to those repos, the same packages can be pushed as branches + PRs.
Until then, a maintainer applies each patch (one command below).

## Applying a package

```bash
git clone https://github.com/<org>/<pwa-repo>.git && cd <pwa-repo>
git checkout -b nexora-auth-integration
git am /path/to/integration-packages/<package>/auth-integration.patch
# (or: git apply ... for a worktree-only change)
npm install && npx tsc --noEmit && npm run build
```

For Growth Partner, `npx tsc --noEmit && npm run build` is clean. Customer and
Owner builds pass; their target repos retain unrelated pre-existing `tsc`
errors outside the changed auth files.

Every package is self-contained: it updates only the target app's allowed
production screens/data layer, documents required env vars in `.env.example`,
and never commits secrets (anon/publishable keys are set on the host). The
locked Customer PWA already carries its Supabase data layer; its package is now
the production-only cleanup and path-mount patch.

## v3 same-origin mount

The public website owns the canonical browser paths `/app/customer/*`,
`/app/owner/*`, and `/app/partner/*`. Configure each PWA deployment with its
matching Vite base path before mounting it behind the main website's rewrites:

```text
VITE_APP_BASE_PATH=/app/customer/   # Customer package
VITE_APP_BASE_PATH=/app/owner/      # Owner package
VITE_APP_BASE_PATH=/app/partner/    # Growth Partner package
VITE_CANONICAL_ORIGIN=https://your-apex-domain.example  # optional raw-URL redirect
```

The main website accepts `NEXORA_CUSTOMER_PWA_ORIGIN`,
`NEXORA_OWNER_PWA_ORIGIN`, and `NEXORA_PARTNER_PWA_ORIGIN` as server-only
origins and proxies those deployments without changing the browser origin.
Each patch also rewrites its manifest/assets and registers a service worker with
its own `/app/*/` scope; the public site has no root-scope PWA worker.


## Backend prerequisites (already live / idempotent)

The shared project already contains every table these packages use
(`supabase/migrations/` in this repo):

- `20260802_customer_phase1_schema.sql` — `customer_settings`,
  `saved_payment_methods`, `customer_feedback`, `support_tickets` customer
  columns, `reviews` columns, rewards/wallet ledger + RPCs.
- `20260803_customer_phase1_completion.sql` — `customer_reviews`
  (exact app contract), balance-ledger guard, `redeem_loyalty_points`,
  `verify_customer_phase1_backend()`.

Re-run both anytime — they are idempotent. Then verify:
`select * from public.verify_customer_phase1_backend();` → all `COMPLETE`.

## Phase 6 — app-specific authorization

Apply each app's Phase 2 patch, then `phase5-canonical-auth-service.patch`, then
`phase6-unified-app-auth.patch`, and finally that app's
`phase6-unified-auth.patch`. Template has one extra step: copy its two files
under `template-app/files/src/lib/` immediately after Phase 2; those replacement
files are intentionally not patch hunks.

Phase 6 requires active server profiles plus the destination relationship:
Owner through `public.owner_salon_ids()`, Partner through
`growth_partners.user_id = auth.uid()`, and Customer through the active
`customer` profile. See `PHASE6_UNIFIED_APP_AUTH.md` for exact commands.

These packages are rollout artifacts, not deployed downstream commits. A
maintainer must apply them where downstream write access is unavailable. Live
same-UUID auth remains blocked until the real shared-project anon key and all
connected deployments are available.
