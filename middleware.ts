import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_PARTNER_PWA_ORIGIN,
  PORTAL_MOUNT_PATHS,
  type MountedPortalKey,
} from "./app/lib/portalOrigins";

function portalKeyFromPath(pathname: string): MountedPortalKey | null {
  for (const key of Object.keys(PORTAL_MOUNT_PATHS) as MountedPortalKey[]) {
    const base = PORTAL_MOUNT_PATHS[key];
    if (pathname === base || pathname.startsWith(`${base}/`)) return key;
  }
  return null;
}

/**
 * Exact `/app/{role}` stays on PortalGateway (Next.js page).
 * Trailing-slash and nested asset paths are rewritten SAME-ORIGIN to
 * `/api/portal/{role}/...`, which fetches the PWA. Foreign Vercel rewrites
 * return HTTP 500; same-origin rewrites do not.
 *
 * `/growth-partner` remains a 308 to the raw Partner origin.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/growth-partner" || pathname.startsWith("/growth-partner/")) {
    const targetPath = pathname.replace(/^\/growth-partner/, "") || "/";
    const url = new URL(targetPath, DEFAULT_PARTNER_PWA_ORIGIN);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url, 308);
  }

  const portalKey = portalKeyFromPath(pathname);
  if (!portalKey) return NextResponse.next();

  const base = PORTAL_MOUNT_PATHS[portalKey];
  if (pathname === base) return NextResponse.next();

  const suffix = pathname.slice(base.length) || "/";
  const url = request.nextUrl.clone();
  url.pathname = `/api/portal/${portalKey}${suffix === "/" ? "" : suffix}`;
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
