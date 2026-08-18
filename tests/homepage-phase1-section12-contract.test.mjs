/**
 * Homepage Phase 1 — Section 12.1 (Trending and Most Booked) contract tests.
 *
 * Authoritative contract: PHASE1_SECTION12.md (repo root).
 * These tests lock the foundation/live-data work only:
 *   • one dedicated mounted section with the stable id;
 *   • placement after Smart Picks and before Offers / Section 13;
 *   • one existing hook/RPC call per live data source;
 *   • backend row order preserved (direct map, no component-side sort);
 *   • old standalone Trending and Popular Services render sites consolidated.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const nexoraApp = await read("app/nexora-app.tsx");

const componentStart = nexoraApp.indexOf("function TrendingMostBookedSection(");
const componentEnd = nexoraApp.indexOf("function TrendingCard(", componentStart);
const componentBlock = nexoraApp.slice(componentStart, componentEnd);

// ---------------------------------------------------------------------------
// 1 — Specification and dedicated component
// ---------------------------------------------------------------------------

test("PHASE1_SECTION12.md exists and records the Section 12.1 contract", async () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION12.md", import.meta.url)));
  const md = await read("PHASE1_SECTION12.md");
  assert.match(md, /SECTION 12: TRENDING AND MOST BOOKED/);
  assert.match(md, /`trending-most-booked`/);
  assert.match(md, /useTrending\(\)/);
  assert.match(md, /usePopularServices\(\)/);
});

test("dedicated Section 12 component and stable id each exist exactly once", () => {
  assert.equal((nexoraApp.match(/function TrendingMostBookedSection\(/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/<TrendingMostBookedSection/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/id="trending-most-booked"/g) ?? []).length, 1);
  assert.ok(componentStart >= 0 && componentEnd > componentStart);
});

// ---------------------------------------------------------------------------
// 2 — Locked homepage position and existing admin visibility
// ---------------------------------------------------------------------------

test("Section 12 is mounted after Smart Picks and before the offers section", () => {
  const smartPicksMount = nexoraApp.indexOf("<SmartPicksSection");
  const section12Mount = nexoraApp.indexOf("<TrendingMostBookedSection");
  const offersMount = nexoraApp.indexOf("{visible('offers')", section12Mount);
  assert.ok(smartPicksMount >= 0 && smartPicksMount < section12Mount);
  assert.ok(section12Mount < offersMount);
});

test("existing Trending homepage visibility gate protects consolidated Section 12", () => {
  const mountContext = nexoraApp.slice(
    nexoraApp.lastIndexOf("{visible('trending')", nexoraApp.indexOf("<TrendingMostBookedSection")),
    nexoraApp.indexOf("{visible('offers')", nexoraApp.indexOf("<TrendingMostBookedSection")),
  );
  assert.match(mountContext, /\{visible\('trending'\) && \(/);
  assert.match(mountContext, /<TrendingMostBookedSection/);
});

// ---------------------------------------------------------------------------
// 3 — Existing live hooks/RPC contracts; no duplicate request or re-sort
// ---------------------------------------------------------------------------

test("Trending hook and RPC remain single-source and connected", () => {
  assert.equal((nexoraApp.match(/useTrending\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_trending"/g) ?? []).length, 1);
  assert.match(nexoraApp, /trendingRows=\{trendingRows\}/);
  assert.match(componentBlock, /trendingRows\.map\(/);
  assert.doesNotMatch(componentBlock, /trendingRows(?:\.|\s)*sort\(/);
  assert.doesNotMatch(nexoraApp, /const trending\s*=.*\.sort\(/, "no parallel frontend Trending ranking");
});

test("Popular Services hook and RPC remain single-source and connected", () => {
  assert.equal((nexoraApp.match(/usePopularServices\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_popular_services"/g) ?? []).length, 1);
  assert.match(nexoraApp, /popularServices=\{popularServices\}/);
  assert.match(componentBlock, /popularServices\.map\(/);
  assert.doesNotMatch(componentBlock, /popularServices(?:\.|\s)*sort\(/);
});

// ---------------------------------------------------------------------------
// 4 — Consolidation: no old duplicate render sites
// ---------------------------------------------------------------------------

test("Trending and Most Booked UI each render only inside Section 12", () => {
  assert.equal((nexoraApp.match(/>Trending Now<\/h3>/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/>Most Booked Services<\/h3>/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/trendingRows\.map\(/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/popularServices\.map\(/g) ?? []).length, 1);
});
