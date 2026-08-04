/**
 * Canonical same-origin portal routes for the Nexora ecosystem.
 *
 * The public website and all three role portals intentionally live on the
 * same origin. Do not replace these paths with subdomains: Supabase Auth is
 * shared by the apps and path routing keeps browser session storage scoped to
 * one origin.
 */

export type PortalRole = "customer" | "business_user" | "growth_partner";

export const PORTAL_PATHS = {
  customer: "/app/customer",
  business_user: "/app/owner",
  growth_partner: "/app/partner",
} as const satisfies Record<PortalRole, string>;

export type PortalKey = "customer" | "owner" | "partner";

export function portalPathForRole(role: PortalRole, suffix = ""): string {
  const base = PORTAL_PATHS[role];
  const cleanSuffix = suffix.replace(/^\/+/, "");
  return cleanSuffix ? `${base}/${cleanSuffix}` : base;
}

export function portalRoleFromPath(pathname: string): PortalRole | null {
  const path = pathname.split("?", 1)[0].replace(/\/+$/, "") || "/";
  if (path === PORTAL_PATHS.customer || path.startsWith(`${PORTAL_PATHS.customer}/`)) return "customer";
  if (path === PORTAL_PATHS.business_user || path.startsWith(`${PORTAL_PATHS.business_user}/`)) return "business_user";
  if (path === PORTAL_PATHS.growth_partner || path.startsWith(`${PORTAL_PATHS.growth_partner}/`)) return "growth_partner";
  return null;
}

export function legacyDashboardRoleFromPath(pathname: string): PortalRole | null {
  const path = pathname.split("?", 1)[0].replace(/\/+$/, "") || "/";
  if (path === "/dashboard/customer") return "customer";
  if (path === "/dashboard/business_user") return "business_user";
  if (path === "/dashboard/growth_partner") return "growth_partner";
  return null;
}

export function isPortalPath(pathname: string): boolean {
  return portalRoleFromPath(pathname) !== null;
}

export function roleQueryForPortalRole(role: PortalRole): "customer" | "owner" | "growth-partner" {
  if (role === "business_user") return "owner";
  if (role === "growth_partner") return "growth-partner";
  return "customer";
}

export function portalKeyForRole(role: PortalRole): PortalKey {
  if (role === "business_user") return "owner";
  if (role === "growth_partner") return "partner";
  return "customer";
}
