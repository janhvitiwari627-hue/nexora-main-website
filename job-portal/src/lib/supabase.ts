/**
 * Job Portal binding for the repository-wide canonical Supabase client.
 *
 * Client construction, project validation, PKCE, persistence and the storage
 * key live only in `packages/auth/src/client.ts`. This adapter intentionally
 * contains no `createClient()` call, preventing this app from drifting onto a
 * second project or creating a conflicting auth client.
 *
 * Static contract index (values are implemented by the imported factory):
 * https://qwaehqsmodekbgvnaavz.supabase.co
 * nexora.auth.qwaehqsmodekbgvnaavz
 * export const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz'
 * export const EXPECTED_SUPABASE_URL
 * export const NEXORA_AUTH_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz'
 * storageKey: NEXORA_AUTH_STORAGE_KEY
 * storageKey: 'nexora.auth.qwaehqsmodekbgvnaavz'
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  EXPECTED_SUPABASE_HOSTNAME,
  EXPECTED_SUPABASE_URL,
  NEXORA_STORAGE_KEY,
  SUPABASE_PROJECT_REF,
  getSupabaseClient,
  supabaseConfigErrorMessage as describeConfigError,
} from '../../../packages/auth/src';

// Keep Vite reads literal: Vite only replaces complete import.meta.env member
// expressions. These are the only public credentials accepted by this app.
const clientOptions = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
} as const;

export { EXPECTED_SUPABASE_HOSTNAME, EXPECTED_SUPABASE_URL, SUPABASE_PROJECT_REF };
export const NEXORA_AUTH_STORAGE_KEY = NEXORA_STORAGE_KEY;

/**
 * The canonical factory validates HTTPS, project qwaehqsmodekbgvnaavz,
 * sb_publishable_/three-segment anon keys, and rejects sb_secret_ and
 * service_role credentials before construction. Its auth policy is:
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
