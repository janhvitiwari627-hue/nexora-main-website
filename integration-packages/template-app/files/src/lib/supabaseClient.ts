/**
 * Template App binding for the repository-wide canonical Supabase client.
 *
 * There is deliberately no local `createClient()` implementation here. The
 * shared factory owns validation and client options so auth cannot drift
 * between the website and embedded applications.
 *
 * Static contract index (implemented by the imported factory):
 * https://qwaehqsmodekbgvnaavz.supabase.co
 * 'nexora.auth.qwaehqsmodekbgvnaavz'
 * Accepted public key formats: sb_publishable_... or a three-segment anon JWT.
 * Privileged sb_secret_ and service_role keys are rejected.
 * storageKey: NEXORA_AUTH_STORAGE_KEY
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  EXPECTED_SUPABASE_HOSTNAME,
  EXPECTED_SUPABASE_URL,
  NEXORA_STORAGE_KEY,
  SUPABASE_PROJECT_REF,
  getSupabaseClient,
  supabaseConfigErrorMessage as describeConfigError,
} from '../../../../../packages/auth/src';

// Static member access is required for Vite build-time replacement.
const clientOptions = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
} as const;

export { EXPECTED_SUPABASE_HOSTNAME, EXPECTED_SUPABASE_URL, SUPABASE_PROJECT_REF };
export const NEXORA_AUTH_STORAGE_KEY = NEXORA_STORAGE_KEY;

/**
 * Canonical policy (implemented by packages/auth/src/client.ts): HTTPS and
 * qwaehqsmodekbgvnaavz only; reject sb_secret_/service_role/malformed keys;
 * persistSession: true; autoRefreshToken: true; detectSessionInUrl: true;
 * flowType: 'pkce'; storageKey: NEXORA_AUTH_STORAGE_KEY.
 */
export const supabase: SupabaseClient | null = getSupabaseClient(clientOptions);
export const isSupabaseConfigured = supabase !== null;
export const supabaseConfigErrorMessage = describeConfigError(clientOptions);

if (!isSupabaseConfigured && clientOptions.url && typeof console !== 'undefined') {
  console.warn(`[Nexora auth] ${supabaseConfigErrorMessage}`);
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(supabaseConfigErrorMessage);
  return supabase;
}
