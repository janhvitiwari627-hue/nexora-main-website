import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const patch = await readFile(new URL("../integration-packages/owner-pwa/supabase-integration.patch", import.meta.url), "utf8");
const readme = await readFile(new URL("../integration-packages/owner-pwa/README.md", import.meta.url), "utf8");
const addedSource = patch
  .split("\n")
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .join("\n");

test("Owner Phase 2 patch is based on the locked owner repository contract", () => {
  assert.match(readme, /47fb48e7767e/);
  assert.match(patch, /src\/lib\/ownerRepository\.ts/);
  assert.match(patch, /src\/screens\/ProposalReview\.tsx/);
  assert.match(patch, /VITE_APP_BASE_PATH/);
});

test("Owner PWA has a permanent platform-role gate", () => {
  assert.match(addedSource, /resolveOwnerPlatformProfile/);
  assert.match(addedSource, /platform_role !== 'business_user'/);
  assert.match(addedSource, /is_active !== true/);
  assert.match(addedSource, /role-conflict/);
  assert.match(addedSource, /organization_members/);
  assert.match(addedSource, /return \[\]/);
});

test("Owner auth has no hardcoded anon JWT or fake data fallback", () => {
  assert.doesNotMatch(addedSource, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(addedSource, /DEFAULT_SUPABASE_ANON_KEY/);
  assert.match(addedSource, /MISSING_ANON_KEY_SENTINEL/);
  assert.match(addedSource, /Supabase authentication is not configured/);
  assert.match(addedSource, /VITE_SUPABASE_ANON_KEY/);
});

test("Owner production screens use honest server/empty-state boundaries", () => {
  for (const screen of [
    "Customers.tsx",
    "CustomerProfile.tsx",
    "RevenueAnalytics.tsx",
    "Marketing.tsx",
    "WebsiteDashboard.tsx",
    "WebsiteGallery.tsx",
    "NewAppointment.tsx",
  ]) {
    assert.match(patch, new RegExp(`src/screens/${screen.replace('.', '\\.')}`));
  }
  assert.match(addedSource, /No demo data is shown|No demo data|not connected|not a client-side fake/);
  assert.match(readme, /hardcoded anon fallback\/proxy token handling is removed/);
  assert.match(readme, /VITE_APP_BASE_PATH=\/app\/owner\//);
});
