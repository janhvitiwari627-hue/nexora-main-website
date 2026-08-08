/**
 * Manual location fallback options.
 *
 * This file must never hardcode a city or silently default the customer to a
 * specific place. When no reusable manual options are configured, the app keeps
 * the list empty and lets the UI report "Detecting location..." or
 * "Location unavailable".
 */

export type ManualArea = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export const MANUAL_AREAS: ManualArea[] = [];

export const DEFAULT_ORIGIN: ManualArea | null = null;

export function findManualArea(id: string): ManualArea | undefined {
  return MANUAL_AREAS.find((area) => area.id === id);
}
