import type { SupabaseClient } from "@supabase/supabase-js";

import { locationLogger } from "./logger";
import { LocationRepository } from "./locationRepository";
import { locationService } from "./locationService";
import type { GeoFix } from "./types";

/**
 * Connects the one browser GPS watcher to the one auth.uid()-scoped Supabase
 * row. All Nexora route surfaces use this coordinator; role never participates
 * in identity or authorization.
 */
export class SharedLocationSync {
  private readonly log = locationLogger.child("Sync");
  private generation = 0;
  private activeUserId: string | null = null;
  private stopObserving: (() => void) | null = null;
  private lastSavedTimestamp = 0;
  private saveChain: Promise<void> = Promise.resolve();

  bind(client: SupabaseClient | null, userId: string | null): void {
    const generation = ++this.generation;
    const previousUserId = this.activeUserId;
    this.stopObserving?.();
    this.stopObserving = null;

    if (!client || !userId) {
      this.activeUserId = null;
      this.lastSavedTimestamp = 0;
      if (previousUserId) locationService.clearIdentityLocation();
      else locationService.dropSavedFallback();
      locationService.setSyncStatus("disconnected");
      return;
    }

    if (previousUserId && previousUserId !== userId) locationService.clearIdentityLocation();
    this.activeUserId = userId;
    this.lastSavedTimestamp = 0;
    const repository = new LocationRepository(client);
    locationService.setSyncStatus("loading");

    // Observe before loading so a live fix that lands during the database read
    // is queued for persistence rather than lost. Also inspect the current
    // singleton state: a visitor can grant GPS before signing in, and that
    // genuine current reading must become this authenticated user's central
    // location without waiting for 100 m of movement.
    const persistFreshGps = (state: ReturnType<typeof locationService.getState>) => {
      const fix = state.fix;
      if (!fix || fix.source !== "gps" || fix.timestamp <= this.lastSavedTimestamp) return;
      this.queueSave(repository, userId, fix, generation);
    };
    this.stopObserving = locationService.observe(persistFreshGps);
    persistFreshGps(locationService.getState());

    void repository
      .loadOwn(userId)
      .then((saved) => {
        if (!this.isCurrent(generation, userId)) return;
        if (saved) {
          this.lastSavedTimestamp = Math.max(this.lastSavedTimestamp, saved.timestamp);
          locationService.restoreSavedLocation(saved);
        }
        locationService.setSyncStatus("synced");
      })
      .catch((cause) => {
        if (!this.isCurrent(generation, userId)) return;
        // Location acquisition keeps working if persistence is temporarily
        // unavailable; no fake fallback is introduced.
        this.log.warn("Could not load the private saved location.", cause);
        locationService.setSyncStatus("error");
      });
  }

  unbind(userId: string | null): void {
    if (userId && this.activeUserId !== userId) return;
    this.bind(null, null);
  }

  private queueSave(
    repository: LocationRepository,
    userId: string,
    fix: GeoFix,
    generation: number,
  ) {
    // Claim this timestamp immediately so multiple state notifications cannot
    // enqueue duplicate writes. Writes remain ordered per identity.
    this.lastSavedTimestamp = fix.timestamp;
    locationService.setSyncStatus("saving");
    this.saveChain = this.saveChain
      .catch(() => undefined)
      .then(async () => {
        if (!this.isCurrent(generation, userId)) return;
        await repository.saveOwn(userId, fix);
        if (this.isCurrent(generation, userId)) locationService.setSyncStatus("synced");
      })
      .catch((cause) => {
        if (!this.isCurrent(generation, userId)) return;
        this.log.warn("Could not save the fresh GPS reading.", cause);
        locationService.setSyncStatus("error");
      });
  }

  private isCurrent(generation: number, userId: string): boolean {
    return this.generation === generation && this.activeUserId === userId;
  }
}

export const sharedLocationSync = new SharedLocationSync();
