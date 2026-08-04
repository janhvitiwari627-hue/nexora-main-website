import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const routes = await readFile(new URL("../app/lib/portalRoutes.ts", import.meta.url), "utf8");
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
  assert.match(app, /requestedRole && requestedRole !== profileRole/);
  assert.match(app, /navigate\(portalPathForRole\(profileRole\)\)/);
  assert.doesNotMatch(app, /RoleWorkspace|DashboardPage|PwaInstallPrompt/);
});

test("legacy dashboard URLs canonicalize instead of becoming a second portal", () => {
  assert.match(app, /legacyDashboardRoleFromPath\(path\)/);
  assert.match(app, /if \(!isPortalPath\(currentPath\)\)/);
  assert.match(app, /does not render a duplicate dashboard/);
});

test("role links and reverse proxy mounts use canonical portal paths", () => {
  assert.match(app, /navigate\(PORTAL_PATHS\.customer\)/);
  assert.match(app, /navigate\(PORTAL_PATHS\.business_user\)/);
  assert.match(app, /navigate\(PORTAL_PATHS\.growth_partner\)/);
  for (const variable of ["NEXORA_CUSTOMER_PWA_ORIGIN", "NEXORA_OWNER_PWA_ORIGIN", "NEXORA_PARTNER_PWA_ORIGIN"]) {
    assert.match(nextConfig, new RegExp(variable));
  }
  assert.match(nextConfig, /source: `\$\{path\}\/\:path\*`, destination: `\$\{origin\}\/\:path\*`/);
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
