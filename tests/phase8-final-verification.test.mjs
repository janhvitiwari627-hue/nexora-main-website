/**
 * Phase 8 — final unified-integration verification.
 *
 * Static contracts over Phase 6 auth, Phase 7 location/security, production
 * routing, and the Phase 8 production fixes. No live credentials required.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const app = await read("app/nexora-app.tsx");
const root = await read("app/NexoraRoot.tsx");
const routes = await read("app/lib/portalRoutes.ts");
const websiteClient = await read("app/lib/supabaseClient.ts");
const nextConfig = await read("next.config.ts");
const vercel = await read("vercel.json");
const envSrc = await read("packages/auth/src/env.ts");
const access = await read("packages/auth/src/access.ts");
const service = await read("packages/auth/src/service.ts");
const session = await read("packages/auth/src/session.ts");
const clientSrc = await read("packages/auth/src/client.ts");
const provider = await read("packages/auth/src/AuthProvider.tsx");
const locationIndex = await read("packages/location/src/index.ts");
const phase6Docs = await read("docs/PHASE6_UNIFIED_APP_AUTH.md");
const phase7Docs = await read("docs/PHASE7_LOCATION_SECURITY.md");
const phase8Grants = await read("supabase/migrations/20260813_phase8_postgrest_catalog_grants.sql");
const phase7Migration = await read("supabase/migrations/20260812_phase7_shared_location_security.sql");

const SHARED_PROJECT = "qwaehqsmodekbgvnaavz";

test("Phase 6 unified app auth is present", () => {
  assert.match(phase6Docs, /@nexora\/auth/);
  assert.match(phase6Docs, /requireOwnerWorkspace/);
  assert.match(phase6Docs, /requirePartnerMembership/);
  assert.match(phase6Docs, /requireCustomerAccount/);
  assert.match(phase6Docs, new RegExp(SHARED_PROJECT));
  assert.equal(existsSync(new URL("../integration-packages/owner-pwa/phase6-unified-auth.patch", import.meta.url)), true);
  assert.equal(existsSync(new URL("../integration-packages/customer-pwa/phase6-unified-auth.patch", import.meta.url)), true);
  assert.equal(existsSync(new URL("../integration-packages/growth-partner-pwa/phase6-unified-auth.patch", import.meta.url)), true);
  assert.equal(existsSync(new URL("../integration-packages/template-app/phase6-unified-auth.patch", import.meta.url)), true);
});

test("Phase 7 shared location and RLS are present", () => {
  assert.match(phase7Docs, /user_private_locations/);
  assert.match(phase7Docs, /business_locations/);
  assert.match(phase7Migration, /save_my_private_location/);
  assert.match(phase7Migration, /user_id = auth\.uid\(\)/);
  assert.match(locationIndex, /Owner, Partner,\n \* Customer and Template/);
});

test("canonical /app/* routes exist for Owner, Partner, Customer and Template", () => {
  assert.match(routes, /customer: "\/app\/customer"/);
  assert.match(routes, /business_user: "\/app\/owner"/);
  assert.match(routes, /growth_partner: "\/app\/partner"/);
  assert.match(routes, /TEMPLATE_PATH = "\/app\/template"/);
  assert.match(app, /isPortalPath\(path\)/);
  assert.match(app, /PortalGateway/);
  assert.match(app, /TemplateWorkspaceHost/);
});

test("complete auth flow is wired through the canonical Auth Service", () => {
  for (const method of [
    "signUp",
    "signIn",
    "signOut",
    "sendPasswordReset",
    "updatePassword",
    "refreshSession",
    "handleAuthCallback",
    "requireAuth",
    "requireRole",
  ]) {
    assert.match(service, new RegExp(`\\b${method}\\b`), method);
  }
  assert.match(app, /path === "\/auth\/login"/);
  assert.match(app, /path === "\/auth\/signup"/);
  assert.match(app, /path === "\/auth\/forgot-password"/);
  assert.match(app, /path === "\/auth\/reset-password"/);
  assert.match(app, /path === "\/auth\/callback"/);
  assert.match(app, /path === "\/auth\/logout"/);
  assert.match(app, /ForgotPasswordPage/);
  assert.match(app, /ResetPasswordPage/);
  assert.match(app, /AuthCallbackPage/);
  assert.match(provider, /TOKEN_REFRESHED/);
  assert.match(clientSrc, /autoRefreshToken: true/);
  assert.match(clientSrc, /flowType: "pkce"/);
});

test("role security remains server-backed and rejects localStorage authorization", () => {
  assert.match(access, /requireRole\("business_user"\)/);
  assert.match(access, /requireRole\("growth_partner"\)/);
  assert.match(access, /requireRole\("customer"\)/);
  assert.match(access, /owner_salon_ids/);
  assert.match(app, /no role-home redirects/);
  assert.match(session, /normalizeSignupRole/);
  assert.doesNotMatch(app, /localStorage\.setItem\([^)]*(?:role|admin|owner|partner)/i);
  assert.doesNotMatch(provider, /fakeSession|mockAuth|demoUser/);
});

test("AuthProvider receives the statically inlined Next public env", () => {
  assert.match(websiteClient, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(websiteClient, /export const websiteClientOptions/);
  assert.match(root, /websiteClientOptions/);
  assert.match(root, /clientOptions=\{websiteClientOptions\}/);
  assert.match(envSrc, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(envSrc, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(envSrc, /Next\/webpack only inlines those/);
});

test("vercel.json does not hijack exact /app/* portal entry points", () => {
  const parsed = JSON.parse(vercel);
  const rewrites = parsed.rewrites ?? [];
  for (const route of ["/app/customer", "/app/owner", "/app/partner", "/app/template"]) {
    const hijack = rewrites.find((rule) => {
      const source = String(rule.source ?? "");
      return source === route || source === `${route}/:path*` || source === `${route}/:path+`;
    });
    assert.equal(hijack, undefined, `${route} must stay on next.config beforeFiles rewrites, not vercel.json`);
  }
  assert.equal(parsed.framework, "nextjs");
  // Template has no production origin and is not wired into the proxy config.
  assert.doesNotMatch(nextConfig, /NEXORA_TEMPLATE_PWA_ORIGIN/);
});

test("next.config does not bake empty Supabase secrets and locks the shared project", () => {
  assert.match(nextConfig, new RegExp(SHARED_PROJECT));
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SUPABASE_URL:\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\?\?\s*""/);
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\?\?\s*""/);
  assert.match(nextConfig, /must use shared project qwaehqsmodekbgvnaavz/);
});

test("Phase 8 restores PostgREST table-level catalog SELECT without exposing private columns", () => {
  assert.match(phase8Grants, /grant select on table public\.salon_public_websites to anon, authenticated/);
  assert.match(phase8Grants, /grant select on table public\.salons to anon, authenticated/);
  assert.match(phase8Grants, /grant select on table public\.business_locations to anon, authenticated/);
  assert.match(phase8Grants, /latitude','longitude','lat','lng'/);
  assert.match(phase8Grants, /verify_phase8_catalog_grants/);
  assert.match(app, /fetchCatalogFromMarketplaceRpc/);
  assert.match(app, /isCatalogPrivilegeError/);
  assert.match(app, /\"message\" in cause/);
});

test("location system still covers allow, deny, saved, stale and nearby search", () => {
  assert.match(app, /locationService\.retry/);
  assert.match(app, /syncPrivateLocation: true/);
  assert.match(app, /Saved device GPS|saved real reading|No saved GPS/);
  assert.match(app, /from\("business_locations"\)/);
  assert.match(app, /approval_status === "approved"/);
  assert.match(app, /every distance is[\s\S]{0,20}computed locally/);
});

test("no service-role or live payment secret is shipped in Phase 8 surfaces", () => {
  for (const [name, src] of [
    ["app", app],
    ["env", envSrc],
    ["nextConfig", nextConfig],
    ["phase8Grants", phase8Grants],
  ]) {
    assert.doesNotMatch(src, /SUPABASE_SERVICE_ROLE_KEY|service_role_key|sk_live_|rzp_live_/, name);
    assert.doesNotMatch(src, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, name);
  }
});

test("Phase 8 migration is in the ordered inventory", async () => {
  const files = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  assert.ok(files.includes("20260812_phase7_shared_location_security.sql"));
  assert.ok(files.includes("20260813_phase8_postgrest_catalog_grants.sql"));
});
