import type { NextConfig } from "next";

const EXPECTED_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";

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
    return portals
      .filter((portal): portal is { path: string; origin: string } => Boolean(portal.origin))
      .flatMap(({ path, origin }) => [
        { source: path, destination: `${origin}/` },
        { source: `${path}/:path*`, destination: `${origin}/:path*` },
      ]);
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
