# Template App — centralized auth and Phase 6 owner authorization

- **Target repo:** `templateapp67-oss/NEW-TAMPLETE-APP` (branch `main`)
- **Base verified:** `cfaedcad`
- **Phase 2 patch:** `auth-integration.patch`
- **Phase 6 app patch:** `phase6-unified-auth.patch`
- **Main website return patch:** `back-to-main-website.patch`

## Back to Main Website header button

Apply `back-to-main-website.patch` to current Template App `main`. It adds the
shared control once in the global `TopBar` and navigates directly to
`https://nexora-main-website.vercel.app/` without history traversal or any
auth/sign-out call.

```bash
git apply /path/to/integration-packages/template-app/back-to-main-website.patch
```

The Template App mounts one canonical `AuthProvider`, uses the shared client,
and resolves salon-backed Owner access with `requireOwnerWorkspace()`. Public
pages and the initial website-building wizard stay available before an Owner
workspace exists. Protected salon reads and writes fail closed.

## Apply in this exact order

```bash
git clone https://github.com/templateapp67-oss/NEW-TAMPLETE-APP.git
cd NEW-TAMPLETE-APP
git checkout main

git apply /path/to/integration-packages/template-app/auth-integration.patch
cp /path/to/integration-packages/template-app/files/src/lib/supabaseClient.ts src/lib/supabaseClient.ts
cp /path/to/integration-packages/template-app/files/src/lib/useAuth.ts src/lib/useAuth.ts
git apply /path/to/integration-packages/phase5-canonical-auth-service.patch
git apply /path/to/integration-packages/phase6-unified-app-auth.patch
git apply /path/to/integration-packages/template-app/phase6-unified-auth.patch

cp .env.example .env
npm ci
npm run test:auth
npm run lint
npm run build
```

The `supabaseClient.ts` and `useAuth.ts` replacements are deliberately excluded
from `auth-integration.patch`. Copy them; do not attempt to `git apply` new-file
replacement hunks.

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
