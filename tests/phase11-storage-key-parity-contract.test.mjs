// PHASE 11 — STORAGE KEY PARITY.
//
// Every frontend Supabase client in the Nexora ecosystem must persist its
// session under the ONE shared storage key:
//
//     nexora.auth.qwaehqsmodekbgvnaavz
//
// so that Nexora surfaces mounted on one origin share exactly one session
// slot and never collide with an unrelated Supabase app. No client may use
// the supabase-js default key (sb-<ref>-auth-token) or invent an independent
// name (nexora-auth, supabase-auth, customer-auth, owner-auth, partner-auth,
// template-auth, job-auth, ...).

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const CANONICAL_KEY = "nexora.auth.qwaehqsmodekbgvnaavz";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// Live frontend clients in this repository (server-side admin clients are
// exempt: they hold no browser session at all).
const frontendClients = [
  "packages/auth/src/client.ts",
  "job-portal/src/lib/supabase.ts",
  "integration-packages/template-app/files/src/lib/supabaseClient.ts",
  "docs/customer-supabaseClient.fixed.ts",
];

function collectSources(dir, extensions = /\.(ts|tsx|patch)$/) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSources(full, extensions));
    else if (extensions.test(entry)) out.push({ path: full, source: readFileSync(full, "utf8") });
  }
  return out;
}

const surfaces = [
  "app",
  "packages",
  "job-portal/src",
  "beauty-industry/src",
  "integration-packages",
  "subapp-sync-artifacts",
  "docs",
].flatMap((dir) => collectSources(fileURLToPath(new URL(`../${dir}`, import.meta.url))));

test("every live frontend client pins the canonical storage key", async () => {
  for (const path of frontendClients) {
    const source = await read(path);
    const usesLiteral = source.includes(`'${CANONICAL_KEY}'`) || source.includes(`"${CANONICAL_KEY}"`);
    const usesDerived = source.includes("nexora.auth.${SUPABASE_PROJECT_REF}");
    assert.ok(usesLiteral || usesDerived, `${path} must resolve to ${CANONICAL_KEY}`);
    // The key must actually be passed to the client, not just declared.
    assert.match(source, /storageKey:\s*(NEXORA_(AUTH_)?STORAGE_KEY|['"]nexora\.auth\.qwaehqsmodekbgvnaavz['"])/, path);
  }
  // The derived constants resolve to the same ref.
  const env = await read("packages/auth/src/env.ts");
  assert.match(env, /SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz"/);
});

test("no frontend createClient call can fall back to the default storage key", () => {
  for (const { path, source } of surfaces) {
    if (!/\.(ts|tsx)$/.test(path)) continue;
    if (!source.includes("createClient(")) continue;
    // Server-only admin clients hold no browser session.
    if (/server\/supabaseAdmin\.ts$/.test(path)) {
      assert.match(source, /SERVICE_ROLE/i, `${path} must be a server-only client`);
      continue;
    }
    assert.match(
      source,
      /storageKey:\s*(NEXORA_(AUTH_)?STORAGE_KEY|['"]nexora\.auth\.qwaehqsmodekbgvnaavz['"])/,
      `${path} creates a browser client without the canonical storage key`,
    );
  }
});

test("no independent storage key name exists anywhere", () => {
  const forbidden = [
    "nexora-auth",
    "supabase-auth",
    "customer-auth",
    "owner-auth",
    "partner-auth",
    "template-auth",
    "job-auth",
  ];
  for (const { path, source } of surfaces) {
    for (const name of forbidden) {
      // Exact quoted string — import paths like '../vendor/nexora-auth/x' are
      // module specifiers, not storage keys, and do not match.
      assert.doesNotMatch(
        source,
        new RegExp(`['"\`]${name}['"\`]`),
        `${path} defines the independent storage key "${name}"`,
      );
    }
    // Any storageKey assignment must reference the canonical key or constant.
    for (const match of source.matchAll(/storageKey:\s*([^,\n]+)/g)) {
      const value = match[1].trim();
      assert.ok(
        /^(NEXORA_(AUTH_)?STORAGE_KEY|['"`]nexora\.auth\.qwaehqsmodekbgvnaavz['"`])/.test(value),
        `${path} sets a non-canonical storageKey: ${value}`,
      );
    }
  }
});

test("integration patches ship the same derived canonical key", () => {
  const patchSurfaces = surfaces.filter(({ path }) => path.endsWith(".patch"));
  assert.ok(patchSurfaces.length >= 5, "the patch scan must cover the integration packages");
  for (const { path, source } of patchSurfaces) {
    if (!source.includes("storageKey")) continue;
    assert.match(source, /storageKey:\s*NEXORA_STORAGE_KEY/, path);
    assert.ok(
      source.includes("nexora.auth.${SUPABASE_PROJECT_REF}") || source.includes(CANONICAL_KEY),
      `${path} must derive the canonical key`,
    );
    // Any override default must still be the canonical key.
    for (const match of source.matchAll(/DEFAULT_NEXORA_STORAGE_KEY = '([^']+)'/g)) {
      assert.equal(match[1], CANONICAL_KEY, path);
    }
  }
});
