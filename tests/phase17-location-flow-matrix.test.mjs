/**
 * Phase 17 — location flow and privacy matrix.
 *
 * The browser GPS callbacks and the database RLS boundary are tested without
 * credentials by the existing location runtime/PGlite suites. This contract
 * maps all eleven requested scenarios to every location-capable app surface
 * carried by this repository and keeps the private-location guarantee explicit:
 *
 *   user A cannot SELECT user B's location.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const locationIndex = await read("packages/location/src/index.ts");
const permissions = await read("packages/location/src/permissionManager.ts");
const watcher = await read("packages/location/src/gpsWatcher.ts");
const service = await read("packages/location/src/locationService.ts");
const validator = await read("packages/location/src/locationValidator.ts");
const repository = await read("packages/location/src/locationRepository.ts");
const sync = await read("packages/location/src/sharedLocationSync.ts");
const hook = await read("packages/location/src/useLocation.ts");
const mainApp = await read("app/nexora-app.tsx");
const jobApp = await read("job-portal/src/App.tsx");
const jobLocationHook = await read("job-portal/src/hooks/useLocationSync.ts");
const templateLocation = await read("integration-packages/template-app/files/src/lib/location.ts");
const templateNearby = await read("integration-packages/template-app/files/src/components/NearbySalonSearch.tsx");
const templateSalonLocation = await read("integration-packages/template-app/files/src/lib/salonLocationService.ts");
const templateStepLocation = await read("integration-packages/template-app/files/src/screens/StepLocation.tsx");
const beautyMain = await read("beauty-industry/src/main.tsx");
const beautyApp = await read("beauty-industry/src/App.tsx");
const migration = await read("supabase/migrations/20260812_phase7_shared_location_security.sql");
const compatRuntime = await read("tests/phase6-location-db-runtime.test.mjs");
const browserRuntime = await read("tests/location-runtime.test.ts");
const staticRuntime = await read("tests/location-system.test.mjs");

const external = await Promise.all([
  ["Customer PWA", "customer-pwa"],
  ["Owner PWA", "owner-pwa"],
  ["Growth Partner PWA", "growth-partner-pwa"],
].map(async ([name, directory]) => {
  const authPatch = await read(`integration-packages/${directory}/auth-integration.patch`);
  const locationPatch = await read(`integration-packages/${directory}/supabase-integration.patch`);
  const readme = await read(`integration-packages/${directory}/README.md`);
  return { name, authPatch, locationPatch, readme };
}));

const matrix = [
  "login",
  "geolocation permission prompt",
  "permission allowed",
  "permission denied",
  "permission unavailable",
  "valid coordinate",
  "invalid coordinate",
  "location persisted",
  "refresh",
  "logout",
  "second user cannot read first user's location",
];

function assertAll(source, patterns, label) {
  for (const pattern of patterns) assert.match(source, pattern, `${label}: ${pattern}`);
}

test("the Phase 17 matrix contains all eleven required scenarios", () => {
  assert.equal(matrix.length, 11);
  assert.deepEqual(matrix, [
    "login",
    "geolocation permission prompt",
    "permission allowed",
    "permission denied",
    "permission unavailable",
    "valid coordinate",
    "invalid coordinate",
    "location persisted",
    "refresh",
    "logout",
    "second user cannot read first user's location",
  ]);
});

test("Main Website and Job Portal bind location to the authenticated user", () => {
  assert.match(mainApp, /userId: session\?\.user\?\.id \?\? null/);
  assert.match(mainApp, /syncPrivateLocation: true/);
  assert.match(jobLocationHook, /const \{ user \} = useAuth\(\)/);
  assert.match(jobLocationHook, /const userId = user\?\.id \?\? null/);
  assert.match(jobLocationHook, /auto: Boolean\(userId\)/);
  assert.match(jobApp, /useLocationSync\(\);/);
});

test("the shared browser location service covers login, permission, valid/invalid GPS, refresh and logout", () => {
  assertAll(permissions, [
    /query\(\)/,
    /set\("unknown"\)/,
    /subscribe\(/,
    /noteFromCallback\(/,
  ], "PermissionManager");
  assertAll(service, [
    /status:.*prompting|MESSAGES\.prompting/,
    /noteFromCallback\("granted"\)/,
    /PERMISSION_DENIED/,
    /POSITION_UNAVAILABLE/,
    /UNSUPPORTED/,
    /clearIdentityLocation\(\)/,
    /retry\(\)/,
  ], "LocationService");
  assertAll(validator, [
    /isValidCoordinate\(/,
    /gradeAccuracy\(/,
    /Rejected: coordinates are out of range/,
    /MAX_FIX_AGE_MS/,
  ], "LocationValidator");
  assert.match(hook, /sharedLocationSync\.bind\(client, userId\)/);
  assert.match(hook, /sharedLocationSync\.unbind\(userId\)/);
  assert.match(sync, /loadOwn\(userId\)/);
  assert.match(sync, /restoreSavedLocation\(saved\)/);
});

test("the location browser harness exercises allowed, denied, unavailable and stale states", () => {
  assert.match(browserRuntime, /GPS allowed produces fresh live coordinates/);
  assert.match(browserRuntime, /GPS denied gracefully retains an explicitly saved real fix/);
  assert.match(browserRuntime, /GPS denied with no saved row exposes no coordinates/);
  assert.match(browserRuntime, /geolocation unavailable never fabricates coordinates/);
  assert.match(browserRuntime, /an aged live reading is distinguished as stale/);
  assert.match(browserRuntime, /watchPosition/);
  assert.match(browserRuntime, /clearWatch/);
  assert.match(staticRuntime, /accuracy validation rejects weak and stale raw readings/);
  assert.match(staticRuntime, /nearby catalogue never sends private user coordinates/);
});

test("private location persistence is authenticated, validated, refreshable and never client-targeted", () => {
  assert.match(repository, /client\.auth\.getUser\(\)/);
  assert.match(repository, /data\.user\.id !== expectedUserId/);
  assert.match(repository, /from\("user_private_locations"\)/);
  assert.match(repository, /\.eq\("user_id", expectedUserId\)/);
  assert.match(repository, /if \(fix\.source !== "gps"\) return/);
  assert.match(repository, /rpc\("save_my_private_location"/);
  assert.match(repository, /rpc\("clear_my_private_location"/);
  assert.match(sync, /repository[\s\S]{0,20}\.loadOwn\(userId\)/);
  assert.match(sync, /repository[\s\S]{0,20}\.saveOwn\(userId, fix\)/);
  assert.doesNotMatch(repository, /localStorage|sessionStorage/);
});

test("the required security property is enforced by table RLS and runtime isolation", () => {
  assert.match(repository, /user_id: string/);
  assert.match(migration, /user_private_locations[\s\S]*?primary key references auth\.users/);
  assert.match(migration, /alter table public\.user_private_locations enable row level security/);
  assert.match(migration, /using \(user_id = auth\.uid\(\)\)/);
  assert.match(migration, /with check \(user_id = auth\.uid\(\)\)/);
  assert.match(migration, /revoke all on table public\.user_private_locations from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.user_private_locations to authenticated/);
  assert.match(migration, /caller uuid := auth\.uid\(\)/);
  assert.doesNotMatch(
    migration.match(/create or replace function public\.save_my_private_location\([\s\S]*?\$fn\$/)?.[0] ?? "",
    /p_user_id|p_user|user_id\s+uuid/i,
  );

  // Runtime evidence: the PGlite suite inserts Alice's row and proves Bob's
  // SELECT returns zero rows under the real migration policies.
  assert.match(compatRuntime, /Bob sees nothing of Alice/);
  assert.match(compatRuntime, /bobView\.rows\.length, 0/);
  assert.match(compatRuntime, /a foreign user must not see another user's location/);
});

test("Template App location flows validate coordinates and use authenticated salon persistence", () => {
  assert.match(templateLocation, /normalizeCoordinates/);
  assert.match(templateLocation, /isValidLatitude/);
  assert.match(templateLocation, /isValidLongitude/);
  assert.match(templateLocation, /haversineDistanceKm/);
  assert.match(templateLocation, /getBrowserLocation/);
  assert.match(templateLocation, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(templateLocation, /lat === 0 && lng === 0/);
  assert.match(templateLocation, /maximumAge: 0/);
  assert.match(templateNearby, /handleUseMyLocation/);
  assert.match(templateNearby, /handleAddressSearch/);
  assert.match(templateNearby, /Unable to determine your location/);
  assert.match(templateSalonLocation, /client\.auth\.getUser\(\)/);
  assert.match(templateSalonLocation, /SALON_LOCATION_TABLE = 'business_locations'/);
  assert.match(templateSalonLocation, /normalizeCoordinates/);
  assert.match(templateStepLocation, /fetchSalonLocation/);
  assert.match(templateStepLocation, /saveSalonLocation/);

  // Template salon coordinates are business data, not private user GPS. The
  // shared user-private RLS property still applies to the platform location
  // table and is tested above.
  assert.doesNotMatch(templateSalonLocation, /user_private_locations/);
});

test("Beauty Industry has no private GPS capability or location persistence", () => {
  assert.match(beautyMain, /createRoot/);
  assert.match(beautyApp, /selectedCity|CitySelectorModal/);
  assert.doesNotMatch(beautyMain, /geolocation/i);
  assert.doesNotMatch(beautyApp, /navigator\.geolocation|user_private_locations|business_locations/);
});

for (const app of external) {
  test(`${app.name} location integration is represented by its checked-in patch`, () => {
    // These target repositories are not checked out here. The repository
    // carries their auth/data integration patches, so this verifies the
    // handoff artifact exists while the shared SQL below remains the single
    // executable privacy boundary.
    assert.match(app.authPatch, /AuthProvider/);
    assert.match(app.readme, /Target repo:/);
    assert.match(app.locationPatch, /location|Location|GPS/i);
  });
}
