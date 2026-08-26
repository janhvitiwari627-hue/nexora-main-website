/**
 * Phase 15 — mounting verification.
 *
 * These contracts cover the browser entry points for every app carried by this
 * repository. They intentionally do not claim that a live Supabase request
 * succeeded: they prove that each app has a React mount, one auth owner where
 * auth exists, an initialized router, validated client configuration, and a
 * leak-free location/auth lifecycle.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const mainRoot = await read("app/NexoraRoot.tsx");
const mainPage = await read("app/page.tsx");
const mainCatchAll = await read("app/[...path]/page.tsx");
const mainApp = await read("app/nexora-app.tsx");
const authPackageClient = await read("packages/auth/src/client.ts");
const authPackageEnv = await read("packages/auth/src/env.ts");
const authPackageProvider = await read("packages/auth/src/AuthProvider.tsx");
const locationWatcher = await read("packages/location/src/gpsWatcher.ts");
const locationHook = await read("packages/location/src/useLocation.ts");

const jobMain = await read("job-portal/src/main.tsx");
const jobApp = await read("job-portal/src/App.tsx");
const jobProvider = await read("job-portal/src/auth/AuthProvider.tsx");
const jobSupabase = await read("job-portal/src/lib/supabase.ts");
const jobRouting = await read("job-portal/src/routing.ts");

const beautyMain = await read("beauty-industry/src/main.tsx");
const beautyApp = await read("beauty-industry/src/App.tsx");
const beautyAuth = await read("beauty-industry/src/lib/supabase.ts");

const templateMain = await read("integration-packages/template-app/files/src/main.tsx");
const templateAuth = await read("integration-packages/template-app/files/src/lib/useAuth.ts");
const templateSupabase = await read("integration-packages/template-app/files/src/lib/supabaseClient.ts");
const templateReset = await read("integration-packages/template-app/files/src/components/PasswordResetPage.tsx");

const mountMessage = /App mounted successfully/;
const listenerCall = /\.auth\.onAuthStateChange\(/g;

function executable(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

// ---------------------------------------------------------------------------
// React roots and mount markers
// ---------------------------------------------------------------------------

test("every browser app has a guarded React mount and reports successful mount", () => {
  assert.match(mainRoot, mountMessage, "Main Website");
  assert.match(mainRoot, /<AuthProvider clientOptions=\{websiteClientOptions\}>/, "Main Website provider boundary");
  assert.match(mainPage, /<NexoraRoot/, "Main Website home entry");
  assert.match(mainCatchAll, /<NexoraRoot/, "Main Website route entry");

  for (const [name, source, markerSource] of [
    ["Job Portal", jobMain, jobApp],
    ["Beauty Industry", beautyMain, beautyApp],
    ["Template App", templateMain, templateMain],
  ]) {
    assert.match(source, /document\.getElementById\(['"]root['"]\)/, `${name} must look up #root`);
    assert.match(source, /React root element #root is missing/, `${name} must fail clearly when #root is absent`);
    assert.match(source, /createRoot\(/, `${name} must call createRoot`);
    assert.match(markerSource, mountMessage, `${name} must expose the mount verification marker`);
  }
});

test("auth providers mount exactly once in apps that own auth", () => {
  assert.equal((mainRoot.match(/<AuthProvider\b/g) ?? []).length, 1, "Main Website");
  assert.equal((jobMain.match(/<AuthProvider>/g) ?? []).length, 1, "Job Portal");
  assert.equal((templateMain.match(/<AuthProvider>/g) ?? []).length, 1, "Template App");
  assert.equal((beautyMain.match(/<AuthProvider\b/g) ?? []).length, 0, "Beauty Industry is intentionally provider-free");
  assert.match(templateMain, /<AuthProvider>\s*<AuthModalProvider>/, "Template App auth boundary");
});

// ---------------------------------------------------------------------------
// Auth listener/client ownership
// ---------------------------------------------------------------------------

test("each auth-owning app has one listener owner and every listener cleans up", () => {
  assert.equal((executable(authPackageProvider).match(listenerCall) ?? []).length, 1, "Main Website auth provider");
  assert.equal((executable(jobProvider).match(listenerCall) ?? []).length, 1, "Job Portal auth provider");
  assert.equal((executable(templateAuth).match(listenerCall) ?? []).length, 1, "Template App auth provider");

  assert.doesNotMatch(executable(mainApp), listenerCall, "Main Website shell must not subscribe");
  assert.doesNotMatch(executable(jobApp), listenerCall, "Job Portal shell must not subscribe");
  assert.doesNotMatch(executable(templateReset), listenerCall, "Template reset screen must consume provider state");

  for (const [name, source] of [
    ["Main Website", authPackageProvider],
    ["Job Portal", jobProvider],
    ["Template App", templateAuth],
  ]) {
    assert.match(source, /subscription\.unsubscribe\(\)/, `${name} auth listener cleanup`);
  }
});

test("Supabase clients are validated and created only from public build-time env", () => {
  assert.match(authPackageClient, /getSupabaseClient/);
  assert.match(authPackageClient, /createClient\(/);
  assert.match(authPackageEnv, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(authPackageEnv, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(authPackageClient, /storageKey: NEXORA_STORAGE_KEY/);

  assert.match(jobSupabase, /createClient\(/);
  assert.match(jobSupabase, /import\.meta\.env\.VITE_SUPABASE_URL/);
  assert.match(jobSupabase, /import\.meta\.env\.VITE_SUPABASE_ANON_KEY/);
  assert.match(jobSupabase, /isSupabaseConfigured/);

  assert.match(templateSupabase, /createClient\(/);
  assert.match(templateSupabase, /VITE_SUPABASE_URL/);
  assert.match(templateSupabase, /VITE_SUPABASE_ANON_KEY/);
  assert.match(templateSupabase, /isSupabaseConfigured/);

  // The marketplace owns its Supabase client; it degrades to a local demo
  // store when the Vite env is undefined and scopes auth to its mount.
  assert.match(beautyAuth, /createClient\(/);
  assert.match(beautyAuth, /import\.meta\.env\.VITE_SUPABASE_URL/);
  assert.match(beautyAuth, /isSupabaseConfigured/);
  assert.match(beautyAuth, /APP_MOUNT_BASE\s*=\s*['"]\/distributors-beauty-industry['"]/);
  assert.match(beautyAuth, /AUTH_LOGIN_PATH\s*=\s*[`'"][^`'"]*auth\/login/);
});

// ---------------------------------------------------------------------------
// Routers, hooks, and leak guards
// ---------------------------------------------------------------------------

test("every app initializes its navigation owner", () => {
  assert.match(mainApp, /const \[path, setPath\] = useState\(initialPath\)/);
  assert.match(mainApp, /window\.addEventListener\("popstate"/);
  assert.match(mainApp, /isPortalPath\(path\)/);

  assert.match(jobRouting, /resolveJobPortalRoute/);
  assert.match(jobApp, /resolveJobPortalRoute\(\)/);
  assert.match(jobApp, /window\.addEventListener\('popstate'/);

  assert.match(templateMain, /function RootRouter\(\)/);
  assert.match(templateMain, /window\.location\.pathname/);
  assert.match(templateMain, /setRoute\(/);

  // Beauty Industry is a screen-router/catalog surface rather than a URL router.
  assert.match(beautyApp, /useState<[^>]*'explore'/);
  assert.match(beautyApp, /setCurrentScreen/);
});

test("GPS tracking is singleton, watch-only, and does not loop on auth/location changes", () => {
  assert.match(locationWatcher, /private watchId: number \| null = null/);
  assert.match(locationWatcher, /if \(this\.watchId !== null\)/);
  assert.match(locationWatcher, /navigator\.geolocation\.watchPosition\(/);
  assert.doesNotMatch(executable(locationWatcher), /getCurrentPosition\(/);
  assert.match(locationWatcher, /navigator\.geolocation\.clearWatch/);

  assert.match(locationHook, /locationService\.subscribe\(setState\)/);
  assert.match(locationHook, /sharedLocationSync\.bind\(client, userId\)/);
  assert.match(locationHook, /sharedLocationSync\.unbind\(userId\)/);
  assert.match(jobApp, /useLocationSync\(\);/);
  assert.equal((jobApp.match(/useLocationSync\(\);/g) ?? []).length, 1);
  assert.match(mainApp, /userId: session\?\.user\?\.id \?\? null/);
  assert.match(mainApp, /armedForUser\.current === userId/);
  assert.match(jobApp, /AuthProvider owns the only onAuthStateChange subscription/);
});

test("mount diagnostics are StrictMode-safe and do not add state/provider loops", () => {
  for (const [name, source] of [
    ["Main Website", mainRoot],
    ["Job Portal", jobApp],
    ["Beauty Industry", beautyApp],
    ["Template App", templateMain],
  ]) {
    assert.match(source, /let appMountLogged = false/ , `${name} mount guard`);
    assert.match(source, /if \(appMountLogged\) return;/, `${name} mount guard`);
    assert.match(source, /useEffect\([\s\S]*?console\.info\(['"]App mounted successfully['"]\)/, `${name} mount effect`);
  }
  assert.match(jobProvider, /Nested <AuthProvider> detected/);
  assert.match(templateAuth, /Nested <AuthProvider> detected/);
});
