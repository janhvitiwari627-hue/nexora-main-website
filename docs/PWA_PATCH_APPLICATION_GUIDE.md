# Nexora v3 — apply the three PWA patches

Run these commands from a maintainer machine with write access to the three PWA
repositories. The Arena session itself is restricted to the Main Website
repository and will not push to the PWA remotes.

## Shared prerequisites

- Apply the pending Supabase migrations from this repository first.
- Use the same Supabase URL and anon/publishable key in all apps.
- Never use a service-role key in a Vite/browser environment.
- Use `git checkout main` and `git pull --ff-only origin main` before applying.
- `git am` creates the patch commit automatically; do not create a duplicate
  commit unless you intentionally modify the patch afterward.

## 1. Customer PWA

```bash
git clone https://github.com/freewebsite859-sudo/custmer-Fresh-app-.git
cd custmer-Fresh-app-
git checkout main
git pull --ff-only origin main
git am /path/to/nexora-main-website/integration-packages/customer-pwa/supabase-integration.patch

cat > .env <<'EOF'
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<same anon key>
VITE_APP_BASE_PATH=/app/customer/
# VITE_CANONICAL_ORIGIN=https://<apex-domain>
EOF

npm install
npx tsc --noEmit
npm run build
git status --short
git push origin main
```

## 2. Shop Owner PWA

```bash
git clone https://github.com/promptaivideo4-coder/PINK-NEXORA-AAP-.git
cd PINK-NEXORA-AAP-
git checkout main
git pull --ff-only origin main
git am /path/to/nexora-main-website/integration-packages/owner-pwa/supabase-integration.patch

cat > .env <<'EOF'
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<same anon key>
VITE_APP_BASE_PATH=/app/owner/
# VITE_CANONICAL_ORIGIN=https://<apex-domain>
EOF

npm install
npx tsc --noEmit
npm run build
git status --short
git push origin main
```

## 3. Growth Partner PWA

```bash
git clone https://github.com/diamondpeomotion-cyber/pink-growth-partner-aap-.git
cd pink-growth-partner-aap-
git checkout main
git pull --ff-only origin main
git am /path/to/nexora-main-website/integration-packages/growth-partner-pwa/supabase-integration.patch

cat > .env <<'EOF'
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<same anon key>
VITE_APP_BASE_PATH=/app/partner/
# VITE_CANONICAL_ORIGIN=https://<apex-domain>
EOF

npm install
npx tsc --noEmit
npm run build
git status --short
git push origin main
```

## Post-push checks

- Configure Main Website server-only origins:
  `NEXORA_CUSTOMER_PWA_ORIGIN`, `NEXORA_OWNER_PWA_ORIGIN`,
  `NEXORA_PARTNER_PWA_ORIGIN`.
- Confirm each PWA manifest resolves under its `/app/*/` path.
- Confirm each worker registration scope is limited to its own portal.
- Run the live role-routing, negative-RLS, proposal, booking, and commission
  smoke tests before production release.

If `npm install` creates an untracked `package-lock.json` in a repository that
did not previously track one, review it before pushing; do not commit it merely
as an install side effect.
