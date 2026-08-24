// PHASE 8 — AUTH SCREENS (Job Portal Sub-App).
//
// Existing UI/branding is preserved: the screens stay purely presentational
// (props in, callbacks out — no Supabase imports). The shell (App.tsx) wires
// them to the canonical AuthProvider:
//
//   login            await signIn(email, password)
//   signup           authBackend.signUp(...)  ← documented architecture
//                    exception (portal metadata + duplicate-email product
//                    errors that the canonical 3-arg signUp cannot express)
//   forgot password  await forgotPassword(email)
//   reset password   await updatePassword(password)
//   logout           await signOut()
//
// Duplicate direct supabase.auth action calls are gone from components AND
// from the service layer (no signInWithPassword / resetPasswordForEmail /
// auth.updateUser / auth.signOut remain anywhere in the Sub-App).

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const app = await readFile(new URL("../job-portal/src/App.tsx", import.meta.url), "utf8");
const backend = await readFile(
  new URL("../job-portal/src/services/backend.ts", import.meta.url),
  "utf8",
);
const provider = await readFile(
  new URL("../job-portal/src/auth/AuthProvider.tsx", import.meta.url),
  "utf8",
);

function collectSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push({ path: full, source: readFileSync(full, "utf8") });
  }
  return out;
}
const componentSources = collectSources(
  fileURLToPath(new URL("../job-portal/src/components", import.meta.url)),
);

test("the shell consumes the five canonical actions from useAuth()", () => {
  assert.match(app, /const \{ signIn, forgotPassword, updatePassword, signOut \} = useAuth\(\);/);
  assert.match(app, /await signIn\(email, password\);/);
  assert.match(app, /forgotPassword\(email\)/);
  assert.match(app, /await updatePassword\(password\);/);
  assert.match(app, /void signOut\(\)/);
  assert.match(app, /await signOut\(\)/);
});

test("no duplicate direct supabase auth ACTION calls remain in the Sub-App", () => {
  for (const [name, source] of [["App.tsx", app], ["backend.ts", backend]]) {
    assert.doesNotMatch(source, /signInWithPassword/, `${name} must not sign in directly`);
    assert.doesNotMatch(source, /resetPasswordForEmail/, `${name} must not reset directly`);
    assert.doesNotMatch(source, /auth\.updateUser/, `${name} must not update the password directly`);
    assert.doesNotMatch(source, /auth\.signOut/, `${name} must not sign out directly`);
  }
  // The provider is the single home of those calls.
  for (const call of ["signInWithPassword", "resetPasswordForEmail", "updateUser", "signOut()"]) {
    assert.ok(provider.includes(call), `AuthProvider must own ${call}`);
  }
});

test("screens stay presentational — zero Supabase knowledge, UI untouched", () => {
  for (const { path, source } of componentSources) {
    assert.doesNotMatch(source, /from ['"].*lib\/supabase['"]/, `${path} must not import the client`);
    assert.doesNotMatch(source, /supabase\.auth|supabase\.from/, `${path} must not touch supabase`);
    assert.doesNotMatch(source, /useAuth\(/, `${path} receives callbacks via props, not context`);
  }
  // The existing branded screens still exist with their existing surfaces.
  const screens = componentSources.map((s) => s.path);
  for (const required of [
    "LoginScreen.tsx",
    "JobSeekerSignupScreen.tsx",
    "EmployerSignupScreen.tsx",
    "ForgotPasswordScreen.tsx",
    "ResetPasswordScreen.tsx",
  ]) {
    assert.ok(screens.some((p) => p.endsWith(required)), `${required} must still exist`);
  }
});

test("failed role/admin gates roll the canonical session back via signOut()", () => {
  assert.match(app, /await authBackend\.registerRole\(selectedRole\);[\s\S]{0,120}await signOut\(\)\.catch\(\(\) => undefined\);/);
  assert.match(app, /user = await assertAdminRole\(\);[\s\S]{0,120}await signOut\(\)\.catch\(\(\) => undefined\);/);
});

test("only the two documented auth exceptions remain in the service layer", () => {
  // 1. Portal signup (metadata + duplicate-email product errors).
  assert.equal(backend.split(".auth.signUp(").length - 1, 1);
  assert.match(backend, /PHASE 8 EXCEPTION[\s\S]{0,400}supabase\.auth\.signUp/);
  // 2. OAuth (not part of the canonical provider contract).
  assert.equal(backend.split("signInWithOAuth(").length - 1, 1);
  assert.match(backend, /PHASE 8 EXCEPTION — OAuth/);
  // Session reads (not actions) are allowed in the service layer.
  assert.match(backend, /export async function getVerifiedUser/);
});

test("friendly error mapping is preserved on the canonical paths", () => {
  assert.match(backend, /export function mapAuthError/);
  assert.match(app, /throw mapAuthError\(error\);/);
});
