/**
 * Homepage Phase 1 — Section 05 (Beauty Categories) contract tests.
 *
 * Implementation contract: PHASE1_SECTION05.md (repo root).
 *
 * Locks the deliverables and hard rules:
 *   • ONE upgraded section, stable id=categories, approved heading + copy.
 *   • LIVE data source preserved — `marketplace_categories` RPC via
 *     useMarketplaceCategories; never replaced by hardcoded categories.
 *   • Real counts only — unavailable counts are NEVER faked as 0; neutral
 *     copy "Explore available listings" instead; 1 salon / 2 salons grammar.
 *   • Admin order preserved (no client re-sort); display cap + expandable
 *     "Sabhi Categories Dekhein" control.
 *   • Approved icon library (whitelist) — raw emoji / raw DB strings never
 *     render; consistent generic fallback.
 *   • Category click → /salons?category=… ; "Sabhi Salons Dekhein" → /salons.
 *   • Header Categories link smooth-scrolls to #categories (reduced-motion
 *     aware); sticky-header scroll margin present.
 *   • Loading skeleton grid + empty + error/retry + offline ("Saved results")
 *     states with exact public-safe copy; no raw error/RPC/admin text.
 *   • Screen-reader live region; keyboard-accessible buttons; responsive grid.
 *   • Nothing else changed (Hero, Smart Search, six-app grid, routes).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const globalsCss = await read("app/globals.css");
const iconsSrc = await read("app/lib/categoryIcons.tsx");

const sectionStart = nexoraApp.indexOf('id="categories"');
const sectionBlock = nexoraApp.slice(sectionStart, nexoraApp.indexOf("</section>)}", sectionStart));

// ---------------------------------------------------------------------------
// 1 — One upgraded section, stable id, approved heading + copy
// ---------------------------------------------------------------------------

test("the categories section exists exactly once with stable id + approved copy", () => {
  assert.equal((nexoraApp.match(/id="categories"/g) ?? []).length, 1, "no duplicate section");
  assert.match(sectionBlock, /aria-labelledby="categories-heading"/);
  assert.match(sectionBlock, /<h2 id="categories-heading">Beauty Categories Explore Karein<\/h2>/);
  assert.match(sectionBlock, /Browse by category/);
  assert.match(
    sectionBlock,
    /Salon, spa, makeup, hair, nails aur doosri beauty services apni zaroorat ke hisaab se dhoondhein\./,
  );
  assert.match(sectionBlock, /scroll-mt-24/);
});

// ---------------------------------------------------------------------------
// 2 — Live data source preserved, admin order intact, no fake data
// ---------------------------------------------------------------------------

test("live hook + RPC stay the data source (no hardcoded categories)", () => {
  assert.match(sectionBlock, /CategoriesGrid categories=\{adminCategories\}/);
  assert.match(nexoraApp, /client\.rpc\("marketplace_categories"\)/);
  assert.match(nexoraApp, /function useMarketplaceCategories\(online: boolean\)/);
  assert.match(nexoraApp, /const CANONICAL_CATEGORIES = \[/);
  // No client-side re-sort: admin order is authoritative.
  assert.doesNotMatch(nexoraApp.slice(nexoraApp.indexOf("function CategoriesGrid"), nexoraApp.indexOf("function CategoriesMoreControl")), /\.sort\(/);
  assert.doesNotMatch(sectionBlock, /CANONICAL_CATEGORIES/);
});

test("counts are real, grammar is correct, unavailable counts are never faked", () => {
  // Grammar + bullet separator per spec.
  assert.match(nexoraApp, /salon\$\{salons === 1 \? "" : "s"\}/);
  assert.match(nexoraApp, /service\$\{services === 1 \? "" : "s"\}/);
  assert.match(nexoraApp, /parts\.join\(" • "\)/);
  // Unavailable → neutral copy, never 0.
  assert.match(nexoraApp, /return "Explore available listings";/);
  assert.match(nexoraApp, /Number\.isFinite\(salonCount\)/);
  // Card + accessible label use the same honest copy.
  assert.match(nexoraApp, /categoryCountsCopy\(c\.salon_count, c\.service_count\)/);
});

// ---------------------------------------------------------------------------
// 3 — Display cap + expandable control
// ---------------------------------------------------------------------------

test("initial cap of 8 with a 'Sabhi Categories Dekhein' expand control", () => {
  assert.match(nexoraApp, /const CATEGORIES_INITIAL_COUNT = 8;/);
  assert.match(nexoraApp, /categories\.slice\(0, CATEGORIES_INITIAL_COUNT\)/);
  assert.match(sectionBlock, /CategoriesMoreControl/);
  assert.match(nexoraApp, /Sabhi Categories Dekhein/);
  assert.match(nexoraApp, /aria-expanded=\{showAll\}/);
  assert.match(nexoraApp, /total <= CATEGORIES_INITIAL_COUNT\) return null/);
});

// ---------------------------------------------------------------------------
// 4 — Approved icon library, no raw emoji / raw DB strings
// ---------------------------------------------------------------------------

test("icons resolve through the approved whitelist library", () => {
  const grid = nexoraApp.slice(nexoraApp.indexOf("function CategoriesGrid("), nexoraApp.indexOf("function CategoriesMoreControl("));
  assert.match(grid, /<CategoryIcon name=\{c\.icon\}/);
  assert.doesNotMatch(sectionBlock, /🗂|🔥|✂|💄|💅|💈|🧖/);
  assert.doesNotMatch(sectionBlock, /\{c\.icon\}\s*[}<]/);
  assert.doesNotMatch(grid, /\{c\.icon\}\s*[}<]/);
  assert.match(iconsSrc, /aria-hidden="true"/);
});

test("icon whitelist is deterministic, emoji-safe and generic on unknown", async () => {
  const { CATEGORY_ICON_KEYS, resolveCategoryIcon } = await import("../app/lib/categoryIcons.tsx");
  assert.ok(CATEGORY_ICON_KEYS.length >= 10);
  assert.ok(CATEGORY_ICON_KEYS.includes("grid"), "consistent generic fallback");
  assert.equal(resolveCategoryIcon("Scissors"), "scissors");
  assert.equal(resolveCategoryIcon("hair-studio"), "hair");
  assert.equal(resolveCategoryIcon("Nail Studio"), "nails");
  assert.equal(resolveCategoryIcon("Makeup Studio"), "makeup");
  assert.equal(resolveCategoryIcon("Spa & Wellness"), "spa");
  assert.equal(resolveCategoryIcon("star"), "star");
  assert.equal(resolveCategoryIcon("🗂"), "grid");
  assert.equal(resolveCategoryIcon("💇‍♀️"), "grid");
  assert.equal(resolveCategoryIcon(""), "grid");
  assert.equal(resolveCategoryIcon(null), "grid");
  assert.doesNotMatch(iconsSrc, /\{name\}|\{raw\}/);
});

// ---------------------------------------------------------------------------
// 5 — Routes + CTAs
// ---------------------------------------------------------------------------

test("category click keeps the /salons?category= contract; main CTA opens /salons", () => {
  assert.match(nexoraApp, /navigate\(`\/salons\?category=\$\{encodeURIComponent\(c\.name\)\}`\)/);
  assert.match(sectionBlock, /Sabhi Salons Dekhein/);
  assert.match(sectionBlock, /onClick=\{\(\) => navigate\("\/salons"\)\}/);
});

test("header Categories link smooth-scrolls to #categories (reduced-motion aware)", () => {
  assert.match(nexoraApp, /function scrollToCategoriesSection/);
  assert.match(nexoraApp, /document\.getElementById\("categories"\)/);
  assert.match(nexoraApp, /behavior: reduced \? "auto" : "smooth"/);
  assert.match(nexoraApp, /onClick=\{\(\) => scrollToCategoriesSection\(\)\}/);
  assert.match(nexoraApp, /aria-label="Beauty Categories section par jaayein"/);
});

// ---------------------------------------------------------------------------
// 6 — Loading / empty / error / offline states (exact public-safe copy)
// ---------------------------------------------------------------------------

test("loading shows a category-card skeleton grid, not a blank spinner", () => {
  assert.match(sectionBlock, /categoriesLoading \? \(/);
  assert.match(sectionBlock, /<div className="categories-grid" aria-hidden="true">/);
  assert.match(sectionBlock, /length: CATEGORIES_INITIAL_COUNT/);
  assert.match(sectionBlock, /category-card-skeleton/);
  // Heading renders immediately (outside every conditional).
  assert.ok(sectionBlock.indexOf("Beauty Categories Explore Karein") < sectionBlock.indexOf("categoriesLoading"));
  assert.match(globalsCss, /\.category-skeleton-icon/);
  assert.match(globalsCss, /@media \(prefers-reduced-motion:reduce\)/);
});

test("empty / error / offline states use the approved public copy", () => {
  // Empty.
  assert.match(sectionBlock, /Categories abhi available nahi hain\./);
  // Error — exact message, Retry + discovery actions.
  assert.match(sectionBlock, /Categories load nahi ho saki\. Dobara try karein\./);
  assert.match(sectionBlock, /onClick=\{\(\) => void loadCategories\(\)\}>Retry</);
  // Offline.
  assert.match(sectionBlock, /Aap offline hain\. Live categories dekhne ke liye internet connection check karein\./);
  assert.match(sectionBlock, /Saved results/);
});

test("no raw error, RPC name or admin-panel text reaches the public UI", () => {
  assert.doesNotMatch(sectionBlock, /\{categoriesError\}/);
  assert.doesNotMatch(sectionBlock, /admin panel/i);
  assert.doesNotMatch(sectionBlock, /salons\.business_category/);
  assert.doesNotMatch(sectionBlock, /smart search filter/);
  assert.doesNotMatch(sectionBlock, /\bRLS\b/);
  assert.doesNotMatch(sectionBlock, /marketplace_categories/);
  assert.doesNotMatch(sectionBlock, /stack trace|supabase\.co/i);
});

// ---------------------------------------------------------------------------
// 7 — Accessibility + responsive grid
// ---------------------------------------------------------------------------

test("cards are keyboard/screen-reader accessible with a live region", () => {
  assert.match(sectionBlock, /role="status"/);
  assert.match(sectionBlock, /aria-live="polite"/);
  assert.match(sectionBlock, /className="sr-only"/);
  assert.match(nexoraApp, /aria-label=\{`Browse \$\{c\.name\} — \$\{counts\}`\}/);
  assert.match(nexoraApp, /type="button"/);
  assert.doesNotMatch(sectionBlock, /<article[^>]*onClick/);
  assert.doesNotMatch(sectionBlock, /cursor: "pointer"/);
  assert.match(globalsCss, /\.category-card:focus-within \{ outline:2px solid #8e004b/);
  assert.match(globalsCss, /\.sr-only \{/);
});

test("responsive grid: 4–5 desktop / 2–3 tablet / 2 compact mobile", () => {
  assert.match(globalsCss, /\.categories-grid \{ display:grid; grid-template-columns:repeat\(auto-fill,minmax\(200px,1fr\)\); gap:22px; \}/);
  assert.match(globalsCss, /@media\(max-width:920px\) \{ \.categories-grid \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\); \}/);
  assert.match(globalsCss, /@media\(max-width:620px\) \{ \.categories-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); gap:14px; \}/);
  // Long names wrap instead of truncating; no fixed heights clipping text.
  assert.match(globalsCss, /overflow-wrap:anywhere/);
});

// ---------------------------------------------------------------------------
// 8 — Nothing else changed
// ---------------------------------------------------------------------------

test("Hero, Smart Search, six-app grid and routing stay intact", () => {
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /id="nexora-apps"/);
  assert.match(nexoraApp, /title="Job Portal"/);
  assert.match(nexoraApp, /content = <HomePage/);
  assert.match(nexoraApp, /import \{ BackToMainWebsiteButton \}/);
  assert.doesNotMatch(nexoraApp, /<Header\b/);
});
