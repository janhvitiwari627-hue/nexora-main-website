import { NextRequest, NextResponse } from "next/server";

const PORTAL_ORIGINS: Record<string, string> = {
  customer: "https://custmer-fresh-app.vercel.app",
  owner: "https://shop-onwer-pink-nexora-aap.vercel.app",
  partner: "https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app",
};

const PORTAL_PATHS: Record<string, string> = {
  customer: "/app/customer",
  owner: "/app/owner",
  partner: "/app/partner",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portal: string; path?: string[] }> },
) {
  const { portal, path } = await params;
  const origin = PORTAL_ORIGINS[portal];
  if (!origin) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const mount = PORTAL_PATHS[portal];
  const suffix = path?.length ? `/${path.join("/")}` : "";
  const url = new URL(`${mount}${suffix}`, origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": request.headers.get("User-Agent") || "Nexora-Proxy",
        Accept: request.headers.get("Accept") || "*/*",
      },
      cache: "no-store",
    });

    const headers = new Headers(response.headers);
    headers.delete("x-frame-options");
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.set("x-nexora-portal", portal);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Portal proxy error:", portal, url.toString(), error);
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 502 });
  }
}
