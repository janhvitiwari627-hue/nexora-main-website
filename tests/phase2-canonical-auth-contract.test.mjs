// PHASE 2 — CANONICAL AUTH CONTRACT.
//
// Every Sub-App must use the same logical Supabase client configuration:
//   * the one shared project  https://qwaehqsmodekbgvnaavz.supabase.co
//   * PKCE flow with persisted, auto-refreshing sessions
//   * the shared storage key  nexora.auth.qwaehqsmodekbgvnaavz
//   * configuration from build-time env vars, validated before use.
//
// Two kinds of test live here:
//   * behavioural — the canonical validator (packages/auth/src/env.ts) is
//     transpiled and executed against every rejection class the contract
//     requires: wrong project, missing URL, missing anon/publishable key,
//     malformed key, service-role key, non-HTTPS production URL.
//   * contract    — static assertions that each Sub-App client file ships the
//     canonical configuration and its own copy of the validation.
//
// Runs with no network access and no Supabase credentials.

import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const SHARED_PROJECT = "qwaehqsmodekbgvnaavz";
const EXPECTED_URL = `https://${SHARED_PROJECT}.supabase.co`;
const SHARED_STORAGE_KEY = `nexora.auth.${SHARED_PROJECT}`;

async function loadEnvModule() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-phase2-auth-"));
  await mkdir(dir, { recursive: true });
  const source = await readFile(new URL("../packages/auth/src/env.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  await writeFile(join(dir, "env.mjs"), outputText);
  return import(pathToFileURL(join(dir, "env.mjs")).href);
}

const env = await loadEnvModule();

const jobPortalClient = await readFile(
  new URL("../job-portal/src/lib/supabase.ts", import.meta.url),
  "utf8",
);
const templateClient = await readFile(
  new URL("../integration-packages/template-app/files/src/lib/supabaseClient.ts", import.meta.url),
  "utf8",
);
const canonicalClient = await readFile(
  new URL("../packages/auth/src/client.ts", import.meta.url),
  "utf8",
);

// A fake, non-functional anon-shaped JWT used only to exercise the validator.
const fakeAnonJwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
  JSON.stringify({ role: "anon" }),
).toString("base64url")}.notarealsignature`;
// A fake, non-functional service_role-shaped JWT. It is not a credential.
const fakeServiceJwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
  JSON.stringify({ role: "service_role" }),
).toString("base64url")}.notarealsignature`;

const validate = (url, anonKey, options) =>
  env.validateSupabaseEnv({ url, anonKey, source: "explicit" }, options);

// ---------------------------------------------------------------------------
// 1. Behavioural — the canonical validator enforces every required rejection
// ---------------------------------------------------------------------------

test("2.1 the expected production configuration is accepted", () => {
  assert.equal(validate(EXPECTED_URL, "sb_publishable_abc123").valid, true);
  assert.equal(validate(EXPECTED_URL, fakeAnonJwt).valid, true);
});

test("2.2 a wrong project is rejected", () => {
  const result = validate("https://someotherproject.supabase.co", "sb_publishable_abc123");
  assert.equal(result.valid, false);
  assert.ok(result.problems.includes("wrong-project"));
});

test("2.3 a missing URL is rejected", () => {
  const result = validate("", "sb_publishable_abc123");
  assert.equal(result.valid, false);
  assert.ok(result.problems.includes("missing-url"));
});

test("2.4 a missing anon/publishable key is rejected", () => {
  const result = validate(EXPECTED_URL, "");
  assert.equal(result.valid, false);
  assert.ok(result.problems.includes("missing-anon-key"));
});

test("2.5 a malformed key is rejected", () => {
  for (const bad of [
    "not-a-key",
    "eyJtruncated",
    "eyJa.eyJb",
    "sb_publishable_",
    `${fakeAnonJwt} `.trim() + " tail",
  ]) {
    const result = validate(EXPECTED_URL, bad);
    assert.equal(result.valid, false, `expected rejection for ${JSON.stringify(bad)}`);
    assert.ok(result.problems.includes("malformed-key"), `expected malformed-key for ${JSON.stringify(bad)}`);
  }
});

test("2.6 an accidentally exposed service-role key is rejected", () => {
  const legacy = validate(EXPECTED_URL, fakeServiceJwt);
  assert.equal(legacy.valid, false);
  assert.ok(legacy.problems.includes("service-role-key"));

  const modern = validate(EXPECTED_URL, "sb_secret_abc123");
  assert.equal(modern.valid, false);
  assert.ok(modern.problems.includes("service-role-key"));
});

test("2.7 a non-HTTPS production URL is rejected", () => {
  const http = validate(`http://${SHARED_PROJECT}.supabase.co`, "sb_publishable_abc123");
  assert.equal(http.valid, false);
  assert.ok(http.problems.includes("insecure-url"));

  // Even a fork must never use plain http against a non-loopback host.
  const remoteHttp = validate("http://someotherproject.supabase.co", "sb_publishable_abc123", {
    strictProject: false,
  });
  assert.ok(remoteHttp.problems.includes("insecure-url"));

  // `supabase start` on a loopback host stays possible for explicit dev forks.
  const local = validate("http://localhost:54321", "sb_publishable_abc123", {
    strictProject: false,
  });
  assert.equal(local.valid, true);
});

test("2.8 rejection messages are actionable and secret-free", () => {
  const result = validate("http://someotherproject.supabase.co", "sb_secret_abc123");
  assert.match(result.message, /https/);
  assert.match(result.message, new RegExp(SHARED_PROJECT));
  assert.doesNotMatch(result.message, /sb_secret_abc123/);
});

// ---------------------------------------------------------------------------
// 2. Contract — every Sub-App client ships the canonical configuration
// ---------------------------------------------------------------------------

const subAppClients = [
  ["Job Portal", jobPortalClient],
  ["Template App", templateClient],
];

for (const [name, client] of subAppClients) {
  test(`${name} client uses the canonical auth configuration`, () => {
    assert.match(client, /VITE_SUPABASE_URL/);
    assert.match(client, /VITE_SUPABASE_ANON_KEY/);
    assert.match(client, /persistSession: true/);
    assert.match(client, /autoRefreshToken: true/);
    assert.match(client, /detectSessionInUrl: true/);
    assert.match(client, /flowType: ['"]pkce['"]/);
    assert.ok(client.includes(SHARED_STORAGE_KEY), `${name} must use the shared storage key`);
    assert.ok(client.includes(SHARED_PROJECT), `${name} must pin the shared project`);
  });

  test(`${name} client validates its configuration before creating a client`, () => {
    // wrong project + non-HTTPS URL enforcement
    assert.match(client, /https:/);
    assert.match(client, /(qwaehqsmodekbgvnaavz|\$\{SUPABASE_PROJECT_REF\})\.supabase\.co/);
    // service-role key detection (legacy JWT payload and sb_secret_ prefix)
    assert.match(client, /service_role/);
    assert.match(client, /sb_secret_/);
    // malformed-key detection (publishable prefix or three-segment JWT)
    assert.match(client, /sb_publishable_/);
  });

  test(`${name} client never hard-codes credentials or server-only variables`, () => {
    assert.doesNotMatch(client, /eyJhbGciOiJIUzI1Ni\./);
    assert.doesNotMatch(client, /SUPABASE_SERVICE_ROLE/);
    assert.doesNotMatch(client, /NEXT_PUBLIC_SUPABASE/);
  });
}

test("the Job Portal exposes the canonical constants and a null-safe client", () => {
  assert.match(jobPortalClient, /export const SUPABASE_PROJECT_REF = ['"]qwaehqsmodekbgvnaavz['"]/);
  assert.match(jobPortalClient, /export const EXPECTED_SUPABASE_URL/);
  assert.match(jobPortalClient, /export const NEXORA_AUTH_STORAGE_KEY = ['"]nexora\.auth\.qwaehqsmodekbgvnaavz['"]/);
  assert.match(jobPortalClient, /storageKey: ['"]nexora\.auth\.qwaehqsmodekbgvnaavz['"]/);
  assert.match(jobPortalClient, /SupabaseClient \| null/);
  assert.match(jobPortalClient, /export function requireSupabase\(\)/);
});

// ---------------------------------------------------------------------------
// 3. One logical configuration everywhere
// ---------------------------------------------------------------------------

test("the shared package and every Sub-App agree on project, URL and storage key", () => {
  assert.equal(env.SUPABASE_PROJECT_REF, SHARED_PROJECT);
  assert.equal(env.EXPECTED_SUPABASE_URL, EXPECTED_URL);
  assert.ok(canonicalClient.includes("nexora.auth.${SUPABASE_PROJECT_REF}"));
  assert.match(canonicalClient, /flowType: "pkce"/);
  for (const [name, client] of subAppClients) {
    assert.ok(client.includes(SHARED_STORAGE_KEY), `${name} storage key drifted`);
  }
});
