/**
 * Homepage Phase 1 — Section 11 (AI Smart Picks) contract tests.
 * (Filename kept as ...section09... to preserve history; this section was
 *  renumbered 09 → 11 per the locked MEMORY.md order.)
 *
 * Implementation contract: PHASE1_SECTION11.md (repo root). The earlier
 * PHASE1_SECTION09.md is preserved but SUPERSEDED.
 *
 * Locks the deliverables and hard rules:
 *   • ONE consolidated section (stable id=smart-picks); the two duplicate
 *     "Recommended For You" sections are gone, but BOTH data sources survive
 *     (RPC ranking primary; legacy deterministic ranking = limited-data
 *     fallback under its admin gate).
 *   • AI label honesty: rule-based RPC ranking → public UI says "Smart
 *     Picks"/"Popular Picks", never AI.
 *   • Modes: personalized / location / popular / limited with exact copies.
 *   • Privacy: session-change clears personalized rows (no cross-user leak),
 *     race guard (stale response never overwrites), no user id in DOM/URL,
 *     reasons only backend-provided, recently-viewed consent untouched.
 *   • Duplicate prevention + cap 6; published-only contract.
 *   • Loading/auth-loading/empty-personalized/empty-marketplace/error/
 *     offline states with exact honest copy.
 *   • Routes: /salons/:slug (guarded) + CTA /salons(?sort=popularity) —
 *     no invented params.
 *   • Hooks preserved; no feedback controls without backend contract.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");

const componentStart = nexoraApp.indexOf("function SmartPicksSection(");
const componentBlock = nexoraApp.slice(componentStart, nexoraApp.indexOf("function CatalogPage("));
// Region including the module-level cap constant + the section doc comment.
const sectionRegion = nexoraApp.slice(nexoraApp.indexOf("const SMART_PICKS_DISPLAY_LIMIT"), nexoraApp.indexOf("function CatalogPage("));
// RecommendationCard (single call site: the smart-picks section).
const cardStart = nexoraApp.indexOf("function RecommendationCard(");
const cardRegion = nexoraApp.slice(cardStart, nexoraApp.indexOf("\nfunction ", cardStart + 10));
const hookBlock = nexoraApp.slice(nexoraApp.indexOf("function useRecommendations("), nexoraApp.indexOf("function useCustomerSuggestions("));

// ---------------------------------------------------------------------------
// 1 — One consolidated section, stable id, approved copy
// ---------------------------------------------------------------------------

test("smart-picks section exists exactly once; duplicates consolidated", () => {
  assert.equal((nexoraApp.match(/id="smart-picks"/g) ?? []).length, 1, "no duplicate section");
  assert.match(componentBlock, /aria-labelledby="smart-picks-heading"/);
  assert.match(componentBlock, /scroll-mt-24/);
  // The two legacy "Recommended For You" headings are consolidated away.
  assert.doesNotMatch(nexoraApp, /Recommended For You/);
  // But BOTH data sources survive: RPC rows + legacy deterministic ranking.
  assert.match(nexoraApp, /rows=\{recommendationRows\}/);
  assert.match(nexoraApp, /fallbackItems=\{recommended\}/);
  assert.match(nexoraApp, /fallbackAllowed=\{visible\('recommended'\)\}/);
});

// ---------------------------------------------------------------------------
// 2 — AI naming honesty
// ---------------------------------------------------------------------------

test("public UI never claims AI personalization", () => {
  // Public headings/copy: "Smart Picks" only.
  assert.match(componentBlock, /Smart picks for you/);
  assert.match(componentBlock, /Popular picks/);
  assert.doesNotMatch(componentBlock, /"AI |\bAI Smart Picks\b(?!\s*\(INTERNAL)/);
  // The honesty decision is documented in code (rule-based RPC, not AI/ML).
  assert.match(sectionRegion, /rule-based|SQL scoring/i);
});

// ---------------------------------------------------------------------------
// 3 — Modes with exact copies
// ---------------------------------------------------------------------------

test("all four modes resolve with the approved copies", () => {
  assert.match(componentBlock, /isCustomer && isPersonalized && deduped\.length > 0 \? "personalized"/);
  assert.match(componentBlock, /!isPersonalized && areaRows\.length > 0 \? "location"/);
  assert.match(componentBlock, /deduped\.length > 0 \? "popular"/);
  assert.match(componentBlock, /limitedRows\.length > 0 \? "limited"/);
  assert.match(componentBlock, /Aapke Liye Recommended/);
  assert.match(componentBlock, /Aapke Area Ke Smart Picks/);
  assert.match(componentBlock, /Nexora Par Popular Salons/);
  assert.match(componentBlock, /Aapki preferences, selected location aur Nexora activity ke आधार पर relevant salons explore करें।/);
  assert.match(componentBlock, /Jaipur में customers द्वारा पसंद किए जा रहे published salons explore करें।/);
  // Limited-data fallback stays an honest "Popular Picks" label.
  assert.match(componentBlock, /\{isCustomer && !isPersonalized && <p className="saved-results-label">Popular Picks<\/p>\}/);
});

// ---------------------------------------------------------------------------
// 4 — Privacy & cross-user protection
// ---------------------------------------------------------------------------

test("session change clears personalized rows (no cross-user leak)", () => {
  assert.match(hookBlock, /rowsOwnerIdRef/);
  assert.match(hookBlock, /if \(rowsOwnerIdRef\.current !== undefined && rowsOwnerIdRef\.current !== uid\)/);
  assert.match(hookBlock, /setRows\(\[\]\);\s*setIsPersonalized\(false\);/);
  // Effect re-runs on session change.
  assert.match(hookBlock, /\[load, online, session\]/);
});

test("stale requests never overwrite a newer session", () => {
  assert.match(hookBlock, /fetchTokenRef/);
  assert.match(hookBlock, /const token = \+\+fetchTokenRef\.current;/);
  assert.match(hookBlock, /if \(token !== fetchTokenRef\.current\) return;/);
});

test("no user id or raw coordinates reach DOM/URL; reasons are backend-only", () => {
  assert.doesNotMatch(componentBlock, /session\.user\.id|user\.id\}/);
  assert.doesNotMatch(componentBlock, /latitude\}|longitude\}/);
  // Reason renders only row.reason (backend) for personalized rows, or the
  // truthful area-based override — never an invented string per salon.
  assert.match(cardRegion, /showReason && row\.personalized && row\.reason \? row\.reason : reasonOverride \?\? null/);
  assert.match(componentBlock, /reasonOverride=\{mode === "location" \? `Popular in \$\{area\}` : undefined\}/);
  // No sensitive-inference language.
  assert.doesNotMatch(componentBlock, /religion|caste|income|orientation/i);
});

test("recently-viewed consent contract stays intact and section-scoped", () => {
  assert.match(nexoraApp, /allow_recently_viewed/);
  assert.match(nexoraApp, /function useRecentlyViewed\(/);
  // Smart Picks never reads recently-viewed state directly.
  assert.doesNotMatch(componentBlock, /recentlyViewed|rvConsent/);
});

// ---------------------------------------------------------------------------
// 5 — Duplicates, cap, published-only
// ---------------------------------------------------------------------------

test("duplicate prevention + homepage cap + published-only source", () => {
  assert.match(componentBlock, /const seen = new Set<string>\(\);/);
  assert.match(componentBlock, /if \(!row \|\| !row\.id \|\| seen\.has\(row\.id\)\) continue;/);
  assert.match(sectionRegion, /const SMART_PICKS_DISPLAY_LIMIT = 6;/);
  assert.match(componentBlock, /if \(out\.length >= SMART_PICKS_DISPLAY_LIMIT\) break;/);
  // Data source is the existing recommendation RPC (published contract).
  assert.match(hookBlock, /client\.rpc\("marketplace_recommendations", \{ p_limit: 6 \}\)/);
});

// ---------------------------------------------------------------------------
// 6 — Routes + CTA + refresh
// ---------------------------------------------------------------------------

test("card and CTA routes use existing contracts only", () => {
  assert.match(nexoraApp, /disabled=\{!row\.slug\} onClick=\{\(\) => row\.slug && navigate\(`\/salons\/\$\{row\.slug\}`\)\}>View Salon</);
  assert.match(componentBlock, /navigate\(mode === "personalized" \? "\/salons" : "\/salons\?sort=popularity"\)/);
  assert.match(componentBlock, /mode === "personalized" \? "Aur Recommendations Dekhein" : "Popular Salons Dekhein"/);
  // No invented recommendation params.
  assert.doesNotMatch(componentBlock, /recommended=|picks=|rec=/);
});

test("Refresh Picks refetches the existing endpoint without wiping valid results", () => {
  assert.match(componentBlock, />Refresh Picks</);
  assert.match(componentBlock, /onClick=\{onRefresh\} disabled=\{authLoading \|\| loading\}/);
  assert.match(componentBlock, /displayRows\.length > 0 && !authLoading/);
  // No feedback controls without a backend contract.
  assert.doesNotMatch(componentBlock, /Not Interested|>Hide</);
});

// ---------------------------------------------------------------------------
// 7 — States with exact honest copy
// ---------------------------------------------------------------------------

test("loading / auth-loading / empty / error / offline states are exact", () => {
  assert.match(componentBlock, /Smart picks load ho rahe hain…/);
  assert.match(componentBlock, /length: 4/, "four skeletons");
  assert.match(componentBlock, /Aapke liye recommendations banane ke liye abhi enough activity nahi hai\./);
  assert.match(componentBlock, /Explore Salons/);
  assert.match(componentBlock, /Browse Categories/);
  assert.match(componentBlock, /Recommended salons abhi available nahi hain\./);
  assert.match(componentBlock, /Smart picks load nahi ho sake\. Dobara try karein\./);
  assert.match(componentBlock, /onClick=\{onRefresh\}>Retry</);
  assert.match(componentBlock, /Aap offline hain\. Live recommendations update nahi ki ja sakti\./);
  assert.match(componentBlock, /Saved picks/);
  // Offline cached cards never claim live availability.
  assert.match(componentBlock, /openLabel="Timings unavailable" \/>/);
  // Live region announces state.
  assert.match(componentBlock, /role="status"/);
  assert.match(componentBlock, /aria-live="polite"/);
  // Raw error never renders.
  assert.doesNotMatch(componentBlock, /\{error\}/);
});

// ---------------------------------------------------------------------------
// 8 — Hooks preserved; Sections 01–08 intact
// ---------------------------------------------------------------------------

test("existing recommendation hooks and Sections 01–08 stay intact", () => {
  assert.match(nexoraApp, /function useRecommendations\(online: boolean, session: Session \| null\)/);
  assert.match(nexoraApp, /function useCustomerSuggestions\(online: boolean, session: Session \| null, items: CatalogItem\[\]\)/);
  assert.match(nexoraApp, /const \{ personalized, favorites, ready \} = useCustomerSuggestions\(online, authState\.session, items\);/);
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /id="nexora-apps"/);
  assert.match(nexoraApp, /id="categories"/);
  assert.match(nexoraApp, /id="nearby-shops"/);
  assert.match(nexoraApp, /id="open-now"/);
  assert.match(nexoraApp, /id="top-jaipur-salons"/);
  assert.match(nexoraApp, /content = <HomePage/);
});
