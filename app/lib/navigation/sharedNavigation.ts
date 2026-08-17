/**
 * Homepage Phase 1 — Section 02
 * ============================================================================
 * SHARED NAVIGATION CONTRACT — data only, no components, no JSX.
 *
 * Section 02 deliberately stops at the data layer. This module answers
 * "what should navigation offer right now?" and nothing else. It renders no
 * markup, mounts no header, and changes no existing UI — building the Header
 * is a later section.
 *
 * DESIGN RULES
 * ------------
 *  1. Every destination comes from the six-app route contract
 *     (`app/lib/nexora-apps.ts`) or from the canonical `AUTH_ROUTES` in
 *     `packages/auth`. No route string is invented here.
 *  2. Auth input is the read-only projection from `app/lib/auth/authState.ts`.
 *     Navigation never reads Supabase, never reads storage, and never decides
 *     authorization — visibility is presentation, RLS is enforcement.
 *  3. Pure functions only. No side effects, no navigation performed; callers
 *     decide how to travel (`navigate()` for same-origin SPA routes,
 *     `window.location.assign()` for redirect/static mounts).
 */

import { AUTH_ROUTES } from "../../../packages/auth/src";
import type { NexoraAuthState } from "../auth/authState";
import {
  NEXORA_APPS,
  appsForRole,
  type NexoraAppDefinition,
  type NexoraAppId,
} from "../nexora-apps";
import type { PortalRole } from "../portalRoutes";

/** Where a navigation item points, semantically. */
export type NavKind =
  /** Same-origin Main Website route — safe for SPA `navigate()`. */
  | "site"
  /** One of the six apps — may leave this origin (redirect or static mount). */
  | "app"
  /** Canonical auth route. */
  | "auth";

export type NavItem = {
  /** Stable id for keys, analytics and tests. */
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly kind: NavKind;
  /**
   * `true` when following this item may leave the Next app router (an
   * external-origin redirect or a statically mounted app). Callers must use a
   * full document navigation rather than `history.pushState`.
   */
  readonly leavesRouter: boolean;
  /** Present for `kind: "app"` items. */
  readonly appId?: NexoraAppId;
  /** Advisory description for tooltips / cards. */
  readonly description?: string;
};

/** Marketplace destinations on the Main Website itself. */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { id: "explore", label: "Explore", href: "/salons", kind: "site", leavesRouter: false },
  { id: "salons", label: "Salons", href: "/salons", kind: "site", leavesRouter: false },
] as const;

function toNavItem(app: NexoraAppDefinition): NavItem {
  return {
    id: `app:${app.id}`,
    label: app.shortName,
    href: app.route,
    kind: "app",
    // Both external-origin redirects and static mounts exit the Next router.
    leavesRouter: true,
    appId: app.id,
    description: app.description,
  };
}

/** Every one of the six apps as a navigation item, in contract order. */
export function allAppNavItems(): readonly NavItem[] {
  return NEXORA_APPS.map(toNavItem);
}

/**
 * App items appropriate for the current viewer.
 *
 * Signed out (or still initializing) shows only the public apps, so nothing
 * flashes a role-gated destination before the session settles. Roles without
 * a mounted app of their own (`admin`, `delivery_partner`) also see the
 * public set, matching today's `UnavailableAuthenticatedPortal` behaviour.
 */
export function appNavItemsForAuthState(auth: NexoraAuthState): readonly NavItem[] {
  if (!auth.isAuthenticated || auth.isLoading) {
    return NEXORA_APPS.filter((app) => app.audience === "public").map(toNavItem);
  }
  return appsForRole(auth.role as PortalRole | null).map(toNavItem);
}

/**
 * Auth-area items.
 *
 * Signed out → Log in / Sign up. Signed in → the role's canonical app home
 * plus the canonical logout route. Logout is exposed as the shared
 * `AUTH_ROUTES.logout` path, never as a direct `signOut()` call, so that the
 * existing logout screen keeps owning session teardown.
 *
 * Returns an empty list while initializing so navigation cannot briefly show
 * "Log in" to an already-authenticated user.
 */
export function authNavItemsForAuthState(auth: NexoraAuthState): readonly NavItem[] {
  if (auth.isLoading) return [];

  if (!auth.isAuthenticated) {
    return [
      { id: "auth:login", label: "Log in", href: AUTH_ROUTES.login, kind: "auth", leavesRouter: false },
      { id: "auth:signup", label: "Sign up", href: AUTH_ROUTES.signup, kind: "auth", leavesRouter: false },
    ];
  }

  const items: NavItem[] = [];
  if (auth.homePath) {
    items.push({
      id: "auth:home",
      label: auth.roleLabel ? `${auth.roleLabel} app` : "My app",
      href: auth.homePath,
      kind: "app",
      leavesRouter: true,
    });
  }
  items.push({
    id: "auth:logout",
    label: "Log out",
    href: AUTH_ROUTES.logout,
    kind: "auth",
    leavesRouter: false,
  });
  return items;
}

/** Complete navigation model for one render. */
export type SharedNavigationModel = {
  readonly primary: readonly NavItem[];
  readonly apps: readonly NavItem[];
  readonly auth: readonly NavItem[];
  /** Name to greet the viewer with, or `null`. */
  readonly accountName: string | null;
  /** Role label for the account chip, or `null`. */
  readonly accountRoleLabel: string | null;
  /** True while auth is settling — render neutral chrome, no auth actions. */
  readonly isLoading: boolean;
};

/** Build the full navigation model from the read-only auth projection. */
export function buildSharedNavigation(auth: NexoraAuthState): SharedNavigationModel {
  return {
    primary: PRIMARY_NAV_ITEMS,
    apps: appNavItemsForAuthState(auth),
    auth: authNavItemsForAuthState(auth),
    accountName: auth.isAuthenticated ? auth.displayName : null,
    accountRoleLabel: auth.isAuthenticated ? auth.roleLabel : null,
    isLoading: auth.isLoading,
  };
}
