"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { locationService } from "./locationService";
import { nearbySalonService, type RankOptions, type RankableSalon } from "./nearbySalonService";
import { sharedLocationSync } from "./sharedLocationSync";
import { MOVEMENT_THRESHOLD_M } from "./locationValidator";
import type { DistanceBucket, GeoFix, LocationState, RankedItem } from "./types";

export type UseLocationOptions = {
  /** Start the singleton navigator.geolocation watcher. Default true. */
  auto?: boolean;
  /**
   * Enable central persistence for the shell that owns auth. Nested route
   * consumers omit these values and simply observe the same singleton.
   */
  client?: SupabaseClient | null;
  userId?: string | null;
  syncPrivateLocation?: boolean;
};

export type UseLocationResult = LocationState & {
  hasLocation: boolean;
  isImproving: boolean;
  retry: () => void;
  start: () => void;
};

/**
 * Shared React binding used by Owner, Partner, Customer and Template routes.
 * Exactly one watchPosition listener and one auth.uid()-scoped persistence
 * coordinator exist for the browser process.
 */
export function useLocation(options: UseLocationOptions = {}): UseLocationResult {
  const {
    auto = true,
    client = null,
    userId = null,
    syncPrivateLocation = false,
  } = options;
  const [state, setState] = useState<LocationState>(() => locationService.getState());

  useEffect(() => {
    return auto ? locationService.subscribe(setState) : locationService.observe(setState);
  }, [auto]);

  useEffect(() => {
    if (!syncPrivateLocation) return;
    sharedLocationSync.bind(client, userId);
    return () => sharedLocationSync.unbind(userId);
  }, [client, syncPrivateLocation, userId]);

  const retry = useCallback(() => locationService.retry(), []);
  const start = useCallback(() => locationService.start(), []);

  return {
    ...state,
    hasLocation: state.fix != null,
    isImproving:
      state.status === "acquiring" ||
      state.status === "improving" ||
      state.status === "prompting",
    retry,
    start,
  };
}

/**
 * Distance-ranked approved businesses. A record without approved coordinates
 * produces no distance; a private user fix is never sent to a business row.
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
      if (originRef.current !== null) {
        originRef.current = null;
        setOrigin(null);
      }
      return;
    }
    const previous = originRef.current;
    if (!previous) {
      originRef.current = fix;
      setOrigin(fix);
      return;
    }
    const movedMeters = haversineMetersLocal(
      previous.latitude,
      previous.longitude,
      fix.latitude,
      fix.longitude,
    );
    if (movedMeters >= MOVEMENT_THRESHOLD_M || previous.source !== fix.source) {
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

function haversineMetersLocal(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radius = 6_371_008.8;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(a)));
}
