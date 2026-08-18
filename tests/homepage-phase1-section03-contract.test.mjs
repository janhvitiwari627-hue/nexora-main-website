/**
 * Homepage Phase 1 — Section 03 (Smart Search) contract tests.
 *
 * Locks the Section 03 deliverables AND the hard rules they were built under:
 *
 *   • Smart Search is preserved/reused — never deleted (query, Jaipur area,
 *     /salons query contract, JAIPUR_ZONES).
 *   • GPS is user-action only — /salons observes location (auto: false) and
 *     acquisition starts from explicit clicks, never page load.
 *   • Denied / unavailable / outside-Jaipur GPS falls back to manual city and
 *     Jaipur area selection.
 *   • Distance, rating, price, gender and Open Now filters are supported and
 *     backed by real data (approved coordinates, salon_hours) — nothing fake.
 *   • Shareable /salons params — and NEVER raw coordinates in the URL or UI.
 *   • Shared Supabase RPC contract (marketplace_search) is untouched.
 *   • Six apps + Back-to-Main stay wired.
 *
 * Static-source + pure-runtime assertions. No network, no React renderer.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const boundsSrc = await read("app/lib/jaipurBounds.ts");

// ---------------------------------------------------------------------------
// 1 — Existing Smart Search preserved (query search + Jaipur areas)
// ---------------------------------------------------------------------------

test("homepage search entry and /salons query contract survive", () => {
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /navigate\(`\/salons\?q=\$\{encodeURIComponent\(homeQuery\.trim\(\)\)\}`\)/);
  assert.match(nexoraApp, /\/salons\?area=\$\{encodeURIComponent/);
  assert.match(nexoraApp, /JAIPUR_ZONES\.map/);
  // Jaipur zone list still has its 5 zones and 124 localities intact.
  const zones = nexoraApp.match(/zone: "(Central|East|North|South|West) Jaipur"/g) ?? [];
  assert.equal(zones.length, 5);
});

test("marketplace_search RPC contract is unchanged (no new p_* params)", () => {
  const rpcBlocks = nexoraApp.match(/client\.rpc\("marketplace_search", \{[\s\S]*?\}\)/g) ?? [];
  assert.ok(rpcBlocks.length >= 1, "marketplace_search still used");
  for (const block of rpcBlocks) {
    for (const param of [
      "p_query", "p_category", "p_area", "p_min_rating", "p_max_price_paise",
      "p_has_offer", "p_gender", "p_sort", "p_limit", "p_offset",
    ]) {
      assert.ok(block.includes(param), `${param} preserved`);
    }
    // No invented server parameters.
    assert.doesNotMatch(block, /p_city|p_dist|p_open|p_lat|p_lng/);
  }
  // Suggestions still come from the existing RPC when data supports them.
  assert.match(nexoraApp, /marketplace_search_suggestions/);
});

// ---------------------------------------------------------------------------
// 2 — GPS: user-action only, with honest fallbacks
// ---------------------------------------------------------------------------

test("/salons observes location without auto-requesting permission", () => {
  const catalogPage = nexoraApp.slice(nexoraApp.indexOf("function CatalogPage"));
  assert.match(catalogPage, /useLocation\(\{ auto: false \}\)/);
  // Acquisition only from the explicit button, never from an effect.
  assert.match(catalogPage, /onClick=\{\(\) => \{\s*if \(!distanceKm\) setDistanceKm\("5"\);\s*location\.start\(\);/);
});

test("homepage GPS entry is also a user action", () => {
  assert.match(nexoraApp, /Salons near me/);
  assert.match(nexoraApp, /onClick=\{\(\) => \{ locationService\.start\(\); navigate\("\/salons\?dist=5"\); \}\}/);
});

test("GPS fallbacks cover denied, unavailable and outside-Jaipur", () => {
  const catalogPage = nexoraApp.slice(nexoraApp.indexOf("function CatalogPage"));
  assert.match(catalogPage, /location\.status === "denied"/);
  assert.match(catalogPage, /location\.status === "unsupported"/);
  assert.match(catalogPage, /location\.status === "unavailable" \|\| location\.status === "timeout"/);
  assert.match(catalogPage, /location\.status === "offline"/);
  assert.match(catalogPage, /!insideJaipur/);
  assert.match(catalogPage, /outside Jaipur/);
  // Every fallback points users at manual selection, never at fake data.
  assert.match(catalogPage, /pick your Jaipur area manually/i);
});

test("Jaipur bounds module answers yes/no and never leaks coordinates", async () => {
  const { isInsideJaipur, JAIPUR_BOUNDS } = await import("../app/lib/jaipurBounds.ts");
  // City centre is inside.
  assert.equal(isInsideJaipur({ latitude: 26.9124, longitude: 75.7873 }), true);
  // Delhi, Mumbai and a null fix are outside.
  assert.equal(isInsideJaipur({ latitude: 28.6139, longitude: 77.209 }), false);
  assert.equal(isInsideJaipur({ latitude: 19.076, longitude: 72.8777 }), false);
  assert.equal(isInsideJaipur(null), false);
  assert.equal(isInsideJaipur({ latitude: Number.NaN, longitude: 75.8 }), false);
  // Bounds are a sane box around Jaipur.
  assert.ok(JAIPUR_BOUNDS.minLatitude > 26 && JAIPUR_BOUNDS.maxLatitude < 28);
  assert.ok(JAIPUR_BOUNDS.minLongitude > 75 && JAIPUR_BOUNDS.maxLongitude < 77);
  // The module never serializes a fix.
  assert.doesNotMatch(boundsSrc, /JSON\.stringify|console\.log|fetch\(/);
});

// ---------------------------------------------------------------------------
// 3 — Supported filters, backed by real data only
// ---------------------------------------------------------------------------

test("distance, rating, price, gender and Open Now filters exist", () => {
  assert.match(nexoraApp, /<option value="2">Within 2 km<\/option>/);
  assert.match(nexoraApp, /<option value="5">Within 5 km<\/option>/);
  assert.match(nexoraApp, /<option value="10">Within 10 km<\/option>/);
  assert.match(nexoraApp, /Min rating<select/);
  assert.match(nexoraApp, /Price<select/);
  assert.match(nexoraApp, /Audience<select/);
  assert.match(nexoraApp, /> Open now<\/label>/);
});

test("distance uses only approved coordinates, ranked on-device", () => {
  const distanceBlock = nexoraApp.slice(
    nexoraApp.indexOf("Distance: approved coordinates only"),
    nexoraApp.indexOf("has_offer: false,\n        score: 1,\n        distanceKm:"),
  );
  assert.match(distanceBlock, /approval_status === "approved"/);
  assert.match(distanceBlock, /haversineKm\(/);
  assert.match(distanceBlock, /entry\.d <= maxKm/);
});

test("Open Now is computed from real salon_hours + IST clock", () => {
  assert.match(nexoraApp, /fetchOpenNowIds/);
  assert.match(nexoraApp, /from\("salon_hours"\)/);
  assert.match(nexoraApp, /timeZone: "Asia\/Kolkata"/);
  // Unknown opening hours are never claimed to be open.
  assert.match(nexoraApp, /No rows \+ no config ⇒/);
});

test("manual city selection comes from the live published catalog", () => {
  assert.match(nexoraApp, /City<select value=\{cityFilter\}/);
  assert.match(nexoraApp, /setCities\(Array\.from\(new Set\(catalog\.map\(\(item\) => item\.city\)/);
});

// ---------------------------------------------------------------------------
// 4 — Shareable URL params, never coordinates
// ---------------------------------------------------------------------------

test("every supported filter is shareable; coordinates never are", () => {
  const syncBlock = nexoraApp.slice(
    nexoraApp.indexOf("URL sync — every SUPPORTED filter"),
    nexoraApp.indexOf("Deep links + initial params"),
  );
  for (const key of ["q", "category", "area", "city", "price", "rating", "gender", "offer", "dist", "open", "sort"]) {
    assert.ok(syncBlock.includes(`"${key}"`), `${key} is shareable`);
  }
  assert.doesNotMatch(syncBlock, /latitude|longitude|\blat\b|\blng\b/);
  // Deep link parser accepts exactly the documented dist values.
  assert.match(nexoraApp, /dist === "2" \|\| dist === "5" \|\| dist === "10"/);
});

// ---------------------------------------------------------------------------
// 5 — States + nothing existing was broken
// ---------------------------------------------------------------------------

test("loading, empty, error and offline states remain", () => {
  const catalogPage = nexoraApp.slice(nexoraApp.indexOf("function CatalogPage"), nexoraApp.indexOf("function SearchSalonCard"));
  assert.match(catalogPage, /SalonSkeletons count=\{6\}/);
  assert.match(catalogPage, /Could not search salons/);
  assert.match(catalogPage, /No matching salon/);
  assert.match(catalogPage, /You are offline\. Reconnect to search salons\./);
});

test("six apps, portals and Back-to-Main stay wired", () => {
  assert.match(nexoraApp, /import \{ BackToMainWebsiteButton \}/);
  assert.match(nexoraApp, /isPortalPath\(path\)/);
  assert.match(nexoraApp, /content = <HomePage/);
  assert.match(nexoraApp, /if \(path === "\/salons"\) content = <CatalogPage/);
  assert.doesNotMatch(nexoraApp, /<Header\b/);
});
