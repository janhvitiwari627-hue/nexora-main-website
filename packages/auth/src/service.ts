/**
 * @nexora/auth — Canonical Auth Service.
 *
 * Contract version: 1.0.0
 * Package version:  1.2.0
 *
 * Every Nexora surface (Main Website and every PWA) must perform auth,
 * session and guard work through this inventory. Screens must not call
 * `supabase.auth.*` directly.
 *
 * SECURITY INVARIANTS
 * -------------------
 * 1. A Supabase session alone never authorizes access.
 * 2. Identity-returning operations verify the current Supabase user via
 *    `auth.getUser()` — a persisted session blob is not enough.
 * 3. `profiles.platform_role` on an *active* row is the only role authority.
 *    URL parameters and localStorage never select or grant a role.
 * 4. Missing, inactive or invalid profiles fail closed and are signed out.
 * 5. RLS / network failures stay typed (`forbidden`, `network`,
 *    `profile_missing`, …). They are never disguised as a role failure.
 * 6. `admin` is never available through public self-service signup.
 * 7. PKCE and centralized redirect validation remain mandatory.
 */

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { NexoraAuthError, toAuthError } from "./errors";
import { buildCallbackUrl } from "./redirects";
import type { PlatformRole } from "./roles";
import {
  completeCodeExchange,
  requestPasswordReset,
  resolveProfile,
  signInWithPassword,
  signOut as endSession,
  signUpWithPassword,
  updatePassword as writePassword,
  type NexoraProfile,
  type SignInInput,
  type SignUpInput,
  type SignUpResult,
} from "./session";

/** Frozen Auth Service contract. Bump only with a documented, compatible change. */
export const AUTH_SERVICE_CONTRACT_VERSION = "1.0.0";

/** Canonical method inventory — the twelve operations every consumer must use. */
export const AUTH_SERVICE_METHODS = [
  "signUp",
  "signIn",
  "signOut",
  "sendPasswordReset",
  "updatePassword",
  "resendVerification",
  "getCurrentUser",
  "getSession",
  "refreshSession",
  "handleAuthCallback",
  "requireAuth",
  "requireRole",
] as const;

export type AuthServiceMethod = (typeof AUTH_SERVICE_METHODS)[number];

export type AuthenticatedAccess = {
  session: Session;
  user: User;
  profile: NexoraProfile;
};

export type AuthService = {
  signUp(input: SignUpInput): Promise<SignUpResult>;
  signIn(input: SignInInput): Promise<NexoraProfile>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
  getCurrentUser(): Promise<User>;
  getSession(): Promise<Session | null>;
  refreshSession(): Promise<Session | null>;
  handleAuthCallback(href?: string): Promise<NexoraProfile>;
  requireAuth(): Promise<AuthenticatedAccess>;
  requireRole(allowed: PlatformRole | PlatformRole[]): Promise<AuthenticatedAccess>;
};

function isTransportFailure(error: NexoraAuthError): boolean {
  return (
    error.code === "offline" ||
    error.code === "network" ||
    error.code === "rate_limited" ||
    error.code === "profile_missing" ||
    error.code === "forbidden"
  );
}

/**
 * Confirm the caller against Supabase Auth (server), not just the local
 * persisted session. A missing/expired user is not an authorized identity.
 */
async function verifyCurrentUser(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser();
  if (error) throw toAuthError(error, "session_expired");
  if (!data.user) {
    throw new NexoraAuthError("session_expired", "Your session expired. Please sign in again.", {
      retryable: false,
    });
  }
  return data.user;
}

/**
 * Resolve the active profile that carries the authoritative role.
 *
 * Invalid identities are signed out. Transport/RLS problems are rethrown
 * unchanged so a network blip cannot be mistaken for "no role".
 */
async function requireActiveProfile(client: SupabaseClient, userId: string): Promise<NexoraProfile> {
  let profile: NexoraProfile | null;
  try {
    profile = await resolveProfile(client, userId);
  } catch (cause) {
    throw toAuthError(cause);
  }
  if (profile) return profile;

  await endSession(client).catch(() => undefined);
  throw new NexoraAuthError(
    "profile_inactive",
    "This account is inactive or has no valid Nexora role. Contact Nexora support if you believe this is a mistake.",
    { retryable: false },
  );
}

async function authorize(client: SupabaseClient): Promise<AuthenticatedAccess> {
  const user = await verifyCurrentUser(client);
  const profile = await requireActiveProfile(client, user.id);
  const { data, error } = await client.auth.getSession();
  if (error) throw toAuthError(error, "session_expired");
  if (!data.session) {
    throw new NexoraAuthError("session_expired", "Your session expired. Please sign in again.", {
      retryable: false,
    });
  }
  return { session: data.session, user, profile };
}

export function createAuthService(client: SupabaseClient): AuthService {
  return {
    async signUp(input) {
      // `signUpWithPassword` already refuses admin via normalizeSignupRole
      // and enforces the 8-character password floor.
      const result = await signUpWithPassword(client, input);
      if (result.session?.user) {
        // Auto-confirm projects return a session; it is not yet authorized
        // until the active profile is verified.
        await requireActiveProfile(client, result.session.user.id);
      }
      return result;
    },

    async signIn(input) {
      await signInWithPassword(client, input);
      const { profile } = await authorize(client);
      return profile;
    },

    async signOut() {
      await endSession(client);
    },

    async sendPasswordReset(email) {
      await requestPasswordReset(client, email);
    },

    async updatePassword(password) {
      const user = await verifyCurrentUser(client);
      await writePassword(client, password);
      await requireActiveProfile(client, user.id);
    },

    async resendVerification(email) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) {
        throw new NexoraAuthError("unknown", "Enter the email address you registered with.", {
          retryable: false,
        });
      }
      const { error } = await client.auth.resend({
        type: "signup",
        email: trimmed,
        options: { emailRedirectTo: buildCallbackUrl() },
      });
      if (error) throw toAuthError(error, "unknown");
    },

    async getCurrentUser() {
      const { user } = await authorize(client);
      return user;
    },

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw toAuthError(error, "session_expired");
      if (!data.session?.user) return null;
      try {
        await authorize(client);
        return data.session;
      } catch (cause) {
        const mapped = toAuthError(cause);
        if (isTransportFailure(mapped)) throw mapped;
        return null;
      }
    },

    async refreshSession() {
      const { data, error } = await client.auth.refreshSession();
      if (error) throw toAuthError(error, "session_expired");
      if (!data.session?.user) return null;
      try {
        await authorize(client);
        return data.session;
      } catch (cause) {
        const mapped = toAuthError(cause);
        if (isTransportFailure(mapped)) throw mapped;
        return null;
      }
    },

    async handleAuthCallback(href) {
      const session = await completeCodeExchange(client, href);
      const user = await verifyCurrentUser(client);
      if (user.id !== session.user.id) {
        await endSession(client).catch(() => undefined);
        throw new NexoraAuthError(
          "pkce_failed",
          "This sign-in link is invalid, already used, or was opened in a different browser. Request a new link.",
          { retryable: false },
        );
      }
      return requireActiveProfile(client, user.id);
    },

    async requireAuth() {
      return authorize(client);
    },

    async requireRole(allowed) {
      const access = await authorize(client);
      const list = Array.isArray(allowed) ? allowed : [allowed];
      if (!list.includes(access.profile.role)) {
        throw new NexoraAuthError(
          "role_mismatch",
          "Your account does not have access to this area.",
          { retryable: false },
        );
      }
      return access;
    },
  };
}
