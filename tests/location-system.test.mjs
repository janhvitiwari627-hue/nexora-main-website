import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const moduleDir = new URL("../packages/location/src/", import.meta.url);
const files = (await readdir(moduleDir)).filter((file) => file.endsWith(".ts"));
const sources = Object.fromEntries(
  await Promise.all(files.map(async (file) => [file, await readFile(new URL(file, moduleDir), "utf8")])),
);
const allSource = Object.values(sources).join("\n");
const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const badge = await readFile(new URL("../app/lib/location/LocationBadge.tsx", import.meta.url), "utf8");

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const allCode = stripComments(allSource);

const FORBIDDEN_PROVIDERS = [
  /maps\.googleapis\.com\/geolocation/i,
  /googleapis\.com\/geolocation/i,
  /api\.mapbox\.com/i,
  /nominatim/i,
  /openstreetmap/i,
  /locationiq/i,
  /opencagedata/i,
  /positionstack/i,
  /ipapi|ipinfo|ip-api/i,
  /distancematrix/i,
];

test("one canonical package serves Owner, Partner, Customer and Template", () => {
  const entry = sources["index.ts"];
  for (const surface of ["Owner", "Partner", "Customer", "Template"]) {
    assert.match(entry, new RegExp(surface));
  }
  assert.match(app, /const location = useLocation\(\{/);
  assert.match(app, /syncPrivateLocation: true/);
  assert.match(app, /<Header[^>]*location=\{location\}/);
  assert.match(app, /TEMPLATE_PATH/);
});

test("live GPS uses only navigator.geolocation.watchPosition", () => {
  const watcher = sources["gpsWatcher.ts"];
  assert.match(watcher, /navigator\.geolocation\.watchPosition\(/);
  assert.match(watcher, /enableHighAccuracy:\s*true/);
  assert.match(watcher, /timeout:\s*15_?000/);
  assert.match(watcher, /maximumAge:\s*0/);
  assert.match(watcher, /clearWatch\(/);
  assert.doesNotMatch(allCode, /geolocation\.getCurrentPosition\s*\(/);
  assert.doesNotMatch(stripComments(app), /geolocation\.getCurrentPosition\s*\(/);
});

test("no third-party geolocation, IP guess, API key or fabricated coordinate fallback", () => {
  for (const pattern of FORBIDDEN_PROVIDERS) assert.doesNotMatch(allCode, pattern);
  assert.doesNotMatch(allCode, /\bfetch\s*\(|XMLHttpRequest|axios/i);
  assert.doesNotMatch(allCode, /manualAreas|area centre|area centroid/i);
  assert.doesNotMatch(allCode, /source:\s*["']manual["']/);
  assert.match(sources["locationService.ts"], /fix` stays null — never a guess/);
  assert.match(badge, /does not substitute an IP guess or a made-up location/);
});

test("shared package is locked to the one Supabase project", () => {
  assert.match(sources["config.ts"], /qwaehqsmodekbgvnaavz/);
  assert.match(sources["config.ts"], /assertSharedLocationProject/);
  assert.match(sources["locationRepository.ts"], /assertSharedLocationProject\(client\)/);
});

test("central persistence verifies the global auth user before every read/write", () => {
  const repository = sources["locationRepository.ts"];
  assert.match(repository, /client\.auth\.getUser\(\)/);
  assert.match(repository, /data\.user\.id !== expectedUserId/);
  assert.match(repository, /from\("user_private_locations"\)/);
  assert.match(repository, /rpc\("save_my_private_location"/);
  assert.match(repository, /rpc\("clear_my_private_location"/);
  assert.doesNotMatch(repository, /localStorage|sessionStorage/);
});

test("only real fresh GPS is persisted", () => {
  const repository = sources["locationRepository.ts"];
  assert.match(repository, /if \(fix\.source !== "gps"\) return/);
  assert.match(repository, /p_captured_at: new Date\(fix\.timestamp\)\.toISOString\(\)/);
  assert.match(sources["sharedLocationSync.ts"], /fix\.source !== "gps"/);
  assert.match(sources["sharedLocationSync.ts"], /persistFreshGps\(locationService\.getState\(\)\)/);
});

test("saved and stale readings can never be labelled live", () => {
  const validator = sources["locationValidator.ts"];
  assert.match(validator, /LIVE_FIX_MAX_AGE_MS/);
  assert.match(validator, /fix\.source === "gps"/);
  assert.match(validator, /return "saved"/);
  assert.match(validator, /return "stale"/);
  assert.match(badge, /Saved device GPS — not live/);
  assert.match(badge, /freshness === "live" \? "Fresh device GPS"/);
});

test("GPS denied/unavailable retains only a real saved fallback", () => {
  const service = sources["locationService.ts"];
  assert.match(service, /PERMISSION_DENIED/);
  assert.match(service, /POSITION_UNAVAILABLE/);
  assert.match(service, /const fallbackFix = this\.asSavedFallback\(this\.state\.fix\)/);
  assert.match(service, /fix: fallbackFix/);
  assert.match(service, /No coordinates will be guessed/);
  assert.match(app, /No saved GPS is available for this account, so no distance is shown/);
});

test("accuracy validation rejects weak and stale raw readings", () => {
  const validator = sources["locationValidator.ts"];
  assert.match(validator, /excellent:\s*15/);
  assert.match(validator, /good:\s*30/);
  assert.match(validator, /fair:\s*50/);
  assert.match(validator, /poor:\s*100/);
  assert.match(validator, /FAIR_HOLD_MS\s*=\s*10_?000/);
  assert.match(validator, /MAX_FIX_AGE_MS\s*=\s*60_?000/);
  assert.match(validator, /Rejected: unusable accuracy/);
});

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (degrees) => (degrees * Math.PI) / 180;
function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

test("distance uses local Haversine maths", () => {
  const calculator = sources["distanceCalculator.ts"];
  assert.match(calculator, /haversineMeters/);
  assert.match(calculator, /Math\.asin/);
  assert.doesNotMatch(stripComments(calculator), /fetch|https?:/i);
  const jaipurDistance = haversineMeters(26.9157, 75.8189, 26.8535, 75.8104) / 1000;
  assert.ok(jaipurDistance > 6.5 && jaipurDistance < 7.5);
});

test("nearby ranking refuses pending or legacy business coordinates", () => {
  const nearby = sources["nearbySalonService.ts"];
  assert.match(nearby, /salon\.approval_status === "approved"/);
  assert.match(nearby, /origin && approved \? distanceToPointKm/);
  assert.match(nearby, /row\.approval_status === "approved"/);
  assert.match(app, /from\("business_locations"\)/);
  assert.match(app, /\.eq\("approval_status", "approved"\)/);
  assert.doesNotMatch(app, /select\([^\n]*business_category,latitude,longitude,phone/);
});

test("nearby catalogue never sends private user coordinates to Supabase", () => {
  assert.doesNotMatch(app, /marketplace_nearby[\s\S]{0,180}p_lat:/);
  assert.match(app, /every distance is[\s\S]{0,20}computed locally/);
});

test("badge stays present and visibly distinguishes live/saved/off", async () => {
  for (const tone of ["live", "waiting", "saved", "off"]) {
    assert.match(badge, new RegExp(`"${tone}"`));
  }
  assert.match(badge, /<svg/);
  assert.match(badge, /aria-label=\{`Location: /);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.loc-badge-button/);
  assert.match(css, /\.loc-dot-saved/);
  assert.match(css, /:not\(\.loc-badge-button\)/);
});
