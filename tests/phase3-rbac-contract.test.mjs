import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20260812_phase3_rbac_verification.sql", import.meta.url),
  "utf8",
);
const sqlTests = await readFile(
  new URL("../supabase/tests/phase3_rbac_tests.sql", import.meta.url),
  "utf8",
);
const docs = await readFile(
  new URL("../supabase/tests/PHASE3_VERIFICATION.md", import.meta.url),
  "utf8",
);

test("Phase 3 RBAC migration installs the four named helpers", () => {
  assert.match(migration, /create or replace function public\.is_salon_owner\(p_salon_id uuid\)/);
  assert.match(migration, /private\.can_manage_salon_settings\(p_salon_id\)/);
  assert.match(migration, /create or replace function public\.is_proposal_attributed\(p_proposal_id uuid\)/);
  assert.match(migration, /private\.current_growth_partner_id\(\)/);
  assert.match(migration, /create or replace function public\.approve_proposal\(/);
  assert.match(migration, /create or replace function public\.publish_salon_website\(/);
  assert.match(migration, /review_salon_setup\(p_proposal_id, 'approve'/);
  assert.match(migration, /review_salon_setup\(p_proposal_id, 'publish'/);
});

test("Phase 3 mutation RPCs are owner-gated and revoked from anon", () => {
  assert.match(migration, /if not public\.is_salon_owner\(salon\)/);
  assert.match(migration, /Shop Owner permission required/);
  assert.match(migration, /revoke all on function public\.approve_proposal\(uuid, text\) from public, anon/);
  assert.match(migration, /revoke all on function public\.publish_salon_website\(uuid, text\) from public, anon/);
});

test("Phase 3 adds Customer / Owner / Partner RLS only when missing", () => {
  assert.match(migration, /customer_own_bookings_select/);
  assert.match(migration, /customer_id = auth\.uid\(\)/);
  assert.match(migration, /customer_own_favorites/);
  assert.match(migration, /owner_proposals_select/);
  assert.match(migration, /partner_proposals_select/);
  assert.match(migration, /create policy/);
});

test("Phase 3 verification docs and SQL tests ship with the migration", () => {
  assert.match(docs, /is_salon_owner/);
  assert.match(docs, /is_proposal_attributed/);
  assert.match(docs, /approve_proposal/);
  assert.match(docs, /publish_salon_website/);
  assert.match(sqlTests, /verify_phase3_rbac/);
  assert.match(sqlTests, /anon_can_approve/);
});

test("Phase 3 migration is in the ordered inventory and is idempotent", async () => {
  const files = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  assert.ok(files.includes("20260812_phase3_rbac_verification.sql"));
  assert.match(migration, /create or replace function/);
  assert.match(migration, /if not exists/);
  const executable = migration
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  assert.doesNotMatch(executable, /drop table/i);
  assert.doesNotMatch(executable, /truncate/i);
});
