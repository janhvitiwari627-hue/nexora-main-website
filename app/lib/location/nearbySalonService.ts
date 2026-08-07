/**
 * NearbySalonService — ranks and groups salons around the customer.
 *
 * Everything runs on the device: the Haversine distance, the sort and the
 * bucketing. No Distance Matrix, no geocoding, no server round-trip needed
 * once the salon list is loaded.
 *
 * Sort order (in priority order, as specified):
 *   1. Nearest distance   (bucketed so tiny GPS jitter cannot reshuffle cards)
 *   2. Highest rating     (Bayesian-ish: rating weighted by review volume)
 *   3. Featured status
 *   4. Recently active
 */

import { distanceToPointKm, isValidCoordinate } from "./distanceCalculator";
import type { DistanceBucket, DistanceBucketKey, GeoPoint, RankedItem } from "./types";

/** Minimum fields a salon-like record must expose to be ranked. */
export type RankableSalon = GeoPoint & {
  id?: string | number;
  rating?: number | null;
  ratingAverage?: number | null;
  rating_average?: number | null;
  rating_avg?: number | null;
  reviewCount?: number | null;
  review_count?: number | null;
  featured?: boolean | null;
  is_featured?: boolean | null;
  sponsored?: boolean | null;
  lastActiveAt?: string | number | null;
  last_active_at?: string | number | null;
  updated_at?: string | number | null;
  published_at?: string | number | null;
};

export const BUCKET_DEFINITIONS: Array<{ key: DistanceBucketKey; title: string; subtitle: string; maxKm: number }> = [
  { key: "nearby", title: "Nearby", subtitle: "Within 2 km of you", maxKm: 2 },
  { key: "close", title: "Close", subtitle: "2–5 km away", maxKm: 5 },
  { key: "around", title: "Around You", subtitle: "5–10 km away", maxKm: 10 },
  { key: "elsewhere", title: "Everything Else", subtitle: "More than 10 km away", maxKm: Infinity },
];

export function bucketFor(distanceKm: number | null): DistanceBucketKey {
  if (distanceKm == null) return "elsewhere";
  if (distanceKm <= 2) return "nearby";
  if (distanceKm <= 5) return "close";
  if (distanceKm <= 10) return "around";
  return "elsewhere";
}

const num = (...values: Array<unknown>): number => {
  for (const value of values) {
    const parsed = typeof value === "string" ? Number(value) : value;
    if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const bool = (...values: Array<unknown>): boolean => values.some((value) => value === true);

const time = (...values: Array<unknown>): number => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

function ratingOf(salon: RankableSalon): number {
  return num(salon.rating, salon.ratingAverage, salon.rating_average, salon.rating_avg);
}

function reviewsOf(salon: RankableSalon): number {
  return num(salon.reviewCount, salon.review_count);
}

/**
 * Rating smoothed by review volume so a single 5★ review does not outrank a
 * well-reviewed 4.6★ salon. C = 3.8 prior, m = 5 reviews of weight.
 */
export function weightedRating(salon: RankableSalon): number {
  const r = ratingOf(salon);
  const v = reviewsOf(salon);
  const m = 5;
  const c = 3.8;
  if (v <= 0) return c;
  return (v / (v + m)) * r + (m / (v + m)) * c;
}

function featuredOf(salon: RankableSalon): boolean {
  return bool(salon.featured, salon.is_featured, salon.sponsored);
}

function lastActiveOf(salon: RankableSalon): number {
  return time(salon.lastActiveAt, salon.last_active_at, salon.updated_at, salon.published_at);
}

/**
 * Distance is compared in coarse steps so a ±20 m GPS wobble cannot reorder
 * the list on every update: under 1 km we step by 100 m, then by 250 m.
 */
function distanceRank(distanceKm: number | null): number {
  if (distanceKm == null) return Number.MAX_SAFE_INTEGER;
  const step = distanceKm < 1 ? 0.1 : 0.25;
  return Math.round(distanceKm / step);
}

export type RankOptions = {
  /** Drop anything beyond this radius (km). */
  maxDistanceKm?: number;
  /** Cap the result length. */
  limit?: number;
  /** Keep salons without coordinates (appended last). Default false. */
  includeUnlocated?: boolean;
};

export class NearbySalonService {
  /** Attach a locally computed distance to every salon. */
  withDistance<T extends RankableSalon>(
    salons: readonly T[],
    origin: { latitude: number; longitude: number } | null,
  ): Array<RankedItem<T>> {
    return salons.map((salon) => {
      const distanceKm = origin ? distanceToPointKm(origin, salon) : null;
      return { ...salon, distanceKm, bucket: bucketFor(distanceKm) } as RankedItem<T>;
    });
  }

  /**
   * Full ranking: nearest → highest rating → featured → recently active.
   * Falls back to rating/featured/recency ordering when there is no fix yet.
   */
  rank<T extends RankableSalon>(
    salons: readonly T[],
    origin: { latitude: number; longitude: number } | null,
    options: RankOptions = {},
  ): Array<RankedItem<T>> {
    const { maxDistanceKm, limit, includeUnlocated = false } = options;
    let rows = this.withDistance(salons, origin);

    if (origin && !includeUnlocated) {
      rows = rows.filter((row) => isValidCoordinate(row.latitude, row.longitude));
    }
    if (origin && typeof maxDistanceKm === "number") {
      rows = rows.filter((row) => row.distanceKm != null && row.distanceKm <= maxDistanceKm);
    }

    rows.sort((a, b) => {
      // 1. Nearest distance (jitter-tolerant buckets).
      const byDistance = distanceRank(a.distanceKm) - distanceRank(b.distanceKm);
      if (byDistance !== 0) return byDistance;
      // 2. Highest rating.
      const byRating = weightedRating(b) - weightedRating(a);
      if (Math.abs(byRating) > 0.005) return byRating;
      // 3. Featured status.
      const byFeatured = Number(featuredOf(b)) - Number(featuredOf(a));
      if (byFeatured !== 0) return byFeatured;
      // 4. Recently active.
      const byActivity = lastActiveOf(b) - lastActiveOf(a);
      if (byActivity !== 0) return byActivity;
      // Deterministic tiebreak so refreshes never reshuffle equal rows.
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });

    return typeof limit === "number" ? rows.slice(0, limit) : rows;
  }

  /**
   * Ranked salons grouped into the display sections:
   * Nearby (0–2 km), Close (2–5 km), Around You (5–10 km), Everything Else.
   */
  group<T extends RankableSalon>(
    salons: readonly T[],
    origin: { latitude: number; longitude: number } | null,
    options: RankOptions = {},
  ): Array<DistanceBucket<T>> {
    const ranked = this.rank(salons, origin, { includeUnlocated: true, ...options });
    return BUCKET_DEFINITIONS.map((definition) => ({
      key: definition.key,
      title: definition.title,
      subtitle: definition.subtitle,
      items: ranked.filter((row) => row.bucket === definition.key),
    })).filter((bucket) => bucket.items.length > 0);
  }
}

export const nearbySalonService = new NearbySalonService();
