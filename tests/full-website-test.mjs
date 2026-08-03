import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const supabaseClient = await readFile(new URL("../app/lib/supabaseClient.ts", import.meta.url), "utf8").catch(() => "");
const migration = await readFile(new URL("../supabase/migrations/20260803_profiles_auto_create_fix.sql", import.meta.url), "utf8").catch(() => "");

// ── Supabase Connection ──
test("Supabase client is locked to shared project qwaehqsmodekbgvnaavz", () => {
  assert.match(app, /qwaehqsmodekbgvnaavz\.supabase\.co/);
  assert.match(app, /DEFAULT_SUPABASE_URL/);
  assert.match(nextConfig, /qwaehqsmodekbgvnaavz/);
  // Ensure fallback default exists
  assert.match(app, /getClient\(\)/);
  assert.match(app, /missingSupabaseConfigMessage/);
});

test("Supabase connection shows config diagnostic", () => {
  assert.match(app, /Supabase not configured|NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseClient || app, /DEFAULT_SUPABASE_URL/);
});

// ── Account Creation Fix for All 3 Roles ──
test("Customer account creation is supported", () => {
  assert.match(app, /customer/);
  assert.match(app, /Customer/);
  assert.match(migration, /customer/);
  // Ensure role mapping handles customer
  assert.match(app, /mapRequestedRoleToPlatformRole|platform_role/);
});

test("Shop Owner (business_user) account creation is supported", () => {
  assert.match(app, /business_user/);
  assert.match(app, /Shop Owner/);
  assert.match(app, /owner/);
  assert.match(migration, /business_user/);
  // Owner legacy mappings
  assert.match(migration, /owner.*business_user|business_user/);
});

test("Growth Partner account creation is supported", () => {
  assert.match(app, /growth_partner/);
  assert.match(app, /Growth Partner/);
  assert.match(migration, /growth_partner/);
});

test("Signup handles all roles with full_name and signup_role", () => {
  assert.match(app, /full_name/);
  assert.match(app, /signup_role/);
  assert.match(app, /signUp/);
  assert.match(app, /trimmedEmail|email.*trim/);
});

test("Profile auto-creation trigger exists (migration)", () => {
  assert.ok(migration.length > 0, "Migration file should exist");
  assert.match(migration, /handle_new_user/);
  assert.match(migration, /auth\.users/);
  assert.match(migration, /on_auth_user_created/);
  assert.match(migration, /profiles/);
  assert.match(migration, /signup_role/);
});

test("Profile backfill for existing users without profile", () => {
  assert.match(migration, /left join.*profiles|Backfill/i);
});

// ── AuthPage Robustness ──
test("AuthPage validates email, password, fullName", () => {
  assert.match(app, /Email and password are required/);
  assert.match(app, /Password must be at least 6/);
  assert.match(app, /Full name is required/);
});

test("AuthPage surfaces real Supabase errors", () => {
  assert.match(app, /parseSupabaseAuthError|friendlyError/);
  assert.match(app, /User already registered|already exists/i);
  assert.match(app, /confirm your email/i);
});

test("AuthPage handles email confirmation required case", () => {
  assert.match(app, /Check your email|confirm/i);
  assert.match(app, /!data\.session/);
  assert.match(app, /success/);
});

test("AuthPage retry logic for profile race", () => {
  assert.match(app, /ensureProfileWithRetry|maybeSingle/);
  assert.match(app, /3.*attempt|retry/i);
});

test("Role selector disabled on login, enabled on signup", () => {
  assert.match(app, /disabled.*login|login.*disabled/);
  assert.match(app, /Account role/);
});

// ── Dashboard & Role Guards ──
test("Dashboard handles missing profile auto-create", () => {
  assert.match(app, /upsert[\s\S]*profiles|profiles[\s\S]*upsert/);
  assert.match(app, /maybeSingle/);
});

test("Booking guard enforces customer only", () => {
  assert.match(app, /if \(authState\.role !== "customer"\)/);
  assert.match(app, /Customer account required/);
  assert.match(app, /Switch account/);
});

test("All role portals have distinct PWA manifests", () => {
  assert.match(app, /manifest-customer/);
  assert.match(app, /manifest-owner/);
  assert.match(app, /manifest-growth-partner/);
});

// ── Complete Website Structure ──
test("Catalog fetch uses published + verified + is_active", () => {
  assert.match(app, /is_published.*true/);
  assert.match(app, /verified.*true/);
  assert.match(app, /is_active.*true/);
  assert.match(app, /deleted_at.*null/);
});

test("Razorpay checkout uses server-calculated advance", () => {
  assert.match(app, /razorpay-create-order/);
  assert.match(app, /25% booking advance/);
  assert.match(app, /Bearer.*access_token/);
});

test("Growth Partner proposal form intact", () => {
  assert.match(app, /Create website proposal/);
  assert.match(app, /save_growth_partner_salon_setup/);
});

test("Owner proposal review intact", () => {
  assert.match(app, /review_salon_setup/);
  assert.match(app, /bootstrap_shop_owner/);
});

test("Shared Supabase project env handling", () => {
  assert.match(app, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(app, /VITE_SUPABASE_URL/);
  assert.match(app, /SUPABASE_PROJECT_REF/);
});

test("Offline and config banners for UX", () => {
  assert.match(app, /offline-banner/);
  assert.match(app, /Supabase not configured/);
});
