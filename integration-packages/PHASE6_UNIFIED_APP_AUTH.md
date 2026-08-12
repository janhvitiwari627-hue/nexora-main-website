# Phase 6 — Unified App Authentication rollout

`@nexora/auth` 1.2.0 adds server-backed Owner, Partner, and Customer access
gates. All apps keep the same Supabase project (`qwaehqsmodekbgvnaavz`), PKCE
flow, and browser storage key (`nexora.auth.qwaehqsmodekbgvnaavz`).

## Shared files

- `phase6-unified-app-auth.patch` — byte-identical vendored package upgrade for every downstream app.
- `<app>/phase6-unified-auth.patch` — app-specific root gate and canonical provider migration.

## Owner, Customer, and Partner order

From the target app's documented current-main base:

```bash
git am integration-packages/<app>/auth-integration.patch
git apply integration-packages/phase5-canonical-auth-service.patch
git apply integration-packages/phase6-unified-app-auth.patch
git apply integration-packages/<app>/phase6-unified-auth.patch
```

## Template order

Do not apply replacement-file hunks for `supabaseClient.ts` or `useAuth.ts`.
They are intentionally absent from the Phase 2 patch and must be copied:

```bash
git apply integration-packages/template-app/auth-integration.patch
cp integration-packages/template-app/files/src/lib/supabaseClient.ts src/lib/supabaseClient.ts
cp integration-packages/template-app/files/src/lib/useAuth.ts src/lib/useAuth.ts
git apply integration-packages/phase5-canonical-auth-service.patch
git apply integration-packages/phase6-unified-app-auth.patch
git apply integration-packages/template-app/phase6-unified-auth.patch
```

## Required authorization

- Owner: active `business_user` and a result from `public.owner_salon_ids()`.
- Partner: active `growth_partner` and `growth_partners.user_id = auth.uid()`.
  No separate membership-status condition is imposed.
- Customer: active `customer`.

Public self-service never grants Growth Partner or Admin access.

## Verification

The four stacks were applied from current-main tips and passed `git diff
--check`. Run only scripts present in each downstream `package.json`, after
installing that app's locked dependencies.

Live same-user UUID testing remains blocked until a real shared-project anon key
is supplied and the patches are deployed. Do not create multiple users, invent
a key, or report packaged artifacts as a live PASS.
