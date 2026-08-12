import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = await readFile(new URL("../app/NexoraRoot.tsx", import.meta.url), "utf8");
const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const catchAll = await readFile(new URL("../app/[...path]/page.tsx", import.meta.url), "utf8");

test("Phase 3 mounts one shared AuthProvider for every main website route", () => {
  assert.match(root, /<AuthProvider>/);
  assert.match(root, /<NexoraApp initialPath=\{initialPath\}/);
  assert.match(page, /NexoraRoot/);
  assert.match(catchAll, /NexoraRoot/);
});

test("NexoraApp consumes the shared useAuth state instead of owning a listener", () => {
  assert.match(app, /useAuth\(\)/);
  assert.match(app, /providerSignOut/);
  const appBody = app.slice(app.indexOf("export function NexoraApp"));
  const providerBoundary = appBody.slice(0, appBody.indexOf("// Auto GPS"));
  assert.doesNotMatch(providerBoundary, /onAuthStateChange/);
});

test("unmounted delivery and admin portals remain authenticated role fallbacks", () => {
  assert.match(app, /UnavailableAuthenticatedPortal/);
  assert.match(app, /delivery_partner/);
  assert.match(app, /expectedRole = isAdmin \? "admin" : "delivery_partner"/);
  assert.match(app, /portal is not mounted/);
});
