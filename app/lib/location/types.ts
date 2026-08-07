/**
 * Nexora GPS Location System — shared types.
 *
 * The whole module depends on the browser's native Geolocation API only.
 * No Google Geolocation / Maps Geocoding, no Mapbox, no Nominatim, no
 * reverse-geocoding service, no API key of any kind is used anywhere.
 */

/** A validated, accepted GPS fix stored by the LocationService. */
export type GeoFix = {
  latitude: number;
  longitude: number;
  /** Radius of 68% confidence in metres, straight from the device. */
  accuracy: number;
  /** Epoch milliseconds of the reading (position.timestamp). */
  timestamp: number;
  /** Metres above the WGS-84 ellipsoid, when the device reports it. */
  altitude: number | null;
  altitudeAccuracy: number | null;
  /** Metres/second, when the device reports it. */
  speed: number | null;
  /** Degrees clockwise from true north, when the device reports it. */
  heading: number | null;
  /** How the fix was obtained. */
  source: "gps" | "manual";
  /** Human label — only set for manual selections (never reverse-geocoded). */
  label?: string;
};

/** Quality tiers derived from `position.coords.accuracy`. */
export type AccuracyGrade = "excellent" | "good" | "fair" | "poor" | "unusable";

export type ValidationDecision = {
  grade: AccuracyGrade;
  /** Accept right now. */
  accept: boolean;
  /** Hold as a candidate; accept it if nothing better arrives in `holdMs`. */
  hold: boolean;
  /** Discard entirely — never used for distance maths. */
  reject: boolean;
  holdMs: number;
  reason: string;
};

/** Lifecycle of the location subsystem, surfaced to the UI. */
export type LocationStatus =
  | "idle"
  | "unsupported"
  | "prompting"
  | "acquiring"
  | "improving"
  | "ready"
  | "denied"
  | "unavailable"
  | "timeout"
  | "offline"
  | "manual"
  | "error";

export type LocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "OFFLINE"
  | "WEAK_SIGNAL"
  | "GPS_DISABLED"
  | "UNSUPPORTED"
  | "UNKNOWN";

export type LocationError = {
  code: LocationErrorCode;
  /** Message safe to render directly to a customer. */
  message: string;
  /** Whether calling `retry()` can plausibly fix it. */
  recoverable: boolean;
};

export type PermissionStatusValue = "granted" | "denied" | "prompt" | "unknown";

/** Complete snapshot handed to every subscriber on each change. */
export type LocationState = {
  status: LocationStatus;
  fix: GeoFix | null;
  /** Best reading seen so far, even if not yet accepted. */
  candidateAccuracy: number | null;
  permission: PermissionStatusValue;
  error: LocationError | null;
  /** Number of raw positions delivered by the browser this session. */
  updateCount: number;
  /** Number of readings accepted by the validator. */
  acceptedCount: number;
  /** Metres moved since the previously accepted fix. */
  lastMovementMeters: number | null;
  /** True while the watcher is running. */
  watching: boolean;
  /** User-facing progress line, e.g. "Improving your location...". */
  message: string;
};

export type LocationListener = (state: LocationState) => void;

/** Any record that can be ranked by distance. */
export type GeoPoint = { latitude: number | null | undefined; longitude: number | null | undefined };

export type DistanceBucketKey = "nearby" | "close" | "around" | "elsewhere";

export type RankedItem<T> = T & {
  /** Straight-line distance in kilometres (Haversine, computed on-device). */
  distanceKm: number | null;
  bucket: DistanceBucketKey;
};

export type DistanceBucket<T> = {
  key: DistanceBucketKey;
  title: string;
  subtitle: string;
  items: Array<RankedItem<T>>;
};
