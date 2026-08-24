# Phase 22 — Blocked Repository Completion Attempt

Date: 2026-08-24

## Access result

GitHub read access is available for all three public target repositories, but authenticated write permission is absent for all three:

```text
Customer push: false
Owner push: false
Growth Partner push: false
```

Therefore the repositories remain **BLOCKED**. No clone checkout, branch, commit, push, or external PR was created, and no external app is marked complete.

## Target heads inspected

| App | Repository | Current `main` | Push permission |
|---|---|---|---:|
| Customer | `freewebsite859-sudo/custmer-Fresh-app-` | `cdfec89ff1aef5436ca1095bbbe65d9e12716639` | ❌ |
| Owner | `promptaivideo4-coder/PINK-NEXORA-AAP-` | `47fb48e7767e795a8f81c624a6575ab2e732a8e5` | ❌ |
| Growth Partner | `diamondpeomotion-cyber/pink-growth-partner-aap-` | `e00f0ed1acea1b7ca9849e469f1f19b7e4020ce7` | ❌ |

## Existing patch audit

Patch-ready artifacts were inspected under `integration-packages/`.

- Customer auth patch: applies cleanly to the recorded base snapshot `ff93504467b0`.
- Growth Partner auth patch: applies cleanly to the recorded base snapshot `e00f0ed1acea`.
- Owner auth patch: **does not apply cleanly** to the recorded/current base `47fb48e7767e795a8f81c624a6575ab2e732a8e5`; the first failure is the `src/lib/supabase.ts` hunk. This is a patch drift blocker, not a successful integration.
- The Customer, Owner, and Growth Partner README files contain the required env mappings, role gates, PKCE/shared auth instructions, and location/RLS handoff instructions.
- The shared Phase 5 and Phase 6 artifacts are present at `integration-packages/phase5-canonical-auth-service.patch`, `integration-packages/phase6-unified-app-auth.patch`, and each app's `phase6-unified-auth.patch`.

The source packages are not claimed to be typechecked or built because the target repositories are not writable and the complete target trees are not part of this checkout. A patch applying to a historical snapshot is not evidence of a deployed or merged app.

## Exact implementation manifest

Apply in each target repository from its `main` branch, resolving any patch drift against the listed current head:

### Customer

```bash
git checkout main
git am /path/to/integration-packages/customer-pwa/auth-integration.patch
git apply /path/to/integration-packages/phase5-canonical-auth-service.patch
git apply /path/to/integration-packages/phase6-unified-app-auth.patch
git apply /path/to/integration-packages/customer-pwa/phase6-unified-auth.patch
git apply /path/to/integration-packages/customer-pwa/back-to-main-website.patch
```

Required browser env:

```text
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<shared anon or publishable key>
VITE_NEXORA_ALLOWED_AUTH_ORIGINS=<customer origin>,https://nexora-main-website.vercel.app
VITE_APP_BASE_PATH=/app/customer/
```

Authorization must require an active `customer` profile. Location writes must use the canonical authenticated-user RPC/RLS contract; no client-provided user ID or raw coordinates may authorize access.

### Owner

```bash
git checkout main
git am /path/to/integration-packages/owner-pwa/auth-integration.patch
# If the src/lib/supabase.ts hunk rejects on current main, resolve that file
# using the patch's validated-client implementation before continuing.
git apply /path/to/integration-packages/phase5-canonical-auth-service.patch
git apply /path/to/integration-packages/phase6-unified-app-auth.patch
git apply /path/to/integration-packages/owner-pwa/phase6-unified-auth.patch
git apply /path/to/integration-packages/owner-pwa/back-to-main-website.patch
```

Required browser env:

```text
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<shared anon or publishable key>
VITE_NEXORA_ALLOWED_AUTH_ORIGINS=<owner origin>,https://nexora-main-website.vercel.app
VITE_APP_BASE_PATH=/app/owner/
```

Authorization must require an active `business_user` profile plus an owner salon membership resolved server-side. Location writes must use the authenticated-user RPC/RLS contract.

### Growth Partner

```bash
git checkout main
git am /path/to/integration-packages/growth-partner-pwa/auth-integration.patch
git apply /path/to/integration-packages/phase5-canonical-auth-service.patch
git apply /path/to/integration-packages/phase6-unified-app-auth.patch
git apply /path/to/integration-packages/growth-partner-pwa/phase6-unified-auth.patch
```

Required browser env:

```text
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<shared anon or publishable key>
VITE_NEXORA_ALLOWED_AUTH_ORIGINS=<partner origin>,https://nexora-main-website.vercel.app
VITE_APP_BASE_PATH=/app/partner/
```

Authorization must require an active `growth_partner` profile and a server-owned `growth_partners.user_id = auth.uid()` row. Partner signup must not self-grant access. Location writes must use the authenticated-user RPC/RLS contract.

## Required target-repository verification

After applying patches and resolving Owner drift:

```bash
npm ci --no-audit --no-fund
npm run lint                 # or the repository's documented lint command
npx tsc --noEmit
npm run build
```

Then run the app-specific auth, location, RLS, recovery, and cross-origin redirect tests. Open one PR per target repository from a target-repository feature branch. Those PRs cannot be created from this session because push permission is false.

## Updated matrix

| App | Auth | Location | Env | Typecheck | Build | PR | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| Main Website | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Verified; [PR #97](https://github.com/janhvitiwari627-hue/nexora-main-website/pull/97) |
| Owner | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **BLOCKED** — no write permission; auth patch drift also requires resolution |
| Growth Partner | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **BLOCKED** — no write permission |
| Customer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **BLOCKED** — no write permission; current head differs from recorded patch base |
| Template | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Vendored source verified in Main Website checkout |
| Job Portal | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Integrated and covered by Main Website PR |
| Beauty Shop | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Integrated and covered by Main Website PR |

```text
TOTAL APPS: 7
AUTH COMPLETE: 4/7
LOCATION COMPLETE: 4/7
ENV COMPLETE: 4/7
TYPECHECK PASS: 4/7
BUILD PASS: 4/7
PR CREATED: 1/7
BLOCKED: 3/7
```

The matrix cannot truthfully show all seven applications as ✅ until target-repository write access is granted and the target-side typecheck/build/PR evidence exists.
