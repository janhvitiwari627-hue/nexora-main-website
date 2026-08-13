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

/**
 * External role PWAs (Customer, Owner, Partner) are served SAME-ORIGIN through
 * the Route Handler proxy in `app/api/portal/[portal]/[[...path]]/route.ts`.
 *
 * Rewriting `/app/{role}` directly to a foreign Vercel deployment returns
 * HTTP 500, so the mounts are `beforeFiles` rewrites to the same-origin proxy —
 * exact, trailing-slash and nested — with no client-side iframe, no "app is not
 * mounted" blocker, and no `NEXT_PUBLIC_*_PORTAL_MOUNTED` flag deciding routing.
 *
 * Template has no production origin and stays a same-origin workspace surface
 * rendered by the app shell (`/app/template`).
 */
const PORTAL_PROXY_ROLES = ["customer", "owner", "partner"] as const;
const portalProxyRoutes = PORTAL_PROXY_ROLES.flatMap((role) => [
  { source: `/app/${role}`, destination: `/api/portal/${role}` },
  { source: `/app/${role}/`, destination: `/api/portal/${role}/` },
  { source: `/app/${role}/:path*`, destination: `/api/portal/${role}/:path*` },
]);

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
      beforeFiles: [...portalProxyRoutes, ...jobPortalRoutes],
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
