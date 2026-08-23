/**
 * @nexora/location — one shared location system for the Owner, Partner,
 * Customer and Template apps.
 */
export * from "./types";
export { LOCATION_SUPABASE_PROJECT_REF, LOCATION_SUPABASE_URL, assertSharedLocationProject } from "./config";
export { Logger, locationLogger } from "./logger";
export { EARTH_RADIUS_M, distanceToPointKm, formatAccuracy, formatDistance, haversineKm, haversineMeters, isValidCoordinate, withinBoundingBox } from "./distanceCalculator";
export { ACCURACY_THRESHOLDS, FAIR_HOLD_MS, LIVE_FIX_MAX_AGE_MS, MAX_FIX_AGE_MS, MOVEMENT_THRESHOLD_M, LocationValidator, gradeAccuracy, isFreshGpsFix, locationFreshness, locationValidator } from "./locationValidator";
export { GPS_OPTIONS, GPSWatcher, type GPSWatcherCallbacks } from "./gpsWatcher";
export { PermissionManager } from "./permissionManager";
export { LocationService, locationService } from "./locationService";
export { LocationRepository, type PrivateLocationRow } from "./locationRepository";
export { SharedLocationSync, sharedLocationSync } from "./sharedLocationSync";
export { BUCKET_DEFINITIONS, NearbySalonService, bucketFor, nearbySalonService, weightedRating, type RankableSalon, type RankOptions } from "./nearbySalonService";
export { useLocation, useNearbySalons, type UseLocationOptions, type UseLocationResult } from "./useLocation";
export { useLocationSync, type UseLocationSyncOptions } from "./useLocationSync";
