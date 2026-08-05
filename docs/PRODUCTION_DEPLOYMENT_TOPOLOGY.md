# Nexora — Section 10.6 Deployment Topology & Canonical Domain

## 1. Locked decision: one canonical production domain, path-based routing

**Canonical domain: `https://nexora.app`** (single origin). No subdomains per role. No multi-origin
auth. Supabase Auth cookies/localStorage, session storage, and the shared project
`qwaehqsmodekbgvnaavz` all assume one browser origin; splitting roles across subdomains breaks
session sharing and widens the CORS surface.

| Surface | Path | Served by |
|---|---|---|
| Public website + auth pages | `/`, `/salons`, `/salons/:slug`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/expired`, `/terms`, `/privacy`, `/cancellation-refund` | Main Website (Next/vinext on Vercel — this repo) |
| Customer PWA | `/app/customer/*` | Reverse-proxy rewrite → `https://custmer-fresh-app.vercel.app/app/customer/*` |
| Owner PWA | `/app/owner/*` | Reverse-proxy rewrite → `https://pink-nexora-aap.vercel.app/app/owner/*` |
| Growth Partner PWA | `/app/partner/*` | Reverse-proxy rewrite → `https://pink-growth-partner-aap.vercel.app/app/partner/*` |
| Owner portal gateway | `/owner` → redirects into `/app/owner` after role check | Main Website role gate |
| Partner portal gateway | `/partner` (via `/growth-partner`) → `/app/partner` after role check | Main Website role gate |
| Legacy dashboard paths | `/dashboard/{customer,business_user,growth_partner}` | Main Website → routed to canonical portal path for the session role |

Route authority in code: `app/lib/portalRoutes.ts` (paths) + `app/nexora-app.tsx` (guards) +
`next.config.ts`/`vercel.json` (rewrites). The rewrites are already committed; this section locks
them as the production topology.

## 2. Route mappings

```
GET /                       → Main Website home
GET /salons                 → catalog (public projection)
GET /salons/:slug           → salon detail (public projection)
GET /login /signup          → Supabase password auth (+ Google when enabled)
GET /forgot-password        → resetPasswordForEmail
GET /reset-password         → recovery session → updateUser({password})
GET /auth/callback?code=…   → PKCE exchangeCodeForSession → role portal
GET /auth/expired           → session-expired landing
GET /app/customer/**        → Customer PWA (rewritten, path preserved)
GET /app/owner/**           → Owner PWA (rewritten, path preserved)
GET /app/partner/**         → Growth Partner PWA (rewritten, path preserved)
ANY /admin/**               → AdminUnavailable (no public admin surface)
```

## 3. Reverse-proxy rewrite rules (Vercel, already in `vercel.json`)

```json
{ "source": "/app/customer",          "destination": "https://custmer-fresh-app.vercel.app/app/customer" }
{ "source": "/app/customer/:path*",   "destination": "https://custmer-fresh-app.vercel.app/app/customer/:path*" }
{ "source": "/app/owner",             "destination": "https://pink-nexora-aap.vercel.app/app/owner" }
{ "source": "/app/owner/:path*",      "destination": "https://pink-nexora-aap.vercel.app/app/owner/:path*" }
{ "source": "/app/partner",           "destination": "https://pink-growth-partner-aap.vercel.app/app/partner" }
{ "source": "/app/partner/:path*",    "destination": "https://pink-growth-partner-aap.vercel.app/app/partner/:path*" }
```

Equivalent for any other edge (nginx):

```nginx
location ^~ /app/customer/ { proxy_pass https://custmer-fresh-app.vercel.app; proxy_set_header Host custmer-fresh-app.vercel.app; }
location ^~ /app/owner/    { proxy_pass https://pink-nexora-aap.vercel.app;    proxy_set_header Host pink-nexora-aap.vercel.app; }
location ^~ /app/partner/  { proxy_pass https://pink-growth-partner-aap.vercel.app; proxy_set_header Host pink-growth-partner-aap.vercel.app; }
```

Rules for the upstreams:
- Each PWA must serve under its path base (Vite `base: "/app/customer/"` etc.) — already configured per `docs/PHASE1_PATH_BASED_PORTALS.md`.
- Upstream apps must set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from environment only (no hardcoded keys — Owner PWA key hardcoding is tracked as a P2 blocker in its repo).
- Upstreams must send `X-Frame-Options: SAMEORIGIN` only if embedded; since this is a reverse proxy (same-origin to the browser), no frame embedding occurs.

## 4. CORS headers

Because all three PWAs and the website are **same-origin** behind `nexora.app`, the production
CORS posture is:

| Header | Value | Where |
|---|---|---|
| `Access-Control-Allow-Origin` | **Do not set permissive ACAO on any app route.** Supabase REST (`qwaehqsmodekbgvnaavz.supabase.co`) already allows the anon key from any origin by design; no extra CORS is needed. | Main + PWAs |
| Supabase Dashboard → API → Allowed CORS origins | `https://nexora.app` (add only; never `*` for production hardening note) | Supabase |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Main + PWAs |
| `X-Content-Type-Options` | `nosniff` | Main + PWAs |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' https://qwaehqsmodekbgvnaavz.supabase.co; img-src 'self' data: https://qwaehqsmodekbgvnaavz.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;` (start in report-only) | Main Website headers |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Vercel provides on custom domain |

## 5. Environment variables per deployment target

| Target | Variable | Value | Notes |
|---|---|---|---|
| Main Website (Vercel) | `NEXT_PUBLIC_SUPABASE_URL` | `https://qwaehqsmodekbgvnaavz.supabase.co` | public |
| Main Website | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | public key only — never service_role |
| Main Website | `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `true` only after §10.2 verification | default `false` hides button |
| Main Website | `NEXORA_CUSTOMER_PWA_ORIGIN` | `https://custmer-fresh-app.vercel.app` | server-only, drives `next.config.ts` rewrites + mounted flags |
| Main Website | `NEXORA_OWNER_PWA_ORIGIN` | `https://pink-nexora-aap.vercel.app` | server-only |
| Main Website | `NEXORA_PARTNER_PWA_ORIGIN` | `https://pink-growth-partner-aap.vercel.app` | server-only |
| Customer PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | same shared project | env injection only |
| Owner PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | same shared project | remove hardcoded fallbacks |
| Growth Partner PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | same shared project | integration patch applied |
| Supabase Edge Functions | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | secrets only | never in `NEXT_PUBLIC_*`/`VITE_*` |

**Prohibited everywhere:** `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_*`/`VITE_*` variable,
client bundle, or committed file. Repo contract test `tests/production-auth-security-contract.test.mjs`
enforces absence.

## 6. Canonical-redirect rules

- `http://nexora.app/*` → `https://nexora.app/*` (301, platform-provided).
- `https://www.nexora.app/*` → `https://nexora.app/*` (301) — or do not provision `www` DNS at all.
- `https://*.vercel.app` project URLs remain live for staging only; Supabase redirect allowlists
  must list `https://nexora.app/**` for production and staging entries removed at launch.
