/**
 * PHASE 3 — AUTH PROVIDER (Sub-App auth context).
 *
 * One provider, one auth state machine, one `onAuthStateChange` listener per
 * mounted tree. It sits on top of the Phase 2 canonical Supabase client
 * (../lib/supabase) so every Sub-App resolves the same shared session
 * (storage key nexora.auth.qwaehqsmodekbgvnaavz, PKCE).
 *
 * Responsibilities:
 *   * restore the persisted session on boot via `supabase.auth.getSession()`
 *   * subscribe exactly once to `supabase.auth.onAuthStateChange(...)` and
 *     handle INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
 *     USER_UPDATED and PASSWORD_RECOVERY
 *   * resolve the caller-owned `profiles` row for the signed-in user
 *   * expose signIn / signUp / forgotPassword / updatePassword / signOut /
 *     refreshProfile
 *
 * The subscription is created inside a single effect and torn down with
 * `subscription.unsubscribe()` during cleanup, so re-mounts (including React
 * StrictMode's double mount) never accumulate duplicate listeners.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigErrorMessage } from '../lib/supabase';

/** The caller-owned row of the shared `profiles` table (RLS: owner only).
 *
 * PHASE 4 — PROFILE SYNCHRONIZATION: the row is addressed exclusively by the
 * authenticated user's id (auth.users.id → profiles.id). `platform_role` and
 * `is_active` are the Main Website's canonical, server-owned authority
 * fields: they are read here for display/routing only and are NEVER written
 * from the browser — a database trigger (guard_profile_platform_role) is the
 * single writer of `platform_role`.
 */
export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  preferred_city: string | null;
  preferred_area: string | null;
  /** Canonical Main Website role — server-owned, read-only in the browser. */
  readonly platform_role: string | null;
  /** Server-owned account gate — read-only in the browser. */
  readonly is_active: boolean | null;
};

const PROFILE_COLUMNS =
  'id,full_name,phone,avatar_path,preferred_city,preferred_area,platform_role,is_active';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<void>;

  signUp: (email: string, password: string, fullName: string) => Promise<void>;

  forgotPassword: (email: string) => Promise<void>;

  updatePassword: (password: string) => Promise<void>;

  signOut: () => Promise<void>;

  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Base URL of this Sub-App deployment — used for auth email redirects. */
const appBaseUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).toString();

function requireClient() {
  if (!supabase) throw new Error(supabaseConfigErrorMessage);
  return supabase;
}

export type AuthProviderProps = {
  children: ReactNode;
  /**
   * Invoked when a PASSWORD_RECOVERY event arrives so the host app can route
   * to its reset-password screen. State (session/user) is updated either way.
   */
  onPasswordRecovery?: (session: Session | null) => void;
};

export function AuthProvider({ children, onPasswordRecovery }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(supabase));

  // Guards against out-of-order async profile resolutions and against state
  // updates after unmount (fast sign-in/sign-out cycles, StrictMode remount).
  const revisionRef = useRef(0);
  const mountedRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const recoveryRef = useRef(onPasswordRecovery);

  useEffect(() => {
    recoveryRef.current = onPasswordRecovery;
  }, [onPasswordRecovery]);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    // PHASE 4: fetch ONLY the current user's row (auth.users.id →
    // profiles.id). The browser never queries arbitrary users; RLS enforces
    // the same boundary server-side.
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle<Profile>();
    if (error) throw error;
    return data ?? null;
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      const revision = ++revisionRef.current;
      const stale = () => !mountedRef.current || revision !== revisionRef.current;

      sessionRef.current = nextSession;
      if (!mountedRef.current) return;
      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await fetchProfile(nextSession.user.id);
        if (stale()) return;
        setProfile(nextProfile);
      } catch {
        // Transport/RLS failure: keep the session, drop the stale profile.
        if (stale()) return;
        setProfile(null);
      } finally {
        if (!stale()) setLoading(false);
      }
    },
    [fetchProfile],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!supabase) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    // 1. Initial session — restore whatever is persisted for this origin.
    void supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => {
        if (!mountedRef.current) return;
        setSession(null);
        setProfile(null);
        setLoading(false);
      });

    // 2. Auth listener — created exactly once here, never anywhere else in
    //    this provider, so re-renders cannot create duplicate listeners.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'USER_UPDATED':
          // Deferred: supabase-js forbids awaiting inside the callback.
          setTimeout(() => void applySession(nextSession), 0);
          break;
        case 'TOKEN_REFRESHED':
          // Same user, fresh tokens — no profile round-trip needed.
          sessionRef.current = nextSession;
          if (mountedRef.current) setSession(nextSession);
          break;
        case 'PASSWORD_RECOVERY':
          setTimeout(() => void applySession(nextSession), 0);
          recoveryRef.current?.(nextSession);
          break;
        case 'SIGNED_OUT':
          revisionRef.current += 1; // cancel any in-flight profile fetch
          sessionRef.current = null;
          if (mountedRef.current) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
          break;
        default:
          // Future events (e.g. MFA) — resolve conservatively.
          setTimeout(() => void applySession(nextSession), 0);
          break;
      }
    });

    return () => {
      mountedRef.current = false;
      revisionRef.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const client = requireClient();
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    // The SIGNED_IN event updates context state through the single listener.
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<void> => {
      const client = requireClient();
      const { error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: appBaseUrl(),
          data: { full_name: fullName.trim() },
        },
      });
      if (error) throw error;
    },
    [],
  );

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    const client = requireClient();
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      // The ?recovery=1 marker routes the returning user to the
      // reset-password screen (see PASSWORD_RECOVERY handling above).
      redirectTo: `${appBaseUrl()}?recovery=1`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<void> => {
    const client = requireClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    // The SIGNED_OUT event clears context state through the single listener.
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) {
      if (mountedRef.current) setProfile(null);
      return;
    }
    const nextProfile = await fetchProfile(userId);
    if (mountedRef.current && sessionRef.current?.user?.id === userId) {
      setProfile(nextProfile);
    }
  }, [fetchProfile]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signUp,
    forgotPassword,
    updatePassword,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
