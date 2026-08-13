/**
 * Nexora — central auth redirect / PKCE redirect-target policy.
 *
 * THE CROSS-ORIGIN PROBLEM
 * ------------------------
 * Each Nexora PWA runs on its own origin. A Supabase session lives in that
 * origin's localStorage, so signing in on the website does NOT create a
 * session inside the Customer PWA. Tokens must never be copied across origins
 * through a URL — that leaks credentials into history, logs and referrers.
 *
 * THE MODEL
 * ---------
 * 1. The Main Website hosts the central auth surface: /auth/login, /auth/signup,
 *    /auth/callback, /auth/forgot-password, /auth/reset-password. Legacy
 *    compatibility routes (/login, /signup, /forgot-password, /reset-password)
 *    remain on the Main Website only.
 * 2. `returnTo` accepts only an internal path on the current origin. Canonical
 *    `/app/*` routes perform the separately configured PWA handoff server-side.
 * 3. Absolute, protocol-relative and malformed destinations are rejected.
 *
 * Every URL in `redirectTo` must also be registered in
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 */

import { homePathForRole, type PlatformRole } from "./roles";

/** Paths that make up the central auth surface on the Main Website. */
export const AUTH_ROUTES = {
  login: "/auth/login",
  signup: "/auth/signup",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verify: "/auth/verify",
  callback: "/auth/callback",
  logout: "/auth/logout",
  continue: "/auth/continue",
  expired: "/auth/expired",
} as const;

/**
 * Origins allowed to receive an authenticated redirect.
 *
 * No production origins are built in. Deployments configure their Supabase
 * callback origins explicitly; this list remains exported for compatibility.
 */
export const DEFAULT_ALLOWED_AUTH_ORIGINS: readonly string[] = [];

function readCsvEnv(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function envAllowedOrigins(): string[] {
  const origins: string[] = [];
  try {
    // Static member access so Next/webpack inlines the allowlist in the browser.
    origins.push(
      ...readCsvEnv(
        typeof process !== "undefined" ? process.env.NEXT_PUBLIC_NEXORA_ALLOWED_AUTH_ORIGINS : "",
      ),
    );
  } catch {
    /* Next/Node env unavailable */
  }
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      ?.VITE_NEXORA_ALLOWED_AUTH_ORIGINS;
    origins.push(...readCsvEnv(vite));
  } catch {
    /* Vite env unavailable (Next/tsc) */
  }
  return origins;
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // Plain http is only ever acceptable for local development.
    if (url.protocol === "http:" && !isLocalHostname(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Callback allowlist metadata: configured origins plus the current origin. */
export function allowedAuthOrigins(currentOrigin?: string): string[] {
  const origins = new Set<string>();
  for (const candidate of [...DEFAULT_ALLOWED_AUTH_ORIGINS, ...envAllowedOrigins()]) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) origins.add(normalized);
  }
  const self = currentOrigin ?? browserOrigin();
  if (self) {
    const normalized = normalizeOrigin(self);
    // An app is always allowed to redirect back to itself.
    if (normalized) origins.add(normalized);
  }
  return [...origins];
}

function browserOrigin(): string {
  return typeof window !== "undefined" && window.location ? window.location.origin : "";
}

/**
 * Validate a same-origin redirect path.
 *
 * Rejects protocol-relative (`//evil.com`), backslash-smuggled, and absolute
 * URLs. Query strings are preserved (PWAs need deep-link context), but a
 * fragment is dropped because Supabase uses the fragment on some flows.
 */
export function safeReturnPath(candidate: string | null | undefined, fallback = "/"): string {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/+\s*javascript:/i.test(value)) return fallback;
  return value.split("#")[0] || fallback;
}

/**
 * After a verified login, honor any safe same-origin `returnTo`.
 *
 * Every authenticated role may resume any shell (`/app/customer`,
 * `/app/owner`, `/app/partner`, `/app/template`, public pages). Role-home
 * is only the fallback when `returnTo` is missing or unsafe. Data access
 * stays on RLS — this function never grants a role.
 */
export function destinationForVerifiedRole(
  role: PlatformRole,
  requestedReturnTo: string | null | undefined,
): string {
  return safeReturnPath(requestedReturnTo, homePathForRole(role));
}

/**
 * Validate a redirect URL against the current origin only.
 */
export function safeRedirectUrl(
  candidate: string | null | undefined,
  options: { currentOrigin?: string } = {},
): string | null {
  if (!candidate) return null;
  const currentOrigin = options.currentOrigin ?? browserOrigin();
  const value = candidate.trim();

  // Relative target → resolve against the current origin.
  if (value.startsWith("/") && !value.startsWith("//")) {
    if (!currentOrigin) return safeReturnPath(value, "/");
    return new URL(safeReturnPath(value, "/"), currentOrigin).toString();
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalHostname(parsed.hostname))) {
    return null;
  }
  const normalizedCurrentOrigin = normalizeOrigin(currentOrigin);
  if (!normalizedCurrentOrigin || parsed.origin !== normalizedCurrentOrigin) return null;
  parsed.hash = "";
  return parsed.toString();
}

/**
 * Build the `redirectTo` passed to Supabase for signup confirmation, magic
 * links and OAuth. Always points at the central callback on THIS origin, with
 * the validated final destination carried in `returnTo`.
 */
export function buildCallbackUrl(
  options: { returnTo?: string | null; origin?: string; role?: string } = {},
): string {
  const origin = options.origin ?? browserOrigin();
  const base = `${origin}${AUTH_ROUTES.callback}`;
  const url = new URL(base);
  const returnTo = options.returnTo ? safeRedirectUrl(options.returnTo, { currentOrigin: origin }) : null;
  if (returnTo) {
    // Same-origin destinations travel as a path, cross-origin as a full URL.
    const parsed = new URL(returnTo);
    url.searchParams.set("returnTo", parsed.origin === origin ? `${parsed.pathname}${parsed.search}` : returnTo);
  }
  if (options.role) url.searchParams.set("role", options.role);
  return url.toString();
}

/** Build the password-recovery landing URL (must be allowlisted in Supabase). */
export function buildRecoveryUrl(options: { origin?: string } = {}): string {
  const origin = options.origin ?? browserOrigin();
  return `${origin}${AUTH_ROUTES.resetPassword}`;
}

/**
 * Build a link to the central login for an app that needs a session.
 * Used by a PWA (or a guarded route) to bounce an anonymous visitor.
 */
export function buildLoginUrl(
  options: { returnTo?: string | null; role?: string; origin?: string; centralOrigin?: string } = {},
): string {
  const origin = options.origin ?? browserOrigin();
  const centralOrigin = options.centralOrigin ?? origin;
  const url = new URL(`${centralOrigin}${AUTH_ROUTES.login}`);
  if (options.role) url.searchParams.set("role", options.role);
  const returnTo = options.returnTo ? safeRedirectUrl(options.returnTo, { currentOrigin: origin }) : null;
  if (returnTo) {
    const parsed = new URL(returnTo);
    url.searchParams.set(
      "returnTo",
      parsed.origin === centralOrigin ? `${parsed.pathname}${parsed.search}` : returnTo,
    );
  }
  // Same-origin central login → return a path so client routers can push it.
  return centralOrigin === origin ? `${url.pathname}${url.search}` : url.toString();
}

/** Read auth-related query params from the current URL (or a provided one). */
export function readAuthParams(href?: string): {
  code: string | null;
  role: string | null;
  returnTo: string | null;
  reason: string | null;
  error: string | null;
} {
  const target = href ?? (typeof window !== "undefined" ? window.location.href : "");
  if (!target) return { code: null, role: null, returnTo: null, reason: null, error: null };
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return { code: null, role: null, returnTo: null, reason: null, error: null };
  }
  const params = url.searchParams;
  return {
    code: params.get("code"),
    role: params.get("role"),
    returnTo: params.get("returnTo"),
    reason: params.get("reason"),
    error: params.get("error_description") ?? params.get("error"),
  };
}

/**
 * Documentation helper: the exact list to paste into
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function supabaseRedirectAllowlist(currentOrigin?: string): string[] {
  const paths = [AUTH_ROUTES.callback, AUTH_ROUTES.resetPassword];
  return allowedAuthOrigins(currentOrigin).flatMap((origin) => paths.map((path) => `${origin}${path}`));
}
