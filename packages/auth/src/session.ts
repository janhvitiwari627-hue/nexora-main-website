/**
 * Nexora — framework-agnostic auth operations.
 *
 * Everything here is pure logic over a SupabaseClient so it can be reused by
 * React (AuthProvider), by tests, and by non-React surfaces.
 *
 * SECURITY INVARIANT
 * ------------------
 * A Supabase session alone never authorizes anything. Authorization is the
 * pair (session, active profile). `resolveProfile()` fails closed: a session
 * without an active profile carrying a known role is signed out.
 */

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { NexoraAuthError, toAuthError } from "./errors";
import { isPlatformRole, normalizeSignupRole, type PlatformRole, type SignupRole } from "./roles";
import { buildCallbackUrl, buildRecoveryUrl, safeRedirectUrl } from "./redirects";

export type NexoraProfile = {
  id: string;
  fullName: string;
  role: PlatformRole;
  isActive: boolean;
  avatarUrl: string | null;
  phone: string | null;
};

/** Columns the client is allowed to read. RLS restricts rows to the owner. */
const PROFILE_COLUMNS = "id,full_name,platform_role,is_active,avatar_url,phone";

type ProfileRow = {
  id: string;
  full_name: string | null;
  platform_role: string | null;
  is_active: boolean | null;
  avatar_url: string | null;
  phone: string | null;
};

function mapProfile(row: ProfileRow): NexoraProfile | null {
  if (!row || !isPlatformRole(row.platform_role) || row.is_active !== true) return null;
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "User",
    role: row.platform_role,
    isActive: true,
    avatarUrl: row.avatar_url,
    phone: row.phone,
  };
}

/**
 * Fetch the caller's profile, retrying briefly.
 *
 * The retry exists for one specific race: right after signup the
 * `on_auth_user_created` trigger may not have committed when the client reads.
 * The client NEVER creates or upserts a profile — the trigger is the only
 * writer of `platform_role`, enforced by `guard_profile_platform_role()`.
 */
export async function resolveProfile(
  client: SupabaseClient,
  userId: string,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<NexoraProfile | null> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 350;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await client
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      const profile = mapProfile(data as ProfileRow);
      // An existing-but-inactive/invalid row is authoritative: stop retrying.
      if (profile) return profile;
      return null;
    }
    lastError = error;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  if (lastError) {
    // Surface RLS/network problems instead of pretending the user has no profile.
    throw toAuthError(lastError, "profile_missing");
  }
  return null;
}

export type SignInInput = {
  email: string;
  password: string;
};

export async function signInWithPassword(
  client: SupabaseClient,
  { email, password }: SignInInput,
): Promise<{ session: Session; user: User }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) {
    throw new NexoraAuthError("invalid_credentials", "Email and password are required.", { retryable: false });
  }
  const { data, error } = await client.auth.signInWithPassword({ email: trimmed, password });
  if (error) throw toAuthError(error, "invalid_credentials");
  if (!data.session || !data.user) {
    throw new NexoraAuthError("unknown", "Sign-in did not return a session. Please try again.");
  }
  return { session: data.session, user: data.user };
}

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  role?: SignupRole | string;
  /** Optional growth-partner referral code captured from the landing URL. */
  refCode?: string | null;
  /** Where to send the user after email confirmation. Validated. */
  returnTo?: string | null;
  phone?: string | null;
};

export type SignUpResult = {
  /** True when the project auto-confirms and a session already exists. */
  session: Session | null;
  user: User | null;
  /** True when Supabase requires the user to click a confirmation email. */
  needsEmailConfirmation: boolean;
};

/**
 * Create an account on the shared project.
 *
 * The requested role travels as `options.data.signup_role` metadata; the
 * database trigger normalizes it and writes `profiles.platform_role`. The
 * client cannot choose a role directly, and `admin` is never self-service.
 */
export async function signUpWithPassword(
  client: SupabaseClient,
  input: SignUpInput,
): Promise<SignUpResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email || !input.password) {
    throw new NexoraAuthError("invalid_credentials", "Email and password are required.", { retryable: false });
  }
  if (input.password.length < 8) {
    throw new NexoraAuthError("weak_password", "Password must be at least 8 characters.", { retryable: false });
  }
  if (!fullName) {
    throw new NexoraAuthError("unknown", "Full name is required for new accounts.", { retryable: false });
  }

  const role = normalizeSignupRole(input.role);
  const { data, error } = await client.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: buildCallbackUrl({ returnTo: input.returnTo, role }),
      data: {
        full_name: fullName,
        signup_role: role,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.refCode ? { ref_code: input.refCode } : {}),
      },
    },
  });
  if (error) throw toAuthError(error, "unknown");

  return {
    session: data.session ?? null,
    user: data.user ?? null,
    needsEmailConfirmation: Boolean(data.user) && !data.session,
  };
}

/** Send a PKCE password-recovery email. Never reveals whether the email exists. */
export async function requestPasswordReset(client: SupabaseClient, email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new NexoraAuthError("unknown", "Enter the email address you registered with.", { retryable: false });
  }
  const { error } = await client.auth.resetPasswordForEmail(trimmed, {
    redirectTo: buildRecoveryUrl(),
  });
  if (error) throw toAuthError(error, "unknown");
}

/** Complete a recovery: requires the session created by the recovery link. */
export async function updatePassword(client: SupabaseClient, password: string): Promise<void> {
  if (password.length < 8) {
    throw new NexoraAuthError("weak_password", "Password must be at least 8 characters.", { retryable: false });
  }
  const { error } = await client.auth.updateUser({ password });
  if (error) throw toAuthError(error, "unknown");
}

/**
 * Complete the PKCE code exchange on the current origin.
 *
 * supabase-js with `detectSessionInUrl` may already have consumed the code by
 * the time this runs, so an "already used / invalid code" error is tolerated
 * when a live session exists afterwards. Anything else is a real failure.
 */
export async function completeCodeExchange(
  client: SupabaseClient,
  href?: string,
): Promise<Session> {
  const target = href ?? (typeof window !== "undefined" ? window.location.href : "");
  let code: string | null = null;
  let providerError: string | null = null;
  if (target) {
    try {
      const url = new URL(target);
      code = url.searchParams.get("code");
      providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
    } catch {
      /* fall through to the session check */
    }
  }
  if (providerError) throw toAuthError(new Error(providerError), "oauth_failed");

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error && !/invalid|expired|not found|already|code (challenge|verifier)/i.test(error.message)) {
      throw toAuthError(error, "pkce_failed");
    }
  }

  const { data, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw toAuthError(sessionError, "pkce_failed");
  if (!data.session) {
    throw new NexoraAuthError(
      "pkce_failed",
      "This sign-in link is invalid, already used, or was opened in a different browser. Request a new link.",
      { retryable: false },
    );
  }
  return data.session;
}

/** Start an OAuth (PKCE) sign-in that returns to the central callback. */
export async function signInWithOAuth(
  client: SupabaseClient,
  provider: "google",
  options: { returnTo?: string | null; role?: string } = {},
): Promise<void> {
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildCallbackUrl({ returnTo: options.returnTo, role: options.role }),
    },
  });
  if (error) throw toAuthError(error, "oauth_failed");
}

export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  // A failed sign-out on an already-dead session must not block the UI.
  if (error && !/session|not (logged|signed) in|missing/i.test(error.message)) {
    throw toAuthError(error, "unknown");
  }
}

/**
 * Hand a signed-in user off to another Nexora origin.
 *
 * No tokens are transferred. The destination performs its own PKCE exchange
 * (or already holds a session). Unlisted destinations are refused.
 */
export function handoffTo(destination: string, fallback = "/"): string {
  return safeRedirectUrl(destination) ?? fallback;
}
