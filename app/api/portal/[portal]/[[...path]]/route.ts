import { NextRequest, NextResponse } from "next/server";
import { resolvePortalOrigin, type ExternalPortalKey } from "../../../../../config/portalOrigins";

const PORTALS = new Set<ExternalPortalKey>(["customer", "owner", "partner", "template"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portal: string; path?: string[] }> },
) {
  const { portal, path } = await params;
  if (!PORTALS.has(portal as ExternalPortalKey)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }
  const origin = resolvePortalOrigin(portal as ExternalPortalKey);
  if (!origin) {
    return NextResponse.json({ error: "Portal is not externally configured" }, { status: 404 });
  }
  const suffix = path?.length ? `/${path.map(encodeURIComponent).join("/")}` : "/";
  const url = new URL(suffix, origin);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 307);
}
