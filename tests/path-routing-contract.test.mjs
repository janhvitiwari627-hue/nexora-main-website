import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const routes = await readFile(new URL("../app/lib/portalRoutes.ts", import.meta.url), "utf8");
const originConfig = await readFile(new URL("../config/portalOrigins.ts", import.meta.url), "utf8");
const roleGuard = await readFile(new URL("../supabase/migrations/20260805_permanent_profile_role_guard.sql", import.meta.url), "utf8");
const ownerPatch = await readFile(new URL("../integration-packages/owner-pwa/supabase-integration.patch", import.meta.url), "utf8");
const customerPatch = await readFile(new URL("../integration-packages/customer-pwa/supabase-integration.patch", import.meta.url), "utf8");
const partnerPatch = await readFile(new URL("../integration-packages/growth-partner-pwa/supabase-integration.patch", import.meta.url), "utf8");
const ownerAddedSource = ownerPatch.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).join("\n");

// v3 routing is deliberately path-based. These contracts protect the one-origin
// decision from being replaced by subdomains or legacy dashboard links.
test("canonical portal paths are path-based and role-specific", () => {
  assert.match(routes, /customer:\s*"\/app\/customer"/);
  assert.match(routes, /business_user:\s*"\/app\/owner"/);
  assert.match(routes, /growth_partner:\s*"\/app\/partner"/);
  assert.match(routes, /portalRoleFromPath/);
  assert.match(routes, /legacyDashboardRoleFromPath/);
  assert.doesNotMatch(routes, /https?:\/\/[^\s"']*\.(customer|owner|partner)\./i);
});

test("main app routes every canonical portal through the gateway", () => {
  assert.match(app, /PortalGateway/);
  assert.match(app, /else if \(isPortalPath\(path\)\)/);
  assert.match(app, /profile\.is_active !== true/);
  assert.match(app, /no role-home redirects/);
  assert.doesNotMatch(app, /requestedRole && requestedRole !== profileRole/);
  assert.doesNotMatch(app, /RoleWorkspace|DashboardPage|PwaInstallPrompt/);
});

test("legacy dashboard URLs canonicalize instead of becoming a second portal", () => {
  assert.match(app, /legacyDashboardRoleFromPath\(path\)/);
  assert.match(app, /if \(!isPortalPath\(currentPath\)\)/);
  assert.match(app, /portalPathForRole\(/);
});

test("role links and external portal mounts use canonical portal paths", () => {
  // Role links still resolve through the canonical PORTAL_PATHS map. Since the
  // top navigation header was removed, the Owner and Growth Partner links now
  // reach it as RoleCard `path` props rather than inline navigate() calls.
  assert.match(app, /navigate\(PORTAL_PATHS\.customer\)/);
  assert.match(app, /PORTAL_PATHS\.business_user/);
  assert.match(app, /PORTAL_PATHS\.growth_partner/);
  assert.doesNotMatch(app, /<Header\b/);
  // Canonical mounts are cross-origin redirects (Vercel cannot proxy .vercel.app).
  assert.match(nextConfig, /externalPortalRedirects/);
  assert.match(nextConfig, /configuredPortalOrigins/);
  assert.match(originConfig, /NEXORA_CUSTOMER_PWA_ORIGIN/);
  assert.match(originConfig, /NEXORA_OWNER_PWA_ORIGIN/);
  assert.match(originConfig, /NEXORA_PARTNER_PWA_ORIGIN/);
  assert.match(originConfig, /GROWTH_PARTNER_APP_ORIGIN/);
  assert.match(originConfig, /protocol !== "https:"/);
  // Customer / Owner / Partner origins must stay environment-only. The single
  // exception is the built-in Template App default, so /app/template keeps
  // working on a deployment that never set NEXORA_TEMPLATE_PWA_ORIGIN.
  const hardcodedOrigins = [...originConfig.matchAll(/"(https?:\/\/[^"]+)"/g)].map(([, origin]) => origin);
  assert.deepEqual(hardcodedOrigins, ["https://new-tamplete-app.vercel.app"]);
  assert.match(originConfig, /DEFAULT_PORTAL_ORIGINS/);
  assert.match(nextConfig, /permanent: false/);
  assert.doesNotMatch(nextConfig, /api\/portal/);
});

test("each PWA package declares its own path base and scoped worker", () => {
  for (const patch of [customerPatch, ownerPatch, partnerPatch]) {
    assert.match(patch, /VITE_APP_BASE_PATH/);
    assert.match(patch, /scope/);
  }
  assert.match(customerPatch, /serviceWorker\.register/);
  assert.match(partnerPatch, /serviceWorker\.register/);
  assert.match(ownerPatch, /VitePWA/);
  assert.match(ownerPatch, /scope: portalBase/);
  assert.match(customerPatch, /\/app\/customer\//);
  assert.match(ownerPatch, /\/app\/owner\//);
  assert.match(partnerPatch, /\/app\/partner\//);
  assert.doesNotMatch(ownerAddedSource, /eyJhbGciOiJIUzI1Ni/);
});

test("auth return paths remain same-origin and portal-aware", () => {
  assert.match(app, /requestedReturnTo\?\.startsWith\("\/"\)/);
  assert.match(app, /!requestedReturnTo\.startsWith\("\/\/"\)/);
  assert.match(app, /roleQueryForPortalRole\(loginRole\)/);
  assert.match(app, /encodeURIComponent\(returnTo\)/);
});

test("database permanently guards profiles.platform_role", () => {
  assert.match(roleGuard, /guard_profile_platform_role/);
  assert.match(roleGuard, /before insert or update of platform_role/);
  assert.match(roleGuard, /profiles\.platform_role is assigned permanently/);
  assert.match(roleGuard, /jwt_role <> 'service_role'/);
  assert.match(roleGuard, /current_user not in/);
});
