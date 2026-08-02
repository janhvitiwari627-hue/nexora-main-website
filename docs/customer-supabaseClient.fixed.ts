// ============================================================================
// FIXED: src/lib/supabaseClient.ts  (customer PWA)
// ----------------------------------------------------------------------------
// Root cause: the deployed customer build was built against env vars that
// pointed at a *stale/different* Supabase project, so signInWithPassword hit
// the wrong project and returned "Invalid credentials" even though the account
// is valid on the shared project (qwaehqsmodekbgvnaavz).
//
// Fix: bake in the shared project's URL + anon key as DEFAULTS so the app
// ALWAYS connects to qwaehqsmodekbgvnaavz regardless of stale env vars. The
// runtime validation is kept (loud failure instead of silent breakage), but it
// now validates against the baked-in approved project.
// ============================================================================
import { createClient } from '@supabase/supabase-js';

// ── Baked-in shared Supabase project (approved / production) ──────────────
// The entire Nexora ecosystem (main website, customer PWA, owner PWA, partner
// PWA) shares ONE Supabase project: qwaehqsmodekbgvnaavz.
const DEFAULT_SUPABASE_URL = 'https://qwaehqsmodekbgvnaavz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'PASTE_REAL_ANON_KEY_HERE'; // Supabase → Settings → API → anon public

const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz';
const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;

type SupabaseConfigResult =
  | { isValid: true; url: string; anonKey: string; error: null }
  | { isValid: false; url: null; anonKey: null; error: string };

const isBrowserSafeSupabaseKey = (key: string): boolean => {
  if (key.startsWith('sb_publishable_')) {
    return key.length > 'sb_publishable_'.length;
  }

  const jwtParts = key.split('.');
  if (jwtParts.length !== 3) return false;

  try {
    const base64UrlPayload = jwtParts[1];
    const base64Payload = base64UrlPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64UrlPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64Payload)) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
};

export const validateSupabaseConfig = (
  rawUrl: unknown,
  rawAnonKey: unknown,
): SupabaseConfigResult => {
  const url =
    typeof rawUrl === 'string' && rawUrl.trim()
      ? rawUrl.trim()
      : DEFAULT_SUPABASE_URL;
  const anonKey =
    typeof rawAnonKey === 'string' && rawAnonKey.trim()
      ? rawAnonKey.trim()
      : DEFAULT_SUPABASE_ANON_KEY;

  // No config at all (missing env AND missing baked-in default) → surface it.
  if (!url || !anonKey || anonKey === 'PASTE_REAL_ANON_KEY_HERE') {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error:
        'Supabase is not configured. The shared project anon key must be baked into src/lib/supabaseClient.ts before deploy.',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error:
        'Supabase configuration is invalid. Check the deployment environment variables.',
    };
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== EXPECTED_SUPABASE_HOSTNAME ||
    parsedUrl.username ||
    parsedUrl.password ||
    (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error: `Supabase configuration must use the approved ${SUPABASE_PROJECT_REF} project.`,
    };
  }

  if (!isBrowserSafeSupabaseKey(anonKey)) {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error:
        'Supabase configuration contains an invalid browser key.',
    };
  }

  return {
    isValid: true,
    url: parsedUrl.origin,
    anonKey,
    error: null,
  };
};

const viteEnv = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env;

const config = validateSupabaseConfig(
  viteEnv?.VITE_SUPABASE_URL,
  viteEnv?.VITE_SUPABASE_ANON_KEY,
);

export const supabaseConfigError = config.isValid ? null : config.error;
export const supabase = config.isValid
  ? createClient(config.url, config.anonKey)
  : null;
