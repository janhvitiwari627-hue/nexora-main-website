import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_CUSTOMER_PWA_ORIGIN,
  DEFAULT_OWNER_PWA_ORIGIN,
  DEFAULT_PARTNER_PWA_ORIGIN,
  PORTAL_MOUNT_PATHS,
  type MountedPortalKey,
} from "../../../../lib/portalOrigins";

/**
 * Same-origin PWA proxy used by middleware for /app/{role}/* .
 *
 * Foreign Vercel edge rewrites return HTTP 500. Fetching the upstream here
 * and streaming the body keeps the browser on nexora.app.
 */

const PORTAL_ORIGINS: Record<MountedPortalKey, string> = {
  customer: DEFAULT_CUSTOMER_PWA_ORIGIN,
  owner: DEFAULT_OWNER_PWA_ORIGIN,
  partner: DEFAULT_PARTNER_PWA_ORIGIN,
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
]);

function isMountedPortal(value: string): value is MountedPortalKey {
  return value === "customer" || value === "owner" || value === "partner";
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ portal: string; path?: string[] }> },
) {
  const { portal, path } = await context.params;
  if (!isMountedPortal(portal)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const origin = PORTAL_ORIGINS[portal];
  const mount = PORTAL_MOUNT_PATHS[portal];
  const suffix = path?.length ? `/${path.join("/")}` : "";
  const target = new URL(`${mount}${suffix}`, origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const incoming = new Headers();
  const accept = request.headers.get("accept");
  const ua = request.headers.get("user-agent");
  if (accept) incoming.set("accept", accept);
  incoming.set("user-agent", ua || "Nexora-Portal-Proxy");

  try {
    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers: incoming,
      redirect: "follow",
      cache: "no-store",
    });

    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
    });
    headers.delete("x-frame-options");
    headers.delete("content-security-policy");
    headers.set("x-nexora-portal", portal);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (error) {
    console.error("[nexora-portal-proxy]", portal, target.toString(), error);
    return NextResponse.json({ error: "Portal upstream unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const dynamic = "force-dynamic";
