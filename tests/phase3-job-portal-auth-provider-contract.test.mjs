// PHASE 3 — AUTH PROVIDER (Sub-App).
//
// The Job Portal Sub-App must ship a root AuthProvider that owns exactly one
// auth state machine on top of the Phase 2 canonical Supabase client:
//
//   * initial session via supabase.auth.getSession()
//   * exactly one supabase.auth.onAuthStateChange(...) listener handling
//     INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
//     and PASSWORD_RECOVERY
//   * subscription.unsubscribe() during effect cleanup
//   * the canonical context surface:
//       session / user / profile / loading
//       signIn / signUp / forgotPassword / updatePassword / signOut /
//       refreshProfile
//
// Static contract tests only — runs with no network and no credentials.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const provider = await readFile(
  new URL("../job-portal/src/auth/AuthProvider.tsx", import.meta.url),
  "utf8",
);
const main = await readFile(new URL("../job-portal/src/main.tsx", import.meta.url), "utf8");

test("AuthProvider exposes the exact Phase 3 context value", () => {
  assert.match(provider, /session: Session \| null/);
  assert.match(provider, /user: User \| null/);
  assert.match(provider, /profile: Profile \| null/);
  assert.match(provider, /loading: boolean/);

  assert.match(provider, /signIn: \(email: string, password: string\) => Promise<void>/);
  assert.match(
    provider,
    /signUp: \(email: string, password: string, fullName: string\) => Promise<void>/,
  );
  assert.match(provider, /forgotPassword: \(email: string\) => Promise<void>/);
  assert.match(provider, /updatePassword: \(password: string\) => Promise<void>/);
  assert.match(provider, /signOut: \(\) => Promise<void>/);
  assert.match(provider, /refreshProfile: \(\) => Promise<void>/);

  assert.match(provider, /export function useAuth\(\): AuthContextValue/);
  assert.match(provider, /useAuth must be used within an <AuthProvider>/);
});

test("initial session comes from getSession and changes from one auth listener", () => {
  assert.match(provider, /\.auth\s*\n?\s*\.getSession\(\)|\.auth\.getSession\(\)/);
  // Count real call sites only — doc comments may mention the API by name.
  const code = provider.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const listenerCount = code.split("onAuthStateChange(").length - 1;
  assert.equal(listenerCount, 1, "the provider must register exactly one auth listener");
});

test("every required auth event is handled", () => {
  for (const event of [
    "INITIAL_SESSION",
    "SIGNED_IN",
    "SIGNED_OUT",
    "TOKEN_REFRESHED",
    "USER_UPDATED",
    "PASSWORD_RECOVERY",
  ]) {
    assert.match(provider, new RegExp(`case '${event}':`), `${event} must be handled`);
  }
});

test("the listener is torn down with subscription.unsubscribe() during cleanup", () => {
  assert.match(provider, /subscription\.unsubscribe\(\);/);
  // The unsubscribe call must live inside the effect's cleanup function.
  const cleanup = provider.slice(provider.indexOf("return () => {", provider.indexOf("onAuthStateChange")));
  assert.match(cleanup, /subscription\.unsubscribe\(\);/);
});

test("auth methods delegate to the canonical Supabase client", () => {
  assert.match(provider, /from ['"]\.\.\/lib\/supabase['"]/);
  assert.match(provider, /auth\.signInWithPassword\(\{ email: email\.trim\(\), password \}\)/);
  assert.match(provider, /auth\.signUp\(/);
  assert.match(provider, /full_name: fullName\.trim\(\)/);
  assert.match(provider, /auth\.resetPasswordForEmail\(/);
  assert.match(provider, /auth\.updateUser\(\{ password \}\)/);
  assert.match(provider, /auth\.signOut\(\)/);
});

test("the profile is the caller-owned profiles row and can be refreshed", () => {
  assert.match(provider, /\.from\('profiles'\)/);
  assert.match(provider, /\.eq\('id', userId\)/);
  assert.match(provider, /refreshProfile/);
});

test("no credentials, server-only variables or foreign env sources leak in", () => {
  assert.doesNotMatch(provider, /eyJhbGciOiJIUzI1Ni\./);
  assert.doesNotMatch(provider, /SUPABASE_SERVICE_ROLE|sb_secret_/);
  assert.doesNotMatch(provider, /NEXT_PUBLIC_SUPABASE/);
  assert.doesNotMatch(provider, /createClient\(/);
});

test("the provider is mounted once at the Sub-App root", () => {
  assert.match(main, /import \{AuthProvider\} from '\.\/auth\/AuthProvider\.tsx'/);
  assert.match(main, /<AuthProvider>\s*<App \/>\s*<\/AuthProvider>/);
  assert.equal(main.split("<AuthProvider>").length - 1, 1, "exactly one provider mount");
});
