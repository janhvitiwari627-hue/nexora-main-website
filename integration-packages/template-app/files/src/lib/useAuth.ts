import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Thin wrapper over the existing Supabase Auth (email/password, which the
 * live project has enabled). No second auth system, no manual token or
 * password handling, no service_role.
 */

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The Template App has many screens that need the current user. Auth state is
 * therefore owned by one provider rather than by one listener per useAuth()
 * call. This is important for the wizard: switching screens must never create
 * duplicate Supabase listeners or a listener/update loop.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const parentContext = useContext(AuthContext);
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: isSupabaseConfigured,
  });
  const revisionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (parentContext) {
      console.warn(
        '[Nexora auth] Nested <AuthProvider> detected. The Template App must mount exactly one provider at src/main.tsx.',
      );
    }
  }, [parentContext]);

  useEffect(() => {
    mountedRef.current = true;
    if (!supabase) {
      setState({ user: null, session: null, loading: false });
      return () => {
        mountedRef.current = false;
      };
    }

    const applySession = async (nextSession: Session | null) => {
      const revision = ++revisionRef.current;
      if (!mountedRef.current) return;
      setState({
        user: nextSession?.user ?? null,
        session: nextSession,
        loading: true,
      });

      // Supabase delivers the authoritative session to this single owner.
      // No auth method is called from the listener, so events cannot recurse.
      if (revision !== revisionRef.current) return;
      if (mountedRef.current) {
        setState({
          user: nextSession?.user ?? null,
          session: nextSession,
          loading: false,
        });
      }
    };

    // Safety fallback: a blocked auth request must not leave every screen
    // behind an infinite loading state.
    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        setState((previous) => (previous.loading ? { ...previous, loading: false } : previous));
      }
    }, 4_000);

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        window.clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        if (error) {
          console.error('Supabase getSession error:', error);
          setState({ user: null, session: null, loading: false });
          return;
        }
        void applySession(data.session);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        console.error('Supabase getSession exception:', error);
        setState({ user: null, session: null, loading: false });
      });

    // Exactly one auth listener for the whole Template App. Screen-level
    // components consume context and never subscribe themselves.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      mountedRef.current = false;
      revisionRef.current += 1;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOutFromProvider = useCallback(async () => {
    // Clear the context before awaiting the network call. This keeps every
    // consumer on the guest branch even when the session has already expired.
    revisionRef.current += 1;
    if (mountedRef.current) setState({ user: null, session: null, loading: false });
    await signOut();
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { ...state, signOut: signOutFromProvider } },
    children,
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}

/** Email/password sign-in using the existing Supabase Auth. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: 'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign-in failed:', error);
      return { error: error.message || 'Incorrect email or password.' };
    }
    return { error: null };
  } catch (err: any) {
    console.error('Sign-in exception:', err);
    return {
      error: err?.message || 'Could not connect to authentication service. Please try again.',
    };
  }
}

/**
 * Email/password sign-up using the existing Supabase Auth.
 * `needsConfirmation` is true when the project requires email confirmation
 * before a session is issued.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabase) {
    return {
      error: 'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      needsConfirmation: false,
    };
  }
  try {
    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`
      : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) {
      console.error('Sign-up failed:', error);
      const message = /already registered|already exists/i.test(error.message)
        ? 'That email is already registered. Try logging in.'
        : error.message || 'Could not create the account. Please try again.';
      return { error: message, needsConfirmation: false };
    }
    return { error: null, needsConfirmation: !data.session };
  } catch (err: any) {
    console.error('Sign-up exception:', err);
    return {
      error: err?.message || 'Could not connect to authentication service. Please try again.',
      needsConfirmation: false,
    };
  }
}

export async function signInWithGoogle(next = '/dashboard'): Promise<{ error: string | null }> {
  if (!supabase || typeof window === 'undefined') {
    return { error: 'Authentication is not configured.' };
  }
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: false },
  });
  return { error: error?.message || null };
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  if (!supabase || typeof window === 'undefined') {
    return { error: 'Authentication is not configured.' };
  }
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  return { error: error?.message || null };
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Authentication is not configured.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message || null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Sign-out exception:', err);
  }
}
