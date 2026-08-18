/**
 * Homepage Phase 1 — Section 10 (Jaipur's Top 5 Salons) NUMBERING-CORRECTION
 * contract tests.
 *
 * Authoritative contract: PHASE1_SECTION10.md (repo root).
 *
 * Locked MEMORY.md order makes "Jaipur's Top 5 Salons" Section 10 (the earlier
 * PHASE1_SECTION08.md was misnumbered and is now SUPERSEDED but preserved).
 * These tests lock the correction and the no-data-loss guarantees:
 *   • PHASE1_SECTION10.md created; PHASE1_SECTION08.md preserved + SUPERSEDED.
 *   • Existing Top 5 implementation reused in place — stable id
 *     `top-jaipur-salons` renders EXACTLY once (no duplicate section).
 *   • Ranking hooks/data preserved: useTopRated() + topRatedRows.
 *   • Corrected supporting copy present.
 *   • Code documentation renumbered to Section 10.
 * The functional ranking/city/state rules stay locked by
 * homepage-phase1-section08-contract.test.mjs (kept for history).
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");

// ---------------------------------------------------------------------------
// 1 — Authoritative MD created; old MD preserved + superseded
// ---------------------------------------------------------------------------

test("PHASE1_SECTION10.md is the authoritative contract and exists", () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION10.md", import.meta.url)), "PHASE1_SECTION10.md created");
});

test("PHASE1_SECTION10.md carries the Section 10 spec + stable id", async () => {
  const md = await read("PHASE1_SECTION10.md");
  assert.match(md, /SECTION 10: JAIPUR['’]S TOP 5 SALONS/);
  assert.match(md, /Stable ID `top-jaipur-salons`|stable id `top-jaipur-salons`|`top-jaipur-salons`/);
  assert.match(md, /Jaipur Ke Top 5 Salons/);
  assert.match(md, /Real ratings, customer reviews aur marketplace activity/);
});

test("PHASE1_SECTION08.md is preserved (NOT deleted) and marked SUPERSEDED", async () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION08.md", import.meta.url)), "PHASE1_SECTION08.md must NOT be deleted");
  const md = await read("PHASE1_SECTION08.md");
  assert.match(md, /SUPERSEDED: Correct specification is PHASE1_SECTION10\.md/);
});

// ---------------------------------------------------------------------------
// 2 — No duplicate Top 5 section; existing implementation reused
// ---------------------------------------------------------------------------

test("stable id `top-jaipur-salons` renders exactly once (no duplicate)", () => {
  assert.equal((nexoraApp.match(/id="top-jaipur-salons"/g) ?? []).length, 1, "exactly one Top 5 section");
});

test("TopJaipurSection is rendered exactly once and the component is preserved", () => {
  assert.equal((nexoraApp.match(/<TopJaipurSection/g) ?? []).length, 1, "single render site");
  assert.equal((nexoraApp.match(/function TopJaipurSection\(/g) ?? []).length, 1, "component preserved");
  assert.equal((nexoraApp.match(/Jaipur Ke Top 5 Salons<\/h2>/g) ?? []).length, 1, "single heading");
});

// ---------------------------------------------------------------------------
// 3 — Ranking hooks / data preserved
// ---------------------------------------------------------------------------

test("ranking hooks and data are preserved", () => {
  assert.match(nexoraApp, /function useTopRated\(online: boolean\)/);
  assert.match(nexoraApp, /const \{ rows: topRatedRows, loading: topRatedLoading, error: topRatedError, load: loadTopRated \} = useTopRated\(online\);/);
  assert.match(nexoraApp, /client\.rpc\("marketplace_top_rated", \{ p_min_reviews: 1, p_limit: 20 \}\)/);
  // Admin visibility gate for the section preserved.
  assert.match(nexoraApp, /\{visible\('top_rated'\) && \(/);
});

// ---------------------------------------------------------------------------
// 4 — Corrected copy + documentation renumbered to Section 10
// ---------------------------------------------------------------------------

test("corrected supporting copy is present", () => {
  assert.match(nexoraApp, /Real ratings, customer reviews aur marketplace activity ke आधार पर Jaipur के leading salons explore करें।/);
});

test("code documentation is renumbered to Section 10", () => {
  assert.match(nexoraApp, /SECTION 10 — JAIPUR'S TOP 5 SALONS/);
  assert.match(nexoraApp, /Section 10 — Jaipur's Top 5 Salons/);
  // No lingering "SECTION 08 — JAIPUR'S TOP 5" heading in code.
  assert.doesNotMatch(nexoraApp, /SECTION 08 — JAIPUR'S TOP 5 SALONS/);
});
