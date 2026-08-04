# Nexora PWA — Supabase Integration Packages

**Date:** 2026-08-04 · **Shared Supabase project:** `qwaehqsmodekbgvnaavz`
(all 6 locked business rules verified — see `supabase/BUSINESS_RULES.md`)

Ready-to-apply Supabase integration packages for the three Nexora PWAs.
Each folder contains a single `git format-patch` file that applies cleanly on
the target repo's `main` branch with one command, plus a README explaining
exactly what changes and how to deploy.

| Package | Target repo | Task | Status |
|---|---|---|---|
| `customer-pwa/` | `janhvitiwari627-hue/Free-Website-costumer-pwa-app-` | Remove MOCK_SALONS; live settings / reviews / payment methods / support | ✅ Ready (verified: applies on fresh clone, tsc + build clean) |
| `owner-pwa/` | `promptaivideo4-coder/PINK-NEXORA-AAP-` | Replace localStorage with Supabase; proposal review system | ✅ Ready (verified: applies on fresh clone, tsc + build clean) |
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

Every package is self-contained: it adds its data layer under `src/lib/`,
updates the affected screens, documents required env vars in `.env.example`,
and never commits secrets (anon/publishable keys are set on the host).

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
