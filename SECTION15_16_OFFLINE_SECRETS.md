# SECTIONS 15 & 16 — OFFLINE SECURITY & SECRET/CLIENT SECURITY

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website` (+ `job-portal/` workspace)
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS

- Section 15 (offline) — **static PASS** (with one PARTIAL note on stale-timestamp UX).
- Section 16 (secrets) — **PASS** (static + git-history scan). No live secrets found.
- Live runtime verification of service-worker/cache behavior would need a browser session —
  **not performed** (sandbox has no browser); the code/config evidence below is authoritative for
  what ships in the bundle.

---

# SECTION 15 — OFFLINE SECURITY

## 15.1 Architecture

- **Main website is not a PWA host.** `app/sw.js/route.ts` returns `404` with an explicit note:
  *"The Main Website is not a PWA host. Portal service workers are owned by their Vite deployments."*
  → The main site installs **no** service worker, so it cannot invent/inject bookings, balances,
  notifications, reviews, commissions, or payment success. ✅
- **Jobs SPA** is the only PWA (`vite-plugin-pwa`, `registerSW`). Its Workbox config is
  **read-only GET caching only**:
  - `public_job_listings` → `NetworkFirst`, 5 s timeout, 100 entries, 1 h TTL.
  - cross-origin images → `StaleWhileRevalidate`, 7 d TTL.
  - Google Fonts → `StaleWhileRevalidate`, 30 d TTL.
  - `globPatterns` precaches only static assets (`js,css,html,ico,png,svg,webp,woff2`).

## 15.2 Checklist

| Requirement | Result |
| --- | --- |
| Read-only cache shows stale timestamp | ⚠️ **PARTIAL** — no visible "stale" timestamp is rendered for the cached `public_job_listings` (the `NetworkFirst` + 1 h TTL implies staleness but the UI does not surface a "last updated" label). Location badges DO show `stale`/`saved` freshness, but that's GPS, not the jobs cache |
| No simulated booking/payment success | ✅ no offline write simulation anywhere (no `mock`/`fake`/`stub` success in `backend.ts`) |
| Non-idempotent writes disabled offline | ✅ writes go straight to Supabase RPCs/tables; offline failures surface as errors (no queueing of non-idempotent writes) |
| Outbox only approved idempotent ops | ✅ **no outbox exists** — there is no offline write queue to leak non-idempotent operations |
| SW does not invent bookings/balances/notifications/reviews/commissions/payment | ✅ SW only caches GET responses for public listings/images/fonts; no business-data fabrication |
| Private cache clears on logout | ✅ no private data is cached: cache names are public-only (`nexora-public-jobs-v1`, images, fonts); no `localStorage`/`sessionStorage` for business data; `auth.signOut()` clears the session |
| One user cannot see another's cached private data | ✅ no per-user data is cached (only public GETs); Realtime/subscription data refetches through RLS |

## 15.3 Findings

- **F15-offline (P3):** stale-timestamp visibility. `public_job_listings` is served `NetworkFirst`
  and can be up to 1 h old while offline, but the Jobs UI does not display a "stale / last updated"
  indicator. Recommend a `X-Served-From-Cache`/timestamp hint. (Not a security hole — data is
  public and the server re-authorizes on reconnect.)

---

# SECTION 16 — SECRET & CLIENT SECURITY

## 16.1 Scanned surfaces

Scanned: all tracked files (`git grep`), the Jobs workspace, `integration-packages/*.patch`,
`build/`, `public/job-portal/`, `.wrangler/`, `.env*` examples, and **full git history**
(`git log --all -p -S` / `-G` for key patterns).

## 16.2 Results

| Pattern | Findings |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | **0 real occurrences.** Only `your-service-role-key-here` placeholder in `.env.acceptance.example` (commented) |
| `service_role_key` / `SERVICE_ROLE` | only **defensive** code: `looksLikeServiceRoleKey()` in `packages/auth/src/env.ts` (rejects service keys in browser) and comments |
| JWT / `eyJ…` keys | **0** in tracked files and history |
| Live payment secrets (`sk_live`, `rzp_live`, `sk_`) | **0** |
| Private DB URLs | **0** (only `qwaehqsmodekbgvnaavz.supabase.co` public URL; DB password is a `PASSWORD` placeholder in an apply script) |
| Access/refresh tokens | only patch-diff **removals** (`-access_token`, `-refresh_token`) in `integration-packages/owner-pwa/*.patch` — the old code is being removed, not added |
| Hardcoded passwords | **0** (only `env(SUPABASE_AUTH_EXTERNAL_*_SECRET)` indirection in `job-portal/supabase/config.toml`) |

## 16.3 Verification checklist

| Requirement | Result |
| --- | --- |
| Only publishable/anon key in browser config | ✅ client config reads `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` only; `websiteClientOptions` carries anon key |
| No service-role key in NEXT_PUBLIC/VITE | ✅ `env.ts` **rejects** a service-role key (`looksLikeServiceRoleKey` → `problems.push("service-role-key")`) |
| Logs do not expose tokens/private records | ✅ no `.log` files with secrets; `console.error` uses `error.message`, not raw tokens |
| Integration patches contain no secrets | ✅ patches contain defensive `service_role`-detection code and diff **removals**, not live keys |
| Documentation placeholders only | ✅ `.env.example` = `your-anon-key-here`; `.env.acceptance.example` = `your-service-role-key-here` (commented), `TestPassword123!` labeled as test accounts |

## 16.4 Findings

- **F16 (P3, informational):** `.env.acceptance.example` documents a `SUPABASE_SERVICE_ROLE_KEY`
  slot (commented, `your-service-role-key-here`). It is correctly a placeholder and excluded by
  `.gitignore` (`*.env*` except `.env.example`), but any operator copy must never commit the real
  value. No action required beyond care.

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| OFFLINE SECURITY (static) | **PASS** (F15-offline P3: stale-timestamp UX) |
| SECRET / CLIENT SECURITY | **PASS** |
| NO SERVICE-ROLE IN BROWSER | **PASS** (actively rejected in client env validation) |
| GIT HISTORY CLEAN | **PASS** (no key ever committed) |

## EXACT REMAINING BLOCKERS
1. None blocking. F15-offline (stale indicator) is a UX improvement, not a security gap.

## NEXT REQUIRED ACTION
No security action required for Sections 15/16. Phase 6 remains unstarted; no live PASS is
recorded (only static/code evidence, which is the authoritative source for shipped bundle content).
