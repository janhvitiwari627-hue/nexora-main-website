"use client";

/**
 * React bindings for the location module.
 *
 * `useLocation()` subscribes to the shared LocationService singleton, so any
 * number of components can read the position while exactly one
 * `watchPosition()` listener exists. Unmounting releases the subscription and,
 * when the last consumer goes away, stops the watcher — no leaks.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { locationService } from "./locationService";
import { nearbySalonService, type RankOptions, type RankableSalon } from "./nearbySalonService";
import { MANUAL_AREAS, findManualArea, type ManualArea } from "./manualAreas";
import { MOVEMENT_THRESHOLD_M } from "./locationValidator";
import type { DistanceBucket, GeoFix, LocationState, RankedItem } from "./types";

export type UseLocationOptions = {
  /** Start watching automatically on mount. Default true. */
  auto?: boolean;
};

export type UseLocationResult = LocationState & {
  /** True once a validated fix is available (GPS or manual). */
  hasLocation: boolean;
  /** True while the app is still converging on an acceptable accuracy. */
  isImproving: boolean;
  retry: () => void;
  retryPlaceName: () => void;
  start: () => void;
  setManualArea: (areaId: string) => void;
  clearManualArea: () => void;
  manualAreas: ManualArea[];
};

export function useLocation(options: UseLocationOptions = {}): UseLocationResult {
  const { auto = true } = options;
  const [state, setState] = useState<LocationState>(() => locationService.getState());

  useEffect(() => {
    // `subscribe` is reference-counted: the first mount starts the watch, the
    // last unmount stops it, so StrictMode's double-invoke is harmless and
    // there is never more than one `watchPosition` listener.
    // `observe` only reads state — it never starts the GPS.
    return auto ? locationService.subscribe(setState) : locationService.observe(setState);
  }, [auto]);

  const retry = useCallback(() => locationService.retry(), []);
  const retryPlaceName = useCallback(() => locationService.retryPlaceName(), []);
  const start = useCallback(() => locationService.start(), []);
  const setManualArea = useCallback((areaId: string) => {
    const area = findManualArea(areaId);
    if (!area) return;
    locationService.setManualLocation(area.latitude, area.longitude, area.label);
  }, []);
  const clearManualArea = useCallback(() => locationService.clearManualLocation(), []);

  return {
    ...state,
    hasLocation: state.fix != null,
    isImproving: state.status === "acquiring" || state.status === "improving" || state.status === "prompting",
    retry,
    retryPlaceName,
    start,
    setManualArea,
    clearManualArea,
    manualAreas: MANUAL_AREAS,
  };
}

/**
 * Distance-ranked salons that recompute only when the customer actually moves
 * more than 100 m (or the salon list changes) — no page refresh required and
 * no wasted work on every jittery GPS tick.
 */
export function useNearbySalons<T extends RankableSalon>(
  salons: readonly T[],
  fix: GeoFix | null,
  options: RankOptions = {},
): { ranked: Array<RankedItem<T>>; buckets: Array<DistanceBucket<T>>; origin: GeoFix | null } {
  const { maxDistanceKm, limit, includeUnlocated } = options;
  const originRef = useRef<GeoFix | null>(null);
  const [origin, setOrigin] = useState<GeoFix | null>(null);

  useEffect(() => {
    if (!fix) {
      if (originRef.current !== null) { originRef.current = null; setOrigin(null); }
      return;
    }
    const previous = originRef.current;
    if (!previous) {
      originRef.current = fix;
      setOrigin(fix);
      return;
    }
    // Recalculate on a real move (>100 m) or a source/label change.
    const movedMeters = haversineMetersLocal(previous.latitude, previous.longitude, fix.latitude, fix.longitude);
    if (movedMeters >= MOVEMENT_THRESHOLD_M || previous.source !== fix.source || previous.label !== fix.label) {
      originRef.current = fix;
      setOrigin(fix);
    }
  }, [fix]);

  const rankOptions = useMemo<RankOptions>(
    () => ({ maxDistanceKm, limit, includeUnlocated }),
    [maxDistanceKm, limit, includeUnlocated],
  );

  const ranked = useMemo(
    () => nearbySalonService.rank(salons, origin, rankOptions),
    [salons, origin, rankOptions],
  );
  const buckets = useMemo(
    () => nearbySalonService.group(salons, origin, rankOptions),
    [salons, origin, rankOptions],
  );

  return { ranked, buckets, origin };
}

// Local copy to keep this hook dependency-light on the hot path.
function haversineMetersLocal(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
