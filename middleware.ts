import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_CUSTOMER_PWA_ORIGIN,
  DEFAULT_OWNER_PWA_ORIGIN,
  DEFAULT_PARTNER_PWA_ORIGIN,
  PORTAL_MOUNT_PATHS,
  type MountedPortalKey,
} from "./app/lib/portalOrigins";

const PARTNER_ORIGIN = DEFAULT_PARTNER_PWA_ORIGIN;

const PORTAL_ORIGINS: Record<MountedPortalKey, string> = {
  customer: DEFAULT_CUSTOMER_PWA_ORIGIN,
  owner: DEFAULT_OWNER_PWA_ORIGIN,
  partner: DEFAULT_PARTNER_PWA_ORIGIN,
};

function portalKeyFromPath(pathname: string): MountedPortalKey | null {
  for (const key of Object.keys(PORTAL_MOUNT_PATHS) as MountedPortalKey[]) {
    const base = PORTAL_MOUNT_PATHS[key];
    if (pathname === base || pathname.startsWith(`${base}/`)) return key;
  }
  return null;
}

/**
 * Phase 1 — Edge middleware for portal mounts.
 *
 * Exact `/app/{role}` entry points stay on Next.js (PortalGateway). Trailing-
 * slash and nested asset paths are rewritten to the matching PWA, preserving
 * the `/app/{role}` prefix so Vite `base` builds resolve. `/growth-partner`
 * remains a same-host 308 to the raw Partner origin (external rewrites on
 * that alias were unreliable).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/growth-partner" || pathname.startsWith("/growth-partner/")) {
    const targetPath = pathname.replace(/^\/growth-partner/, "") || "/";
    const url = new URL(targetPath, PARTNER_ORIGIN);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url, 308);
  }

  const portalKey = portalKeyFromPath(pathname);
  if (!portalKey) return NextResponse.next();

  const base = PORTAL_MOUNT_PATHS[portalKey];
  // Exact entry (no trailing slash) stays on PortalGateway.
  if (pathname === base) return NextResponse.next();

  const origin = PORTAL_ORIGINS[portalKey];
  const url = new URL(pathname, origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/app/customer",
    "/app/customer/:path*",
    "/app/owner",
    "/app/owner/:path*",
    "/app/partner",
    "/app/partner/:path*",
    "/growth-partner",
    "/growth-partner/:path*",
  ],
};
