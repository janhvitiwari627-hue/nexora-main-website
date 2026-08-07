/**
 * Nexora GPS Location System — public entry point.
 *
 * Browser-native `navigator.geolocation.watchPosition()` only. No Google
 * Geolocation API, no Google Maps Geocoding, no reverse geocoding, no Mapbox,
 * no OpenStreetMap/Nominatim, no paid location provider and no API keys.
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
export { useLocation, useNearbySalons, type UseLocationResult } from "./useLocation";
