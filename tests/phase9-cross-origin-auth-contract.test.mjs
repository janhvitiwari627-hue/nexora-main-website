// PHASE 9 — CROSS-ORIGIN AUTH.
//
// The canonical Main Website PKCE redirect architecture
// (packages/auth/src/redirects.ts) is the ONLY cross-origin session
// mechanism:
//
//   Sub-App → Main Website /auth/login → Supabase auth → PKCE callback
//     → validated returnTo → destination app → destination establishes
//     its OWN session (own code_verifier, own storage).
//
// Two kinds of test:
//   * behavioural — the redirect policy is transpiled and EXECUTED against
//     open-redirect and origin-allowlist attacks;
//   * static      — no surface in the repo transports tokens through query
//     parameters, URL fragments, cross-domain localStorage or cookies.
//
// Runs with no network access and no credentials.

import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

const MAIN = "https://nexora-main-website.vercel.app";
const CUSTOMER = "https://custmer-fresh-app.vercel.app";

async function loadRedirects() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-phase9-"));
  await mkdir(dir, { recursive: true });
  for (const file of ["roles.ts", "redirects.ts"]) {
    const source = await readFile(new URL(`../packages/auth/src/${file}`, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    await writeFile(
      join(dir, file.replace(/\.ts$/, ".mjs")),
      outputText.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"'),
    );
  }
  return import(`${new URL(`file://${dir}/redirects.mjs`)}`);
}

const redirects = await loadRedirects();

// ---------------------------------------------------------------------------
// 1. Behavioural — open redirects are impossible
// ---------------------------------------------------------------------------

test("safeReturnPath defeats every classic open-redirect shape", () => {
  const { safeReturnPath } = redirects;
  assert.equal(safeReturnPath("//evil.com"), "/");
  assert.equal(safeReturnPath("https://evil.com/phish"), "/");
  assert.equal(safeReturnPath("/\\evil.com"), "/");
  assert.equal(safeReturnPath("/ok\\..\\admin"), "/");
  assert.equal(safeReturnPath("  //evil.com  "), "/");
  assert.equal(safeReturnPath(null), "/");
  // Legitimate deep links keep their query but lose any fragment.
  assert.equal(safeReturnPath("/app/customer?tab=bookings#frag"), "/app/customer?tab=bookings");
});

test("safeRedirectUrl only ever releases approved Nexora origins", () => {
  const { safeRedirectUrl } = redirects;
  const opts = { currentOrigin: MAIN };
  // Unknown origin → dropped entirely.
  assert.equal(safeRedirectUrl("https://evil.com/phish", opts), null);
  assert.equal(safeRedirectUrl("https://nexora-main-website.vercel.app.evil.com/", opts), null);
  // Plain http to a remote host → dropped even if the host looks right.
  assert.equal(safeRedirectUrl(`http://${CUSTOMER.replace("https://", "")}/`, opts), null);
  // Approved origin → normalized, fragment stripped (tokens can ride fragments).
  assert.equal(safeRedirectUrl(`${CUSTOMER}/home#access_token=x`, opts), `${CUSTOMER}/home`);
  // Relative path → resolved against the current origin only.
  assert.equal(safeRedirectUrl("/app/owner", opts), `${MAIN}/app/owner`);
  // Protocol-relative smuggling → rejected.
  assert.equal(safeRedirectUrl("//evil.com/x", opts), null);
});

test("the allowlist is HTTPS-only (loopback http reserved for dev)", () => {
  for (const origin of redirects.allowedAuthOrigins(MAIN)) {
    assert.ok(
      /^https:\/\//.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(origin),
      origin,
    );
  }
  for (const origin of redirects.DEFAULT_ALLOWED_AUTH_ORIGINS) {
    assert.match(origin, /^https:\/\//);
  }
});

test("buildCallbackUrl / buildLoginUrl implement the canonical pipeline", () => {
  const { buildCallbackUrl, buildLoginUrl, AUTH_ROUTES } = redirects;

  // A hostile returnTo never survives into the callback.
  const hostile = new URL(buildCallbackUrl({ returnTo: "https://evil.com/x", origin: MAIN }));
  assert.equal(hostile.searchParams.get("returnTo"), null);

  // Same-origin destinations travel as a path…
  const sameOrigin = new URL(buildCallbackUrl({ returnTo: `${MAIN}/app/customer`, origin: MAIN }));
  assert.equal(sameOrigin.searchParams.get("returnTo"), "/app/customer");

  // …and an approved cross-origin destination as a full validated URL.
  const cross = new URL(buildCallbackUrl({ returnTo: `${CUSTOMER}/home`, origin: MAIN }));
  assert.equal(cross.searchParams.get("returnTo"), `${CUSTOMER}/home`);
  assert.equal(cross.pathname, AUTH_ROUTES.callback);

  // Sub-App → central login on the Main Website, carrying its own return URL.
  const login = new URL(
    buildLoginUrl({ returnTo: `${CUSTOMER}/bookings`, origin: CUSTOMER, centralOrigin: MAIN }),
  );
  assert.equal(login.origin, MAIN);
  assert.equal(login.pathname, AUTH_ROUTES.login);
  assert.equal(login.searchParams.get("returnTo"), `${CUSTOMER}/bookings`);

  // No token of any kind ever appears in a constructed URL.
  for (const url of [hostile, sameOrigin, cross, login]) {
    assert.doesNotMatch(url.toString(), /token/i);
  }
});

test("the Supabase Redirect URL allowlist covers callback + recovery per origin", () => {
  const list = redirects.supabaseRedirectAllowlist();
  assert.ok(list.includes(`${MAIN}/auth/callback`));
  assert.ok(list.includes(`${MAIN}/auth/reset-password`));
  assert.ok(list.includes(`${CUSTOMER}/auth/callback`));
  for (const url of list) assert.match(url, /^https:\/\//);
});

// ---------------------------------------------------------------------------
// 2. Static — forbidden token-transport patterns exist NOWHERE
// ---------------------------------------------------------------------------

function collectSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push({ path: full, source: readFileSync(full, "utf8") });
  }
  return out;
}

const surfaces = [
  "app",
  "packages/auth/src",
  "packages/location/src",
  "job-portal/src",
  "beauty-industry/src",
  "integration-packages/template-app/files/src",
].flatMap((dir) => collectSources(fileURLToPath(new URL(`../${dir}`, import.meta.url))));

test("no surface puts access/refresh tokens into URLs, cookies or foreign storage", () => {
  assert.ok(surfaces.length > 50, "the scan must actually cover the repo surfaces");
  for (const { path, source } of surfaces) {
    assert.doesNotMatch(source, /[?&#](access|refresh)_token=/, `${path} builds a token-bearing URL`);
    assert.doesNotMatch(source, /document\.cookie/, `${path} touches cookies directly`);
    assert.doesNotMatch(source, /\.auth\.setSession\(/, `${path} injects tokens into a session manually`);
    assert.doesNotMatch(
      source,
      /localStorage\.setItem\([^)]*(access_token|refresh_token|sb-)/i,
      `${path} copies Supabase session storage`,
    );
    assert.doesNotMatch(source, /postMessage\(/, `${path} shares state via postMessage`);
  }
});

test("sub-apps establish their OWN sessions — PKCE everywhere, handoff by returnTo", async () => {
  const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");
  // Job Portal: canonical PKCE client; OAuth redirect stays on its own origin.
  const jpClient = await read("job-portal/src/lib/supabase.ts");
  assert.match(jpClient, /flowType: 'pkce'/);
  assert.match(jpClient, /detectSessionInUrl: true/);
  const jpBackend = await read("job-portal/src/services/backend.ts");
  assert.match(jpBackend, /redirectTo: appBaseUrl\(\)/);
  // Beauty Industry: same-origin relative returnTo handoff, no client at all.
  const beauty = await read("beauty-industry/src/auth.ts");
  assert.match(beauty, /\/login\?returnTo=\$\{encodeURIComponent\(/);
  assert.doesNotMatch(beauty, /createClient|access_token/);
  // Main Website callback releases only validated destinations.
  const site = await read("app/nexora-app.tsx");
  assert.match(site, /safeRedirectUrl\(rawReturnTo\)/);
  assert.match(site, /destinationForVerifiedRole\(/);
});
