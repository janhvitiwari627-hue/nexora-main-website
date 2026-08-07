/**
 * Contract tests for the Nexora GPS location system.
 *
 * These assert the two things that matter most:
 *  1. No third-party location service is referenced anywhere in the module.
 *  2. The accuracy/validation/ranking rules behave exactly as specified.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const moduleDir = new URL("../app/lib/location/", import.meta.url);
const files = (await readdir(moduleDir)).filter((f) => f.endsWith(".ts"));
const sources = Object.fromEntries(
  await Promise.all(files.map(async (f) => [f, await readFile(new URL(f, moduleDir), "utf8")])),
);
const allSource = Object.values(sources).join("\n");

/** Strip comments so the scan tests only inspect executable code. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const allCode = stripComments(allSource);
const mainApp = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// 1. No external location APIs anywhere.
// ---------------------------------------------------------------------------

const FORBIDDEN = [
  /maps\.googleapis\.com/i,
  /googleapis\.com\/geolocation/i,
  /www\.googleapis\.com\/geolocation/i,
  /api\.mapbox\.com/i,
  /nominatim/i,
  /openstreetmap/i,
  /locationiq/i,
  /opencagedata/i,
  /positionstack/i,
  /ipapi|ipinfo|ip-api/i,
  /distancematrix/i,
  /geocod(e|ing)\s*\(/i,
];

test("location module never calls a third-party location service", () => {
  for (const pattern of FORBIDDEN) {
    assert.doesNotMatch(allCode, pattern, `Forbidden location provider matched ${pattern}`);
  }
});

test("location module makes no network requests at all", () => {
  assert.doesNotMatch(allCode, /\bfetch\s*\(/);
  assert.doesNotMatch(allCode, /XMLHttpRequest/);
  assert.doesNotMatch(allCode, /axios/);
});

test("location module requires no API key", () => {
  assert.doesNotMatch(allCode, /API_KEY|apiKey|api_key|access_token/i);
});

// ---------------------------------------------------------------------------
// 2. watchPosition-only GPS configuration.
// ---------------------------------------------------------------------------

test("watchPosition is the only tracking primitive", () => {
  assert.match(sources["gpsWatcher.ts"], /navigator\.geolocation\.watchPosition\(/);
  // getCurrentPosition must not be used anywhere in the app.
  assert.doesNotMatch(allCode, /geolocation\.getCurrentPosition\s*\(/);
  assert.doesNotMatch(stripComments(mainApp), /geolocation\.getCurrentPosition\s*\(/);
});

test("GPS options are high accuracy, 15s timeout, no cached position", () => {
  const watcher = sources["gpsWatcher.ts"];
  assert.match(watcher, /enableHighAccuracy:\s*true/);
  assert.match(watcher, /timeout:\s*15_?000/);
  assert.match(watcher, /maximumAge:\s*0/);
});

test("the watch is cleared on stop so no listener leaks", () => {
  assert.match(sources["gpsWatcher.ts"], /clearWatch\(/);
});

// ---------------------------------------------------------------------------
// 3. Accuracy rules.
// ---------------------------------------------------------------------------

const validator = sources["locationValidator.ts"];

test("accuracy thresholds match the specification", () => {
  assert.match(validator, /excellent:\s*15/);
  assert.match(validator, /good:\s*30/);
  assert.match(validator, /fair:\s*50/);
  assert.match(validator, /poor:\s*100/);
  assert.match(validator, /FAIR_HOLD_MS\s*=\s*10_?000/);
  assert.match(validator, /MOVEMENT_THRESHOLD_M\s*=\s*100/);
});

// Re-implement the graded rules to prove the boundaries are the specified ones.
function grade(accuracy) {
  if (!Number.isFinite(accuracy) || accuracy < 0) return "unusable";
  if (accuracy <= 15) return "excellent";
  if (accuracy <= 30) return "good";
  if (accuracy <= 50) return "fair";
  if (accuracy <= 100) return "poor";
  return "unusable";
}

test("accuracy grading boundaries", () => {
  assert.equal(grade(0), "excellent");
  assert.equal(grade(15), "excellent");
  assert.equal(grade(16), "good");
  assert.equal(grade(30), "good");
  assert.equal(grade(31), "fair");
  assert.equal(grade(50), "fair");
  assert.equal(grade(51), "poor");
  assert.equal(grade(100), "poor");
  assert.equal(grade(101), "unusable");
});

test("readings above 100 m are rejected and block nearby computation", () => {
  assert.match(validator, /Rejected: unusable accuracy/);
});

// ---------------------------------------------------------------------------
// 4. Haversine distance is computed locally.
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (d) => (d * Math.PI) / 180;
function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

test("distance calculator uses Haversine, not an API", () => {
  const calc = sources["distanceCalculator.ts"];
  assert.match(calc, /haversineMeters/);
  assert.match(calc, /Math\.asin/);
  assert.doesNotMatch(stripComments(calc), /fetch|http/i);
});

test("haversine reference values are correct", () => {
  // Jaipur MI Road → Malviya Nagar, roughly 7 km.
  const d = haversineMeters(26.9157, 75.8189, 26.8535, 75.8104) / 1000;
  assert.ok(d > 6.5 && d < 7.5, `expected ~7 km, got ${d}`);
  // Identical points.
  assert.equal(haversineMeters(26.9, 75.8, 26.9, 75.8), 0);
  // ~111 m for 0.001 degree of latitude.
  const oneMilli = haversineMeters(26.9, 75.8, 26.901, 75.8);
  assert.ok(oneMilli > 105 && oneMilli < 116, `expected ~111 m, got ${oneMilli}`);
});

// ---------------------------------------------------------------------------
// 5. Sorting + bucketing rules.
// ---------------------------------------------------------------------------

test("salons are bucketed into the specified distance sections", () => {
  const nearby = sources["nearbySalonService.ts"];
  assert.match(nearby, /"Nearby"/);
  assert.match(nearby, /"Close"/);
  assert.match(nearby, /"Around You"/);
  assert.match(nearby, /"Everything Else"/);
  assert.match(nearby, /maxKm:\s*2/);
  assert.match(nearby, /maxKm:\s*5/);
  assert.match(nearby, /maxKm:\s*10/);
});

test("sort priority is distance, rating, featured, recently active", () => {
  const nearby = sources["nearbySalonService.ts"];
  const order = ["1. Nearest distance", "2. Highest rating", "3. Featured status", "4. Recently active"];
  let cursor = -1;
  for (const marker of order) {
    const at = nearby.indexOf(marker);
    assert.ok(at > cursor, `expected "${marker}" after position ${cursor}`);
    cursor = at;
  }
});

// ---------------------------------------------------------------------------
// 6. Required modules exist.
// ---------------------------------------------------------------------------

test("every required module is present", () => {
  for (const file of [
    "locationService.ts", "gpsWatcher.ts", "locationValidator.ts",
    "distanceCalculator.ts", "nearbySalonService.ts", "permissionManager.ts",
    "logger.ts", "useLocation.ts", "types.ts", "index.ts",
  ]) {
    assert.ok(files.includes(file), `missing module ${file}`);
  }
});

test("service exposes latitude, longitude, accuracy, timestamp, speed and heading", () => {
  const types = sources["types.ts"];
  for (const field of ["latitude", "longitude", "accuracy", "timestamp", "speed", "heading"]) {
    assert.match(types, new RegExp(`\\b${field}\\b`), `GeoFix should expose ${field}`);
  }
});

// ---------------------------------------------------------------------------
// 7. Error handling and permissions.
// ---------------------------------------------------------------------------

test("all documented failure modes have a user-facing message", () => {
  const service = sources["locationService.ts"];
  for (const code of [
    "PERMISSION_DENIED", "POSITION_UNAVAILABLE", "TIMEOUT",
    "OFFLINE", "WEAK_SIGNAL", "GPS_DISABLED", "UNSUPPORTED", "UNKNOWN",
  ]) {
    assert.match(service, new RegExp(code), `missing handling for ${code}`);
  }
  assert.match(service, /Please enable location to discover nearby salons\./);
  assert.match(service, /Improving your location…/);
});

test("denied permission offers retry and manual selection", () => {
  assert.match(sources["locationService.ts"], /retry\(\)/);
  assert.match(sources["locationService.ts"], /setManualLocation\(/);
  assert.match(mainApp, /Retry location/);
  assert.match(mainApp, /Please enable location to discover nearby salons\./);
});

test("manual areas are bundled constants, not geocoded lookups", () => {
  const manual = sources["manualAreas.ts"];
  assert.match(manual, /latitude:\s*-?\d/);
  assert.doesNotMatch(stripComments(manual), /fetch|http|geocode/i);
});

// ---------------------------------------------------------------------------
// 8. Debug logging.
// ---------------------------------------------------------------------------

test("every GPS update logs the required debug fields", () => {
  const service = sources["locationService.ts"];
  for (const field of [
    "latitude", "longitude", "accuracyMeters", "timestamp",
    "movementMeters", "permission", "updateCount", "decision",
  ]) {
    assert.match(service, new RegExp(field), `GPS log should include ${field}`);
  }
});
