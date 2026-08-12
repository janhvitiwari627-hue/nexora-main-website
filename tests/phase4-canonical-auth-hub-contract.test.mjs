import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");

function componentSource(name, nextName) {
  const start = app.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = nextName ? app.indexOf(`function ${nextName}`, start) : app.length;
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return app.slice(start, end);
}

test("Phase 4 exposes canonical auth routes while preserving legacy links", () => {
  for (const route of [
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify",
    "/auth/callback",
    "/auth/logout",
    "/auth/continue",
  ]) {
    assert.ok(app.includes(`path === "${route}"`), `${route} must be routed`);
  }
  for (const route of ["/login", "/signup", "/forgot-password", "/reset-password"]) {
    assert.ok(app.includes(`path === "${route}"`), `${route} compatibility route must remain`);
  }

  // Newly rendered links use the auth hub, including recovery redirects.
  assert.doesNotMatch(app, /(?:navigate|go)\((?:"|`)\/(?:login|signup|forgot-password|reset-password)(?:[?"`])/);
  assert.match(app, /go\("\/auth\/login"\)/);
  assert.match(app, /navigate\("\/auth\/signup"\)/);
  assert.match(app, /sendPasswordReset|AUTH_ROUTES\.resetPassword/);

  // Verification is an alias of the same profile-verified PKCE callback.
  assert.match(app, /path === "\/auth\/callback" \|\| path === "\/auth\/verify"/);
  const callback = componentSource("AuthCallbackPage", "AuthLogoutPage");
  assert.match(callback, /handleAuthCallback/);
  assert.match(callback, /destinationForVerifiedRole\(profile\.role/);
  assert.match(callback, /profile\.role/);
});

test("canonical logout uses shared sign-out and accepts only safe local paths", () => {
  const logout = componentSource("AuthLogoutPage", "AuthContinuePage");
  assert.match(logout, /const \{ signOut \} = useAuth\(\)/);
  assert.match(logout, /safeSameOriginPath\(params\.get\("returnTo"\), "\/"\)/);
  assert.match(logout, /await signOut\(\)/);
  assert.doesNotMatch(logout, /safeRedirectUrl|window\.location\.assign/);

  const helper = componentSource("safeSameOriginPath", "AuthCallbackPage");
  assert.match(helper, /!candidate\.startsWith\("\/"\)/);
  assert.match(helper, /candidate\.startsWith\("\/\/"\)/);
  assert.match(helper, /candidate\.includes/);
  assert.match(helper, /\/\[\?#\]\//);
});

test("canonical continuation waits for provider state and routes by verified role", () => {
  const continuation = componentSource("AuthContinuePage", "ForgotPasswordPage");
  assert.match(continuation, /useAuth\(\)/);
  assert.match(continuation, /if \(loading/);
  assert.match(continuation, /!isAuthenticated \|\| !role/);
  assert.match(continuation, /navigate\(`\/auth\/login/);
  assert.match(continuation, /homePathForRole\(role\)/);
  assert.match(continuation, /role === "customer" && requestedReturnTo/);
  assert.doesNotMatch(continuation, /localStorage|platform_role\s*=|role\s*=\s*params/);
});
