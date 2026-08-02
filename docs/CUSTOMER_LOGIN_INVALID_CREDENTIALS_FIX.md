# Customer App — "Invalid credentials" Login Fix

**Date:** 2026-08-02 · **Repo:** `freewebsite859-sudo/custmer-Fresh-app-` · **Phase:** 0 → 1

## Symptom

A valid customer account on the shared Supabase project `qwaehqsmodekbgvnaavz`
fails to sign in with `Invalid credentials` on the deployed customer PWA,
even though the same account works elsewhere (account is confirmed, password
is correct, `mailer_autoconfirm = true`).

## Root cause

The deployed customer build was produced with **stale/incorrect build-time env
vars** (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) that pointed at an old /
different Supabase project. `supabase.auth.signInWithPassword()` therefore hit
the **wrong project**, which has no matching user, and returned the generic
`Invalid credentials` error. Two compounding problems:

1. **Wrong project at the client** — the app was not locked to
   `qwaehqsmodekbgvnaavz`.
2. **Error swallowed** — `LoginScreen` replaced the real Supabase error with a
   hard-coded "Invalid credentials" string, so the real cause was invisible.

## Fix

### 1. `src/lib/supabaseClient.ts` — bake in the shared project defaults
- Hard-code `https://qwaehqsmodekbgvnaavz.supabase.co` as the default URL.
- Hard-code the shared project's `anon` public key as the default key.
- Env vars become overrides, not requirements. Even a build made with no / stale
  env vars still connects to `qwaehqsmodekbgvnaavz`.
- Runtime validation is retained so any misconfiguration fails loudly
  ("Configuration required") instead of silently against the wrong project.
- See `docs/customer-supabaseClient.fixed.ts`.

### 2. `src/components/auth/LoginScreen.tsx` — surface the real Supabase error
- Show the actual `error.message` from Supabase Auth instead of the generic
  "Invalid credentials" string, so wrong-project, unconfirmed-email,
  wrong-password and disabled-account cases are all diagnosable.
- 429 / rate-limit still gets a friendly message.
- See `docs/customer-LoginScreen.fixed.tsx`.

## Verification

1. `npm run build` passes (tsc + vite).
2. Deployed login reaches `https://qwaehqsmodekbgvnaavz.supabase.co/auth/v1/…`
   (browser devtools → Network) even with env vars removed/stale.
3. A valid account signs in; a wrong password shows Supabase's real message.
4. `docs/CUSTOMER_AUTH_SHARING_FIX.md` documents the shared-project lockdown.

## Locked constraints honoured
- No new Supabase project — remains `qwaehqsmodekbgvnaavz`.
- No duplicate tables/auth/payment, no backend redesign, no DB reset.
