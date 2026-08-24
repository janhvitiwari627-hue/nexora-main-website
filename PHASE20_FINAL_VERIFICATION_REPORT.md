# Phase 20–21 — Universal Auth/Location Verification

Date: 2026-08-24 (UTC)

## Access

```
READ ACCESS: YES
WRITE ACCESS: YES
```

The checkout is writable. Only this repository was available as a working tree:
`janhvitiwari627-hue/nexora-main-website`. The Customer, Owner, and Growth Partner repositories are external targets; they are not present locally and were not modified. They are **BLOCKED** for this session, not complete.

## Scope and contract

The canonical contract is the Main Website Supabase project `qwaehqsmodekbgvnaavz.supabase.co`, browser-safe anon/publishable keys only, PKCE/shared auth storage, server-owned role authorization, and RLS-owned location persistence. Required external origins fail closed; Template has the checked-in canonical fallback and an HTTPS origin-only override.

The writable checkout contains the Main Website, the integrated Job Portal, the Beauty Industry app, and a vendored Template App source package. The three external PWA targets have patch-ready artifacts under `integration-packages/` but are not writable repositories here.

## Changes made in this phase

- Corrected the root `.env.example` Template origin and auth allowlist examples to the canonical `https://final-new-app-templete.vercel.app` deployment.
- Fixed nine existing Template App TypeScript errors in the vendored source package without changing auth, RLS, or business rules:
  - narrowed denial-result reason access safely;
  - normalized optional booking email/notes for the summary UI;
  - preserved the `SalonData.templateId` union when resetting/changing themes;
  - added the existing Tablet preview mode to the state union.

No service-role key, token, database password, or live credential was added.

## Verification evidence

Commands executed in this checkout:

- `npm ci --no-audit --no-fund` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed; 0 errors, 16 existing warnings in Main Website lint output. Job Portal `tsc --noEmit` passed.
- `NEXORA_CUSTOMER_PWA_ORIGIN=https://customer.example.com NEXORA_OWNER_PWA_ORIGIN=https://owner.example.com NEXORA_PARTNER_PWA_ORIGIN=https://partner.example.com NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-placeholder> npm run build` — passed. This built Job Portal, Beauty Industry, and the Main Website artifact. Only existing chunk-size and middleware deprecation warnings were emitted.
- `npm run test:contracts` — passed, 164/164.
- Template App `npm run lint` — passed after the fixes.
- Template App `npm run build` with non-secret test environment values — passed; only existing bundle-size/dynamic-import warnings.
- Missing required portal origins were also exercised by the first build attempt and correctly failed closed with `NEXORA_CUSTOMER_PWA_ORIGIN is required.`
- Main Website PR: https://github.com/janhvitiwari627-hue/nexora-main-website/pull/97 (open; not merged).

The placeholder used above is a verification value only; it is not a production credential and is not committed.

## Implementation manifest for blocked repositories

These are exact patch-ready artifacts, not claims of applied changes:

| Blocked app | Target repository | Patch-ready files | Required action |
|---|---|---|---|
| Customer | `freewebsite859-sudo/custmer-Fresh-app-` | `integration-packages/customer-pwa/auth-integration.patch`, `phase6-unified-auth.patch`, `supabase-integration.patch`, `back-to-main-website.patch` | Clone target, apply current auth + shared package + phase 6 patches, set shared Supabase/origin env, run typecheck/lint/build, open target PR. |
| Owner | `promptaivideo4-coder/PINK-NEXORA-AAP-` | `integration-packages/owner-pwa/auth-integration.patch`, `phase6-unified-auth.patch`, `supabase-integration.patch`, `back-to-main-website.patch` | Same procedure; verify `business_user` and owner-salon membership gate. |
| Growth Partner | `diamondpeomotion-cyber/pink-growth-partner-aap-` | `integration-packages/growth-partner-pwa/auth-integration.patch`, `phase6-unified-auth.patch`, `supabase-integration.patch` | Same procedure; verify active `growth_partner` plus `growth_partners.user_id = auth.uid()` gate. |

The Template App has a vendored, writable source package in `integration-packages/template-app/files`; it is not a separate Git repository or separate PR in this session. Main Website routing and the Template fallback are verified locally.

## Final verification matrix

`✅` means verified in this checkout. `❌` means not verifiable/applied because the target repository is blocked or a required deployment URL/PR was not supplied. “URL” is the deployment/PR evidence column, not a fabricated URL.

| App | Auth | Location | Env | Typecheck | Lint | Build | PR | URL / owner evidence |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Main Website | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PR created from this session branch; deployment URL not verified |
| Owner | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | BLOCKED — external repo not cloned/writable |
| Growth Partner | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | BLOCKED — external repo not cloned/writable |
| Customer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | BLOCKED — external repo not cloned/writable |
| Template | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Vendored source verified; separate target PR unavailable |
| Job Portal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Integrated writable app; covered by Main Website PR |
| Beauty Shop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Integrated writable app; covered by Main Website PR |

## Totals

```
TOTAL APPS: 7
AUTH COMPLETE: 4/7
LOCATION COMPLETE: 4/7
ENV COMPLETE: 4/7
TYPECHECK PASS: 4/7
BUILD PASS: 4/7
PR CREATED: 1/7
BLOCKED: 3/7
```

## Blocker statement

The seven-application success condition is **not met** because three external repositories are unavailable for write access. Their patches and implementation instructions are present, but they are explicitly **BLOCKED**. No external PR, build, deployment URL, or target-repository modification is claimed.
