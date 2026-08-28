# PHASE 25 — Sign-up / Sign-in dead-ends closed (Job Portal + Main Website)

Date: 2026-08-28
Branch: `arena/01a048c3-nexora-main-website`

## Problem reported

> **"This email already has a Job Seeker account. Sign in with your password to
> continue — choose 'Forgot password?' on the sign-in screen if you do not
> remember it."**

Phase 24 made the duplicate-email *sign-up* message actionable and added a
"Sign in instead" / resend path, but auditing the whole chain found the
remaining lock-outs below.

## Gaps found and fixed

| # | Gap (state) | Before | After |
|---|---|---|---|
| 1 | Account created, verification email never opened, user tries **sign-in** | Login only showed "Your email is not verified…" with **no resend button** — permanently locked out | `mapAuthError` now throws a typed, email-carrying `EmailNotConfirmedError`; the login screen renders a one-tap **"Send verification email"** button (provider-owned `resendVerification`) with a 60 s cooldown |
| 2 | Sign-up succeeds but email confirmation required | Treated as a **red error** ("verification email must be confirmed first") | New `VerifyEmailScreen` (`/verify-email`) — green "one last step" state with the address, resend + "I've verified — go to Login" |
| 3 | New confirmation-state RPC migration not applied (`emailConfirmed === null`) | Resend button hidden → unverified user locked out until the migration lands | Recovery offers **both** "Send verification email" (self-corrects: Supabase refuses it for an already-verified address and we steer to sign-in) and "Sign in instead" |
| 4 | Job-portal sign-up verification link | No `emailRedirectTo` → Supabase redirected to the project **Site URL (main site)**, leaving the portal | `emailRedirectTo: appBaseUrl()` so the link returns to `/job-portal/` |
| 5 | Employer sign-up form | Prefilled with mock data (`Nexora Beauty Group` / `hello@nexorabeauty.com`) → accidental junk sign-ups | Fields start empty |
| 6 | Main website (`/login`) unverified email | No resend on the login screen | In-form **"Resend confirmation email"** on `email_not_confirmed` |
| 7 | Main website (`/signup`) duplicate email | Text only | One-tap **"Go to login →"** with the matching role |

## Files

```
job-portal/src/utils/errors.ts                 +EmailNotConfirmedError + isEmailNotConfirmedError
job-portal/src/services/backend.ts             mapAuthError(email) → typed unverified error; signUp emailRedirectTo
job-portal/src/components/auth/LoginScreen.tsx + in-form resend for unverified sign-in
job-portal/src/components/auth/SignupConflictRecovery.tsx  resend also offered when state unknown (self-correcting)
job-portal/src/components/auth/VerifyEmailScreen.tsx       NEW post-signup confirmation screen
job-portal/src/components/auth/EmployerSignupScreen.tsx    empty fields (no prefilled mock data)
job-portal/src/App.tsx                          verify_email routing/wiring; mapAuthError carries email
job-portal/src/routing.ts, types.ts            /verify-email route + screen state
app/nexora-app.tsx                              main-site login resend + signup→login one-tap
tests/…recovery-contract / -runtime / -render  +coverage for every new path
```

## Verification

- `tsc --noEmit` (job-portal) clean · root `npm run typecheck` clean
- `vite build` (job-portal, standalone and integrated `/job-portal/`) clean
- Recovery suites: **45/45 pass** (16 contract + 10 runtime + 10 render + 9 error-surface)
- `npm run test:contracts`: **378/379** — the single failure
  (`Main Website wraps the app exactly once at NexoraRoot`) is **pre-existing**
  and fails identically on the stashed baseline.

## Recovery matrix (now all states have an exit)

| Account state | Sign-up | Sign-in |
|---|---|---|
| Verified Job Seeker | "Sign in instead" (email + portal preselected) | works |
| **Never verified** | Resend button (signup) | **Resend button on login** |
| Portal mismatch | Names linked portal + sign in / other email | Mismatch names the right portal |
| Nexora account, no Jobs portal | Explains one-time portal choice | works after choosing portal |
| Migration not applied | Both resend (self-correcting) + sign in | Resend + Forgot password |
| Forgotten password | — | "Forgot password?" → reset link |
