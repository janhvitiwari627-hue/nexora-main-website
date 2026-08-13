import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_PARTNER_PWA_ORIGIN } from "./app/lib/portalOrigins";

/**
 * `/growth-partner` remains a 308 to the raw Partner origin for the legacy
 * path. The canonical `/app/{role}` mounts (Customer / Owner / Partner) are no
 * longer handled here: they are `beforeFiles` rewrites to the same-origin
 * portal proxy configured in `next.config.ts`, so the catch-all app route
 * never intercepts them.
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/growth-partner",
    "/growth-partner/:path*",
  ],
};
