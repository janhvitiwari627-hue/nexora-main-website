import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const SHARED_PROJECT = "qwaehqsmodekbgvnaavz";
const SHARED_STORAGE_KEY = `nexora.auth.${SHARED_PROJECT}`;

const phase6Packages = {
  owner: "integration-packages/owner-pwa/phase6-unified-auth.patch",
  customer: "integration-packages/customer-pwa/phase6-unified-auth.patch",
  partner: "integration-packages/growth-partner-pwa/phase6-unified-auth.patch",
  template: "integration-packages/template-app/phase6-unified-auth.patch",
};

test("@nexora/auth 1.2.0 exports the Phase 6 access contract", () => {
  const manifest = JSON.parse(read("packages/auth/package.json"));
  const index = read("packages/auth/src/index.ts");

  assert.equal(manifest.name, "@nexora/auth");
  assert.equal(manifest.version, "1.2.0");
  assert.equal(manifest.exports["./access"], "./src/access.ts");
  for (const name of ["requireOwnerWorkspace", "requirePartnerMembership", "requireCustomerAccount"]) {
    assert.match(index, new RegExp(`\\b${name}\\b`));
  }
});

test("access gates re-verify canonical auth and use only server-backed authority", () => {
  const access = read("packages/auth/src/access.ts");

  assert.match(access, /createAuthService\(client\)\.requireRole\("business_user"\)/);
  assert.match(access, /client\.rpc\("owner_salon_ids"\)/);
  assert.match(access, /createAuthService\(client\)\.requireRole\("customer"\)/);
  assert.match(access, /createAuthService\(client\)\.requireRole\("growth_partner"\)/);
  assert.match(access, /\.from\("growth_partners"\)/);
  assert.match(access, /\.eq\("user_id", access\.user\.id\)/);
  assert.doesNotMatch(access, /growth_partners[\s\S]*?\.eq\("status"/);
  assert.doesNotMatch(access, /localStorage\.|new URLSearchParams\(/);
});

test("Main Website runs an app-specific gate before mounting each PWA", () => {
  const app = read("app/nexora-app.tsx");
  const gatewayStart = app.indexOf("function PortalGateway(");
  const gatewayEnd = app.indexOf("function UnavailableAuthenticatedPortal", gatewayStart);
  const gateway = app.slice(gatewayStart, gatewayEnd);

  assert.ok(gatewayStart >= 0 && gatewayEnd > gatewayStart, "PortalGateway implementation is missing");
  assert.match(gateway, /await requireOwnerWorkspace\(client\)/);
  assert.match(gateway, /await requirePartnerMembership\(client\)/);
  assert.match(gateway, /await requireCustomerAccount\(client\)/);
  assert.match(app, /TEMPLATE_PATH/);
  assert.match(app, /PortalHandoff/);
  assert.match(app, /TemplateWorkspaceHost/);
  assert.ok(
    gateway.indexOf("await requireOwnerWorkspace(client)") < gateway.indexOf("setState({ loading: false, role: profileRole })"),
    "Owner authorization must settle before the gateway mounts the PWA",
  );
});

test("shared Phase 6 rollout patch contains one byte-identical auth 1.2.0 upgrade", () => {
  const patch = read("integration-packages/phase6-unified-app-auth.patch");

  assert.match(patch, /\+\s+"version": "1\.2\.0"/);
  assert.match(patch, /diff --git a\/src\/vendor\/nexora-auth\/access\.ts/);
  assert.match(patch, /\+export async function requireOwnerWorkspace/);
  assert.match(patch, /\+export async function requirePartnerMembership/);
  assert.match(patch, /\+export async function requireCustomerAccount/);
  assert.match(patch, /\+\s+"\.\/access": "\.\/src\/access\.ts"/);
  assert.doesNotMatch(patch, /SUPABASE_SERVICE_ROLE|service_role\s*[:=]/i);
});

test("every downstream app has an isolated Phase 6 authorization patch", () => {
  for (const [app, path] of Object.entries(phase6Packages)) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `${app} Phase 6 patch is missing`);
    assert.match(read(path), /^diff --git /m, `${app} Phase 6 patch is empty`);
  }

  assert.match(read(phase6Packages.owner), /requireOwnerWorkspace/);
  assert.match(read(phase6Packages.customer), /requireCustomerAccount/);
  assert.match(read(phase6Packages.partner), /requirePartnerMembership/);
  assert.match(read(phase6Packages.template), /requireOwnerWorkspace/);
});

test("Partner self-service cannot claim the Growth Partner role", () => {
  const patch = read(phase6Packages.partner);
  assert.match(patch, /\+\s+role: 'customer'/);
  assert.doesNotMatch(patch, /\+\s+role: 'growth_partner'/);
  assert.doesNotMatch(patch, /\+.*localStorage.*(?:role|partner)/i);
});

test("Template replacement adapters are copied outside git-apply patches", () => {
  const phase2Patch = read("integration-packages/template-app/auth-integration.patch");
  const client = read("integration-packages/template-app/files/src/lib/supabaseClient.ts");
  const hook = read("integration-packages/template-app/files/src/lib/useAuth.ts");

  assert.doesNotMatch(phase2Patch, /^diff --git a\/src\/lib\/(?:supabaseClient|useAuth)\.ts/m);
  assert.match(client, /getSupabaseClient/);
  assert.doesNotMatch(client, /createClient\(/);
  assert.match(hook, /from '@nexora\/auth'/);
  assert.doesNotMatch(hook, /onAuthStateChange/);
});

test("shared project, PKCE, storage and password policy remain canonical", () => {
  const env = read("packages/auth/src/env.ts");
  const client = read("packages/auth/src/client.ts");
  const session = read("packages/auth/src/session.ts");
  const redirects = read("packages/auth/src/redirects.ts");

  assert.match(env, new RegExp(SHARED_PROJECT));
  assert.match(client, /flowType: "pkce"/);
  assert.ok(client.includes("nexora.auth.${SUPABASE_PROJECT_REF}"));
  assert.equal(SHARED_STORAGE_KEY, "nexora.auth.qwaehqsmodekbgvnaavz");
  assert.match(session, /password\.length < 8/);
  assert.match(redirects, /login: "\/auth\/login"/);
  assert.match(redirects, /signup: "\/auth\/signup"/);
  assert.match(redirects, /forgotPassword: "\/auth\/forgot-password"/);
  assert.match(redirects, /resetPassword: "\/auth\/reset-password"/);
});

test("Phase 2 aliases and all twelve canonical Auth Service methods remain", () => {
  const provider = read("packages/auth/src/AuthProvider.tsx");
  const service = read("packages/auth/src/service.ts");
  const methods = [
    "signUp",
    "signIn",
    "signOut",
    "sendPasswordReset",
    "updatePassword",
    "resendVerification",
    "getCurrentUser",
    "getSession",
    "refreshSession",
    "handleAuthCallback",
    "requireAuth",
    "requireRole",
  ];

  for (const method of methods) assert.match(service, new RegExp(`\\b${method}\\b`), `${method} is missing`);
  assert.match(provider, /const setPassword = updatePasswordFn/);
  assert.match(provider, /const completeAuthCallback = handleAuthCallback/);
  assert.match(provider, /const refresh = useCallback/);
  assert.match(provider, /await refreshSessionFn\(\)/);
});
