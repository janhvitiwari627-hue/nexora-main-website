import assert from "node:assert/strict";
import test from "node:test";

import { LocationService } from "../packages/location/src/locationService";
import { Logger } from "../packages/location/src/logger";
import { NearbySalonService } from "../packages/location/src/nearbySalonService";
import { locationFreshness } from "../packages/location/src/locationValidator";
import type { GeoFix } from "../packages/location/src/types";

type PositionCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

function installBrowserHarness(permission: PermissionState = "prompt") {
  let onPosition: PositionCallback | null = null;
  let onError: ErrorCallback | null = null;
  let watchId = 0;

  const permissionStatus = {
    state: permission,
    addEventListener() {},
    removeEventListener() {},
  } as unknown as PermissionStatus;

  const navigatorMock = {
    onLine: true,
    permissions: { query: async () => permissionStatus },
    geolocation: {
      watchPosition(success: PositionCallback, error: ErrorCallback) {
        onPosition = success;
        onError = error;
        watchId += 1;
        return watchId;
      },
      clearWatch() {},
    },
  };
  const windowMock = {
    isSecureContext: true,
    location: { hostname: "nexora.test" },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    addEventListener() {},
    removeEventListener() {},
  };
  const documentMock = {
    visibilityState: "visible",
    addEventListener() {},
    removeEventListener() {},
  };

  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigatorMock });
  Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
  Object.defineProperty(globalThis, "document", { configurable: true, value: documentMock });

  return {
    allow(latitude = 26.91, longitude = 75.81, accuracy = 10) {
      assert.ok(onPosition, "watchPosition should be active");
      onPosition({
        timestamp: Date.now(),
        coords: {
          latitude,
          longitude,
          accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        toJSON: () => ({}),
      });
    },
    deny() {
      assert.ok(onError, "watchPosition should be active");
      onError({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    },
    unavailable() {
      assert.ok(onError, "watchPosition should be active");
      onError({ code: 2, message: "unavailable", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    },
  };
}

function savedFix(timestamp = Date.now() - 60_000): GeoFix {
  return {
    latitude: 26.9,
    longitude: 75.8,
    accuracy: 18,
    timestamp,
    altitude: null,
    altitudeAccuracy: null,
    speed: null,
    heading: null,
    source: "saved",
    savedAt: Date.now() - 30_000,
  };
}

test("GPS allowed produces fresh live coordinates", { concurrency: false }, () => {
  const harness = installBrowserHarness("granted");
  const service = new LocationService();
  const unsubscribe = service.subscribe(() => undefined);
  harness.allow();
  const state = service.getState();
  assert.equal(state.status, "ready");
  assert.equal(state.fix?.source, "gps");
  assert.equal(state.fix?.latitude, 26.91);
  assert.equal(locationFreshness(state.fix), "live");
  unsubscribe();
});

test("GPS denied gracefully retains an explicitly saved real fix", { concurrency: false }, () => {
  const harness = installBrowserHarness("denied");
  const service = new LocationService();
  service.restoreSavedLocation(savedFix());
  const unsubscribe = service.subscribe(() => undefined);
  harness.deny();
  const state = service.getState();
  assert.equal(state.status, "denied");
  assert.equal(state.fix?.source, "saved");
  assert.match(state.message, /saved GPS location/i);
  unsubscribe();
});

test("GPS denied with no saved row exposes no coordinates", { concurrency: false }, () => {
  const harness = installBrowserHarness("denied");
  const service = new LocationService();
  const unsubscribe = service.subscribe(() => undefined);
  harness.deny();
  assert.equal(service.getState().status, "denied");
  assert.equal(service.getState().fix, null);
  unsubscribe();
});

test("geolocation unavailable never fabricates coordinates", { concurrency: false }, () => {
  const harness = installBrowserHarness("granted");
  const service = new LocationService();
  const unsubscribe = service.subscribe(() => undefined);
  harness.unavailable();
  assert.equal(service.getState().status, "unavailable");
  assert.equal(service.getState().fix, null);
  unsubscribe();
});

test("an aged live reading is distinguished as stale", { concurrency: false }, () => {
  const aged: GeoFix = { ...savedFix(Date.now() - 5 * 60_000), source: "gps" };
  assert.equal(locationFreshness(aged), "stale");
  assert.equal(locationFreshness(savedFix()), "saved");
});

test("production diagnostics retain no coordinate payload", { concurrency: false }, () => {
  assert.equal(process.env.NODE_ENV, "production");
  const logger = new Logger("Phase7Test", "error");
  logger.warn("redacted warning", { latitude: 26.91, longitude: 75.81 });
  assert.equal(logger.history().at(-1)?.data, undefined);
});

test("nearby distance excludes pending and legacy coordinates", { concurrency: false }, () => {
  const nearby = new NearbySalonService();
  const rows = nearby.rank([
    { id: "approved", latitude: 26.91, longitude: 75.81, approval_status: "approved" },
    { id: "pending", latitude: 26.92, longitude: 75.82, approval_status: "pending" },
    { id: "legacy", latitude: 26.93, longitude: 75.83 },
  ], { latitude: 26.90, longitude: 75.80 });

  assert.deepEqual(rows.map((row) => row.id), ["approved"]);
  assert.ok(rows[0].distanceKm != null);
});
