/**
 * PHASE 2 — CANONICAL AUTH CONTRACT (Sub-App Supabase client).
 *
 * Every Nexora Sub-App builds its browser Supabase client with this exact
 * logical configuration so all surfaces share one identity directory on the
 * one shared project:
 *
 *   * project     — https://qwaehqsmodekbgvnaavz.supabase.co (enforced)
 *   * flow        — PKCE (tokens never travel in a URL fragment)
 *   * persistence — persistSession + autoRefreshToken + detectSessionInUrl
 *   * storageKey  — "nexora.auth.qwaehqsmodekbgvnaavz" so every Nexora app
 *                   mounted on one origin shares exactly one session slot
 *
 * This file mirrors the canonical factory in `packages/auth/src/client.ts`
 * (the Job Portal deploys standalone, so the contract is vendored here the
 * same way the other Sub-App integration packages vendor it).
 *
 * Configuration comes only from build-time Vite variables — never hard-coded,
 * and never a service-role key:
 *
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** The one shared Supabase project for the whole Nexora platform. */
export const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz';
export const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;
export const EXPECTED_SUPABASE_URL = `https://${EXPECTED_SUPABASE_HOSTNAME}`;
export const NEXORA_AUTH_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export type SupabaseConfigProblem =
  | 'missing-url'
  | 'missing-anon-key'
  | 'invalid-url'
  | 'insecure-url'
  | 'wrong-project'
  | 'malformed-key'
  | 'service-role-key';

/**
 * A service-role credential must never reach a browser bundle. New-format
 * secret keys self-identify by the `sb_secret_` prefix; legacy JWTs decode to
 * `{"role":"service_role"}` in their payload.
 */
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

/**
 * A publishable browser key is either the project's legacy anon JWT
 * (`eyJ…` with three non-empty segments) or a new-format publishable key
 * (`sb_publishable_…`). Anything else is a bad paste and is rejected.
 */
function looksLikeMalformedKey(key: string): boolean {
  if (/\s/.test(key)) return true;
  if (key.startsWith('sb_secret_')) return false; // reported as service-role-key
  if (key.startsWith('sb_publishable_')) return key.length <= 'sb_publishable_'.length;
  if (key.startsWith('eyJ')) {
    const segments = key.split('.');
    return segments.length !== 3 || segments.some((segment) => segment.length === 0);
  }
  return true;
}

function validateConfig(url: string, anonKey: string): SupabaseConfigProblem[] {
  const problems: SupabaseConfigProblem[] = [];

  if (!url) problems.push('missing-url');
  if (!anonKey) problems.push('missing-anon-key');

  let hostname = '';
  let protocol = '';
  if (url) {
    try {
      const parsed = new URL(url);
      hostname = parsed.hostname;
      protocol = parsed.protocol;
    } catch {
      problems.push('invalid-url');
    }
  }
  // Production must always be HTTPS.
  if (hostname && protocol !== 'https:') problems.push('insecure-url');
  // Pointing at a different project would silently fork the user directory.
  if (hostname && hostname !== EXPECTED_SUPABASE_HOSTNAME) problems.push('wrong-project');

  if (anonKey && looksLikeServiceRoleKey(anonKey)) {
    problems.push('service-role-key');
  } else if (anonKey && looksLikeMalformedKey(anonKey)) {
    problems.push('malformed-key');
  }

  return problems;
}

function describeProblems(problems: SupabaseConfigProblem[]): string {
  if (problems.length === 0) return 'Supabase configuration is valid.';
  const parts: string[] = [];
  if (problems.includes('missing-url')) parts.push('VITE_SUPABASE_URL is missing');
  if (problems.includes('missing-anon-key')) parts.push('VITE_SUPABASE_ANON_KEY is missing');
  if (problems.includes('invalid-url')) parts.push('VITE_SUPABASE_URL is not a valid URL');
  if (problems.includes('insecure-url')) parts.push('VITE_SUPABASE_URL must use https://');
  if (problems.includes('wrong-project')) {
    parts.push(`VITE_SUPABASE_URL does not point at the shared project ${EXPECTED_SUPABASE_HOSTNAME}`);
  }
  if (problems.includes('malformed-key')) {
    parts.push(
      "the configured key is malformed — expected the project's anon JWT (eyJ…) or publishable key (sb_publishable_…)",
    );
  }
  if (problems.includes('service-role-key')) {
    parts.push('the configured key is a service-role key and must never ship to a browser');
  }
  return `Nexora auth is not configured: ${parts.join('; ')}. Set VITE_SUPABASE_URL=${EXPECTED_SUPABASE_URL} and use the anon/publishable key of project ${SUPABASE_PROJECT_REF}.`;
}

/** Non-empty when this deployment is misconfigured. Safe to log; no secrets. */
export const supabaseConfigProblems: readonly SupabaseConfigProblem[] = validateConfig(
  supabaseUrl,
  supabaseAnonKey,
);
export const supabaseConfigErrorMessage = describeProblems([...supabaseConfigProblems]);

/**
 * The app remains usable in demo mode when the Supabase configuration is
 * absent or rejected. Production data/auth methods explicitly fail instead of
 * silently pretending that a request succeeded.
 */
export const isSupabaseConfigured = supabaseConfigProblems.length === 0;

if (!isSupabaseConfigured && supabaseUrl && typeof console !== 'undefined') {
  // One-line operator signal; contains no secrets.
  console.warn(`[Nexora auth] ${supabaseConfigErrorMessage}`);
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'nexora.auth.qwaehqsmodekbgvnaavz',
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
      global: { headers: { 'x-nexora-client': 'job-portal/phase2' } },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigErrorMessage);
  }

  return supabase;
}
