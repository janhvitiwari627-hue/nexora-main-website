"use client";

/**
 * Main Website binding for the shared Nexora auth package.
 *
 * Screens should import from here rather than reaching into `packages/auth`
 * directly, so the path stays stable if the package is later published to a
 * registry and consumed as `@nexora/auth`.
 */

export {
  // Provider + hooks
  AuthProvider,
  useAuth,
  useRoleGuard,
  // Client
  getSupabaseClient,
  requireSupabaseClient,
  isSupabaseConfigured,
  supabaseConfigErrorMessage,
  NEXORA_STORAGE_KEY,
  // Environment
  SUPABASE_PROJECT_REF,
  EXPECTED_SUPABASE_URL,
  EXPECTED_SUPABASE_HOSTNAME,
  describeSupabaseEnv,
  resolveSupabaseEnv,
  validateSupabaseEnv,
  // Roles
  PLATFORM_ROLES,
  SELF_SERVICE_SIGNUP_ROLES,
  ROLE_LABELS,
  ROLE_HOME_PATHS,
  isPlatformRole,
  isSignupRole,
  normalizeRole,
  normalizeSignupRole,
  homePathForRole,
  roleQuerySlug,
  // Redirects / PKCE
  AUTH_ROUTES,
  allowedAuthOrigins,
  buildCallbackUrl,
  buildLoginUrl,
  buildRecoveryUrl,
  readAuthParams,
  safeRedirectUrl,
  safeReturnPath,
  destinationForVerifiedRole,
  supabaseRedirectAllowlist,
  // Operations
  resolveProfile,
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updatePassword,
  completeCodeExchange,
  signOut,
  handoffTo,
  // Canonical Auth Service (contract 1.0.0)
  AUTH_SERVICE_CONTRACT_VERSION,
  AUTH_SERVICE_METHODS,
  createAuthService,
  // App-specific access gates (server-backed memberships)
  requireOwnerWorkspace,
  requirePartnerMembership,
  requireCustomerAccount,
  // Errors
  NexoraAuthError,
  toAuthError,
  authErrorMessage,
  neutralRecoveryMessage,
  // Types
  type AuthContextValue,
  type AuthErrorCode,
  type AuthErrorState,
  type AuthStatus,
  type AuthenticatedAccess,
  type AuthService,
  type OwnerWorkspaceAccess,
  type PartnerMembershipAccess,
  type CustomerAccountAccess,
  type NexoraProfile,
  type PlatformRole,
  type SignupRole,
  type SupabaseClient,
} from "../../../packages/auth/src";
