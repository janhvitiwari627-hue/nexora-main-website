import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { DatabaseState } from '../db/database';
import { useLocationSync, LocationSyncStatus } from '../hooks/useLocationSync';

// ============================================================================
// NEXORA UNIVERSAL SUPABASE CLIENT
//
// ONE shared client, configured for PKCE auth:
// - storage key: nexora.auth.qwaehqsmodekbgvnaavz
// - persistSession: true
// - autoRefreshToken: true
// - detectSessionInUrl: true
// - flowType: 'pkce'
//
// Security:
// - Only the public anon key is used (never service_role).
// - Supabase RLS is the authorization boundary.
// ============================================================================

const NEXORA_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';
// This app is statically mounted at /distributors-beauty-industry/ on the
// Nexora Main Website origin. All auth routes are therefore scoped under the
// mount base so PKCE redirects and deep links stay inside the SPA (the root
// Next.js app rewrites nested paths back to this app's index.html).
const APP_MOUNT_BASE = '/distributors-beauty-industry';
export const AUTH_LOGIN_PATH = `${APP_MOUNT_BASE}/auth/login`;
export const AUTH_CALLBACK_PATH = `${APP_MOUNT_BASE}/auth/callback`;
export const AUTH_CALLBACK_PREFIX = `${APP_MOUNT_BASE}/auth/`;
const AUTH_REDIRECT_THROTTLE_MS = 3000;
let lastAuthRedirectAt = 0;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-nexora-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: NEXORA_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('mock-nexora-project') &&
    !url.includes('your-project') &&
    !url.includes('your-project.supabase.co') &&
    !key.includes('your-anon') &&
    !key.includes('your-project'),
  );
}

export function getSupabaseConfigInfo() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    storageKey: NEXORA_STORAGE_KEY,
    isConfigured: isSupabaseConfigured(),
    anonKeyTruncated: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10)}...${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-6)}`
      : 'Not set'
  };
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }> {
  const start = performance.now();
  try {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Supabase credentials are not yet configured in environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Currently running with local client persistence store.',
      };
    }

    const { data, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        message: `Supabase connected, table query note: ${error.message}. (Ensure schema migration is run in Supabase SQL editor)`,
        latencyMs,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to live Supabase PostgreSQL database! (${latencyMs}ms response time)`,
      details: data,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Error connecting to Supabase instance.',
    };
  }
}

/**
 * Push all active local database entities to Supabase tables.
 * This is only used by the data-inspection/demo tooling and is guarded by RLS.
 */
export async function syncAllDataToSupabase(state: DatabaseState): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are not set.']
    };
  }

  const errors: string[] = [];
  let syncedCount = 0;

  try {
    if (state.users?.length) {
      const { error } = await supabase.from('users').upsert(state.users);
      if (error) errors.push(`users: ${error.message}`);
      else syncedCount += state.users.length;
    }

    if (state.profiles_buyer?.length) {
      const { error } = await supabase.from('profiles_buyer').upsert(state.profiles_buyer);
      if (error) errors.push(`profiles_buyer: ${error.message}`);
      else syncedCount += state.profiles_buyer.length;
    }

    if (state.profiles_supplier?.length) {
      const { error } = await supabase.from('profiles_supplier').upsert(state.profiles_supplier);
      if (error) errors.push(`profiles_supplier: ${error.message}`);
      else syncedCount += state.profiles_supplier.length;
    }

    if (state.products?.length) {
      const { error } = await supabase.from('products').upsert(state.products);
      if (error) errors.push(`products: ${error.message}`);
      else syncedCount += state.products.length;
    }

    if (state.rfqs_enquiries?.length) {
      const { error } = await supabase.from('rfqs_enquiries').upsert(state.rfqs_enquiries);
      if (error) errors.push(`rfqs_enquiries: ${error.message}`);
      else syncedCount += state.rfqs_enquiries.length;
    }

    if (state.quotes?.length) {
      const { error } = await supabase.from('quotes').upsert(state.quotes);
      if (error) errors.push(`quotes: ${error.message}`);
      else syncedCount += state.quotes.length;
    }

    if (state.messages?.length) {
      const { error } = await supabase.from('messages').upsert(state.messages);
      if (error) errors.push(`messages: ${error.message}`);
      else syncedCount += state.messages.length;
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount,
      errors: [err.message || 'Unexpected synchronization error.']
    };
  }
}

// ============================================================================
// Auth helpers for the PKCE / redirect / callback lifecycle
// ============================================================================

/**
 * True when the current URL carries PKCE authorization parameters coming back
 * from Supabase OAuth / Magic Link (`?code=...&state=...`).
 */
export function hasAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  return url.searchParams.has('code') || url.searchParams.has('state');
}

/**
 * The single authorization code received by the callback. Supabase exchanges
 * this code-for-session automatically because `detectSessionInUrl` is enabled.
 */
export function getAuthCallbackCode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get('code');
}

export function isAuthPath(pathname: string): boolean {
  return pathname === AUTH_LOGIN_PATH || pathname.startsWith(AUTH_CALLBACK_PREFIX);
}

/**
 * Strip every transient Supabase authorization parameter from the address bar
 * after the exchange has completed. This keeps the callback response (which
 * usually contains secrets/`state`) out of bookmarks, history and the URL bar.
 */
export function stripAuthCallbackParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;
  const transientParams = [
    'code',
    'state',
    'error',
    'error_description',
    'error_code',
    'token_type',
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'scope',
  ];
  for (const key of transientParams) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const cleaned = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', cleaned);
}

/**
 * Redirect unauthenticated users to the explicit /auth/login route.
 *
 * Redirect-loop protection:
 * - Never redirect when already on /auth/login.
 * - Throttle rapid repeated redirects for the same boot/session so a stale
 *   callback or a failed token refresh cannot bounce the user forever.
 * - Protected-screen redirects are decided by App.tsx, allowing anonymous
 *   users to remain on public screens after sign-out.
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === AUTH_LOGIN_PATH) return;

  const now = Date.now();
  if (now - lastAuthRedirectAt < AUTH_REDIRECT_THROTTLE_MS) {
    return;
  }
  lastAuthRedirectAt = now;
  window.location.replace(AUTH_LOGIN_PATH);
}

/**
 * Supabase may reject a persisted session because its refresh token is expired,
 * revoked, malformed, or no longer exists. Those failures are authentication
 * outcomes, while network/availability failures are transient and must not
 * force a user away from a public page.
 */
function isAuthenticationInvalidatingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const authError = error as {
    name?: string;
    code?: string;
    status?: number;
    message?: string;
  };
  const code = (authError.code || '').toLowerCase();
  const message = (authError.message || '').toLowerCase();

  return authError.name === 'AuthSessionMissingError'
    || authError.name === 'AuthInvalidTokenResponseError'
    || authError.name === 'SyntaxError'
    || authError.status === 401
    || authError.status === 403
    || [
      'refresh_token_not_found',
      'refresh_token_already_used',
      'session_not_found',
      'bad_jwt',
    ].includes(code)
    || message.includes('invalid refresh token')
    || message.includes('refresh token not found')
    || message.includes('jwt expired');
}

// ============================================================================
// Auth + Supabase context
// ============================================================================

export type AuthenticationStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SupabaseContextType {
  supabase: SupabaseClient;
  isConfigured: boolean;
  authReady: boolean;
  authenticationStatus: AuthenticationStatus;
  session: Session | null;
  user: User | null;
  lastAuthEvent: AuthChangeEvent | null;
  locationSyncStatus: LocationSyncStatus;
  testConnection: () => Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }>;
  syncData: (state: DatabaseState) => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error?: Error | null }>;
  signUpWithEmailPassword: (email: string, password: string, role: 'buyer' | 'supplier') => Promise<{ error?: Error | null; needsEmailConfirmation?: boolean }>;
  signInWithOtp: (identifier: string) => Promise<{ error?: Error | null }>;
  verifyOtp: (identifier: string, token: string) => Promise<{ error?: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: (opts?: { redirectToLogin?: boolean }) => Promise<void>;
}

const defaultContext: SupabaseContextType = {
  supabase,
  isConfigured: false,
  authReady: false,
  authenticationStatus: 'loading',
  session: null,
  user: null,
  lastAuthEvent: null,
  locationSyncStatus: 'idle',
  testConnection: testSupabaseConnection,
  syncData: syncAllDataToSupabase,
  signInWithEmailPassword: async () => ({ error: null }),
  signUpWithEmailPassword: async () => ({ error: null }),
  signInWithOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
};

export const SupabaseContext = createContext<SupabaseContextType>(defaultContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEvent | null>(null);

  const hadSessionRef = useRef(false);
  const suppressRedirectRef = useRef(false);

  // Location synchronization starts only when an authenticated session exists.
  const locationSyncStatus = useLocationSync({
    supabase,
    userId: session?.user?.id || null,
    enabled: isConfigured && Boolean(session?.user),
  });

  useEffect(() => {
    let mounted = true;

    if (!isConfigured) {
      // Demo / local mode: no real Supabase project is configured, so the app
      // uses the existing local preview auth UI without hitting a remote backend.
      setAuthenticationStatus('unauthenticated');
      setAuthReady(true);
      return () => {
        mounted = false;
      };
    }

    // Capture this before Supabase initialization can remove an invalid entry.
    // A missing entry is a normal anonymous startup; a present-but-rejected
    // entry is an expired/invalid persisted authentication attempt.
    const hadPersistedAuthAtStartup = typeof window !== 'undefined'
      && Boolean(window.localStorage.getItem(NEXORA_STORAGE_KEY));

    const applyAuthEvent = (event: AuthChangeEvent, nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setLastAuthEvent(event);
      setAuthenticationStatus(nextSession ? 'authenticated' : 'unauthenticated');
      setAuthReady(true);

      if (nextSession) {
        hadSessionRef.current = true;
        lastAuthRedirectAt = 0;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          stripAuthCallbackParams();
        }
      } else if (event === 'SIGNED_OUT') {
        // App.tsx owns route-aware SIGNED_OUT redirects: protected screens go
        // to login while public screens remain public.
        hadSessionRef.current = false;
      }
    };

    // Single auth-state listener for INITIAL_SESSION / SIGNED_IN / SIGNED_OUT /
    // TOKEN_REFRESHED / USER_UPDATED.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applyAuthEvent(event, nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setSession(null);
          setAuthenticationStatus('unauthenticated');
          setAuthReady(true);
          if (hadPersistedAuthAtStartup && isAuthenticationInvalidatingError(error)) {
            hadSessionRef.current = false;
            redirectToLogin();
          }
          return;
        }

        const nextSession = data?.session ?? null;
        setSession(nextSession);
        setAuthenticationStatus(nextSession ? 'authenticated' : 'unauthenticated');
        setAuthReady(true);
        if (nextSession) {
          hadSessionRef.current = true;
          lastAuthRedirectAt = 0;
          stripAuthCallbackParams();
        } else if (hadPersistedAuthAtStartup && !hasAuthCallbackParams()) {
          // Supabase rejected/cleared a previously persisted session without
          // returning an AuthError. Treat that as an invalid persisted session,
          // but do not interfere with an in-progress PKCE callback.
          redirectToLogin();
        }
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
        if (hadPersistedAuthAtStartup && isAuthenticationInvalidatingError(error)) {
          hadSessionRef.current = false;
          redirectToLogin();
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const value = useMemo<SupabaseContextType>(() => ({
    supabase,
    isConfigured,
    authReady,
    authenticationStatus,
    session,
    user: session?.user ?? null,
    lastAuthEvent,
    locationSyncStatus,
    testConnection: testSupabaseConnection,
    syncData: syncAllDataToSupabase,
    signInWithEmailPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    },
    signUpWithEmailPassword: async (email, password, role) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}${AUTH_CALLBACK_PATH}` : undefined,
        },
      });
      return {
        error: error as Error | null,
        needsEmailConfirmation: Boolean(data?.user && !data.session),
      };
    },
    signInWithOtp: async (identifier) => {
      const isEmail = identifier.includes('@');
      const { error } = isEmail
        ? await supabase.auth.signInWithOtp({ email: identifier })
        : await supabase.auth.signInWithOtp({ phone: identifier });
      return { error: error as Error | null };
    },
    verifyOtp: async (identifier, token) => {
      const isEmail = identifier.includes('@');
      const { error } = isEmail
        ? await supabase.auth.verifyOtp({ email: identifier, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: identifier, token, type: 'sms' });
      return { error: error as Error | null };
    },
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${AUTH_CALLBACK_PATH}` : undefined,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
    },
    signOut: async (opts) => {
      if (!isConfigured) {
        localStorage.removeItem('nexora_user_session');
        localStorage.setItem('nexora_is_logged_in', 'false');
        localStorage.setItem('nexora_user_role', 'guest');
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
        return;
      }

      // A deliberate user-driven sign out should not trigger the automatic
      // invalid/expired-session redirect loop. Automatic refreshes that fail
      // still redirect to /auth/login.
      suppressRedirectRef.current = opts?.redirectToLogin !== true;
      try {
        await supabase.auth.signOut();
      } finally {
        setTimeout(() => {
          suppressRedirectRef.current = false;
        }, 0);
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
      }
    },
  }), [isConfigured, authReady, authenticationStatus, session, lastAuthEvent, locationSyncStatus]);

  return React.createElement(
    SupabaseContext.Provider,
    { value },
    children
  );
};

export const useSupabase = () => useContext(SupabaseContext);
