import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_PARTNER_PWA_ORIGIN } from "./app/lib/portalOrigins";

/**
 * /growth-partner is a raw-origin alias. External rewrites to that PWA are
 * unreliable on Vercel, so this stays a same-host 308. Canonical mounts
 * `/app/customer|owner|partner` are served by the Route Handler proxy in
 * `app/app/[portal]/[[...path]]/route.ts` — do not rewrite them here.
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
  matcher: ["/growth-partner", "/growth-partner/:path*"],
};
