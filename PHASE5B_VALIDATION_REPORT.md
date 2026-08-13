# PHASE 5B — Validate, Push and Create Draft PR

Date: 2026-08-13
Session branch: `arena/019ff8f5-nexora-main-website`
Repository: `janhvitiwari627-hue/nexora-main-website`

---

## Important correction to Phase 5A

Phase 5A concluded "CHANGES REBUILT: NOT APPLICABLE" because the Phase 1–3 commits
were already squash-merged to `main`. On closer inspection during Phase 5B worktree
verification, the merged implementation **did not** satisfy four explicit requirements:

| Requirement | State on `main` before this PR |
| --- | --- |
| No iframe | ❌ `MountedPortalFrame` rendered the PWA in an `<iframe>` |
| No "app is not mounted" blocker | ❌ `PortalGateway` showed a mount blocker |
| Client mounted flags must not hold routing authority | ❌ `isPortalMounted()` read `NEXT_PUBLIC_*_PORTAL_MOUNTED` |
| External PWA routes in `beforeFiles` rewrites | ❌ served via `middleware.ts`, not `beforeFiles` |

This PR closes all four gaps. The lost commit SHAs (`9f803ac`, `feb7361`, `646fc54`)
remain unrecoverable and are **not** claimed as recovered.

---

## What changed (commit `be66b02`)

- `next.config.ts` — Customer/Owner/Partner mounted as `beforeFiles` rewrites
  (exact + trailing-slash + nested) to the same-origin `/api/portal/{role}` proxy;
  removed the voided foreign-origin `pathPreservingMounts` and the
  `NEXT_PUBLIC_*_PORTAL_MOUNTED` flags.
- `middleware.ts` — removed `/app/*` proxy handling (now `beforeFiles`); kept the
  legacy `/growth-partner` 308 redirect.
- `app/nexora-app.tsx` — removed `isPortalMounted`, the `<iframe>` `MountedPortalFrame`,
  and the "app is not mounted" blocker; added `PortalHandoff` (full navigation to the
  same-origin mount). Template remains a same-origin workspace surface.
- `app/globals.css` — removed dead `.portal-mount` / `.portal-frame` CSS.
- 5 test files updated to assert the new correct behavior (no iframe, no mounted-flag
  gating, no foreign-origin rewrite destination, same-origin `/api/portal` proxy).

## Validation results

| Command | Result |
| --- | --- |
| `npm ci` | PASS (881 packages) |
| `npm run lint` | PASS (0 errors, 14 pre-existing warnings) |
| `npm run typecheck` | PASS |
| `npm run test:contracts` | **PASS — 260/260** |
| `npm run test:security` | **PASS — 49/49** (16 returnTo assertions) |
| `npm run build:next` | PASS — compiled (job-portal Vite + Next.js 16) |

Partner HTTP 500 root-cause regression is covered by assertions that (a) forbid any
foreign-origin rewrite destination and (b) require the same-origin `/api/portal` proxy —
the exact conditions that caused the 500. All pass.

Build note: `build:next` was run with the real Supabase URL and a **placeholder** anon
key (build-only); no key is committed. The real anon key is a Vercel deployment variable.

## Remote / PR verification

- Remote branch: `arena/019ff8f5-nexora-main-website` (pushed, no force-push, `main` untouched)
- Remote commit: `be66b02af0b42c062839d7f47faa8c8004637992` (matches local HEAD)
- PR: **#65**, draft, base `main` ← head `arena/019ff8f5-nexora-main-website`, mergeable
- Diff limited to 9 expected files; no secrets / no service-role key / no iframe

---

## FINAL REPORT

| Check | Result |
| --- | --- |
| DEPENDENCY INSTALLATION | **PASS** |
| LINT | **PASS** |
| TYPECHECK | **PASS** |
| CONTRACT TESTS | **PASS** (260/260) |
| SECURITY TESTS | **PASS** — 49/49 |
| PARTNER REGRESSION TEST | **PASS** (no foreign rewrite + same-origin proxy assertions) |
| PRODUCTION BUILD | **PASS** (compiled; placeholder anon key, none committed) |
| NO SECRETS EXPOSED | **PASS** |
| REMOTE BRANCH | **PASS** |
| REMOTE COMMIT | **PASS** |
| DRAFT PR | **PASS** |

**BRANCH:** `arena/019ff8f5-nexora-main-website`
**COMMIT SHA:** `be66b02af0b42c062839d7f47faa8c8004637992`
**PUSH:** `origin/arena/019ff8f5-nexora-main-website`
**PR URL:** https://github.com/janhvitiwari627-hue/nexora-main-website/pull/65

**FILES CHANGED (9):**
`app/globals.css`, `app/nexora-app.tsx`, `middleware.ts`, `next.config.ts`,
`tests/full-website-test.mjs`, `tests/path-routing-contract.test.mjs`,
`tests/phase6-unified-app-auth-contract.test.mjs`, `tests/phase8-final-verification.test.mjs`,
`tests/returnto-security.test.mjs`

**CI STATUS:** Vercel Preview Comments — pass; Vercel deployment — pending.

**REMAINING BLOCKERS:** none for Phase 5B. Production merge/deploy intentionally not done.
