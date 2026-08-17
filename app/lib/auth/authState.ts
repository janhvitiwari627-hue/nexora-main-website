/**
 * Homepage Phase 1 — Section 02
 * ============================================================================
 * SHARED AUTH-STATE CONTRACT (pure projection — no React, no Supabase).
 *
 * WHAT THIS IS
 * ------------
 * A small, stable, READ-ONLY view of the auth state that shared navigation is
 * allowed to depend on. Navigation must never reach into `AuthProvider`
 * internals, never call Supabase, and never make an authorization decision.
 *
 * WHAT THIS IS NOT
 * ----------------
 *  - Not a second auth system. `packages/auth` (AuthProvider + the canonical
 *    Auth Service) remains the one and only auth authority; this file is a
 *    downstream projection of what that provider already published.
 *  - Not an authorization gate. `isAuthenticated` / `role` here are display
 *    inputs. Real access is enforced server-side by RLS and by the gates in
 *    `packages/auth/src/access.ts`.
 *  - Not a session store. Nothing here reads or writes localStorage,
 *    sessionStorage or cookies, and nothing here can sign a user out.
 *
 * Deliberately React-free so it can be unit-tested in plain Node and imported
 * by server components. The React hook lives in `./useNexoraAuthState.ts`.
 */

import type { PlatformRole } from "../../../packages/auth/src";
import { ROLE_LABELS, homePathForRole } from "../../../packages/auth/src";

/** Mirrors `AuthStatus` from the shared provider. */
export type NexoraAuthStatus = "initializing" | "authenticated" | "anonymous" | "unconfigured";

/**
 * The complete surface shared navigation may consume. Intentionally tiny:
 * every field is derived, none is authoritative.
 */
export type NexoraAuthState = {
  readonly status: NexoraAuthStatus;
  /** True until the first session resolution settles. Render neutrally. */
  readonly isLoading: boolean;
  /** True only for a live session WITH an active server-side profile. */
  readonly isAuthenticated: boolean;
  /** Authoritative role from `profiles.platform_role`, or `null`. */
  readonly role: PlatformRole | null;
  /** Human label for `role` ("Shop Owner"), or `null`. */
  readonly roleLabel: string | null;
  /** Display name for account UI. Never an email address. */
  readonly displayName: string | null;
  /** Canonical app home for `role`, or `null` when signed out. */
  readonly homePath: string | null;
  /** True when this deployment has no usable Supabase configuration. */
  readonly isUnconfigured: boolean;
};

/** Signed-out default. Also the safe fallback for any unexpected input. */
export const ANONYMOUS_AUTH_STATE: NexoraAuthState = {
  status: "anonymous",
  isLoading: false,
  isAuthenticated: false,
  role: null,
  roleLabel: null,
  displayName: null,
  homePath: null,
  isUnconfigured: false,
};

/**
 * The subset of `AuthContextValue` this projection reads.
 *
 * Structural rather than an import of `AuthContextValue` itself, so the auth
 * package can grow new members without ever being forced to satisfy
 * navigation, and so this module stays testable without React.
 */
export type AuthStateSource = {
  status?: unknown;
  loading?: unknown;
  isAuthenticated?: unknown;
  role?: unknown;
  profile?: { fullName?: unknown; isActive?: unknown } | null;
  configError?: unknown;
};

const STATUSES: readonly NexoraAuthStatus[] = [
  "initializing",
  "authenticated",
  "anonymous",
  "unconfigured",
];

function readStatus(value: unknown): NexoraAuthStatus {
  return STATUSES.includes(value as NexoraAuthStatus)
    ? (value as NexoraAuthStatus)
    : "anonymous";
}

function readRole(value: unknown): PlatformRole | null {
  // Only a value the provider already resolved from the server profile is
  // accepted. No alias normalization happens here on purpose: normalizing a
  // client-supplied string is exactly how a URL could try to imply a role.
  return typeof value === "string" && value in ROLE_LABELS ? (value as PlatformRole) : null;
}

function readDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Never surface an email address in navigation chrome.
  if (trimmed.includes("@")) return null;
  return trimmed;
}

/**
 * Project the shared auth context into the navigation-facing state.
 *
 * Fails closed in every ambiguous case: anything that is not a settled,
 * authenticated session with an active profile and a recognised role is
 * reported as signed out.
 */
export function projectAuthState(source: AuthStateSource | null | undefined): NexoraAuthState {
  if (!source) return ANONYMOUS_AUTH_STATE;

  const status = readStatus(source.status);
  const isLoading = status === "initializing" || source.loading === true;
  const isUnconfigured = status === "unconfigured" || typeof source.configError === "string";

  const profileActive = source.profile ? source.profile.isActive !== false : false;
  const role = readRole(source.role);

  // Fail closed: a session is authenticated for navigation purposes only when
  // the provider says so AND an active profile carrying a known role exists.
  const isAuthenticated =
    status === "authenticated" && source.isAuthenticated === true && profileActive && role !== null;

  if (!isAuthenticated) {
    return {
      ...ANONYMOUS_AUTH_STATE,
      status: isLoading ? "initializing" : isUnconfigured ? "unconfigured" : status,
      isLoading,
      isUnconfigured,
    };
  }

  return {
    status: "authenticated",
    isLoading: false,
    isAuthenticated: true,
    role,
    roleLabel: ROLE_LABELS[role],
    displayName: readDisplayName(source.profile?.fullName),
    homePath: homePathForRole(role),
    isUnconfigured: false,
  };
}
