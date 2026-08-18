/**
 * Homepage Phase 1 — Section 02 Hero acceptance tests.
 *
 * Verifies the FINAL Hero acceptance requirements, on top of the existing
 * six-app/auth/navigation contract suite:
 *
 *   1. Final approved heading and supporting copy are in place.
 *   2. Primary CTA connects to `/salons`.
 *   3. Secondary CTA ("Nexora Apps Dekhein") scrolls to the apps section
 *      whose heading is "Aap Nexora Par Kya Karna Chahte Hain?", with
 *      smooth scrolling that respects prefers-reduced-motion.
 *   4. Trust claims come from config (app/lib/heroTrustClaims.ts) and every
 *      claim carries a backend/code verification reference. The unsupported
 *      "no hidden markup" claim is gone.
 *   5. Smart Search is preserved intact for Section 03.
 *   6. The Hero image is local, responsive (srcset) and production-safe.
 *   7. Keyboard accessibility + reduced motion support exist in CSS.
 *
 * Static-source + pure-runtime assertions. No network, no React renderer.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const globalsCss = await read("app/globals.css");
const trustClaimsSrc = await read("app/lib/heroTrustClaims.ts");

// ---------------------------------------------------------------------------
// 1 — Final approved copy
// ---------------------------------------------------------------------------

test("Hero uses the final approved heading", () => {
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /Sab Kuch Ek Platform Par/);
  // The approved heading lives in the h1 that labels the Hero section.
  assert.match(nexoraApp, /id="hero-heading"/);
  assert.match(nexoraApp, /aria-labelledby="hero-heading"/);
});

test("Hero uses the final approved supporting copy", () => {
  assert.match(
    nexoraApp,
    /Salon book karein, apna business manage karein, beauty jobs paayein,\s*distributors se connect karein aur apni website launch karein\./,
  );
});

// ---------------------------------------------------------------------------
// 2 + 3 — CTAs
// ---------------------------------------------------------------------------

test("primary CTA navigates to /salons", () => {
  const ctaBlock = nexoraApp.slice(nexoraApp.indexOf("Calls to action"));
  assert.match(ctaBlock, /onClick=\{\(\) => navigate\("\/salons"\)\}/);
});

test("secondary CTA scrolls to the apps section and honours reduced motion", () => {
  assert.match(nexoraApp, /Nexora Apps Dekhein/);
  assert.match(nexoraApp, /href="#nexora-apps"/);
  assert.match(nexoraApp, /scrollToAppsSection/);
  // Reduced-motion aware: matchMedia gate + behavior switch.
  assert.match(nexoraApp, /prefers-reduced-motion: reduce/);
  assert.match(nexoraApp, /behavior: reduced \? "auto" : "smooth"/);
  // Keyboard/AT: focus lands on the target after the jump.
  assert.match(nexoraApp, /target\.focus\(\{ preventScroll: true \}\)/);
});

test("the apps section heading is 'Aap Nexora Par Kya Karna Chahte Hain?'", () => {
  const idx = nexoraApp.indexOf('id="nexora-apps"');
  assert.ok(idx !== -1, "apps section must keep id=nexora-apps");
  const section = nexoraApp.slice(idx, idx + 900);
  assert.match(section, /<h2>Aap Nexora Par Kya Karna Chahte Hain\?<\/h2>/);
  // Sticky-header clearance for the scroll target is preserved.
  assert.match(section, /scroll-mt-24/);
});

// ---------------------------------------------------------------------------
// 4 — Verified trust claims only
// ---------------------------------------------------------------------------

test("trust claims render from the verified config, never inline strings", () => {
  assert.match(nexoraApp, /import \{ HERO_TRUST_CLAIMS \} from "\.\/lib\/heroTrustClaims"/);
  assert.match(nexoraApp, /HERO_TRUST_CLAIMS\.map/);
  // The old unsupported claim must be gone from the rendered page.
  assert.doesNotMatch(nexoraApp, /no hidden markup/i);
});

test("every configured trust claim carries a verification reference", async () => {
  const { HERO_TRUST_CLAIMS, HERO_TRUST_CLAIM_TEXTS } = await import("../app/lib/heroTrustClaims.ts");
  assert.ok(HERO_TRUST_CLAIMS.length >= 3, "the Hero keeps its trust list");
  for (const { claim, verifiedBy } of HERO_TRUST_CLAIMS) {
    assert.ok(claim.trim().length > 10, `claim too short: ${claim}`);
    assert.ok(verifiedBy.trim().length > 20, `missing verification for: ${claim}`);
  }
  assert.deepEqual(HERO_TRUST_CLAIM_TEXTS, HERO_TRUST_CLAIMS.map((c) => c.claim));
  // The platform takes a disclosed fee, so "no hidden markup" can never be
  // verified and must stay out of the config.
  assert.ok(!HERO_TRUST_CLAIMS.some((c) => /hidden markup/i.test(c.claim)));
});

test("trust claim verifications point at real gates in the codebase", async () => {
  const { HERO_TRUST_CLAIMS } = await import("../app/lib/heroTrustClaims.ts");
  const joined = HERO_TRUST_CLAIMS.map((c) => c.verifiedBy).join("\n");
  // Catalog publication gate referenced in fetchCatalogFromTables.
  assert.match(nexoraApp, /\.eq\("verified", true\)/);
  assert.match(nexoraApp, /\.eq\("is_active", true\)/);
  assert.match(nexoraApp, /is_published/);
  // Locked business rules self-test exists in the backend docs.
  const businessRules = await read("supabase/BUSINESS_RULES.md");
  assert.match(businessRules, /verify_business_rules\(\)/);
  assert.match(joined, /verify_business_rules/);
  // Shared single-project auth backs the one-account claim.
  assert.match(joined, /packages\/auth/);
});

// ---------------------------------------------------------------------------
// 5 — Smart Search preserved for Section 03
// ---------------------------------------------------------------------------

test("Smart Search survives untouched for Section 03", () => {
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /aria-label="Search salons, services and areas"/);
  assert.match(nexoraApp, /aria-label="Choose your area in Jaipur"/);
  assert.match(nexoraApp, /JAIPUR_ZONES\.map/);
  // Same /salons query contract (q= and area=).
  assert.match(nexoraApp, /navigate\(`\/salons\?q=\$\{encodeURIComponent\(homeQuery\.trim\(\)\)\}`\)/);
  assert.match(nexoraApp, /\/salons\?area=\$\{encodeURIComponent/);
});

// ---------------------------------------------------------------------------
// 6 — Local, optimized, production-safe Hero image
// ---------------------------------------------------------------------------

test("Hero image is local, responsive and CLS-safe", () => {
  const heroBlock = nexoraApp.slice(
    nexoraApp.indexOf("id=\"hero\""),
    nexoraApp.indexOf("SMART SEARCH"),
  );
  // No remote/expiring URLs in the Hero visual.
  assert.doesNotMatch(heroBlock, /src="https?:\/\//);
  assert.doesNotMatch(heroBlock, /srcSet="https?:\/\//);
  // All three local renditions exist and are wired as a srcset.
  for (const rendition of ["hero-salon-480.jpg", "hero-salon-800.jpg", "hero-salon-1200.jpg"]) {
    assert.ok(existsSync(new URL(`../public/home/${rendition}`, import.meta.url)), rendition);
    assert.ok(heroBlock.includes(`/home/${rendition}`), `${rendition} in srcset/src`);
  }
  // Reserved space + eager LCP hints stay in place.
  assert.match(heroBlock, /width=\{1200\}/);
  assert.match(heroBlock, /height=\{1600\}/);
  assert.match(heroBlock, /loading="eager"/);
  assert.match(heroBlock, /alt="/);
});

// ---------------------------------------------------------------------------
// 7 — Keyboard accessibility + reduced motion in CSS
// ---------------------------------------------------------------------------

test("focus states and reduced motion are present in the stylesheet", () => {
  // Focus-visible outlines on both CTAs (Tailwind utilities in the TSX).
  assert.match(nexoraApp, /focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-\[#8e004b\]/);
  // Reduced-motion kills Hero entrance animation without hiding content.
  assert.match(globalsCss, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(globalsCss, /\.hero2-rise, \.hero2-dot \{ animation:none !important/);
  // Smooth scrolling only when motion is allowed.
  assert.match(globalsCss, /@media \(prefers-reduced-motion:no-preference\)/);
  assert.match(globalsCss, /html \{ scroll-behavior:smooth; \}/);
  // Programmatic focus target does not draw a misleading ring.
  assert.match(globalsCss, /#nexora-apps:focus \{ outline:none; \}/);
});

// ---------------------------------------------------------------------------
// Guard rails — nothing outside the Hero was touched
// ---------------------------------------------------------------------------

test("homepage shell, routing and six-app wiring stay intact", () => {
  assert.match(nexoraApp, /content = <HomePage/);
  assert.match(nexoraApp, /if \(path === "\/salons"\) content = <CatalogPage/);
  assert.doesNotMatch(nexoraApp, /<Header\b/);
  assert.match(trustClaimsSrc, /export const HERO_TRUST_CLAIMS/);
  // The trust module is data only — no JSX, no React, no navigation.
  assert.doesNotMatch(trustClaimsSrc, /<[A-Za-z]/);
  assert.doesNotMatch(trustClaimsSrc, /window\.location|router\.push|from "react"/);
});
