/**
 * Homepage Phase 1 · Section 03 — Smart Search Jaipur boundary.
 *
 * Nexora's marketplace currently serves Jaipur. When the customer uses the
 * user-triggered GPS detection in Smart Search, a fix OUTSIDE this bounding
 * box falls back to manual city/area selection with a clear message instead
 * of producing misleading "near you" rankings for another city.
 *
 * The box is a conservative approximation of the Jaipur urban footprint
 * (city centre ≈ 26.9124 N, 75.7873 E). It is intentionally generous so
 * fringe localities are never told they are "outside Jaipur" wrongly.
 *
 * Hard rule: raw coordinates never leave the device — this module only ever
 * answers a yes/no question, and callers must not serialize the fix itself
 * into URLs, logs or UI.
 */

export type GeoFixLike = { latitude: number; longitude: number };

export const JAIPUR_BOUNDS = {
  minLatitude: 26.7,
  maxLatitude: 27.1,
  minLongitude: 75.6,
  maxLongitude: 76.1,
} as const;

/** True when the fix is inside (or on the edge of) the Jaipur bounding box. */
export function isInsideJaipur(fix: GeoFixLike | null | undefined): boolean {
  if (!fix) return false;
  if (!Number.isFinite(fix.latitude) || !Number.isFinite(fix.longitude)) return false;
  return (
    fix.latitude >= JAIPUR_BOUNDS.minLatitude &&
    fix.latitude <= JAIPUR_BOUNDS.maxLatitude &&
    fix.longitude >= JAIPUR_BOUNDS.minLongitude &&
    fix.longitude <= JAIPUR_BOUNDS.maxLongitude
  );
}
