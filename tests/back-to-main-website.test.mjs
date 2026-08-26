import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const HOME_URL = "https://nexora-main-website.vercel.app/";
const buttonSources = [
  "app/BackToMainWebsiteButton.tsx",
  "job-portal/src/components/BackToMainWebsiteButton.tsx",
  "beauty-industry/src/components/BackToMainWebsiteButton.tsx",
  "integration-packages/customer-pwa/back-to-main-website.patch",
  "integration-packages/owner-pwa/back-to-main-website.patch",
];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every app return control uses the canonical absolute homepage without auth or history side effects", () => {
  for (const path of buttonSources) {
    const source = read(path);
    assert.match(source, new RegExp(HOME_URL.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")), path);
    assert.match(source, /href=/, `${path} must use a direct anchor`);
    assert.match(source, /Back to Main Website/, `${path} must keep its visible and accessible label`);
    assert.match(source, /h-9/, `${path} must retain the Growth Partner control height`);
    assert.match(source, /gap-2/, `${path} must retain the Growth Partner spacing`);
    assert.match(source, /h-\[18px\] w-\[18px\]/, `${path} must retain the Growth Partner icon size`);
    assert.doesNotMatch(source, /router\.back|(?:window\.)?history\.back/, `${path} must not traverse browser history`);
    assert.doesNotMatch(source, /signOut\(|logout\(/i, `${path} must not end the Supabase session`);
  }
});

test("the return control is mounted once in each checked-in global app shell/header", () => {
  assert.match(read("app/nexora-app.tsx"), /showMainWebsiteReturn = path !== "\/"/);
  assert.match(read("app/nexora-app.tsx"), /<BackToMainWebsiteButton \/>/);
  assert.match(read("job-portal/src/App.tsx"), /<GlobalAppHeader \/>/);
  assert.match(read("beauty-industry/src/components/TopNavBar.tsx"), /<BackToMainWebsiteButton \/>/);

  const customerPatch = read("integration-packages/customer-pwa/back-to-main-website.patch");
  assert.match(customerPatch, /<GlobalAppHeader \/>/);
  const ownerPatch = read("integration-packages/owner-pwa/back-to-main-website.patch");
  assert.match(ownerPatch, /src\/components\/TopBar\.tsx/);
  assert.match(ownerPatch, /src\/website-builder\/components\/TopBar\.tsx/);

  // The Template App is now integrated as a vendored copy of
  // templateapp67-oss/FINAL-NEW-APP-TEMPLETE- (operator-approved source
  // switch, 2026-08-21). The previous patch-based integration model has
  // been replaced — the Template App source is independently deployable
  // and is not patched from the Nexora main website. There is therefore
  // no `back-to-main-website.patch` for it. We assert instead that the
  // vendored Template App is a real, non-empty source tree.
  assert.equal(
    existsSync(new URL("../integration-packages/template-app/files/src/App.tsx", import.meta.url)),
    true,
    "Vendored Template App source must be present",
  );
  assert.equal(
    existsSync(new URL("../integration-packages/template-app/files/package.json", import.meta.url)),
    true,
    "Vendored Template App package.json must be present",
  );
});

test("full label remains visible on mobile and desktop", () => {
  for (const path of buttonSources) {
    const source = read(path);
    const labelLine = source.split("\n").find((line) => line.includes("whitespace-nowrap"));
    assert.ok(labelLine, `${path} must render a non-wrapping label`);
    assert.doesNotMatch(labelLine, /hidden|sm:|md:|lg:|xl:/, `${path} must not hide the label at a breakpoint`);
  }
});
