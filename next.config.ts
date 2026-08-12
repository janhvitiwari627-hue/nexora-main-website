import type { NextConfig } from "next";
import {
  DEFAULT_CUSTOMER_PWA_ORIGIN,
  DEFAULT_OWNER_PWA_ORIGIN,
  DEFAULT_PARTNER_PWA_ORIGIN,
} from "./app/lib/portalOrigins";

const EXPECTED_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";
const JOB_PORTAL_BASE = "/job-portal";

// Validate when present. Do not assign `?? ""` into `env` — that would bake an
// empty NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY into the
// client bundle and break AuthProvider on a build-time miss.
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "") !== EXPECTED_SUPABASE_URL
) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must use shared project qwaehqsmodekbgvnaavz.");
}
const JOB_PORTAL_ROUTE_ROOTS = [
  "jobs", "login", "signup", "verify", "forgot-password", "reset-password",
  "dashboard", "profile", "applications", "interviews", "offers", "messages", "saved",
  "portfolio", "employer", "admin", "support", "settings",
];

function safePortalOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Phase 1 — hardcoded production fallbacks for Customer, Owner and Partner.
 * Template stays env-var-only: it has no known deployment URL.
 *
 * Destinations preserve the `/app/{role}` path so Vite PWAs built with
 * `base: "/app/customer/"` (etc.) receive the path they expect. Rewriting
 * `/app/partner` to `origin/` was the Phase 1 HTTP 500.
 */
const CUSTOMER_APP_ORIGIN = safePortalOrigin(
  process.env.NEXORA_CUSTOMER_PWA_ORIGIN ?? DEFAULT_CUSTOMER_PWA_ORIGIN,
);
const OWNER_APP_ORIGIN = safePortalOrigin(
  process.env.NEXORA_OWNER_PWA_ORIGIN ?? DEFAULT_OWNER_PWA_ORIGIN,
);
const PARTNER_APP_ORIGIN = safePortalOrigin(
  process.env.GROWTH_PARTNER_APP_ORIGIN ??
    process.env.NEXORA_PARTNER_PWA_ORIGIN ??
    DEFAULT_PARTNER_PWA_ORIGIN,
);
const TEMPLATE_APP_ORIGIN = safePortalOrigin(process.env.NEXORA_TEMPLATE_PWA_ORIGIN);

type PortalRewrite = { source: string; destination: string };

function pathPreservingMounts(path: string, origin: string): PortalRewrite[] {
  return [
    { source: path, destination: `${origin}${path}` },
    { source: `${path}/`, destination: `${origin}${path}/` },
    { source: `${path}/:path*`, destination: `${origin}${path}/:path*` },
  ];
}

const nextConfig: NextConfig = {
  // The PWA deployments are mounted behind the apex domain. If a mount is not
  // configured, the application shows an explicit unavailable state; it does
  // not render a copied Owner/Partner/Customer dashboard implementation.
  async rewrites() {
    // 12 portal rewrites when all three role PWAs resolve (3 paths × 3 rules
    // + /growth-partner × 3). Template adds 3 more only when its env is set.
    const portals = [
      { path: "/app/customer", origin: CUSTOMER_APP_ORIGIN },
      { path: "/app/owner", origin: OWNER_APP_ORIGIN },
      { path: "/app/partner", origin: PARTNER_APP_ORIGIN },
      { path: "/app/template", origin: TEMPLATE_APP_ORIGIN },
    ];
    // Document the 12 path-preserving mounts (3 portals × 3 + growth-partner × 3).
    // They are NOT installed as Vercel edge rewrites: those return HTTP 500
    // against a foreign Vercel deployment. The Route Handler proxy in
    // app/app/[portal]/[[...path]]/route.ts serves /app/{role} instead.
    const documentedMounts = portals
      .filter((portal): portal is { path: string; origin: string } => Boolean(portal.origin))
      .flatMap(({ path, origin }) => pathPreservingMounts(path, origin));
    void documentedMounts;
    const jobPortalRoutes = [
      { source: JOB_PORTAL_BASE, destination: `${JOB_PORTAL_BASE}/index.html` },
      ...JOB_PORTAL_ROUTE_ROOTS.flatMap((route) => [
        { source: `${JOB_PORTAL_BASE}/${route}`, destination: `${JOB_PORTAL_BASE}/index.html` },
        { source: `${JOB_PORTAL_BASE}/${route}/:path*`, destination: `${JOB_PORTAL_BASE}/index.html` },
      ]),
    ];
    return {
      beforeFiles: jobPortalRoutes,
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/dashboard/seeker", destination: "/job-portal/dashboard/seeker", permanent: false },
      { source: "/dashboard/employer", destination: "/job-portal/dashboard/employer", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: `${JOB_PORTAL_BASE}/sw.js`,
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: `${JOB_PORTAL_BASE}/` },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: `${JOB_PORTAL_BASE}/manifest.webmanifest`,
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: `${JOB_PORTAL_BASE}/icons/:path*`,
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  env: {
    // Do not bake empty NEXT_PUBLIC_SUPABASE_* strings. Next already inlines
    // real NEXT_PUBLIC_* values from the deployment environment; forcing ""
    // here would hide a runtime key behind a build-time miss.
    NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED: CUSTOMER_APP_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_NEXORA_OWNER_PORTAL_MOUNTED: OWNER_APP_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_NEXORA_PARTNER_PORTAL_MOUNTED: PARTNER_APP_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_NEXORA_TEMPLATE_PORTAL_MOUNTED: TEMPLATE_APP_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_EXPECTED_SUPABASE_URL: EXPECTED_SUPABASE_URL,
    // Phase 1 — origins allowed to receive an authenticated PKCE redirect.
    // Must mirror the Supabase Redirect URL allowlist. Empty falls back to the
    // built-in production list in packages/auth/src/redirects.ts.
    NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS:
      process.env.NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS ?? "",
    // Section 10.2 — Google OAuth button stays hidden unless the deployment
    // explicitly opts in after Google + Supabase provider verification.
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" ? "true" : "false",
  },
};

export default nextConfig;
