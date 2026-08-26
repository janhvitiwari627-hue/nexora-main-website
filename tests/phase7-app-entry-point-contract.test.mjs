// PHASE 7 — APPLICATION ENTRY POINT.
//
// Every application in this repository mounts its auth boundary exactly once
// at its real React mount point, with no nested duplicate providers:
//
//   * Main Website (Next)  app/page.tsx + app/[...path]/page.tsx → NexoraRoot
//                          → <AuthProvider><NexoraApp/></AuthProvider>
//   * Job Portal (Vite)    job-portal/src/main.tsx
//                          → <AuthProvider><App/></AuthProvider>
//   * Beauty Industry      beauty-industry/src/main.tsx — mounts the app; the
//                          app owns ONE PKCE Supabase auth boundary scoped to
//                          its /distributors-beauty-industry/ mount
//                          (see beauty-industry/src/lib/supabase.ts).
//   * Template App         vendored, self-contained AuthModalProvider by
//                          operator-approved design (no @nexora/auth).
//
// useAuth() is available throughout each authenticated app, and location
// synchronization initializes only after authentication is established.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const nexoraRoot = await read("app/NexoraRoot.tsx");
const homePage = await read("app/page.tsx");
const routedPage = await read("app/[...path]/page.tsx");
const nexoraApp = await read("app/nexora-app.tsx");

const jpMain = await read("job-portal/src/main.tsx");
const jpApp = await read("job-portal/src/App.tsx");
const jpProvider = await read("job-portal/src/auth/AuthProvider.tsx");
const jpLocationHook = await read("job-portal/src/hooks/useLocationSync.ts");

const beautyMain = await read("beauty-industry/src/main.tsx");
const beautyApp = await read("beauty-industry/src/App.tsx");
const beautyAuth = await read("beauty-industry/src/lib/supabase.ts");

const templateMain = await read("integration-packages/template-app/files/src/main.tsx");

// ---------------------------------------------------------------------------
// Main Website
// ---------------------------------------------------------------------------

test("Main Website wraps the app exactly once at NexoraRoot", () => {
  assert.equal(nexoraRoot.split("<AuthProvider").length - 1, 1);
  assert.match(nexoraRoot, /<AuthProvider clientOptions=\{websiteClientOptions\}>\s*<NexoraApp/);
  // Both route entry points funnel through the single boundary.
  assert.match(homePage, /<NexoraRoot/);
  assert.match(routedPage, /<NexoraRoot/);
  // The app itself never nests another provider.
  assert.doesNotMatch(nexoraApp, /<AuthProvider/);
});

test("Main Website initializes location sync from the authenticated session", () => {
  assert.match(nexoraApp, /useLocation\(\{[\s\S]{0,200}userId: session\?\.user\?\.id \?\? null/);
  assert.match(nexoraApp, /syncPrivateLocation: true/);
});

// ---------------------------------------------------------------------------
// Job Portal
// ---------------------------------------------------------------------------

test("Job Portal wraps the app exactly once at src/main.tsx", () => {
  assert.equal(jpMain.split("<AuthProvider>").length - 1, 1);
  assert.match(jpMain, /<AuthProvider>\s*<App \/>\s*<\/AuthProvider>/);
  assert.match(jpMain, /createRoot\(document\.getElementById\('root'\)!\)/);
  // No other file in the Sub-App renders a provider.
  assert.doesNotMatch(jpApp, /<AuthProvider/);
});

test("Job Portal guards against nested duplicate providers", () => {
  assert.match(jpProvider, /Nested <AuthProvider> detected/);
  assert.match(jpProvider, /const parentContext = useContext\(AuthContext\)/);
});

test("useAuth() is exported and usable throughout the Job Portal", () => {
  assert.match(jpProvider, /export function useAuth\(\): AuthContextValue/);
  assert.match(jpProvider, /useAuth must be used within an <AuthProvider>/);
  // Consumers exist below the provider (location sync at minimum).
  assert.match(jpLocationHook, /useAuth\(\)/);
});

test("Job Portal location sync starts only after authentication", () => {
  assert.match(jpApp, /useLocationSync\(\);/);
  assert.equal(jpApp.split("useLocationSync();").length - 1, 1);
  assert.match(jpLocationHook, /auto: Boolean\(userId\)/);
});

// ---------------------------------------------------------------------------
// Beauty Industry + Template App (architecture-mandated exceptions)
// ---------------------------------------------------------------------------

test("Beauty Industry owns a single PKCE auth boundary scoped to its mount", () => {
  // The mount point itself stays provider-free; the boundary lives in App.tsx.
  assert.doesNotMatch(beautyMain, /AuthProvider/);
  assert.match(beautyMain, /<App \/>/);
  assert.equal(beautyApp.split("<SupabaseProvider").length - 1, 1);
  // PKCE client on the shared project, with auth routes scoped to the static
  // mount so deep links and OAuth callbacks stay inside the SPA.
  assert.match(beautyAuth, /flowType: 'pkce'/);
  assert.match(beautyAuth, /detectSessionInUrl: true/);
  assert.match(beautyAuth, /APP_MOUNT_BASE\s*=\s*['"]\/distributors-beauty-industry['"]/);
  assert.match(beautyAuth, /AUTH_LOGIN_PATH\s*=\s*[`'"][^`'"]*auth\/login/);
  assert.match(beautyAuth, /redirectToLogin/);
});

test("Template App keeps its single self-contained auth boundary", () => {
  assert.equal(templateMain.split("<AuthModalProvider>").length - 1, 1);
  assert.doesNotMatch(templateMain, /@nexora\/auth/);
});
