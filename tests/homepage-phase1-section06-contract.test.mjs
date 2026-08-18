/**
 * Homepage Phase 1 — Section 06 (Nearby Shops) contract tests.
 *
 * Implementation contract: PHASE1_SECTION06.md (repo root).
 *
 * Locks the deliverables and hard rules:
 *   • ONE upgraded section, stable id=nearby-shops, approved copy.
 *   • GPS only on explicit user action — no page-load permission request.
 *   • Honest default: Jaipur labelled as DEFAULT (never "detected").
 *   • Denied / timeout / unavailable / outside-Jaipur fallbacks with the
 *     exact public messages and actions; never blocks the section.
 *   • Reuses existing contracts: useNearby/useNearbySalons/Haversine,
 *     published catalog, salon_hours (Asia/Kolkata), /salons params.
 *   • Honest fields: Distance unavailable / No ratings yet / View services
 *     for pricing / Hours unavailable — never fake 0 km / 5.0 / price.
 *   • Verified badge tooltip = backend truth only; keyboard accessible;
 *     Escape + outside click close it.
 *   • Filters (distance/rating/price/gender/open now) + Clear All + active
 *     count; radius disabled without a usable Jaipur fix.
 *   • CTA → /salons with EXISTING parameter names only.
 *   • Loading skeleton, empty, filtered-empty, error, offline states.
 *   • Nothing else changed (Sections 01–05 markers intact, no deletions).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const globalsCss = await read("app/globals.css");

const sectionStart = nexoraApp.indexOf('id="nearby-shops"');
const sectionBlock = nexoraApp.slice(sectionStart, nexoraApp.indexOf("Sabhi Nearby Salons Dekhein", sectionStart) + 400);

// ---------------------------------------------------------------------------
// 1 — One upgraded section, stable id, approved copy
// ---------------------------------------------------------------------------

test("the nearby section exists exactly once with stable id + approved copy", () => {
  assert.equal((nexoraApp.match(/id="nearby-shops"/g) ?? []).length, 1, "no duplicate section");
  assert.match(sectionBlock, /aria-labelledby="nearby-shops-heading"/);
  assert.match(sectionBlock, /<h2 id="nearby-shops-heading">Aapke Paas Ke Salons<\/h2>/);
  assert.match(sectionBlock, /Near you/);
  assert.match(sectionBlock, /Apni location ya selected area ke aas-paas available salons, services aur prices explore karein\./);
  assert.match(sectionBlock, /scroll-mt-24/);
  // Old heading is gone (upgraded, not duplicated).
  assert.doesNotMatch(sectionBlock, /Salons near you/);
});

// ---------------------------------------------------------------------------
// 2 — GPS: user-action only, honest default, all fallbacks
// ---------------------------------------------------------------------------

test("GPS is never auto-requested on page load", () => {
  // Homepage observes location without starting the watcher.
  assert.match(nexoraApp, /const location = useLocation\(\{ auto: false \}\);/);
  // The only homepage start() paths are explicit clicks.
  assert.match(nexoraApp, /onClick=\{\(\) => \{ if \(!location\.isImproving\) location\.start\(\); \}\}/);
  assert.match(nexoraApp, /Use My Current Location/);
  // Reason is disclosed before the request.
  assert.match(sectionBlock, /Nearby salons aur distance dikhane ke liye location access use hoga\./);
  // Detecting state: compact, guarded against multiple prompts.
  assert.match(sectionBlock, /Location detect ho rahi hai…/);
  assert.match(sectionBlock, /disabled=\{location\.isImproving\}/);
});

test("default Jaipur state is honest (never presented as detected)", () => {
  assert.match(nexoraApp, /Jaipur \(default location\)/);
  assert.match(sectionBlock, /Jaipur default location hai — bina GPS ke bhi results milte hain\./);
  assert.match(sectionBlock, /<option value="Jaipur">Jaipur<\/option>/);
});

test("denied / unavailable / outside-Jaipur fallbacks use exact copy + actions", () => {
  assert.match(nexoraApp, /Location permission nahi mili\. Jaipur ke salons dikhaye ja rahe hain — aap area manually change kar sakte hain\./);
  assert.match(nexoraApp, /Current location detect nahi ho saki\. Jaipur se results dikhaye ja rahe hain\./);
  assert.match(nexoraApp, /Aapki current location Jaipur se bahar hai\. Filhaal Jaipur ke available salons dikhaye ja rahe hain\./);
  assert.match(sectionBlock, />Retry Location</);
  assert.match(sectionBlock, /\? "Select Area Manually" : "Select Area"/);
  assert.match(sectionBlock, />Continue with Jaipur</);
  // Outside-Jaipur uses the shared bounds module (no second geo system).
  assert.match(nexoraApp, /isInsideJaipur\(gpsFix\)/);
});

// ---------------------------------------------------------------------------
// 3 — Existing location/nearby contracts reused (not replaced)
// ---------------------------------------------------------------------------

test("existing hooks and Haversine ranking stay the engine", () => {
  assert.match(nexoraApp, /const \{ rows: nearbyRows, loading: nearbyLoading \} = useNearby\(online\);/);
  assert.match(nexoraApp, /useNearbySalons\(nearbyRows, location\.fix\)/);
  assert.match(nexoraApp, /haversineKm\(gpsFix\.latitude, gpsFix\.longitude/);
  assert.match(nexoraApp, /nearbyBuckets\.flatMap\(\(bucket\) => bucket\.items\)/);
  assert.match(nexoraApp, /nearbyRanked\.slice\(0, NEARBY_DISPLAY_LIMIT\)/);
  assert.match(nexoraApp, /function useNearby\(online: boolean\)/);
  // Distances only from approved salon coordinates.
  assert.match(nexoraApp, /item\.approval_status === "approved" &&\s*typeof item\.latitude === "number"/);
});

// ---------------------------------------------------------------------------
// 4 — Honest card fields (no fake distance/rating/price/hours)
// ---------------------------------------------------------------------------

test("card fallbacks are the exact honest labels", () => {
  assert.match(nexoraApp, /return p == null \? "View services for pricing"/);
  assert.match(nexoraApp, /Starts from \$\{money\(p\)\}/);
  assert.match(nexoraApp, /distanceKm != null \? `📍 \$\{formatDistance\(distanceKm\)\} away` : "Distance unavailable"/);
  assert.match(nexoraApp, /rating \?\? "No ratings yet"/);
  assert.match(nexoraApp, /openState === null \? "Hours unavailable"/);
  // Rating copy never invents a score.
  assert.match(nexoraApp, /if \(!\(r > 0\) \|\| !\(n > 0\)\) return null;/);
  // No raw coordinates in the card UI.
  const card = nexoraApp.slice(nexoraApp.indexOf("function NearbyShopCard("), nexoraApp.indexOf("function CatalogPage("));
  assert.doesNotMatch(card, /latitude\}|longitude\}/);
});

test("open/closed uses real salon_hours in Asia\/Kolkata with midnight wrap", () => {
  assert.match(nexoraApp, /timeZone: "Asia\/Kolkata"/);
  assert.match(nexoraApp, /if \(closesAt >= opensAt\) return now >= opensAt && now <= closesAt;/);
  assert.match(nexoraApp, /return now >= opensAt \|\| now <= closesAt; \/\/ crosses midnight/);
  assert.match(nexoraApp, /\.from\("salon_hours"\)/);
  // Open Now filter never includes unknown-hours listings.
  assert.match(nexoraApp, /salonOpenState\(row\.item, nearbyHours\[row\.item\.id\]\) === true/);
});

// ---------------------------------------------------------------------------
// 5 — Verified badge tooltip (backend truth, accessible)
// ---------------------------------------------------------------------------

test("verified tooltip is backend-truth only and keyboard accessible", () => {
  const badge = nexoraApp.slice(nexoraApp.indexOf("function VerifiedBadge("), nexoraApp.indexOf("type NearbyShopRow"));
  assert.match(badge, /This salon profile is approved for publishing on Nexora\./);
  assert.doesNotMatch(badge, /licence|license|government|ISO|certified/i);
  assert.match(badge, /aria-expanded=\{open\}/);
  assert.match(badge, /event\.key === "Escape"/);
  assert.match(badge, /!wrapRef\.current\.contains\(event\.target as Node\)/);
  assert.match(badge, /onMouseEnter=\{\(\) => setOpen\(true\)\}/);
  assert.match(badge, /role="tooltip"/);
});

// ---------------------------------------------------------------------------
// 6 — Filters + actions + CTA route contract
// ---------------------------------------------------------------------------

test("supported filters exist; radius is disabled without a usable fix", () => {
  assert.match(sectionBlock, /<option value="nearest">Nearest<\/option>/);
  assert.match(sectionBlock, /<option value="2">Within 2 km<\/option>/);
  assert.match(sectionBlock, /<option value="5">Within 5 km<\/option>/);
  assert.match(sectionBlock, /<option value="10">Within 10 km<\/option>/);
  assert.match(sectionBlock, /<option value="4\.5">4\.5\+<\/option>/);
  assert.match(sectionBlock, /<option value="4">4\.0\+<\/option>/);
  assert.match(sectionBlock, /<option value="3\.5">3\.5\+<\/option>/);
  assert.match(sectionBlock, /<option value="unisex">Unisex<\/option>/);
  assert.match(sectionBlock, /> Open now<\/label>/);
  assert.match(sectionBlock, /disabled=\{!nearbyFixUsable\}/);
  assert.match(sectionBlock, /Distance radius filter ke liye pehle/);
  // Price bands are the existing /salons bands (no invented universal bands).
  assert.match(sectionBlock, /<option value="50000">Under ₹500<\/option>/);
  assert.match(sectionBlock, /<option value="100000">Under ₹1,000<\/option>/);
  assert.match(sectionBlock, /<option value="200000">Under ₹2,000<\/option>/);
});

test("Apply / Clear All / active count / focus trap are wired", () => {
  assert.match(sectionBlock, />Apply Filters</);
  assert.match(sectionBlock, />Clear All</);
  assert.match(sectionBlock, /Filters\{nearbyActiveFilterCount > 0 \? ` \(\$\{nearbyActiveFilterCount\}\)` : ""\}/);
  assert.match(sectionBlock, /role="dialog" aria-modal="true"/);
  assert.match(nexoraApp, /if \(event\.shiftKey && document\.activeElement === first\)/);
  assert.match(nexoraApp, /nearbyFilterToggleRef\.current\?\.focus\(\)/);
});

test("rating filter never treats missing ratings as high-rated; gender stays neutral", () => {
  assert.match(nexoraApp, /Number\(row\.item\.rating_average \?\? 0\) >= min && Number\(row\.item\.review_count \?\? 0\) > 0/);
  assert.match(nexoraApp, /return genderHintFromCategory\(category\) === filter;/);
  assert.match(nexoraApp, /if \(\/unisex\/\.test\(c\)\) return "unisex";/);
});

test("CTA opens /salons with existing parameter names only", () => {
  const cta = nexoraApp.slice(nexoraApp.indexOf("const openAllNearbySalons"), nexoraApp.indexOf("// Filter panel: focus trap"));
  for (const key of ["area", "rating", "price", "gender", "open", "dist"]) {
    assert.ok(cta.includes(`"${key}"`), `${key} preserved`);
  }
  assert.match(cta, /navigate\(qs \? `\/salons\?\$\{qs\}` : "\/salons"\)/);
  assert.doesNotMatch(cta, /lat|lng|latitude|longitude/);
  // dist is shared only with a usable Jaipur fix and a numeric radius.
  assert.match(cta, /nearbyFixUsable && \(nearbyFilters\.radius === "2" \|\| nearbyFilters\.radius === "5" \|\| nearbyFilters\.radius === "10"\)/);
});

// ---------------------------------------------------------------------------
// 7 — States: loading / empty / filtered-empty / error / offline
// ---------------------------------------------------------------------------

test("all five states exist with exact public copy", () => {
  assert.match(sectionBlock, /className="nearby-grid" aria-hidden="true"/);
  assert.match(sectionBlock, /length: NEARBY_DISPLAY_LIMIT/);
  assert.match(sectionBlock, /Is area mein abhi koi salon nahi mila\./);
  assert.match(sectionBlock, /In filters ke saath koi salon nahi mila\./);
  assert.match(sectionBlock, /Nearby salons load nahi ho sake\. Dobara try karein\./);
  assert.match(sectionBlock, /Aap offline hain\. Live nearby results ke liye internet connection check karein\./);
  assert.match(sectionBlock, /Saved results/);
  assert.match(sectionBlock, />View All Salons</);
  assert.match(sectionBlock, />Change Area</);
  assert.match(sectionBlock, />Clear Filters</);
  // Display cap enforced.
  assert.match(nexoraApp, /const NEARBY_DISPLAY_LIMIT = 4;/);
  assert.match(nexoraApp, /\.slice\(0, NEARBY_DISPLAY_LIMIT\)/);
});

test("manual selection reuses JAIPUR_ZONES without duplication", () => {
  assert.match(sectionBlock, /JAIPUR_ZONES\.map/);
  const zoneDefs = nexoraApp.match(/const JAIPUR_ZONES/g) ?? [];
  assert.equal(zoneDefs.length, 1, "single source of truth");
});

// ---------------------------------------------------------------------------
// 8 — Responsive CSS + nothing else changed
// ---------------------------------------------------------------------------

test("responsive grid: 4-ish desktop, 2 tablet, 1 mobile + bottom sheet", () => {
  assert.match(globalsCss, /\.nearby-grid \{ display:grid; grid-template-columns:repeat\(auto-fill,minmax\(240px,1fr\)\); gap:22px; \}/);
  assert.match(globalsCss, /@media\(max-width:920px\) \{ \.nearby-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); \}/);
  assert.match(globalsCss, /@media\(max-width:620px\) \{ \.nearby-grid \{ grid-template-columns:1fr; \}/);
  assert.match(globalsCss, /\.nearby-filter-panel \{ position:fixed; left:0; right:0; bottom:0;/);
  assert.match(globalsCss, /\.nearby-controls > button \{ min-height:44px; \}/);
});

test("Sections 01–05 markers stay intact; no raw error text in section", () => {
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /id="nexora-apps"/);
  assert.match(nexoraApp, /id="categories"/);
  assert.match(nexoraApp, /content = <HomePage/);
  assert.doesNotMatch(sectionBlock, /\{catalogError\}/);
  assert.doesNotMatch(sectionBlock, /supabase\.co|rpc\(|process\.env/i);
});
