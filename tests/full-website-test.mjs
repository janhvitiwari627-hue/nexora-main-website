import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const supabaseClient = await readFile(new URL("../app/lib/supabaseClient.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260803_profiles_auto_create_fix.sql", import.meta.url), "utf8");

test("Main Website is locked to the shared Supabase project and Next env names", () => {
  assert.match(app, /SUPABASE_PROJECT_REF/);
  assert.match(nextConfig, /qwaehqsmodekbgvnaavz/);
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(app, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});

test("account creation and permanent profile trigger support all non-admin roles", async () => {
  const session = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");
  assert.match(app, /customer/);
  assert.match(app, /business_user/);
  assert.match(app, /growth_partner/);
  assert.match(app, /normalizeSignupRole/);
  assert.match(session, /signup_role/);
  assert.match(migration, /handle_new_user/);
  assert.match(migration, /on_auth_user_created/);
  assert.match(migration, /signup_role/);
});

test("Main Website is a portal gateway, not a copied PWA", () => {
  assert.match(app, /AdminUnavailable/);
  assert.match(app, /no public admin signup/);
  assert.match(app, /PortalGateway/);
  // No client-side iframe and no NEXT_PUBLIC mounted flag holds routing authority.
  assert.doesNotMatch(app, /MountedPortalFrame/);
  assert.doesNotMatch(app, /isPortalMounted/);
  assert.doesNotMatch(app, /NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED/);
  assert.doesNotMatch(app, /RoleWorkspace|GrowthPartnerProposalForm|OwnerBusinessSetup/);
  assert.doesNotMatch(app, /create_customer_booking|razorpay-create-order|review_salon_setup|save_growth_partner_salon_setup/);
});

test("public salon pages hand off booking to the Customer PWA", () => {
  assert.match(app, /customerPortalBookingPath/);
  assert.match(app, /Continue in Customer app/);
  assert.match(app, /LegacyBookingHandoff/);
});

test("published marketplace filters remain server-backed", () => {
  assert.match(app, /is_published.*true/);
  assert.match(app, /verified.*true/);
  assert.match(app, /is_active.*true/);
  assert.match(app, /deleted_at.*null/);
});

test("all portal deployments are reverse-proxied via beforeFiles rewrites", () => {
  // External role PWAs are mounted as beforeFiles rewrites to the same-origin
  // /api/portal proxy (foreign-origin edge rewrites returned HTTP 500).
  assert.match(nextConfig, /beforeFiles:/);
  assert.match(nextConfig, /"customer", "owner", "partner"/);
  assert.match(nextConfig, /api\/portal/);
  assert.match(nextConfig, /:path\*/);
  assert.doesNotMatch(nextConfig, /destination: `https?:\/\//);
});

test("offline and configuration failures are visible", () => {
  assert.match(app, /offline-banner/);
  assert.match(app, /Supabase not configured/);
  assert.match(app, /Portal unavailable|portal is not mounted/);
});
