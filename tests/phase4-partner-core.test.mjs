import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const gpIdentity = await readFile(new URL('../supabase/migrations/20260806_growth_partner_identity.sql', import.meta.url), 'utf8');
const gpCommissions = await readFile(new URL('../supabase/migrations/20260801_growth_partner_commission_and_hold.sql', import.meta.url), 'utf8');
const proposalPublish = await readFile(new URL('../supabase/migrations/20260729_complete_salon_proposal_publish.sql', import.meta.url), 'utf8');
const proposalOwner = await readFile(new URL('../supabase/migrations/20260729_fix_proposal_owner_resolution.sql', import.meta.url), 'utf8');
const phase8Security = await readFile(new URL('../supabase/migrations/20260807_phase8_security_and_isolation.sql', import.meta.url), 'utf8');
const rbacVerification = await readFile(new URL('../supabase/migrations/20260812_phase3_rbac_verification.sql', import.meta.url), 'utf8');

test('Phase 4.1: Growth Partner identity bootstrap is server-authoritative', () => {
  assert.match(gpIdentity, /create or replace function public\.ensure_growth_partner_identity/);
  assert.match(gpIdentity, /profile_role is distinct from 'growth_partner'/);
  assert.match(gpIdentity, /generated_code := 'NXGP-'/);
  assert.match(gpIdentity, /generated_referral := 'REF-'/);
  assert.match(gpIdentity, /insert into public\.growth_partners/);
  assert.match(gpIdentity, /grant execute on function public\.ensure_growth_partner_identity\(\) to authenticated/);
});

test('Phase 4.2: Partner shop attributions and proposals are isolated via RLS', () => {
  assert.match(phase8Security, /create policy attributions_partner_read/);
  assert.match(phase8Security, /growth_partner_id = private\.current_growth_partner_id\(\)/);
  assert.match(phase8Security, /create policy proposals_partner_read/);
  assert.match(phase8Security, /create policy onboarding_partner_read/);
  assert.match(rbacVerification, /public\.is_proposal_attributed/);
});

test('Phase 4.3: Shop proposal approval and publish flow enforce owner resolution', () => {
  assert.match(proposalOwner, /private\.resolve_setup_owner/);
  assert.match(proposalOwner, /p\.platform_role = 'business_user'/);
  assert.match(proposalPublish, /public\.review_salon_setup/);
  assert.match(proposalPublish, /private\.publish_salon_setup/);
  assert.match(proposalPublish, /insert into public\.shop_attributions/);
  assert.match(proposalPublish, /set verified = true/);
  assert.match(proposalPublish, /status = 'published'/);
});

test('Phase 4.4: 10% platform fee commission split and 7-day maturation hold are locked', () => {
  assert.match(gpCommissions, /commission_rate_bps integer not null default 1000 check \(commission_rate_bps = 1000\)/);
  assert.match(gpCommissions, /hold_days integer not null default 7 check \(hold_days = 7\)/);
  assert.match(gpCommissions, /make_interval\(days => rules\.growth_partner_hold_days\)/);
  assert.match(gpCommissions, /create or replace function public\.release_growth_partner_commissions/);
  assert.match(gpCommissions, /status = 'held'/);
});

test('Phase 4.5: Commission ledger mutations are revoked from client direct writes', () => {
  assert.match(gpCommissions, /create policy growth_partner_commissions_owner_read/);
  assert.match(gpCommissions, /growth_partner_id = private\.current_growth_partner_id\(\)/);
});
