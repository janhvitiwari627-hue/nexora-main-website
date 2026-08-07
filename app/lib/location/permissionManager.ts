/**
 * PermissionManager — reads and observes the Geolocation permission state.
 *
 * Uses the Permissions API when available (Android Chrome supports it) and
 * degrades gracefully to "unknown" elsewhere. It never prompts on its own:
 * the prompt is raised by the actual `watchPosition()` call, so the permission
 * dialog always appears in response to app intent rather than a probe.
 */

import { locationLogger } from "./logger";
import type { PermissionStatusValue } from "./types";

type Unsubscribe = () => void;

export class PermissionManager {
  private readonly log = locationLogger.child("Permission");
  private current: PermissionStatusValue = "unknown";
  private status: PermissionStatus | null = null;
  private readonly listeners = new Set<(value: PermissionStatusValue) => void>();
  private handler: (() => void) | null = null;

  get value(): PermissionStatusValue {
    return this.current;
  }

  supported(): boolean {
    return typeof navigator !== "undefined" && "geolocation" in navigator;
  }

  /** True when the page is on a secure origin, which Android Chrome requires. */
  secureContext(): boolean {
    if (typeof window === "undefined") return false;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  }

  /** Read the current permission state without triggering a prompt. */
  async query(): Promise<PermissionStatusValue> {
    if (!this.supported()) {
      this.set("unknown");
      return this.current;
    }
    try {
      const perms = typeof navigator !== "undefined" ? navigator.permissions : undefined;
      if (!perms?.query) {
        this.set("unknown");
        return this.current;
      }
      const status = await perms.query({ name: "geolocation" as PermissionName });
      this.attach(status);
      this.set(status.state as PermissionStatusValue);
      return this.current;
    } catch (cause) {
      this.log.debug("Permissions API unavailable; falling back to 'unknown'.", cause);
      this.set("unknown");
      return this.current;
    }
  }

  /** Subscribe to permission changes (e.g. the user flips it in settings). */
  subscribe(listener: (value: PermissionStatusValue) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Record the state implied by a geolocation callback outcome. */
  noteFromCallback(value: PermissionStatusValue) {
    this.set(value);
  }

  dispose() {
    if (this.status && this.handler) this.status.removeEventListener("change", this.handler);
    this.status = null;
    this.handler = null;
    this.listeners.clear();
  }

  private attach(status: PermissionStatus) {
    if (this.status === status) return;
    if (this.status && this.handler) this.status.removeEventListener("change", this.handler);
    this.status = status;
    this.handler = () => {
      this.log.info(`Permission changed to "${status.state}".`);
      this.set(status.state as PermissionStatusValue);
    };
    status.addEventListener("change", this.handler);
  }

  private set(value: PermissionStatusValue) {
    if (this.current === value) return;
    this.current = value;
    for (const listener of this.listeners) {
      try { listener(value); } catch (cause) { this.log.error("Permission listener failed.", cause); }
    }
  }
}
