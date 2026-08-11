/**
 * Nexora — centralized Supabase client factory.
 *
 * One browser client per origin, per configuration. Every Nexora app builds
 * its client here so the auth options (PKCE, persistence, storage key) are
 * identical everywhere.
 *
 * WHY PKCE:
 *   The apps live on different origins, so a localStorage session cannot be
 *   shared between them. PKCE lets each origin complete its own secure code
 *   exchange against the shared project, which is the only correct way to
 *   establish a session cross-origin without ever moving tokens through a URL.
 *
 * WHY A NAMESPACED STORAGE KEY:
 *   When two Nexora apps are mounted on the SAME origin (the website proxies
 *   the PWAs under /app/*), a shared default storage key makes them fight over
 *   one session slot. `storageKey` is derived from the project ref so all
 *   Nexora surfaces on one origin intentionally share exactly one session,
 *   and never collide with an unrelated Supabase app on that origin.
 */

import { createClient, type SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import { NexoraAuthError } from "./errors";
import {
  EXPECTED_SUPABASE_URL,
  SUPABASE_PROJECT_REF,
  resolveSupabaseEnv,
  validateSupabaseEnv,
  type SupabaseEnv,
  type SupabaseEnvOverrides,
} from "./env";

export const NEXORA_STORAGE_KEY = `nexora.auth.${SUPABASE_PROJECT_REF}`;

export type NexoraClientOptions = SupabaseEnvOverrides & {
  /**
   * Allow a non-shared project. Defaults to false: pointing an app at another
   * project silently forks the user directory, which Phase 1 forbids.
   * Only tests and local forks should set this.
   */
  allowForeignProject?: boolean;
  /** Extra supabase-js options merged over the Nexora defaults. */
  clientOptions?: SupabaseClientOptions<"public">;
};

let cachedClient: SupabaseClient | null = null;
let cachedKey = "";

function buildClient(env: SupabaseEnv, options: NexoraClientOptions): SupabaseClient {
  const extra = options.clientOptions ?? {};
  return createClient(env.url, env.anonKey, {
    ...extra,
    auth: {
      // Session survives reloads and app re-mounts on this origin.
      persistSession: true,
      autoRefreshToken: true,
      // Required for the /auth/callback code exchange and recovery links.
      detectSessionInUrl: true,
      // PKCE is mandatory: implicit flow puts tokens in the URL fragment.
      flowType: "pkce",
      storageKey: NEXORA_STORAGE_KEY,
      ...(extra.auth ?? {}),
    },
    global: {
      ...(extra.global ?? {}),
      headers: {
        "x-nexora-client": "nexora-auth/1",
        ...(extra.global?.headers ?? {}),
      },
    },
  });
}

/**
 * Get the shared Supabase client, or `null` when this deployment is not
 * correctly configured.
 *
 * Returning `null` (instead of throwing) is deliberate: the public website
 * must still render salons and marketing content when auth is misconfigured.
 * Auth-dependent screens call `requireSupabaseClient()` instead.
 */
export function getSupabaseClient(options: NexoraClientOptions = {}): SupabaseClient | null {
  const env = resolveSupabaseEnv(options);
  const validation = validateSupabaseEnv(env, { strictProject: !options.allowForeignProject });
  if (!validation.valid) {
    if (typeof console !== "undefined" && env.url) {
      // One-line operator signal; contains no secrets.
      console.warn(`[Nexora auth] ${validation.message}`);
    }
    return null;
  }

  const cacheKey = `${env.url}::${env.anonKey}`;
  if (cachedClient && cachedKey === cacheKey) return cachedClient;
  cachedClient = buildClient(env, options);
  cachedKey = cacheKey;
  return cachedClient;
}

/** Same as `getSupabaseClient`, but throws a typed error when unconfigured. */
export function requireSupabaseClient(options: NexoraClientOptions = {}): SupabaseClient {
  const client = getSupabaseClient(options);
  if (client) return client;
  throw new NexoraAuthError("not_configured", supabaseConfigErrorMessage(options), { retryable: false });
}

export function isSupabaseConfigured(options: NexoraClientOptions = {}): boolean {
  return getSupabaseClient(options) !== null;
}

/** Operator-facing configuration error, safe to show in an admin banner. */
export function supabaseConfigErrorMessage(options: NexoraClientOptions = {}): string {
  return validateSupabaseEnv(resolveSupabaseEnv(options), {
    strictProject: !options.allowForeignProject,
  }).message;
}

/** Test seam: drop the memoized client. */
export function resetSupabaseClient(): void {
  cachedClient = null;
  cachedKey = "";
}

export { EXPECTED_SUPABASE_URL, SUPABASE_PROJECT_REF };
export type { SupabaseClient };
