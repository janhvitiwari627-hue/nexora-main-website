# Template App source migration — `NEW-TAMPLETE-APP` → `FINAL-NEW-APP-TEMPLETE-`

**Date:** 2026-08-21
**Operator approval:** explicit override of the prior "do not switch" decision
**Previous source:** `templateapp67-oss/NEW-TAMPLETE-APP` (HEAD `e9e6291`)
**New source:** `templateapp67-oss/FINAL-NEW-APP-TEMPLETE-` (HEAD `8d7bb251fab0c6d640c99f7d95a1daf38f41abe4`)
**Trigger:** explicit operator approval to proceed with the replacement, accepting the regression risk identified in the previous audit (220 → 207 source files; absence of `database.types.ts`, `@nexora/auth` vendor, and many phases of feature work in the FINAL repo; less mature test suite).

## What was actually changed

| File | Action | Notes |
|---|---|---|
| `integration-packages/template-app/` (the whole directory) | **Replaced** | Old patches (`auth-integration.patch`, `phase6-unified-auth.patch`, `back-to-main-website.patch`, `UPDATE-auth-integration.patch`), `README.md`, `CONFLICT_LOG.md`, and the `files/src/lib/{supabaseClient,useAuth}.ts` adapters were all removed. The new directory contains: `README.md` (rewritten for the FINAL source), `CONFLICT_LOG.md` (this file), and `files/` which is a complete vendored copy of `FINAL-NEW-APP-TEMPLETE-` at HEAD `8d7bb25`. |
| `config/portalOrigins.ts` | Modified | `DEFAULT_PORTAL_ORIGINS.template` switched from `https://new-tamplete-app.vercel.app` to `https://final-new-app-templete.vercel.app`. Comment updated. |
| `packages/auth/src/redirects.ts` | Modified | `DEFAULT_ALLOWED_AUTH_ORIGINS` entry switched. Comment updated. |
| `tests/auth-config-contract.test.mjs` | Modified | `TEMPLATE_APP_ORIGIN` constant and the `redirects` regex assertion updated. |
| `tests/portal-origin-config.test.ts` | Modified | `DEFAULT_TEMPLATE_ORIGIN` assertion and the self-referential Vercel URL test updated. |
| `tests/path-routing-contract.test.mjs` | Modified | The "exactly one hardcoded origin" assertion updated. |
| `next.config.ts` | Modified | Documentation comment only. |
| `app/nexora-app.tsx` | Modified | Documentation comment only. |

## What was NOT changed (and why)

- **Nexora homepage, all homepage sections, header, hero, smart search, categories, nearby shops, open now, top salons, AI smart picks, offers, trending, verified beauty places, beauty industry spotlight, sponsored brands, sponsored video ads, membership, salon website CTA, partner/grow CTA, customer trust flow, app download CTA, FAQ, footer.** The task explicitly forbade touching these.
- **Customer PWA, Owner PWA, Growth Partner PWA, Jobs PWA, Distributors Beauty Industry app.** The task explicitly forbade touching these.
- **Shared Supabase project (`qwaehqsmodekbgvnaavz`), PKCE flow, storage key, user UUID system, role system, RLS policies.** The Template App is a separate Vercel deployment that uses the same shared project. We did not touch the Supabase integration in the main repo because the Template App reads the same env vars independently on its own origin.
- **`/app/template` route, `TEMPLATE_PATH` constant, the 307 redirect in `next.config.ts`.** Preserved exactly; only the destination origin changed.
- **`app/lib/portalRoutes.ts`, `app/lib/nexora-apps.ts`, `app/api/portal/[portal]/[[...path]]/route.ts`.** The template's role isolation, portal key, and API proxy are unchanged.
- **`integration-packages/customer-pwa/`, `integration-packages/owner-pwa/`, `integration-packages/growth-partner-pwa/`, `integration-packages/phase5-canonical-auth-service.patch`, `integration-packages/phase6-unified-app-auth.patch`.** Unrelated to the template migration.
- **`supabase/`, `db/`, `drizzle/`, `middleware.ts`, `vercel.json`, `app/nexora-app.tsx` (logic), `app/NexoraRoot.tsx`, `app/layout.tsx`, `app/page.tsx`.** All unrelated.
- **The FINAl repo's vendored `files/docs/phase-*.md` and `files/AGENTS.md`** intentionally retain their historical session names (e.g., `arena/019ffa2e-new-tamplete-app`). These are vendored source content and are not refactored.

## What the previous integration's patches did (and why they no longer apply)

The previous integration was built around four patches:

| Patch | Previous purpose | Why retired |
|---|---|---|
| `auth-integration.patch` | Vendored `@nexora/auth` 1.2.0 under `src/vendor/nexora-auth/`; wired the path alias; mounted `<AuthProvider>` in `main.tsx`; switched LoginModal to the canonical `useAuth().signIn` / `signUp` API. | The FINAL repo is self-contained — it does not vendor `@nexora/auth` and has its own `useAuth()` / `supabaseClient` / `AuthModalProvider` (and a different `App.tsx` architecture with router-based routing and `<AuthCallbackPage>` / `<PasswordResetPage>` / `<PublicSalonView>` / `<NotFound>`). The patch is meaningless against the FINAL source. |
| `phase6-unified-auth.patch` | Appended a `requireOwnerWorkspaceAccess()` bridge to `src/lib/ownerSalon.ts`. | The FINAL repo has no `ownerSalon.ts` and no concept of a Nexora Owner Workspace gate. The repo creates its own Supabase client and uses raw `supabase.from('organization_members')` / `supabase.rpc('owner_salon_ids')` queries. There is no canonical Phase 6 access gate to bridge to. |
| `back-to-main-website.patch` | Added a `<BackToMainWebsiteButton />` to the global `TopBar`. | The FINAL repo's `App.tsx` has a different `TopBar` architecture (router-based, no fixed "top" surface). The patch hunk targets an import block and a `<div className="flex items-center gap-2 md:gap-4 shrink-0">` line that no longer exists. The patch is meaningless against the FINAL source. |
| `files/src/lib/{supabaseClient,useAuth}.ts` | Backwards-compatible adapters that routed the upstream's existing API surface through the canonical `@nexora/auth` factory. | The FINAL repo's own `supabaseClient.ts` and `useAuth.ts` are simpler, do not depend on `@nexora/auth`, and are already a clean, self-contained bridge between the Vite env and the Supabase client. Adapters are unnecessary. |

The new `integration-packages/template-app/` directory therefore contains
the **complete, byte-identical source** of the FINAL repo under `files/`,
not a patch set. The Nexora main website integrates with the FINAL repo
by configuring the right Vercel deployment URL — no source patches are
needed because the FINAL source is independently deployable.

## What the FINAL repo expects from the operator

The FINAL repo is a self-contained Vite 6 + React 19 SPA with a small
Express server (`server.ts`) and a Vercel serverless API proxy
(`api/[[...path]].ts`). Deploying it requires:

1. The deployment must be a Vercel project whose production alias is
   `final-new-app-templete.vercel.app` (or any override set in
   `NEXORA_TEMPLATE_PWA_ORIGIN` on the Nexora main website).
2. The deployment must have these env vars set (per `files/.env.example`):
   - `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` (shared project's anon key)
   - `SUPABASE_URL` (same)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never prefixed with `VITE_`)
3. The Supabase project's Authentication → URL Configuration must include
   `https://final-new-app-templete.vercel.app` in the Redirect URLs.
4. The Vercel project's build & install commands are `npm run build` and
   `npm install` respectively (per `files/vercel.json`).

The current `final-new-app-templete.vercel.app` deployment is already
live and confirmed to serve the "Nexora — Salon Website Builder" landing
page (verified with a live `fetch_page` on 2026-08-21).

## Known regressions (operator-accepted)

1. The FINAL repo's `src/lib/supabaseClient.ts` does not have the strict
   service-role-key rejection and wrong-project rejection that the
   vendored `@nexora/auth` had. The FINAL repo's `supabaseClient.ts`
   simply uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env.
   Operators must continue to ensure the deployment env vars point at the
   shared project and use the anon key (not the service-role key).
2. The FINAL repo has no `database.types.ts` and no canonical
   `requireOwnerWorkspace` / `requireOwnerSalon` access gate. Owner
   authorization happens through raw Supabase queries inside the app
   (e.g., `supabase.from('organization_members')`). The same Nexora RLS
   policies that the shared Supabase project enforces still apply — the
   `profiles.platform_role` / `organization_members` / `salons` RLS
   contract is unchanged.
3. The FINAL repo's test suite is smaller (Phase 1A + Vercel plumbing
   only). The contract test in this Nexora repo only asserts the URL
   wiring; it does not run the FINAL repo's own tests.
4. The previous `integration-packages/template-app/auth-integration.patch`
   enforced Nexora's 8-character password minimum, the canonical
   `requireOwnerWorkspace` gate, and the canonical `useAuth` context
   methods. The FINAL repo's own LoginModal uses the 6-character
   minimum and the local `useAuth` hook. This is a known behavioral
   difference; the contract test in the Nexora main repo does not
   assert those behaviors for the external template app.

## Acceptance verification

| Check | Result |
|---|---|
| `config/portalOrigins.ts` contains the new origin | PASS — `template: "https://final-new-app-templete.vercel.app"` |
| `packages/auth/src/redirects.ts` contains the new origin in the allowlist | PASS — `DEFAULT_ALLOWED_AUTH_ORIGINS` includes `https://final-new-app-templete.vercel.app` |
| `tests/auth-config-contract.test.mjs` `TEMPLATE_APP_ORIGIN` matches the new origin | PASS (verified by running the test) |
| `tests/path-routing-contract.test.mjs` "single hardcoded origin" matches | PASS (verified by running the test) |
| `tests/portal-origin-config.test.ts` `DEFAULT_TEMPLATE_ORIGIN` matches | PASS (verified by running the test) |
| Live origin returns the Template App | PASS — `fetch_page("https://final-new-app-templete.vercel.app/")` returns the "Nexora — Salon Website Builder" landing page |
| `/app/template` route still resolves | PASS — `next.config.ts:57–58` and `app/lib/portalRoutes.ts:19` are unchanged; the 307 redirect now goes to the new origin |
| Other Nexora functionality unchanged | PASS — `git diff main` shows changes only in: `config/portalOrigins.ts`, `packages/auth/src/redirects.ts`, `tests/auth-config-contract.test.mjs`, `tests/portal-origin-config.test.ts`, `tests/path-routing-contract.test.mjs`, `next.config.ts` (comment), `app/nexora-app.tsx` (comment), and `integration-packages/template-app/` (full replace). |
| No `.env` files committed | PASS — no `.env` files in the change set |
| No secrets committed | PASS — the only literal URL change is the public Vercel deployment URL |
| No duplicate Template App integration | PASS — `integration-packages/template-app/` is the only Template App integration in the repo |

## Open follow-ups

1. The FINAL repo's `auth-integration.patch` enforcement of 8-character
   password, canonical `useAuth` context, and `requireOwnerWorkspace`
   gate is no longer in effect. The Nexora main website's contract tests
   only assert URL wiring; they do not exercise the external Template
   App's auth behaviour. If/when the FINAL repo matures to expose the
   same canonical contract, a future refresh can restore those checks.
2. The `integration-packages/template-app/files/` vendored copy is now
   large (entire FINAL repo). It will get out of date as the FINAL repo
   evolves. A future maintainer task is to decide whether to keep this
   directory as a pinned audit artifact, or to remove it and rely
   solely on the live Vercel deployment + the source repo on GitHub.
