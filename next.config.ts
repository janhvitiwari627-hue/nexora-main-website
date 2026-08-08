import type { NextConfig } from "next";

const EXPECTED_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";
const JOB_PORTAL_BASE = "/job-portal";
const JOB_PORTAL_ROUTE_ROOTS = [
  "jobs", "login", "signup", "verify", "forgot-password", "reset-password",
  "profile", "applications", "interviews", "offers", "messages", "saved",
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

const nextConfig: NextConfig = {
  // The PWA deployments are mounted behind the apex domain. If a mount is not
  // configured, the application shows an explicit unavailable state; it does
  // not render a copied Owner/Partner/Customer dashboard implementation.
  async rewrites() {
    // Production defaults keep the portal mounts working even when the
    // NEXORA_*_PWA_ORIGIN env vars are not set on the hosting platform.
    const portals = [
      { path: "/app/customer", origin: safePortalOrigin(process.env.NEXORA_CUSTOMER_PWA_ORIGIN ?? "https://custmer-fresh-app.vercel.app") },
      { path: "/app/owner", origin: safePortalOrigin(process.env.NEXORA_OWNER_PWA_ORIGIN ?? "https://shop-onwer-pink-nexora-aap.vercel.app") },
      { path: "/app/partner", origin: safePortalOrigin(process.env.NEXORA_PARTNER_PWA_ORIGIN ?? "https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app") },
    ];
    const portalMounts = portals
      .filter((portal): portal is { path: string; origin: string } => Boolean(portal.origin))
      .flatMap(({ path, origin }) => [
        { source: path, destination: `${origin}/` },
        { source: `${path}/:path*`, destination: `${origin}/:path*` },
      ]);
    const jobPortalRoutes = [
      { source: JOB_PORTAL_BASE, destination: `${JOB_PORTAL_BASE}/index.html` },
      ...JOB_PORTAL_ROUTE_ROOTS.flatMap((route) => [
        { source: `${JOB_PORTAL_BASE}/${route}`, destination: `${JOB_PORTAL_BASE}/index.html` },
        { source: `${JOB_PORTAL_BASE}/${route}/:path*`, destination: `${JOB_PORTAL_BASE}/index.html` },
      ]),
    ];
    return { beforeFiles: jobPortalRoutes, afterFiles: portalMounts, fallback: [] };
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
    // Main Website is Next/vinext: only NEXT_PUBLIC_* is exposed here.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_NEXORA_CUSTOMER_PORTAL_MOUNTED: process.env.NEXORA_CUSTOMER_PWA_ORIGIN ?? "https://custmer-fresh-app.vercel.app" ? "true" : "false",
    NEXT_PUBLIC_NEXORA_OWNER_PORTAL_MOUNTED: process.env.NEXORA_OWNER_PWA_ORIGIN ?? "https://shop-onwer-pink-nexora-aap.vercel.app" ? "true" : "false",
    NEXT_PUBLIC_NEXORA_PARTNER_PORTAL_MOUNTED: process.env.NEXORA_PARTNER_PWA_ORIGIN ?? "https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app" ? "true" : "false",
    NEXT_PUBLIC_EXPECTED_SUPABASE_URL: EXPECTED_SUPABASE_URL,
    // Section 10.2 — Google OAuth button stays hidden unless the deployment
    // explicitly opts in after Google + Supabase provider verification.
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" ? "true" : "false",
  },
};

export default nextConfig;
