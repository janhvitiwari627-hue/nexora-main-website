"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import { locationService } from "./locationService";
import { sharedLocationSync } from "./sharedLocationSync";
import type { LocationState } from "./types";

export type UseLocationSyncOptions = {
  client: SupabaseClient | null;
  userId: string | null;
  enabled?: boolean;
};

/** Universal post-auth location binding for every Nexora React app. */
export function useLocationSync({ client, userId, enabled = true }: UseLocationSyncOptions): LocationState {
  useEffect(() => {
    if (!enabled || !client || !userId) {
      sharedLocationSync.unbind(userId);
      return;
    }

    locationService.start();
    sharedLocationSync.bind(client, userId);

    return () => sharedLocationSync.unbind(userId);
  }, [client, enabled, userId]);

  return locationService.getState();
}
