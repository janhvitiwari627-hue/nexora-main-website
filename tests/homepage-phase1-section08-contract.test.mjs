/**
 * Homepage Phase 1 — Section 10 (Jaipur's Top 5 Salons) contract tests.
 * (Filename kept as ...section08... to preserve history; this section was
 *  renumbered 08 → 10 per the locked MEMORY.md order.)
 *
 * Implementation contract: PHASE1_SECTION10.md (repo root). The earlier
 * PHASE1_SECTION08.md is preserved but SUPERSEDED.
 *
 * Locks the deliverables and hard rules:
 *   • ONE upgraded section (stable id=top-jaipur-salons, admin gate kept).
 *   • Existing ranking contract: marketplace_top_rated RPC order (Bayesian /
 *     review-confidence weighted, p_min_reviews: 1) — the frontend filters +
 *     caps only, NEVER re-sorts by raw rating.
 *   • Jaipur-city eligibility on the REAL city field (normalized); missing
 *     city / area-name-only never qualifies.
 *   • Valid rating + review aggregates required; no-rating salons excluded.
 *   • Exactly five cap; fewer-than-five partial honesty; no filler cards.
 *   • Rank labels #1–#5 from preserved order; DOM order = visual order.
 *   • Honest fields: rating/review grammar, price, distance (approved coords
 *     + usable fix only), open/closed via Section 07 hours contract.
 *   • No sponsored data feeds the organic ranking.
 *   • CTA → /salons with existing params (city=Jaipur&sort=rating).
 *   • Loading / empty / partial / error / offline states with exact copy.
 *   • Sections 01–07 markers intact; no deletions.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const cityLib = await read("app/lib/jaipurCity.ts");

const componentStart = nexoraApp.indexOf("function TopJaipurSection(");
const componentBlock = nexoraApp.slice(componentStart, nexoraApp.indexOf("function TrendingCard("));
const cardBlock = nexoraApp.slice(nexoraApp.indexOf("function TopRatedCard("), componentStart);

// ---------------------------------------------------------------------------
// 1 — One upgraded section, stable id, approved copy
// ---------------------------------------------------------------------------

test("the top-jaipur-salons section exists exactly once with approved copy", () => {
  assert.equal((nexoraApp.match(/id="top-jaipur-salons"/g) ?? []).length, 1, "no duplicate section");
  assert.match(componentBlock, /aria-labelledby="top-jaipur-heading"/);
  assert.match(componentBlock, /<h2 id="top-jaipur-heading">Jaipur Ke Top 5 Salons<\/h2>/);
  assert.match(componentBlock, /Top rated in Jaipur/);
  assert.match(componentBlock, /Real ratings, customer reviews aur marketplace activity ke आधार पर Jaipur के leading salons explore करें।/);
  assert.match(componentBlock, /scroll-mt-24/);
  // Admin visibility gate preserved.
  assert.match(nexoraApp, /\{visible\('top_rated'\) && \(/);
});

// ---------------------------------------------------------------------------
// 2 — Existing ranking contract preserved (no frontend re-ranking)
// ---------------------------------------------------------------------------

test("backend marketplace_top_rated order is authoritative", () => {
  assert.match(nexoraApp, /client\.rpc\("marketplace_top_rated", \{ p_min_reviews: 1, p_limit: 20 \}\)/);
  // Eligibility = filter + slice only — no sort, no invented tie-breaks.
  assert.doesNotMatch(componentBlock, /\.sort\(/);
  assert.match(componentBlock, /\.filter\(\(row\) => isJaipurCity\(row\.city\) && Number\(row\.rating_avg \?\? 0\) > 0 && Number\(row\.review_count \?\? 0\) > 0\)/);
  assert.match(componentBlock, /\.slice\(0, TOP_JAIPUR_DISPLAY_LIMIT\)/);
  assert.match(nexoraApp, /const TOP_JAIPUR_DISPLAY_LIMIT = 5;/);
  // Ranking rows keep the Bayesian field (ranking signal preserved in data).
  assert.match(nexoraApp, /bayesian_rating: number;/);
});

// ---------------------------------------------------------------------------
// 3 — Jaipur city eligibility (real city field only)
// ---------------------------------------------------------------------------

test("city validation is strict, normalized and unit-correct", async () => {
  const { isJaipurCity, normalizeCityName } = await import("../app/lib/jaipurCity.ts");
  assert.equal(isJaipurCity("Jaipur"), true);
  assert.equal(isJaipurCity("JAIPUR"), true);
  assert.equal(isJaipurCity("  jaipur  "), true);
  assert.equal(isJaipurCity("Jaipur City"), false, "normalized exact match only");
  assert.equal(isJaipurCity("Jaipuria"), false);
  assert.equal(isJaipurCity("Delhi"), false);
  assert.equal(isJaipurCity(""), false);
  assert.equal(isJaipurCity(null), false);
  assert.equal(isJaipurCity(undefined), false);
  assert.equal(normalizeCityName("  NEW   Delhi "), "new delhi");
  // The library never fuzzy-matches area names into city proof.
  assert.doesNotMatch(cityLib, /includes|startsWith|endsWith|indexOf/);
});

// ---------------------------------------------------------------------------
// 4 — Rank labels: unique, ordered, visible text
// ---------------------------------------------------------------------------

test("rank labels come from preserved order and render as visible text", () => {
  assert.match(componentBlock, /rank=\{index \+ 1\}/);
  assert.match(cardBlock, /<span className="rank-badge" aria-label=\{`Rank \$\{rank\}`\}>#\{rank\}<\/span>/);
  assert.match(componentBlock, /<ol className="top-jaipur-list"/);
  assert.match(componentBlock, /<li key=\{row\.id\} className="top-jaipur-item">/);
  // No absolute marketing claims.
  assert.doesNotMatch(componentBlock, /best salon/i);
  assert.doesNotMatch(cardBlock, /best salon/i);
});

// ---------------------------------------------------------------------------
// 5 — Honest card fields
// ---------------------------------------------------------------------------

test("rating display uses real aggregates with correct grammar + a11y label", () => {
  assert.match(cardBlock, /rating\.toFixed\(1\)\} ★ · \$\{reviews\} review\$\{reviews === 1 \? "" : "s"\}/);
  assert.match(cardBlock, /"No ratings yet"/);
  assert.match(cardBlock, /out of 5/);
  // Never a fake 5.0 fallback.
  assert.doesNotMatch(cardBlock, /toFixed\(1\) \?\? "5\.0"|5\.0" \?\?/);
});

test("price, distance and hours fallbacks are the exact honest labels", () => {
  assert.match(cardBlock, /nearbyPriceCopy\(row\.starting_price_paise\)/);
  assert.match(cardBlock, /distanceKm != null \? `📍 \$\{formatDistance\(distanceKm\)\} away` : "Distance unavailable"/);
  assert.match(cardBlock, /openLabel \?\? "Timings unavailable"/);
  // Distance only from approved coordinates + a usable fix.
  assert.match(componentBlock, /item\.approval_status === "approved" && typeof item\.latitude === "number"/);
  assert.match(componentBlock, /if \(!fixUsable \|\| !gpsFix\) return map;/);
  assert.doesNotMatch(cardBlock, /latitude\}|longitude\}/);
});

test("open/closed reuses the Section 07 hours contract", () => {
  assert.match(componentBlock, /openNowVerdict\(hours, minutes\)/);
  assert.match(componentBlock, /useTodayHours\(online && !loading, topFive\.map\(\(row\) => row\.id\), topIdsKey\)/);
  assert.match(componentBlock, /configOpeningHours\(item\)/);
});

test("verified badge is the shared backend-truth component", () => {
  assert.match(cardBlock, /<VerifiedBadge salonName=\{row\.name\} \/>/);
});

// ---------------------------------------------------------------------------
// 6 — Sponsored separation
// ---------------------------------------------------------------------------

test("no sponsored data can enter the organic Top 5", () => {
  assert.doesNotMatch(componentBlock, /useSponsored|sponsored/i);
  assert.doesNotMatch(cardBlock, /sponsored/i);
});

// ---------------------------------------------------------------------------
// 7 — CTA + details routes (existing contracts only)
// ---------------------------------------------------------------------------

test("CTA opens /salons with existing city + rating-sort params", () => {
  assert.match(componentBlock, /Jaipur Ke Sabhi Salons Dekhein/);
  assert.match(componentBlock, /params\.set\("city", "Jaipur"\);\s*params\.set\("sort", "rating"\);/);
  // Only those two params are set — no invented URL parameters.
  const cta = componentBlock.slice(componentBlock.indexOf("const viewAllJaipurSalons"), componentBlock.indexOf("const partial"));
  const setParams = [...cta.matchAll(/params\.set\("([a-z]+)"/g)].map(([, key]) => key);
  assert.deepEqual(setParams, ["city", "sort"]);
});

test("View Salon / Book Now use existing verified routes with slug guards", () => {
  assert.match(cardBlock, /disabled=\{!row\.slug\}/);
  assert.match(cardBlock, /navigate\(`\/salons\/\$\{row\.slug\}`\)/);
  assert.match(cardBlock, /navigate\(`\/app\/customer\/\?salon=\$\{row\.id\}&returnTo=\$\{encodeURIComponent\(`\/salons\/\$\{row\.slug\}`\)\}`\)/);
});

// ---------------------------------------------------------------------------
// 8 — States with exact public-safe copy
// ---------------------------------------------------------------------------

test("loading / empty / partial / error / offline states are exact and honest", () => {
  assert.match(componentBlock, /Jaipur ke top-rated salons load ho rahe hain…/);
  assert.match(componentBlock, /length: TOP_JAIPUR_DISPLAY_LIMIT/, "five skeletons matching the layout");
  assert.match(componentBlock, /Jaipur ke top-rated salons abhi available nahi hain\./);
  assert.match(componentBlock, /View All Jaipur Salons/);
  assert.match(componentBlock, /Explore Categories/);
  assert.match(componentBlock, /Jaipur ke available top-rated salons dikhaye ja rahe hain\./);
  assert.match(componentBlock, /Available top-rated Jaipur salons/);
  assert.match(componentBlock, /Top-rated salons load nahi ho sake\. Dobara try karein\./);
  assert.match(componentBlock, /onClick=\{onRetry\}>Retry</);
  assert.match(componentBlock, /Aap offline hain\. Live rankings verify nahi ki ja sakti\./);
  assert.match(componentBlock, /Saved ranking/);
  // Offline cached cards never claim live availability.
  assert.match(componentBlock, /openLabel="Timings unavailable" featured=\{index === 0\}/);
  // No raw error reaches the UI.
  assert.doesNotMatch(componentBlock, /\{error\}/);
});

// ---------------------------------------------------------------------------
// 9 — Sections 01–07 intact; nothing deleted
// ---------------------------------------------------------------------------

test("Sections 01–07 markers stay intact", () => {
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /id="nexora-apps"/);
  assert.match(nexoraApp, /id="categories"/);
  assert.match(nexoraApp, /id="nearby-shops"/);
  assert.match(nexoraApp, /id="open-now"/);
  assert.match(nexoraApp, /function useTopRated\(online: boolean\)/);
  assert.match(nexoraApp, /const \{ rows: topRatedRows, loading: topRatedLoading, error: topRatedError, load: loadTopRated \} = useTopRated\(online\);/);
  assert.match(nexoraApp, /content = <HomePage/);
});
