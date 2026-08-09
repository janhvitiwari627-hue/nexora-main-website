import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const rootPackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const portalPackage = JSON.parse(await readFile(new URL('../job-portal/package.json', import.meta.url), 'utf8'));
const nextConfig = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');
const portalVite = await readFile(new URL('../job-portal/vite.config.ts', import.meta.url), 'utf8');
const portalBackend = await readFile(new URL('../job-portal/src/services/backend.ts', import.meta.url), 'utf8');
const portalRouting = await readFile(new URL('../job-portal/src/routing.ts', import.meta.url), 'utf8');
const mainApp = await readFile(new URL('../app/nexora-app.tsx', import.meta.url), 'utf8');
const mainCss = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const migrations = await readdir(new URL('../job-portal/supabase/migrations/', import.meta.url));

const requiredJobTables = [
  'job_user_roles','job_seeker_profiles','job_employer_profiles','job_posts','job_applications',
  'job_offers','job_notifications','job_conversations','job_messages','job_reports','job_audit_log',
];

test('Job Portal remains an isolated Vite workspace built into the Nexora public mount', () => {
  assert.deepEqual(rootPackage.workspaces, ['job-portal']);
  assert.equal(portalPackage.name, '@nexora/job-portal');
  assert.match(rootPackage.scripts['build:job-portal'], /build-job-portal\.sh/);
  assert.match(portalPackage.scripts['build:integrated'], /\/job-portal\//);
});

test('base path, assets, auth redirects and PWA are scoped to /job-portal', () => {
  assert.match(portalVite, /VITE_APP_BASE_PATH/);
  assert.match(portalVite, /base:\s*appBase/);
  assert.match(portalVite, /scope:\s*appBase/);
  assert.match(portalVite, /navigateFallback:\s*asset\('index\.html'\)/);
  assert.match(portalBackend, /import\.meta\.env\.BASE_URL/);
  assert.doesNotMatch(portalBackend, /resendSignupVerification|\?verified=1/);
  assert.match(portalBackend, /appCallbackUrl\('\?recovery=1'\)/);
});

test('direct Job Portal routes map to the SPA without taking root Nexora routes', () => {
  for (const route of ['dashboard/seeker','dashboard/employer','jobs','login','signup','profile','applications','interviews','offers','messages','employer','admin']) {
    assert.match(portalRouting, new RegExp(`/${route.replace('-', '\\-')}`));
  }
  assert.match(nextConfig, /JOB_PORTAL_BASE\s*=\s*"\/job-portal"/);
  assert.match(nextConfig, /destination:\s*`\$\{JOB_PORTAL_BASE\}\/index\.html`/);
  assert.match(nextConfig, /Service-Worker-Allowed.*JOB_PORTAL_BASE/s);
  assert.match(nextConfig, /source: "\/dashboard\/seeker".*destination: "\/job-portal\/dashboard\/seeker"/s);
  assert.match(nextConfig, /source: "\/dashboard\/employer".*destination: "\/job-portal\/dashboard\/employer"/s);
  assert.doesNotMatch(nextConfig, /job-portal-nexora\.vercel\.app/);
});

test('main desktop and mobile navigation expose the same-origin Job Portal', () => {
  assert.match(mainApp, />Job Portal<\/button>/);
  assert.match(mainApp, /window\.location\.assign\("\/job-portal"\)/);
  assert.match(mainApp, /mobile-menu-toggle/);
  assert.match(mainApp, /mobileMenuOpen/);
  assert.match(mainCss, /\.mobile-menu-toggle/);
  assert.match(mainCss, /nav\.mobile-open/);
});

test('existing jobs database migrations and security model remain vendored unchanged', async () => {
  assert.ok(migrations.length >= 9);
  const sql = (await Promise.all(migrations.map((name) => readFile(new URL(`../job-portal/supabase/migrations/${name}`, import.meta.url), 'utf8')))).join('\n');
  for (const table of requiredJobTables) assert.match(sql, new RegExp(table));
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /supabase_realtime/);
  assert.match(sql, /job-resumes/);
  assert.match(sql, /employer-verification/);
});

test('no privileged Supabase or GitHub credential is committed in integrated sources', async () => {
  const files = [portalBackend, portalVite, mainApp, nextConfig];
  const joined = files.join('\n');
  assert.doesNotMatch(joined, /service_role\s*[=:]\s*["'][A-Za-z0-9._-]+/i);
  assert.doesNotMatch(joined, /ghp_[A-Za-z0-9]{20,}/);
  assert.doesNotMatch(joined, /sbp_[A-Za-z0-9]{20,}/);
});
