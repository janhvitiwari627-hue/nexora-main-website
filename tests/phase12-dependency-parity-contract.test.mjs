// PHASE 12 — DEPENDENCY PARITY.
//
// Audited pairs: @supabase/supabase-js, react, react-dom, typescript, vite.
//
// Policy (deliberately NOT "everything identical"):
//   * @supabase/supabase-js — the Job Portal workspace must resolve to the
//     SAME physical copy as the root (a nested second copy produced two
//     incompatible SupabaseClient classes in one bundle);
//   * react/react-dom       — one major (19) everywhere; the workspace ranges
//     must admit the root-pinned version so npm hoists a single copy;
//   * typescript / vite     — the root (Next/vinext + Cloudflare toolchain)
//     intentionally differs from the Vite Sub-Apps; the Sub-Apps must agree
//     WITH EACH OTHER;
//   * shared packages (@nexora/auth, @nexora/location) peer ranges must be
//     satisfied by every consumer;
//   * lockfiles are preserved — root package-lock.json stays authoritative
//     and the Beauty Industry app keeps its own isolated lockfiles.
//
// No blind upgrades: only the supabase-js alignment was a necessary change.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readJson = async (path) => JSON.parse(await read(path));

const root = await readJson("package.json");
const jobPortal = await readJson("job-portal/package.json");
const beauty = await readJson("beauty-industry/package.json");
const template = await readJson("integration-packages/template-app/files/package.json");
const authPkg = await readJson("packages/auth/package.json");
const locationPkg = await readJson("packages/location/package.json");
const lockfile = await read("package-lock.json");

const dep = (pkg, name) =>
  pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name];

test("supabase-js resolves to one physical copy pinned by the root", () => {
  // Exact pin at the root — never a floating version.
  assert.match(dep(root, "@supabase/supabase-js"), /^\d+\.\d+\.\d+$/);
  // The workspace uses the very same exact version…
  assert.equal(dep(jobPortal, "@supabase/supabase-js"), dep(root, "@supabase/supabase-js"));
  // …so the lockfile must contain NO nested copy under the workspace.
  assert.ok(
    !lockfile.includes('"job-portal/node_modules/@supabase/supabase-js"'),
    "a nested supabase-js copy would recreate the dual-class bundle bug",
  );
});

test("react stays a single major everywhere with hoist-compatible ranges", () => {
  const rootReact = dep(root, "react");
  assert.match(rootReact, /^19\./, "root pins React 19 exactly");
  for (const [name, pkg] of [["job-portal", jobPortal], ["beauty-industry", beauty], ["template-app", template]]) {
    for (const lib of ["react", "react-dom"]) {
      assert.match(dep(pkg, lib) ?? "", /^\^?19\./, `${name} ${lib} must stay on major 19`);
    }
  }
  // The workspace range must admit the root version (single hoisted copy).
  assert.ok(!lockfile.includes('"job-portal/node_modules/react"'), "react must hoist to one copy");
});

test("shared package peer ranges are satisfied by every consumer", () => {
  for (const pkg of [authPkg, locationPkg]) {
    assert.equal(pkg.peerDependencies["@supabase/supabase-js"], ">=2.90.0");
    assert.equal(pkg.peerDependencies.react, ">=18");
  }
  const [major, minor] = dep(root, "@supabase/supabase-js").split(".").map(Number);
  assert.ok(major === 2 && minor >= 90, "root supabase-js must satisfy the shared peer range");
  assert.ok(Number(dep(root, "react").split(".")[0]) >= 18);
});

test("toolchain divergence is intentional and bounded", () => {
  // The root builds with Next/vinext + Cloudflare on its own Vite major.
  assert.ok(dep(root, "vite"), "root declares its toolchain vite explicitly");
  assert.ok(dep(root, "typescript"), "root declares typescript explicitly");
  // The Vite Sub-Apps agree with each other (same major / minor family).
  assert.equal(dep(jobPortal, "vite"), dep(beauty, "vite"));
  assert.equal(dep(jobPortal, "typescript"), dep(beauty, "typescript"));
  assert.equal(dep(template, "vite"), dep(jobPortal, "vite"));
  assert.equal(dep(template, "typescript"), dep(jobPortal, "typescript"));
});

test("lockfiles are preserved where they belong", async () => {
  assert.ok(JSON.parse(lockfile).lockfileVersion >= 2, "root package-lock.json is authoritative");
  // Beauty Industry deliberately keeps isolated lockfiles (its build script
  // installs inside beauty-industry/, outside the root workspaces).
  await read("beauty-industry/package-lock.json");
  assert.equal(root.workspaces.includes("job-portal"), true);
  assert.equal(root.workspaces.length, 1, "beauty-industry must stay outside the workspaces");
});
