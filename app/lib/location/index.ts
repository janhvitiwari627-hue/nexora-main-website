/**
 * Nexora GPS Location System — public entry point.
 *
 * Browser-native `navigator.geolocation.watchPosition()` is still the only
 * source of coordinates. Accepted GPS fixes may then be reverse-geocoded into
 * a readable area/city/state through Google Geocoding using
 * `VITE_GOOGLE_MAPS_API_KEY`.
 *
 * Modules
 *   LocationService     orchestrates the pipeline and owns the global fix
 *   GPSWatcher          the single watchPosition listener
 *   LocationValidator   multi-step accuracy gating
 *   DistanceCalculator  Haversine maths, on-device
 *   NearbySalonService  ranking + Nearby/Close/Around You/Everything Else
 *   PermissionManager   permission read + change observation
 *   Logger              structured GPS debug logging
 */

export * from "./types";
export { Logger, locationLogger } from "./logger";
export {
  EARTH_RADIUS_M,
  distanceToPointKm,
  formatAccuracy,
  formatDistance,
  haversineKm,
  haversineMeters,
  isValidCoordinate,
  withinBoundingBox,
} from "./distanceCalculator";
export {
  ACCURACY_THRESHOLDS,
  FAIR_HOLD_MS,
  LocationValidator,
  MAX_FIX_AGE_MS,
  MOVEMENT_THRESHOLD_M,
  gradeAccuracy,
  locationValidator,
} from "./locationValidator";
export { GPSWatcher, GPS_OPTIONS } from "./gpsWatcher";
export { PermissionManager } from "./permissionManager";
export { LocationService, locationService } from "./locationService";
export {
  BUCKET_DEFINITIONS,
  NearbySalonService,
  bucketFor,
  nearbySalonService,
  weightedRating,
  type RankOptions,
  type RankableSalon,
} from "./nearbySalonService";
export { DEFAULT_ORIGIN, MANUAL_AREAS, findManualArea, type ManualArea } from "./manualAreas";
export { formatLocation, type FormattedLocation } from "./formatLocation";
export { useLocation, useNearbySalons, type UseLocationResult } from "./useLocation";
