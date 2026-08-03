"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared Supabase project for Nexora ecosystem.
 * The entire platform (main website, customer PWA, owner PWA, partner PWA)
 * must connect to this single project: qwaehqsmodekbgvnaavz
 */
export const DEFAULT_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";
export const SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz";
export const EXPECTED_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;

type ViteEnv = ImportMeta & { env?: Record<string, string | undefined> };

function readEnv(): { url: string; anonKey: string; source: string } {
  const viteEnv = (import.meta as unknown as ViteEnv).env ?? {};

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_PUBLIC_SUPABASE_URL ??
    viteEnv.VITE_PUBLIC_SUPABASE_URL ??
    viteEnv.VITE_SUPABASE_URL ??
    viteEnv.NEXT_PUBLIC_SUPABASE_URL ??
    "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ??
    viteEnv.VITE_PUBLIC_SUPABASE_ANON_KEY ??
    viteEnv.VITE_SUPABASE_ANON_KEY ??
    viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  let source = "env";
  if (!url) source = "missing";
  else if (process.env.NEXT_PUBLIC_SUPABASE_URL) source = "NEXT_PUBLIC_SUPABASE_URL";
  else if (process.env.VITE_PUBLIC_SUPABASE_URL) source = "VITE_PUBLIC_SUPABASE_URL";
  else if (viteEnv.VITE_PUBLIC_SUPABASE_URL) source = "VITE_PUBLIC_SUPABASE_URL";
  else if (viteEnv.VITE_SUPABASE_URL) source = "VITE_SUPABASE_URL";
  else if (viteEnv.NEXT_PUBLIC_SUPABASE_URL) source = "VITE_NEXT_PUBLIC_SUPABASE_URL";

  return { url, anonKey, source };
}

export const missingSupabaseConfigMessage =
  "Nexora login service is not configured for this deployment. Please set VITE_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co and VITE_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_ equivalents) to the shared project qwaehqsmodekbgvnaavz.";

export function getDetailedMissingConfigMessage(): string {
  const { url, anonKey } = readEnv();
  if (!url && !anonKey) {
    return `Supabase not configured. Set VITE_PUBLIC_SUPABASE_URL=${DEFAULT_SUPABASE_URL} and VITE_PUBLIC_SUPABASE_ANON_KEY from Supabase Dashboard (Project ${SUPABASE_PROJECT_REF} → Settings → API → anon public). Also supports NEXT_PUBLIC_ prefix.`;
  }
  if (!url) return "Supabase URL missing. Set VITE_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.";
  if (!anonKey) return "Supabase anon key missing. Set VITE_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public key, NOT privileged).";
  return missingSupabaseConfigMessage;
}

let singleton: SupabaseClient | null = null;
let singletonKey = "";

export function getClient(): SupabaseClient | null {
  const { url, anonKey } = readEnv();

  // Use default URL as fallback to always target shared project if URL not set
  const effectiveUrl = url || DEFAULT_SUPABASE_URL;
  const effectiveKey = anonKey;

  if (!effectiveUrl || !effectiveKey) {
    return null;
  }

  // Validate hostname is the approved project (warn but don't block custom override)
  try {
    const parsed = new URL(effectiveUrl);
    if (parsed.hostname !== EXPECTED_HOSTNAME) {
      console.warn(
        `[Nexora] Supabase URL ${parsed.hostname} != expected ${EXPECTED_HOSTNAME}. ` +
          `All roles should use shared project ${SUPABASE_PROJECT_REF} for auth sharing.`
      );
    }
  } catch {
    // invalid URL -> return null so caller shows config error
    return null;
  }

  const cacheKey = `${effectiveUrl}::${effectiveKey}`;
  if (singleton && singletonKey === cacheKey) return singleton;

  singleton = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  singletonKey = cacheKey;
  return singleton;
}

export function isSupabaseConfigured(): boolean {
  return getClient() !== null;
}

export function getSupabaseDiagnostics() {
  const { url, anonKey, source } = readEnv();
  const client = getClient();
  return {
    configured: !!client,
    url: url || DEFAULT_SUPABASE_URL,
    hasAnonKey: !!anonKey,
    source,
    expectedHostname: EXPECTED_HOSTNAME,
    projectRef: SUPABASE_PROJECT_REF,
  };
}

// Re-export for convenience
export type { SupabaseClient };
