import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../app/nexora-app.tsx", import.meta.url),
  "utf8",
);
const nextConfig = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);

test("active login client accepts the configured Vite Supabase variables", () => {
  assert.match(app, /\(import\.meta as ImportMeta/);
  assert.match(app, /viteEnv\.VITE_SUPABASE_URL/);
  assert.match(app, /viteEnv\.VITE_SUPABASE_ANON_KEY/);
  assert.match(
    nextConfig,
    /NEXT_PUBLIC_SUPABASE_URL:[\s\S]*process\.env\.VITE_SUPABASE_URL/,
  );
  assert.match(
    nextConfig,
    /NEXT_PUBLIC_SUPABASE_ANON_KEY:[\s\S]*process\.env\.VITE_SUPABASE_ANON_KEY/,
  );
});

test("password auth and the staging profile role contract stay aligned", () => {
  assert.match(app, /auth\.signInWithPassword\(\{\s*email,\s*password\s*\}\)/);
  assert.match(
    app,
    /from\("profiles"\)\.select\("platform_role,is_active"\)/,
  );
  assert.match(
    app,
    /signup_role:\s*role/,
  );
});
