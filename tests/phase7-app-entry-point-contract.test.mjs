// PHASE 7 — APPLICATION ENTRY POINT.
//
// Every application in this repository mounts its auth boundary exactly once
// at its real React mount point, with no nested duplicate providers:
//
//   * Main Website (Next)  app/page.tsx + app/[...path]/page.tsx → NexoraRoot
//                          → <AuthProvider><NexoraApp/></AuthProvider>
//   * Job Portal (Vite)    job-portal/src/main.tsx
//                          → <AuthProvider><App/></AuthProvider>
//   * Beauty Industry      beauty-industry/src/main.tsx — intentionally NO
//                          provider: it is a static catalog that hands off to
//                          the canonical Nexora auth routes and must never
//                          mint its own session (see beauty-industry/src/auth.ts).
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
const beautyAuth = await read("beauty-industry/src/auth.ts");

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

test("Beauty Industry stays a provider-free static catalog with canonical handoff", () => {
  assert.doesNotMatch(beautyMain, /AuthProvider/);
  assert.match(beautyMain, /<App \/>/);
  // All sign-in/sign-up goes to the canonical Nexora routes.
  assert.match(beautyAuth, /redirectToNexoraLogin/);
  assert.match(beautyAuth, /\/login\?returnTo=/);
});

test("Template App keeps its single self-contained auth boundary", () => {
  assert.equal(templateMain.split("<AuthModalProvider>").length - 1, 1);
  assert.doesNotMatch(templateMain, /@nexora\/auth/);
});
