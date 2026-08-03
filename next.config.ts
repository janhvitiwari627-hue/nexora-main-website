import type { NextConfig } from "next";

// Shared Supabase project – default so customer/shop owner/growth partner auth never drifts
const DEFAULT_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";

const nextConfig: NextConfig = {
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
