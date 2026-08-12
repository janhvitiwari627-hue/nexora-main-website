"use client";

/**
 * Main Website (Next/vinext) Supabase client.
 *
 * PHASE 1: this file is now a thin binding over the shared `@nexora/auth`
 * package (`packages/auth`) so the website, the Customer PWA, the Shop Owner
 * PWA, the Growth Partner PWA and the Delivery PWA all initialize the client
 * the same way, against the same project, with the same PKCE settings.
 *
 * Configuration comes from NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY only — never a service-role key.
 */

import {
  EXPECTED_SUPABASE_HOSTNAME,
  EXPECTED_SUPABASE_URL,
  SUPABASE_PROJECT_REF,
  describeSupabaseEnv,
  getSupabaseClient,
  isSupabaseConfigured as sharedIsConfigured,
  resolveSupabaseEnv,
  supabaseConfigErrorMessage,
  type SupabaseClient,
} from "../../packages/auth/src";

export const DEFAULT_SUPABASE_URL = EXPECTED_SUPABASE_URL;
export const EXPECTED_HOSTNAME = EXPECTED_SUPABASE_HOSTNAME;
export { SUPABASE_PROJECT_REF };

/**
 * These two reads MUST stay as literal `process.env.NEXT_PUBLIC_*`
 * expressions. Next/vinext performs a static text substitution at build time;
 * a dynamic lookup such as `process.env[name]` is NOT inlined and would be
 * `undefined` in the browser bundle. The values are then handed to the shared
 * package as explicit overrides.
 */
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const NEXT_PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Shared by AuthProvider and data fetches so both see the inlined Next env. */
export const websiteClientOptions = { url: NEXT_PUBLIC_URL, anonKey: NEXT_PUBLIC_ANON_KEY } as const;
const clientOptions = websiteClientOptions;

/** Operator-facing configuration error. Empty string when healthy. */
export const missingSupabaseConfigMessage =
  `Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL=${EXPECTED_SUPABASE_URL} and ` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY from project ${SUPABASE_PROJECT_REF}.`;

/**
 * The shared browser client, or `null` when this deployment is misconfigured
 * or pointed at a project other than the shared one.
 */
export function getClient(): SupabaseClient | null {
  return getSupabaseClient(clientOptions);
}

export function isSupabaseConfigured(): boolean {
  return sharedIsConfigured(clientOptions);
}

/** Non-secret diagnostics for support tooling and health checks. */
export function getSupabaseDiagnostics() {
  const described = describeSupabaseEnv(resolveSupabaseEnv(clientOptions));
  return {
    configured: described.configured,
    url: described.url,
    hasAnonKey: described.hasAnonKey,
    source: "NEXT_PUBLIC_*",
    expectedHostname: EXPECTED_SUPABASE_HOSTNAME,
    projectRef: SUPABASE_PROJECT_REF,
    problems: described.problems,
    message: described.message,
  };
}

/** Detailed, actionable message describing exactly what is missing. */
export function getConfigErrorMessage(): string {
  return supabaseConfigErrorMessage(clientOptions);
}

export type { SupabaseClient };
