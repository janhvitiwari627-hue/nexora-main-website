import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../packages/auth/src/service.ts", import.meta.url), "utf8");
const session = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");
const portalOrigins = await readFile(new URL("../config/portalOrigins.ts", import.meta.url), "utf8");
const redirects = await readFile(new URL("../packages/auth/src/redirects.ts", import.meta.url), "utf8");

const TEMPLATE_APP_ORIGIN = "https://final-new-app-templete.vercel.app";

test("Main Website uses only Next public Supabase variables", () => {
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(
    nextConfig,
    /NEXT_PUBLIC_SUPABASE_URL:\s*publicSupabaseUrl/,
    "Next config must explicitly forward the public URL into the Turbopack client bundle",
  );
  assert.match(
    nextConfig,
    /NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*publicSupabaseAnonKey/,
    "Next config must explicitly forward the public anon key into the Turbopack client bundle",
  );
  assert.match(
    nextConfig,
    /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY[\s\S]*process\.env\.VITE_SUPABASE_ANON_KEY[\s\S]*process\.env\.VITE_SUPABASE_PUBLISHABLE_KEY/,
    "Vercel may reuse the approved Vite anon or publishable key as a build-only alias",
  );
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY):\s*["']["']/);
  assert.doesNotMatch(app, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/);
});

test("password auth and permanent profile role contract stay aligned", () => {
  assert.match(app, /await signIn\(\{ email: trimmedEmail, password \}\)/);
  assert.match(app, /await signUp\(\{/);
  assert.match(app, /normalizeSignupRole\(role\)/);
  assert.match(app, /requireAuth\(\)/);
  assert.doesNotMatch(app, /profiles[\s\S]*\.upsert/);
  assert.match(session, /signup_role: role/);
  assert.match(service, /requireActiveProfile/);
  assert.match(service, /profiles\.platform_role/);
});

test("/app/template is wired to the Template App even without an env var", () => {
  // A built-in default keeps /app/template working on a deployment that never
  // configured NEXORA_TEMPLATE_PWA_ORIGIN.
  assert.match(portalOrigins, /export const DEFAULT_TEMPLATE_ORIGIN/);
  // Escape the origin once — a RegExp built from a string takes single
  // backslashes, so `\\.` here is the literal-dot escape, not a double escape.
  assert.match(portalOrigins, new RegExp(`template:\\s*"${TEMPLATE_APP_ORIGIN.replace(/\./g, "\\.")}"`));
  // The environment variable still takes precedence over the default.
  assert.match(portalOrigins, /NEXORA_TEMPLATE_PWA_ORIGIN/);
  assert.match(
    portalOrigins,
    /if \(configured\.length === 0\)[\s\S]*DEFAULT_PORTAL_ORIGINS\[portal\]/,
    "the built-in origin must only apply when no variable is configured",
  );
  // next.config turns the resolved origin into the /app/template redirects.
  assert.match(nextConfig, /source: "\/app\/template"[\s\S]*portalOrigins\.template/);
  assert.match(nextConfig, /source: "\/app\/template\/:path\*"[\s\S]*portalOrigins\.template/);
});

test("the Template App origin may receive a cross-origin PKCE redirect", () => {
  assert.match(redirects, /DEFAULT_ALLOWED_AUTH_ORIGINS[\s\S]*final-new-app-templete\.vercel\.app/);
  // Only https origins are ever hard-coded into the allowlist.
  for (const [, origin] of redirects
    .split("DEFAULT_ALLOWED_AUTH_ORIGINS")[1]
    .split("];")[0]
    .matchAll(/"([^"]+)"/g)) {
    assert.match(origin, /^https:\/\//, origin);
  }
});
