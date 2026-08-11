/**
 * Nexora — centralized Supabase environment resolution.
 *
 * PHASE 1 CONTRACT
 * ----------------
 * Every Nexora surface (Main Website, Customer PWA, Shop Owner PWA, Growth
 * Partner PWA, Delivery PWA, Job Portal) MUST resolve to the *same* Supabase
 * project so that `auth.users` identities are literally the same rows.
 *
 * This module is the single place that decides which project the running
 * bundle talks to. It supports both build systems used across the ecosystem:
 *
 *   Next / vinext  →  process.env.NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY
 *   Vite PWAs      →  import.meta.env.VITE_SUPABASE_URL / _ANON_KEY
 *
 * Only the anon/publishable key is ever read here. A service-role key must
 * never reach a browser bundle.
 */

/** The one shared Supabase project for the whole Nexora platform. */
export const SUPABASE_PROJECT_REF = "qwaehqsmodekbgvnaavz";
export const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;
export const EXPECTED_SUPABASE_URL = `https://${EXPECTED_SUPABASE_HOSTNAME}`;

export type SupabaseEnvSource = "explicit" | "next-public" | "vite" | "none";

export type SupabaseEnv = {
  url: string;
  anonKey: string;
  /** Where the values came from — surfaced in diagnostics, never in the UI. */
  source: SupabaseEnvSource;
};

export type SupabaseEnvOverrides = {
  url?: string;
  anonKey?: string;
};

/** Read `process.env` without exploding in browser bundles that lack it. */
function processEnv(): Record<string, string | undefined> {
  try {
    if (typeof process === "undefined" || !process || typeof process.env !== "object") return {};
    return process.env as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

/**
 * Read the Vite build-time variables.
 *
 * Each key MUST be accessed as a complete static expression
 * (`import.meta.env.VITE_SUPABASE_URL`). Vite replaces those literally at
 * build time and its dev module-runner throws on dynamic access such as
 * `meta.env[key]` or spreading `meta.env`. The whole block is wrapped because
 * `import.meta.env` is undefined under Next/webpack and in plain Node.
 */
function viteEnv(): { url: string; anonKey: string } {
  let url = "";
  let anonKey = "";
  try {
    // @ts-expect-error — `import.meta.env` only exists in Vite builds.
    url = clean(import.meta.env?.VITE_SUPABASE_URL);
  } catch {
    url = "";
  }
  try {
    // @ts-expect-error — `import.meta.env` only exists in Vite builds.
    anonKey = clean(import.meta.env?.VITE_SUPABASE_ANON_KEY);
    if (!anonKey) {
      // @ts-expect-error — `import.meta.env` only exists in Vite builds.
      anonKey = clean(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY);
    }
  } catch {
    anonKey = "";
  }
  return { url, anonKey };
}

function clean(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolve the Supabase connection for the current runtime.
 *
 * Precedence: explicit overrides → NEXT_PUBLIC_* → VITE_*. Overrides exist so
 * a host app (or a test) can inject configuration without touching globals.
 */
export function resolveSupabaseEnv(overrides: SupabaseEnvOverrides = {}): SupabaseEnv {
  const explicitUrl = clean(overrides.url);
  const explicitKey = clean(overrides.anonKey);
  if (explicitUrl && explicitKey) {
    return { url: explicitUrl, anonKey: explicitKey, source: "explicit" };
  }

  const nodeEnv = processEnv();
  const nextUrl = clean(nodeEnv.NEXT_PUBLIC_SUPABASE_URL);
  const nextKey = clean(nodeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (nextUrl && nextKey) {
    return { url: nextUrl, anonKey: nextKey, source: "next-public" };
  }

  const { url: viteUrl, anonKey: viteKey } = viteEnv();
  if (viteUrl && viteKey) {
    return { url: viteUrl, anonKey: viteKey, source: "vite" };
  }

  // Partial configuration is reported as-is so diagnostics can say exactly
  // which half is missing instead of a generic "not configured".
  return {
    url: explicitUrl || nextUrl || viteUrl,
    anonKey: explicitKey || nextKey || viteKey,
    source: "none",
  };
}

export type SupabaseEnvProblem =
  | "missing-url"
  | "missing-anon-key"
  | "invalid-url"
  | "wrong-project"
  | "service-role-key";

export type SupabaseEnvValidation = {
  valid: boolean;
  problems: SupabaseEnvProblem[];
  /** Operator-facing message. Safe to log; contains no secrets. */
  message: string;
  env: SupabaseEnv;
};

/**
 * A service-role JWT decodes to `{"role":"service_role"}`. We do not decode
 * the token (it may be a non-JWT publishable key); we only reject the obvious
 * mistake of pasting a key that self-identifies as privileged.
 */
function looksLikeServiceRoleKey(key: string): boolean {
  if (!key.startsWith("eyJ")) return false;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof atob === "function"
        ? atob(normalized)
        : Buffer.from(normalized, "base64").toString("utf8");
    return /"role"\s*:\s*"service_role"/.test(decoded);
  } catch {
    return false;
  }
}

/**
 * Validate that this deployment points at the shared project with a public key.
 *
 * `strictProject` (default true) is what guarantees cross-app identity
 * sharing: a bundle configured against a different project is treated as
 * unconfigured rather than silently creating a parallel user directory.
 */
export function validateSupabaseEnv(
  env: SupabaseEnv = resolveSupabaseEnv(),
  options: { strictProject?: boolean } = {},
): SupabaseEnvValidation {
  const strictProject = options.strictProject !== false;
  const problems: SupabaseEnvProblem[] = [];

  if (!env.url) problems.push("missing-url");
  if (!env.anonKey) problems.push("missing-anon-key");

  let hostname = "";
  if (env.url) {
    try {
      hostname = new URL(env.url).hostname;
    } catch {
      problems.push("invalid-url");
    }
  }
  if (hostname && strictProject && hostname !== EXPECTED_SUPABASE_HOSTNAME) {
    problems.push("wrong-project");
  }
  if (env.anonKey && looksLikeServiceRoleKey(env.anonKey)) {
    problems.push("service-role-key");
  }

  return {
    valid: problems.length === 0,
    problems,
    message: describeEnvProblems(problems, hostname),
    env,
  };
}

function describeEnvProblems(problems: SupabaseEnvProblem[], hostname: string): string {
  if (problems.length === 0) return "Supabase configuration is valid.";
  const parts: string[] = [];
  if (problems.includes("missing-url")) parts.push("SUPABASE_URL is missing");
  if (problems.includes("missing-anon-key")) parts.push("SUPABASE_ANON_KEY is missing");
  if (problems.includes("invalid-url")) parts.push("SUPABASE_URL is not a valid URL");
  if (problems.includes("wrong-project")) {
    parts.push(
      `SUPABASE_URL points at ${hostname || "an unknown host"} instead of the shared project ${EXPECTED_SUPABASE_HOSTNAME}`,
    );
  }
  if (problems.includes("service-role-key")) {
    parts.push("the configured key is a service-role key and must never ship to a browser");
  }
  return `Nexora auth is not configured: ${parts.join("; ")}. Set the URL to ${EXPECTED_SUPABASE_URL} and use the anon/publishable key of project ${SUPABASE_PROJECT_REF}.`;
}

/** Non-secret snapshot for health endpoints and support tooling. */
export function describeSupabaseEnv(env: SupabaseEnv = resolveSupabaseEnv()) {
  const validation = validateSupabaseEnv(env);
  return {
    configured: validation.valid,
    url: env.url || EXPECTED_SUPABASE_URL,
    hasAnonKey: Boolean(env.anonKey),
    anonKeyFingerprint: env.anonKey ? `${env.anonKey.slice(0, 6)}…${env.anonKey.slice(-4)}` : "",
    source: env.source,
    projectRef: SUPABASE_PROJECT_REF,
    expectedHostname: EXPECTED_SUPABASE_HOSTNAME,
    problems: validation.problems,
    message: validation.message,
  };
}
