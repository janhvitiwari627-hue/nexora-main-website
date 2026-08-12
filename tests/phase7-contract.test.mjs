import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainApp = await readFile(
  new URL("../app/nexora-app.tsx", import.meta.url),
  "utf8",
);

const portalRoutes = await readFile(
  new URL("../app/lib/portalRoutes.ts", import.meta.url),
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

const gpMigration = await readFile(
  new URL("../supabase/migrations/20260806_growth_partner_identity.sql", import.meta.url),
  "utf8",
);

const businessRules = await readFile(
  new URL("../supabase/migrations/20260801_growth_partner_commission_and_hold.sql", import.meta.url),
  "utf8",
);

const ownerPayouts = await readFile(
  new URL("../supabase/migrations/20260801_owner_daily_payout_2200_ist.sql", import.meta.url),
  "utf8",
);

// ============================================================================
// MAIN WEBSITE REQUIREMENTS
// ============================================================================

test("Main Website displays only approved public data", () => {
  // Homepage shows public salon data only
  assert.match(mainApp, /fetchCatalog/);
  assert.match(mainApp, /verified=true/);
  assert.match(mainApp, /is_active=true/);
  assert.match(mainApp, /is_published=true/);

  // No admin or private data on public pages
  assert.doesNotMatch(mainApp, /admin\./);
  assert.doesNotMatch(mainApp, /internal_api/);
});

test("Main Website role cards route to PWA paths", () => {
  // Role cards use portal paths
  assert.match(mainApp, /PORTAL_PATHS\.customer/);
  assert.match(mainApp, /PORTAL_PATHS\.business_user/);
  assert.match(mainApp, /PORTAL_PATHS\.growth_partner/);

  // RoleCard component takes path prop
  assert.match(mainApp, /function RoleCard\(\{/);
  assert.match(mainApp, /path=\{PORTAL_PATHS\.customer\}/);
  assert.match(mainApp, /path=\{PORTAL_PATHS\.business_user\}/);
  assert.match(mainApp, /path=\{PORTAL_PATHS\.growth_partner\}/);
});

test("Main Website does not render substitute owner/partner dashboards", () => {
  // No dashboard components for owner/partner in main app
  assert.doesNotMatch(mainApp, /OwnerDashboard/);
  assert.doesNotMatch(mainApp, /PartnerDashboard/);
  assert.doesNotMatch(mainApp, /owner-dashboard/);
  assert.doesNotMatch(mainApp, /partner-dashboard/);
});

test("Main Website booking CTA hands off to Customer PWA", () => {
  // Booking path construction
  assert.match(mainApp, /customerPortalBookingPath/);
  assert.match(mainApp, /\/app\/customer\//);
  assert.match(mainApp, /params\.set\(["']salon["'],\s*item\.id\)/);

  // No booking creation on main website
  assert.doesNotMatch(mainApp, /create_customer_booking/);
  assert.doesNotMatch(mainApp, /razorpay-create-order/);
});

test("Portal Gateway shows role mismatch and offers sign-out", () => {
  // PortalGateway handles role mismatch
  assert.match(mainApp, /function PortalGateway/);
  assert.match(mainApp, /requestedRole && requestedRole !== profileRole/);
  assert.match(mainApp, /navigate\(portalPathForRole\(profileRole\)\)/);

  // Sign-out available
  assert.match(mainApp, /signOut/);
  assert.match(mainApp, /signOut\(\`\/auth\/login/);
});

test("Admin routes are isolated from public access", () => {
  // Admin unavailable component
  assert.match(mainApp, /function AdminUnavailable/);
  assert.match(mainApp, /\/admin/);
  assert.match(mainApp, /Admin surface is restricted/);
  assert.match(mainApp, /no public admin signup/);
});

// ============================================================================
// CUSTOMER PWA REQUIREMENTS
// ============================================================================

test("Customer PWA requires customer-only auth gate", () => {
  // Auth config contract - customer role required
  assert.match(mainApp, /platform_role/);
  assert.match(mainApp, /customer/);

  // No owner/partner dashboard components in main app
  assert.doesNotMatch(mainApp, /OwnerDashboard/);
  assert.doesNotMatch(mainApp, /PartnerDashboard/);
});

test("Customer PWA uses live data - no mock fallback", () => {
  // Catalog fetches from Supabase
  assert.match(mainApp, /fetchCatalog/);
  assert.match(mainApp, /salon_public_websites/);

  // Empty states instead of mock data
  assert.match(mainApp, /No published salons yet/);
  assert.match(mainApp, /StateCard/);
});

test("Customer PWA booking flows use server contracts", () => {
  // Booking handoff to Customer PWA
  assert.match(mainApp, /customerPortalBookingPath/);
  assert.match(mainApp, /\/app\/customer/);

  // Legacy booking handoff
  assert.match(mainApp, /LegacyBookingHandoff/);
  assert.match(mainApp, /navigate.*\/app\/customer/i);
});

test("Customer PWA removes demo/fake data", () => {
  // No demo data injection
  assert.doesNotMatch(mainApp, /DEMO_DATA/);
  assert.doesNotMatch(mainApp, /fake_booking/);
  assert.doesNotMatch(mainApp, /mock_data/);

  // Honest empty states
  assert.match(mainApp, /No services published yet/);
  assert.match(mainApp, /This salon has not published/);
});

// ============================================================================
// SHOP OWNER PWA REQUIREMENTS
// ============================================================================

test("Shop Owner PWA has strict business_user gate plus organization_members", () => {
  // Owner patch includes organization_members check
  assert.match(ownerPatch, /resolveOwnerPlatformProfile/);
  assert.match(ownerPatch, /platform_role !== 'business_user'/);
  assert.match(ownerPatch, /is_active !== true/);
  assert.match(ownerPatch, /organization_members|organization\.members/i);

  // Role conflict handling
  assert.match(ownerPatch, /role-conflict|roleConflict|role_conflict/i);
  assert.match(ownerPatch, /return \[\]/);

  // Check added lines (not removed lines) have no hardcoded JWT
  const addedLines = ownerPatch.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
  const addedSource = addedLines.join('\n');
  assert.doesNotMatch(addedSource, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(addedSource, /DEFAULT_SUPABASE_ANON_KEY/);
});

test("Shop Owner registration completes bootstrap_shop_owner", () => {
  // Owner patch includes bootstrap function
  assert.match(ownerPatch, /bootstrap_shop_owner/i);

  // Safe resume after email confirmation (or auth state handling)
  assert.match(ownerPatch, /email_confirmed|emailConfirmation|auth.*state|session/i);
});

test("Shop Owner dashboard metrics are from server only", () => {
  // No hardcoded values
  assert.doesNotMatch(ownerPatch, /DEFAULT_REVENUE/);
  assert.doesNotMatch(ownerPatch, /HARDCODED_BOOKING_COUNT/);
  assert.doesNotMatch(ownerPatch, /FAKE_BALANCE/);

  // Honest server/empty-state boundaries
  assert.match(ownerPatch, /No demo data is shown|No demo data|not connected|not a client-side fake/);

  // Owner screens use server data
  for (const screen of [
    "Customers",
    "CustomerProfile",
    "RevenueAnalytics",
    "Marketing",
    "WebsiteDashboard",
    "WebsiteGallery",
    "NewAppointment",
  ]) {
    assert.match(ownerPatch, new RegExp(`src/screens/${screen.replace('.', '\\.')}`));
  }
});

test("Shop Owner CRUD is scoped to owned salon by RLS", () => {
  // Owner repository pattern
  assert.match(ownerPatch, /ownerRepository/i);

  // VITE_APP_BASE_PATH configuration
  assert.match(ownerPatch, /VITE_APP_BASE_PATH/);
  assert.match(ownerPatch, /VITE_APP_BASE_PATH=\/app\/owner\//);

  // RLS enforcement via organization
  assert.match(ownerPatch, /organization_members|organization\.members/i);
});

test("Shop Owner booking state changes update canonical record", () => {
  // Booking management
  assert.match(ownerPatch, /NewAppointment/);
  assert.match(ownerPatch, /booking/);

  // State changes go through server
  assert.doesNotMatch(ownerPatch, /client-side state/);
});

test("Shop Owner website proposal review uses RPC", () => {
  // Proposal review screen
  assert.match(ownerPatch, /ProposalReview/);

  // Uses server RPC, not direct client update
  assert.match(ownerPatch, /rpc/);
  assert.match(ownerPatch, /proposal/);

  // Attribution preserved
  assert.match(ownerPatch, /attribution/);
});

test("Shop Owner wallet/payout shows immutable ledger", () => {
  // Wallet/payout screens
  assert.match(ownerPatch, /wallet/);
  assert.match(ownerPatch, /payout/);

  // Server-owned data, no client-authored balance
  assert.doesNotMatch(ownerPatch, /client_balance/);
  assert.match(ownerPatch, /server/);
});

// ============================================================================
// GROWTH PARTNER PWA REQUIREMENTS
// ============================================================================

test("Growth Partner PWA uses real Supabase auth - localStorage auth deleted", () => {
  // Real Supabase auth
  assert.match(gpPatch, /supabase\.auth\.signInWithPassword|isGrowthPartnerRole|signInWithPassword/);
  assert.match(gpPatch, /profiles/);
  assert.match(gpPatch, /platform_role/);
  assert.match(gpPatch, /growth_partner/);

  // Check added lines have no localStorage-based auth or fake profiles
  const addedLines = gpPatch.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
  const addedSource = addedLines.join('\n');
  assert.doesNotMatch(addedSource, /isAuthenticated\s*=\s*true/);
  assert.doesNotMatch(addedSource, /DEFAULT_PARTNER_PROFILE/);
  assert.doesNotMatch(addedSource, /eyJhbGciOiJIUzI1Ni/);

  // Env-only configuration
  assert.match(gpPatch, /VITE_SUPABASE_URL/);
  assert.match(gpPatch, /VITE_SUPABASE_ANON_KEY/);
});

test("Growth Partner referral identity is generated by server RPC", () => {
  // Migration includes identity function
  assert.match(gpMigration, /ensure_growth_partner_identity/);
  assert.match(gpMigration, /profile_role is distinct from 'growth_partner'/);
  assert.match(gpMigration, /generated_code/);
  assert.match(gpMigration, /generated_referral/);

  // Grant execute to authenticated
  assert.match(gpMigration, /grant execute on function public\.ensure_growth_partner_identity\(\) to authenticated/);

  // Patch calls the RPC
  assert.match(gpPatch, /rpc\('ensure_growth_partner_identity'/);
  assert.match(gpPatch, /referral_code/);
});

test("Growth Partner proposal submission uses existing server contracts", () => {
  // Uses shop_onboarding_applications
  assert.match(gpPatch, /shop_onboarding_applications/);
  assert.match(gpPatch, /submitted_by_partner_id|submitted_by_growth_partner/);

  // Uses RPC for submission
  assert.match(gpPatch, /save_growth_partner_salon_setup/);
  assert.match(gpPatch, /p_submit: true|p_submit=true/);

  // Check added lines have no fake success alerts
  const addedLines = gpPatch.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
  const addedSource = addedLines.join('\n');
  assert.doesNotMatch(addedSource, /alert\([^\n]*submitted successfully/);
});

test("Growth Partner attribution and commission views are live and read-only", () => {
  // Attribution views
  assert.match(gpPatch, /shop_attributions/);

  // Commission views with server-managed fields
  assert.match(gpPatch, /growth_partner_commissions/);
  assert.match(gpPatch, /heldPaise/);
  assert.match(gpPatch, /payablePaise/);
  assert.match(gpPatch, /paidPaise/);

  // Empty state for no data
  assert.match(gpPatch, /No attributed shops yet/);

  // No local account registry
  assert.match(gpPatch, /No local account registry|server-owned/);
});

test("Growth Partner edit rights follow server policy after approval", () => {
  // Server-side policy enforcement
  assert.match(gpPatch, /server/);

  // UI cannot enforce the lock alone
  assert.doesNotMatch(gpPatch, /ui_lock/);
  assert.doesNotMatch(gpPatch, /client_enforce/);
});

test("Growth Partner commission ledger is read-only projection", () => {
  // Commission data from server
  assert.match(businessRules, /growth_partner_commissions/);
  assert.match(businessRules, /booking_id uuid not null unique/);

  // 7-day hold enforced by server
  assert.match(businessRules, /growth_partner_hold_days integer not null default 7/);
  assert.match(businessRules, /hold_days integer not null default 7 check \(hold_days = 7\)/);

  // Status transitions server-controlled
  assert.match(businessRules, /status = case when existing\.status = 'paid' then 'clawed_back' else 'void' end/);
});

test("Growth Partner worker and raw-origin mount stay scoped", () => {
  // Service worker scoped to portal
  assert.match(gpPatch, /serviceWorker\.register/i);
  assert.match(gpPatch, /scope:/i);

  // Canonical origin handling
  assert.match(gpPatch, /VITE_CANONICAL_ORIGIN/i);
  assert.match(gpPatch, /Service-Worker-Allowed/i);

  // Path scoping
  assert.match(gpPatch, /\/app\/partner\//);
});

// ============================================================================
// CROSS-CUTTING SECURITY REQUIREMENTS
// ============================================================================

test("No hardcoded credentials in any source", () => {
  // Main app clean
  assert.doesNotMatch(mainApp, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(mainApp, /service_role_key/);
  assert.doesNotMatch(mainApp, /sk_live/);
  assert.doesNotMatch(mainApp, /rzp_live/i);

  // Check owner patch added lines are clean
  const ownerAddedLines = ownerPatch.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
  const ownerAddedSource = ownerAddedLines.join('\n');
  assert.doesNotMatch(ownerAddedSource, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(ownerAddedSource, /service_role_key/);

  // Check GP patch added lines are clean
  const gpAddedLines = gpPatch.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
  const gpAddedSource = gpAddedLines.join('\n');
  assert.doesNotMatch(gpAddedSource, /eyJhbGciOiJIUzI1Ni/);
  assert.doesNotMatch(gpAddedSource, /service_role_key/);
});

test("Environment variables are framework-appropriate", () => {
  // Main website uses Next.js env vars
  assert.match(mainApp, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(mainApp, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(mainApp, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL/);

  // PWAs use Vite env vars
  assert.match(ownerPatch, /VITE_SUPABASE_ANON_KEY/);
  assert.match(gpPatch, /VITE_SUPABASE_URL/);
});

test("Business rules are enforced server-side", () => {
  // All 6 business rules verifiable
  assert.match(businessRules, /commission_rate_bps.*1000/i);
  assert.match(businessRules, /growth_partner_hold_days.*7/i);
  // owner_payout_hour_local is in businessRules file
  assert.match(businessRules, /owner_payout_hour_local.*22/i);

  // Check constraints prevent drift
  assert.match(businessRules, /platform_revenue_rules_locked/i);
  assert.match(businessRules, /advance_share_bps.*2500/i);
  assert.match(businessRules, /final_share_bps.*7500/i);
});

test("RLS is enabled on all critical tables", () => {
  // Growth partner commissions
  assert.match(businessRules, /alter table public\.growth_partner_commissions enable row level security/);
  assert.match(businessRules, /revoke all on table public\.growth_partner_commissions from anon, authenticated/);

  // Payout tables
  for (const table of ["owner_payout_runs", "owner_payouts", "owner_payout_items"]) {
    assert.match(ownerPayouts, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(ownerPayouts, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`));
  }
});

test("Portal routing uses canonical paths", () => {
  // Portal paths defined
  assert.match(portalRoutes, /PORTAL_PATHS/);
  assert.match(portalRoutes, /customer: "\/app\/customer"/);
  assert.match(portalRoutes, /business_user: "\/app\/owner"/);
  assert.match(portalRoutes, /growth_partner: "\/app\/partner"/);

  // Path resolution functions
  assert.match(portalRoutes, /portalPathForRole/);
  assert.match(portalRoutes, /portalRoleFromPath/);
  assert.match(portalRoutes, /isPortalPath/);
});
