# Phase 6 — Connect Nexora apps to unified authentication

- **Date:** 2026-08-12
- **Package:** `@nexora/auth` **1.2.0**
- **Shared Supabase project:** `qwaehqsmodekbgvnaavz`
- **Shared browser storage key:** `nexora.auth.qwaehqsmodekbgvnaavz`
- **Rollout status:** implementation and patch stacks ready; downstream rollout and live same-UUID proof **BLOCKED**

Phase 6 adds app-specific authorization after the Phase 5 canonical identity
check. A session is identity, not authorization. Every gate re-verifies the
user through the Auth Service (`auth.getUser()` plus an active `profiles` row),
then verifies the server-owned relationship required by the destination app.
No URL value, browser storage value, or self-asserted signup metadata grants
app access.

## 6.1 Shared auth package

`packages/auth` is now version 1.2.0 and exports `./access`.

| Gate | Required server authority |
| --- | --- |
| `requireOwnerWorkspace()` | Active `business_user` profile and at least one salon returned by `public.owner_salon_ids()`. The RPC derives ownership from `auth.uid()`. |
| `requirePartnerMembership()` | Active `growth_partner` profile and a `growth_partners.user_id = auth.uid()` row. There is deliberately no separate membership `status` condition. |
| `requireCustomerAccount()` | Active `customer` profile. |

All gates begin with the canonical Auth Service and therefore fail closed for
missing, inactive, or wrong-role profiles. Admin remains unavailable through
self-service registration.

## 6.2 Main Website gateway

`PortalGateway` in `app/nexora-app.tsx` runs the matching access gate before a
mounted PWA can open:

- `/app/owner/*` → `requireOwnerWorkspace()`
- `/app/partner/*` → `requirePartnerMembership()`
- `/app/customer/*` → `requireCustomerAccount()`

The existing `/auth/*` hub and legacy `/login`, `/signup`,
`/forgot-password`, and `/reset-password` routes are unchanged.

## 6.3 Owner App

Target: `promptaivideo4-coder/PINK-NEXORA-AAP-` at `47fb48e7767e`.

The app uses its one canonical provider for session, sign-out, recovery, and
password update. Its root authorization effect requires both the active
`business_user` profile and `owner_salon_ids()` workspace result before entering
the dashboard. A failed gate signs out and fails closed.

## 6.4 Partner App

Target: `diamondpeomotion-cyber/pink-growth-partner-aap-` at `e00f0ed1acea`.

The root authorization effect requires an active `growth_partner` profile and
the verified user's `growth_partners` row. Partner membership is server-owned:
public sign-up requests only the allowed `customer` role and cannot grant Growth
Partner access. Nexora operations must provision the partner profile and row.

## 6.5 Customer App

Target: `freewebsite859-sudo/custmer-Fresh-app-` at `ff93504467b0`.

The root authorization effect requires an active `customer` profile before
loading customer state. Login, signup, logout, recovery, and password update use
the canonical provider, and the password minimum is eight characters.

## 6.6 Template App

Target: `templateapp67-oss/NEW-TAMPLETE-APP` at `cfaedcad`.

The app has one root `AuthProvider`, canonical login/signup/logout adapters,
and owner workspace resolution through `requireOwnerWorkspace()`. Public pages
and the initial website-building wizard remain public. Any salon-backed read or
write fails closed unless exactly one server-authorized owner salon resolves.
The integration does not create or insert salons.

The Template stack intentionally ships these compatibility adapters as copied
replacement files, not patch hunks:

- `integration-packages/template-app/files/src/lib/supabaseClient.ts`
- `integration-packages/template-app/files/src/lib/useAuth.ts`

## 6.7 Rollout packages and exact order

Owner, Customer, and Partner maintainers apply:

```bash
git am integration-packages/<app>/auth-integration.patch
git apply integration-packages/phase5-canonical-auth-service.patch
git apply integration-packages/phase6-unified-app-auth.patch
git apply integration-packages/<app>/phase6-unified-auth.patch
```

Template maintainers apply Phase 2, copy the two replacements, and only then
apply Phase 5 and Phase 6:

```bash
git apply integration-packages/template-app/auth-integration.patch
cp integration-packages/template-app/files/src/lib/supabaseClient.ts src/lib/supabaseClient.ts
cp integration-packages/template-app/files/src/lib/useAuth.ts src/lib/useAuth.ts
git apply integration-packages/phase5-canonical-auth-service.patch
git apply integration-packages/phase6-unified-app-auth.patch
git apply integration-packages/template-app/phase6-unified-auth.patch
```

All four stacks were reconstructed from their current `main` tips. Every patch
passed `git apply --check`, applied in the documented order, and the resulting
worktrees passed `git diff --check`. The rollout artifacts remain in this
repository because the integration identity does not have confirmed downstream
write access; downstream maintainers must apply them. No downstream PR is
claimed.

## 6.8 Verification status and blocker

The package contract tests and Template's dependency-free auth regression test
cover the static integration. Build, lint, typecheck, and test results must be
reported exactly as executed; pre-existing downstream failures must not be
presented as Phase 6 passes.

Live identity verification was not attempted because no real
`VITE_SUPABASE_ANON_KEY` for the shared project is available in the environment.
No key was invented and no user was created. Until the real key is supplied and
the rollout is deployed to every app, these required checks remain **BLOCKED**:

1. Create exactly one test user in `qwaehqsmodekbgvnaavz`.
2. Record that user's email and `auth.users.id` UUID.
3. Sign into Main Website, Owner, Partner, Customer, and Template with the same credentials.
4. Confirm every surface reports the same UUID.
5. Run forgot-password from each connected surface and confirm it resolves the same identity.

Any different UUID is: **FAIL — AUTH NOT UNIFIED**. Packaged-only rollout is
**BLOCKED**, never PASS.
