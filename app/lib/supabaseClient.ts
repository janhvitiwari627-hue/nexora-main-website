"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Main Website (Next/vinext) Supabase client. */
export const DEFAULT_SUPABASE_URL = "https://qwaehqsmodekbgvnaavz.supabase.co";
export const SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz";
export const EXPECTED_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const missingSupabaseConfigMessage =
  `Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL=${DEFAULT_SUPABASE_URL} and NEXT_PUBLIC_SUPABASE_ANON_KEY from project ${SUPABASE_PROJECT_REF}.`;

let singleton: SupabaseClient | null = null;
let singletonKey = "";

export function getClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    if (new URL(url).hostname !== EXPECTED_HOSTNAME) return null;
  } catch {
    return null;
  }
  const cacheKey = `${url}::${anonKey}`;
  if (singleton && singletonKey === cacheKey) return singleton;
  singleton = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  singletonKey = cacheKey;
  return singleton;
}

export function isSupabaseConfigured(): boolean {
  return getClient() !== null;
}

export function getSupabaseDiagnostics() {
  return {
    configured: isSupabaseConfigured(),
    url: url || DEFAULT_SUPABASE_URL,
    hasAnonKey: Boolean(anonKey),
    source: "NEXT_PUBLIC_*",
    expectedHostname: EXPECTED_HOSTNAME,
    projectRef: SUPABASE_PROJECT_REF,
  };
}

export type { SupabaseClient };
