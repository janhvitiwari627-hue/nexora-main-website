/**
 * DistanceCalculator — on-device distance maths.
 *
 * Uses the Haversine formula only. No Google Distance Matrix, no routing
 * service, no network call of any kind. Every salon row already carries a
 * latitude/longitude, so the whole calculation happens locally and works
 * offline.
 */

import type { GeoPoint } from "./types";

/** Mean Earth radius (IUGG) in metres. */
export const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
    // (0,0) in the Gulf of Guinea is the classic "missing data" sentinel.
    !(lat === 0 && lng === 0)
  );
}

/** Great-circle distance between two points, in metres. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const a = sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Great-circle distance in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineMeters(lat1, lng1, lat2, lng2) / 1000;
}

/** Distance from an origin to any record holding latitude/longitude. */
export function distanceToPointKm(
  origin: { latitude: number; longitude: number },
  target: GeoPoint,
): number | null {
  if (!isValidCoordinate(target.latitude, target.longitude)) return null;
  return haversineKm(origin.latitude, origin.longitude, target.latitude as number, target.longitude as number);
}

/** Short, human distance label — metres under 1 km, else one decimal km. */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Human label for a GPS accuracy radius. */
export function formatAccuracy(meters: number | null | undefined): string {
  if (meters == null || !Number.isFinite(meters)) return "";
  return meters < 1000 ? `±${Math.round(meters)} m` : `±${(meters / 1000).toFixed(1)} km`;
}

/**
 * Cheap bounding-box pre-filter. Skips the trigonometry for records that are
 * obviously out of range — useful when ranking large catalogues on a phone.
 */
export function withinBoundingBox(
  origin: { latitude: number; longitude: number },
  target: GeoPoint,
  radiusKm: number,
): boolean {
  if (!isValidCoordinate(target.latitude, target.longitude)) return false;
  const latDelta = radiusKm / 111.32;
  const cos = Math.cos(toRad(origin.latitude));
  const lngDelta = Math.abs(cos) < 1e-6 ? 180 : radiusKm / (111.32 * Math.abs(cos));
  return (
    Math.abs((target.latitude as number) - origin.latitude) <= latDelta &&
    Math.abs((target.longitude as number) - origin.longitude) <= lngDelta
  );
}
