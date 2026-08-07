/**
 * GPSWatcher — a single, leak-free wrapper around
 * `navigator.geolocation.watchPosition()`.
 *
 * Design rules:
 *  - `watchPosition()` is the only tracking primitive; `getCurrentPosition()`
 *    is never used, because a continuous watch is what lets Android's fused
 *    provider converge from a coarse cell/Wi-Fi fix to a true GNSS fix.
 *  - `enableHighAccuracy: true`, `timeout: 15000`, `maximumAge: 0` — a cached
 *    coordinate is never reused.
 *  - Exactly one watch id exists at a time. Starting twice is a no-op, so
 *    React StrictMode double-effects and multiple screens cannot create
 *    duplicate listeners.
 *  - The watch is suspended while the PWA is backgrounded and resumed on
 *    return, which is the single biggest battery win on Android.
 */

import { locationLogger } from "./logger";

export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

export type GPSWatcherCallbacks = {
  onPosition: (position: GeolocationPosition) => void;
  onError: (error: GeolocationPositionError) => void;
  /** Fired when the watch is paused/resumed for battery reasons. */
  onVisibilityChange?: (visible: boolean) => void;
};

export class GPSWatcher {
  private readonly log = locationLogger.child("GPSWatcher");
  private watchId: number | null = null;
  private callbacks: GPSWatcherCallbacks | null = null;
  private visibilityHandler: (() => void) | null = null;
  private suspended = false;
  /** Pause the watch when hidden for longer than this (ms). */
  private readonly backgroundGraceMs = 30_000;
  private backgroundTimer: number | null = null;

  get active(): boolean {
    return this.watchId !== null;
  }

  static supported(): boolean {
    return typeof navigator !== "undefined" && "geolocation" in navigator && typeof navigator.geolocation.watchPosition === "function";
  }

  /** Start watching. Safe to call repeatedly — only one watch ever exists. */
  start(callbacks: GPSWatcherCallbacks): boolean {
    this.callbacks = callbacks;
    if (!GPSWatcher.supported()) {
      this.log.error("navigator.geolocation.watchPosition is not available in this browser.");
      return false;
    }
    this.attachVisibility();
    return this.engage();
  }

  /** Tear the watch down and release every listener (no memory leaks). */
  stop() {
    this.disengage();
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    if (this.backgroundTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    this.visibilityHandler = null;
    this.callbacks = null;
    this.suspended = false;
  }

  /**
   * Drop and re-create the watch. Android sometimes wedges a watch after the
   * radio is toggled or the app returns from a long background stint; a clean
   * restart forces the fused provider to re-acquire.
   */
  restart(): boolean {
    if (!this.callbacks) return false;
    this.log.info("Restarting the GPS watch to force a fresh acquisition.");
    this.disengage();
    return this.engage();
  }

  private engage(): boolean {
    if (this.watchId !== null) {
      this.log.debug("Watch already active — ignoring duplicate start (no duplicate listeners).");
      return true;
    }
    const callbacks = this.callbacks;
    if (!callbacks) return false;
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => callbacks.onPosition(position),
        (error) => callbacks.onError(error),
        GPS_OPTIONS,
      );
      this.log.info("watchPosition started.", { watchId: this.watchId, options: GPS_OPTIONS });
      return true;
    } catch (cause) {
      this.log.error("watchPosition threw while starting.", cause);
      this.watchId = null;
      return false;
    }
  }

  private disengage() {
    if (this.watchId === null) return;
    try {
      navigator.geolocation.clearWatch(this.watchId);
      this.log.info("watchPosition cleared.", { watchId: this.watchId });
    } catch (cause) {
      this.log.warn("clearWatch failed.", cause);
    }
    this.watchId = null;
  }

  private attachVisibility() {
    if (typeof document === "undefined" || this.visibilityHandler) return;
    this.visibilityHandler = () => {
      const visible = document.visibilityState === "visible";
      this.callbacks?.onVisibilityChange?.(visible);
      if (typeof window === "undefined") return;
      if (visible) {
        if (this.backgroundTimer !== null) { window.clearTimeout(this.backgroundTimer); this.backgroundTimer = null; }
        if (this.suspended) {
          this.suspended = false;
          this.log.info("App foregrounded — resuming GPS watch.");
          this.engage();
        }
        return;
      }
      // Backgrounded: give a short grace period (tab switches, share sheets)
      // before releasing the radio so we do not thrash the fix.
      if (this.backgroundTimer !== null) window.clearTimeout(this.backgroundTimer);
      this.backgroundTimer = window.setTimeout(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") return;
        if (this.watchId === null) return;
        this.suspended = true;
        this.log.info("App backgrounded — suspending GPS watch to save battery.");
        this.disengage();
      }, this.backgroundGraceMs);
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }
}
