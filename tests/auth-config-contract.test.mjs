import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

test("Main Website uses only Next public Supabase variables", () => {
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(app, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(app, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/);
});

test("password auth and permanent profile role contract stay aligned", () => {
  assert.match(app, /auth\.signInWithPassword\(\{\s*email,\s*password\s*\}\)/);
  assert.match(app, /from\("profiles"\)[\s\S]*?select\("platform_role,is_active,full_name"\)/);
  assert.match(app, /signup_role:\s*role/);
  assert.match(app, /ensureProfileWithRetry/);
  assert.doesNotMatch(app, /profiles[\s\S]*\.upsert/);
});
