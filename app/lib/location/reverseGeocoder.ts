import { locationLogger } from "./logger";
import type { StandardLocation } from "./types";

const geocoderLog = locationLogger.child("ReverseGeocoder");

type GoogleGeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name?: string;
      short_name?: string;
      types?: string[];
    }>;
  }>;
};

export type ReverseGeocodeFailureReason =
  | "missing-api-key"
  | "geocoding-disabled"
  | "billing-disabled"
  | "invalid-api-key"
  | "network-error"
  | "zero-results"
  | "request-denied"
  | "unknown";

export class ReverseGeocodeError extends Error {
  readonly reason: ReverseGeocodeFailureReason;
  readonly recoverable: boolean;

  constructor(reason: ReverseGeocodeFailureReason, message: string, recoverable = true) {
    super(message);
    this.name = "ReverseGeocodeError";
    this.reason = reason;
    this.recoverable = recoverable;
  }
}

function readApiKey(): string {
  return process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

function findComponent(
  components: NonNullable<GoogleGeocodeResponse["results"]>[number]["address_components"],
  wantedTypes: string[],
): string | null {
  if (!components?.length) return null;
  for (const wantedType of wantedTypes) {
    const match = components.find((component) => component.types?.includes(wantedType));
    if (match?.long_name?.trim()) return match.long_name.trim();
  }
  return null;
}

function toResolvedLocation(payload: GoogleGeocodeResponse): Pick<StandardLocation, "area" | "city" | "state" | "country" | "formattedAddress"> {
  const primary = payload.results?.[0];
  const components = primary?.address_components ?? [];
  const area = findComponent(components, [
    "sublocality_level_1",
    "sublocality_level_2",
    "sublocality",
    "neighborhood",
    "administrative_area_level_3",
    "route",
  ]);
  const city = findComponent(components, [
    "locality",
    "administrative_area_level_2",
    "postal_town",
  ]);
  const state = findComponent(components, ["administrative_area_level_1"]);
  const country = findComponent(components, ["country"]);
  const formattedAddress = primary?.formatted_address?.trim() ?? null;

  if (!area && !city && !state && !country && !formattedAddress) {
    throw new ReverseGeocodeError("zero-results", "Google Geocoding returned no usable area or city for this coordinate.");
  }

  return { area, city, state, country, formattedAddress };
}

function classifyRequestDenied(message: string): ReverseGeocodeError {
  const lower = message.toLowerCase();
  if (lower.includes("api key") && lower.includes("invalid")) {
    return new ReverseGeocodeError("invalid-api-key", "Google Reverse Geocoding failed: invalid API key.", false);
  }
  if (lower.includes("billing") || lower.includes("payment") || lower.includes("daily limit")) {
    return new ReverseGeocodeError("billing-disabled", "Google Reverse Geocoding failed: billing is disabled or the quota is exhausted.", true);
  }
  if (lower.includes("geocoding api") || lower.includes("not authorized") || lower.includes("api project is not authorized")) {
    return new ReverseGeocodeError("geocoding-disabled", "Google Reverse Geocoding failed: Geocoding API is disabled for this project.", false);
  }
  if (lower.includes("key") && lower.includes("missing")) {
    return new ReverseGeocodeError("missing-api-key", "Google Reverse Geocoding failed: VITE_GOOGLE_MAPS_API_KEY is missing.", false);
  }
  return new ReverseGeocodeError("request-denied", `Google Reverse Geocoding request was denied: ${message}`);
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Pick<StandardLocation, "area" | "city" | "state" | "country" | "formattedAddress">> {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new ReverseGeocodeError("missing-api-key", "Google Reverse Geocoding is unavailable because VITE_GOOGLE_MAPS_API_KEY is missing.", false);
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("latlng", `${latitude},${longitude}`);
  endpoint.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(endpoint.toString(), { method: "GET", signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ReverseGeocodeError("network-error", `Google Reverse Geocoding failed because the network request could not be completed: ${error instanceof Error ? error.message : String(error)}`);
  }

  let payload: GoogleGeocodeResponse;
  try {
    payload = (await response.json()) as GoogleGeocodeResponse;
  } catch {
    throw new ReverseGeocodeError("unknown", "Google Reverse Geocoding returned an unreadable response.");
  }

  if (!response.ok) {
    throw new ReverseGeocodeError("network-error", `Google Reverse Geocoding HTTP ${response.status}: ${payload.error_message ?? response.statusText}`);
  }

  const status = payload.status ?? "UNKNOWN";
  if (status === "OK") return toResolvedLocation(payload);
  if (status === "ZERO_RESULTS") {
    throw new ReverseGeocodeError("zero-results", "Google Reverse Geocoding returned zero results for this coordinate.");
  }
  if (status === "REQUEST_DENIED") {
    throw classifyRequestDenied(payload.error_message ?? "Google rejected the request.");
  }
  if (status === "OVER_DAILY_LIMIT") {
    throw classifyRequestDenied(payload.error_message ?? "Billing is disabled or the reverse geocoding quota has been exhausted.");
  }
  if (status === "INVALID_REQUEST") {
    throw new ReverseGeocodeError("unknown", `Google Reverse Geocoding rejected the request payload: ${payload.error_message ?? "invalid request"}.`);
  }
  if (status === "UNKNOWN_ERROR") {
    throw new ReverseGeocodeError("unknown", `Google Reverse Geocoding returned an unknown error: ${payload.error_message ?? "retry later"}.`);
  }

  geocoderLog.warn("Unhandled Google Reverse Geocoding status.", { status, errorMessage: payload.error_message });
  throw new ReverseGeocodeError("unknown", `Google Reverse Geocoding failed with status ${status}.`);
}
