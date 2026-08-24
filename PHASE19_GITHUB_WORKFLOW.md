# Phase 19 — GitHub Workflow

## Repository scope

The checkout contains one writable Git repository:

```text
janhvitiwari627-hue/nexora-main-website
```

The Customer, Owner, and Growth Partner repositories are external target repositories. They are not cloned into this checkout; their checked-in integration patches remain part of this root repository and are not separate writable working trees or separate PRs from this session.

## Branch policy

Arena Agent Mode fixes this session to:

```text
arena/01a03415-nexora-main-website
```

The requested `feat/universal-auth-location` branch could not be created because Arena requires all work, commits, pushes, and PRs to remain on the session branch. The equivalent feature work is committed and pushed on the fixed Arena branch without switching or creating another branch.

## Commit and push

Final Phase 19 checkpoint commit:

```text
feat: synchronize Nexora universal auth and location
```

The fixed session branch was pushed to `origin`:

```text
origin/arena/01a03415-nexora-main-website
```

A pull request was opened from that branch to `main`. No merge or auto-merge was performed.

## Files changed in the cumulative feature PR

### Mounting and auth lifecycle

- `app/NexoraRoot.tsx`
- `app/nexora-app.tsx`
- `job-portal/src/main.tsx`
- `job-portal/src/App.tsx`
- `job-portal/src/auth/AuthProvider.tsx`
- `integration-packages/template-app/files/src/main.tsx`
- `integration-packages/template-app/files/src/lib/useAuth.ts`
- `integration-packages/template-app/files/src/components/PasswordResetPage.tsx`
- `integration-packages/template-app/files/src/components/TopBar.tsx`
- `integration-packages/template-app/files/src/screens/HeroSplit.tsx`
- `beauty-industry/src/main.tsx`
- `beauty-industry/src/App.tsx`

### Location and RLS verification

- `integration-packages/template-app/files/src/lib/location.ts`
- `scripts/verify-phase18-rls.sql`

### Verification tests and evidence

- `tests/phase15-mounting-verification.test.mjs`
- `tests/phase16-auth-flow-matrix.test.mjs`
- `tests/phase17-location-flow-matrix.test.mjs`
- `tests/phase18-rls-verification.test.mjs`
- `PHASE15_MOUNTING_VERIFICATION.md`
- `PHASE16_AUTH_FLOW_TEST_MATRIX.md`
- `PHASE17_LOCATION_TEST_MATRIX.md`
- `PHASE18_SUPABASE_RLS_VERIFICATION.md`
- `PHASE19_GITHUB_WORKFLOW.md`
- `package.json`

## Auth changes

- Root-level AuthProvider ownership is explicit for Main Website, Job Portal, and Template App.
- Duplicate Job Portal shell auth listeners were removed.
- Template App auth state was centralized from per-component listeners into one provider.
- Logout clears session/profile state optimistically to prevent stale authenticated UI.
- Auth providers restore persisted sessions, handle token refresh, support signup/login/recovery/reset, and clean up listeners.
- Missing/inactive profile state fails closed.

## Location changes

- Main Website and Job Portal use the shared singleton location service bound to the authenticated user.
- Permission, unavailable, denied, weak, stale, valid, and invalid GPS states are covered by tests.
- Template App rejects `0,0` null-island coordinates and requests fresh readings with `maximumAge: 0`.
- Private location persistence uses `auth.uid()` and the canonical `save_my_private_location` / `clear_my_private_location` RPCs.
- User location compatibility synchronization remains one-way from the canonical private table.

## Environment requirements

### Main Website

- `NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the shared anon/publishable browser key
- `NEXORA_CUSTOMER_PWA_ORIGIN`
- `NEXORA_OWNER_PWA_ORIGIN`
- `NEXORA_PARTNER_PWA_ORIGIN` or the compatible `GROWTH_PARTNER_APP_ORIGIN`
- Optional `NEXORA_TEMPLATE_PWA_ORIGIN`
- Optional `NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS`

### Job Portal and Template App

- `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` using the shared anon/publishable browser key
- `VITE_APP_BASE_PATH` appropriate to the deployment

### Beauty Industry

- No direct Supabase client or location persistence. Login/signup delegates to the canonical Main Website.

No service-role, secret, database-password, or live payment key may be placed in browser environment variables.

## Build results

- Main Website `npm run build` — passed with validated non-secret verification env values.
- Job Portal integrated production build — passed.
- Beauty Industry production build — passed.
- Template App Vite + bundled server build — passed.
- Missing-environment fail-closed check — passed.

The builds emit existing large-chunk warnings; the Main Website also emits the existing `middleware.ts` deprecation warning. Neither is an auth/location failure.

## Security checks

- `profiles`, `user_private_locations`, and `user_locations` have RLS enabled.
- Authenticated policies are present for required reads/writes.
- No private-row policy uses `USING (true)` or `WITH CHECK (true)`.
- Authenticated UPDATE policies contain both `USING (...)` and `WITH CHECK (...)`.
- User A cannot `SELECT` User B's private location under runtime RLS tests.
- Anonymous private-location access is denied.
- Location save identity is derived from `auth.uid()`, not a caller-provided user ID.
- Auth and location listener cleanup is covered by static/runtime tests.
- No duplicate provider/listener paths remain in the checked-in app sources.

## Verification results

- `npm run test:phase15` — 7/7 passed
- `npm run test:phase16` — 13/13 passed
- `npm run test:phase17` — 11/11 passed
- `npm run test:phase18` — 7/7 passed
- `npm run test:contracts` — 164/164 passed
- `npm run test:location` — 20/20 passed
- `npm run test:security` — 57/57 passed
- Root typecheck — passed
- Job Portal typecheck — passed

## Merge policy

The PR is intentionally left open for review. No merge, squash, or auto-merge was requested or performed.
