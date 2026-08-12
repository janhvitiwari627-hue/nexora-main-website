"use client";

/**
 * Nexora — shared Auth Provider / Context.
 *
 * Drop this at the root of any Nexora React app (Main Website or a PWA). It
 * owns exactly one auth state machine per origin:
 *
 *   initializing → authenticated | anonymous | unconfigured | error
 *
 * Responsibilities:
 *  - restore a persisted session on boot (session persistence)
 *  - subscribe to `onAuthStateChange` (multi-tab + token refresh)
 *  - resolve the server-side profile that carries the authoritative role
 *  - fail closed: a session without an active profile is signed out
 *  - expose login / signup / recovery / PKCE-callback helpers
 *
 * It renders no UI of its own, so it composes with any design system.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseClient, supabaseConfigErrorMessage, type NexoraClientOptions } from "./client";
import { NexoraAuthError, toAuthError, type AuthErrorCode } from "./errors";
import { homePathForRole, type PlatformRole } from "./roles";
import { createAuthService, type AuthenticatedAccess } from "./service";
import {
  resolveProfile,
  signInWithOAuth as oauthSignIn,
  signOut as endSession,
  type NexoraProfile,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
} from "./session";

export type AuthStatus = "initializing" | "authenticated" | "anonymous" | "unconfigured";

export type AuthErrorState = {
  code: AuthErrorCode;
  message: string;
  retryable: boolean;
} | null;

export type AuthContextValue = {
  status: AuthStatus;
  /** True until the first session resolution settles. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: NexoraProfile | null;
  /** Authoritative role from `profiles.platform_role`, never from a URL. */
  role: PlatformRole | null;
  error: AuthErrorState;
  /** Configuration problem, if any. Operator-facing. */
  configError: string | null;
  isAuthenticated: boolean;

  signIn: (input: SignInInput) => Promise<NexoraProfile>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signInWithGoogle: (options?: { returnTo?: string | null; role?: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  getCurrentUser: () => Promise<User>;
  getSession: () => Promise<Session | null>;
  refreshSession: () => Promise<Session | null>;
  handleAuthCallback: (href?: string) => Promise<NexoraProfile>;
  requireAuth: () => Promise<AuthenticatedAccess>;
  requireRole: (allowed: PlatformRole | PlatformRole[]) => Promise<AuthenticatedAccess>;
  signOut: () => Promise<void>;
  /**
   * Phase 2 compatibility aliases. Do not remove until every external
   * consumer has migrated to the canonical names above.
   */
  setPassword: (password: string) => Promise<void>;
  /** Run the PKCE exchange on this origin; returns the resolved profile. */
  completeAuthCallback: (href?: string) => Promise<NexoraProfile>;
  refresh: () => Promise<void>;
  clearError: () => void;
  /** Canonical app path for the current role. */
  homePath: () => string;
  /** Escape hatch for data access; `null` when unconfigured. */
  client: SupabaseClient | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
  /** Supabase overrides; normally omitted so env config is used. */
  clientOptions?: NexoraClientOptions;
  /**
   * Called when a session is present but has no active/valid profile.
   * Defaults to signing the user out (fail closed).
   */
  onUnauthorizedProfile?: (user: User) => void;
  /** Notified on every settled auth change — handy for analytics or GPS re-arm. */
  onAuthChange?: (state: { session: Session | null; profile: NexoraProfile | null }) => void;
};

type InternalState = {
  status: AuthStatus;
  session: Session | null;
  profile: NexoraProfile | null;
  error: AuthErrorState;
};

function errorState(cause: unknown): AuthErrorState {
  const authError = toAuthError(cause);
  return { code: authError.code, message: authError.message, retryable: authError.retryable };
}

export function AuthProvider({
  children,
  clientOptions,
  onUnauthorizedProfile,
  onAuthChange,
}: AuthProviderProps) {
  // The client is memoized once: recreating it would drop the auth listener.
  const client = useMemo(() => getSupabaseClient(clientOptions), [clientOptions]);
  const configError = useMemo(
    () => (client ? null : supabaseConfigErrorMessage(clientOptions)),
    [client, clientOptions],
  );

  const [state, setState] = useState<InternalState>({
    status: client ? "initializing" : "unconfigured",
    session: null,
    profile: null,
    error: null,
  });

  // Guards against out-of-order async resolutions (fast login/logout cycles).
  const revisionRef = useRef(0);
  const mountedRef = useRef(true);
  const changeHandlerRef = useRef(onAuthChange);
  const unauthorizedRef = useRef(onUnauthorizedProfile);
  changeHandlerRef.current = onAuthChange;
  unauthorizedRef.current = onUnauthorizedProfile;

  const applySession = useCallback(
    async (session: Session | null): Promise<NexoraProfile | null> => {
      if (!client) return null;
      const revision = ++revisionRef.current;
      const stale = () => !mountedRef.current || revision !== revisionRef.current;

      if (!session?.user) {
        if (stale()) return null;
        setState({ status: "anonymous", session: null, profile: null, error: null });
        changeHandlerRef.current?.({ session: null, profile: null });
        return null;
      }

      try {
        const profile = await resolveProfile(client, session.user.id);
        if (stale()) return profile;

        if (!profile) {
          // Fail closed: a session without an active profile is not a session.
          if (unauthorizedRef.current) {
            unauthorizedRef.current(session.user);
          } else {
            await endSession(client).catch(() => undefined);
          }
          if (stale()) return null;
          setState({
            status: "anonymous",
            session: null,
            profile: null,
            error: {
              code: "profile_inactive",
              message:
                "This account is inactive or has no valid Nexora role. Contact Nexora support if you believe this is a mistake.",
              retryable: false,
            },
          });
          changeHandlerRef.current?.({ session: null, profile: null });
          return null;
        }

        setState({ status: "authenticated", session, profile, error: null });
        changeHandlerRef.current?.({ session, profile });
        return profile;
      } catch (cause) {
        if (stale()) return null;
        // Transport/RLS failure: keep the session, surface a retryable error.
        setState({ status: "authenticated", session, profile: null, error: errorState(cause) });
        changeHandlerRef.current?.({ session, profile: null });
        return null;
      }
    },
    [client],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!client) {
      setState({ status: "unconfigured", session: null, profile: null, error: null });
      return () => {
        mountedRef.current = false;
      };
    }

    // 1. Restore any persisted session for this origin.
    void client.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((cause) => {
        if (!mountedRef.current) return;
        setState({ status: "anonymous", session: null, profile: null, error: errorState(cause) });
      });

    // 2. Track sign-in, sign-out, token refresh and multi-tab changes.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      // A token refresh keeps the same user; skip the profile round-trip.
      if (event === "TOKEN_REFRESHED" && session) {
        setState((prev) => (prev.profile ? { ...prev, session } : prev));
        return;
      }
      // Deferred: supabase-js forbids awaiting inside the callback.
      setTimeout(() => void applySession(session), 0);
    });

    return () => {
      mountedRef.current = false;
      revisionRef.current += 1;
      subscription.unsubscribe();
    };
  }, [client, applySession]);

  const requireClient = useCallback((): SupabaseClient => {
    if (!client) {
      throw new NexoraAuthError("not_configured", configError ?? "Nexora auth is not configured.", {
        retryable: false,
      });
    }
    return client;
  }, [client, configError]);

  const runGuarded = useCallback(
    async <T,>(operation: (activeClient: SupabaseClient) => Promise<T>): Promise<T> => {
      const activeClient = requireClient();
      try {
        setState((prev) => ({ ...prev, error: null }));
        return await operation(activeClient);
      } catch (cause) {
        const next = errorState(cause);
        if (mountedRef.current) setState((prev) => ({ ...prev, error: next }));
        throw toAuthError(cause);
      }
    },
    [requireClient],
  );

  const syncFromClient = useCallback(
    async (activeClient: SupabaseClient) => {
      const { data } = await activeClient.auth.getSession();
      return applySession(data.session);
    },
    [applySession],
  );

  const signIn = useCallback(
    (input: SignInInput) =>
      runGuarded(async (activeClient) => {
        const profile = await createAuthService(activeClient).signIn(input);
        await syncFromClient(activeClient);
        return profile;
      }),
    [runGuarded, syncFromClient],
  );

  const signUp = useCallback(
    (input: SignUpInput) =>
      runGuarded(async (activeClient) => {
        const result = await createAuthService(activeClient).signUp(input);
        // Auto-confirm projects return a session immediately; adopt it now so
        // the caller can route straight into the app.
        if (result.session) await applySession(result.session);
        return result;
      }),
    [runGuarded, applySession],
  );

  const signInWithGoogle = useCallback(
    (options: { returnTo?: string | null; role?: string } = {}) =>
      runGuarded((activeClient) => oauthSignIn(activeClient, "google", options)),
    [runGuarded],
  );

  const sendPasswordReset = useCallback(
    (email: string) => runGuarded((activeClient) => createAuthService(activeClient).sendPasswordReset(email)),
    [runGuarded],
  );

  const updatePasswordFn = useCallback(
    (password: string) => runGuarded((activeClient) => createAuthService(activeClient).updatePassword(password)),
    [runGuarded],
  );

  const resendVerification = useCallback(
    (email: string) => runGuarded((activeClient) => createAuthService(activeClient).resendVerification(email)),
    [runGuarded],
  );

  const getCurrentUser = useCallback(
    () => runGuarded((activeClient) => createAuthService(activeClient).getCurrentUser()),
    [runGuarded],
  );

  const getSessionFn = useCallback(
    () => runGuarded((activeClient) => createAuthService(activeClient).getSession()),
    [runGuarded],
  );

  const refreshSessionFn = useCallback(
    () =>
      runGuarded(async (activeClient) => {
        const session = await createAuthService(activeClient).refreshSession();
        await applySession(session);
        return session;
      }),
    [runGuarded, applySession],
  );

  const handleAuthCallback = useCallback(
    (href?: string) =>
      runGuarded(async (activeClient) => {
        const profile = await createAuthService(activeClient).handleAuthCallback(href);
        await syncFromClient(activeClient);
        return profile;
      }),
    [runGuarded, syncFromClient],
  );

  const requireAuth = useCallback(
    () => runGuarded((activeClient) => createAuthService(activeClient).requireAuth()),
    [runGuarded],
  );

  const requireRole = useCallback(
    (allowed: PlatformRole | PlatformRole[]) =>
      runGuarded((activeClient) => createAuthService(activeClient).requireRole(allowed)),
    [runGuarded],
  );

  // Phase 2 compatibility aliases — keep until every PWA has migrated.
  const setPassword = updatePasswordFn;
  const completeAuthCallback = handleAuthCallback;

  const signOutCallback = useCallback(async () => {
    // Optimistic local clear so the UI never shows a stale identity.
    revisionRef.current += 1;
    setState({ status: "anonymous", session: null, profile: null, error: null });
    if (client) await createAuthService(client).signOut().catch(() => undefined);
    changeHandlerRef.current?.({ session: null, profile: null });
  }, [client]);

  const refresh = useCallback(async () => {
    await refreshSessionFn();
  }, [refreshSessionFn]);

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      loading: state.status === "initializing",
      session: state.session,
      user: state.session?.user ?? null,
      profile: state.profile,
      role: state.profile?.role ?? null,
      error: state.error,
      configError,
      isAuthenticated: state.status === "authenticated" && Boolean(state.profile),
      signIn,
      signUp,
      signInWithGoogle,
      sendPasswordReset,
      updatePassword: updatePasswordFn,
      resendVerification,
      getCurrentUser,
      getSession: getSessionFn,
      refreshSession: refreshSessionFn,
      handleAuthCallback,
      requireAuth,
      requireRole,
      setPassword,
      completeAuthCallback,
      signOut: signOutCallback,
      refresh,
      clearError,
      homePath: () => (state.profile ? homePathForRole(state.profile.role) : "/"),
      client,
    }),
    [
      state,
      configError,
      signIn,
      signUp,
      signInWithGoogle,
      sendPasswordReset,
      updatePasswordFn,
      resendVerification,
      getCurrentUser,
      getSessionFn,
      refreshSessionFn,
      handleAuthCallback,
      requireAuth,
      requireRole,
      setPassword,
      completeAuthCallback,
      signOutCallback,
      refresh,
      clearError,
      client,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the Nexora auth context. Throws outside an `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>. Wrap your app root with it.");
  }
  return context;
}

/**
 * Role gate for a protected screen.
 *
 * Returns the current authorization decision without rendering anything, so
 * each app can show its own loading/denied UI. The decision is always based
 * on the server-resolved profile role.
 */
export function useRoleGuard(allowed: PlatformRole | PlatformRole[]): {
  loading: boolean;
  allowed: boolean;
  reason: "loading" | "anonymous" | "role_mismatch" | "unconfigured" | "ok";
  role: PlatformRole | null;
} {
  const { status, role, loading } = useAuth();
  const list = Array.isArray(allowed) ? allowed : [allowed];

  if (status === "unconfigured") return { loading: false, allowed: false, reason: "unconfigured", role };
  if (loading) return { loading: true, allowed: false, reason: "loading", role };
  if (status !== "authenticated" || !role) {
    return { loading: false, allowed: false, reason: "anonymous", role: null };
  }
  if (!list.includes(role)) return { loading: false, allowed: false, reason: "role_mismatch", role };
  return { loading: false, allowed: true, reason: "ok", role };
}

export { AuthContext };
