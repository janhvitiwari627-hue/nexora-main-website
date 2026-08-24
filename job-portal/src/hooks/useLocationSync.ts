/**
 * PHASE 5 — LOCATION SYNCHRONIZATION (Job Portal Sub-App).
 *
 * Binds the canonical Nexora private-location architecture
 * (`@nexora/location`, ../../../packages/location/src) to the Phase 3
 * AuthProvider:
 *
 *   SIGNED_IN
 *      ↓
 *   request browser geolocation (once per sign-in)
 *      ↓
 *   navigator.geolocation.watchPosition()   — the ONLY tracking primitive,
 *      ↓                                      owned by the shared GPSWatcher
 *   LocationValidator (accuracy/plausibility gates)
 *      ↓
 *   save the authenticated user's location via save_my_private_location()
 *
 * Guarantees inherited from the canonical architecture:
 *   * a location is never fabricated — no IP-derived point, no city-centre
 *     fallback; when permission is denied there is simply no fix;
 *   * `getCurrentPosition()` is never used and cached coordinates are never
 *     reused (`maximumAge: 0`);
 *   * the browser never chooses a target user: LocationRepository re-verifies
 *     `auth.getUser()` before every read/write, and the RPC derives the row
 *     owner from `auth.uid()` inside PostgreSQL, double-checked by RLS.
 */

import { useEffect, useRef } from 'react';
import {
  locationService,
  useLocation,
  type UseLocationResult,
} from '../../../packages/location/src';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export type { UseLocationResult };

export function useLocationSync(): UseLocationResult {
  // The authenticated identity comes ONLY from the current Supabase session
  // (AuthProvider ← supabase.auth). No caller-supplied user_id exists here.
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const location = useLocation({
    // The GPS watcher is armed only for a signed-in user; anonymous visitors
    // are never prompted and nothing is persisted for them.
    auto: Boolean(userId),
    client: supabase,
    userId,
    syncPrivateLocation: true,
  });

  // SIGNED_IN → (re-)request browser geolocation exactly once per sign-in.
  // A fresh account has never been asked; a returning user may have granted
  // permission in OS settings since the last visit. If permission is refused
  // nothing breaks: the service reports "denied" and only this user's saved
  // real GPS fix (if any) is shown — never a substitute coordinate.
  const armedForUser = useRef<string | null>(null);
  useEffect(() => {
    if (!userId) {
      armedForUser.current = null;
      return;
    }
    if (armedForUser.current === userId) return;
    armedForUser.current = userId;
    // Deferred so it never runs inside the auth state commit.
    const timer = window.setTimeout(() => {
      // Already have a good fix? Keep it rather than restarting the radio.
      if (locationService.getFix()) {
        locationService.start();
        return;
      }
      locationService.retry();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);

  return location;
}
