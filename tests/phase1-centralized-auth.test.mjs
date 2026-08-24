// PHASE 1 — Centralized Supabase Auth & Environment Configuration.
//
// Two kinds of test live here:
//   * behavioural — the pure logic modules (roles, redirects, errors, env) are
//     transpiled and executed, so the rules are actually exercised.
//   * contract    — static assertions over the SQL migration and the wiring
//     that cannot be executed without a live database.
//
// Runs with no network access and no Supabase credentials.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const SRC = new URL("../packages/auth/src/", import.meta.url);

/**
 * Transpile the TypeScript sources to a temp dir so the logic can be imported
 * and executed. Only the dependency-free modules are needed.
 */
async function loadAuthModules() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-auth-"));
  await mkdir(dir, { recursive: true });
  const files = ["env.ts", "roles.ts", "errors.ts", "redirects.ts"];
  for (const file of files) {
    const source = await readFile(new URL(file, SRC), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    await writeFile(join(dir, file.replace(/\.ts$/, ".mjs")), outputText.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"'));
  }
  const load = (name) => import(pathToFileURL(join(dir, `${name}.mjs`)).href);
  return {
    env: await load("env"),
    roles: await load("roles"),
    errors: await load("errors"),
    redirects: await load("redirects"),
  };
}

const mods = await loadAuthModules();

const migration = await readFile(
  new URL("../supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql", import.meta.url),
  "utf8",
);
const clientSrc = await readFile(new URL("../packages/auth/src/client.ts", import.meta.url), "utf8");
const providerSrc = await readFile(new URL("../packages/auth/src/AuthProvider.tsx", import.meta.url), "utf8");
const sessionSrc = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");
const serviceSrc = await readFile(new URL("../packages/auth/src/service.ts", import.meta.url), "utf8");
const appSrc = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const websiteClient = await readFile(new URL("../app/lib/supabaseClient.ts", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// 1. Same Supabase project everywhere
// ---------------------------------------------------------------------------

test("1.1 the shared project ref is the single source of truth", () => {
  assert.equal(mods.env.SUPABASE_PROJECT_REF, "qwaehqsmodekbgvnaavz");
  assert.equal(mods.env.EXPECTED_SUPABASE_URL, "https://qwaehqsmodekbgvnaavz.supabase.co");
  assert.equal(mods.env.EXPECTED_SUPABASE_HOSTNAME, "qwaehqsmodekbgvnaavz.supabase.co");
});

test("1.2 a foreign Supabase project is rejected, preventing a forked user directory", () => {
  const foreign = { url: "https://someotherproject.supabase.co", anonKey: "sb_publishable_abc123", source: "explicit" };
  const result = mods.env.validateSupabaseEnv(foreign);
  assert.equal(result.valid, false);
  assert.ok(result.problems.includes("wrong-project"));
  // Explicitly opting out is possible for forks/tests only.
  assert.equal(mods.env.validateSupabaseEnv(foreign, { strictProject: false }).valid, true);
});

test("1.3 a valid shared-project configuration passes", () => {
  const good = {
    url: "https://qwaehqsmodekbgvnaavz.supabase.co",
    anonKey: "sb_publishable_abc123",
    source: "explicit",
  };
  assert.equal(mods.env.validateSupabaseEnv(good).valid, true);
});

test("1.4 missing halves are reported individually", () => {
  const noKey = mods.env.validateSupabaseEnv({
    url: "https://qwaehqsmodekbgvnaavz.supabase.co",
    anonKey: "",
    source: "none",
  });
  assert.ok(noKey.problems.includes("missing-anon-key"));
  assert.match(noKey.message, /SUPABASE_ANON_KEY is missing/);

  const noUrl = mods.env.validateSupabaseEnv({ url: "", anonKey: "k", source: "none" });
  assert.ok(noUrl.problems.includes("missing-url"));
});

test("1.5 a service-role key is refused so it can never ship to a browser", () => {
  // {"role":"service_role"} — a fake, non-functional token used only to prove
  // the detector works. It is not a credential.
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  const fake = `eyJhbGciOiJIUzI1NiJ9.${payload}.notarealsignature`;
  const result = mods.env.validateSupabaseEnv({
    url: "https://qwaehqsmodekbgvnaavz.supabase.co",
    anonKey: fake,
    source: "explicit",
  });
  assert.equal(result.valid, false);
  assert.ok(result.problems.includes("service-role-key"));
});

test("1.6 diagnostics never expose the full anon key", () => {
  const described = mods.env.describeSupabaseEnv({
    url: "https://qwaehqsmodekbgvnaavz.supabase.co",
    anonKey: "sb_publishable_super_secret_value",
    source: "explicit",
  });
  assert.equal(described.hasAnonKey, true);
  assert.doesNotMatch(described.anonKeyFingerprint, /super_secret/);
});

// ---------------------------------------------------------------------------
// 2. Roles — new vocabulary plus backward-compatible aliases
// ---------------------------------------------------------------------------

test("2.1 all five platform roles exist", () => {
  assert.deepEqual(
    [...mods.roles.PLATFORM_ROLES].sort(),
    ["admin", "business_user", "customer", "delivery_partner", "growth_partner"],
  );
});

test("2.2 product aliases normalize to canonical live values", () => {
  const { normalizeRole } = mods.roles;
  assert.equal(normalizeRole("user"), "customer");
  assert.equal(normalizeRole("shop_owner"), "business_user");
  assert.equal(normalizeRole("shop-owner"), "business_user");
  assert.equal(normalizeRole("owner"), "business_user");
  assert.equal(normalizeRole("delivery_partner"), "delivery_partner");
  assert.equal(normalizeRole("rider"), "delivery_partner");
  assert.equal(normalizeRole("growth-partner"), "growth_partner");
  assert.equal(normalizeRole("  ADMIN  "), "admin");
  assert.equal(normalizeRole("superuser"), null);
  assert.equal(normalizeRole(undefined), null);
});

test("2.3 existing canonical roles are preserved unchanged", () => {
  for (const role of ["customer", "business_user", "growth_partner"]) {
    assert.equal(mods.roles.normalizeRole(role), role);
  }
});

test("2.4 admin is never grantable through public signup", () => {
  assert.equal(mods.roles.normalizeSignupRole("admin"), "customer");
  assert.equal(mods.roles.normalizeSignupRole("administrator"), "customer");
  assert.equal(mods.roles.normalizeSignupRole("staff"), "customer");
  assert.ok(!mods.roles.SELF_SERVICE_SIGNUP_ROLES.includes("admin"));
});

test("2.5 an unknown signup role falls back to the least privilege", () => {
  assert.equal(mods.roles.normalizeSignupRole("root"), "customer");
  assert.equal(mods.roles.normalizeSignupRole(""), "customer");
  assert.equal(mods.roles.normalizeSignupRole("shop_owner"), "business_user");
});

test("2.6 every role maps to a home path and a query slug", () => {
  for (const role of mods.roles.PLATFORM_ROLES) {
    assert.match(mods.roles.homePathForRole(role), /^\/app\//);
    assert.ok(mods.roles.roleQuerySlug(role).length > 0);
  }
  // The three live portals keep their existing same-origin mounts.
  assert.equal(mods.roles.homePathForRole("customer"), "/app/customer");
  assert.equal(mods.roles.homePathForRole("business_user"), "/app/owner");
  assert.equal(mods.roles.homePathForRole("growth_partner"), "/app/partner");
});

// ---------------------------------------------------------------------------
// 3. Cross-origin redirect / PKCE safety
// ---------------------------------------------------------------------------

test("3.1 open-redirect attempts are rejected", () => {
  const { safeRedirectUrl } = mods.redirects;
  for (const evil of [
    "https://evil.example.com/steal",
    "http://evil.example.com",
    "javascript:alert(1)",
    "//evil.example.com",
    "data:text/html,<script>",
    "ftp://evil.example.com",
  ]) {
    assert.equal(safeRedirectUrl(evil, { currentOrigin: "https://nexora-main-website.vercel.app" }), null, evil);
  }
});

test("3.2 allowlisted Nexora origins are accepted for cross-origin handoff", () => {
  const { safeRedirectUrl } = mods.redirects;
  const target = "https://remix-final-salon-app.vercel.app/bookings";
  assert.equal(
    safeRedirectUrl(target, { currentOrigin: "https://nexora-main-website.vercel.app" }),
    target,
  );
});

test("3.3 relative paths are sanitized against traversal tricks", () => {
  const { safeReturnPath } = mods.redirects;
  assert.equal(safeReturnPath("/app/customer/bookings"), "/app/customer/bookings");
  assert.equal(safeReturnPath("//evil.com"), "/");
  assert.equal(safeReturnPath("/\\evil.com"), "/");
  assert.equal(safeReturnPath("https://evil.com"), "/");
  assert.equal(safeReturnPath(null, "/fallback"), "/fallback");
  // A fragment is dropped: Supabase uses it on some flows.
  assert.equal(safeReturnPath("/app/customer#token"), "/app/customer");
});

test("3.4 the callback URL targets this origin and carries a validated returnTo", () => {
  const url = new URL(
    mods.redirects.buildCallbackUrl({
      origin: "https://nexora-main-website.vercel.app",
      returnTo: "/app/customer/bookings",
      role: "customer",
    }),
  );
  assert.equal(url.origin, "https://nexora-main-website.vercel.app");
  assert.equal(url.pathname, "/auth/callback");
  assert.equal(url.searchParams.get("returnTo"), "/app/customer/bookings");
  assert.equal(url.searchParams.get("role"), "customer");
});

test("3.5 a hostile returnTo is stripped from the callback URL", () => {
  const url = new URL(
    mods.redirects.buildCallbackUrl({
      origin: "https://nexora-main-website.vercel.app",
      returnTo: "https://evil.example.com/harvest",
    }),
  );
  assert.equal(url.searchParams.get("returnTo"), null);
});

test("3.6 the Supabase redirect allowlist covers callback and recovery per origin", () => {
  const allowlist = mods.redirects.supabaseRedirectAllowlist();
  assert.ok(allowlist.every((entry) => entry.startsWith("https://")));
  assert.ok(allowlist.some((entry) => entry.endsWith("/auth/callback")));
  assert.ok(allowlist.some((entry) => entry.endsWith("/reset-password")));
  for (const origin of mods.redirects.DEFAULT_ALLOWED_AUTH_ORIGINS) {
    assert.ok(allowlist.includes(`${origin}/auth/callback`), origin);
  }
});

test("3.7 no access or refresh token is ever placed in a redirect URL", () => {
  const url = mods.redirects.buildCallbackUrl({
    origin: "https://nexora-main-website.vercel.app",
    returnTo: "/app/customer",
  });
  assert.doesNotMatch(url, /access_token|refresh_token/);
  assert.doesNotMatch(mods.redirects.buildRecoveryUrl({ origin: "https://x.vercel.app" }), /token/);
});

// ---------------------------------------------------------------------------
// 4. Error handling
// ---------------------------------------------------------------------------

test("4.1 common Supabase auth failures map to stable codes", () => {
  const cases = [
    ["Invalid login credentials", "invalid_credentials"],
    ["Email not confirmed", "email_not_confirmed"],
    ["User already registered", "email_taken"],
    ["Password should be at least 6 characters", "weak_password"],
    ["Signups not allowed for this instance", "signup_disabled"],
    ["JWT expired", "session_expired"],
    ["invalid request: both auth code and code verifier should be non-empty", "pkce_failed"],
    ["Failed to fetch", "network"],
  ];
  for (const [message, code] of cases) {
    assert.equal(mods.errors.toAuthError(new Error(message)).code, code, message);
  }
});

test("4.2 an unknown Supabase message is preserved verbatim, never masked", () => {
  const weird = "Project qwaehqsmodekbgvnaavz is paused";
  const mapped = mods.errors.toAuthError(new Error(weird));
  assert.equal(mapped.code, "unknown");
  assert.equal(mapped.message, weird);
});

test("4.3 rate limiting is detected by status and by message", () => {
  assert.equal(mods.errors.toAuthError({ status: 429, message: "slow down" }).code, "rate_limited");
  assert.equal(mods.errors.toAuthError(new Error("email rate limit exceeded")).code, "rate_limited");
});

test("4.4 transient failures are marked retryable, credential failures are not", () => {
  assert.equal(mods.errors.toAuthError(new Error("Failed to fetch")).retryable, true);
  assert.equal(mods.errors.toAuthError(new Error("Invalid login credentials")).retryable, false);
});

test("4.5 password recovery never reveals whether an account exists", () => {
  const message = mods.errors.neutralRecoveryMessage("someone@example.com");
  assert.match(message, /If an account exists/i);
  assert.doesNotMatch(message, /not found|no user|unregistered/i);
});

test("4.6 the original cause is retained for debugging", () => {
  const cause = new Error("Invalid login credentials");
  assert.equal(mods.errors.toAuthError(cause).cause, cause);
});

// ---------------------------------------------------------------------------
// 5. Client initialization contract
// ---------------------------------------------------------------------------

test("5.1 the client enforces PKCE and session persistence", () => {
  assert.match(clientSrc, /flowType:\s*"pkce"/);
  assert.match(clientSrc, /persistSession:\s*true/);
  assert.match(clientSrc, /autoRefreshToken:\s*true/);
  assert.match(clientSrc, /detectSessionInUrl:\s*true/);
});

test("5.2 the client is memoized so one origin has exactly one session holder", () => {
  assert.match(clientSrc, /cachedClient/);
  assert.match(clientSrc, /storageKey/);
  assert.match(clientSrc, /NEXORA_STORAGE_KEY/);
});

test("5.3 no credential is hardcoded anywhere in the auth package", () => {
  for (const [name, src] of [
    ["client", clientSrc],
    ["provider", providerSrc],
    ["session", sessionSrc],
    ["service", serviceSrc],
  ]) {
    assert.doesNotMatch(src, /eyJhbGciOiJIUzI1Ni/, name);
    assert.doesNotMatch(src, /service_role_key/i, name);
    assert.doesNotMatch(src, /sb_secret_/i, name);
  }
});

// ---------------------------------------------------------------------------
// 6. AuthProvider behaviour contract
// ---------------------------------------------------------------------------

test("6.1 the provider supports login, signup, recovery and PKCE callback", () => {
  for (const api of [
    "signIn",
    "signUp",
    "signInWithGoogle",
    "sendPasswordReset",
    "setPassword",
    "completeAuthCallback",
    "signOut",
    "refresh",
  ]) {
    assert.match(providerSrc, new RegExp(`\\b${api}\\b`), api);
  }
});

test("6.2 the provider restores a persisted session and subscribes to changes", () => {
  assert.match(providerSrc, /auth\.getSession\(\)/);
  assert.match(providerSrc, /onAuthStateChange/);
  assert.match(providerSrc, /subscription\.unsubscribe\(\)/);
});

test("6.3 authorization fails closed when the profile is missing or inactive", () => {
  assert.match(providerSrc, /Fail closed/);
  assert.match(providerSrc, /profile_inactive/);
  assert.match(sessionSrc, /is_active !== true/);
});

test("6.4 the role always comes from the server profile, never from a URL", () => {
  assert.match(providerSrc, /state\.profile\?\.role \?\? null/);
  assert.match(sessionSrc, /platform_role/);
  // The client never writes a role.
  assert.doesNotMatch(sessionSrc, /\.upsert\(/);
  assert.doesNotMatch(sessionSrc, /update\(\{[^}]*platform_role/);
});

test("6.5 out-of-order async resolutions cannot resurrect a stale session", () => {
  assert.match(providerSrc, /revisionRef/);
  assert.match(providerSrc, /stale\(\)/);
});

// ---------------------------------------------------------------------------
// 7. SQL migration — profiles, roles, RLS
// ---------------------------------------------------------------------------

test("7.1 profiles is linked 1:1 to auth.users with cascade delete", () => {
  assert.match(migration, /create table if not exists public\.profiles/);
  assert.match(migration, /id\s+uuid primary key references auth\.users \(id\) on delete cascade/);
});

test("7.2 the role constraint contains all five roles", () => {
  assert.match(
    migration,
    /check \(platform_role in \('customer','business_user','growth_partner','delivery_partner','admin'\)\)/,
  );
});

test("7.3 the migration is idempotent and destroys nothing", () => {
  assert.match(migration, /create table if not exists/);
  assert.match(migration, /add column if not exists/);
  assert.match(migration, /create or replace function/);

  // Strip comments so prose like "No DROP TABLE" is not mistaken for SQL.
  const executable = migration
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  assert.doesNotMatch(executable, /drop table/i);
  assert.doesNotMatch(executable, /truncate/i);
  assert.doesNotMatch(executable, /delete from public\.profiles/i);
  assert.doesNotMatch(executable, /drop column/i);
  // Dropping a policy or trigger before recreating it is the idempotent
  // pattern and is expected; dropping data-bearing objects is not.
  assert.doesNotMatch(executable, /drop schema/i);
});

test("7.4 RLS is enabled AND forced on profiles", () => {
  assert.match(migration, /alter table public\.profiles enable row level security/);
  assert.match(migration, /alter table public\.profiles force row level security/);
});

test("7.5 self-access policies restrict every operation to auth.uid()", () => {
  assert.match(migration, /create policy profiles_select_own[\s\S]*?using \(auth\.uid\(\) = id\)/);
  assert.match(migration, /create policy profiles_insert_own[\s\S]*?with check \(auth\.uid\(\) = id\)/);
  assert.match(
    migration,
    /create policy profiles_update_own[\s\S]*?using \(auth\.uid\(\) = id\)[\s\S]*?with check \(auth\.uid\(\) = id\)/,
  );
});

test("7.6 admin policies use a SECURITY DEFINER helper to avoid RLS recursion", () => {
  assert.match(migration, /create or replace function private\.is_admin\(\)[\s\S]*?security definer/);
  assert.match(migration, /create policy profiles_select_admin[\s\S]*?using \(private\.is_admin\(\)\)/);
});

test("7.7 anon can never read identities", () => {
  assert.match(migration, /revoke all\s+on table public\.profiles from anon/);
  assert.match(migration, /not has_table_privilege\('anon', 'public\.profiles', 'select'\)/);
});

test("7.8 platform_role is immutable for non-service callers", () => {
  assert.match(migration, /guard_profile_platform_role/);
  assert.match(migration, /platform_role is assigned permanently by Nexora/);
  assert.match(migration, /trg_profiles_platform_role_guard/);
});

test("7.9 clients cannot write role, status or balances (column-level grants)", () => {
  assert.match(migration, /revoke update on table public\.profiles from authenticated/);
  assert.match(
    migration,
    /grant\s+update \(full_name, avatar_url, phone, last_seen_at, updated_at\)/,
  );
  assert.match(migration, /guard_profile_financial_fields/);
});

test("7.10 the signup trigger is the only profile creator and normalizes aliases", () => {
  assert.match(migration, /create or replace function public\.handle_new_user\(\)/);
  assert.match(migration, /on_auth_user_created/);
  assert.match(migration, /signup_role/);
  assert.match(migration, /private\.normalize_platform_role/);
});

test("7.11 SQL alias normalization matches the TypeScript role map", () => {
  const sqlBlock = migration.slice(
    migration.indexOf("create or replace function private.normalize_platform_role"),
    migration.indexOf("comment on function private.normalize_platform_role"),
  );
  const pairs = [
    ["user", "customer"],
    ["shop_owner", "business_user"],
    ["owner", "business_user"],
    ["delivery", "delivery_partner"],
    ["rider", "delivery_partner"],
    ["growth-partner", "growth_partner"],
  ];
  for (const [alias, canonical] of pairs) {
    assert.match(sqlBlock, new RegExp(`when '${alias}'\\s+then '${canonical}'`), alias);
    assert.equal(mods.roles.normalizeRole(alias), canonical, `TS ${alias}`);
  }
  // admin must NOT be mappable from the signup path in SQL either.
  assert.match(sqlBlock, /'admin' is intentionally NOT mapped/);
});

test("7.12 admin promotion is service-role only", () => {
  assert.match(migration, /create or replace function public\.assign_platform_role/);
  assert.match(
    migration,
    /revoke all on function public\.assign_platform_role\(uuid, text\) from public, anon, authenticated/,
  );
  assert.match(migration, /grant execute on function public\.assign_platform_role\(uuid, text\) to service_role/);
});

test("7.13 a verification function ships with the migration", () => {
  assert.match(migration, /create or replace function public\.verify_phase1_auth\(\)/);
  assert.match(migration, /no auth\.users without a profile/);
  assert.match(migration, /RLS enabled and forced/);
});

test("7.14 the migration documents the Supabase redirect allowlist", () => {
  assert.match(migration, /Redirect URLs/);
  assert.match(migration, /\/auth\/callback/);
  assert.match(migration, /\/reset-password/);
});

// ---------------------------------------------------------------------------
// 8. Main website wiring
// ---------------------------------------------------------------------------

test("8.1 the website builds its client through the shared package", () => {
  assert.match(websiteClient, /packages\/auth\/src/);
  assert.match(appSrc, /getSupabaseClient/);
  // No second createClient call may exist in the app: it would fork the session.
  assert.doesNotMatch(appSrc, /createClient\(/);
});

test("8.2 the website still reads only NEXT_PUBLIC_* env names", () => {
  assert.match(appSrc, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(appSrc, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(appSrc, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/);
});

test("8.3 the auth callback validates cross-origin returns before handing off", () => {
  assert.match(appSrc, /safeRedirectUrl/);
  assert.match(appSrc, /handleAuthCallback/);
  assert.doesNotMatch(appSrc, /access_token|refresh_token/i);
});
