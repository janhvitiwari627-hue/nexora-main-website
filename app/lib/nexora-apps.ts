/**
 * Homepage Phase 1 — Section 02
 * ============================================================================
 * SIX-APP ROUTE CONTRACT — the single, authoritative description of every
 * Nexora application surface reachable from the Main Website.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before this contract the six apps were described in four different places
 * that could silently drift apart:
 *
 *   1. `app/lib/portalRoutes.ts`   — four `/app/*` portals only
 *   2. `app/lib/portalOrigins.ts`  — three mount paths only
 *   3. `next.config.ts`            — redirects (portals) + rewrites (static apps)
 *   4. `app/nexora-app.tsx`        — hand-written links inside the page body
 *
 * Job Portal and Distributors Beauty Industry appeared in NONE of the shared
 * route modules, so nothing could enumerate "all Nexora apps" safely. This
 * registry closes that gap.
 *
 * HARD GUARANTEES (Section 02 scope)
 * ----------------------------------
 *  - ADDITIVE ONLY. This module introduces no route, deletes no route and
 *    changes no routing behaviour. `next.config.ts`, `middleware.ts` and the
 *    app router remain the executing authority; this file only *describes*
 *    what they already do so other modules can read one source of truth.
 *  - Canonical `/app/*` paths are re-exported from `./portalRoutes`, never
 *    re-typed as string literals, so the two can never disagree.
 *  - NO ORIGINS ARE EMBEDDED HERE. Customer / Owner / Partner origins stay
 *    environment-only and fail closed in `config/portalOrigins.ts`. This
 *    registry records only the *names* of the environment variables so that
 *    operator tooling can report configuration without ever resolving a
 *    secret or a URL in client code.
 *  - No Supabase access, no auth mutation, no session read. Authorization
 *    remains `profiles.platform_role` enforced server-side.
 */

import {
  PORTAL_PATHS,
  TEMPLATE_PATH,
  type PortalKey,
  type PortalRole,
} from "./portalRoutes";

/** Stable identifier for each of the six Nexora applications. */
export type NexoraAppId =
  | "customer"
  | "owner"
  | "partner"
  | "template"
  | "job-portal"
  | "distributors-beauty-industry";

/**
 * How a route is served in production.
 *
 * `external-origin` — the app is deployed on its own Vercel origin and
 *   `next.config.ts` issues a 307 redirect. Vercel cannot reverse-proxy
 *   another `.vercel.app` deployment (that was the historical Partner
 *   HTTP 500), so a redirect is the only working mechanism.
 *
 * `static-mount` — the app is built into `public/<base>/` by a prebuild
 *   script and served through a `beforeFiles` rewrite on this origin.
 */
export type NexoraAppDelivery = "external-origin" | "static-mount";

/** Who may open the app's own surface once it loads. */
export type NexoraAppAudience = "public" | "role-gated";

export type NexoraAppDefinition = {
  /** Stable id. Never reuse or rename — other modules key off this. */
  readonly id: NexoraAppId;
  /** Product name exactly as the platform refers to the app. */
  readonly name: string;
  /** Short navigation label. */
  readonly shortName: string;
  /** One-line description of what the app does. */
  readonly description: string;
  /** Canonical entry route on the Main Website origin. */
  readonly route: string;
  readonly delivery: NexoraAppDelivery;
  readonly audience: NexoraAppAudience;
  /**
   * Authoritative platform role required by the destination app, or `null`
   * for public apps. Advisory metadata for navigation only — the real gate is
   * server-side RLS plus the access gates in `packages/auth/src/access.ts`.
   */
  readonly requiredRole: PortalRole | null;
  /**
   * Portal key used by `config/portalOrigins.ts` / the portal proxy route,
   * or `null` for apps served from this origin.
   */
  readonly portalKey: PortalKey | null;
  /**
   * Environment variables that configure this app's origin, in precedence
   * order. Names only — values are resolved server-side and never here.
   */
  readonly originEnvVars: readonly string[];
  /**
   * `true` when a missing origin must fail closed rather than fall back to a
   * built-in default. Mirrors REQUIRED_EXTERNAL_PORTALS.
   */
  readonly failsClosedWithoutOrigin: boolean;
};

/**
 * THE SIX NEXORA APPS.
 *
 * This array is the contract. Adding a seventh app is a deliberate, reviewed
 * change; removing any of these six is forbidden and is asserted by
 * `tests/homepage-phase1-section02-contract.test.mjs`.
 */
export const NEXORA_APPS = [
  {
    id: "customer",
    name: "Customer App",
    shortName: "Customer",
    description:
      "Find published salons, book services, and follow payment or refund status.",
    route: PORTAL_PATHS.customer,
    delivery: "external-origin",
    audience: "role-gated",
    requiredRole: "customer",
    portalKey: "customer",
    originEnvVars: ["NEXORA_CUSTOMER_PWA_ORIGIN"],
    failsClosedWithoutOrigin: true,
  },
  {
    id: "owner",
    name: "Shop Owner App",
    shortName: "Shop Owner",
    description:
      "Manage bookings, services, staff, offers, wallet and earnings for your own salon under RLS.",
    route: PORTAL_PATHS.business_user,
    delivery: "external-origin",
    audience: "role-gated",
    requiredRole: "business_user",
    portalKey: "owner",
    originEnvVars: ["NEXORA_OWNER_PWA_ORIGIN"],
    failsClosedWithoutOrigin: true,
  },
  {
    id: "partner",
    name: "Growth Partner App",
    shortName: "Growth Partner",
    description:
      "Prepare salon websites, track attribution, and view commission hold status.",
    route: PORTAL_PATHS.growth_partner,
    delivery: "external-origin",
    audience: "role-gated",
    requiredRole: "growth_partner",
    portalKey: "partner",
    originEnvVars: ["NEXORA_PARTNER_PWA_ORIGIN", "GROWTH_PARTNER_APP_ORIGIN"],
    failsClosedWithoutOrigin: true,
  },
  {
    id: "template",
    name: "Website Template App",
    shortName: "Templates",
    description:
      "The Owner website builder, opened on the same Shop Owner identity and salon workspace.",
    route: TEMPLATE_PATH,
    delivery: "external-origin",
    // Same identity as Shop Owner; a separate mount, not a separate role.
    audience: "role-gated",
    requiredRole: "business_user",
    portalKey: "template",
    originEnvVars: ["NEXORA_TEMPLATE_PWA_ORIGIN"],
    // Template resolves to its built-in origin when the variable is unset.
    failsClosedWithoutOrigin: false,
  },
  {
    id: "job-portal",
    name: "Nexora Job Portal",
    shortName: "Jobs",
    description:
      "Beauty-industry careers: browse jobs, apply, and manage interviews and offers.",
    route: "/job-portal",
    delivery: "static-mount",
    audience: "public",
    requiredRole: null,
    portalKey: null,
    originEnvVars: [],
    failsClosedWithoutOrigin: false,
  },
  {
    id: "distributors-beauty-industry",
    name: "Distributors Beauty Industry",
    shortName: "Distributors",
    description:
      "Browse verified wholesale distributors, brands and professional beauty products across India.",
    route: "/distributors-beauty-industry",
    delivery: "static-mount",
    audience: "public",
    requiredRole: null,
    portalKey: null,
    originEnvVars: [],
    failsClosedWithoutOrigin: false,
  },
] as const satisfies readonly NexoraAppDefinition[];

/** Exactly six apps. Asserted by contract tests. */
export const NEXORA_APP_COUNT = 6;

export const NEXORA_APP_IDS = NEXORA_APPS.map((app) => app.id) as readonly NexoraAppId[];

const APPS_BY_ID = new Map<NexoraAppId, NexoraAppDefinition>(
  NEXORA_APPS.map((app) => [app.id, app]),
);

/** Look up an app by id. Returns `null` for an unknown id (never throws). */
export function getNexoraApp(id: string): NexoraAppDefinition | null {
  return APPS_BY_ID.get(id as NexoraAppId) ?? null;
}

/** Normalize a pathname: strip query/hash and any trailing slashes. */
function normalizePath(pathname: string): string {
  const withoutHash = pathname.split("#", 1)[0];
  const withoutQuery = withoutHash.split("?", 1)[0];
  return withoutQuery.replace(/\/+$/, "") || "/";
}

/** True when `pathname` is the app's route or a path nested beneath it. */
export function isNexoraAppPath(app: NexoraAppDefinition, pathname: string): boolean {
  const path = normalizePath(pathname);
  const base = normalizePath(app.route);
  return path === base || path.startsWith(`${base}/`);
}

/**
 * Resolve which of the six apps owns `pathname`, or `null` for a Main Website
 * route. Longest matching route wins so nested bases can never be ambiguous.
 */
export function nexoraAppForPath(pathname: string): NexoraAppDefinition | null {
  let match: NexoraAppDefinition | null = null;
  for (const app of NEXORA_APPS) {
    if (!isNexoraAppPath(app, pathname)) continue;
    if (!match || app.route.length > match.route.length) match = app;
  }
  return match;
}

/** Apps whose destination requires a verified platform role. */
export function roleGatedApps(): readonly NexoraAppDefinition[] {
  return NEXORA_APPS.filter((app) => app.audience === "role-gated");
}

/** Apps any visitor may open without signing in. */
export function publicApps(): readonly NexoraAppDefinition[] {
  return NEXORA_APPS.filter((app) => app.audience === "public");
}

/**
 * Apps that a given platform role can open directly.
 *
 * Advisory only: it decides what navigation *offers*, never what the platform
 * *permits*. `admin` and `delivery_partner` see the public apps, matching the
 * existing `UnavailableAuthenticatedPortal` behaviour for their own mounts.
 */
export function appsForRole(role: PortalRole | null): readonly NexoraAppDefinition[] {
  if (!role) return publicApps();
  return NEXORA_APPS.filter((app) => app.audience === "public" || app.requiredRole === role);
}
