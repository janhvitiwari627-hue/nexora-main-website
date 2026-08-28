# PHASE 24 — Duplicate-Email Sign-Up Dead End (Job Portal)

Date: 2026-08-28
Branch: `arena/01a04878-nexora-main-website`

## Reported problem

> **"This email is already registered as a Job Seeker. Please sign in through the Job Seeker portal."**

The user is told to go to the screen they are already standing on, and is given no button to
do it. Worse, the message hides the case that has **no exit at all**:

| Account state | Sign-up says | Sign-in says | Result |
|---|---|---|---|
| Verified Job Seeker | "already registered … sign in through the Job Seeker portal" | works | dead-end copy, recoverable by hand |
| **Created, verification email never opened** | "already registered …" | "Your email is not verified." | **permanently locked out** |
| Nexora account, no Jobs portal chosen | "already belongs to a Nexora account …" | works | dead-end copy |

Root cause: `authBackend.signUp` pre-check (`job_email_portal_role`) reports only the portal
role, so the client could not distinguish "registered" from "registered but never verified",
and every duplicate-email branch threw a plain `Error` string with no machine-readable state
for the UI to act on.

## Fix

1. **Message = next action** (`job-portal/src/utils/errors.ts`)
   `portalEmailConflictMessage()` writes the recovery step, never "go to the portal you are on":
   - verified, same portal → "This email already has a Job Seeker account. Sign in with your
     password to continue — choose \"Forgot password?\" …"
   - **unverified** → "A Job Seeker account was started with this email but never verified …
     Send a new verification link below…"
   - portal mismatch → "…already linked to a Job Seeker account, so it cannot be used for the
     Employer portal. Sign in to that account, or register with a different email."
   - no Jobs portal yet → "…has not chosen a Jobs portal yet. Sign in and you will be asked to
     pick your portal type once."

2. **Typed error** — `PortalEmailConflictError` carries `email`, `existingRole`,
   `requestedRole`, `emailConfirmed`; `isPortalEmailConflictError()` type-guards it. Both
   duplicate-email paths in `signUp` (pre-check and the obfuscated-user race) throw it.

3. **Confirmation state from the database** — new migration
   `job-portal/supabase/migrations/20260828120000_jobs_email_portal_state.sql` adds
   `public.job_email_portal_state(p_email) → jsonb {portal_role, email_confirmed}`
   (security definer, `anon`+`authenticated`, `PUBLIC` revoked). `job_email_portal_role` is
   untouched and remains the **fallback** when the new function is absent, so deployments that
   have not applied the migration keep working (`emailConfirmed = null`).

4. **One-tap recovery UI** — new presentational `components/auth/SignupConflictRecovery.tsx`
   rendered by both signup screens:
   - **Send verification email** (only when `emailConfirmed === false`)
   - **Sign in instead** → shell routes to `LoginScreen` with the email **prefilled**, the
     matching portal tab **preselected**, and a notice explaining why.
   `resendVerification(email)` is provider-owned (`auth/AuthProvider.tsx`, mirroring the
   canonical `packages/auth` surface) — no component calls `supabase.auth` directly.

## Deployment step required

Apply the new migration to the shared Supabase project, then reload the PostgREST schema cache:

```bash
supabase db push        # or run the SQL in job-portal/supabase/migrations/20260828120000_*.sql
```

Until it is applied the portal still works; only the "never verified" branch loses its resend
button (state unknown → sign-in recovery is offered instead).

## Verification (commands actually run)

```
node --test tests/job-portal-duplicate-email-recovery-contract.test.mjs   → 12 pass
node --test tests/job-portal-duplicate-email-recovery-runtime.test.mjs    → 10 pass
node --import tsx --test tests/job-portal-duplicate-email-recovery-render.test.tsx → 6 pass
npm run test:contracts                                                    → 375 tests, 374 pass
npx tsc --noEmit (job-portal)                                             → clean
npm run typecheck                                                         → clean
vite build (job-portal, 2774 modules)                                     → clean
```

- The **runtime** test executes the real `authBackend.signUp` (transpiled from source, client
  stubbed) through every branch: duplicate verified, duplicate unverified, mismatch,
  unassigned, missing-migration fallback, transport failure, fresh email, obfuscated race.
- The **PGlite** section executes the migration SQL itself and asserts
  `{portal_role, email_confirmed}`, `unassigned`, soft-deleted → `null`, and case-insensitive
  trimmed matching.
- The **render** test executes the new UI with `react-dom/server`.
- `npm run test:contracts` shows one failure, `Main Website wraps the app exactly once at
  NexoraRoot` (`tests/phase7-app-entry-point-contract.test.mjs`), which is **pre-existing**:
  it fails identically with these changes stashed.

## Files

```
job-portal/src/utils/errors.ts                                   (+conflict type, message builder)
job-portal/src/services/backend.ts                               (pre-check, typed throws)
job-portal/src/auth/AuthProvider.tsx                             (+resendVerification)
job-portal/src/components/auth/SignupConflictRecovery.tsx        (new)
job-portal/src/components/auth/JobSeekerSignupScreen.tsx         (recovery actions)
job-portal/src/components/auth/EmployerSignupScreen.tsx          (recovery actions)
job-portal/src/components/auth/LoginScreen.tsx                   (prefill + notice)
job-portal/src/App.tsx                                           (routing/wiring)
job-portal/supabase/migrations/20260828120000_jobs_email_portal_state.sql (new)
tests/job-portal-duplicate-email-recovery-contract.test.mjs      (new)
tests/job-portal-duplicate-email-recovery-runtime.test.mjs       (new)
tests/job-portal-duplicate-email-recovery-render.test.tsx        (new)
```

## Not changed (by design)

One email = one permanent portal role stays enforced server-side (`job_register_role` raises
`PORTAL_ROLE_MISMATCH`). Supporting dual-role accounts (one email as both Job Seeker and
Employer) is a schema/product change, not a bug fix, and was deliberately not done here.
