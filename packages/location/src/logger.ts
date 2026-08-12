/**
 * Logger — namespaced, level-aware console logging for the GPS pipeline.
 *
 * Every GPS update logs latitude, longitude, accuracy, timestamp, movement
 * distance, permission status, update count and the accept/reject reason, so
 * field issues on real Android devices can be diagnosed from the console.
 *
 * Verbose logging is on by default in development and can be toggled there
 * with window.__nexoraLocationDebug = true|false. Production always redacts
 * payloads and disables raw GPS events.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const STYLES: Record<LogLevel, string> = {
  debug: "color:#8c7077",
  info: "color:#0b7285;font-weight:600",
  warn: "color:#b26a00;font-weight:600",
  error: "color:#c92a2a;font-weight:700",
};

declare global {
  var __nexoraLocationDebug: boolean | undefined;
}

function debugFlag(): boolean {
  // Exact coordinate payloads must never enter production console output or
  // the diagnostic trail, even when a browser global is toggled manually.
  if (process.env.NODE_ENV === "production" || typeof globalThis === "undefined") return false;
  if (typeof globalThis.__nexoraLocationDebug === "boolean") return globalThis.__nexoraLocationDebug;
  return true;
}

export class Logger {
  private readonly scope: string;
  private minLevel: LogLevel;
  /** Rolling in-memory trail, useful for a support/debug panel. */
  private readonly trail: Array<{ at: number; level: LogLevel; message: string; data?: unknown }> = [];
  private readonly trailLimit = 200;

  constructor(scope: string, minLevel: LogLevel = "debug") {
    this.scope = scope;
    this.minLevel = minLevel;
  }

  child(scope: string): Logger {
    return new Logger(`${this.scope}:${scope}`, this.minLevel);
  }

  setLevel(level: LogLevel) {
    this.minLevel = level;
  }

  debug(message: string, data?: unknown) { this.write("debug", message, data); }
  info(message: string, data?: unknown) { this.write("info", message, data); }
  warn(message: string, data?: unknown) { this.write("warn", message, data); }
  error(message: string, data?: unknown) { this.write("error", message, data); }

  /** Structured raw GPS logging is development/explicit-debug only. */
  gps(event: string, payload: Record<string, unknown>) {
    if (!debugFlag()) return;
    this.write("info", `📍 ${event}`, payload);
  }

  history() {
    return [...this.trail];
  }

  private write(level: LogLevel, message: string, data?: unknown) {
    const verbose = debugFlag();
    // Production diagnostics retain warning/error text only, never coordinate
    // payloads. Exact GPS data exists in memory only when debug is explicit.
    if (verbose || LEVEL_WEIGHT[level] >= LEVEL_WEIGHT.warn) {
      this.trail.push({ at: Date.now(), level, message, data: verbose ? data : undefined });
      if (this.trail.length > this.trailLimit) this.trail.splice(0, this.trail.length - this.trailLimit);
    }

    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.minLevel]) return;
    // Warnings and errors always surface; debug/info only when enabled.
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT.warn && !verbose) return;
    if (typeof console === "undefined") return;

    const tag = `%c[${this.scope}]`;
    const args: unknown[] = [`${tag} ${message}`, STYLES[level]];
    if (data !== undefined && verbose) args.push(data);
    const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    sink(...(args as [string, string, unknown?]));
  }
}

export const locationLogger = new Logger("Nexora/Location");
