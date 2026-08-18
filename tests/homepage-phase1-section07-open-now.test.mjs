/**
 * Homepage Phase 1 — Section 07 (Open Now): targeted time/timezone tests.
 *
 * Runtime unit tests for app/lib/openNow.ts — the pure Open Now logic:
 * current weekday hours, before/exactly-at opening, during the interval,
 * exactly-at closing, closed day, missing hours, invalid hours,
 * midnight-crossing schedules and Asia/Kolkata resolution.
 */
import assert from "node:assert/strict";
import test from "node:test";

const {
  CLOSING_SOON_MINUTES,
  parseClockToMinutes,
  isOpenWindowAt,
  minutesUntilClose,
  isClosingSoonAt,
  formatClock12,
  dayOfWeekIST,
  minutesNowIST,
  openNowVerdict,
} = await import("../app/lib/openNow.ts");

// ---------------------------------------------------------------------------
// Parsing — malformed values never crash, never fake
// ---------------------------------------------------------------------------

test("parseClockToMinutes accepts HH:MM and rejects malformed values", () => {
  assert.equal(parseClockToMinutes("09:00"), 540);
  assert.equal(parseClockToMinutes("0:00"), 0);
  assert.equal(parseClockToMinutes("23:59"), 1439);
  assert.equal(parseClockToMinutes("25:99"), null);
  assert.equal(parseClockToMinutes("9:75"), null);
  assert.equal(parseClockToMinutes("abc"), null);
  assert.equal(parseClockToMinutes(""), null);
  assert.equal(parseClockToMinutes(null), null);
  assert.equal(parseClockToMinutes(undefined), null);
  assert.equal(parseClockToMinutes("0900"), null);
});

// ---------------------------------------------------------------------------
// Current weekday hours — normal 09:00–18:00 window
// ---------------------------------------------------------------------------

test("before opening is not open", () => {
  assert.equal(isOpenWindowAt("09:00", "18:00", 8 * 60 + 59), false);
});

test("exactly at opening is open", () => {
  assert.equal(isOpenWindowAt("09:00", "18:00", 9 * 60), true);
});

test("during the open interval is open", () => {
  assert.equal(isOpenWindowAt("09:00", "18:00", 12 * 60 + 30), true);
});

test("exactly at closing is still open; one minute after is closed", () => {
  assert.equal(isOpenWindowAt("09:00", "18:00", 18 * 60), true);
  assert.equal(isOpenWindowAt("09:00", "18:00", 18 * 60 + 1), false);
});

test("after closing is not open", () => {
  assert.equal(isOpenWindowAt("09:00", "18:00", 20 * 60), false);
});

// ---------------------------------------------------------------------------
// Missing / invalid hours — never claim open
// ---------------------------------------------------------------------------

test("missing hours return null (unknown), never open", () => {
  assert.equal(isOpenWindowAt(null, "18:00", 720), null);
  assert.equal(isOpenWindowAt("09:00", null, 720), null);
  assert.equal(isOpenWindowAt(null, null, 720), null);
});

test("invalid hours return null and never crash", () => {
  assert.equal(isOpenWindowAt("25:99", "18:00", 720), null);
  assert.equal(isOpenWindowAt("09:00", "99:99", 720), null);
  assert.equal(isOpenWindowAt("abc", "def", 720), null);
  assert.equal(isOpenWindowAt("", "", 720), null);
});

// ---------------------------------------------------------------------------
// Midnight-crossing schedule: 8:00 PM – 2:00 AM
// ---------------------------------------------------------------------------

test("midnight-crossing window evaluates both sides safely", () => {
  const opens = "20:00";
  const closes = "02:00";
  assert.equal(isOpenWindowAt(opens, closes, 19 * 60 + 59), false, "before opening");
  assert.equal(isOpenWindowAt(opens, closes, 20 * 60), true, "exactly at opening");
  assert.equal(isOpenWindowAt(opens, closes, 23 * 60 + 30), true, "late night same day");
  assert.equal(isOpenWindowAt(opens, closes, 0), true, "midnight");
  assert.equal(isOpenWindowAt(opens, closes, 1 * 60 + 30), true, "after midnight (previous day window)");
  assert.equal(isOpenWindowAt(opens, closes, 2 * 60), true, "exactly at closing");
  assert.equal(isOpenWindowAt(opens, closes, 2 * 60 + 1), false, "after closing");
  assert.equal(isOpenWindowAt(opens, closes, 15 * 60), false, "afternoon gap");
});

test("minutesUntilClose wraps past midnight", () => {
  assert.equal(minutesUntilClose("02:00", 23 * 60), 180);
  assert.equal(minutesUntilClose("18:00", 17 * 60), 60);
  assert.equal(minutesUntilClose("bad", 720), null);
});

// ---------------------------------------------------------------------------
// Closing Soon — documented 45-minute threshold
// ---------------------------------------------------------------------------

test("closing-soon threshold is consistent and documented", () => {
  assert.equal(CLOSING_SOON_MINUTES, 45);
  assert.equal(isClosingSoonAt("18:00", 17 * 60 + 20), true, "40 min left");
  assert.equal(isClosingSoonAt("18:00", 17 * 60 + 15), true, "exactly 45 min left (inclusive threshold)");
  assert.equal(isClosingSoonAt("18:00", 17 * 60 + 14), false, "46 min left is not soon");
  assert.equal(isClosingSoonAt("18:00", 17 * 60 + 59), true, "1 min left");
  assert.equal(isClosingSoonAt("02:00", 1 * 60 + 30), true, "wrap: 30 min left past midnight");
  assert.equal(isClosingSoonAt(null, 720), false, "missing close is never soon");
});

// ---------------------------------------------------------------------------
// formatClock12 — real closing-time copy only
// ---------------------------------------------------------------------------

test("formatClock12 renders honest 12-hour labels", () => {
  assert.equal(formatClock12("20:30"), "8:30 PM");
  assert.equal(formatClock12("02:00"), "2:00 AM");
  assert.equal(formatClock12("00:15"), "12:15 AM");
  assert.equal(formatClock12("12:00"), "12:00 PM");
  assert.equal(formatClock12("junk"), null);
  assert.equal(formatClock12(null), null);
});

// ---------------------------------------------------------------------------
// Asia/Kolkata resolution — independent of the host's local timezone
// ---------------------------------------------------------------------------

test("IST weekday and minutes resolve in Asia/Kolkata", () => {
  // 2026-08-18 06:30 UTC = 12:00 IST Tuesday.
  const noonIST = new Date("2026-08-18T06:30:00Z");
  assert.equal(dayOfWeekIST(noonIST), 2);
  assert.equal(minutesNowIST(noonIST), 720);
  // 2026-08-17 18:30 UTC = 00:00 IST Tuesday (date already rolled over).
  const midnightIST = new Date("2026-08-17T18:30:00Z");
  assert.equal(dayOfWeekIST(midnightIST), 2);
  assert.equal(minutesNowIST(midnightIST), 0);
});

// ---------------------------------------------------------------------------
// Full verdict — closed day, missing record, open verdict details
// ---------------------------------------------------------------------------

test("openNowVerdict covers open / closed-day / unknown honestly", () => {
  const open = openNowVerdict({ opens_at: "09:00", closes_at: "18:00", is_closed: false }, 720);
  assert.equal(open.status, "open");
  assert.equal(open.status === "open" && open.closesLabel, "6:00 PM");
  assert.equal(open.status === "open" && open.closingSoon, false);

  const closingSoon = openNowVerdict({ opens_at: "09:00", closes_at: "12:30", is_closed: false }, 720);
  assert.equal(closingSoon.status, "open");
  assert.equal(closingSoon.status === "open" && closingSoon.closingSoon, true);

  const closedDay = openNowVerdict({ opens_at: "09:00", closes_at: "18:00", is_closed: true }, 720);
  assert.equal(closedDay.status, "closed");

  const outside = openNowVerdict({ opens_at: "09:00", closes_at: "11:00", is_closed: false }, 720);
  assert.equal(outside.status, "closed");

  assert.equal(openNowVerdict(null, 720).status, "unknown");
  assert.equal(openNowVerdict({}, 720).status, "unknown");
  assert.equal(openNowVerdict({ opens_at: "bad", closes_at: "worse", is_closed: false }, 720).status, "unknown");
});
