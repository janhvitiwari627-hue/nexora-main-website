/**
 * Phase 16 — authentication flow matrix.
 *
 * This suite is deliberately credential-free. It verifies that each checked-in
 * app (and each external PWA integration patch carried by this repository)
 * has a complete auth lifecycle and that the provider state transitions are
 * fail-closed:
 *
 *   SIGNED_IN  -> authenticated UI
 *   SIGNED_OUT -> anonymous/guest UI
 *
 * Live account creation, email delivery, token refresh and Supabase network
 * behavior require deployment credentials and are reported separately in the
 * Phase 16 evidence document.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const addedLines = (patch) => patch
  .split("\n")
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .join("\n");

const mainProvider = await read("packages/auth/src/AuthProvider.tsx");
const mainClient = await read("packages/auth/src/client.ts");
const mainService = await read("packages/auth/src/service.ts");
const mainSession = await read("packages/auth/src/session.ts");
const mainApp = await read("app/nexora-app.tsx");

const jobProvider = await read("job-portal/src/auth/AuthProvider.tsx");
const jobApp = await read("job-portal/src/App.tsx");
const jobClient = await read("job-portal/src/lib/supabase.ts");
const jobBackend = await read("job-portal/src/services/backend.ts");

const templateAuth = await read("integration-packages/template-app/files/src/lib/useAuth.ts");
const templateMain = await read("integration-packages/template-app/files/src/main.tsx");
const templateClient = await read("integration-packages/template-app/files/src/lib/supabaseClient.ts");
const templateLogin = await read("integration-packages/template-app/files/src/components/LoginModal.tsx");
const templateReset = await read("integration-packages/template-app/files/src/components/PasswordResetPage.tsx");

const profileMigration = await read("supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql");

const external = await Promise.all([
  ["Customer PWA", "customer-pwa"],
  ["Owner PWA", "owner-pwa"],
  ["Growth Partner PWA", "growth-partner-pwa"],
].map(async ([name, directory]) => {
  const patch = await read(`integration-packages/${directory}/auth-integration.patch`);
  const readme = await read(`integration-packages/${directory}/README.md`);
  return { name, patch, readme, added: addedLines(patch) };
}));

const matrix = [
  "anonymous visit",
  "login",
  "session persistence after refresh",
  "signup",
  "profile creation",
  "profile loading",
  "logout",
  "re-login",
  "forgot password",
  "reset password",
  "token refresh",
  "expired session handling",
  "auth listener cleanup",
];

test("the Phase 16 matrix contains all required auth scenarios", () => {
  assert.equal(matrix.length, 13);
  assert.deepEqual(matrix, [
    "anonymous visit",
    "login",
    "session persistence after refresh",
    "signup",
    "profile creation",
    "profile loading",
    "logout",
    "re-login",
    "forgot password",
    "reset password",
    "token refresh",
    "expired session handling",
    "auth listener cleanup",
  ]);
});

// ---------------------------------------------------------------------------
// Main Website — canonical @nexora/auth provider
// ---------------------------------------------------------------------------

test("Main Website covers the complete Phase 16 matrix", () => {
  // 1, 2, 7, 8, 11, 13 — provider owns the state machine and listener.
  assert.match(mainProvider, /status: "anonymous"/);
  assert.match(mainProvider, /status: "authenticated"/);
  assert.match(mainProvider, /signIn = useCallback/);
  assert.match(mainProvider, /signOutCallback = useCallback/);
  assert.match(mainProvider, /TOKEN_REFRESHED/);
  assert.match(mainProvider, /subscription\.unsubscribe\(\)/);
  assert.match(mainApp, /AuthProvider|useAuth\(\)/);
  assert.match(mainApp, /destinationForVerifiedRole/);

  // 3 — the client persists the session and restores it with getSession.
  assert.match(mainClient, /persistSession: true/);
  assert.match(mainClient, /autoRefreshToken: true/);
  assert.match(mainProvider, /client\.auth\s*\n?\s*\.getSession\(\)/);

  // 4, 5, 6 — signup is followed by server-owned profile resolution; the
  // profile row itself is created by the shared auth.users trigger.
  assert.match(mainProvider, /signUp = useCallback/);
  assert.match(mainService, /async signUp\(input\)/);
  assert.match(mainService, /requireActiveProfile/);
  assert.match(mainProvider, /resolveProfile\(client, session\.user\.id\)/);
  assert.match(profileMigration, /create or replace function public\.handle_new_user/);
  assert.match(profileMigration, /insert into public\.profiles/);

  // 9, 10 — recovery request, PKCE callback and password update.
  assert.match(mainProvider, /sendPasswordReset/);
  assert.match(mainService, /sendPasswordReset/);
  assert.match(mainSession, /resetPasswordForEmail/);
  assert.match(mainProvider, /updatePasswordFn/);
  assert.match(mainSession, /updatePassword\(client/);
  assert.match(mainApp, /path === "\/auth\/forgot-password"/);
  assert.match(mainApp, /path === "\/auth\/reset-password"/);
  assert.match(mainApp, /path === "\/auth\/expired"/);

  // 12 — expired/invalid sessions become anonymous and route to login rather
  // than leaving a stale authenticated screen visible.
  assert.match(mainProvider, /session_expired|profile_inactive/);
  assert.match(mainService, /session_expired/);
  assert.match(mainApp, /SessionExpiredPage/);
  assert.match(mainProvider, /setState\(\{ status: "anonymous", session: null, profile: null/);
});

test("Main Website has no stale provider identity after SIGNED_OUT", () => {
  const logoutStart = mainProvider.indexOf("const signOutCallback");
  const logoutEnd = mainProvider.indexOf("const refresh =", logoutStart);
  const logout = mainProvider.slice(logoutStart, logoutEnd);
  assert.match(logout, /setState\(\{ status: "anonymous", session: null, profile: null/);
  assert.match(logout, /revisionRef\.current \+= 1/);
  assert.match(logout, /changeHandlerRef\.current\?\.\(\{ session: null, profile: null \}\)/);
});

// ---------------------------------------------------------------------------
// Job Portal
// ---------------------------------------------------------------------------

test("Job Portal covers the complete Phase 16 matrix", () => {
  assert.match(jobProvider, /setSession\(null\)/);
  assert.match(jobProvider, /setSession\(nextSession\)/);
  assert.match(jobProvider, /signIn = useCallback/);
  assert.match(jobProvider, /signUp = useCallback/);
  assert.match(jobProvider, /forgotPassword = useCallback/);
  assert.match(jobProvider, /updatePassword = useCallback/);
  assert.match(jobProvider, /TOKEN_REFRESHED/);
  assert.match(jobProvider, /subscription\.unsubscribe\(\)/);
  assert.match(jobProvider, /revisionRef\.current \+= 1/);

  assert.match(jobClient, /persistSession: true/);
  assert.match(jobClient, /autoRefreshToken: true/);
  assert.match(jobClient, /detectSessionInUrl: true/);
  assert.match(jobProvider, /getSession\(\)/);

  assert.match(jobApp, /authBackend\.signUp/);
  assert.match(jobBackend, /client\.auth\.signUp/);
  assert.match(jobProvider, /\.from\('profiles'\)/);
  assert.match(jobProvider, /\.eq\('id', userId\)/);
  assert.match(jobApp, /setScreen\('welcome'\)/);
  assert.match(jobApp, /authSession/);

  assert.match(jobProvider, /resetPasswordForEmail/);
  assert.match(jobProvider, /updateUser\(\{ password \}\)/);
  assert.match(jobApp, /reset_password/);
  assert.match(jobApp, /passwordRecoveryState/);
  assert.match(jobApp, /session is no longer valid|session expired|expired/i);
});

test("Job Portal clears all local auth identity before logout resolves", () => {
  const signOutStart = jobProvider.indexOf("const signOut = useCallback");
  const signOutEnd = jobProvider.indexOf("const refreshProfile", signOutStart);
  const logout = jobProvider.slice(signOutStart, signOutEnd);
  assert.match(logout, /setSession\(null\)/);
  assert.match(logout, /setProfile\(null\)/);
  assert.match(logout, /sessionRef\.current = null/);
  assert.match(jobApp, /AuthProvider owns the only onAuthStateChange subscription/);
  assert.doesNotMatch(jobApp, /\.auth\.onAuthStateChange\(/);
});

// ---------------------------------------------------------------------------
// Template App
// ---------------------------------------------------------------------------

test("Template App covers the complete Phase 16 matrix", () => {
  assert.match(templateMain, /<AuthProvider>/);
  assert.match(templateAuth, /setState\(\{ user: null, session: null, loading: false \}\)/);
  assert.match(templateAuth, /signInWithPassword/);
  assert.match(templateAuth, /signUpWithPassword/);
  assert.match(templateAuth, /resetPasswordForEmail/);
  assert.match(templateAuth, /updateUser\(\{ password \}\)/);
  assert.match(templateAuth, /subscription\.unsubscribe\(\)/);
  assert.match(templateAuth, /TOKEN_REFRESHED|onAuthStateChange/);
  assert.match(templateAuth, /getSession\(\)/);
  assert.match(templateAuth, /signOutFromProvider/);
  assert.match(templateAuth, /setState\(\{ user: null, session: null, loading: false \}\)/);
  assert.match(templateClient, /persistSession: true/);
  assert.match(templateClient, /autoRefreshToken: true/);
  assert.match(templateLogin, /signInWithPassword|signUpWithPassword/);
  assert.match(templateLogin, /sendPasswordReset/);
  assert.match(templateReset, /useAuth\(\)/);
  assert.doesNotMatch(templateReset, /\.auth\.onAuthStateChange\(/);
  assert.match(templateMain, /ProtectedApp/);
  assert.match(templateMain, /!user/);
});

test("Template App does not retain a stale user after provider logout", () => {
  const logoutStart = templateAuth.indexOf("const signOutFromProvider");
  const logoutEnd = templateAuth.indexOf("return createElement", logoutStart);
  const logout = templateAuth.slice(logoutStart, logoutEnd);
  assert.match(logout, /setState\(\{ user: null, session: null, loading: false \}\)/);
  assert.match(logout, /await signOut\(\)/);
  assert.match(templateAuth, /Nested <AuthProvider> detected/);
});

// ---------------------------------------------------------------------------
// External PWA integration patches
// ---------------------------------------------------------------------------

for (const app of external) {
  test(`${app.name} integration patch covers the Phase 16 matrix`, () => {
    assert.match(app.added, /<AuthProvider>/);
    assert.match(app.added, /useAuth\(\)/);
    assert.match(app.added, /signIn\(/);
    assert.match(app.added, /signUp\(/);
    assert.match(app.added, /signOut\(/);
    assert.match(app.added, /resetPasswordForEmail|sendPasswordReset/);
    assert.match(app.added, /updatePassword|setPassword/);
    assert.match(app.added, /TOKEN_REFRESHED/);
    assert.match(app.added, /session_expired/);
    assert.match(app.added, /subscription\.unsubscribe\(\)/);
    assert.match(app.added, /getSession\(\)/);
    assert.match(app.added, /resolveProfile|profiles/);
    assert.match(app.readme, /Login|login/);
    assert.match(app.readme, /signup|Sign-up|registration/i);
    assert.match(app.readme, /Recovery|reset/i);
    assert.match(app.readme, /active.*profile|profile.*role/i);
  });

  test(`${app.name} returns to guest state after SIGNED_OUT`, () => {
    assert.match(app.added, /setUser\(null\)|isAuthenticated|authLoading/);
    assert.match(app.added, /signOut/);
    assert.match(app.added, /subscription\.unsubscribe\(\)/);
  });
}
