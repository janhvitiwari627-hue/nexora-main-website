/**
 * Canonical Nexora location types shared by the Owner, Partner, Customer and
 * Template apps.
 *
 * Private device GPS and public business coordinates are deliberately different
 * domains. A GeoFix is always a real device reading: either live from
 * navigator.geolocation or a previously saved reading for the same auth user.
 * Area centroids, IP guesses and fabricated fallback coordinates are forbidden.
 */

/** A validated device GPS fix held by the shared LocationService. */
export type GeoFix = {
  latitude: number;
  longitude: number;
  /** Radius of 68% confidence in metres, straight from the device. */
  accuracy: number;
  /** Epoch milliseconds of the original device reading. */
  timestamp: number;
  /** Metres above the WGS-84 ellipsoid, when the device reports it. */
  altitude: number | null;
  altitudeAccuracy: number | null;
  /** Metres/second, when the device reports it. */
  speed: number | null;
  /** Degrees clockwise from true north, when the device reports it. */
  heading: number | null;
  /** `saved` is a previous real GPS reading, never a generated coordinate. */
  source: "gps" | "saved";
  /** When this fix was written to the central private-location row. */
  savedAt?: number;
};

export type LocationFreshness = "live" | "saved" | "stale";

/** Quality tiers derived from `position.coords.accuracy`. */
export type AccuracyGrade = "excellent" | "good" | "fair" | "poor" | "unusable";

export type ValidationDecision = {
  grade: AccuracyGrade;
  accept: boolean;
  hold: boolean;
  reject: boolean;
  holdMs: number;
  reason: string;
};

/** Lifecycle surfaced to every Nexora route. */
export type LocationStatus =
  | "idle"
  | "unsupported"
  | "prompting"
  | "acquiring"
  | "improving"
  | "ready"
  | "saved"
  | "denied"
  | "unavailable"
  | "timeout"
  | "offline"
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
  message: string;
  recoverable: boolean;
};

export type PermissionStatusValue = "granted" | "denied" | "prompt" | "unknown";
export type LocationSyncStatus = "disconnected" | "loading" | "synced" | "saving" | "error";

/** Complete state handed to subscribers. */
export type LocationState = {
  status: LocationStatus;
  fix: GeoFix | null;
  candidateAccuracy: number | null;
  permission: PermissionStatusValue;
  error: LocationError | null;
  updateCount: number;
  acceptedCount: number;
  lastMovementMeters: number | null;
  watching: boolean;
  message: string;
  /** State of private, auth.uid()-scoped Supabase persistence. */
  syncStatus: LocationSyncStatus;
};

export type LocationListener = (state: LocationState) => void;

/** A public business record that may be ranked only after approval. */
export type GeoPoint = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  /** Business-coordinate approval marker returned by the public table/RPC. */
  approval_status?: "approved" | string | null;
};

export type DistanceBucketKey = "nearby" | "close" | "around" | "elsewhere";

export type RankedItem<T> = T & {
  distanceKm: number | null;
  bucket: DistanceBucketKey;
};

export type DistanceBucket<T> = {
  key: DistanceBucketKey;
  title: string;
  subtitle: string;
  items: Array<RankedItem<T>>;
};
