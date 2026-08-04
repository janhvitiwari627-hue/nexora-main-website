import type { NextConfig } from "next";

// Shared Supabase project – default so customer/shop owner/growth partner auth never drifts
const DEFAULT_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";

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
  // When the three PWA deployments are configured, the public website proxies
  // them behind the canonical same-origin paths. With no origin configured,
  // the in-repo role-gated workspace remains the explicit local fallback.
  async rewrites() {
    const portals = [
      { path: "/app/customer", origin: safePortalOrigin(process.env.NEXORA_CUSTOMER_PWA_ORIGIN) },
      { path: "/app/owner", origin: safePortalOrigin(process.env.NEXORA_OWNER_PWA_ORIGIN) },
      { path: "/app/partner", origin: safePortalOrigin(process.env.NEXORA_PARTNER_PWA_ORIGIN) },
    ];
    return portals
      .filter((portal): portal is { path: string; origin: string } => Boolean(portal.origin))
      .flatMap(({ path, origin }) => [
        { source: path, destination: `${origin}/` },
        { source: `${path}/:path*`, destination: `${origin}/:path*` },
      ]);
  },
  env: {
    // Primary requested names: VITE_PUBLIC_ + legacy VITE_ + NEXT_PUBLIC_ + default
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      "",
    // Expose VITE_PUBLIC_ names for Vite builds (vinext) – keep same values
    VITE_PUBLIC_SUPABASE_URL:
      process.env.VITE_PUBLIC_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      DEFAULT_SUPABASE_URL,
    VITE_PUBLIC_SUPABASE_ANON_KEY:
      process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      "",
  },
};

export default nextConfig;
