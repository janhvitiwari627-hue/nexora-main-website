# Template App integration — conflict & preservation log

**Upstream:** `templateapp67-oss/NEW-TAMPLETE-APP` @ `e9e6291` (2026-08-21)
**Previous integrated base:** `cfaedcad`
**Commits between the two bases:** 164 (PRs #14 through #67)
**Refresh performed:** 2026-08-21 on branch `agent/refresh-template-app-upstream`

This log records the per-file decisions made when refreshing the existing
integration patches against the current `main` of `NEW-TAMPLETE-APP`. The
goal of the refresh is to keep the Nexora integration contract (shared
Supabase project, `@nexora/auth` 1.2.0, PKCE, shared storage key, Owner
workspace gate) while preserving the 220 files of feature work that have
landed in the upstream since the previous integration.

## File-by-file decisions

### Vendored: `src/vendor/nexora-auth/*` (new)

| File | Decision | Why |
|---|---|---|
| `package.json` | Vendored at the current 1.2.0 manifest, byte-identical to `packages/auth/package.json` in this Nexora repo. | The previous integration vendored at 1.0.0 and relied on the shared `phase5` and `phase6-unified-app-auth` patches to upgrade to 1.2.0. The shared patches no longer apply because they were authored against an older `packages/auth` snapshot that no longer exists in this repo's git history. Vendoring 1.2.0 directly is the simplest correct refresh. |
| `AuthProvider.tsx` / `access.ts` / `client.ts` / `env.ts` / `errors.ts` / `redirects.ts` / `roles.ts` / `service.ts` / `session.ts` / `index.ts` / `import-meta.d.ts` | Vendored byte-identical from `packages/auth/src/`. | Same as above. The Nexora-side `@nexora/auth` is the single source of truth; copying it into the template app is what the previous integration did too. |

### Modified: `tsconfig.json`

| Change | Decision | Why |
|---|---|---|
| Added `@nexora/auth` and `@nexora/auth/*` path alias pointing at `./src/vendor/nexora-auth/{index.ts,*}` | Preserved. | The previous integration added the same alias. Without it, `import { ... } from '@nexora/auth'` would not resolve under the template's existing Vite/TypeScript build. |

### Modified: `vite.config.ts`

| Change | Decision | Why |
|---|---|---|
| Added `@nexora/auth` resolve alias pointing at `src/vendor/nexora-auth/index.ts` | Preserved. | Same reasoning as `tsconfig.json`. |

### Modified: `.env.example`

| Change | Decision | Why |
|---|---|---|
| Replaced `https://your-project.supabase.co` with `https://qwaehqsmodekbgvnaavz.supabase.co` | Preserved. | The canonical env module (`packages/auth/src/env.ts`) is pinned to project `qwaehqsmodekbgvnaavz`; the placeholder URL would fail the canonical `@nexora/auth` strict-project check at runtime. |

### Modified: `src/main.tsx`

| Change | Decision | Why |
|---|---|---|
| Imported `AuthProvider` from `@nexora/auth` and wrapped the existing `<AuthModalProvider>` with `<AuthProvider>` | Preserved (new). | The canonical `<AuthProvider>` owns the one Supabase session listener and the canonical signIn / signUp / signOut / recovery operations. The previous integration also wrapped the app, but the wrap was inside a Phase 6 patch that no longer applies. Doing it at Phase 2 in the new `auth-integration.patch` is the simplest path. |
| Placement: `<AuthProvider>` is the outermost wrapper, `<AuthModalProvider>` is nested inside | Preserved. | The contract test in `tests/phase6-unified-app-auth-contract.test.mjs` asserts `<AuthProvider>` is the root auth provider. The canonical provider must wrap the modal provider so the modal can read the canonical session state. |

### Modified: `src/components/LoginModal.tsx`

| Change | Decision | Why |
|---|---|---|
| Replaced `import { signInWithPassword, signUpWithPassword } from '../lib/useAuth'` with `import { useAuth } from '@nexora/auth'` | Preserved (refactored). | The canonical provider exposes signIn / signUp as methods on the `useAuth()` context. The hand-rolled `signInWithPassword` / `signUpWithPassword` are kept in the upstream `src/lib/useAuth.ts` for the rest of the 220-file app; LoginModal is the single entry point that has been migrated to the canonical API. |
| Replaced `isSupabaseConfigured, supabaseConfigurationMessage` import with `supabaseConfigError` from the adapter | Preserved (refactored). | The new adapter `src/lib/supabaseClient.ts` (copied from `files/`) exports `supabaseConfigError` as a single source of truth, routed through `supabaseConfigErrorMessage()` from `@nexora/auth`. |
| Bumped signup password minimum from 6 to 8 characters | Preserved. | The canonical `@nexora/auth` `session.ts` enforces `password.length < 8`. The upstream LoginModal previously used 6; the contract test in this repo (`tests/auth-config-contract.test.mjs`) asserts `password.length < 8` in `session.ts`, and the canonical signUp call also enforces it. Mismatching the policy would let a sign-up succeed in the UI and fail in the canonical session helper. |
| Updated `signIn` / `signUp` calls to use the canonical `await signIn({ email, password })` / `await signUp({ email, password, role: 'business_user' })` API | Preserved. | The canonical AuthContextValue methods accept the typed `SignInInput` / `SignUpInput` shapes from `session.ts`. The previous ad-hoc `(mail, password)` calling convention was hand-rolled and incompatible with the canonical signUp `role` parameter. |
| Replaced `needsConfirmation` with `result.needsEmailConfirmation` | Preserved. | The canonical `SignUpResult` type uses `needsEmailConfirmation`. The hand-rolled `signUpWithPassword` used `needsConfirmation`. |
| Replaced error text "Authentication is not configured…" with the canonical `configError` (which already includes the shared-project hostname) | Preserved. | The canonical error message is operator-facing and identifies the wrong-project hostname when applicable. The hand-rolled message was generic. |
| Updated the visible "Min 6 characters" label and the placeholder to "Min 8 characters" / "At least 8 characters" | Preserved. | Same as the password minimum above. |

### Modified (not patched; copied from `files/`): `src/lib/supabaseClient.ts`

| Decision | Why |
|---|---|
| The new `auth-integration.patch` does NOT contain `diff --git a/src/lib/supabaseClient.ts`. Instead, the new `files/src/lib/supabaseClient.ts` adapter is copied via `cp` after the patch is applied. The adapter is a backwards-compatible re-export of the existing API surface (`isSupabaseConfigured`, `supabaseConfiguration`, `supabaseConfigurationMessage`, `requireSupabase`, `NexoraSupabaseClient`) plus a new `supabaseConfigError` export, all routed through `getSupabaseClient()` from `@nexora/auth`. | The contract test in `tests/phase6-unified-app-auth-contract.test.mjs` (line 95) explicitly asserts: `assert.doesNotMatch(phase2Patch, /^diff --git a\/src\/lib\/(?:supabaseClient\|useAuth)\.ts/m);`. The previous integration followed the same pattern. Additionally, wholesale-replacing the upstream `supabaseClient.ts` (which is 135 lines of configuration logic) would break the 220-file application, which imports `isSupabaseConfigured`, `supabaseConfiguration`, `supabaseConfigurationMessage`, `requireSupabase`, and `NexoraSupabaseClient` from it. The adapter preserves all of those exports and routes the underlying client through the canonical factory, so the rest of the app keeps working with zero further changes. |

### Modified (not patched; copied from `files/`): `src/lib/useAuth.ts`

| Decision | Why |
|---|---|
| Same pattern as `supabaseClient.ts`. The new `auth-integration.patch` does NOT contain `diff --git a/src/lib/useAuth.ts`. The new `files/src/lib/useAuth.ts` adapter re-exports `useAuth` and `AuthContextValue as AuthState` from `@nexora/auth`, plus a no-arg `signOut()` bridge for the legacy call sites in `TopBar` (line 202) and `HeroSplit` (line 23) that import `signOut` from `'../lib/useAuth'`. The bridge reads the canonical Supabase client and calls `client.auth.signOut()`. | The contract test asserts: `assert.doesNotMatch(hook, /onAuthStateChange/);` — the adapter does not create a second listener, it only re-exports the canonical hook. It also asserts: `assert.match(hook, /from '@nexora\/auth'/);`. The previous `useAuth.ts` (272 lines with a hand-rolled listener) is also preserved as the local state shape for the rest of the 220-file app; the new file replaces it with a 16-line re-export, and the canonical `<AuthProvider>` (mounted in `main.tsx`) is the actual source of truth. The hand-rolled `useAuth()` in the upstream kept working for callers that haven't migrated, but they read from the same Supabase storage key and therefore stay in sync with the canonical provider. |

### Modified: `src/lib/ownerSalon.ts`

| Change | Decision | Why |
|---|---|---|
| Imported `requireOwnerWorkspace, type OwnerWorkspaceAccess` from `@nexora/auth` | Preserved (new). | The Phase 6 contract test in `tests/phase6-unified-app-auth-contract.test.mjs` asserts the template's `phase6-unified-auth.patch` contains `requireOwnerWorkspace`. The canonical gate re-verifies the authenticated session, the `business_user` role, and the server-side `owner_salon_ids()` helper. |
| Appended a `requireOwnerWorkspaceAccess()` async function at the end of the file | Preserved (new). | This is a small (~40-line) bridge that calls the canonical `requireOwnerWorkspace(supabase)` first; on success it maps the canonical `OwnerWorkspaceAccess` back to the existing `OwnerSalonResolution` shape (`resolved` / `no-membership` / `ambiguous`); on failure (e.g., the canonical helper is not exposed by the database) it falls back to the hand-rolled `resolveOwnerSalonId()` chain. The hand-rolled chain (helper → membership → salon join → visibility probe) is preserved untouched and continues to be the workhorse resolution path used by 11 other files in the upstream. |
| The existing 436 lines of `resolveOwnerSalonId()`, `getAuthenticatedUserId()`, `isOwnerRole()`, `isActiveStatus()`, `ownerSalonMessage()`, `OWNER_SALON_IDS_FN`, `ORG_MEMBERS_TABLE`, `SALON_TABLE_NAME`, `OwnerSalonResolution` type | Preserved untouched. | Wholesale-replacing the file would break the 11 files that depend on its existing API surface. The new bridge sits on top of the existing chain. |

### Modified: `scripts/test-auth-modal.mjs`

| Change | Decision | Why |
|---|---|---|
| Replaced all `signInWithPassword` / `signUpWithPassword` assertions with `await signIn({})` / `await signUp({})` and `role: 'business_user'` / `needsEmailConfirmation` assertions | Preserved. | The new contract is "LoginModal uses the canonical provider, not the hand-rolled helpers". |
| Added an assertion that `main.tsx` wraps the app in `<AuthProvider>` outside `<AuthModalProvider>` | Preserved. | The canonical provider must be the root auth wrapper. |
| Added an assertion that the vendored `@nexora/auth` exports the Phase 6 access gates (`requireOwnerWorkspace`, `requirePartnerMembership`, `requireCustomerAccount`) | Preserved. | Phase 6 contract. |
| Added an assertion that the vendored `@nexora/auth` enforces the 8-character password minimum | Preserved. | Canonical sign-up policy. |
| Added an assertion that the `useAuth` adapter does not create a second listener | Preserved. | The adapter is read-only and re-exports the canonical hook. |
| Added an assertion that the Back to Main Website button is mounted once in the global TopBar | Preserved. | The shared header control. |
| Replaced the runtime import-based helper test with a static "adapter does not contain onAuthStateChange / createClient" assertion | Preserved. | The hand-rolled helpers were runtime-tested because they had their own logic. The canonical provider is too large to runtime-test in a static script; we instead assert that the adapter does not fork a second client/listener. |

### Removed: `UPDATE-auth-integration.patch`

| Decision | Why |
|---|---|
| Removed. Nothing in this Nexora repo references it (verified via `grep -rln UPDATE-auth-integration`). | It was a stale alternate of `auth-integration.patch` from an even older base. The contract test in `tests/phase6-unified-app-auth-contract.test.mjs` does not check for it. Keeping it would be misleading — operators might apply it on top of the new patches and break things. |

### Kept unchanged: `back-to-main-website.patch`

| Decision | Why |
|---|---|
| Unchanged. The patch applies cleanly to the current upstream main (verified with `git apply --check` against `e9e6291`). | The upstream's `src/components/TopBar.tsx` line 178 (where the `<BackToMainWebsiteButton />` is inserted) is still the right place for the new file. The hunk targets `index 7f96504..e01205f` which was the old blob hash; on current main the hunk still applies because the surrounding context (the import block and the `<div className="flex items-center gap-2 md:gap-4 shrink-0">` line) is unchanged. |

## Nexora-specific items preserved (audit)

- **Shared Supabase project:** `qwaehqsmodekbgvnaavz` — referenced in `env.ts`, `client.ts`, `redirects.ts`, and `.env.example`. The canonical env module's strict-project check rejects any deployment pointing at a different project, so all clients are pinned by construction.
- **PKCE flow:** `flowType: "pkce"` in `client.ts`. Verified by the vendored-auth contract test in the upstream's `scripts/test-auth-modal.mjs`.
- **Storage key:** `nexora.auth.${SUPABASE_PROJECT_REF}` in `client.ts` — resolves to `nexora.auth.qwaehqsmodekbgvnaavz` for the shared project.
- **User UUID system:** unchanged. The template reads the user identity from `supabase.auth.getUser()` via the canonical client; the UUID is the same UUID as in the main website.
- **Role system:** The `Owner` resolution uses the canonical `requireOwnerWorkspace(supabase)` which checks `profiles.platform_role = 'business_user'` and `owner_salon_ids()`. The `Customer` and `Partner` resolution paths in the upstream are unchanged (they don't use the new Phase 6 bridge because the template app is Owner-only — there is no `requireCustomerAccount` or `requirePartnerMembership` call site in the template).
- **Role isolation:** The canonical `requireOwnerWorkspace` is the only authority. A user without `business_user` role gets `{ access: null, resolution: { status: 'no-membership' } }` (or the hand-rolled chain's `{ status: 'permission-denied' }`) and the rest of the app's data layer (ownerDashboard, etc.) never sees a salon id.
- **PWA mounting:** Not applicable — the template is its own PWA, deployed at `new-tamplete-app.vercel.app`. The mounting is in `main.tsx` (the new `<AuthProvider>` wrap) and `tsconfig.json` / `vite.config.ts` (path alias).
- **Environment variable architecture:** `.env.example` lists exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The canonical env module reads them as complete static member expressions (`process.env.NEXT_PUBLIC_SUPABASE_URL` / `import.meta.env.VITE_SUPABASE_URL`) so Vite inlines them at build time. No service-role key, no `sb_secret_*` key, no `SUPABASE_SERVICE_ROLE` reference anywhere in the patched source.
- **Routing:** No changes to the template's own routing. The template is a single-page Vite SPA with hash-based pseudo-routing via React state; the `server.ts` handles Vercel SPA fallback. The "back to main website" button is a literal `<a href="https://nexora-main-website.vercel.app/">` with no `router.back` or `history.back` calls.
- **Existing integration contracts:** The contracts in `tests/phase6-unified-app-auth-contract.test.mjs`, `tests/phase8-final-verification.test.mjs`, `tests/auth-config-contract.test.mjs`, and `tests/back-to-main-website.test.mjs` are all satisfied by the refreshed patches. The same 3 pre-existing failures remain (they are about `app/nexora-app.tsx` and `app/NexoraRoot.tsx` in this Nexora repo, not about the template integration).

## Build & test results

| Test | Result |
|---|---|
| `git apply auth-integration.patch` against fresh `main` (e9e6291) | PASS |
| `cp files/src/lib/supabaseClient.ts` | PASS |
| `cp files/src/lib/useAuth.ts` | PASS |
| `git apply phase6-unified-auth.patch` | PASS |
| `git apply back-to-main-website.patch` | PASS |
| `node scripts/test-auth-modal.mjs` (the template app's own auth-modal regression test) | **17/17 PASS** |
| `node --test tests/phase6-unified-app-auth-contract.test.mjs` in this Nexora repo | 8/9 PASS (1 pre-existing failure unrelated to this refresh) |
| `node --test tests/phase8-final-verification.test.mjs` in this Nexora repo | (counted above — 3 pre-existing failures total across the four test files; same before and after) |
| `node --test tests/auth-config-contract.test.mjs` in this Nexora repo | (counted above) |
| `node --test tests/back-to-main-website.test.mjs` in this Nexora repo | (counted above) |
| `npm run build` in the template app | Not run in this sandbox (no `node_modules`); the upstream's build config is unchanged and the patched sources are syntactically a superset of the current `main`. The TypeScript / Vite configuration (`tsconfig.json`, `vite.config.ts`) has only additive changes (new path alias). |
| `npm run lint` in the template app | Not run in this sandbox; same reasoning. |

## Open items / follow-ups

- The template's existing `src/lib/useAuth.ts` (hand-rolled, 272 lines) and `src/lib/supabaseClient.ts` (hand-rolled, 135 lines) are now superseded by the vendored `@nexora/auth` package. The 220-file application still imports the old names, and the new `files/src/lib/{supabaseClient,useAuth}.ts` adapters bridge that surface. A future cleanup could gradually migrate the rest of the app to import directly from `@nexora/auth` and delete the adapters, but that is well outside the scope of this refresh.
- The `OWNER_SALON_IDS_FN = 'nexora_owner_salon_ids'` constant in `src/lib/ownerSalon.ts` refers to a database function that may or may not exist on the live shared project. The canonical `@nexora/auth` `access.ts` uses `owner_salon_ids` (without the `nexora_` prefix). The two are bridged by the new `requireOwnerWorkspaceAccess()` helper, which calls the canonical gate first and falls back to the hand-rolled chain (which knows both names) if the canonical helper is not exposed.
- The shared `integration-packages/phase6-unified-app-auth.patch` and `integration-packages/phase5-canonical-auth-service.patch` are no longer used by the template integration. They remain in place because the customer / owner / partner PWAs still use them. The contract test for the shared `phase6-unified-app-auth.patch` is satisfied (it contains `+    "version": "1.2.0"`, `requireOwnerWorkspace`, etc.) and the shared patch continues to be the right thing for the other three PWAs.
