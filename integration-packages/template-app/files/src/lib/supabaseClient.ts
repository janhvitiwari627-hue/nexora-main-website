import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * PHASE 2 — CANONICAL AUTH CONTRACT (Sub-App Supabase client).
 *
 * Browser Supabase client (anon/publishable key only — never a service_role
 * key). Every Nexora Sub-App uses the same logical configuration: the one
 * shared project, PKCE, persisted auto-refreshing sessions and the shared
 * storage key "nexora.auth.qwaehqsmodekbgvnaavz".
 *
 * Credentials come from Vite env vars so they are never hard-coded:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * If the configuration is absent or rejected the client is null and callers
 * surface a clear message instead of crashing the app.
 */

const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)
      : {};

const url = env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** The one shared Supabase project for the whole Nexora platform. */
export const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz';
export const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;
export const EXPECTED_SUPABASE_URL = `https://${EXPECTED_SUPABASE_HOSTNAME}`;
export const NEXORA_AUTH_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';

/** service_role material must never reach a browser bundle. */
function looksLikeServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  if (!key.startsWith('eyJ')) return false;
  const payload = key.split('.')[1];
  if (!payload) return false;
  try {
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return /"role"\s*:\s*"service_role"/.test(decoded);
  } catch {
    return false;
  }
}

/** Accept only a plausible anon JWT (eyJ…) or publishable key (sb_publishable_…). */
function looksLikePublishableKey(key: string): boolean {
  if (!key || /\s/.test(key) || key.includes('your-anon-public-key')) return false;
  if (looksLikeServiceRoleKey(key)) return false;
  if (key.startsWith('sb_publishable_')) return key.length > 'sb_publishable_'.length;
  if (key.startsWith('eyJ')) {
    const segments = key.split('.');
    return segments.length === 3 && segments.every((segment) => segment.length > 0);
  }
  return false;
}

/** Reject a missing, non-HTTPS or wrong-project URL. */
function isCanonicalProjectUrl(supabaseUrl: string): boolean {
  if (!supabaseUrl) return false;
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'https:' && parsed.hostname === EXPECTED_SUPABASE_HOSTNAME;
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isCanonicalProjectUrl(url) && looksLikePublishableKey(anonKey);

if (!isSupabaseConfigured && url && typeof console !== 'undefined') {
  // One-line operator signal; contains no secrets.
  console.warn(
    `[Nexora auth] Supabase configuration rejected. Set VITE_SUPABASE_URL=${EXPECTED_SUPABASE_URL} ` +
      `and use the anon/publishable key of project ${SUPABASE_PROJECT_REF} (never a service-role key, always https).`,
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: NEXORA_AUTH_STORAGE_KEY,
      },
      global: { headers: { 'x-nexora-client': 'template-app/phase1a' } },
    })
  : null;

/** Throws a readable error rather than letting `null` propagate. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
