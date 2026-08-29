# Nexora Authentication — Redirect Isolation Fix

**Branch:** `arena/01a04bae-nexora-main-website`
**Scope:** Main Website repo (`nexora-main-website`). This document explains the root
cause, the requirement-by-requirement audit, and the exact code changes that keep
Main-Website logins on the Main Website instead of bouncing users into a sub-app
(Job Portal / Customer / Owner / Partner PWA).

---

## 1. Root cause

The Main Website already hosts the centralized auth surface (login / signup /
callback / forgot & reset password) in `app/nexora-app.tsx` → `AuthPage`. So
requirement 1's *surface* is already correct. The bug is in the **post-login
destination**.

After a successful `signIn` / `signUp`, the app runs:

```ts
navigate(destinationForVerifiedRole(profile.role, returnTo))
```

`destinationForVerifiedRole` fell back to `homePathForRole(role)` when no safe
`returnTo` was present. `homePathForRole` returns `/app/customer`,
`/app/owner`, `/app/partner`, `/app/delivery`, `/app/admin`. In
`next.config.ts` the first three of those are **307-redirects to external
sub-app origins**:

| `/app/*` mount | Redirects to (sub-app) |
|---|---|
| `/app/customer` | `remix-final-salon-app.vercel.app` (Customer PWA) |
| `/app/owner`   | Owner PWA origin |
| `/app/partner` | Growth-Partner PWA origin |
| `/app/template`| `final-new-app-templete.vercel.app` (Template builder) |

A plain "Log in" / "Sign up" click from the Main Website footer carries **no
`returnTo`**, so a freshly authenticated user was instantly 307-bounced into a
sub-app instead of staying on the Main Website. The same happened after email
verification (`AuthCallbackPage`), after `AuthContinuePage`, and after a
password reset (`navigate(homePathForRole(profile.role))`).

This is exactly the reported symptom: *"users log in on the main website and
are forced into the Job Portal / sub-apps instead of staying on the main
website."*

---

## 2. Requirement-by-requirement audit

### 1. Centralized authentication — ALREADY SATISFIED
Login/signup screens and the PKCE callback live only in this repo
(`/auth/login`, `/auth/signup`, `/auth/callback`, …). Sub-apps do **not** host
the global login. Supabase `emailRedirectTo`/`redirectTo` are built with
`buildCallbackUrl()` / `buildRecoveryUrl()`, which always point at **this
origin's** `/auth/callback` and `/auth/reset-password` (`packages/auth/src/session.ts`),
so auth email links never redirect to a sub-app. No change needed here.

### 2. Isolated sub-apps — POST-LOGIN DEFAULT FIXED
Each sub-app keeps its own internal login for **direct access** (e.g. the Job
Portal at `/job-portal` uses its own `AuthProvider` scoped to its own
`appBaseUrl()`, and `/app/*` mounts remain the explicit entry into the role
PWAs). What was wrong is that a **Main-Website** login *defaulted* into those
sub-app mounts. Fixed by landing post-auth users on the Main Website home and
only resuming a sub-app shell when the user explicitly asked for it via an
allowlisted same-origin `returnTo`.

No shared global-session redirect or hardcoded auth callback URL forcing the
main site into a sub-app remains. (`/dashboard/seeker|employer` → `/job-portal/...`
are legacy explicit aliases for direct Job Portal access and are kept.)

### 3. Redirect URL & session scoping — CONFIRMED CORRECT + default fixed
- `NEXT_PUBLIC_SITE_URL` is read only in `config/portalOrigins.ts` to detect a
  self-redirect; auth email URLs are built against the browser origin, so they
  are always scoped to the main domain.
- Sessions use a namespaced storage key
  `nexora.auth.qwaehqsmodekbgvnaavz` in `localStorage` (per-origin), so the
  Main Website and external PWAs never share/cross-pollinate a session; PKCE
  handoff is the only cross-origin path and is allowlisted.
- Middleware only 308-redirects the explicit `/growth-partner` entry; it does
  not touch login state.

---

## 3. Exact changes

### `packages/auth/src/redirects.ts`
- Added `export const MAIN_SITE_HOME = "/"`.
- `destinationForVerifiedRole(role, requestedReturnTo)` now returns
  `safeReturnPath(requestedReturnTo, MAIN_SITE_HOME)` instead of
  `safeReturnPath(requestedReturnTo, homePathForRole(role))`.
- Removed the now-unused `homePathForRole` import; updated the doc comment.

### `app/nexora-app.tsx`
- `ResetPasswordPage` success no longer navigates to
  `homePathForRole(profile.role)`; it stays on `/` (Main Website) after the
  password update.
- Removed the now-unused `homePathForRole` import.

### `tests/returnto-security.test.mjs`
- Updated the "missing returnTo" expectations from `/app/*` role-home to the
  Main Website home `/` (tests 7–11), mirroring the new default and confirming
  the open-redirect rejections still resolve to `/`.

---

## 4. What was deliberately NOT changed

- `homePathForRole(role)` still returns `/app/{role}` — it powers the explicit
  "My app" / portal navigation (direct access), which is correct per
  requirement 2.
- `/app/*` → external-origin 307 redirects in `next.config.ts` remain — they
  are the intended "accessed directly" handoff into the sub-apps, not a login
  redirect.
- `middleware.ts`, `app/api/portal/*`, `config/portalOrigins.ts` unchanged.

---

## 5. Validation

- `npx tsc --noEmit` → clean (0 errors).
- `npm run test:contracts` → 378/379 pass; the 1 failure
  (`phase7-app-entry-point-contract.test.mjs`) is **pre-existing** — it fails on
  the pristine `main` tree too and is unrelated to this change.
- `tests/returnto-security.test.mjs` → 16/16 pass (the security contract for
  this exact logic).
- `eslint` on the touched files → 0 errors (only pre-existing warnings).

---

## 6. Response to the "Missing Items & Gaps" analysis

### Gap 1 — Post-login redirection to sub-apps  ✅ FIXED (PR #107)
- Verified claim: `homePathForRole` returns `/app/customer|owner|partner` and
  `next.config.ts` 307-redirects those to external sub-app origins.
- Corrected claim: `destinationForVerifiedRole` **no longer** falls back to
  `homePathForRole`. It now falls back to `MAIN_SITE_HOME = "/"` (the Main
  Website dashboard). So a plain login/signup/verification/password-reset stays
  on the main site.
- Also verified: **no platform role default is `/dashboard/seeker` or
  `/dashboard/employer`.** `ROLE_HOME_PATHS` only ever returns `/app/*`. The
  `/dashboard/seeker|employer` routes in `next.config.ts` are legacy **direct
  aliases** to `/job-portal/dashboard/*` (an explicit user click), not any
  default post-login target. `PlatformRole` has no `job_seeker` value.
- No further code change required.

### Gap 2 — Shared session / auth-scope spillover  ✅ VERIFIED CORRECT-BY-DESIGN
- **No cookies are used.** Supabase auth here uses `localStorage`
  (per-origin), keyed by `NEXORA_STORAGE_KEY = nexora.auth.qwaehqsmodekbgvnaavz`.
  There are zero `document.cookie` / cookie reads in the auth path.
- The **one shared storage key is an intentional, tested contract**
  (Phase 11 — `tests/phase11-storage-key-parity-contract.test.mjs`): every
  Nexora surface mounted on the **same origin** shares exactly one session
  (correct SSO). The bundled `job-portal/` and the Main Website share an origin,
  so they intentionally share a session — this is not leakage.
- External PWAs (Customer / Owner / Partner / Template) live on **different
  origins**, so their `localStorage` is fully isolated by the browser — there is
  **no cross-domain session synchronization**. Cross-origin access is only via
  the allowlisted PKCE handoff (single-use code, no tokens in the URL).
- ❗ **Do not** scope/storage-key the sub-apps to different keys: it would
  break the Phase-11 parity contract and 10+ contract tests, and it would make
  the bundled Job Portal unable to see the shared session on the same origin.

### Gap 3 — Missing main-site auth guard  ✅ FIXED (PR #107)
- `/auth/callback` and `/auth/continue` already call
  `destinationForVerifiedRole(...)`; that now resolves to the Main Website home
  (`/`) when no explicit `returnTo` is given, instead of a role gateway.
- `PortalGateway` is **not** a login redirector: it only executes when the user
  explicitly navigates to a `/app/*` mount (direct access). It is the correct
  "explicit sub-app access" path required by the isolation requirement.
- Sub-app redirection therefore happens **only** when the user directly opens
  that sub-app (via `/app/*`, `/job-portal`, or a legacy `/dashboard/{role}`
  alias) — exactly the desired rule.

### Action-plan step-by-step disposition

| # | Requested action | Disposition |
|---|---|---|
| 1 | Isolate post-login landing to the main-site dashboard | **Done** — `destinationForVerifiedRole` → `/`; sub-app redirect only on explicit direct access. |
| 2 | Fix redirect mapping in `next.config.ts` & middleware | **Verified no change needed** — the `/app/*` 307s are explicit direct-access handoffs, never fired during login; `middleware.ts` only handles `/growth-partner`. |
| 3 | Scope cookie/storage to the main domain to stop cross-pollination | **No code change — documented.** No auth cookies exist (localStorage per origin); shared key is an intentional Phase-11 SSO contract; external PWAs are already origin-isolated. |
