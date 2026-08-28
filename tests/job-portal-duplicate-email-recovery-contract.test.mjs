// Job Portal — duplicate-email sign-up recovery contract.
//
// Regression guard for the dead-end product error:
//   "This email is already registered as a Job Seeker. Please sign in through
//    the Job Seeker portal."
// It pointed the user at the screen they were already standing on, and the
// unverified-account case (created, verification email never opened) had no
// exit at all: sign-up said "already registered", sign-in said
// "Email not confirmed".
//
// Contract:
//   * the duplicate-email message is the next action, executed not grepped;
//   * the typed conflict carries the state the screens need to render the
//     matching recovery button (sign in instead / resend verification);
//   * the service throws that typed error on both duplicate-email paths and
//     degrades to the role-only RPC when the new migration is not applied;
//   * the signup screens render the recovery actions and the shell wires them
//     to a prefilled sign-in screen and to the provider-owned resend action.

import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL(`../job-portal/${path}`, import.meta.url), "utf8");

async function loadErrorsModule() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-jobs-conflict-"));
  const source = await read("src/utils/errors.ts");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  await writeFile(join(dir, "errors.mjs"), outputText);
  return import(pathToFileURL(join(dir, "errors.mjs")).href);
}

const errors = await loadErrorsModule();
const backend = await read("src/services/backend.ts");
const provider = await read("src/auth/AuthProvider.tsx");
const app = await read("src/App.tsx");
const login = await read("src/components/auth/LoginScreen.tsx");
const seekerSignup = await read("src/components/auth/JobSeekerSignupScreen.tsx");
const employerSignup = await read("src/components/auth/EmployerSignupScreen.tsx");
const recovery = await read("src/components/auth/SignupConflictRecovery.tsx");
const migration = await read("supabase/migrations/20260828120000_jobs_email_portal_state.sql");

// ---------------------------------------------------------------------------
// 1. Behavioural — the message is the next action, never a dead end
// ---------------------------------------------------------------------------

test("an already-registered email on the same portal tells the user to sign in", () => {
  const message = errors.portalEmailConflictMessage({
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: true,
  });
  assert.match(message, /already has a Job Seeker account/);
  assert.match(message, /Sign in with your password/);
  assert.match(message, /Forgot password/);
  // The old wording sent the user back to the screen they were already on.
  assert.doesNotMatch(message, /Please sign in through the/);
});

test("an unverified account is offered a verification link, not a sign-in", () => {
  const message = errors.portalEmailConflictMessage({
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: false,
  });
  assert.match(message, /never verified/);
  assert.match(message, /verification link/i);
  assert.doesNotMatch(message, /Please sign in through the/);
});

test("confirmation state unknown (migration not applied) still resolves to sign in", () => {
  const message = errors.portalEmailConflictMessage({
    existingRole: "employer",
    requestedRole: "employer",
    emailConfirmed: null,
  });
  assert.match(message, /already has an Employer account/);
  assert.match(message, /Sign in with your password/);
});

test("a portal mismatch names the linked portal and the two ways out", () => {
  const seekerOnEmployer = errors.portalEmailConflictMessage({
    existingRole: "job_seeker",
    requestedRole: "employer",
    emailConfirmed: true,
  });
  assert.match(seekerOnEmployer, /already linked to a Job Seeker account/);
  assert.match(seekerOnEmployer, /cannot be used for the Employer portal/);
  assert.match(seekerOnEmployer, /Sign in to that account/);
  assert.match(seekerOnEmployer, /different email/);

  const employerOnSeeker = errors.portalEmailConflictMessage({
    existingRole: "employer",
    requestedRole: "seeker",
    emailConfirmed: true,
  });
  assert.match(employerOnSeeker, /already linked to an Employer account/);
  assert.match(employerOnSeeker, /cannot be used for the Job Seeker portal/);
});

test("an email with a Nexora account but no Jobs portal explains the one-time choice", () => {
  const message = errors.portalEmailConflictMessage({
    existingRole: "unassigned",
    requestedRole: "employer",
    emailConfirmed: true,
  });
  assert.match(message, /has not chosen a Jobs portal yet/);
  assert.match(message, /Sign in/);
});

test("the typed conflict is a real Error the screens can type-guard", () => {
  const conflict = new errors.PortalEmailConflictError({
    email: "jane@example.com",
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: false,
  });
  assert.ok(conflict instanceof Error);
  assert.equal(conflict.name, "PortalEmailConflictError");
  assert.equal(conflict.kind, "portal_email_conflict");
  assert.equal(conflict.email, "jane@example.com");
  assert.equal(conflict.existingRole, "job_seeker");
  assert.equal(conflict.requestedRole, "seeker");
  assert.equal(conflict.emailConfirmed, false);
  // The message the screens render is exactly the actionable one.
  assert.equal(
    conflict.message,
    errors.portalEmailConflictMessage({
      existingRole: "job_seeker",
      requestedRole: "seeker",
      emailConfirmed: false,
    }),
  );
  assert.equal(errors.getErrorMessage(conflict, "Unable to create account."), conflict.message);

  assert.equal(errors.isPortalEmailConflictError(conflict), true);
  assert.equal(errors.isPortalEmailConflictError({ kind: "portal_email_conflict" }), true);
  assert.equal(errors.isPortalEmailConflictError(new Error("User already registered")), false);
  assert.equal(errors.isPortalEmailConflictError(null), false);
});

// ---------------------------------------------------------------------------
// 2. Service layer — both duplicate-email paths throw the typed conflict
// ---------------------------------------------------------------------------

test("the signup pre-check throws the typed conflict instead of a plain Error", () => {
  assert.match(backend, /await readPortalEmailState\(email\)/);
  assert.match(backend, /throw new PortalEmailConflictError\(\{/);
  // Both the pre-check and the obfuscated-user race resolve through it.
  assert.ok(backend.split("new PortalEmailConflictError({").length - 1 >= 2);
  // The exact dead-end sentence is gone from the service layer.
  assert.doesNotMatch(backend, /already registered as a/);
  assert.doesNotMatch(backend, /Please sign in through the \$\{portalLabel/);
});

test("the pre-check reads confirmation state and degrades when it is absent", () => {
  assert.match(backend, /client\.rpc\('job_email_portal_state'/);
  assert.match(backend, /client\.rpc\('job_email_portal_role'/);
  // Fallback only on a missing-function error; other failures still surface.
  assert.match(backend, /if \(!isMissingFunctionError\(stateError\)\)/);
  assert.match(backend, /isMissingFunctionError\(lookupError\)/);
  assert.match(backend, /emailConfirmed: null/);
});

test("resending the verification email stays a provider-owned auth action", () => {
  assert.match(provider, /resendVerification: \(email: string\) => Promise<void>/);
  assert.match(provider, /resendVerification = useCallback/);
  assert.match(provider, /auth\.resend\(\{/);
  assert.match(provider, /type: 'signup'/);
  assert.doesNotMatch(backend, /auth\.resend/);
});

// ---------------------------------------------------------------------------
// 3. UI — the message comes with a way out
// ---------------------------------------------------------------------------

test("both signup screens keep the typed conflict and render the recovery actions", () => {
  for (const [name, source] of [
    ["JobSeekerSignupScreen", seekerSignup],
    ["EmployerSignupScreen", employerSignup],
  ]) {
    assert.match(source, /isPortalEmailConflictError\(signupError\)/, `${name} must detect the conflict`);
    assert.match(source, /<SignupConflictRecovery/, `${name} must render the recovery actions`);
    assert.match(source, /onSignInInstead/, `${name} must expose the sign-in recovery`);
    assert.match(source, /onResendVerification/, `${name} must expose the resend recovery`);
  }
  assert.match(recovery, /conflict\.emailConfirmed === false/);
  assert.match(recovery, /Sign in instead/);
  assert.match(recovery, /onSignInInstead\(email\)/);
});

test("the shell routes a refused sign-up to a prefilled sign-in screen", () => {
  assert.match(app, /handleSignInInstead\('seeker', email\)/);
  assert.match(app, /handleSignInInstead\('employer', email\)/);
  assert.match(app, /goToLogin\(\{\s*email,\s*role,/);
  assert.match(app, /initialEmail=\{loginPrefill\?\.email\}/);
  assert.match(app, /initialRole=\{loginPrefill\?\.role\}/);
  assert.match(app, /notice=\{loginPrefill\?\.notice\}/);
  assert.match(app, /await resendVerification\(email\)/);
  // A plain "Login" navigation must not resurrect a stale prefill.
  assert.match(app, /setLoginPrefill\(prefill \?\? null\)/);
  assert.match(login, /useState\(initialEmail \?\? ''\)/);
  assert.match(login, /useState<UserRole>\(initialRole \?\? 'seeker'\)/);
  assert.match(login, /role="status"/);
});

test("the migration adds the state lookup without touching the existing one", () => {
  assert.match(migration, /create or replace function public\.job_email_portal_state\(p_email text\)/);
  assert.match(migration, /email_confirmed_at is not null/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute on function public\.job_email_portal_state\(text\) to anon,authenticated/);
  assert.match(migration, /left join public\.job_user_roles/);
  // The existing role-only function is left untouched (comment mentions only).
  assert.doesNotMatch(migration, /function public\.job_email_portal_role/);
});
