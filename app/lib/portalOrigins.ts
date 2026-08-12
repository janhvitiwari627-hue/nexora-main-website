/**
 * Canonical production PWA origins for path-based mounts.
 *
 * Customer, Owner and Partner have known Vercel deployments, so a missing
 * env var must not leave `/app/customer`, `/app/owner` or `/app/partner`
 * unmounted. Template has no production URL yet — env-var only.
 *
 * Keep this list identical to `DEFAULT_ALLOWED_AUTH_ORIGINS` in
 * `packages/auth/src/redirects.ts` for the three role PWAs.
 */

export const DEFAULT_CUSTOMER_PWA_ORIGIN = "https://custmer-fresh-app.vercel.app";
export const DEFAULT_OWNER_PWA_ORIGIN = "https://shop-onwer-pink-nexora-aap.vercel.app";
export const DEFAULT_PARTNER_PWA_ORIGIN =
  "https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app";

export type MountedPortalKey = "customer" | "owner" | "partner";

export const PORTAL_MOUNT_PATHS: Record<MountedPortalKey, string> = {
  customer: "/app/customer",
  owner: "/app/owner",
  partner: "/app/partner",
};
