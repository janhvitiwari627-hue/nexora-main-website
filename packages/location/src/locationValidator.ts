/**
 * LocationValidator — never trust the first GPS reading.
 *
 * Accuracy policy (metres, from `position.coords.accuracy`):
 *   0–15    excellent  → accept immediately
 *   16–30   good       → accept
 *   31–50   fair       → hold; accept if nothing better arrives within 10 s
 *   51–100  poor       → keep waiting, show "Improving your location..."
 *   >100    unusable   → reject, do not compute nearby salons
 */

import { haversineMeters, isValidCoordinate } from "./distanceCalculator";
import type { AccuracyGrade, GeoFix, ValidationDecision } from "./types";

export const ACCURACY_THRESHOLDS = {
  excellent: 15,
  good: 30,
  fair: 50,
  poor: 100,
} as const;

/** How long a "fair" (31–50 m) reading is held before it is accepted. */
export const FAIR_HOLD_MS = 10_000;

/** Movement beyond this many metres triggers a distance recalculation. */
export const MOVEMENT_THRESHOLD_M = 100;

/** Readings older than this are rejected when the OS replays them. */
export const MAX_FIX_AGE_MS = 60_000;

/** A displayed GPS reading older than this is explicitly labelled stale. */
export const LIVE_FIX_MAX_AGE_MS = 2 * 60_000;

export function isFreshGpsFix(fix: GeoFix | null, now = Date.now()): boolean {
  return Boolean(
    fix && fix.source === "gps" &&
    Number.isFinite(fix.timestamp) &&
    now >= fix.timestamp &&
    now - fix.timestamp <= LIVE_FIX_MAX_AGE_MS,
  );
}

export function locationFreshness(fix: GeoFix | null, now = Date.now()): "live" | "saved" | "stale" | null {
  if (!fix) return null;
  if (isFreshGpsFix(fix, now)) return "live";
  if (fix.source === "saved") return "saved";
  return "stale";
}

/** Physically impossible jump filter (m/s) — ~540 km/h. */
const MAX_PLAUSIBLE_SPEED_MPS = 150;

export function gradeAccuracy(accuracy: number): AccuracyGrade {
  if (!Number.isFinite(accuracy) || accuracy < 0) return "unusable";
  if (accuracy <= ACCURACY_THRESHOLDS.excellent) return "excellent";
  if (accuracy <= ACCURACY_THRESHOLDS.good) return "good";
  if (accuracy <= ACCURACY_THRESHOLDS.fair) return "fair";
  if (accuracy <= ACCURACY_THRESHOLDS.poor) return "poor";
  return "unusable";
}

export class LocationValidator {
  /**
   * Grade a raw reading and decide what to do with it.
   * Pure function of the reading — no side effects, easy to unit test.
   */
  evaluate(coords: { latitude: number; longitude: number; accuracy: number }): ValidationDecision {
    if (!isValidCoordinate(coords.latitude, coords.longitude)) {
      return {
        grade: "unusable", accept: false, hold: false, reject: true, holdMs: 0,
        reason: "Rejected: coordinates are out of range or a null-island sentinel.",
      };
    }
    const grade = gradeAccuracy(coords.accuracy);
    switch (grade) {
      case "excellent":
        return { grade, accept: true, hold: false, reject: false, holdMs: 0, reason: `Accepted immediately: excellent accuracy (±${Math.round(coords.accuracy)} m ≤ ${ACCURACY_THRESHOLDS.excellent} m).` };
      case "good":
        return { grade, accept: true, hold: false, reject: false, holdMs: 0, reason: `Accepted: good accuracy (±${Math.round(coords.accuracy)} m ≤ ${ACCURACY_THRESHOLDS.good} m).` };
      case "fair":
        return { grade, accept: false, hold: true, reject: false, holdMs: FAIR_HOLD_MS, reason: `Held: fair accuracy (±${Math.round(coords.accuracy)} m). Accepting in ${FAIR_HOLD_MS / 1000}s unless a better reading arrives.` };
      case "poor":
        return { grade, accept: false, hold: false, reject: false, holdMs: 0, reason: `Waiting: weak accuracy (±${Math.round(coords.accuracy)} m > ${ACCURACY_THRESHOLDS.fair} m). Continuing to listen.` };
      default:
        return { grade, accept: false, hold: false, reject: true, holdMs: 0, reason: `Rejected: unusable accuracy (±${Math.round(coords.accuracy)} m > ${ACCURACY_THRESHOLDS.poor} m). Nearby salons are not computed.` };
    }
  }

  /** True when the reading is fresher than {@link MAX_FIX_AGE_MS}. */
  isFresh(timestamp: number, now = Date.now()): boolean {
    return Number.isFinite(timestamp) && now - timestamp <= MAX_FIX_AGE_MS;
  }

  /**
   * Guards against the classic "GPS jumped to another city" artefact: a huge
   * positional change in a tiny amount of time from a low-confidence reading.
   */
  isPlausibleJump(previous: GeoFix | null, next: { latitude: number; longitude: number; accuracy: number; timestamp: number }): boolean {
    if (!previous) return true;
    const dtSec = Math.max(1, (next.timestamp - previous.timestamp) / 1000);
    const meters = haversineMeters(previous.latitude, previous.longitude, next.latitude, next.longitude);
    // Movement inside the combined error circles is noise, not a jump.
    if (meters <= previous.accuracy + next.accuracy) return true;
    if (meters / dtSec > MAX_PLAUSIBLE_SPEED_MPS) return false;
    // A much less accurate reading that also disagrees wildly is untrustworthy.
    return !(next.accuracy > previous.accuracy * 3 && meters > next.accuracy * 3);
  }

  /** Is the new reading strictly better than the current candidate? */
  isBetterThan(candidateAccuracy: number | null, accuracy: number): boolean {
    return candidateAccuracy == null || accuracy < candidateAccuracy;
  }

  /** Has the user moved far enough to warrant recalculating distances? */
  hasMovedSignificantly(previous: GeoFix | null, next: { latitude: number; longitude: number }): { moved: boolean; meters: number | null } {
    if (!previous) return { moved: true, meters: null };
    const meters = haversineMeters(previous.latitude, previous.longitude, next.latitude, next.longitude);
    return { moved: meters >= MOVEMENT_THRESHOLD_M, meters };
  }
}

export const locationValidator = new LocationValidator();
