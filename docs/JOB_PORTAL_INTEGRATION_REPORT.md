# Nexora Main Website + Job Portal `/job-portal` Integration Report

Date: 2026-08-09

## 1. Architecture

The Job Portal remains an isolated React/Vite application and is vendored as the npm workspace `job-portal/`. It is not merged into the Next/Vinext React tree, so its Tailwind theme, reset, Vite plugins, React client entry, Workbox worker, and dependencies cannot collide with the Main Website.

The Main Website build runs `scripts/build-job-portal.sh`, which builds the workspace with `VITE_APP_BASE_PATH=/job-portal/` into the ignored generated directory `public/job-portal/`. Next then packages those static files in the same Vercel deployment. Explicit same-origin rewrites serve the Job Portal SPA index for supported `/job-portal/*` application routes while real assets are served from `/job-portal/assets`, `/job-portal/icons`, `/job-portal/sw.js`, and `/job-portal/manifest.webmanifest`.

No iframe, external redirect, or copy of the Job Portal UI into the Main Website component tree is used.

## 2. Files changed/created

Main integration files:

- `package.json`, `package-lock.json` — npm workspace and isolated build/lint scripts
- `.gitignore` — ignores generated `public/job-portal/`
- `.env.example` — safe Main vs Job Portal variable matrix
- `scripts/build-job-portal.sh` — maps browser-safe env names and builds the mount
- `next.config.ts` — explicit SPA route rewrites and scoped PWA headers
- `tsconfig.json` — excludes the independently type-checked Vite workspace from Next type checking
- `app/nexora-app.tsx` — desktop/mobile Job Portal navigation and existing lint-safe fixes
- `app/globals.css` — responsive hamburger menu and Job Portal item styling
- `tests/job-portal-integration.test.mjs` — route, PWA, database-inventory, and secret contracts
- `docs/JOB_PORTAL_INTEGRATION_REPORT.md` — this report
- `job-portal/**` — isolated versioned Job Portal source, PWA configuration, tests, and existing Supabase migrations

The generated `public/job-portal/**` build is intentionally not committed.

## 3. Dependencies

The root now declares `job-portal` as an npm workspace. Job Portal dependencies remain declared in `job-portal/package.json`; they were not blindly copied into the Main Website dependency list. npm may hoist compatible packages, but Vite builds the Job Portal as a separate bundle and Next excludes the workspace from its TypeScript program.

No Main Website major dependency was upgraded. The existing Job Portal dependency versions and standalone deployment remain preserved.

## 4. Routing

Verified direct-refresh routes returning the Job Portal document:

- `/job-portal`
- `/job-portal/jobs`
- `/job-portal/login`
- `/job-portal/signup` and `/job-portal/signup/*`
- `/job-portal/profile`
- `/job-portal/applications`
- `/job-portal/interviews`
- `/job-portal/offers`
- `/job-portal/messages`
- `/job-portal/saved`
- `/job-portal/portfolio`
- `/job-portal/employer`
- `/job-portal/admin`
- `/job-portal/support`
- `/job-portal/settings`

The Job Portal now maps URL paths to its existing screen state and syncs screen changes back to canonical paths. Protected direct routes retain their intended destination through login. Main Nexora routes continue to render the Main Website.

## 5. Supabase

No Jobs database migration, RLS policy, RPC, bucket, or Realtime publication was deleted or renamed. Live validation after integration reported:

- 35 Jobs tables
- RLS enabled on all 35
- 57 Jobs policies
- 9 recorded Jobs migrations
- 7 required Storage buckets
- 6 Realtime tables

The integration continues to use project `qwaehqsmodekbgvnaavz` and reuses canonical `profiles`, `organizations`, `salons`, and `push_subscriptions`. Only publishable/anon credentials enter browser builds.

## 6. Authentication

Job Portal auth redirect construction uses `import.meta.env.BASE_URL` for OAuth and password recovery. Signup verification emails were later disabled by explicit product decision (`mailer_autoconfirm=true`), so new accounts activate immediately without a verification/resend screen.

Supabase Auth is configured with:

- Site URL: `https://nexora-main-website.vercel.app`
- Allowed: `https://nexora-main-website.vercel.app/**`
- Rollback preserved: `https://job-portal-nexora.vercel.app/**`
- Local test URLs preserved

One-email/one-Job-Portal-role enforcement remains server-owned by `job_user_roles` and `job_register_role`.

## 7. PWA

For the integrated build:

- manifest `id`, `scope`, and `start_url` use `/job-portal/`
- all icons and assets use `/job-portal/*`
- Workbox navigation fallback is `/job-portal/index.html`
- the worker script is `/job-portal/sw.js`
- `Service-Worker-Allowed` is `/job-portal/`
- root `/sw.js` remains a 404 from the Main Website
- runtime caching still allows only the public jobs view, public images, and fonts; no protected mutation queue was introduced

Therefore the Job Portal worker cannot control `/`, `/salons`, Main Website auth, or other Nexora portals.

## 8. Vercel and environment variables

Required Main Vercel variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Optional aliases (the build script falls back to the matching `NEXT_PUBLIC_*` values):

```env
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<same-browser-safe-key>
```

Never configure a service-role key as `NEXT_PUBLIC_*` or `VITE_*`.

## 9. Testing evidence

Passed locally:

- Job Portal `npm run lint`
- Job Portal standalone `npm run build`
- integrated `/job-portal/` Vite build and base-path assertions
- Main `npm run lint` (warnings only; zero errors)
- Main `npm run build:next`
- Main `npm run test:contracts`: 138/138
- Main `npm test` under required Node 22: 1/1 rendered artifact test
- Jobs backend acceptance: 15/15
- Password recovery acceptance: 7/7
- direct HTTP refresh checks for Main routes and listed Job Portal routes
- root worker 404 and Job Portal worker 200 with restricted scope
- live database RLS/bucket/Realtime inventory
- committed-source secret scan contract

## 10. Known issues / honest limitations

- The existing Job Portal has no implemented public admin dashboard. `/job-portal/admin` is reserved and routed into the Job Portal, but full admin moderation UI remains a separate product task. Database admin authorization and protected review RPCs remain intact.
- Automated tests validate mobile menu contracts and responsive CSS; physical-device interaction was not executed in this sandbox.
- Main Vinext runtime requires Node 22. Local `npm test` was run successfully with Node 22; the sandbox default Node 20 cannot start Vinext.
- Existing Customer/Owner/Partner reverse proxies still emit Vinext's pre-existing credential-forwarding warning. The new Job Portal is same-origin static content and does not use that proxy mechanism.
- The old Job Portal deployment remains available for rollback and was not deleted.
