# PHASE 5A — Recovery / Rebuild Report

Date: 2026-08-13
Session branch: `arena/019ff8f5-nexora-main-website`
Repository: `janhvitiwari627-hue/nexora-main-website`

---

## 1. RECOVERY INSPECTION (evidence)

| Command | Result |
| --- | --- |
| `git status --short --branch` | clean; on `arena/019ff8f5-nexora-main-website` |
| `git branch --all` | local `main`, `arena/019ff8f5-nexora-main-website`; remote `origin/main` (+ many `arena/*` branches) |
| `git log --all --oneline -40` | full history visible after `--unshallow` |
| `git reflog --all` | only `clone` / `checkout` entries — no orphaned/older local commits |
| `git cat-file -t 9f803ac` | `fatal: Not a valid object name 9f803ac` |
| `git cat-file -t feb7361` | `fatal: Not a valid object name feb7361` |
| `git cat-file -t 646fc54` | `fatal: Not a valid object name 646fc54` |

The clone was shallow (`--is-shallow-repository` → `true`); after `git fetch --unshallow origin`
the full history was restored and still contains none of the three expected SHAs.

## 2. REMOTE SEARCH (GitHub API)

- `GET /repos/{repo}/commits/9f803ac` → **HTTP 422 "No commit found for SHA: 9f803ac"**
- `GET /repos/{repo}/commits/feb7361` → **HTTP 422 "No commit found for SHA: feb7361"**
- `GET /repos/{repo}/commits/646fc54` → **HTTP 422 "No commit found for SHA: 646fc54"**

Expected branch `arena/019ff626-nexora-main-website` **does exist** on the remote; its tip is
`964e603` ("fix: update API route params type for Next.js 16"), which was merged to `main`
through PR **#61** = merge commit `5a4a520` (the stated **Remote Production Commit**).
That branch contains the Next.js 16 fix — **not** the three expected Phase 1–3 SHAs.

### Conclusion on the expected SHAs

`9f803ac`, `feb7361`, `646fc54` do not exist as commit objects anywhere — not locally, not on
any remote branch, and not in GitHub's object store for this repository. **They are lost.**

## 3. WHERE THE PHASE 1–3 WORK ACTUALLY LIVES

The Phase 1–3 changes are **already merged into production `main`**, under different SHAs
(squash-merged through PRs #62–#64). No content was actually lost:

| Phase | Real commit on `main` | Message |
| --- | --- | --- |
| 1 (mounts) | `38a5e5b` | `feat(portals): Phase 1 — mount Customer, Owner, Partner PWAs with 12 rewrites` |
| 2 (returnTo) | `f5ba4b3` | `feat(auth): Phase 2 — unified login returnTo, no role-home redirects` |
| 3 (RBAC) | `07503ad` | `feat(rbac): Phase 3 — named owner/partner helpers and verification suite` |
| 3.1 (portal 500) | `df57ba5` `a967e33` `7cb52d1` | same-origin `/api/portal` Route Handler proxy (PR #63) |
| 3.2 (RLS drift) | `1ea502f` | `fix: make Phase 3 RLS policies schema-drift safe` (PR #64) |

> The three "expected" SHAs are a stale record. Their content survived as the squash-merged
> commits above. This is reported honestly: the exact objects are **not** recoverable, and they
> are **not** being claimed as recovered.

## 4. IMPLEMENTATION AUDIT vs. PHASE 5A REQUIREMENTS

### APP MOUNTING — PASS

- `Customer → /app/customer`, `Owner → /app/owner`, `Partner → /app/partner`
  (`app/lib/portalOrigins.ts`, `app/lib/portalRoutes.ts`).
- `Template → /app/template` (`TEMPLATE_PATH`, `isTemplatePath`).
- `Jobs → /job-portal` via `beforeFiles` rewrites in `next.config.ts` (exact + trailing-slash +
  nested `/:path*`).
- External role PWAs are served **same-origin** through `app/api/portal/[portal]/[[...path]]/route.ts`
  (exact + trailing-slash + nested), fronted by `middleware.ts`. This is the documented
  resolution of the foreign-Vercel-rewrite 500 (see below) — not an unguarded foreign proxy.
- Catch-all `app/[...path]/page.tsx` delegates portal paths to the portal gateway; the
  `/app/*` and `/growth-partner*` routes are handled by the middleware matcher first.

### PARTNER 500 ROOT CAUSE — PASS

Root cause: rewriting `/app/{role}` (and the legacy `/growth-partner` vercel.json rule) to a
**foreign Vercel deployment** returns HTTP 500 on Vercel. Fix: same-origin `middleware.ts`
rewrite → `/api/portal/{role}/…` Route Handler, which `fetch()`es the PWA origin server-side.
`app/api/portal/[portal]/[[...path]]/route.ts` strips `x-frame-options`, preserves query params,
and returns the proxied body. No foreign edge rewrite remains for the role portals.

### LOGIN / RETURNTO — PASS

- `packages/auth/src/redirects.ts`: `safeReturnPath` (rejects protocol-relative `//`, backslash
  smuggling, `javascript:`), `safeRedirectUrl` (allowlist-only, https-only except localhost),
  `destinationForVerifiedRole` (honors safe `returnTo`; role-home is fallback only — no
  role-mismatch sign-out/redirect), `buildLoginUrl` / `buildCallbackUrl` (sanitized `returnTo`).
- Logged-out app click → central `/auth/login?role=…&returnTo=…`; login success returns to the
  sanitized selected route. Verified by `tests/returnto-security.test.mjs`.

### RBAC / RLS — PASS

- `packages/auth/src/access.ts`: `requireOwnerWorkspace` (via `owner_salon_ids()`), 
  `requirePartnerMembership` (`growth_partners` by `auth.uid()`), `requireCustomerAccount`.
- `supabase/migrations/20260812_phase3_rbac_verification.sql`: `is_salon_owner`,
  `is_proposal_attributed`, `approve_proposal` (owner-only), `publish_salon_website`
  (owner-only) — partner cannot publish; approval/publish are owner-gated. Idempotent,
  schema-drift-safe RLS for bookings/favorites/proposals.
- No frontend/localStorage authorization; no service-role key ships to the browser
  (`packages/auth/src/env.ts` rejects `service-role-key` at validation).

---

## FINAL REPORT

| Check | Result |
| --- | --- |
| LOCAL COMMITS FOUND | **FAIL** |
| COMMITS RECOVERED | **FAIL** (objects do not exist locally or on GitHub) |
| CHANGES REBUILT | **NOT APPLICABLE** (already merged to `main`; rebuild would duplicate) |
| LATEST MAIN SYNCED | **PASS** (`origin/main` fetched; HEAD `1c36ddc` == `origin/main`) |
| APP MOUNT FIXES PRESENT | **PASS** |
| PARTNER 500 ROOT CAUSE FIXED | **PASS** |
| LOGIN/RETURNTO FIXES PRESENT | **PASS** |
| RBAC/RLS FIXES PRESENT | **PASS** |

**BRANCH:** `arena/019ff8f5-nexora-main-website` (session branch; no rebuild branch created)

**LOCAL COMMIT SHA:** N/A — no rebuild commit created (per "do not create duplicate commits").

**FILES CHANGED:** none (recovery-only phase; Phase 1–3 changes already on `main`).

**REMAINING BLOCKERS:** none for Phase 5A. No push / PR / deploy performed, per scope.
