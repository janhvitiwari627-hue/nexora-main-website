# Universal Auth & Location Synchronization Status

**Audit date:** 2026-08-23 UTC  
**Canonical controller:** `janhvitiwari627-hue/nexora-main-website`  
**Canonical Supabase project:** `qwaehqsmodekbgvnaavz`

## Scope and evidence

This checkout is the Main Website repository only. The six named repositories were cloned as read-only audit copies at their current `main` heads and GitHub's API reported `permissions.push: false` for the authenticated Arena identity on every one. They were **not modified**, no branch was created in them, and no PR can truthfully be claimed for them.

The historical `subapp-sync-artifacts/patches/` files are retained as historical artifacts; they are not evidence that the current upstream heads contain those changes and must be revalidated against each current head before use. In particular, deployment credentials must be configured in hosting, never committed as `.env` files or copied from an artifact.

## Canonical implementation available in this repository

| Concern | Source of truth | Verified property |
| --- | --- | --- |
| Browser client | `packages/auth/src/client.ts` + `env.ts` | expected HTTPS project, PKCE, persisted session, token refresh, URL detection, `nexora.auth.qwaehqsmodekbgvnaavz` storage key |
| Auth lifecycle | `packages/auth/src/AuthProvider.tsx` | one listener, initial session restore, profile resolution, token refresh, cleanup/unsubscribe |
| Profile authority | `packages/auth/src/session.ts`, migrations | profile selected by the authenticated ID; database role remains authoritative |
| Private GPS | `packages/location/src/*` | one `watchPosition` coordinator; validated real GPS only; RPC derives identity from `auth.uid()` |
| Location RLS | `supabase/migrations/20260812_phase7_shared_location_security.sql` | own-row SELECT/INSERT/UPDATE/DELETE policies and `save_my_private_location` |
| Main mount | `app/NexoraRoot.tsx`, `app/nexora-app.tsx` | exactly one `AuthProvider`; location sync receives only `session.user.id` |

## Current upstream audit findings

| App | Current head | Auth/client finding | Location finding | Status |
| --- | --- | --- | --- | --- |
| Main Website | this checkout | canonical shared provider/client present | canonical private-location coordinator present | READY (subject to configured hosting env and live DB verification) |
| Owner | `47fb48e` | local client exists; canonical provider not verified on upstream | legacy/parallel location modules found | **BLOCKED — write access absent** |
| Growth Partner | `e00f0ed` | client uses `flowType: 'implicit'`, not canonical PKCE | separate location service found | **BLOCKED — write access absent** |
| Customer | `cdfec89` | local client/auth screens found; parity not verified | multiple GPS/location hooks found | **BLOCKED — write access absent** |
| Template | `c3752c4` | client already shows PKCE options; provider parity still needs review | location modules found | **BLOCKED — write access absent** |
| Job Portal | `12aae27` | client has persistence options; complete shared-provider migration not verified | no canonical private-sync hook found | **BLOCKED — write access absent** |
| Beauty Shop | `4ed4d59` | client has partial persistence options; PKCE/storage-key parity not verified | no canonical private-sync hook found | **BLOCKED — write access absent** |

## Required handoff for each blocked repository

1. Grant the Arena GitHub identity Contents and Pull Requests **write** access.
2. Create the repository branch from its current `main` (this Arena session itself remains on `arena/01a02f3b-nexora-main-website`).
3. Port the canonical auth package or an equivalent adapter; do not add a second listener/provider.
4. Configure only public browser variables in hosting:

   ```env
   VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
   VITE_SUPABASE_ANON_KEY=<PROJECT_ANON_OR_PUBLISHABLE_KEY>
   ```

   Do not commit `.env`, do not expose `SUPABASE_SERVICE_ROLE_KEY`, and do not put tokens in redirects.
5. Use the fixed storage key and PKCE options. Bind GPS only after authenticated session establishment and save via `save_my_private_location`, without accepting a target user ID.
6. Execute each repository's install, typecheck, lint, build, mount smoke test, and authenticated Supabase/RLS test matrix before opening its PR.

## Verification limits

The checks in this checkout validate migration source and application contracts; they do **not** prove the remote Supabase project's live schema/policies or hosted environment variables. Live RLS verification requires an authorized database connection or Supabase CLI access, which was not supplied.
