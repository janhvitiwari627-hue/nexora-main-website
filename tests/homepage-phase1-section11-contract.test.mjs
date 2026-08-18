/**
 * Homepage Phase 1 — Section 11 (AI Smart Picks) NUMBERING-CORRECTION tests.
 *
 * Authoritative contract: PHASE1_SECTION11.md (repo root).
 *
 * Locked MEMORY.md order makes "AI Smart Picks" Section 11 (the earlier
 * PHASE1_SECTION09.md was misnumbered and is now SUPERSEDED but preserved).
 * These tests lock the correction and the no-data-loss guarantees:
 *   • PHASE1_SECTION11.md created; PHASE1_SECTION09.md preserved + SUPERSEDED.
 *   • Existing Smart Picks implementation reused in place — stable id
 *     `smart-picks` renders EXACTLY once (no duplicate section).
 *   • Recommendation hooks/data/consent preserved: useRecommendations() +
 *     useCustomerSuggestions() + isPersonalized + recently-viewed consent.
 *   • Corrected supporting copy present.
 *   • Code documentation renumbered to Section 11.
 * The functional modes/privacy/state rules stay locked by
 * homepage-phase1-section09-contract.test.mjs (kept for history).
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

test("PHASE1_SECTION11.md is the authoritative contract and exists", () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION11.md", import.meta.url)), "PHASE1_SECTION11.md created");
});

test("PHASE1_SECTION11.md carries the Section 11 spec + stable id", async () => {
  const md = await read("PHASE1_SECTION11.md");
  assert.match(md, /SECTION 11: AI SMART PICKS/);
  assert.match(md, /`smart-picks`/);
  assert.match(md, /Aapke Liye Recommended/);
  assert.match(md, /Nexora Par Popular Salons/);
});

test("PHASE1_SECTION09.md is preserved (NOT deleted) and marked SUPERSEDED", async () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION09.md", import.meta.url)), "PHASE1_SECTION09.md must NOT be deleted");
  const md = await read("PHASE1_SECTION09.md");
  assert.match(md, /SUPERSEDED: Correct specification is PHASE1_SECTION11\.md/);
});

// ---------------------------------------------------------------------------
// 2 — No duplicate Smart Picks section; existing implementation reused
// ---------------------------------------------------------------------------

test("stable id `smart-picks` renders exactly once (no duplicate)", () => {
  assert.equal((nexoraApp.match(/id="smart-picks"/g) ?? []).length, 1, "exactly one Smart Picks section");
});

test("SmartPicksSection is rendered exactly once and the component is preserved", () => {
  assert.equal((nexoraApp.match(/<SmartPicksSection/g) ?? []).length, 1, "single render site");
  assert.equal((nexoraApp.match(/function SmartPicksSection\(/g) ?? []).length, 1, "component preserved");
  assert.match(nexoraApp, /title: "Aapke Liye Recommended"/, "personalized heading preserved");
  assert.match(nexoraApp, /title: "Nexora Par Popular Salons"/, "generic heading preserved");
});

// ---------------------------------------------------------------------------
// 3 — Recommendation hooks / data / consent preserved
// ---------------------------------------------------------------------------

test("recommendation hooks, data and consent are preserved", () => {
  assert.match(nexoraApp, /function useRecommendations\(online: boolean, session: Session \| null\)/);
  assert.match(nexoraApp, /function useCustomerSuggestions\(online: boolean, session: Session \| null, items: CatalogItem\[\]\)/);
  assert.match(nexoraApp, /const \{ personalized, favorites, ready \} = useCustomerSuggestions\(online, authState\.session, items\);/);
  assert.match(nexoraApp, /isPersonalized/);
  // Recently-viewed consent contract intact.
  assert.match(nexoraApp, /allow_recently_viewed/);
  assert.match(nexoraApp, /function useRecentlyViewed\(/);
  // Cross-user protection (session-change clear + stale-request guard) intact.
  assert.match(nexoraApp, /rowsOwnerIdRef/);
  assert.match(nexoraApp, /fetchTokenRef/);
});

// ---------------------------------------------------------------------------
// 4 — Corrected copy + documentation renumbered to Section 11
// ---------------------------------------------------------------------------

test("corrected supporting copy is present", () => {
  assert.match(nexoraApp, /Aapki preferences, selected location aur Nexora activity ke आधार पर relevant salons explore करें।/);
});

test("code documentation is renumbered to Section 11", () => {
  assert.match(nexoraApp, /Section 11 — Smart Picks/);
  assert.match(nexoraApp, /Section 11 — AI Smart Picks \(INTERNAL name\)/);
  // No lingering "Section 09 — AI Smart Picks" component doc heading in code.
  assert.doesNotMatch(nexoraApp, /Section 09 — AI Smart Picks/);
});
