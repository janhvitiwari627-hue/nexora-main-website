import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const migration = await readFile(
  new URL("../supabase/migrations/20260729_complete_salon_proposal_publish.sql", import.meta.url),
  "utf8",
);

test("Growth Partner proposal form persists through the existing RLS-backed contract", () => {
  for (const field of [
    "Salon / business name",
    "Shop Owner email",
    "Phone / contact",
    "City",
    "Area / locality",
    "Full address",
    "Salon description",
    "Opening time",
    "Closing time",
    "Website theme",
    "Logo URL",
    "Cover photo URL",
    "Services",
  ]) {
    assert.match(app, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(app, /\.from\("shop_onboarding_applications"\)[\s\S]*?\.insert\(/);
  assert.match(app, /client\.rpc\("save_growth_partner_salon_setup"/);
  assert.match(app, /p_submit:\s*true/);
  assert.doesNotMatch(app, /localStorage/);
});

test("Owner review uses existing role-checked RPC and exposes supported transitions", () => {
  assert.match(app, /client\.rpc\("bootstrap_shop_owner"/);
  assert.match(app, /client\.rpc\("review_salon_setup"/);
  for (const action of ["approve", "publish", "request_changes", "reject"]) {
    assert.match(app, new RegExp(`"${action}"`));
  }
});

test("publish keeps attribution and enables only the owner-published storefront", () => {
  assert.match(migration, /private\.can_manage_salon_settings/);
  assert.match(migration, /private\.publish_salon_setup/);
  assert.match(migration, /insert into public\.shop_attributions/);
  assert.match(migration, /growth_partner_id <> proposal\.growth_partner_id/);
  assert.match(migration, /set verified = true,[\s\S]*?accepts_online_bookings = true/);
  assert.match(app, /\.from\("salon_public_websites"\)[\s\S]*?\.eq\("is_published", true\)/);
  assert.match(app, /\.from\("salons"\)[\s\S]*?\.eq\("verified", true\)[\s\S]*?\.eq\("is_active", true\)/);
});

test("frontend contains no privileged Supabase credential", () => {
  assert.doesNotMatch(app, /service_role|SUPABASE_SERVICE/i);
});
