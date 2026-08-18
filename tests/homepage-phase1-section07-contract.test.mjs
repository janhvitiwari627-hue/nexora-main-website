/**
 * Homepage Phase 1 — Section 07 (Open Now) contract tests.
 *
 * Implementation contract: PHASE1_SECTION07.md (repo root).
 *
 * Locks the deliverables and hard rules:
 *   • ONE upgraded section (stable id=open-now) — the old "Open Today" block,
 *     no duplicate section; OpenTodayStrip preserved (fed shared data).
 *   • Truth rule: only genuinely-open published salons render (valid IST
 *     weekday hours, not closed, current minute inside window).
 *   • Asia/Kolkata everywhere (IST weekday + minute clock), hydration-safe.
 *   • Shared minute-level clock — one timer for the section, never per card,
 *     cleaned up on unmount, visibility re-sync.
 *   • Missing/invalid hours excluded (no fake open), midnight-crossing safe.
 *   • Honest copy: "Open until …", Closing Soon (45 min), offline
 *     "Status unavailable offline", no reopening claims.
 *   • Section 06 location state reused — no new GPS prompt.
 *   • Filters (Nearest/Top Rated/Price/Gender) + mandatory Open Now +
 *     Clear All (never removes Open Now).
 *   • CTA → /salons with existing params only (open=1 is the contract).
 *   • Loading / empty / filtered-empty / missing-hours / error / offline
 *     states with exact public-safe copy.
 *   • Sections 01–06 markers intact; no deletions.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const openNowLib = await read("app/lib/openNow.ts");
const globalsCss = await read("app/globals.css");

const sectionStart = nexoraApp.indexOf('id="open-now"');
const sectionBlock = nexoraApp.slice(sectionStart, nexoraApp.indexOf("Sabhi Open Salons Dekhein", sectionStart) + 300);
const cardBlock = nexoraApp.slice(nexoraApp.indexOf("function OpenNowCard("), nexoraApp.indexOf("function OpenNowSection("));

// ---------------------------------------------------------------------------
// 1 — One upgraded section, stable id, approved copy
// ---------------------------------------------------------------------------

test("the open-now section exists exactly once with approved copy", () => {
  assert.equal((nexoraApp.match(/id="open-now"/g) ?? []).length, 1, "no duplicate section");
  assert.match(sectionBlock, /aria-labelledby="open-now-heading"/);
  assert.match(sectionBlock, /<h2 id="open-now-heading">Abhi Open Salons<\/h2>/);
  assert.match(sectionBlock, /Available now/);
  assert.match(sectionBlock, /Current salon timings ke hisaab se abhi available salons explore karein\./);
  assert.match(sectionBlock, /scroll-mt-24/);
  // Old public technical copy removed from the section UI.
  assert.doesNotMatch(sectionBlock, /salon_hours \(owner managed\)/);
  assert.doesNotMatch(sectionBlock, /no mock slots/);
});

// ---------------------------------------------------------------------------
// 2 — Truth rule: only genuinely-open salons
// ---------------------------------------------------------------------------

test("only genuinely-open salons render (verdict gate)", () => {
  assert.match(nexoraApp, /openNowVerdict\(hours, minutes\)/);
  assert.match(nexoraApp, /if \(verdict\.status !== "open"\) continue;/);
  // Missing/invalid hours never fake an open claim (module truth).
  assert.match(openNowLib, /if \(opensAt == null \|\| closesAt == null\) return null;/);
  assert.match(openNowLib, /if \(hours\.is_closed\) return \{ status: "closed" \};/);
  assert.match(openNowLib, /return \{ status: "unknown" \};/);
  // No reopening claims without real next-opening data.
  assert.doesNotMatch(sectionBlock, /Opens at/i);
});

// ---------------------------------------------------------------------------
// 3 — Asia/Kolkata timezone + hydration-safe shared clock
// ---------------------------------------------------------------------------

test("IST weekday drives the hours fetch (not browser local time)", () => {
  assert.match(nexoraApp, /\.eq\("day_of_week", dayOfWeekIST\(\)\);/);
  assert.match(openNowLib, /timeZone: "Asia\/Kolkata"/);
});

test("one shared minute-level clock — never per-card timers", () => {
  assert.match(nexoraApp, /function useMinutesNowIST\(\): number \| null/);
  assert.equal((nexoraApp.match(/window\.setInterval\(tick, 60_000\)/g) ?? []).length, 1, "single interval");
  assert.match(nexoraApp, /document\.addEventListener\("visibilitychange", onVisibility\)/);
  assert.match(nexoraApp, /window\.clearTimeout\(align\);/);
  assert.match(nexoraApp, /if \(interval != null\) window\.clearInterval\(interval\);/);
  // Hydration-safe: no time-dependent claim before the first client tick.
  assert.match(nexoraApp, /useState<number \| null>\(null\)/);
  assert.match(nexoraApp, /if \(minutes == null\) return \{ openEntries: list, anyHours: false \};/);
});

// ---------------------------------------------------------------------------
// 4 — Midnight crossing + honest closing copy
// ---------------------------------------------------------------------------

test("midnight-crossing windows are evaluated safely", () => {
  assert.match(openNowLib, /return nowMinutes >= opensAt \|\| nowMinutes <= closesAt;/);
});

test("closing-time copy is real-data only", () => {
  assert.match(cardBlock, /Open until \{closesLabel\}/);
  assert.match(cardBlock, /closesLabel && /);
  assert.match(cardBlock, /Closing Soon/);
  assert.match(nexoraApp, /const OPEN_NOW_DISPLAY_LIMIT = 6;/);
});

// ---------------------------------------------------------------------------
// 5 — Section 06 location reused, no new GPS prompt
// ---------------------------------------------------------------------------

test("location state comes from Section 06 — no second permission flow", () => {
  assert.match(nexoraApp, /baseItems=\{nearbyBaseItems\} hoursById=\{nearbyHours\} area=\{nearbyArea\} fixUsable=\{nearbyFixUsable\} gpsFix=\{gpsFix\}/);
  const component = nexoraApp.slice(nexoraApp.indexOf("function OpenNowSection("), nexoraApp.indexOf("function CatalogPage("));
  assert.doesNotMatch(component, /location\.start\(\)|locationService\.start\(\)|location\.retry\(\)/);
  // Distance only from approved coordinates; raw coords never rendered.
  assert.match(component, /item\.approval_status === "approved"/);
  assert.doesNotMatch(component, /latitude\}|longitude\}/);
});

// ---------------------------------------------------------------------------
// 6 — Filters + mandatory Open Now + Clear All
// ---------------------------------------------------------------------------

test("compact filters exist; Open Now is mandatory and Clear All cannot remove it", () => {
  assert.match(sectionBlock, /Open Now · required/);
  assert.match(sectionBlock, />Nearest<\/button>/);
  assert.match(sectionBlock, />Top Rated<\/button>/);
  assert.match(sectionBlock, />Unisex<\/button>/);
  assert.match(sectionBlock, />Women<\/button>/);
  assert.match(sectionBlock, />Men<\/button>/);
  assert.match(sectionBlock, />Clear All<\/button>/);
  // Nearest needs a usable fix (missing distance is never "nearest").
  assert.match(sectionBlock, /disabled=\{!fixUsable\}/);
  // Clear All resets only the optional filters.
  assert.match(nexoraApp, /const clearFilters = \(\) => \{ setSortMode\("default"\); setPriceBand\(""\); setGenderFilter\(""\); \};/);
  // Price bands are the existing /salons contract bands.
  assert.match(sectionBlock, /<option value="50000">Under ₹500<\/option>/);
});

test("CTA opens /salons with existing supported params only", () => {
  const cta = nexoraApp.slice(nexoraApp.indexOf("const openAllOpenSalons"), nexoraApp.indexOf("const statusLine"));
  assert.match(cta, /params\.set\("open", "1"\)/);
  for (const key of ["area", "price", "gender", "sort"]) {
    assert.ok(cta.includes(`"${key}"`), `${key} preserved`);
  }
  assert.match(cta, /if \(sortMode === "rating"\) params\.set\("sort", "rating"\);/);
  // No invented params, no coordinates.
  assert.doesNotMatch(cta, /open=true|nearest|lat|lng|latitude|longitude/);
});

// ---------------------------------------------------------------------------
// 7 — States with exact public-safe copy
// ---------------------------------------------------------------------------

test("all states exist with exact copy and honest offline handling", () => {
  assert.match(nexoraApp, /Open salons check ho rahe hain…/);
  assert.match(sectionBlock, /Is area mein abhi koi salon open nahi hai\./);
  assert.match(sectionBlock, /Selected filters ke saath abhi koi open salon nahi mila\./);
  assert.match(sectionBlock, /Verified salon timings abhi available nahi hain\./);
  assert.match(sectionBlock, /Open salons load nahi ho sake\. Dobara try karein\./);
  assert.match(sectionBlock, /Aap offline hain\. Live Open Now status verify nahi kiya ja sakta\./);
  assert.match(cardBlock, /Status unavailable offline/);
  assert.match(sectionBlock, /Saved results/);
  assert.match(sectionBlock, /View All Salons/);
  assert.match(sectionBlock, /Change Area/);
  assert.match(sectionBlock, /Check Nearby Shops/);
  // Change Area defers to Section 06's single area selector (no duplicate).
  assert.match(nexoraApp, /#nearby-shops select\[aria-label="Jaipur area"\]/);
  // Live region announces state.
  assert.match(sectionBlock, /role="status"/);
  assert.match(sectionBlock, /aria-live="polite"/);
});

// ---------------------------------------------------------------------------
// 8 — Preserved components/data sources; nothing else changed
// ---------------------------------------------------------------------------

test("OpenTodayStrip preserved and fed shared data (no duplicate request)", () => {
  assert.match(nexoraApp, /function OpenTodayStrip\(\{ items, navigate, preloaded \}/);
  assert.match(nexoraApp, /if \(preloaded\) return; \/\/ Shared data provided/);
  assert.match(nexoraApp, /<OpenTodayStrip items=\{nearbyBaseItems\} navigate=\{navigate\} preloaded=\{openTodayPreloaded\} \/>/);
  assert.match(nexoraApp, /const openTodayPreloaded = useMemo/);
});

test("Sections 01–06 markers stay intact; hooks preserved", () => {
  assert.match(nexoraApp, /Beauty Services Se Business Growth Tak/);
  assert.match(nexoraApp, /id="home-search"/);
  assert.match(nexoraApp, /id="nexora-apps"/);
  assert.match(nexoraApp, /id="categories"/);
  assert.match(nexoraApp, /id="nearby-shops"/);
  assert.match(nexoraApp, /function useNearby\(online: boolean\)/);
  assert.match(nexoraApp, /useNearbySalons\(nearbyRows, location\.fix\)/);
  assert.match(nexoraApp, /content = <HomePage/);
  assert.match(globalsCss, /\.open-now-chip\.active/);
  assert.match(globalsCss, /\.open-badge-offline/);
});
