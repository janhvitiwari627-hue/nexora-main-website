/**
 * LocationService — the single source of truth for the customer's position.
 *
 * Pipeline
 *   watchPosition() ──► LocationValidator ──► accepted GeoFix ──► subscribers
 *                          │                        │
 *                          └── hold / wait ─────────┴── movement > 100 m ⇒ refresh
 *
 * Guarantees
 *  - Browser-native geolocation only. No Google Geolocation API, no Maps
 *    Geocoding, no reverse geocoding, no Mapbox, no Nominatim, no API keys,
 *    no network request whatsoever.
 *  - Exactly one watcher process-wide (module singleton + reference counting),
 *    so no duplicate listeners and no memory leaks.
 *  - Never uses a cached coordinate (`maximumAge: 0`).
 *  - Never accepts the first reading blindly — multi-step validation runs
 *    until an acceptable accuracy is reached.
 */

import { GPSWatcher } from "./gpsWatcher";
import { locationLogger } from "./logger";
import {
  FAIR_HOLD_MS,
  LocationValidator,
  MOVEMENT_THRESHOLD_M,
  locationValidator,
} from "./locationValidator";
import { PermissionManager } from "./permissionManager";
import { formatAccuracy } from "./distanceCalculator";
import type {
  GeoFix,
  LocationError,
  LocationListener,
  LocationState,
  LocationStatus,
  PermissionStatusValue,
} from "./types";

const MESSAGES = {
  idle: "Location is off.",
  prompting: "Waiting for location permission…",
  acquiring: "Locating you…",
  improving: "Improving your location…",
  ready: "Location ready.",
  denied: "Please enable location to discover nearby salons.",
  unsupported: "This browser does not support location. Choose your area manually.",
  unavailable: "Your device could not get a GPS signal. Move to an open area and retry.",
  timeout: "Getting a GPS fix is taking longer than usual. Keep the app open or retry.",
  offline: "You are offline. Reconnect to refresh salons near you.",
  manual: "Using your selected area.",
  error: "Something went wrong while locating you.",
} as const;

const ERROR_TEXT: Record<LocationError["code"], string> = {
  PERMISSION_DENIED: "Please enable location to discover nearby salons.",
  POSITION_UNAVAILABLE: "GPS is unavailable right now. Turn on device location (high accuracy) and try again.",
  TIMEOUT: "Location is taking too long. Move near a window or open area, then retry.",
  OFFLINE: "You are offline. Nearby salons will refresh when you reconnect.",
  WEAK_SIGNAL: "Weak GPS signal — still improving your location.",
  GPS_DISABLED: "Device location appears to be turned off. Enable it in your phone settings and retry.",
  UNSUPPORTED: "This browser cannot access location. Pick your area manually instead.",
  UNKNOWN: "We could not determine your location. Please retry or choose your area manually.",
};

/** Retry backoff after a recoverable failure (ms). */
const RETRY_BACKOFF_MS = [4_000, 8_000, 15_000, 30_000];

export class LocationService {
  private readonly log = locationLogger.child("Service");
  private readonly watcher = new GPSWatcher();
  private readonly permissions = new PermissionManager();
  private readonly validator: LocationValidator = locationValidator;
  private readonly listeners = new Set<LocationListener>();

  private consumers = 0;
  private state: LocationState = {
    status: "idle",
    fix: null,
    candidateAccuracy: null,
    permission: "unknown",
    error: null,
    updateCount: 0,
    acceptedCount: 0,
    lastMovementMeters: null,
    watching: false,
    message: MESSAGES.idle,
  };

  /** Best not-yet-accepted reading and the timer that will promote it. */
  private candidate: GeoFix | null = null;
  private holdTimer: number | null = null;
  private retryTimer: number | null = null;
  private retryAttempt = 0;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private permissionUnsub: (() => void) | null = null;
  private startedAt = 0;

  // ---------------------------------------------------------------- public

  getState(): LocationState {
    return this.state;
  }

  getFix(): GeoFix | null {
    return this.state.fix;
  }

  /**
   * Subscribe to location state. The first subscriber starts the watcher; the
   * last one to unsubscribe stops it (reference counting keeps exactly one
   * `watchPosition` alive no matter how many components mount).
   */
  subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    this.consumers += 1;
    listener(this.state);
    if (this.consumers === 1) this.start();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.listeners.delete(listener);
      this.consumers = Math.max(0, this.consumers - 1);
      if (this.consumers === 0) this.stop();
    };
  }

  /**
   * Listen to state changes WITHOUT starting the watcher and without taking a
   * reference. Used by consumers that only want to read a fix someone else is
   * already acquiring.
   */
  observe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Begin (or continue) watching. Idempotent. */
  start() {
    if (typeof window === "undefined") return;

    if (!GPSWatcher.supported()) {
      this.fail("UNSUPPORTED", "unsupported");
      return;
    }
    if (!this.permissions.secureContext()) {
      this.log.error("Geolocation requires HTTPS. Serve the PWA over a secure origin.");
      this.fail("UNSUPPORTED", "unsupported");
      return;
    }
    this.attachNetworkListeners();
    void this.permissions.query().then((value) => this.applyPermission(value));
    if (!this.permissionUnsub) {
      this.permissionUnsub = this.permissions.subscribe((value) => {
        this.applyPermission(value);
        // Permission granted from the OS settings while the app is open.
        if (value === "granted" && !this.state.fix) this.watcher.restart();
      });
    }

    if (this.watcher.active) return;

    this.startedAt = Date.now();
    this.patch({
      status: this.permissions.value === "granted" ? "acquiring" : "prompting",
      message: this.permissions.value === "granted" ? MESSAGES.acquiring : MESSAGES.prompting,
      error: null,
      watching: true,
    });

    const started = this.watcher.start({
      onPosition: (position) => this.handlePosition(position),
      onError: (error) => this.handleError(error),
      onVisibilityChange: (visible) => this.log.debug(`Visibility: ${visible ? "foreground" : "background"}.`),
    });
    if (!started) this.fail("UNSUPPORTED", "unsupported");
  }

  /** Stop watching and release every timer/listener. */
  stop() {
    this.watcher.stop();
    this.clearHold();
    this.clearRetry();
    this.detachNetworkListeners();
    this.permissionUnsub?.();
    this.permissionUnsub = null;
    this.patch({ watching: false });
    this.log.info("Location service stopped; all listeners released.");
  }

  /** User-triggered retry (the button shown next to any error). */
  retry() {
    this.log.info("Manual retry requested.");
    this.retryAttempt = 0;
    this.clearRetry();
    this.clearHold();
    this.candidate = null;
    this.patch({ status: "acquiring", message: MESSAGES.acquiring, error: null, candidateAccuracy: null });
    if (this.watcher.active) this.watcher.restart();
    else this.start();
  }

  /**
   * Manual fallback when permission is denied or GPS is unusable. Coordinates
   * come from the app's own bundled area list — never from a geocoding API.
   */
  setManualLocation(latitude: number, longitude: number, label: string) {
    this.clearHold();
    this.clearRetry();
    const fix: GeoFix = {
      latitude, longitude,
      accuracy: 2000,
      timestamp: Date.now(),
      altitude: null, altitudeAccuracy: null, speed: null, heading: null,
      source: "manual",
      label,
    };
    this.log.info(`Manual location selected: ${label}.`, { latitude, longitude });
    this.patch({
      status: "manual",
      fix,
      error: null,
      candidateAccuracy: null,
      lastMovementMeters: null,
      message: `${MESSAGES.manual} (${label})`,
    });
  }

  /** Drop a manual selection and go back to live GPS. */
  clearManualLocation() {
    if (this.state.fix?.source !== "manual") return;
    this.patch({ fix: null, status: "acquiring", message: MESSAGES.acquiring });
    this.retry();
  }

  // --------------------------------------------------------------- private

  private handlePosition(position: GeolocationPosition) {
    const { coords, timestamp } = position;
    const updateCount = this.state.updateCount + 1;
    this.permissions.noteFromCallback("granted");
    this.retryAttempt = 0;
    this.clearRetry();

    const reading = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp,
    };
    const decision = this.validator.evaluate(reading);
    const movement = this.validator.hasMovedSignificantly(this.state.fix, reading);
    const plausible = this.validator.isPlausibleJump(this.state.fix, reading);
    const fresh = this.validator.isFresh(timestamp);

    this.log.gps(`GPS update #${updateCount}`, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: Math.round(coords.accuracy),
      grade: decision.grade,
      timestamp: new Date(timestamp).toISOString(),
      ageMs: Date.now() - timestamp,
      movementMeters: movement.meters == null ? "n/a (first fix)" : Math.round(movement.meters),
      speedMps: coords.speed ?? null,
      headingDeg: coords.heading ?? null,
      altitudeM: coords.altitude ?? null,
      permission: this.permissions.value,
      updateCount,
      acceptedCount: this.state.acceptedCount,
      timeToFixMs: Date.now() - this.startedAt,
      decision: decision.reason,
    });

    this.patch({
      updateCount,
      candidateAccuracy: this.validator.isBetterThan(this.state.candidateAccuracy, coords.accuracy)
        ? coords.accuracy
        : this.state.candidateAccuracy,
    });

    if (!fresh) {
      this.log.warn("Rejected: reading is stale (device replayed an old fix).", { ageMs: Date.now() - timestamp });
      return;
    }
    if (!plausible) {
      this.log.warn("Rejected: implausible position jump — likely a bad network-derived fix.", {
        from: this.state.fix ? [this.state.fix.latitude, this.state.fix.longitude] : null,
        to: [coords.latitude, coords.longitude],
      });
      return;
    }
    if (decision.reject) {
      this.log.warn(decision.reason);
      if (!this.state.fix) {
        this.patch({
          status: "improving",
          message: MESSAGES.improving,
          error: { code: "WEAK_SIGNAL", message: ERROR_TEXT.WEAK_SIGNAL, recoverable: true },
        });
      }
      return;
    }

    const fix = LocationService.toFix(position);

    if (decision.accept) {
      this.clearHold();
      this.commit(fix, movement.meters, decision.reason);
      return;
    }

    if (decision.hold) {
      // Keep the best fair reading; promote it if nothing better lands in 10 s.
      if (!this.candidate || fix.accuracy < this.candidate.accuracy) {
        this.candidate = fix;
        this.log.info(`Holding candidate ${formatAccuracy(fix.accuracy)} for up to ${FAIR_HOLD_MS / 1000}s.`);
      }
      if (this.holdTimer === null && typeof window !== "undefined") {
        this.holdTimer = window.setTimeout(() => {
          this.holdTimer = null;
          const pending = this.candidate;
          this.candidate = null;
          if (!pending) return;
          const moved = this.validator.hasMovedSignificantly(this.state.fix, pending);
          this.commit(pending, moved.meters, `Accepted after the ${FAIR_HOLD_MS / 1000}s hold window: no better reading arrived (${formatAccuracy(pending.accuracy)}).`);
        }, FAIR_HOLD_MS);
      }
      if (!this.state.fix) this.patch({ status: "improving", message: MESSAGES.improving });
      return;
    }

    // "poor" (51–100 m): keep listening, tell the user we are working on it.
    this.log.info(decision.reason);
    if (!this.state.fix) this.patch({ status: "improving", message: MESSAGES.improving, error: null });
  }

  /** Store an accepted fix and notify subscribers. */
  private commit(fix: GeoFix, movementMeters: number | null, reason: string) {
    const previous = this.state.fix;
    const first = !previous;
    const significant = movementMeters == null || movementMeters >= MOVEMENT_THRESHOLD_M;
    // Also refresh when the fix simply got much more accurate.
    const sharper = previous ? fix.accuracy < previous.accuracy * 0.6 : true;

    if (!first && !significant && !sharper) {
      this.log.debug(`Fix kept (movement ${Math.round(movementMeters ?? 0)} m < ${MOVEMENT_THRESHOLD_M} m and accuracy not materially better) — no recalculation.`);
      return;
    }

    this.patch({
      status: "ready",
      fix,
      error: null,
      acceptedCount: this.state.acceptedCount + 1,
      lastMovementMeters: movementMeters,
      candidateAccuracy: fix.accuracy,
      message: MESSAGES.ready,
    });

    this.log.info(
      first
        ? `✅ First accepted fix in ${Date.now() - this.startedAt} ms — ${reason}`
        : `✅ Location updated (moved ${Math.round(movementMeters ?? 0)} m) — ${reason}`,
      {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: formatAccuracy(fix.accuracy),
        timestamp: new Date(fix.timestamp).toISOString(),
        speed: fix.speed,
        heading: fix.heading,
      },
    );
  }

  private handleError(error: GeolocationPositionError) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    let code: LocationError["code"] = "UNKNOWN";
    let status: LocationStatus = "error";

    if (error.code === 1 /* PERMISSION_DENIED */) {
      code = "PERMISSION_DENIED";
      status = "denied";
      this.permissions.noteFromCallback("denied");
    } else if (error.code === 2 /* POSITION_UNAVAILABLE */) {
      code = offline ? "OFFLINE" : "POSITION_UNAVAILABLE";
      status = offline ? "offline" : "unavailable";
    } else if (error.code === 3 /* TIMEOUT */) {
      code = "TIMEOUT";
      status = "timeout";
    }

    this.log.error(`GPS error (${code}): ${error.message || "no message"}`, {
      nativeCode: error.code,
      permission: this.permissions.value,
      updateCount: this.state.updateCount,
      hasFix: Boolean(this.state.fix),
      online: typeof navigator === "undefined" ? null : navigator.onLine,
    });

    // A previously accepted fix is kept — a transient error must not blank
    // out the nearby list the customer is already looking at.
    if (this.state.fix && code !== "PERMISSION_DENIED") {
      this.patch({ error: { code, message: ERROR_TEXT[code], recoverable: true } });
      this.scheduleRetry();
      return;
    }

    if (code === "PERMISSION_DENIED") {
      this.clearHold();
      this.clearRetry();
      this.watcher.stop();
      this.patch({
        status,
        watching: false,
        error: { code, message: ERROR_TEXT[code], recoverable: true },
        message: MESSAGES.denied,
      });
      return;
    }

    this.patch({
      status,
      error: { code, message: ERROR_TEXT[code], recoverable: true },
      message: status === "offline" ? MESSAGES.offline : status === "timeout" ? MESSAGES.timeout : MESSAGES.unavailable,
    });
    this.scheduleRetry();
  }

  private scheduleRetry() {
    if (typeof window === "undefined" || this.retryTimer !== null) return;
    if (this.permissions.value === "denied") return;
    const delay = RETRY_BACKOFF_MS[Math.min(this.retryAttempt, RETRY_BACKOFF_MS.length - 1)];
    this.retryAttempt += 1;
    this.log.info(`Scheduling automatic GPS retry #${this.retryAttempt} in ${delay} ms.`);
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      if (this.consumers === 0) return;
      this.watcher.restart();
    }, delay);
  }

  private fail(code: LocationError["code"], status: LocationStatus) {
    this.patch({
      status,
      watching: false,
      error: { code, message: ERROR_TEXT[code], recoverable: code !== "UNSUPPORTED" },
      message: status === "unsupported" ? MESSAGES.unsupported : MESSAGES.error,
    });
  }

  private applyPermission(value: PermissionStatusValue) {
    if (this.state.permission === value) return;
    this.log.info(`Permission status: ${value}.`);
    const patch: Partial<LocationState> = { permission: value };
    if (value === "denied" && !this.state.fix) {
      patch.status = "denied";
      patch.message = MESSAGES.denied;
      patch.error = { code: "PERMISSION_DENIED", message: ERROR_TEXT.PERMISSION_DENIED, recoverable: true };
    }
    this.patch(patch);
  }

  private attachNetworkListeners() {
    if (typeof window === "undefined" || this.onlineHandler) return;
    this.onlineHandler = () => {
      this.log.info("Back online — re-acquiring GPS.");
      if (this.state.status === "offline") this.retry();
    };
    this.offlineHandler = () => {
      this.log.warn("Device went offline. GPS still works, but salon data cannot refresh.");
      if (!this.state.fix) {
        this.patch({ status: "offline", message: MESSAGES.offline, error: { code: "OFFLINE", message: ERROR_TEXT.OFFLINE, recoverable: true } });
      }
    };
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);
  }

  private detachNetworkListeners() {
    if (typeof window === "undefined") return;
    if (this.onlineHandler) window.removeEventListener("online", this.onlineHandler);
    if (this.offlineHandler) window.removeEventListener("offline", this.offlineHandler);
    this.onlineHandler = null;
    this.offlineHandler = null;
  }

  private clearHold() {
    if (this.holdTimer !== null && typeof window !== "undefined") window.clearTimeout(this.holdTimer);
    this.holdTimer = null;
    this.candidate = null;
  }

  private clearRetry() {
    if (this.retryTimer !== null && typeof window !== "undefined") window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private patch(partial: Partial<LocationState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      try { listener(this.state); } catch (cause) { this.log.error("Location subscriber threw.", cause); }
    }
  }

  private static toFix(position: GeolocationPosition): GeoFix {
    const c = position.coords;
    return {
      latitude: c.latitude,
      longitude: c.longitude,
      accuracy: c.accuracy,
      timestamp: position.timestamp,
      altitude: c.altitude ?? null,
      altitudeAccuracy: c.altitudeAccuracy ?? null,
      speed: c.speed ?? null,
      heading: c.heading ?? null,
      source: "gps",
    };
  }
}

/**
 * Process-wide singleton. Every screen shares this instance, which is what
 * guarantees a single `watchPosition` listener across the whole PWA.
 */
export const locationService = new LocationService();
