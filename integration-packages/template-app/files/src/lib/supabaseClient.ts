import {
  getSupabaseClient,
  supabaseConfigErrorMessage,
  type SupabaseClient,
} from '@nexora/auth';

/**
 * Template-app compatibility adapter.
 *
 * All browser auth clients are created by @nexora/auth so this app is pinned
 * to project qwaehqsmodekbgvnaavz, PKCE, and the shared
 * nexora.auth.qwaehqsmodekbgvnaavz storage key. Never create another client
 * directly in this app.
 */
export const supabase: SupabaseClient | null = getSupabaseClient();
export const isSupabaseConfigured = supabase !== null;
export const supabaseConfigError = isSupabaseConfigured
  ? null
  : supabaseConfigErrorMessage();

/** Throws a readable error rather than letting `null` propagate. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Supabase authentication is not configured.');
  }
  return supabase;
}
