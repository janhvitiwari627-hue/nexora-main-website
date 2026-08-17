/**
 * Homepage Phase 1 — Section 02 contract tests.
 *
 * Locks the three Section 02 deliverables and, just as importantly, locks the
 * hard rules they were built under:
 *
 *   1. Six-app route contract — all six Nexora apps are enumerated, with the
 *      canonical routes that `next.config.ts` actually serves.
 *   2. Shared auth-state — a read-only projection that fails closed and
 *      cannot mutate a session.
 *   3. Shared navigation — data only; no Header, no homepage change.
 *
 * Static-source + pure-runtime assertions. No network, no Supabase, no React
 * renderer required.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

/**
 * Executable source with comments removed.
 *
 * The "must not contain X" rules below describe what the CODE does. These
 * modules document the very things they are forbidden to do (for example
 * "callers use window.location.assign() themselves", or "the Header is a
 * later section"), so prose must not be able to fail — or to satisfy — a
 * behavioural assertion.
 */
const code = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");

const appsSrc = await read("app/lib/nexora-apps.ts");
const authStateSrc = await read("app/lib/auth/authState.ts");
const hookSrc = await read("app/lib/auth/useNexoraAuthState.ts");
const navSrc = await read("app/lib/navigation/sharedNavigation.ts");
const navIndexSrc = await read("app/lib/navigation/index.ts");
const nextConfig = await read("next.config.ts");
const portalRoutes = await read("app/lib/portalRoutes.ts");
const nexoraApp = await read("app/nexora-app.tsx");
const middleware = await read("middleware.ts");

const EXPECTED_APPS = [
  { id: "customer", route: "/app/customer", delivery: "external-origin" },
  { id: "owner", route: "/app/owner", delivery: "external-origin" },
  { id: "partner", route: "/app/partner", delivery: "external-origin" },
  { id: "template", route: "/app/template", delivery: "external-origin" },
  { id: "job-portal", route: "/job-portal", delivery: "static-mount" },
  { id: "distributors-beauty-industry", route: "/distributors-beauty-industry", delivery: "static-mount" },
];

// ---------------------------------------------------------------------------
// 1 — Six-app route contract
// ---------------------------------------------------------------------------

test("the route contract enumerates exactly the six Nexora apps", () => {
  assert.match(appsSrc, /NEXORA_APP_COUNT = 6/);
  for (const { id } of EXPECTED_APPS) {
    assert.match(appsSrc, new RegExp(`id: "${id}"`), `${id} must be in the contract`);
  }
  const declaredIds = [...appsSrc.matchAll(/^\s{4}id: "([a-z-]+)",$/gm)].map(([, id]) => id);
  assert.deepEqual(declaredIds, EXPECTED_APPS.map((app) => app.id));
});

test("each app records the delivery mechanism its route actually uses", () => {
  for (const { id, delivery } of EXPECTED_APPS) {
    const block = appsSrc.slice(appsSrc.indexOf(`id: "${id}"`));
    const declared = block.match(/delivery: "([a-z-]+)"/)?.[1];
    assert.equal(declared, delivery, `${id} delivery`);
  }
});

test("canonical /app/* routes are re-exported, never re-typed as literals", () => {
  // The four portal routes must come from portalRoutes.ts so the two modules
  // can never drift apart.
  assert.match(appsSrc, /import \{[\s\S]*?PORTAL_PATHS[\s\S]*?TEMPLATE_PATH[\s\S]*?\} from "\.\/portalRoutes"/);
  assert.match(appsSrc, /route: PORTAL_PATHS\.customer/);
  assert.match(appsSrc, /route: PORTAL_PATHS\.business_user/);
  assert.match(appsSrc, /route: PORTAL_PATHS\.growth_partner/);
  assert.match(appsSrc, /route: TEMPLATE_PATH/);
  assert.doesNotMatch(appsSrc, /route: "\/app\//);
});

test("the two static-mount routes match the rewrites in next.config.ts", () => {
  assert.match(nextConfig, /JOB_PORTAL_BASE = "\/job-portal"/);
  assert.match(nextConfig, /DISTRIBUTORS_BEAUTY_INDUSTRY_BASE = "\/distributors-beauty-industry"/);
  assert.match(appsSrc, /route: "\/job-portal"/);
  assert.match(appsSrc, /route: "\/distributors-beauty-industry"/);
});

test("no portal origin or deployment URL is embedded in the route contract", () => {
  // Origins stay environment-only and fail closed in config/portalOrigins.ts.
  assert.doesNotMatch(appsSrc, /https?:\/\//);
  // Only env var NAMES are recorded.
  assert.match(appsSrc, /originEnvVars: \["NEXORA_CUSTOMER_PWA_ORIGIN"\]/);
  assert.match(appsSrc, /originEnvVars: \["NEXORA_OWNER_PWA_ORIGIN"\]/);
  assert.match(appsSrc, /"NEXORA_PARTNER_PWA_ORIGIN", "GROWTH_PARTNER_APP_ORIGIN"/);
  assert.match(appsSrc, /originEnvVars: \["NEXORA_TEMPLATE_PWA_ORIGIN"\]/);
});

test("required portals stay fail-closed and Template keeps its default", () => {
  const failClosed = (id) => {
    const block = appsSrc.slice(appsSrc.indexOf(`id: "${id}"`));
    return block.match(/failsClosedWithoutOrigin: (true|false)/)?.[1];
  };
  assert.equal(failClosed("customer"), "true");
  assert.equal(failClosed("owner"), "true");
  assert.equal(failClosed("partner"), "true");
  assert.equal(failClosed("template"), "false");
});

test("route contract resolution is unambiguous and query/hash safe", async () => {
  const {
    NEXORA_APPS,
    NEXORA_APP_COUNT,
    nexoraAppForPath,
    getNexoraApp,
    publicApps,
    roleGatedApps,
    appsForRole,
  } = await import("../app/lib/nexora-apps.ts");

  assert.equal(NEXORA_APPS.length, NEXORA_APP_COUNT);
  assert.equal(NEXORA_APPS.length, 6);

  assert.equal(nexoraAppForPath("/app/owner")?.id, "owner");
  assert.equal(nexoraAppForPath("/app/owner/")?.id, "owner");
  assert.equal(nexoraAppForPath("/app/owner/salons/42")?.id, "owner");
  assert.equal(nexoraAppForPath("/app/owner?tab=1")?.id, "owner");
  assert.equal(nexoraAppForPath("/app/owner#top")?.id, "owner");
  assert.equal(nexoraAppForPath("/job-portal/jobs/9")?.id, "job-portal");
  assert.equal(nexoraAppForPath("/distributors-beauty-industry/brands")?.id, "distributors-beauty-industry");

  // Main Website routes are never claimed by an app.
  for (const path of ["/", "/salons", "/auth/login", "/terms", "/app-store", "/job-portalish"]) {
    assert.equal(nexoraAppForPath(path), null, path);
  }

  assert.equal(getNexoraApp("nope"), null);
  assert.equal(publicApps().length, 2);
  assert.equal(roleGatedApps().length, 4);

  // Role-scoped offers never leak another role's app.
  const ownerIds = appsForRole("business_user").map((app) => app.id);
  assert.deepEqual(ownerIds.sort(), ["distributors-beauty-industry", "job-portal", "owner", "template"].sort());
  assert.ok(!appsForRole("customer").some((app) => app.id === "owner"));
  assert.ok(!appsForRole("growth_partner").some((app) => app.id === "template"));
  assert.deepEqual(appsForRole(null).map((app) => app.id).sort(), ["distributors-beauty-industry", "job-portal"]);
});

// ---------------------------------------------------------------------------
// 2 — Shared auth-state
// ---------------------------------------------------------------------------

test("auth-state is a projection: no Supabase, no storage, no mutation", () => {
  for (const [name, src] of [["authState", authStateSrc], ["hook", hookSrc], ["navigation", navSrc]]) {
    const executable = code(src);
    assert.doesNotMatch(executable, /createClient|supabase\.auth|\.auth\.|from\("profiles"\)|\.rpc\(/, name);
    assert.doesNotMatch(executable, /localStorage|sessionStorage|document\.cookie/, name);
    assert.doesNotMatch(executable, /signIn\(|signUp\(|signOut\(|updatePassword\(|resetPassword/, name);
    assert.doesNotMatch(executable, /service_role|SERVICE_ROLE/, name);
  }
});

test("auth-state does not re-implement role resolution or trust the client", () => {
  const executable = code(authStateSrc);
  // Role labels/home paths come from the shared package, not a local copy.
  assert.match(executable, /from "\.\.\/\.\.\/\.\.\/packages\/auth\/src"/);
  assert.match(executable, /ROLE_LABELS/);
  assert.match(executable, /homePathForRole/);
  // No alias normalization of client-supplied strings.
  assert.doesNotMatch(executable, /normalizeRole|normalizeSignupRole/);
  assert.doesNotMatch(executable, /searchParams|location\.search|\?role=/);
});

test("auth-state fails closed for every partial or hostile input", async () => {
  const { projectAuthState, ANONYMOUS_AUTH_STATE } = await import("../app/lib/auth/authState.ts");

  for (const input of [null, undefined, {}, { status: "authenticated" }]) {
    assert.equal(projectAuthState(input).isAuthenticated, false, JSON.stringify(input));
  }

  // Session present but no profile → not authenticated.
  assert.equal(
    projectAuthState({ status: "authenticated", isAuthenticated: true, role: "customer", profile: null })
      .isAuthenticated,
    false,
  );
  // Profile deactivated server-side → not authenticated.
  assert.equal(
    projectAuthState({
      status: "authenticated",
      isAuthenticated: true,
      role: "customer",
      profile: { fullName: "A", isActive: false },
    }).isAuthenticated,
    false,
  );
  // Unknown / forged role → not authenticated, no role leaked.
  const forged = projectAuthState({
    status: "authenticated",
    isAuthenticated: true,
    role: "super_admin",
    profile: { fullName: "A", isActive: true },
  });
  assert.equal(forged.isAuthenticated, false);
  assert.equal(forged.role, null);

  // Still initializing → loading, never authenticated.
  const booting = projectAuthState({ status: "initializing", loading: true });
  assert.equal(booting.isLoading, true);
  assert.equal(booting.isAuthenticated, false);

  // Misconfigured deployment is reported, not treated as a session.
  const broken = projectAuthState({ status: "unconfigured", configError: "missing env" });
  assert.equal(broken.isUnconfigured, true);
  assert.equal(broken.isAuthenticated, false);

  assert.equal(ANONYMOUS_AUTH_STATE.isAuthenticated, false);
  assert.equal(ANONYMOUS_AUTH_STATE.role, null);
});

test("a healthy session projects role, label and canonical home", async () => {
  const { projectAuthState } = await import("../app/lib/auth/authState.ts");
  const state = projectAuthState({
    status: "authenticated",
    loading: false,
    isAuthenticated: true,
    role: "business_user",
    profile: { fullName: "Asha Verma", isActive: true },
  });
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.role, "business_user");
  assert.equal(state.roleLabel, "Shop Owner");
  assert.equal(state.homePath, "/app/owner");
  assert.equal(state.displayName, "Asha Verma");
});

test("an email address is never surfaced as a display name", async () => {
  const { projectAuthState } = await import("../app/lib/auth/authState.ts");
  const state = projectAuthState({
    status: "authenticated",
    isAuthenticated: true,
    role: "customer",
    profile: { fullName: "user@example.com", isActive: true },
  });
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.displayName, null);
});

test("the hook consumes the existing AuthProvider context read-only", () => {
  const executable = code(hookSrc);
  assert.match(executable, /"use client"/);
  assert.match(executable, /useContext\(AuthContext\)/);
  assert.match(executable, /projectAuthState/);
  // It must not create a second provider or its own state machine.
  assert.doesNotMatch(executable, /createContext|<AuthProvider|useState|onAuthStateChange/);
});

// ---------------------------------------------------------------------------
// 3 — Shared navigation (data only)
// ---------------------------------------------------------------------------

test("shared navigation is data only — no components, no JSX, no Header", () => {
  const executable = code(navSrc);
  assert.doesNotMatch(executable, /<[A-Za-z]/);
  assert.doesNotMatch(executable, /react|useState|useEffect/i);
  assert.doesNotMatch(executable, /function Header|export const Header/);
  assert.doesNotMatch(code(navIndexSrc), /Header|\.tsx/);
  assert.equal(existsSync(new URL("../app/lib/navigation/Header.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../app/Header.tsx", import.meta.url)), false);
});

test("navigation performs no navigation and invents no route", () => {
  const executable = code(navSrc);
  assert.doesNotMatch(executable, /window\.location|history\.pushState|router\.push|redirect\(/);
  // Auth routes come from the canonical AUTH_ROUTES map.
  assert.match(executable, /AUTH_ROUTES\.login/);
  assert.match(executable, /AUTH_ROUTES\.signup/);
  assert.match(executable, /AUTH_ROUTES\.logout/);
  assert.doesNotMatch(executable, /href: "\/auth\//);
  // App destinations come from the six-app contract.
  assert.match(executable, /href: app\.route/);
});

test("navigation shows only what the viewer's verified role may open", async () => {
  const { buildSharedNavigation, appNavItemsForAuthState, authNavItemsForAuthState } = await import(
    "../app/lib/navigation/sharedNavigation.ts"
  );
  const { ANONYMOUS_AUTH_STATE, projectAuthState } = await import("../app/lib/auth/authState.ts");

  // Signed out: public apps only, log in / sign up offered.
  const anon = buildSharedNavigation(ANONYMOUS_AUTH_STATE);
  assert.deepEqual(anon.apps.map((i) => i.appId).sort(), ["distributors-beauty-industry", "job-portal"]);
  assert.deepEqual(anon.auth.map((i) => i.id), ["auth:login", "auth:signup"]);
  assert.equal(anon.accountName, null);

  // Initializing: no auth actions and no role-gated app flashes.
  const loading = projectAuthState({ status: "initializing", loading: true });
  assert.deepEqual(authNavItemsForAuthState(loading), []);
  assert.ok(!appNavItemsForAuthState(loading).some((i) => i.appId === "owner"));

  // Growth Partner: own app + public apps, never Owner or Customer.
  const partner = projectAuthState({
    status: "authenticated",
    isAuthenticated: true,
    role: "growth_partner",
    profile: { fullName: "Ravi", isActive: true },
  });
  const partnerNav = buildSharedNavigation(partner);
  const partnerApps = partnerNav.apps.map((i) => i.appId);
  assert.ok(partnerApps.includes("partner"));
  assert.ok(!partnerApps.includes("owner"));
  assert.ok(!partnerApps.includes("customer"));
  assert.ok(!partnerApps.includes("template"));
  assert.equal(partnerNav.accountRoleLabel, "Growth Partner");
  // Logout is a route, never an inline session mutation.
  const logout = partnerNav.auth.find((i) => i.id === "auth:logout");
  assert.equal(logout.href, "/auth/logout");
});

test("items that leave the Next router are flagged for full navigation", async () => {
  const { allAppNavItems } = await import("../app/lib/navigation/sharedNavigation.ts");
  for (const item of allAppNavItems()) {
    assert.equal(item.leavesRouter, true, `${item.appId} must not be pushState-navigated`);
  }
});

// ---------------------------------------------------------------------------
// Hard rules — nothing existing was changed, removed or pre-empted
// ---------------------------------------------------------------------------

test("all six app surfaces remain wired in the existing routing layers", () => {
  // Portal redirects (external origins).
  for (const route of ["/app/customer", "/app/owner", "/app/partner", "/app/template"]) {
    assert.match(nextConfig, new RegExp(`source: "${route}"`), route);
    assert.match(nextConfig, new RegExp(`source: "${route}/:path\\*"`), `${route}/:path*`);
  }
  // Static mounts.
  assert.match(nextConfig, /jobPortalRoutes/);
  assert.match(nextConfig, /distributorsBeautyIndustryRoutes/);
  assert.match(nextConfig, /distributorsBeautyIndustryFallbackRoutes/);
  // Legacy partner path still redirects.
  assert.match(middleware, /\/growth-partner/);
  assert.match(middleware, /308/);
});

test("Section 02 changed no existing route, portal map or homepage behaviour", () => {
  // portalRoutes.ts keeps its original canonical map.
  assert.match(portalRoutes, /customer: "\/app\/customer"/);
  assert.match(portalRoutes, /business_user: "\/app\/owner"/);
  assert.match(portalRoutes, /growth_partner: "\/app\/partner"/);
  assert.match(portalRoutes, /TEMPLATE_PATH = "\/app\/template"/);
  // The homepage still renders HomePage at `/` and still has no <Header>.
  assert.match(nexoraApp, /content = <HomePage/);
  assert.doesNotMatch(nexoraApp, /<Header\b/);
  // Section 02 is not mounted into any existing UI yet.
  assert.doesNotMatch(nexoraApp, /buildSharedNavigation|useNexoraAuthState|NEXORA_APPS/);
});

test("Section 02 adds no route handler, page or middleware of its own", () => {
  for (const path of [
    "app/lib/navigation/page.tsx",
    "app/lib/navigation/route.ts",
    "app/apps/page.tsx",
    "app/app-store/page.tsx",
  ]) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, path);
  }
});
