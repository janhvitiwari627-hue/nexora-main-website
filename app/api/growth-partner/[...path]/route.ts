import { NextRequest, NextResponse } from "next/server";
import { resolvePortalOrigin } from "../../../../config/portalOrigins";

const growthPartnerOrigin = resolvePortalOrigin("partner")!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.map(encodeURIComponent).join("/") || "";
  const url = new URL(`/${path}`, growthPartnerOrigin);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 307);
}
