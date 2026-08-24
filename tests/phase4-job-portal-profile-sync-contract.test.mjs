// PHASE 4 — PROFILE SYNCHRONIZATION (Job Portal Sub-App).
//
// After authentication the browser resolves exactly one profile row:
//
//   auth.users.id → profiles.id      (.eq("id", user.id), own row only)
//
// and role authority stays in the database/backend:
//
//   * the canonical Main Website role field (profiles.platform_role) is
//     fetched read-only and never written from the browser;
//   * the Jobs portal role comes only from job_user_roles /
//     job_register_role, keyed to auth.uid() server-side;
//   * no browser metadata, URL parameter, localStorage or query parameter
//     can promote a user to admin, owner, partner or staff.
//
// Static contract tests only — no network, no credentials.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFile(new URL(`../job-portal/${path}`, import.meta.url), "utf8");

const provider = await read("src/auth/AuthProvider.tsx");
const backend = await read("src/services/backend.ts");
const app = await read("src/App.tsx");

/** Every TS/TSX source of the Sub-App, for whole-surface negative checks. */
function collectSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push({ path: full, source: readFileSync(full, "utf8") });
  }
  return out;
}
const srcRoot = fileURLToPath(new URL("../job-portal/src", import.meta.url));
const allSources = collectSources(srcRoot);

// ---------------------------------------------------------------------------
// 1. auth.users.id → profiles.id, own row only
// ---------------------------------------------------------------------------

test("the AuthProvider fetches only the current user's profile row", () => {
  assert.match(provider, /\.from\('profiles'\)/);
  assert.match(provider, /\.eq\('id', userId\)/);
  assert.match(provider, /\.maybeSingle<Profile>\(\)/);
  // No arbitrary-user access paths on the profiles read.
  assert.doesNotMatch(provider, /\.from\('profiles'\)[\s\S]{0,200}\.(in|neq|like|ilike|or)\(/);
  assert.doesNotMatch(provider, /\.from\('profiles'\)[\s\S]{0,200}\.eq\('id', (?!userId)/);
});

test("every profiles read in the service layer is keyed to the session user", () => {
  for (const match of backend.matchAll(/\.from\('profiles'\)[\s\S]{0,220}?\.eq\('id', ([a-zA-Z.]+)\)/g)) {
    assert.ok(
      ["user.id", "userId"].includes(match[1]),
      `profiles access must be own-row only, got .eq('id', ${match[1]})`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Canonical Main Website role field — read-only in the browser
// ---------------------------------------------------------------------------

test("the provider carries platform_role/is_active as server-owned read-only fields", () => {
  assert.match(provider, /readonly platform_role: string \| null/);
  assert.match(provider, /readonly is_active: boolean \| null/);
  assert.match(provider, /platform_role,is_active/);
});

test("the browser never writes the canonical role or account gate", () => {
  for (const { path, source } of allSources) {
    assert.doesNotMatch(
      source,
      /\.(update|upsert|insert)\(\s*\{[^}]*(platform_role|is_active)/s,
      `${path} must never write platform_role/is_active`,
    );
  }
  // profiles updates touch only the whitelisted display columns.
  const saveBlock = backend.slice(backend.indexOf("export async function saveProfile"));
  const update = saveBlock.slice(0, saveBlock.indexOf(".eq('id', userId)"));
  assert.match(update, /full_name/);
  assert.doesNotMatch(update, /role|is_active/);
});

// ---------------------------------------------------------------------------
// 3. Role authority is database/backend controlled
// ---------------------------------------------------------------------------

test("job_user_roles is read-only from the browser", () => {
  for (const { path, source } of allSources) {
    for (const match of source.matchAll(/\.from\('job_user_roles'\)\s*\.(\w+)\(/g)) {
      assert.equal(match[1], "select", `${path} may only select from job_user_roles`);
    }
  }
});

test("role registration goes through the server RPC and rejects privileged roles", () => {
  assert.match(backend, /rpc\('job_register_role'/);
  assert.match(backend, /role !== 'seeker' && role !== 'employer'/);
  assert.match(backend, /cannot be self-assigned/);
  // Admin access is verified against the server-owned row after sign-in.
  assert.match(backend, /\.from\('job_user_roles'\)\.select\('role'\)\.eq\('user_id', data\.user\.id\)/);
});

test("no browser storage, metadata or URL parameter can influence a role", () => {
  const privileged = /(admin|owner|partner|staff)/i;
  for (const { path, source } of allSources) {
    assert.doesNotMatch(source, /localStorage|sessionStorage/, `${path} must not use web storage`);
    assert.doesNotMatch(source, /\.user_metadata|\.app_metadata/, `${path} must not read auth metadata for authorization`);
    for (const line of source.split("\n")) {
      if (/URLSearchParams|searchParams|location\.(search|hash)/.test(line)) {
        assert.doesNotMatch(line, privileged, `${path} must not derive a privileged role from the URL: ${line.trim()}`);
      }
    }
  }
});

test("the workspace role is adopted only from the server after hydration", () => {
  // The authoritative assignment flows from getUserRole(job_user_roles).
  assert.match(backend, /export async function getUserRole/);
  assert.match(app, /const role = await hydrateWorkspace/);
  // Route metadata gates screens (login redirects); it never assigns a role.
  assert.doesNotMatch(app, /setUserRole\((?:route|requested|initialRoute)\./);
});
