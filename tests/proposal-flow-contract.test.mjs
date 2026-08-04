import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260729_complete_salon_proposal_publish.sql", import.meta.url), "utf8");
const ownerResolutionMigration = await readFile(new URL("../supabase/migrations/20260729_fix_proposal_owner_resolution.sql", import.meta.url), "utf8");

test("Main Website does not own Growth Partner proposal writes", () => {
  assert.doesNotMatch(app, /shop_onboarding_applications/);
  assert.doesNotMatch(app, /save_growth_partner_salon_setup/);
  assert.doesNotMatch(app, /GrowthPartnerProposalForm/);
  assert.match(app, /path=\{PORTAL_PATHS\.growth_partner\}/);
});

test("Main Website does not own Owner proposal review writes", () => {
  assert.doesNotMatch(app, /bootstrap_shop_owner/);
  assert.doesNotMatch(app, /review_salon_setup/);
  assert.doesNotMatch(app, /RoleWorkspace/);
  assert.match(app, /path=\{PORTAL_PATHS\.business_user\}/);
});

test("publish contract remains server-owned in Supabase migrations", () => {
  assert.match(migration, /private\.can_manage_salon_settings/);
  assert.match(migration, /private\.publish_salon_setup/);
  assert.match(migration, /insert into public\.shop_attributions/);
  assert.match(migration, /growth_partner_id <> proposal\.growth_partner_id/);
  assert.match(migration, /set verified = true,[\s\S]*?accepts_online_bookings = true/);
  assert.match(ownerResolutionMigration, /p\.platform_role = 'business_user'/);
  assert.match(ownerResolutionMigration, /p\.is_active/);
});

test("public catalog remains read-only and published-only", () => {
  assert.match(app, /\.from\("salon_public_websites"\)[\s\S]*?\.eq\("is_published", true\)/);
  assert.match(app, /\.from\("salons"\)[\s\S]*?\.eq\("verified", true\)[\s\S]*?\.eq\("is_active", true\)/);
  assert.match(app, /deleted_at.*null/);
  assert.doesNotMatch(app, /\.from\("salons"\)\.insert/);
});

test("frontend contains no privileged Supabase credential", () => {
  assert.doesNotMatch(app, /service_role|SUPABASE_SERVICE/i);
});
