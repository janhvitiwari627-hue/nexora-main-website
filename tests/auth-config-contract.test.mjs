import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../packages/auth/src/service.ts", import.meta.url), "utf8");
const session = await readFile(new URL("../packages/auth/src/session.ts", import.meta.url), "utf8");

test("Main Website uses only Next public Supabase variables", () => {
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
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
