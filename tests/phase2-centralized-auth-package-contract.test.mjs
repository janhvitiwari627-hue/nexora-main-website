import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packages = [
  {
    name: "Customer",
    dir: "customer-pwa",
    base: "ff93504467b0",
    role: "customer",
    clientFile: "src/lib/supabaseClient.ts",
    appFile: "src/App.tsx",
  },
  {
    name: "Owner",
    dir: "owner-pwa",
    base: "47fb48e7767e",
    role: "business_user",
    clientFile: "src/lib/supabase.ts",
    appFile: "src/App.tsx",
  },
  {
    name: "Growth Partner",
    dir: "growth-partner-pwa",
    base: "e00f0ed1acea",
    role: "growth_partner",
    clientFile: "src/lib/supabaseClient.ts",
    appFile: "src/App.tsx",
  },
];

const fixtures = await Promise.all(
  packages.map(async (pkg) => {
    const patch = await readFile(
      new URL(`../integration-packages/${pkg.dir}/auth-integration.patch`, import.meta.url),
      "utf8",
    );
    const readme = await readFile(
      new URL(`../integration-packages/${pkg.dir}/README.md`, import.meta.url),
      "utf8",
    );
    return {
      ...pkg,
      patch,
      readme,
      added: patch
        .split("\n")
        .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
        .join("\n"),
    };
  }),
);

for (const pkg of fixtures) {
  test(`${pkg.name} Phase 2 auth patch targets the verified current main`, () => {
    assert.match(pkg.readme, new RegExp(pkg.base));
    assert.match(pkg.readme, /auth-integration\.patch/);
    assert.match(pkg.readme, /PR #48/);
    assert.match(pkg.readme, /npm run build/);
  });

  test(`${pkg.name} vendors and aliases @nexora/auth`, () => {
    assert.match(pkg.patch, /src\/vendor\/nexora-auth\/index\.ts/);
    assert.match(pkg.patch, /src\/vendor\/nexora-auth\/AuthProvider\.tsx/);
    assert.match(pkg.added, /from ['"]@nexora\/auth['"]/);
    assert.match(pkg.added, /@nexora\/auth.*vendor\/nexora-auth/);
    assert.match(pkg.added, /AuthProvider/);
  });

  test(`${pkg.name} uses the shared validated Supabase client`, () => {
    const escaped = pkg.clientFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(pkg.patch, new RegExp(escaped));
    assert.match(pkg.added, /getSupabaseClient/);
    assert.match(pkg.added, /supabaseConfigErrorMessage|isSupabaseConfigured/);
    assert.match(pkg.added, /qwaehqsmodekbgvnaavz/);
    assert.doesNotMatch(pkg.added, /eyJhbGciOiJIUzI1Ni/);
  });

  test(`${pkg.name} mounts AuthProvider and consumes useAuth`, () => {
    assert.match(pkg.patch, /src\/main\.tsx/);
    assert.match(pkg.added, /<AuthProvider>/);
    const escaped = pkg.appFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(pkg.patch, new RegExp(escaped));
    assert.match(pkg.added, /useAuth\(/);
  });

  test(`${pkg.name} enforces the permanent platform role`, () => {
    assert.match(pkg.added, new RegExp(`platform_role|role !== ['"]${pkg.role}['"]`));
    assert.match(pkg.added, /signOut\(/);
    if (pkg.name === "Growth Partner") {
      assert.match(pkg.added, /isAuthenticated|LoginForm|Growth Partner role/);
    } else {
      assert.match(pkg.added, /role-conflict|RoleConflict|cannot access|does not have/);
    }
  });

  test(`${pkg.name} preserves PKCE and redirect configuration`, () => {
    assert.match(pkg.added, /flowType: "pkce"|flowType: 'pkce'/);
    assert.match(
      pkg.added,
      /VITE_NEXORA_ALLOWED_AUTH_ORIGINS|NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS/,
    );
    assert.match(pkg.readme, /Redirect URLs/);
  });
}

test("Growth Partner patch accepts legacy district_partner spelling", () => {
  const growth = fixtures.find((pkg) => pkg.dir === "growth-partner-pwa");
  assert.ok(growth);
  assert.match(growth.patch, /district_partner/);
});
