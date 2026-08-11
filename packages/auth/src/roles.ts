/**
 * Nexora — canonical platform roles.
 *
 * `public.profiles.platform_role` is the ONLY role authority. A URL, a
 * localStorage flag, or a client-supplied form field must never promote an
 * authenticated user; the database trigger `guard_profile_platform_role()`
 * enforces that server-side.
 *
 * Canonical values (must match the `profiles_platform_role_check` constraint):
 *
 *   customer         — end user booking services            (alias: "user")
 *   business_user    — salon / shop owner                   (alias: "shop_owner")
 *   growth_partner   — onboarding & growth partner
 *   delivery_partner — delivery / field partner
 *   admin            — platform staff (never self-service signup)
 *
 * The alias layer exists because product docs and the newer PWAs speak in
 * terms of `user` / `shop_owner`. Aliases are normalized at the edge; only
 * canonical values are ever written to the database.
 */

export const PLATFORM_ROLES = [
  "customer",
  "business_user",
  "growth_partner",
  "delivery_partner",
  "admin",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles a visitor may create for themselves through public signup. */
export const SELF_SERVICE_SIGNUP_ROLES = [
  "customer",
  "business_user",
  "growth_partner",
  "delivery_partner",
] as const;

export type SignupRole = (typeof SELF_SERVICE_SIGNUP_ROLES)[number];

/**
 * Every accepted spelling → canonical value. Keep in sync with the SQL
 * function `private.normalize_platform_role()`.
 */
const ROLE_ALIASES: Record<string, PlatformRole> = {
  // customer
  customer: "customer",
  user: "customer",
  client: "customer",
  consumer: "customer",
  // shop owner
  business_user: "business_user",
  "business-user": "business_user",
  shop_owner: "business_user",
  "shop-owner": "business_user",
  shopowner: "business_user",
  owner: "business_user",
  business_owner: "business_user",
  merchant: "business_user",
  vendor: "business_user",
  // growth partner
  growth_partner: "growth_partner",
  "growth-partner": "growth_partner",
  growthpartner: "growth_partner",
  partner: "growth_partner",
  // delivery partner
  delivery_partner: "delivery_partner",
  "delivery-partner": "delivery_partner",
  deliverypartner: "delivery_partner",
  delivery: "delivery_partner",
  rider: "delivery_partner",
  courier: "delivery_partner",
  // admin
  admin: "admin",
  administrator: "admin",
  staff: "admin",
};

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === "string" && (PLATFORM_ROLES as readonly string[]).includes(value);
}

export function isSignupRole(value: unknown): value is SignupRole {
  return typeof value === "string" && (SELF_SERVICE_SIGNUP_ROLES as readonly string[]).includes(value);
}

/**
 * Normalize any accepted alias to a canonical role.
 * Returns `null` for unknown input — callers decide the fallback so that a
 * typo never silently grants a role.
 */
export function normalizeRole(value: unknown): PlatformRole | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  return ROLE_ALIASES[key] ?? null;
}

/**
 * Normalize a role requested at signup time.
 * `admin` is never self-service: it degrades to `customer`, matching the
 * server-side trigger. Provisioning an admin requires service-role access.
 */
export function normalizeSignupRole(value: unknown, fallback: SignupRole = "customer"): SignupRole {
  const role = normalizeRole(value);
  if (!role || role === "admin") return fallback;
  return role;
}

/** Human label used in UI copy. */
export const ROLE_LABELS: Record<PlatformRole, string> = {
  customer: "Customer",
  business_user: "Shop Owner",
  growth_partner: "Growth Partner",
  delivery_partner: "Delivery Partner",
  admin: "Administrator",
};

/**
 * Canonical app home for each role.
 *
 * The three original portals stay on the same-origin mounts owned by
 * `app/lib/portalRoutes.ts`; the two Phase 1 roles extend the same scheme.
 */
export const ROLE_HOME_PATHS: Record<PlatformRole, string> = {
  customer: "/app/customer",
  business_user: "/app/owner",
  growth_partner: "/app/partner",
  delivery_partner: "/app/delivery",
  admin: "/app/admin",
};

export function homePathForRole(role: PlatformRole): string {
  return ROLE_HOME_PATHS[role] ?? ROLE_HOME_PATHS.customer;
}

/** Short slug used in `?role=` query parameters on the central login screen. */
export const ROLE_QUERY_SLUGS: Record<PlatformRole, string> = {
  customer: "customer",
  business_user: "owner",
  growth_partner: "growth-partner",
  delivery_partner: "delivery",
  admin: "admin",
};

export function roleQuerySlug(role: PlatformRole): string {
  return ROLE_QUERY_SLUGS[role] ?? "customer";
}
