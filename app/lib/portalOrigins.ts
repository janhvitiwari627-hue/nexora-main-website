export type MountedPortalKey = "customer" | "owner" | "partner";

export const PORTAL_MOUNT_PATHS: Record<MountedPortalKey, string> = {
  customer: "/app/customer",
  owner: "/app/owner",
  partner: "/app/partner",
};
