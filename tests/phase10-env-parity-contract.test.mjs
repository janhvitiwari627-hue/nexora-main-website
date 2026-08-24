// PHASE 10 — ENVIRONMENT PARITY.
//
// Every Vite application declares the same canonical Supabase project in its
// .env.example, no secret material is committed, service-role keys can never
// travel through Vite, and production hosting is verified by construction:
// the Vercel build (vercel.json -> build:next -> prebuild:next ->
// scripts/build-job-portal.sh) hard-fails unless VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY are present AND the URL equals the shared project —
// so the deployed /job-portal/ assets prove the hosting configuration.
//
// Framework conventions are preserved: the Main Website (Next) uses
// NEXT_PUBLIC_* names with the same underlying values, and the build script
// aliases them into VITE_* for the integrated Sub-App build.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const CANONICAL_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";

const jobPortalEnv = await read("job-portal/.env.example");
const beautyEnv = await read("beauty-industry/.env.example");
const templateEnv = await read("integration-packages/template-app/files/.env.example");
const rootEnv = await read(".env.example");
const buildScript = await read("scripts/build-job-portal.sh");
const vercel = JSON.parse(await read("vercel.json"));
const rootPackage = JSON.parse(await read("package.json"));

const viteEnvExamples = [
  ["job-portal/.env.example", jobPortalEnv],
  ["beauty-industry/.env.example", beautyEnv],
  ["integration-packages/template-app/files/.env.example", templateEnv],
];

// ---------------------------------------------------------------------------
// 1. Every Vite repository declares the canonical project
// ---------------------------------------------------------------------------

test("every Vite .env.example pins the shared project with a placeholder key", () => {
  for (const [name, env] of viteEnvExamples) {
    assert.match(env, new RegExp(`VITE_SUPABASE_URL=${CANONICAL_URL.replace(/[/.]/g, "\\$&")}`), name);
    assert.match(env, /VITE_SUPABASE_ANON_KEY=<PROJECT_ANON_KEY>/, name);
  }
});

test("the Next app preserves its framework convention with the same value", () => {
  assert.match(rootEnv, new RegExp(`NEXT_PUBLIC_SUPABASE_URL=${CANONICAL_URL.replace(/[/.]/g, "\\$&")}`));
  assert.match(rootEnv, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
  // The integrated Sub-App build aliases NEXT_PUBLIC_* into VITE_*.
  assert.match(buildScript, /VITE_SUPABASE_URL="\$\{VITE_SUPABASE_URL:-\$\{NEXT_PUBLIC_SUPABASE_URL:-\}\}"/);
  assert.match(buildScript, /VITE_SUPABASE_ANON_KEY="\$\{VITE_SUPABASE_ANON_KEY:-\$\{NEXT_PUBLIC_SUPABASE_ANON_KEY:-\}\}"/);
});

// ---------------------------------------------------------------------------
// 2. No secrets in Git; no service-role through Vite
// ---------------------------------------------------------------------------

test("no env example contains real key material", () => {
  for (const [name, env] of [...viteEnvExamples, [".env.example", rootEnv]]) {
    assert.doesNotMatch(env, /eyJ[A-Za-z0-9_-]{10,}/, `${name} contains a JWT`);
    assert.doesNotMatch(env, /sb_secret_[A-Za-z0-9]/, `${name} contains a secret key`);
    assert.doesNotMatch(env, /sb_publishable_[A-Za-z0-9]{8,}/, `${name} contains a live publishable key`);
    // A service-role variable may never carry a value in any committed file.
    for (const line of env.split("\n")) {
      if (/^\s*SUPABASE_SERVICE_ROLE_KEY=/.test(line)) {
        assert.equal(line.trim(), "SUPABASE_SERVICE_ROLE_KEY=", `${name}: ${line}`);
      }
      assert.doesNotMatch(line, /^\s*VITE_[A-Z_]*(SERVICE|SECRET)[A-Z_]*=/, `${name}: ${line}`);
    }
  }
  // The browser Sub-Apps never document a service-role variable at all.
  assert.doesNotMatch(jobPortalEnv, /^SUPABASE_SERVICE_ROLE_KEY=/m);
  assert.doesNotMatch(beautyEnv, /^SUPABASE_SERVICE_ROLE_KEY=/m);
});

test("real .env files are ignored while examples stay tracked", async () => {
  for (const path of [".gitignore", "job-portal/.gitignore", "beauty-industry/.gitignore"]) {
    const ignore = await read(path);
    assert.match(ignore, /^\.env\*/m, `${path} must ignore .env files`);
    assert.match(ignore, /^!\.env\.example/m, `${path} must keep the example tracked`);
  }
});

test("no Vite source reads a service/secret-named VITE_ variable", async () => {
  for (const path of [
    "job-portal/src/lib/supabase.ts",
    "integration-packages/template-app/files/src/lib/supabaseClient.ts",
    "packages/auth/src/env.ts",
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /VITE_[A-Z_]*(SERVICE|SECRET)/, path);
    // The runtime validator that refuses service-role material is present.
    assert.match(source, /sb_secret_|service_role/, `${path} must detect service-role keys`);
  }
});

// ---------------------------------------------------------------------------
// 3. Production hosting is verified by construction
// ---------------------------------------------------------------------------

test("the production build refuses to produce assets without canonical env", () => {
  // vercel.json -> build:next -> prebuild:next -> build-job-portal.sh.
  assert.equal(vercel.buildCommand, "npm run build:next");
  assert.match(rootPackage.scripts["prebuild:next"], /build:job-portal/);
  assert.match(rootPackage.scripts["build:job-portal"], /build-job-portal\.sh/);
  // Both variables are mandatory…
  assert.match(buildScript, /\$\{VITE_SUPABASE_URL:\?/);
  assert.match(buildScript, /\$\{VITE_SUPABASE_ANON_KEY:\?/);
  // …and the URL must resolve to the one shared project or the build dies.
  assert.match(buildScript, new RegExp(`!= "${CANONICAL_URL.replace(/[/.]/g, "\\$&")}"`));
  assert.match(buildScript, /exit 78/);
});
