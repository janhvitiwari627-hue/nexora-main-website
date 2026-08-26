// ============================================================================
// NEXORA UNIVERSAL LOCATION SYNCHRONIZATION
//
// - Starts only after the user is authenticated.
// - Uses the shared Supabase client so RLS is enforced for every write.
// - Upserts the signed-in user's live browser coordinates into the
//   `user_locations` table (owner-only RLS).
// - Prevents duplicate geolocation watchers across React StrictMode and
//   repeated mounts for the same user.
// - Cleans up the watcher and marks the location inactive on sign-out/unmount.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export type LocationSyncStatus =
  | 'idle'
  | 'unsupported'
  | 'denied'
  | 'error'
  | 'syncing'
  | 'synced'
  | 'stopped';

export interface LocationSyncPayload {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  source: string;
  is_active: boolean;
  captured_at: string;
  updated_at: string;
  last_synced_at: string;
}

export interface UseLocationSyncOptions {
  supabase: SupabaseClient;
  userId: string | null;
  enabled?: boolean;
  minAccuracyMeters?: number;
  highAccuracy?: boolean;
  syncOnMove?: boolean;
}

interface ActiveWatcher {
  watchId: number;
  syncInFlight: boolean;
}

// Module-level registry guards against duplicate watchers for the same user,
// which is important because the authenticated root/provider can mount more than
// once during React StrictMode development.
const activeWatchers = new Map<string, ActiveWatcher>();

export function useLocationSync({
  supabase,
  userId,
  enabled = false,
  minAccuracyMeters = 500,
  highAccuracy = true,
  syncOnMove = true,
}: UseLocationSyncOptions): LocationSyncStatus {
  const [status, setStatus] = useState<LocationSyncStatus>('idle');
  const statusRef = useRef<LocationSyncStatus>('idle');
  const watcherRef = useRef<ActiveWatcher | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const startedRef = useRef(false);

  const setSyncStatus = (next: LocationSyncStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const syncPosition = async (position: GeolocationPosition) => {
    if (!userId || !supabase) return;
    const source = 'browser_geolocation';
    const now = new Date().toISOString();

    // Avoid hammering the database with sub-meter jitter. Only write when the
    // user moved a meaningful distance or the first position arrives.
    const previous = lastPositionRef.current;
    if (previous && syncOnMove) {
      const movedMeters = Math.sqrt(
        Math.pow((position.coords.latitude - previous.lat) * 111_320, 2) +
        Math.pow((position.coords.longitude - previous.lng) * 111_320 * Math.cos((position.coords.latitude * Math.PI) / 180), 2),
      );
      if (movedMeters < 25) {
        setSyncStatus('synced');
        return;
      }
    }

    lastPositionRef.current = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    const payload: LocationSyncPayload = {
      user_id: userId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      altitude: position.coords.altitude ?? null,
      speed: position.coords.speed ?? null,
      heading: position.coords.heading ?? null,
      source,
      is_active: true,
      captured_at: new Date(position.timestamp).toISOString(),
      updated_at: now,
      last_synced_at: now,
    };

    const watcher = watcherRef.current;
    if (watcher && watcher.syncInFlight) {
      setSyncStatus('syncing');
      return;
    }
    if (watcher) {
      watcher.syncInFlight = true;
    }

    // RLS: the authenticated user may only write their own row.
    // On conflict the latest coordinates are updated (single row per user).
    const { error } = await supabase
      .from('user_locations')
      .upsert(payload, { onConflict: 'user_id' });

    if (watcher) {
      watcher.syncInFlight = false;
    }

    if (error) {
      console.error('[NexoraLocationSync] Failed to sync location with Supabase:', error);
      setSyncStatus('error');
      return;
    }

    setSyncStatus('synced');
  };

  const handleError = (err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setSyncStatus('denied');
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setSyncStatus('error');
    } else {
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    // Reset the started flag whenever the user changes so a new authenticated
    // user can start a fresh watcher after sign-out/sign-in.
    startedRef.current = false;
    lastPositionRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      // No watcher should exist for an unauthenticated state.
      if (watcherRef.current) {
        clearWatch(watcherRef.current.watchId);
        watcherRef.current = null;
        if (userId) {
          activeWatchers.delete(userId);
        }
      }
      startedRef.current = false;
      setSyncStatus('stopped');
      return;
    }

    if (!('geolocation' in navigator)) {
      setSyncStatus('unsupported');
      return;
    }

    // Prevent duplicate watchers for this authenticated user. If another mount
    // already owns the watcher, do not take a reference to it (so this mount
    // cannot accidentally clear the active watcher during its own cleanup).
    if (activeWatchers.has(userId)) {
      setSyncStatus('syncing');
      return;
    }

    // A user may be "enabled" while the watcher setup is deferred; guard against
    // starting two watchers in the same render cycle.
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy > minAccuracyMeters) {
          setSyncStatus('syncing');
          return;
        }
        setSyncStatus('syncing');
        void syncPosition(position);
      },
      handleError,
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 15_000,
        timeout: 20_000,
      },
    );

    const watcher = { watchId, syncInFlight: false };
    watcherRef.current = watcher;
    activeWatchers.set(userId, watcher);

    // Initial passive update so a cached location is captured without waiting
    // for movement.
    const initialSync = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            maximumAge: 15_000,
            timeout: 15_000,
          });
        });
        if (position.coords.accuracy > minAccuracyMeters) return;
        await syncPosition(position);
      } catch {
        // The watch callback will continue retrying; ignore transient errors.
      }
    };
    void initialSync();

    return () => {
      clearWatch(watchId);
      activeWatchers.delete(userId);
      startedRef.current = false;
      if (watcherRef.current?.watchId === watchId) {
        watcherRef.current = null;
      }

      // Mark the location inactive only when it belongs to this user. RLS keeps
      // this write scoped to the owner.
      if (userId) {
        void supabase
          .from('user_locations')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }

      setSyncStatus('stopped');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, minAccuracyMeters, highAccuracy, syncOnMove]);

  return statusRef.current;
}

function clearWatch(watchId: number) {
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
}
