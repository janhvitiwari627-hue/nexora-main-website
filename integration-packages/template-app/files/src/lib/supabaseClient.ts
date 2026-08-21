/**
 * Template-app compatibility adapter for the canonical @nexora/auth package.
 *
 * The browser Supabase client is created by @nexora/auth so this app is
 * pinned to project `qwaehqsmodekbgvnaavz`, PKCE, and the shared
 * `nexora.auth.qwaehqsmodekbgvnaavz` storage key. Never create another
 * client directly in this app.
 *
 * This file re-exports the full original supabaseClient API surface
 * (`isSupabaseConfigured`, `supabase`, `supabaseConfigurationMessage`,
 * `requireSupabase`, `supabaseConfigError`, `NexoraSupabaseClient`, etc.)
 * while routing the actual client through the canonical factory. The
 * existing 220-file application keeps its import paths and types; the
 * canonical client is the single source of truth for project, PKCE and
 * storage key.
 */
import {
  getSupabaseClient,
  supabaseConfigErrorMessage,
  type SupabaseClient as CanonicalSupabaseClient,
} from '@nexora/auth';

export type SupabaseClient = CanonicalSupabaseClient;

/** The application's one browser Supabase client (canonical factory). */
export const supabase: SupabaseClient | null = getSupabaseClient();
export const isSupabaseConfigured = supabase !== null;

/** Canonical Nexora error text for shared-project misconfiguration. */
export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : supabaseConfigErrorMessage();

/** Backwards-compatible alias for the canonical client type. */
export type NexoraSupabaseClient = SupabaseClient;

/** Backwards-compatible configuration snapshot. */
export const supabaseConfiguration = {
  ready: isSupabaseConfigured,
  issue: isSupabaseConfigured ? null : 'unconfigured',
  host: null as string | null,
};

/** Backwards-compatible safe configuration error text. */
export function supabaseConfigurationMessage(): string | null {
  return supabaseConfigError;
}

/** Throws a readable error rather than letting `null` propagate. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Supabase authentication is not configured.');
  }
  return supabase;
}
