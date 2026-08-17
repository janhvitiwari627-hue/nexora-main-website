/**
 * Homepage Phase 1 — Section 02
 *
 * Stable import surface for the shared navigation contract. Consumers import
 * from `app/lib/navigation` so the internal file layout can change later
 * without touching call sites.
 *
 * Data only. No components are exported here — the Header is a later section.
 */

export {
  PRIMARY_NAV_ITEMS,
  allAppNavItems,
  appNavItemsForAuthState,
  authNavItemsForAuthState,
  buildSharedNavigation,
  type NavItem,
  type NavKind,
  type SharedNavigationModel,
} from "./sharedNavigation";

export {
  NEXORA_APPS,
  NEXORA_APP_COUNT,
  NEXORA_APP_IDS,
  appsForRole,
  getNexoraApp,
  isNexoraAppPath,
  nexoraAppForPath,
  publicApps,
  roleGatedApps,
  type NexoraAppAudience,
  type NexoraAppDefinition,
  type NexoraAppDelivery,
  type NexoraAppId,
} from "../nexora-apps";

export {
  ANONYMOUS_AUTH_STATE,
  projectAuthState,
  type AuthStateSource,
  type NexoraAuthState,
  type NexoraAuthStatus,
} from "../auth/authState";
