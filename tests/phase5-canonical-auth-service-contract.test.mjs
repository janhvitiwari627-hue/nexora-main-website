import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const service = await readFile(new URL("../packages/auth/src/service.ts", import.meta.url), "utf8");
const provider = await readFile(new URL("../packages/auth/src/AuthProvider.tsx", import.meta.url), "utf8");
const indexSrc = await readFile(new URL("../packages/auth/src/index.ts", import.meta.url), "utf8");
const redirects = await readFile(new URL("../packages/auth/src/redirects.ts", import.meta.url), "utf8");
const session = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");
const pkg = JSON.parse(await readFile(new URL("../packages/auth/package.json", import.meta.url), "utf8"));
const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const binding = await readFile(new URL("../app/lib/auth/index.ts", import.meta.url), "utf8");
const phase5Patch = await readFile(
  new URL("../integration-packages/phase5-canonical-auth-service.patch", import.meta.url),
  "utf8",
);
const phase5Guide = await readFile(
  new URL("../integration-packages/PHASE5_CANONICAL_AUTH_SERVICE.md", import.meta.url),
  "utf8",
);

const CANONICAL_METHODS = [
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

test("the Phase 5 service contract remains available after later package upgrades", () => {
  assert.match(phase5Patch, /[+-]\s+"version": "1\.1\.0"/);
  assert.equal(pkg.version, "1.2.0");
  assert.match(service, /AUTH_SERVICE_CONTRACT_VERSION = "1\.0\.0"/);
  assert.match(indexSrc, /createAuthService/);
  assert.match(indexSrc, /AUTH_SERVICE_CONTRACT_VERSION/);
  assert.match(binding, /createAuthService/);
  assert.equal(pkg.exports["./service"], "./src/service.ts");
});

test("the twelve canonical methods are the only auth/session/guard inventory", () => {
  for (const method of CANONICAL_METHODS) {
    assert.match(service, new RegExp(`async ${method}\\(`), method);
    assert.match(provider, new RegExp(`\\b${method}\\b`), method);
  }
  assert.match(service, /AUTH_SERVICE_METHODS/);
});

test("Phase 2 compatibility aliases remain on the provider", () => {
  assert.match(provider, /setPassword = updatePasswordFn/);
  assert.match(provider, /completeAuthCallback = handleAuthCallback/);
  assert.match(provider, /const refresh = useCallback/);
  assert.match(provider, /Phase 2 compatibility aliases/);
});

test("Main Website auth screens use the canonical service instead of supabase.auth", () => {
  assert.doesNotMatch(app, /\.auth\./);
  assert.match(app, /useAuth\(\)/);
  assert.match(app, /resendVerification/);
  assert.match(app, /handleAuthCallback/);
  assert.match(app, /sendPasswordReset/);
  assert.match(app, /updatePassword/);
  assert.match(app, /requireAuth/);
  assert.match(app, /requireOwnerWorkspace/);
  assert.match(app, /requirePartnerMembership/);
  assert.match(app, /requireCustomerAccount/);
  assert.match(app, /Password must be at least 8 characters/);
  assert.match(app, /minLength=\{8\}/);
  assert.doesNotMatch(app, /minLength=\{6\}/);
});

test("canonical AUTH_ROUTES cover the Phase 4 hub while legacy app routes remain", () => {
  for (const [key, path] of [
    ["login", "/auth/login"],
    ["signup", "/auth/signup"],
    ["forgotPassword", "/auth/forgot-password"],
    ["resetPassword", "/auth/reset-password"],
    ["verify", "/auth/verify"],
    ["callback", "/auth/callback"],
    ["logout", "/auth/logout"],
    ["continue", "/auth/continue"],
    ["expired", "/auth/expired"],
  ]) {
    assert.match(redirects, new RegExp(`${key}: "${path}"`));
  }
  for (const route of ["/login", "/signup", "/forgot-password", "/reset-password"]) {
    assert.match(app, new RegExp(`path === "${route}"`));
  }
});

test("security: session is not authorization and roles never come from the client", () => {
  assert.match(service, /A Supabase session alone never authorizes access/);
  assert.match(service, /auth\.getUser\(\)/);
  assert.match(service, /requireActiveProfile/);
  assert.match(service, /endSession\(client\)/);
  assert.match(service, /role_mismatch/);
  assert.match(session, /normalizeSignupRole/);
  assert.match(app, /destinationForVerifiedRole/);
  assert.match(app, /role !== "customer"/);
  assert.doesNotMatch(app, /localStorage\.getItem\(["']role/);
  assert.doesNotMatch(service, /localStorage\.(getItem|setItem)/);
});

test("the shared Phase 5 vendor patch reconstructs the historical 1.1.0 package", async () => {
  assert.match(phase5Guide, /src\/vendor\/nexora-auth\//);
  assert.match(phase5Guide, /auth-integration\.patch/);
  assert.match(phase5Guide, /Customer/);
  assert.match(phase5Guide, /Owner/);
  assert.match(phase5Guide, /Growth Partner/);
  assert.match(phase5Patch, /src\/vendor\/nexora-auth\/service\.ts/);
  assert.match(phase5Patch, /AUTH_SERVICE_CONTRACT_VERSION/);

  const dir = await mkdtemp(join(tmpdir(), "nexora-phase5-vendor-"));
  try {
    const phase2 = join(root, "integration-packages/customer-pwa/auth-integration.patch");
    const phase5 = join(root, "integration-packages/phase5-canonical-auth-service.patch");
    // Reconstruct only the Phase 2 vendored package, then apply the shared Phase 5 patch.
    execFileSync("git", ["apply", "--check", "--include=src/vendor/nexora-auth/*", phase2], { cwd: dir });
    execFileSync("git", ["apply", "--include=src/vendor/nexora-auth/*", phase2], { cwd: dir });
    execFileSync("git", ["apply", "--check", phase5], { cwd: dir });
    execFileSync("git", ["apply", phase5], { cwd: dir });

    const vendorDir = join(dir, "src/vendor/nexora-auth");
    const vendorFiles = (await readdir(vendorDir)).sort();
    const expected = [
      "AuthProvider.tsx",
      "client.ts",
      "env.ts",
      "errors.ts",
      "index.ts",
      "package.json",
      "redirects.ts",
      "roles.ts",
      "service.ts",
      "session.ts",
    ];
    assert.deepEqual(vendorFiles, expected);

    const historicalPkg = JSON.parse(await readFile(join(vendorDir, "package.json"), "utf8"));
    const historicalService = await readFile(join(vendorDir, "service.ts"), "utf8");
    const historicalIndex = await readFile(join(vendorDir, "index.ts"), "utf8");
    assert.equal(historicalPkg.version, "1.1.0");
    assert.equal(historicalPkg.exports["./service"], "./src/service.ts");
    assert.match(historicalService, /AUTH_SERVICE_CONTRACT_VERSION = "1\.0\.0"/);
    for (const method of CANONICAL_METHODS) {
      assert.match(historicalService, new RegExp(`async ${method}\\(`), method);
    }
    assert.match(historicalIndex, /createAuthService/);
    assert.match(historicalIndex, /AUTH_SERVICE_CONTRACT_VERSION/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
