/**
 * Root dashboard routing contract (fix: main root must never be replaced by
 * a role app).
 *
 * Locks the behaviour that broke in the splash commit:
 *   - `/` always mounts the Main Website Dashboard (NexoraRoot → NexoraApp),
 *     for signed-out visitors and every authenticated role;
 *   - the splash is only a short, self-dismissing overlay with no auth or
 *     routing logic — it can never redirect `/` to `/app/*`;
 *   - external-app redirects stay exact path prefixes (`/app/owner`,
 *     `/app/owner/:path*`, …) and are never applied to `/` or a catch-all;
 *   - shared role-home mapping (ROLE_HOME_PATHS) and the explicit
 *     `/app/*` gateway mounts are preserved unchanged.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const page = await read("app/page.tsx");
const overlay = await read("app/SplashOverlay.tsx");
const splash = await read("app/SplashScreen.tsx");
const nexoraApp = await read("app/nexora-app.tsx");
const nextConfig = await read("next.config.ts");
const middleware = await read("middleware.ts");
const roles = await read("packages/auth/src/roles.ts");
const root = await read("app/NexoraRoot.tsx");

test("/ always mounts the Main Website Dashboard (no role redirect off root)", () => {
  assert.match(page, /NexoraRoot/);
  assert.match(page, /initialPath="\/"/);
  assert.match(root, /<NexoraApp initialPath=\{initialPath\}/);
  // The dashboard fallback branch for `/` still renders HomePage.
  assert.match(nexoraApp, /content = <HomePage/);
  // The page that previously hijacked `/` must not exist anymore.
  assert.equal(existsSync(new URL("../app/HomeEntry.tsx", import.meta.url)), false);
  // No redirect-capable logic at the root: no HomeEntry, no role-home
  // navigation, no window.location calls, no portal paths.
  assert.doesNotMatch(page, /HomeEntry|homePathForRole|window\.location/);
});

test("splash is only a short self-dismissing overlay with no auth or routing logic", () => {
  assert.match(page, /SplashOverlay/);
  // Overlay never routes: no window.location, no role/portal path helpers.
  assert.doesNotMatch(overlay, /window\.location|homePathForRole|portalPathForRole|useAuth|AuthProvider/);
  // Plays once per browser session — refresh opens the dashboard immediately.
  assert.match(overlay, /sessionStorage/);
  // Bounded lifetime + manual fallback: the splash can never loop or trap.
  assert.match(overlay, /SPLASH_MIN_MS/);
  assert.match(overlay, /SPLASH_FALLBACK_MS/);
  assert.match(overlay, /setVisible\(false\)/);
  assert.match(overlay, /pointerEvents: fading \? "none" : "auto"/);
  // SplashScreen remains pure presentation (no routing of its own).
  assert.doesNotMatch(splash, /window\.location|navigate\(/);
});

test("external-app redirects stay exact path prefixes — never `/` or a catch-all", () => {
  // Exact mounts + nested deep links are preserved.
  assert.match(nextConfig, /source: "\/app\/owner", destination:/);
  assert.match(nextConfig, /source: "\/app\/owner\/:path\*", destination:/);
  assert.match(nextConfig, /source: "\/app\/customer\/:path\*", destination:/);
  assert.match(nextConfig, /source: "\/app\/partner\/:path\*", destination:/);
  assert.match(nextConfig, /source: "\/app\/template\/:path\*", destination:/);
  // Deep links map path-for-path onto the external origin.
  assert.match(nextConfig, /\$\{portalOrigins\.owner\}\/:path\*`/);
  // No redirect source ever matches the root or a bare catch-all.
  assert.doesNotMatch(nextConfig, /source:\s*"\/"/);
  assert.doesNotMatch(nextConfig, /source:\s*"\/:path\*"/);
  assert.doesNotMatch(nextConfig, /source:\s*"\/\*"/);
  // No quoted absolute-URL destinations anywhere (proxies/rewrites to
  // external apps are forbidden — only template-literal redirects).
  assert.doesNotMatch(nextConfig, /destination:\s*["']https?:/);
  // Middleware only ever matches the legacy /growth-partner paths.
  assert.doesNotMatch(middleware, /pathname === "\/"|pathname\.startsWith\("\/"\)/);
  assert.doesNotMatch(middleware, /homePathForRole|portalPathForRole/);
  assert.match(middleware, /matcher: \[\s*"\/growth-partner",\s*"\/growth-partner\/:path\*",?\s*\]/);
});

test("shared role-home map and explicit /app/* gateway mounts are preserved", () => {
  // ROLE_HOME_PATHS stays available for explicit navigation and the login
  // returnTo fallback — but nothing on `/` consumes it automatically.
  assert.match(roles, /business_user: "\/app\/owner"/);
  assert.match(roles, /growth_partner: "\/app\/partner"/);
  // Portal gateway still mounts explicit /app/* routes only.
  assert.match(nexoraApp, /PortalGateway/);
  assert.match(nexoraApp, /isPortalPath\(path\)/);
});

test("no Owner App content can mount at `/`", () => {
  // The root render path is NexoraRoot → NexoraApp HomePage only. There is
  // no Owner PWA surface, frame, or handoff reachable from the root branch.
  assert.doesNotMatch(page, /PortalHandoff|PortalGateway|iframe/);
  assert.doesNotMatch(page, /app\/owner/);
});
