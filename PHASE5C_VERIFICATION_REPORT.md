# PHASE 5C — Preview Deployment, Live RLS and Acceptance Verification

Date: 2026-08-13
Session branch: `arena/019ff8f5-nexora-main-website`
Repository: `janhvitiwari627-hue/nexora-main-website`

---

## Critical finding — root cause of the Partner HTTP 500 (now fixed)

Phase 5B's `beforeFiles` → `/api/portal/{role}` proxy did **not** fix the 500; it made it
visible at the top-level `/app/{role}` route. Live preview + production HTTP evidence showed:

| Mechanism | Result |
| --- | --- |
| Serverless `fetch()` to a foreign `.vercel.app` (Route Handler proxy) | **HTTP 500** (`/api/portal/*` **and** `/api/growth-partner/*`, in prod + preview) |
| Cross-origin edge rewrite to a foreign `.vercel.app` | **HTTP 500** (Phase 1's documented failure) |
| Cross-origin **redirect** to the external origin | **200** (the legacy `/growth-partner` 308 works) |

**Root cause:** Vercel cannot reverse-proxy another `.vercel.app` deployment — both a
serverless `fetch` and an edge rewrite return HTTP 500. The only working mechanism is a
client-side redirect.

**Fix (commit `ac40988`):** `/app/{customer,owner,partner}` (exact + trailing-slash + nested)
are now **307 redirects** to the external PWA origins, mirroring the proven `/growth-partner`
redirect. This satisfies "no HTTP 500", "no iframe", "no mount blocker", "no client mounted
flag". It deviates from the literal "`beforeFiles` rewrites" wording only because a
`beforeFiles` rewrite to a foreign Vercel deployment is exactly what returns 500 — this is
documented here rather than hidden.

Deep links are preserved by mapping the `/app/{role}` prefix onto the origin root
(`/app/partner/proposals` → `origin/proposals`); query strings are preserved by Vercel.

## Evidence gathered

**Preview URL (commit ac40988):**
`https://nexora-main-website-oqvi056wn-janhvitiwari627-hues-projects.vercel.app`

**Route matrix — all 15 routes resolve, zero HTTP 500:**

| Route | Final URL | Status |
| --- | --- | --- |
| /app/customer | custmer-fresh-app.vercel.app/ | 200 ✅ |
| /app/customer/ | custmer-fresh-app.vercel.app/ | 200 ✅ |
| /app/customer/profile | custmer-fresh-app.vercel.app/profile | 200 ✅ (deep link) |
| /app/owner | shop-onwer-pink-nexora-aap.vercel.app/ | 200 ✅ |
| /app/owner/ | shop-onwer-pink-nexora-aap.vercel.app/ | 200 ✅ |
| /app/owner/settings | shop-onwer-pink-nexora-aap.vercel.app/settings | 200 ✅ (deep link) |
| /app/partner | pink-growth-partner-…vercel.app/ | 200 ✅ |
| /app/partner/ | pink-growth-partner-…vercel.app/ | 200 ✅ |
| /app/partner/proposals | pink-growth-partner-…vercel.app/proposals | 200 ✅ (deep link) |
| /app/template | /auth/login?role=owner&returnTo=%2Fapp%2Ftemplate | 200 ✅ (unified login) |
| /app/template/editor | /auth/login?role=owner&returnTo=%2Fapp%2Ftemplate%2Feditor | 200 ✅ |
| /job-portal | (job portal SPA) | 200 ✅ |
| /job-portal/jobs | (job portal SPA → login) | 200 ✅ |
| /job-portal/applications | (job portal SPA → login) | 200 ✅ |

Query-string preservation confirmed: `/app/partner?ref=NEXORA1` → `origin/?ref=NEXORA1`.

No "app is not mounted", no iframe, no redirect loop, no catch-all interception, no 500.

## FINAL REPORT

| Check | Result |
| --- | --- |
| VERCEL CONNECTION | **PASS** (via GitHub ↔ Vercel integration; deployments API) |
| PREVIEW ENVIRONMENT | **PARTIAL** (Supabase URL verified; full var list needs Vercel token) |
| PREVIEW DEPLOYMENT | **PASS** (READY, commit `ac40988`) |
| CUSTOMER PREVIEW ROUTES | **PASS** (3/3) |
| OWNER PREVIEW ROUTES | **PASS** (3/3) |
| PARTNER PREVIEW ROUTES | **PASS** (3/3) |
| TEMPLATE PREVIEW ROUTES | **PASS** (3/3 — unified-login redirect) |
| JOBS PREVIEW ROUTES | **PASS** (3/3) |
| NO HTTP 500 | **PASS** |
| NO MOUNT ERRORS | **PASS** |
| DEEP LINKS AND REFRESH | **PASS** (deep link + query preserved) |
| ASSETS/MANIFEST/SERVICE WORKERS | **PARTIAL** (served by external PWAs; not instrumented here) |
| LOGIN/RETURNTO | **PARTIAL** (logged-out → unified login + sanitized returnTo verified; authenticated shell matrix not verified — no credentials) |
| AUTHENTICATED APP-SHELL MATRIX | **BLOCKED** (no test credentials in sandbox) |
| SUPABASE CONNECTION | **BLOCKED** (no Supabase CLI / access token) |
| MIGRATION STATE VERIFIED | **BLOCKED** (no Supabase access) |
| LIVE RLS TESTS | **BLOCKED** (no Supabase access / user sessions) |
| SUPABASE SECURITY ADVISOR | **BLOCKED** (requires Supabase dashboard/CLI) |
| SUPABASE PERFORMANCE ADVISOR | **BLOCKED** (requires Supabase dashboard/CLI) |
| PR READY FOR REVIEW | **NOT SET** (kept draft — login matrix + RLS still unverified) |
| PRODUCTION DEPLOYMENT | **PENDING MERGE** |
| PRODUCTION ACCEPTANCE | **PENDING** |

**BRANCH:** `arena/019ff8f5-nexora-main-website`
**COMMIT SHA:** `ac40988ab20ef7f62b034db7c24305147d7ab8e2`
**PR URL:** https://github.com/janhvitiwari627-hue/nexora-main-website/pull/65
**PREVIEW URL:** https://nexora-main-website-oqvi056wn-janhvitiwari627-hues-projects.vercel.app
**PRODUCTION URL:** https://nexora-main-website.vercel.app

## EXACT REMAINING BLOCKERS

1. **Authenticated login/app-shell matrix** (Customer/Owner/Partner/role-less accounts) — needs
   real Supabase test accounts; no credentials available in this sandbox.
2. **Live RLS matrix** (booking create/read, proposal approve/publish, partner draft access,
   jobs private data) — needs Supabase access + authenticated sessions.
3. **Supabase migration state, Security Advisor, Performance Advisor** — needs Supabase
   dashboard or `supabase` CLI with an access token (not available here).
4. **Production `/app/partner` HTTP evidence** — only possible after user approval + merge
   (production still runs the old code; this phase must not deploy).

## NEXT REQUIRED ACTION

A human with **Supabase project access (`qwaehqsmodekbgvnaavz`)** and **Vercel account access**
must run the login/RLS matrix and advisors, then mark PR #65 ready for review. No merge or
production deployment has been performed.
