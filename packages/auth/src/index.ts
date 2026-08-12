/**
 * @nexora/auth — Phase 1 centralized Supabase auth for the Nexora platform.
 *
 * Import surface for every Nexora app:
 *
 *   import { AuthProvider, useAuth, getSupabaseClient } from "@nexora/auth";
 *
 * In this repository the same modules are reachable through
 * `app/lib/supabaseClient.ts` and `app/lib/auth/*` re-exports.
 */

export {
  SUPABASE_PROJECT_REF,
  EXPECTED_SUPABASE_HOSTNAME,
  EXPECTED_SUPABASE_URL,
  resolveSupabaseEnv,
  validateSupabaseEnv,
  describeSupabaseEnv,
  type SupabaseEnv,
  type SupabaseEnvOverrides,
  type SupabaseEnvProblem,
  type SupabaseEnvValidation,
  type SupabaseEnvSource,
} from "./env";

export {
  NEXORA_STORAGE_KEY,
  getSupabaseClient,
  requireSupabaseClient,
  isSupabaseConfigured,
  supabaseConfigErrorMessage,
  resetSupabaseClient,
  type NexoraClientOptions,
  type SupabaseClient,
} from "./client";

export {
  PLATFORM_ROLES,
  SELF_SERVICE_SIGNUP_ROLES,
  ROLE_LABELS,
  ROLE_HOME_PATHS,
  ROLE_QUERY_SLUGS,
  isPlatformRole,
  isSignupRole,
  normalizeRole,
  normalizeSignupRole,
  homePathForRole,
  roleQuerySlug,
  type PlatformRole,
  type SignupRole,
} from "./roles";

export {
  NexoraAuthError,
  toAuthError,
  authErrorMessage,
  neutralRecoveryMessage,
  type AuthErrorCode,
} from "./errors";

export {
  AUTH_ROUTES,
  DEFAULT_ALLOWED_AUTH_ORIGINS,
  allowedAuthOrigins,
  safeReturnPath,
  safeRedirectUrl,
  buildCallbackUrl,
  buildRecoveryUrl,
  buildLoginUrl,
  readAuthParams,
  supabaseRedirectAllowlist,
} from "./redirects";

export {
  resolveProfile,
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updatePassword,
  completeCodeExchange,
  signInWithOAuth,
  signOut,
  handoffTo,
  type NexoraProfile,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
} from "./session";

export {
  AUTH_SERVICE_CONTRACT_VERSION,
  AUTH_SERVICE_METHODS,
  createAuthService,
  type AuthService,
  type AuthServiceMethod,
  type AuthenticatedAccess,
} from "./service";

export {
  AuthProvider,
  useAuth,
  useRoleGuard,
  AuthContext,
  type AuthContextValue,
  type AuthProviderProps,
  type AuthStatus,
  type AuthErrorState,
} from "./AuthProvider";
