// PHASE 5 — LOCATION SYNCHRONIZATION (Job Portal Sub-App).
//
// The Sub-App must reuse the canonical Nexora private-location architecture:
//
//   SIGNED_IN → request geolocation → navigator.geolocation.watchPosition()
//     → validate coordinates → save the authenticated user's location.
//
// Hard rules verified here:
//   * watchPosition() is the only tracking primitive (no getCurrentPosition);
//   * no fabricated location: no IP-geolocation service, no city-centre
//     coordinate fallback anywhere in the Sub-App;
//   * no arbitrary user_id from the frontend: identity flows from the
//     Supabase session, is re-verified via auth.getUser(), and the SQL RPC
//     derives the row owner from auth.uid() with RLS double-checking it.
//
// Static contract tests only — no network, no credentials.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const hook = await readFile(
  new URL("../job-portal/src/hooks/useLocationSync.ts", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../job-portal/src/App.tsx", import.meta.url), "utf8");
const gpsWatcher = await readFile(
  new URL("../packages/location/src/gpsWatcher.ts", import.meta.url),
  "utf8",
);
const repository = await readFile(
  new URL("../packages/location/src/locationRepository.ts", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL("../supabase/migrations/20260812_phase7_shared_location_security.sql", import.meta.url),
  "utf8",
);

function collectSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push({ path: full, source: readFileSync(full, "utf8") });
  }
  return out;
}
const jobPortalSources = collectSources(
  fileURLToPath(new URL("../job-portal/src", import.meta.url)),
);

// ---------------------------------------------------------------------------
// 1. The hook binds the canonical architecture to the auth context
// ---------------------------------------------------------------------------

test("useLocationSync reuses the canonical @nexora/location package", () => {
  assert.match(hook, /from '\.\.\/\.\.\/\.\.\/packages\/location\/src'/);
  assert.match(hook, /useLocation\(\{/);
  assert.match(hook, /syncPrivateLocation: true/);
});

test("identity comes only from the Supabase session — never a caller-supplied user_id", () => {
  assert.match(hook, /useAuth\(\)/);
  assert.match(hook, /const userId = user\?\.id \?\? null/);
  // The hook takes no arguments, so no caller can inject a foreign user_id.
  assert.match(hook, /export function useLocationSync\(\): UseLocationResult \{/);
  assert.doesNotMatch(hook, /useLocationSync\([^)]+\)/);
});

test("geolocation is requested only after SIGNED_IN, once per sign-in", () => {
  assert.match(hook, /auto: Boolean\(userId\)/);
  assert.match(hook, /armedForUser/);
  assert.match(hook, /locationService\.retry\(\)/);
});

test("App mounts the sync exactly once", () => {
  assert.match(app, /import \{ useLocationSync \} from '\.\/hooks\/useLocationSync'/);
  assert.equal(app.split("useLocationSync();").length - 1, 1);
});

// ---------------------------------------------------------------------------
// 2. watchPosition is the only tracking primitive; nothing is fabricated
// ---------------------------------------------------------------------------

test("the canonical watcher uses navigator.geolocation.watchPosition exclusively", () => {
  assert.match(gpsWatcher, /navigator\.geolocation\.watchPosition\(/);
  assert.match(gpsWatcher, /enableHighAccuracy: true/);
  assert.match(gpsWatcher, /maximumAge: 0/);
  // getCurrentPosition is never *called* anywhere in the location package or Sub-App.
  for (const { path, source } of jobPortalSources) {
    assert.doesNotMatch(source, /\.getCurrentPosition\(/, `${path} must not call getCurrentPosition`);
  }
  assert.doesNotMatch(gpsWatcher, /\.getCurrentPosition\(/);
});

test("no IP-geolocation service and no city-centre fallback in the Sub-App", () => {
  const ipServices = /(ip-?api|ipinfo|ipgeolocation|freegeoip|geoip|geojs\.io|ipdata\.co)/i;
  for (const { path, source } of jobPortalSources) {
    assert.doesNotMatch(source, ipServices, `${path} must not use IP geolocation`);
  }
  // The sync hook itself contains no coordinate literals of any kind.
  assert.doesNotMatch(hook, /(latitude|longitude|lat|lng)\s*[:=]\s*-?\d/i);
});

// ---------------------------------------------------------------------------
// 3. Validation and auth.uid()-derived persistence
// ---------------------------------------------------------------------------

test("coordinates are validated client-side and again inside PostgreSQL", () => {
  assert.match(repository, /isValidCoordinate/);
  assert.match(migration, /p_latitude not between -90 and 90/);
  assert.match(migration, /p_longitude not between -180 and 180/);
  assert.match(migration, /p_latitude = 0 and p_longitude = 0/);
  assert.match(migration, /GPS accuracy is not distance-safe/);
});

test("the save path derives the owner from auth.uid(), never from the payload", () => {
  // Browser side: identity re-verified against the live session…
  assert.match(repository, /requireIdentity/);
  assert.match(repository, /auth\.getUser\(\)/);
  assert.match(repository, /rpc\("save_my_private_location"/);
  // …and the RPC payload carries no user id at all.
  const payload = repository.slice(
    repository.indexOf('rpc("save_my_private_location"'),
    repository.indexOf("if (error) throw error", repository.indexOf('rpc("save_my_private_location"')),
  );
  assert.doesNotMatch(payload, /user_?id/i);
  // Database side: caller uuid := auth.uid(), RLS user_id = auth.uid().
  assert.match(migration, /caller uuid := auth\.uid\(\)/);
  assert.match(migration, /user_id = auth\.uid\(\)/);
});
