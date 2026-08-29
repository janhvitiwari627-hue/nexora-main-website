/**
 * Strict typing for the salon public-website JSON payload.
 * ============================================================================
 *
 * `salon_public_websites.config` is the JSON document an owner publishes
 * through the salon setup proposal flow: the proposal payload
 * (`salon_setup_proposals.payload`) is copied into the public website row by
 * the `publish_salon_setup` / `review_salon_setup` RPC when the owner approves
 * it. It reaches the browser as untyped JSON, so every read must go through
 * this module.
 *
 * CONTRACT
 * --------
 *  - Exactly one strict shape for the payload (`WebsiteConfig`). No callsite
 *    re-declares the structure with its own `as { … }` cast.
 *  - Every field is runtime-narrowed from `unknown`. A value that does not
 *    match the published contract narrows to `null` / an empty list — never to
 *    a guessed alternative key and never to an invented value.
 *  - `opens` is required for opening hours (an empty string counts as
 *    missing, matching the previous truthiness check); `closes` is optional.
 */

/** Clock string ("HH:mm") as published by the proposal flow. */
export type WebsiteConfigOpeningHours = {
  opens: string;
  closes: string | null;
};

/** Owner-published profile block. */
export type WebsiteConfigProfile = {
  description: string | null;
  opening_hours: WebsiteConfigOpeningHours | null;
};

/** One proposal-published service row (DB rows remain the source of truth). */
export type WebsiteConfigService = {
  id: string | null;
  name: string | null;
  description: string | null;
  duration_minutes: number | null;
  price_paise: number | null;
};

/** One proposal-published staff row. */
export type WebsiteConfigStaffMember = {
  id: string | null;
  name: string | null;
  role: string | null;
  specialty: string | null;
};

/** The complete public-website config payload. */
export type WebsiteConfig = {
  profile: WebsiteConfigProfile | null;
  services: WebsiteConfigService[];
  staff: WebsiteConfigStaffMember[];
  /** Gallery photos — only absolute http(s) URL strings survive narrowing. */
  photos: string[];
  /** Amenity labels — only non-empty strings survive narrowing. */
  amenities: string[];
};

const EMPTY_WEBSITE_CONFIG: WebsiteConfig = {
  profile: null,
  services: [],
  staff: [],
  photos: [],
  amenities: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Narrow the profile.opening_hours block; null unless `opens` is usable. */
function narrowOpeningHours(profile: Record<string, unknown>): WebsiteConfigOpeningHours | null {
  const hours = profile.opening_hours;
  if (!isRecord(hours)) return null;
  const opens = readString(hours.opens);
  if (opens == null || opens === "") return null;
  return { opens, closes: readString(hours.closes) };
}

/**
 * Strictly-narrowed opening hours from a raw website config payload.
 * Kept as its own export because hours are also the Section 06/07 fallback
 * contract — callers never need the full payload for this.
 */
export function readWebsiteConfigOpeningHours(raw: unknown): WebsiteConfigOpeningHours | null {
  if (!isRecord(raw)) return null;
  const profile = raw.profile;
  if (!isRecord(profile)) return null;
  return narrowOpeningHours(profile);
}

function narrowServices(value: unknown): WebsiteConfigService[] {
  if (!Array.isArray(value)) return [];
  const rows: WebsiteConfigService[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    rows.push({
      id: readString(entry.id),
      name: readString(entry.name),
      description: readString(entry.description),
      duration_minutes: readFiniteNumber(entry.duration_minutes),
      price_paise: readFiniteNumber(entry.price_paise),
    });
  }
  return rows;
}

function narrowStaff(value: unknown): WebsiteConfigStaffMember[] {
  if (!Array.isArray(value)) return [];
  const rows: WebsiteConfigStaffMember[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    rows.push({
      id: readString(entry.id),
      name: readString(entry.name),
      role: readString(entry.role),
      specialty: readString(entry.specialty),
    });
  }
  return rows;
}

function narrowHttpUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.startsWith("http"));
}

function narrowAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
}

/**
 * Narrow any raw website config JSON (untyped `Json` from Postgres included)
 * into the strict `WebsiteConfig` shape. Anything absent or off-contract
 * degrades to `null` / `[]` — callers render their honest empty states.
 */
export function readWebsiteConfig(raw: unknown): WebsiteConfig {
  if (!isRecord(raw)) return EMPTY_WEBSITE_CONFIG;
  const profileValue = raw.profile;
  const profile: WebsiteConfigProfile | null = isRecord(profileValue)
    ? {
        description: readString(profileValue.description),
        opening_hours: narrowOpeningHours(profileValue),
      }
    : null;
  return {
    profile,
    services: narrowServices(raw.services),
    staff: narrowStaff(raw.staff),
    photos: narrowHttpUrls(raw.photos),
    amenities: narrowAmenities(raw.amenities),
  };
}
