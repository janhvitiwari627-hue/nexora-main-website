import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const routes = await readFile(new URL("../app/lib/portalRoutes.ts", import.meta.url), "utf8");
const roleGuard = await readFile(new URL("../supabase/migrations/20260805_permanent_profile_role_guard.sql", import.meta.url), "utf8");
const manifests = await Promise.all([
  readFile(new URL("../public/manifest-customer.webmanifest", import.meta.url), "utf8"),
  readFile(new URL("../public/manifest-owner.webmanifest", import.meta.url), "utf8"),
  readFile(new URL("../public/manifest-growth-partner.webmanifest", import.meta.url), "utf8"),
]);

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

test("main app routes every canonical portal through the role gate", () => {
  assert.match(app, /import[\s\S]*portalRoleFromPath[\s\S]*from "\.\/lib\/portalRoutes"/);
  assert.match(app, /else if \(isPortalPath\(path\)\)[\s\S]*DashboardPage expectedRole=\{portalRoleFromPath\(path\)/);
  assert.match(app, /URL role is never trusted/);
  assert.match(app, /requestedRole && requestedRole !== profile\.platform_role/);
  assert.match(app, /navigate\(portalPathForRole\(profile\.platform_role\)\)/);
});

test("legacy dashboard URLs canonicalize instead of becoming a second portal", () => {
  assert.match(app, /legacyDashboardRoleFromPath\(path\)/);
  assert.match(app, /Legacy dashboard URLs remain compatible/);
  assert.match(app, /if \(!isPortalPath\(currentPath\)\)/);
  assert.match(app, /path-based portal/);
});

test("all role links and manifests use the canonical portal paths", () => {
  assert.match(app, /navigate\(PORTAL_PATHS\.customer\)/);
  assert.match(app, /navigate\(PORTAL_PATHS\.business_user\)/);
  assert.match(app, /navigate\(PORTAL_PATHS\.growth_partner\)/);
  const parsed = manifests.map((source) => JSON.parse(source));
  assert.deepEqual(parsed.map((manifest) => manifest.id), ["/app/customer", "/app/owner", "/app/partner"]);
  assert.deepEqual(parsed.map((manifest) => manifest.scope), ["/app/customer/", "/app/owner/", "/app/partner/"]);
  assert.deepEqual(parsed.map((manifest) => manifest.start_url), [
    "/app/customer/?source=pwa",
    "/app/owner/?source=pwa",
    "/app/partner/?source=pwa",
  ]);
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

test("configured PWA deployments are proxied behind same-origin paths", () => {
  assert.match(nextConfig, /NEXORA_CUSTOMER_PWA_ORIGIN/);
  assert.match(nextConfig, /NEXORA_OWNER_PWA_ORIGIN/);
  assert.match(nextConfig, /NEXORA_PARTNER_PWA_ORIGIN/);
  assert.match(nextConfig, /source: path, destination: `\$\{origin\}\/`/);
  assert.match(nextConfig, /source: `\$\{path\}\/\:path\*`, destination: `\$\{origin\}\/\:path\*`/);
  assert.match(nextConfig, /safePortalOrigin/);
});
