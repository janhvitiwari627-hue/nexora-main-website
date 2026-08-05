import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainApp = await readFile(
  new URL("../app/nexora-app.tsx", import.meta.url),
  "utf8",
);

const supabaseClient = await readFile(
  new URL("../app/lib/supabaseClient.ts", import.meta.url),
  "utf8",
);

const nextConfig = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);

const phase8Migration = await readFile(
  new URL("../supabase/migrations/20260807_phase8_security_and_isolation.sql", import.meta.url),
  "utf8",
);

const ownerPatch = await readFile(
  new URL("../integration-packages/owner-pwa/supabase-integration.patch", import.meta.url),
  "utf8",
);

const gpPatch = await readFile(
  new URL("../integration-packages/growth-partner-pwa/supabase-integration.patch", import.meta.url),
  "utf8",
);

const customerPatch = await readFile(
  new URL("../integration-packages/customer-pwa/supabase-integration.patch", import.meta.url),
  "utf8",
);

// ============================================================================
// 1. SERVICE-ROLE KEY NEVER APPEARS IN FRONTEND / REPO / CLIENT-VISIBLE ENV
// ============================================================================

test("No service_role key or live secrets in main app source", () => {
  assert.doesNotMatch(mainApp, /service_role_key/i);
  assert.doesNotMatch(mainApp, /sk_live/i);
  assert.doesNotMatch(mainApp, /rzp_live/i);
  assert.doesNotMatch(mainApp, /eyJhbGciOiJIUzI1Ni/);
});

test("No service_role key or live secrets in supabaseClient", () => {
  assert.doesNotMatch(supabaseClient, /service_role_key/i);
  assert.doesNotMatch(supabaseClient, /sk_live/i);
  assert.doesNotMatch(supabaseClient, /rzp_live/i);
  assert.doesNotMatch(supabaseClient, /eyJhbGciOiJIUzI1Ni/);
});

test("No hardcoded credentials in next.config.ts", () => {
  assert.doesNotMatch(nextConfig, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(nextConfig, /service_role_key/i);
  assert.doesNotMatch(nextConfig, /sk_live/i);
  assert.doesNotMatch(nextConfig, /rzp_live/i);
});

test("Integration patch added lines contain no hardcoded keys", () => {
  const addedLines = (src) =>
    src.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));

  for (const [name, src] of [
    ["owner", ownerPatch],
    ["growth-partner", gpPatch],
    ["customer", customerPatch],
  ]) {
    const added = addedLines(src).join("\n");
    assert.doesNotMatch(added, /eyJhbGciOiJIUzI1Ni/, `${name} patch added lines`);
    assert.doesNotMatch(added, /service_role_key/, `${name} patch added lines`);
    assert.doesNotMatch(added, /sk_live/, `${name} patch added lines`);
    assert.doesNotMatch(added, /rzp_live/, `${name} patch added lines`);
  }
});

// ============================================================================
// 2. ANON/PUBLISHABLE KEY ONLY VIA ENV INJECTION — NO HARDCODED FALLBACK
// ============================================================================

test("Main app anon key comes from process.env only", () => {
  assert.match(mainApp, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(mainApp, /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*[=:]\s*['"`][^'"`]*eyJ/);
});

test("supabaseClient anon key comes from process.env only", () => {
  assert.match(supabaseClient, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(supabaseClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*[=:]\s*['"`][^'"`]*eyJ/);
});

// ============================================================================
// 3. RLS MANDATORY ON EVERY USER / BUSINESS / FINANCIAL TABLE
// ============================================================================

test("Phase 8 migration enables RLS on all known tables", () => {
  const tables = [
    "profiles", "salons", "services", "staff", "bookings", "offers",
    "salon_hours", "salon_public_websites", "customer_settings",
    "saved_payment_methods", "customer_feedback", "support_tickets",
    "reviews", "customer_reviews", "rewards", "wallet_transactions",
    "platform_revenue_rules", "business_rule_events", "growth_partner_commissions",
    "owner_payout_runs", "owner_payouts", "owner_payout_items",
    "growth_partners", "organization_members", "salon_setup_proposals",
    "salon_setup_proposal_versions", "shop_attributions",
    "shop_onboarding_applications", "notifications",
    "audit_events", "payment_webhook_events",
  ];
  for (const t of tables) {
    assert.match(
      phase8Migration,
      new RegExp(`safe_enable_rls\\('${t}'\\)`),
      `RLS must be enabled for ${t}`,
    );
  }
});

test("Phase 8 migration revokes direct access on financial tables", () => {
  assert.match(phase8Migration, /revoke all on table public\.growth_partner_commissions from anon, authenticated/);
  assert.match(phase8Migration, /revoke all on table public\.owner_payout_runs from anon, authenticated/);
  assert.match(phase8Migration, /revoke all on table public\.owner_payouts from anon, authenticated/);
  assert.match(phase8Migration, /revoke all on table public\.owner_payout_items from anon, authenticated/);
  assert.match(phase8Migration, /revoke all on table public\.wallet_transactions from anon, authenticated/);
  assert.match(phase8Migration, /revoke all on table public\.rewards from anon, authenticated/);
});

// ============================================================================
// 4. FRONTEND ROUTE GUARDS ARE UX ONLY
// ============================================================================

test("Main app portal gateway does not claim to enforce security", () => {
  assert.doesNotMatch(mainApp, /security.*guard/i);
  assert.doesNotMatch(mainApp, /enforce.*role/i);
});

test("Main app auth flow relies on server profile check", () => {
  assert.match(mainApp, /profileError\s*\|\|\s*!profile/);
  assert.match(mainApp, /platform_role/);
  assert.match(mainApp, /is_active/);
});

// ============================================================================
// 5. CUSTOMER / OWNER / PARTNER / PUBLIC ISOLATION
// ============================================================================

test("Phase 8 migration adds partner-only RLS policies", () => {
  assert.match(phase8Migration, /growth_partners_self_read/);
  assert.match(phase8Migration, /attributions_partner_read/);
  assert.match(phase8Migration, /onboarding_partner_read/);
  assert.match(phase8Migration, /proposals_partner_read/);
});

test("Phase 8 migration adds owner-only RLS policies", () => {
  assert.match(phase8Migration, /organization_members_self_read/);
  assert.match(phase8Migration, /proposals_owner_read/);
  assert.match(phase8Migration, /attributions_owner_read/);
});

test("Phase 8 migration adds customer-only RLS policies", () => {
  assert.match(phase8Migration, /notifications_self_all/);
});

// ============================================================================
// 6. SENSITIVE MUTATIONS GO THROUGH RPC WITH AUTH.UID() + ROLE + OWNERSHIP
// ============================================================================

test("Secure booking status RPC verifies auth.uid(), role, and ownership", () => {
  assert.match(phase8Migration, /function public\.update_booking_status_secure/);
  assert.match(phase8Migration, /caller uuid := auth\.uid\(\)/);
  assert.match(phase8Migration, /select platform_role into caller_role/);
  assert.match(phase8Migration, /private\.can_manage_salon_settings\(booking_record\.salon_id\)/);
  assert.match(phase8Migration, /booking_record\.customer_id = caller/);
  assert.match(phase8Migration, /security definer/);
});

test("Secure salon profile RPC verifies business_user role and ownership", () => {
  assert.match(phase8Migration, /function public\.update_salon_profile_secure/);
  assert.match(phase8Migration, /caller_role is distinct from 'business_user'/);
  assert.match(phase8Migration, /private\.can_manage_salon_settings\(p_salon_id\)/);
  assert.match(phase8Migration, /security definer/);
});

test("require_role helper exists for Edge Function guards", () => {
  assert.match(phase8Migration, /function public\.require_role\(p_role text\)/);
  assert.match(phase8Migration, /actual_role is distinct from p_role/);
});

// ============================================================================
// 7. PAYMENT WEBHOOK VERIFIES SIGNATURE, IS IDEMPOTENT, RECORDS IMMUTABLE EVENT
// ============================================================================

test("Payment webhook events table is immutable and idempotent", () => {
  assert.match(phase8Migration, /create table if not exists public\.payment_webhook_events/);
  assert.match(phase8Migration, /idempotency_key\s+text not null unique/);
  assert.match(phase8Migration, /trg_payment_webhook_immutable/);
  assert.match(phase8Migration, /audit_events are immutable/);
});

test("Webhook ingestion RPC checks idempotency before insert", () => {
  assert.match(phase8Migration, /function public\.ingest_payment_webhook/);
  assert.match(phase8Migration, /select \* into existing[\s\S]*?where idempotency_key = p_idempotency_key/);
  assert.match(phase8Migration, /if found then[\s\S]*?return existing\.id;/);
});

test("Webhook processing RPC records immutable event before updating projections", () => {
  assert.match(phase8Migration, /function public\.process_payment_webhook/);
  assert.match(phase8Migration, /if event_record\.processed then[\s\S]*?return true;/);
  assert.match(phase8Migration, /if not event_record\.signature_verified then[\s\S]*?raise exception/);
  assert.match(phase8Migration, /update public\.payment_webhook_events[\s\S]*?set processed = true/);
  assert.match(phase8Migration, /perform private\.log_audit/);
});

// ============================================================================
// 8. STORAGE BUCKET POLICY CONTRACT DOCUMENTED
// ============================================================================

test("Storage bucket policies are documented in the migration", () => {
  assert.match(phase8Migration, /salon-media/);
  assert.match(phase8Migration, /identity-documents/);
  assert.match(phase8Migration, /MIME type restriction/);
  assert.match(phase8Migration, /Size limit/);
  assert.match(phase8Migration, /no public access/);
  assert.match(phase8Migration, /service_role only/);
});

// ============================================================================
// 9. AUDIT EVENTS RECORD ACTOR, ACTION, ENTITY, OLD/NEW STATUS, TIMESTAMP, IDEMPOTENCY
// ============================================================================

test("Audit events table has all required columns", () => {
  assert.match(phase8Migration, /actor_id\s+uuid/);
  assert.match(phase8Migration, /actor_role\s+text/);
  assert.match(phase8Migration, /action\s+text not null/);
  assert.match(phase8Migration, /entity_type\s+text not null/);
  assert.match(phase8Migration, /entity_id\s+text/);
  assert.match(phase8Migration, /old_status\s+text/);
  assert.match(phase8Migration, /new_status\s+text/);
  assert.match(phase8Migration, /idempotency_key\s+text/);
  assert.match(phase8Migration, /created_at\s+timestamptz not null default now\(\)/);
});

test("Audit events are protected by immutable trigger", () => {
  assert.match(phase8Migration, /trg_audit_events_immutable/);
  assert.match(phase8Migration, /audit_events are immutable/);
});

test("log_audit helper is security definer and restricted", () => {
  assert.match(phase8Migration, /function private\.log_audit/);
  assert.match(phase8Migration, /security definer/);
  assert.match(phase8Migration, /revoke all on function private\.log_audit/);
  assert.match(phase8Migration, /grant execute on function private\.log_audit.*to service_role/);
});

// ============================================================================
// 10. VERIFY SECURITY ISOLATION FUNCTION
// ============================================================================

test("verify_security_isolation() function exists and is callable", () => {
  assert.match(phase8Migration, /function public\.verify_security_isolation\(\)/);
  assert.match(phase8Migration, /RLS enabled on all tables/);
  assert.match(phase8Migration, /Audit events table exists/);
  assert.match(phase8Migration, /Payment webhook events table exists/);
  assert.match(phase8Migration, /Secure RPCs installed/);
});
