# Customer App — Shared Supabase Auth Fix (project lockdown)

**Date:** 2026-08-02 · **Repo:** `freewebsite859-sudo/custmer-Fresh-app-` · **Phase:** 0 → 1

## Context

The Nexora ecosystem shares **one** Supabase project:
`qwaehqsmodekbgvnaavz`. The customer PWA, owner PWA, partner PWA and the main
website must all authenticate against this single project so that an account,
profile, booking, review, wallet and notification are the same row everywhere.

The customer app's deployed build drifted to a **stale/different project**
because its connection was driven entirely by build-time env vars, and because
`LoginScreen` masked the real auth error.

## What changed

| File | Change |
|---|---|
| `src/lib/supabaseClient.ts` | Baked-in shared project URL + anon key as defaults; env vars are overrides. App can no longer drift to another project. |
| `src/components/auth/LoginScreen.tsx` | Real Supabase `error.message` shown instead of generic "Invalid credentials". |
| `src/components/auth/SignUpScreen.tsx` | Verified (unchanged): already sends `signup_role` in `options.data` (defaults to `customer`). |

## Why baking in the key is safe

- The `anon` **public** (publishable) key is designed to ship in browser
  bundles. It is not the `service_role` key and only grants RLS-constrained,
  anon-level access — the same as any visitor.
- All writes to business data remain protected by RLS and server-side RPCs.

## Locked constraints (unchanged, non-negotiable)

- Shared project: `qwaehqsmodekbgvnaavz` — **no new project, no fork**.
- **No** duplicate tables, duplicate auth, or duplicate payment flows.
- **No** backend redesign, **no** database reset.
- Business rules locked: 25/75 advance, Owner 90% / Platform 10%, GP 10% of
  platform fee, 7-day hold, daily 22:00 IST payout, refund full >24h / partial.

## Rollout

1. Apply `docs/customer-supabaseClient.fixed.ts` → `src/lib/supabaseClient.ts`.
2. Apply `docs/customer-LoginScreen.fixed.tsx` → `src/components/auth/LoginScreen.tsx`.
3. `npm run build`, commit, push.
4. Re-deploy with **no** `VITE_SUPABASE_*` env vars (or correct ones) — the app
   connects to the shared project in all cases.
