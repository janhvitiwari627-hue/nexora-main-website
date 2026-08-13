// Section 10.8 — Production auth/security contract tests (Sections 10.1–10.7).
// Static-contract tests: run without network or Supabase credentials.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../packages/auth/src/service.ts", import.meta.url), "utf8");
const session = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");
const clientSrc = await readFile(new URL("../packages/auth/src/client.ts", import.meta.url), "utf8");
const gates = await readFile(new URL("../supabase/migrations/20260808_production_gates_and_blockers.sql", import.meta.url), "utf8");
const phase8 = await readFile(new URL("../supabase/migrations/20260807_phase8_security_and_isolation.sql", import.meta.url), "utf8");
const reviewRpcGrants = await readFile(new URL("../supabase/migrations/20260813_review_salon_setup_grants.sql", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// 10.1 — Real Supabase auth flows and dedicated routes
// ---------------------------------------------------------------------------

test("10.1 dedicated auth routes are wired in the app router", () => {
  assert.match(app, /path === "\/auth\/callback"/);
  assert.match(app, /path === "\/forgot-password"/);
  assert.match(app, /path === "\/reset-password"/);
  assert.match(app, /path === "\/auth\/expired"/);
});

test("10.1 every auth flow uses real Supabase APIs (PKCE), never mocks", () => {
  assert.match(session, /exchangeCodeForSession\(code\)/);
  assert.match(session, /resetPasswordForEmail\(/);
  assert.match(session, /updateUser\(\{ password \}\)/);
  assert.match(session, /auth\.signUp\(\{/);
  assert.match(session, /auth\.signOut\(\)/);
  assert.match(clientSrc, /flowType: "pkce"/);
  assert.match(app, /handleAuthCallback|sendPasswordReset|updatePassword|signIn\(|signUp\(/);
  assert.doesNotMatch(app, /\.auth\./);
  // No mock/fake auth anywhere in the main website.
  assert.doesNotMatch(app, /localStorage\.setItem\(\s*["']isAuthenticated/i);
  assert.doesNotMatch(app, /fakeSession|mockSession|mockAuth|demoUser/i);
});

test("10.1 signup supports verification resend through the canonical service", () => {
  assert.match(app, /needsEmailConfirmation/);
  assert.match(app, /resendVerification/);
  assert.match(service, /auth\.resend\(\{\s*type:\s*"signup"/);
  assert.match(service, /buildCallbackUrl\(\)/);
});

test("10.1 callback never trusts URL roles; profile decides the portal", () => {
  assert.match(app, /handleAuthCallback/);
  assert.match(app, /destinationForVerifiedRole\(profile\.role/);
  // Role authority remains profiles.platform_role, server-verified.
  assert.match(service, /profiles\.platform_role/);
  assert.match(service, /URL parameters and localStorage never select or grant a role/);
});

// ---------------------------------------------------------------------------
// 10.2 — Google OAuth fail-safe
// ---------------------------------------------------------------------------

test("10.2 Google OAuth button is opt-in and fails safe", () => {
  assert.match(app, /process\.env\.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"/);
  assert.match(app, /googleOauthConfigured && !googleOauthFailed/);
  assert.match(app, /signInWithGoogle\(/);
  assert.match(session, /signInWithOAuth/);
  assert.match(session, /buildCallbackUrl\(/);
  assert.match(nextConfig, /NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED/);
});

// ---------------------------------------------------------------------------
// 10.4 — Owner role & salon membership gate (fail-closed, server-backed)
// ---------------------------------------------------------------------------

test("10.4 owner gate resolves salon ownership from auth.uid() only", () => {
  assert.match(gates, /create or replace function private\.can_manage_salon_settings\(p_salon_id uuid\)/);
  assert.match(gates, /om\.user_id = caller/);
  assert.match(gates, /create or replace function public\.owner_salon_ids\(\)/);
});

test("10.4 owner RLS policies gate every salon-scoped table server-side", () => {
  assert.match(gates, /owner_gate_select/);
  assert.match(gates, /owner_gate_insert/);
  assert.match(gates, /owner_gate_update/);
  assert.match(gates, /private\.can_manage_salon_settings\(salon_id\)/);
  // Client-supplied membership mutations are revoked.
  assert.match(gates, /revoke insert, update, delete on table public\.organization_members from anon, authenticated/);
});

// ---------------------------------------------------------------------------
// 10.5 — Partner auth & data isolation
// ---------------------------------------------------------------------------

test("10.5 partner data is isolated to auth.uid() via RLS, no client flags", () => {
  assert.match(gates, /create or replace function private\.current_growth_partner_id\(\)/);
  assert.match(gates, /partner_gate_select/);
  assert.match(gates, /growth_partner_id = private\.current_growth_partner_id\(\)/);
  assert.match(gates, /user_id = auth\.uid\(\)/);
  // No client-side partner auth flags in the main website.
  assert.doesNotMatch(app, /localStorage\.setItem\([^)]*partner[^)]*auth/i);
  assert.doesNotMatch(app, /isPartnerAuthenticated|partnerAuthFlag/i);
});

// ---------------------------------------------------------------------------
// 10.7 — Production blockers
// ---------------------------------------------------------------------------

test("proposal-review RPC has no PUBLIC or anonymous execute grant", () => {
  assert.match(reviewRpcGrants, /revoke all on function public\.review_salon_setup\(uuid, text, text\) from public, anon;/);
  assert.match(reviewRpcGrants, /grant execute on function public\.review_salon_setup\(uuid, text, text\) to authenticated;/);
  assert.doesNotMatch(reviewRpcGrants, /grant execute[\s\S]*?to[\s\S]*?\b(anon|public)\b/i);
});

test("10.7 no privileged keys or secrets in app code", () => {
  assert.doesNotMatch(app, /SUPABASE_SERVICE_ROLE_KEY|service_role_key|sk_live|rzp_live|RAZORPAY_KEY_SECRET/i);
  assert.doesNotMatch(nextConfig, /SERVICE_ROLE/i);
  assert.doesNotMatch(app, /eyJ[A-Za-z0-9_-]{20,}/);
});

test("10.7 RLS is enabled on all private tables", () => {
  assert.match(gates, /enable row level security/);
  assert.match(gates, /'profiles','salons','services','staff','bookings'/);
  // FORCE is intentionally not used: postgres-owned security-definer RPCs
  // (service_role entry points) must keep their server-side checks working.
  assert.match(gates, /We do not[\s\S]*?use FORCE/);
});

test("10.7 storage buckets are private and signed-URL only", () => {
  assert.match(gates, /insert into storage\.buckets \(id, name, public\)\s*values \('salon-media', 'salon-media', false\)/);
  assert.match(gates, /values \('identity-documents', 'identity-documents', false\)/);
  assert.match(gates, /on conflict \(id\) do update set public = false/);
  assert.match(gates, /salon_media_owner_read on storage\.objects/);
  // identity-documents must have no anon/authenticated policies.
  assert.doesNotMatch(gates, /identity-documents['"][\s\S]{0,200}for (select|insert)[\s\S]{0,120}to authenticated/);
});

test("10.7 currency is integer minor units (paise) end-to-end", () => {
  assert.match(app, /money\(paise/);
  assert.match(app, /\(paise \?\? 0\) \/ 100/);
  assert.match(gates, /minor_units/);
  assert.doesNotMatch(app, /amount_rupees|price_inr_float/i);
});

test("10.7 audit logging covers high-risk transitions and stays immutable", () => {
  assert.match(gates, /private\.tg_audit_status_change\(\)/);
  assert.match(gates, /trg_audit_bookings_status/);
  assert.match(gates, /trg_audit_salons_active/);
  assert.match(phase8, /audit_events are immutable/);
});

// ---------------------------------------------------------------------------
// 10.6 — canonical path routing stays single-origin
// ---------------------------------------------------------------------------

test("10.6 portal paths remain same-origin path-based", async () => {
  const portalRoutes = await readFile(new URL("../app/lib/portalRoutes.ts", import.meta.url), "utf8");
  assert.match(portalRoutes, /customer: "\/app\/customer"/);
  assert.match(portalRoutes, /business_user: "\/app\/owner"/);
  assert.match(portalRoutes, /growth_partner: "\/app\/partner"/);
});

// ---------------------------------------------------------------------------
// Migration hygiene: every SQL migration in this release is idempotent-ish
// ---------------------------------------------------------------------------

test("20260808 migration applies its schema guard idempotently", () => {
  assert.match(gates, /create schema if not exists private/);
  assert.match(gates, /drop function if exists private\.can_manage_salon_settings\(uuid\)/);
  assert.match(gates, /to_regclass/);
});

test("migration inventory stays ordered and present", async () => {
  const files = (await readdir(new URL("../supabase/migrations/", import.meta.url))).filter((f) => f.endsWith(".sql")).sort();
  assert.ok(files.includes("20260808_production_gates_and_blockers.sql"));
  assert.ok(files.includes("20260807_phase8_security_and_isolation.sql"));
});

// ---------------------------------------------------------------------------
// Release Blocker #3 — the live inventory export must be strictly read-only
// ---------------------------------------------------------------------------

test("live inventory export script is SELECT-only (no DDL/DML/grants)", async () => {
  const raw = await readFile(new URL("../supabase/READONLY_INVENTORY_EXPORT.sql", import.meta.url), "utf8");
  const code = raw
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
  assert.match(code, /select/i);
  assert.doesNotMatch(code, /\b(insert into|update|delete from|drop |alter table|create table|create or replace|grant |revoke |truncate)\b/i);
  // Verification RPCs are documented but commented out (operator choice).
  assert.match(raw, /-- select \* from public\.verify_security_isolation\(\);/);
});
