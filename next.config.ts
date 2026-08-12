import type { NextConfig } from "next";

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

const GROWTH_PARTNER_APP_ORIGIN = safePortalOrigin(
  process.env.GROWTH_PARTNER_APP_ORIGIN ?? process.env.NEXORA_PARTNER_PWA_ORIGIN,
);

const nextConfig: NextConfig = {
  // The PWA deployments are mounted behind the apex domain. If a mount is not
  // configured, the application shows an explicit unavailable state; it does
  // not render a copied Owner/Partner/Customer dashboard implementation.
  async rewrites() {
    // Portal proxy origins are explicit deployment configuration. There are no
    // hardcoded cross-origin fallbacks; an unconfigured mount fails closed in
    // PortalGateway instead of forwarding browser credentials unexpectedly.
    // GROWTH_PARTNER_APP_ORIGIN is the canonical env var for the Growth Partner
    // PWA; NEXORA_PARTNER_PWA_ORIGIN is accepted as a legacy alias.
    const partnerOrigin = GROWTH_PARTNER_APP_ORIGIN;
    const portals = [
      { path: "/app/customer", origin: safePortalOrigin(process.env.NEXORA_CUSTOMER_PWA_ORIGIN) },
      { path: "/app/owner", origin: safePortalOrigin(process.env.NEXORA_OWNER_PWA_ORIGIN) },
      { path: "/app/partner", origin: partnerOrigin },
      { path: "/app/template", origin: safePortalOrigin(process.env.NEXORA_TEMPLATE_PWA_ORIGIN) },
    ];
    const portalMounts = portals
      .filter((portal): portal is { path: string; origin: string } => Boolean(portal.origin))
      .flatMap(({ path, origin }) => [
        { source: path, destination: `${origin}/` },
        { source: `${path}/`, destination: `${origin}/` },
        { source: `${path}/:path*`, destination: `${origin}/:path*` },
      ]);
    // Growth Partner edge rewrite: /growth-partner proxies to the dedicated
    // PWA before the Next.js catch-all route. All nested paths, assets, and
    // query parameters are preserved. This replaces the client-side placeholder
    // and avoids an iframe — the PWA renders directly at this URL.
    const growthPartnerRewrites: Array<{ source: string; destination: string }> = partnerOrigin
      ? [
          { source: "/growth-partner", destination: `${partnerOrigin}/` },
          { source: "/growth-partner/", destination: `${partnerOrigin}/` },
          { source: "/growth-partner/:path*", destination: `${partnerOrigin}/:path*` },
        ]
      : [];
    const jobPortalRoutes = [
      { source: JOB_PORTAL_BASE, destination: `${JOB_PORTAL_BASE}/index.html` },
      ...JOB_PORTAL_ROUTE_ROOTS.flatMap((route) => [
        { source: `${JOB_PORTAL_BASE}/${route}`, destination: `${JOB_PORTAL_BASE}/index.html` },
        { source: `${JOB_PORTAL_BASE}/${route}/:path*`, destination: `${JOB_PORTAL_BASE}/index.html` },
      ]),
    ];
    // Nested `/app/*/` assets and all /growth-partner/* routes load before the
    // catch-all page. The Growth Partner PWA renders directly at
    // /growth-partner via edge rewrites — no iframe, no copied dashboard.
    // Exact `/app/customer`, `/app/owner`, `/app/template` stay on the Next.js
    // app (portalExactMounts run as afterFiles).
    const portalAssetMounts = portalMounts.filter((rule) => rule.source.endsWith("/") || rule.source.includes(":path*"));
    const portalExactMounts = portalMounts.filter((rule) => !rule.source.endsWith("/") && !rule.source.includes(":path*"));
    return {
      beforeFiles: [...jobPortalRoutes, ...growthPartnerRewrites, ...portalAssetMounts],
      afterFiles: portalExactMounts,
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
    NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED: process.env.NEXORA_CUSTOMER_PWA_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_NEXORA_OWNER_PORTAL_MOUNTED: process.env.NEXORA_OWNER_PWA_ORIGIN ? "true" : "false",
    NEXT_PUBLIC_NEXORA_PARTNER_PORTAL_MOUNTED: (process.env.GROWTH_PARTNER_APP_ORIGIN || process.env.NEXORA_PARTNER_PWA_ORIGIN) ? "true" : "false",
    NEXT_PUBLIC_NEXORA_TEMPLATE_PORTAL_MOUNTED: process.env.NEXORA_TEMPLATE_PWA_ORIGIN ? "true" : "false",
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
