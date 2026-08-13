import type { NextConfig } from "next";
import { configuredPortalOrigins } from "./config/portalOrigins";

const EXPECTED_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";
const JOB_PORTAL_BASE = "/job-portal";
const publicSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const publicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate when present. Do not assign `?? ""` into `env` — that would bake an
// empty NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY into the
// client bundle and break AuthProvider on a build-time miss.
if (
  publicSupabaseUrl &&
  publicSupabaseUrl.replace(/\/$/, "") !== EXPECTED_SUPABASE_URL
) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must use shared project qwaehqsmodekbgvnaavz.");
}
const JOB_PORTAL_ROUTE_ROOTS = [
  "jobs", "login", "signup", "verify", "forgot-password", "reset-password",
  "dashboard", "profile", "applications", "interviews", "offers", "messages", "saved",
  "portfolio", "employer", "admin", "support", "settings",
];

/**
 * External role PWAs (Customer, Owner, Partner) are deployed on their OWN
 * Vercel origins. Vercel cannot reverse-proxy another `.vercel.app` deployment:
 * both a serverless `fetch()` (Route Handler) and a cross-origin edge rewrite
 * return HTTP 500 — this is the exact root cause of the long-standing
 * "Partner HTTP 500". The only mechanism that works is a client-side redirect
 * (the same mechanism the legacy `/growth-partner` path already uses).
 *
 * So the canonical `/app/{role}` mounts are 307 redirects to the external
 * origin — exact, trailing-slash and nested (deep links map onto the origin
 * root) — with no iframe, no "app is not mounted" blocker, and no
 * `NEXT_PUBLIC_*_PORTAL_MOUNTED` flag deciding routing.
 *
 * Origins come only from validated server-side configuration. Customer, Owner
 * and Partner are required and fail closed when unset. Template resolves to
 * its built-in Template App origin (new-tamplete-app.vercel.app) so
 * `/app/template` always reaches the builder, and `NEXORA_TEMPLATE_PWA_ORIGIN`
 * overrides that default whenever it is configured.
 */
const portalOrigins = configuredPortalOrigins();
const externalPortalRedirects = [
  { source: "/app/customer", destination: `${portalOrigins.customer}/`, permanent: false },
  { source: "/app/customer/:path*", destination: `${portalOrigins.customer}/:path*`, permanent: false },
  { source: "/app/owner", destination: `${portalOrigins.owner}/`, permanent: false },
  { source: "/app/owner/:path*", destination: `${portalOrigins.owner}/:path*`, permanent: false },
  { source: "/app/partner", destination: `${portalOrigins.partner}/`, permanent: false },
  { source: "/app/partner/:path*", destination: `${portalOrigins.partner}/:path*`, permanent: false },
  ...(portalOrigins.template ? [
    { source: "/app/template", destination: `${portalOrigins.template}/`, permanent: false },
    { source: "/app/template/:path*", destination: `${portalOrigins.template}/:path*`, permanent: false },
  ] : []),
];

const nextConfig: NextConfig = {
  async rewrites() {
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
      ...externalPortalRedirects,
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
    // Vercel's Next.js 16/Turbopack build did not inline these public values
    // into the client bundle from direct process.env reads alone. Forward only
    // values that are actually present so a missing deployment variable still
    // fails closed instead of being replaced with an empty string.
    ...(publicSupabaseUrl
      ? { NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl }
      : {}),
    ...(publicSupabaseAnonKey
      ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnonKey }
      : {}),
    NEXT_PUBLIC_EXPECTED_SUPABASE_URL: EXPECTED_SUPABASE_URL,
    // Origins allowed to receive an authenticated PKCE redirect.
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
