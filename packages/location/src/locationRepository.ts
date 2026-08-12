import type { SupabaseClient } from "@supabase/supabase-js";

import { assertSharedLocationProject } from "./config";
import { isValidCoordinate } from "./distanceCalculator";
import type { GeoFix } from "./types";

/** One private row per global `auth.users.id` in the shared project. */
export type PrivateLocationRow = {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  altitude_m: number | null;
  altitude_accuracy_m: number | null;
  speed_mps: number | null;
  heading_degrees: number | null;
  captured_at: string;
  updated_at: string;
};

const PRIVATE_COLUMNS =
  "user_id,latitude,longitude,accuracy_m,altitude_m,altitude_accuracy_m,speed_mps,heading_degrees,captured_at,updated_at";

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Supabase repository for the private location row.
 *
 * It verifies `auth.getUser()` before every operation and never accepts a
 * target identity from an unverified caller. RLS and the save RPC independently
 * enforce the same auth.uid() boundary in PostgreSQL.
 */
export class LocationRepository {
  constructor(private readonly client: SupabaseClient) {
    assertSharedLocationProject(client);
  }

  private async requireIdentity(expectedUserId: string): Promise<void> {
    const { data, error } = await this.client.auth.getUser();
    if (error) throw error;
    if (!data.user || data.user.id !== expectedUserId) {
      throw new Error("The active Supabase user does not match the location owner.");
    }
  }

  async loadOwn(expectedUserId: string): Promise<GeoFix | null> {
    await this.requireIdentity(expectedUserId);
    const { data, error } = await this.client
      .from("user_private_locations")
      .select(PRIVATE_COLUMNS)
      .eq("user_id", expectedUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const row = data as PrivateLocationRow;
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const accuracy = Number(row.accuracy_m);
    const timestamp = Date.parse(row.captured_at);
    if (
      !isValidCoordinate(latitude, longitude) ||
      !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100 ||
      !Number.isFinite(timestamp)
    ) {
      // Corrupt or legacy data is ignored; it is never replaced with a guess.
      return null;
    }

    return {
      latitude,
      longitude,
      accuracy,
      timestamp,
      altitude: finiteOrNull(row.altitude_m),
      altitudeAccuracy: finiteOrNull(row.altitude_accuracy_m),
      speed: finiteOrNull(row.speed_mps),
      heading: finiteOrNull(row.heading_degrees),
      source: "saved",
      savedAt: Date.parse(row.updated_at) || timestamp,
    };
  }

  async saveOwn(expectedUserId: string, fix: GeoFix): Promise<void> {
    if (fix.source !== "gps") return;
    await this.requireIdentity(expectedUserId);
    const { error } = await this.client.rpc("save_my_private_location", {
      p_latitude: fix.latitude,
      p_longitude: fix.longitude,
      p_accuracy_m: fix.accuracy,
      p_altitude_m: fix.altitude,
      p_altitude_accuracy_m: fix.altitudeAccuracy,
      p_speed_mps: fix.speed,
      p_heading_degrees: fix.heading,
      p_captured_at: new Date(fix.timestamp).toISOString(),
    });
    if (error) throw error;
  }

  async clearOwn(expectedUserId: string): Promise<void> {
    await this.requireIdentity(expectedUserId);
    const { error } = await this.client.rpc("clear_my_private_location");
    if (error) throw error;
  }
}
