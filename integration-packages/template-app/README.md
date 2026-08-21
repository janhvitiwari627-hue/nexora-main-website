# Template App — centralized auth and Phase 6 owner authorization

- **Target repo:** `templateapp67-oss/NEW-TAMPLETE-APP` (branch `main`)
- **Upstream HEAD verified:** `e9e629175ed69594ce450b8b4ad4b300adf4f3c8`
- **Previous integrated base:** `cfaedcad`
- **Refresh date:** 2026-08-21
- **Phase 2 patch:** `auth-integration.patch` — refresh against current main; vendors `@nexora/auth` 1.2.0 directly, wires the path alias, mounts `<AuthProvider>`, switches LoginModal to the canonical `useAuth().signIn` / `signUp`, updates the auth-modal regression test.
- **Phase 6 app patch:** `phase6-unified-auth.patch` — small bridge that exposes a `requireOwnerWorkspaceAccess()` helper from `src/lib/ownerSalon.ts` while preserving the existing 436-line hand-rolled resolution chain.
- **Main website return patch:** `back-to-main-website.patch` — unchanged from the previous refresh; still applies cleanly to current upstream main.
- **Replacement files (copied, not patched):** `files/src/lib/supabaseClient.ts` and `files/src/lib/useAuth.ts` — backwards-compatible adapters that route the existing supabaseClient / useAuth API surface through the canonical `@nexora/auth` client. The existing 220-file application keeps its import paths and types.

The Template App mounts one canonical `<AuthProvider>`, uses the shared
client, and exposes a Phase 6 `requireOwnerWorkspaceAccess()` bridge on top
of the existing owner-salon resolution chain. Public pages and the initial
website-building wizard stay available before an Owner workspace exists.
Protected salon reads and writes fail closed.

## What changed since the previous refresh

| Area | Change vs. previous (`cfaedcad` base) |
|---|---|
| `@nexora/auth` vendor | Vendored at the current 1.2.0 baseline directly, replacing the old 1.0.0 → 1.1.0 → 1.2.0 upgrade chain. The previous `phase5-canonical-auth-service.patch` / `phase6-unified-app-auth.patch` no longer apply because the vendored package is now current at apply time. |
| `LoginModal.tsx` | Switched from the hand-rolled `signInWithPassword` / `signUpWithPassword` to the canonical `useAuth().signIn({ email, password })` / `signUp({ email, password, role: 'business_user' })` API. Bumped the signup password minimum from 6 to 8 characters to match the canonical `@nexora/auth` policy. |
| `main.tsx` | Wraps the application in the canonical `<AuthProvider>` exactly once, with `<AuthModalProvider>` nested inside. |
| `tsconfig.json` / `vite.config.ts` | Added the `@nexora/auth` path alias to point at the vendored `src/vendor/nexora-auth/index.ts`. |
| `.env.example` | Updated the placeholder URL to `https://qwaehqsmodekbgvnaavz.supabase.co` (the shared Nexora project). |
| `scripts/test-auth-modal.mjs` | Asserts the new contract: 8-character password minimum, canonical `signIn({})` / `signUp({})` calls, business_user signup role, `needsEmailConfirmation` flag, vendored auth pinning, `useAuth` adapter doesn't create a second listener, Back to Main Website header is mounted. 17/17 pass. |
| `src/lib/supabaseClient.ts` | Replaced (via the `files/` copy, not via patch) with a backwards-compatible adapter that keeps the existing `isSupabaseConfigured`, `supabaseConfigurationMessage`, `requireSupabase`, `supabaseConfiguration`, `NexoraSupabaseClient` exports, plus a new `supabaseConfigError` export wired to the canonical factory. |
| `src/lib/useAuth.ts` | Replaced (via the `files/` copy) with a thin re-export of the canonical `useAuth` and `AuthContextValue as AuthState`, plus a no-arg `signOut()` bridge for the legacy call sites in `TopBar` and `HeroSplit`. |
| `src/lib/ownerSalon.ts` | Appended a small `requireOwnerWorkspaceAccess()` bridge that calls the canonical `requireOwnerWorkspace(supabase)` and falls back to the hand-rolled `resolveOwnerSalonId()` chain when the canonical helper is not exposed. The existing 436-line resolution logic is preserved intact — no other file needed to change. |
| `UPDATE-auth-integration.patch` | Removed. It was a stale alternate of `auth-integration.patch` from an even older base; nothing in the repo references it. |
| Shared `phase6-unified-app-auth.patch` / `phase5-canonical-auth-service.patch` | No longer part of the template integration. The template vendors `@nexora/auth` at 1.2.0 directly. The shared patches remain in place for the customer / owner / partner PWAs (which still vendor at 1.0.0 and upgrade through Phase 5 → Phase 6). |

## Apply in this exact order

```bash
git clone https://github.com/templateapp67-oss/NEW-TAMPLETE-APP.git
cd NEW-TAMPLETE-APP
git checkout main

git apply /path/to/integration-packages/template-app/auth-integration.patch
cp /path/to/integration-packages/template-app/files/src/lib/supabaseClient.ts src/lib/supabaseClient.ts
cp /path/to/integration-packages/template-app/files/src/lib/useAuth.ts src/lib/useAuth.ts
git apply /path/to/integration-packages/template-app/phase6-unified-auth.patch
git apply /path/to/integration-packages/template-app/back-to-main-website.patch

cp .env.example .env
npm ci
npm run test:auth    # scripts/test-auth-modal.mjs — 17/17 PASS
npm run lint
npm run build
```

The `supabaseClient.ts` and `useAuth.ts` replacements are deliberately excluded
from `auth-integration.patch` (the contract test in the Nexora main repo
asserts that the patch must not contain `diff --git a/src/lib/(supabaseClient|useAuth).ts`).
They are copied verbatim from `files/src/lib/`. Do not attempt to `git apply`
new-file replacement hunks.

## Conflict / preservation log

See `CONFLICT_LOG.md` for a detailed account of what was preserved, what was
refactored, and why. Key preservation items:

- The 220-file application keeps its existing `import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'` paths — the adapter provides the same surface, just routed through the canonical client.
- The 436-line `src/lib/ownerSalon.ts` RLS-fallthrough / visibility-probe chain is preserved untouched. The new Phase 6 bridge sits on top of it and falls back to the existing chain when the canonical helper is not exposed.
- Same Supabase project (`qwaehqsmodekbgvnaavz`), same PKCE flow, same `nexora.auth.qwaehqsmodekbgvnaavz` storage key, same user UUID, same role system, same RLS policies.

## Deployment checklist

1. Use `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`.
2. Set `VITE_SUPABASE_ANON_KEY` to the real anon/publishable key from that exact project.
3. Never put a service-role key in this browser app.
4. Keep PKCE and `nexora.auth.qwaehqsmodekbgvnaavz` storage unchanged.
5. Add the deployed origin to Supabase Authentication redirect URLs.
6. Apply the patches from the locked base in the order above.
7. Do not add salon creation: authorization begins only after a server-owned Owner membership exists.

Live same-UUID verification is blocked until the real shared-project key and a
deployed downstream rollout are available. Package application alone is not a
live auth PASS.
