import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GROWTH_PARTNER_ORIGIN = 'https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /growth-partner and all sub-paths to the Growth Partner PWA
  if (pathname === '/growth-partner' || pathname.startsWith('/growth-partner/')) {
    // Remove /growth-partner prefix and redirect to the external origin
    const targetPath = pathname.replace(/^\/growth-partner/, '') || '/';
    const url = new URL(targetPath, GROWTH_PARTNER_ORIGIN);
    
    // Preserve query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Use redirect instead of rewrite - external rewrites are unreliable
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/growth-partner/:path*'],
};
