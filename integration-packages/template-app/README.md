# Template App — authoritative source: `templateapp67-oss/FINAL-NEW-APP-TEMPLETE-`

- **Authoritative source repository:** [`templateapp67-oss/FINAL-NEW-APP-TEMPLETE-`](https://github.com/templateapp67-oss/FINAL-NEW-APP-TEMPLETE-) (branch `main`)
- **Authoritative source HEAD (vendored):** `8d7bb251fab0c6d640c99f7d95a1daf38f41abe4` (2026-08-21)
- **Authoritative source Vercel deployment:** `https://final-new-app-templete.vercel.app/` (live, confirmed)
- **Integration date:** 2026-08-21
- **Operator decision:** explicit operator approval on 2026-08-21 to switch the Template App source from `templateapp67-oss/NEW-TAMPLETE-APP` to `templateapp67-oss/FINAL-NEW-APP-TEMPLETE-`, accepting the regression risk identified in earlier audits (220 → 207 source files, no `database.types.ts` and no `@nexora/auth` vendor in the FINAL repo, less feature work in the FINAL repo's history).

## What this directory contains

This is the complete, vendored copy of `FINAL-NEW-APP-TEMPLETE-` (the
authoritative Template App source) at the commit listed above. The vendored
copy is preserved as a byte-identical audit artifact under `files/` so the
Nexora repo always carries the exact source it integrates against.

```
integration-packages/template-app/
├── README.md             — this file
├── CONFLICT_LOG.md       — full migration log from the previous source
└── files/                — vendored, byte-identical copy of the source repo
    ├── AGENTS.md
    ├── index.html
    ├── package.json
    ├── server.ts
    ├── server/           — server-side source
    ├── api/              — Vercel serverless functions
    ├── api-routes.ts
    ├── vercel.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.example
    ├── src/              — React 19 / Vite 6 client source
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/   — 80 components
    │   ├── lib/          — 35 lib modules
    │   ├── hooks/        — 1 module
    │   ├── config/       — 1 module (white-label brand config)
    │   ├── types/        — 1 module
    │   └── polyfill.ts
    ├── supabase/         — source-side migration set
    ├── scripts/          — test scripts
    └── docs/             — phase docs, handoff notes
```

The previously-used `auth-integration.patch`, `phase6-unified-auth.patch`,
`back-to-main-website.patch`, and `files/src/lib/{supabaseClient,useAuth}.ts`
patches that wrapped the `NEW-TAMPLETE-APP` integration have been retired.
The FINAL repo is self-contained — it vendors no `@nexora/auth` package and
creates its own Supabase client from environment variables.

## How the integration works

The Template App is a **separate Vercel deployment** of the source vendored
under `files/`. The Nexora main website does NOT bundle, mount, or import
this source. Instead, the `/app/template` route is a 307 redirect to the
canonical Vercel deployment of the source:

| Nexora repo (this) | Template App (external Vercel) |
|---|---|
| `config/portalOrigins.ts` declares `DEFAULT_PORTAL_ORIGINS.template = "https://final-new-app-templete.vercel.app"` | `https://final-new-app-templete.vercel.app` is the live Vercel deployment of the vendored `files/` source |
| `next.config.ts` redirects `/app/template` and `/app/template/:path*` to the origin above | The origin serves the React 19 / Vite 6 SPA built from the vendored source |
| `packages/auth/src/redirects.ts` includes the origin in `DEFAULT_ALLOWED_AUTH_ORIGINS` for the PKCE redirect allowlist | The PKCE flow runs against the shared Supabase project `qwaehqsmodekbgvnaavz` |
| `app/lib/nexora-apps.ts` registers the template as the 4th of 6 Nexora apps (`external-origin`, `role-gated`, `business_user`) | n/a |
| `app/lib/portalRoutes.ts` declares `TEMPLATE_PATH = "/app/template"` | n/a |

The deployment URL can be overridden per environment by setting
`NEXORA_TEMPLATE_PWA_ORIGIN` to an absolute HTTPS origin. When unset, the
default above is used; this is the only Nexora variable that has a built-in
default because the Template App is the one external PWA that has its own
production Vercel origin.

## Required environment variables

The Template App source itself reads these environment variables (declared
in `files/.env.example`):

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | Browser Supabase project URL (shared `qwaehqsmodekbgvnaavz` for the canonical Nexora integration). |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Browser anon/publishable key. Never a service-role key. |
| `VITE_GOOGLE_OAUTH_ENABLED` | No | Set to `"true"` to enable Google OAuth. Defaults to `"false"`. |
| `SUPABASE_URL` | Yes (server) | Server-side Supabase URL (used by `server.ts` for the API proxy). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Server-side service role key. **Never** exposed to the browser. The vendored `client.ts` rejects service-role keys at build time. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | No | Razorpay integration. Server-side only. |
| `APP_ORIGIN` | No | Browser origin for the API proxy (e.g., `https://final-new-app-templete.vercel.app`). |
| `ALLOWED_API_ORIGINS` | No | Comma-separated list of cross-origin callers allowed to hit the API proxy. |
| `GEMINI_API_KEY` | No | Google Gemini API key for the AI content generation. Server-side only. |
| `NOMINATIM_BASE_URL` / `NOMINATIM_APP_IDENTIFIER` / `NOMINATIM_REFERER` | No | Nominatim geocoder overrides. |

The Nexora main website itself needs no Template-App-specific env vars;
`NEXORA_TEMPLATE_PWA_ORIGIN` is optional and only used to override the
default origin above.

## Deployment checklist (for the Template App maintainer)

1. The source in `files/` is the complete canonical implementation. Apply
   any future updates by re-vendoring from `FINAL-NEW-APP-TEMPLETE-@main`.
2. Set `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co` and
   `VITE_SUPABASE_ANON_KEY` to the shared project's anon/publishable key.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the Vercel server
   runtime. Never prefix the service role key with `VITE_` — the vendored
   `client.ts` rejects service-role JWTs at build time.
4. Deploy to the Vercel project that owns `final-new-app-templete.vercel.app`
   (or override `NEXORA_TEMPLATE_PWA_ORIGIN` on the Nexora main website to
   point at a different deployment).
5. Add `https://final-new-app-templete.vercel.app` to Supabase
   Authentication → URL Configuration → Redirect URLs.
6. The build command is `npm run build` (Vite + esbuild server bundle,
   per `vercel.json`); the install command is `npm install`.

## What changed in the Nexora main website (this repo)

To make the Template App use the FINAL source, the following changes were
made in this repo. **No other Nexora functionality was modified.**

| File | Change |
|---|---|
| `config/portalOrigins.ts` | `DEFAULT_PORTAL_ORIGINS.template` switched from `https://new-tamplete-app.vercel.app` to `https://final-new-app-templete.vercel.app`. Documentation comment updated. |
| `packages/auth/src/redirects.ts` | `DEFAULT_ALLOWED_AUTH_ORIGINS` entry switched from `https://new-tamplete-app.vercel.app` to `https://final-new-app-templete.vercel.app`. Documentation comment updated. |
| `tests/auth-config-contract.test.mjs` | `TEMPLATE_APP_ORIGIN` constant and the `redirects` assertion updated to the new origin. |
| `tests/portal-origin-config.test.ts` | `DEFAULT_TEMPLATE_ORIGIN` assertion and the self-referential deployment origin test updated. |
| `tests/path-routing-contract.test.mjs` | The "single hardcoded origin" assertion updated to the new origin. |
| `next.config.ts` | Documentation comment updated. |
| `app/nexora-app.tsx` | Documentation comment updated. |
| `integration-packages/template-app/` | Completely replaced — old patches and adapter files removed; FINAL source vendored under `files/`. |

## Unrelated Nexora functionality preserved

The following are **unchanged** in this change. The only files modified
are listed in the table above; the rest of the repo is byte-identical to
`main@71d6e12`:

- Nexora homepage, all homepage sections
- Customer PWA, Owner PWA, Growth Partner PWA
- Jobs PWA, Distributors Beauty Industry app
- Unified login / signup / forgot password / reset password
- Shared Supabase project (`qwaehqsmodekbgvnaavz`), PKCE, storage key
- Database, migrations, RLS policies
- Existing routes (`/app/customer`, `/app/owner`, `/app/partner`,
  `/app/template`)
- Existing environment variable architecture
- Existing Vercel / Wrangler / Next.js configuration
- All other `integration-packages/*` content (Customer, Owner, Partner)
- All existing contract tests outside the five files listed above

## Acceptance checks

| Check | Result |
|---|---|
| `/app/template` route registered | `app/lib/portalRoutes.ts:19` — `TEMPLATE_PATH = "/app/template"` (preserved) |
| `/app/template` 307 redirect | `next.config.ts:57–58` — redirects to `portalOrigins.template` which now resolves to `https://final-new-app-templete.vercel.app` |
| Template App origin live | `fetch_page("https://final-new-app-templete.vercel.app/")` returns the "Nexora — Salon Website Builder" landing page |
| Template App origin in PKCE allowlist | `packages/auth/src/redirects.ts:DEFAULT_ALLOWED_AUTH_ORIGINS` includes `https://final-new-app-templete.vercel.app` |
| Template App origin contract test | `tests/auth-config-contract.test.mjs` — 4/4 PASS (tested below) |
| Hardcoded origin contract test | `tests/path-routing-contract.test.mjs` — updated to assert the new origin |
| Self-referential origin test | `tests/portal-origin-config.test.ts` — updated to use the new origin |
| Other Nexora functionality | preserved (verified by `git diff main` showing only Template App integration changes) |

## See also

- `CONFLICT_LOG.md` — the detailed migration log
- `config/portalOrigins.ts` — the source of truth for the default origin
- `tests/auth-config-contract.test.mjs` — contract test that the URL is wired correctly
- `app/lib/nexora-apps.ts` — registers the template as the 4th of 6 Nexora apps
- `https://github.com/templateapp67-oss/FINAL-NEW-APP-TEMPLETE-` — the canonical source
- `https://final-new-app-templete.vercel.app/` — the live deployment
