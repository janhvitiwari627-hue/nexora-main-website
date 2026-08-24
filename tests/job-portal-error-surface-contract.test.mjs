// Job Portal — error-surface contract.
//
// Regression guard for the production "Unable to create account" bug:
// supabase-js (postgrest-js) returns plain `{ message, details, hint, code }`
// objects — NOT Error instances — for both API errors (PGRST202 missing RPC,
// RLS denials, constraint violations) and network/CORS failures. Code that
// re-throws them raw and catch blocks that test `instanceof Error` therefore
// masked every real backend message behind a generic fallback.
//
// Contract:
//   * utils/errors.ts extracts the real message (plus PostgREST code) from
//     any thrown shape — executed, not just grepped;
//   * the service layer never re-throws a raw Supabase error object;
//   * no auth/admin screen filters messages through `instanceof Error`;
//   * the signup pre-check reports a missing job_email_portal_role RPC
//     with an actionable message instead of failing generically.

import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL(`../job-portal/${path}`, import.meta.url), "utf8");

async function loadErrorsModule() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-jobs-errors-"));
  const source = await read("src/utils/errors.ts");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  await writeFile(join(dir, "errors.mjs"), outputText);
  return import(pathToFileURL(join(dir, "errors.mjs")).href);
}

const errors = await loadErrorsModule();
const backend = await read("src/services/backend.ts");
const adminJobs = await read("src/services/adminJobs.ts");

// ---------------------------------------------------------------------------
// 1. Behavioural — the extractor surfaces real Supabase failure messages
// ---------------------------------------------------------------------------

test("a plain PostgREST error object is not masked by the generic fallback", () => {
  // Exactly what postgrest-js returns for a missing RPC (it is NOT an Error).
  const pgrst = {
    message: "Could not find the function public.job_email_portal_role(p_email) in the schema cache",
    details: "",
    hint: "Perhaps you meant to call...",
    code: "PGRST202",
  };
  assert.equal(pgrst instanceof Error, false);
  const message = errors.getErrorMessage(pgrst, "Unable to create account.");
  assert.notEqual(message, "Unable to create account.");
  assert.match(message, /job_email_portal_role/);
  assert.match(message, /\[PGRST202\]/);
});

test("a network/CORS failure object surfaces its cause", () => {
  // postgrest-js builds this literal when fetch itself rejects.
  const network = { message: "TypeError: Failed to fetch", details: "TypeError: Failed to fetch", hint: "", code: "" };
  assert.match(errors.getErrorMessage(network, "fallback"), /Failed to fetch/);
});

test("Error instances, strings and junk still resolve sensibly", () => {
  assert.equal(errors.getErrorMessage(new Error("User already registered"), "f"), "User already registered");
  assert.equal(errors.getErrorMessage("duplicate key value", "f"), "duplicate key value");
  assert.equal(errors.getErrorMessage(null, "fallback"), "fallback");
  assert.equal(errors.getErrorMessage({}, "fallback"), "fallback");
});

test("asError produces a real Error carrying code/details/hint and cause", () => {
  const raw = { message: "permission denied for table job_user_roles", code: "42501", details: "d", hint: "h" };
  const normalized = errors.asError(raw);
  assert.ok(normalized instanceof Error);
  assert.match(normalized.message, /permission denied/);
  assert.equal(normalized.code, "42501");
  assert.equal(normalized.cause, raw);
});

test("missing-RPC detection covers PostgREST and PostgreSQL codes", () => {
  assert.equal(errors.isMissingFunctionError({ code: "PGRST202" }), true);
  assert.equal(errors.isMissingFunctionError({ code: "42883" }), true);
  assert.equal(errors.isMissingFunctionError({ code: "23505" }), false);
  assert.equal(errors.isMissingFunctionError(new Error("x")), false);
});

// ---------------------------------------------------------------------------
// 2. Contract — no raw Supabase error object ever leaves the service layer
// ---------------------------------------------------------------------------

test("the service layer never re-throws raw Supabase error objects", () => {
  for (const [name, source] of [["backend.ts", backend], ["adminJobs.ts", adminJobs]]) {
    const raw = source.match(/throw [a-z][A-Za-z]*[eE]rror\s*;/g) ?? [];
    assert.deepEqual(raw, [], `${name} re-throws raw error objects: ${raw.join(" ")}`);
    assert.match(source, /from '\.\.\/utils\/errors'/);
  }
});

test("the signup pre-check logs the diagnostic and explains a missing RPC", () => {
  assert.match(backend, /signup pre-check job_email_portal_role failed/);
  assert.match(backend, /isMissingFunctionError\(lookupError\)/);
  assert.match(backend, /missing the job_email_portal_role function/);
});

test("no auth or admin screen masks errors behind instanceof Error", async () => {
  const screens = [
    "src/components/auth/JobSeekerSignupScreen.tsx",
    "src/components/auth/EmployerSignupScreen.tsx",
    "src/components/auth/LoginScreen.tsx",
    "src/components/auth/ForgotPasswordScreen.tsx",
    "src/components/auth/ResetPasswordScreen.tsx",
    "src/components/admin/AdminLoginScreen.tsx",
    "src/components/admin/AdminJobsScreen.tsx",
  ];
  for (const screen of screens) {
    const source = await read(screen);
    assert.doesNotMatch(source, /instanceof Error \?/, `${screen} still filters via instanceof Error`);
    assert.match(source, /getErrorMessage\(/, `${screen} must use getErrorMessage`);
  }
});

test("App.tsx surfaces backend errors through getErrorMessage", async () => {
  const app = await read("src/App.tsx");
  assert.doesNotMatch(app, /instanceof Error \? error\.message/);
  assert.match(app, /import \{ getErrorMessage \} from '\.\/utils\/errors'/);
  // The no-session signup outcome tells the user about email verification
  // instead of a false "activation failed".
  assert.match(app, /verification email must be confirmed/);
});
