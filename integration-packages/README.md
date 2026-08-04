# Nexora PWA — Supabase Integration Packages

**Date:** 2026-08-04 · **Shared Supabase project:** `qwaehqsmodekbgvnaavz`
(all 6 locked business rules verified — see `supabase/BUSINESS_RULES.md`)

Ready-to-apply Supabase integration packages for the three Nexora PWAs.
Each folder contains a single `git format-patch` file that applies cleanly on
the target repo's `main` branch with one command, plus a README explaining
exactly what changes and how to deploy.

| Package | Target repo | Task | Status |
|---|---|---|---|
| `customer-pwa/` | `freewebsite859-sudo/custmer-Fresh-app-` | Production-only Customer PWA; remove demo/role-dashboard branches; mount at `/app/customer/` | ✅ Ready (verified: applies to locked repo main) |
| `owner-pwa/` | `promptaivideo4-coder/PINK-NEXORA-AAP-` | Phase 2: live owner workspace, role gate, env-only auth, proposal review, honest server states | ✅ Ready (verified: applies to locked main, tsc + build clean) |
| `growth-partner-pwa/` | `diamondpeomotion-cyber/pink-growth-partner-aap-` | Supabase from scratch: real auth replaces fake localStorage auth | ✅ Ready (verified: applies on fresh checkout, tsc + build clean) |

## Why patches instead of direct PRs?

The integration bot currently has write access only to this repo
(`nexora-main-website`). It has **read-only** access to the three PWA repos,
so PRs cannot be pushed there directly. Once the GitHub App is granted write
access to those repos, the same packages can be pushed as branches + PRs.
Until then, a maintainer applies each patch (one command below).

## Applying a package

```bash
git clone https://github.com/<org>/<pwa-repo>.git && cd <pwa-repo>
git checkout -b supabase-integration-phase1
git am /path/to/integration-packages/<package>/*.patch   # keeps commit message
# (or: git apply <package>/*.patch  for a worktree-only change)
npm install && npx tsc --noEmit && npm run build
```

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
