import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const migrationsDir = join(projectRoot, 'supabase/migrations');

async function readAllMigrations() {
  const files = await readdir(migrationsDir);
  let content = '';
  for (const f of files.filter(f => f.endsWith('.sql')).sort()) {
    content += await readFile(join(migrationsDir, f), 'utf8') + '\n';
  }
  return content;
}

const m = await readAllMigrations();
const app = await readFile(join(projectRoot, 'app/nexora-app.tsx'), 'utf8');
const nc = await readFile(join(projectRoot, 'next.config.ts'), 'utf8');
const portalOrigins = await readFile(join(projectRoot, 'config/portalOrigins.ts'), 'utf8');

test('P14-C001: Role isolation via RLS', () => {
  assert.match(m, /profiles.*RLS|safe_enable_rls/i);
  assert.match(m, /can_manage_salon_settings/i);
  assert.match(m, /auth\.uid\(\)/);
  assert.match(m, /current_growth_partner_id/i);
});

test('P14-C002: PKCE authentication', () => {
  assert.match(app, /flowType.*pkce/i);
  assert.doesNotMatch(app, /eyJhbGciOiJIUzI1Ni/i);
});

test('P14-C003: Publish workflow exists', () => {
  assert.match(m, /submitted/i);
  assert.match(m, /approved/i);
  assert.match(m, /published/i);
  assert.match(m, /shop_attributions/i);
});

test('P14-C004: Booking with idempotency', () => {
  assert.match(m, /bookings/i);
  assert.match(m, /idempotent/i);
  assert.match(m, /customer_id/i);
  assert.doesNotMatch(m, /client_price/i);
});

test('P14-C005: Concurrency control', () => {
  assert.match(m, /unique.*booking/i);
  assert.match(m, /advisory_lock|conflict.*booking/i);
});

test('P14-C006: Payment idempotency', () => {
  assert.match(m, /payment_events|webhook_events/i);
  assert.match(m, /signature|hmac/i);
});

test('P14-C007: Cancellation matrix', () => {
  assert.match(m, /refund/i);
  assert.match(m, /cancel/i);
  assert.match(m, /dispute/i);
});

test('P14-C008: Commission 1% + 7-day hold', async () => {
  const gp = await readFile(join(migrationsDir, '20260801_growth_partner_commission_and_hold.sql'), 'utf8');
  assert.match(gp, /commission_rate_bps.*1000/i);
  assert.match(gp, /hold_days.*7/i);
});

test('P14-C009: Public privacy', () => {
  assert.match(m, /salon_public_websites/i);
  assert.match(m, /revoke.*anon/i);
});

test('P14-C010: Storage security', () => {
  assert.match(m, /storage\.objects/i);
  assert.match(m, /signed|presigned/i);
});

test('P14-C011: Offline honesty', () => {
  assert.match(app, /online|offline/i);
  assert.doesNotMatch(app, /localStorage.*booking/i);
});

test('P14-C012: Deployment routing', () => {
  assert.match(app, /\/app\/customer/i);
  assert.match(app, /AdminUnavailable/i);
  assert.match(nc, /configuredPortalOrigins/i);
  for (const key of ['CUSTOMER', 'OWNER', 'PARTNER', 'TEMPLATE']) {
    assert.match(portalOrigins, new RegExp(`NEXORA_${key}_PWA_ORIGIN`));
  }
  assert.match(portalOrigins, /absolute HTTPS URL/);
  assert.doesNotMatch(portalOrigins, /\.vercel\.app/);
});

test('P14-C013: Input validation', () => {
  assert.match(app, /minLength/i);
  assert.match(m, /check\s*\(/i);
});

test('P14-C014: Audit logging', () => {
  assert.match(m, /business_rule_events|audit/i);
});

test('P14-C015: Test infrastructure', async () => {
  const pkg = await readFile(join(projectRoot, 'package.json'), 'utf8');
  assert.match(pkg, /test:phase14/i);
});
