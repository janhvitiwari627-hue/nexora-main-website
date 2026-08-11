/**
 * Nexora — auth error taxonomy.
 *
 * Goals:
 *  1. Never swallow a real Supabase cause (a masked "Invalid credentials" cost
 *     this platform a production incident — see docs/CUSTOMER_LOGIN_*.md).
 *  2. Never leak whether an email exists during recovery flows.
 *  3. Give the UI a stable machine-readable `code` so screens can branch
 *     without string matching.
 */

export type AuthErrorCode =
  | "offline"
  | "network"
  | "rate_limited"
  | "not_configured"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_taken"
  | "weak_password"
  | "signup_disabled"
  | "session_expired"
  | "pkce_failed"
  | "oauth_failed"
  | "profile_missing"
  | "profile_inactive"
  | "role_mismatch"
  | "forbidden"
  | "unknown";

export class NexoraAuthError extends Error {
  readonly code: AuthErrorCode;
  /** True when retrying the same action may succeed (network blips, races). */
  readonly retryable: boolean;
  /** Original Supabase/network error, preserved for logging and debugging. */
  readonly cause?: unknown;

  constructor(code: AuthErrorCode, message: string, options: { retryable?: boolean; cause?: unknown } = {}) {
    super(message);
    this.name = "NexoraAuthError";
    this.code = code;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
    this.cause = options.cause;
  }
}

const RETRYABLE_CODES = new Set<AuthErrorCode>(["offline", "network", "rate_limited", "profile_missing"]);

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message ?? "");
  }
  return "";
}

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Map any thrown value to a `NexoraAuthError`.
 *
 * Unrecognized messages are passed through verbatim under `unknown` — that is
 * deliberate. Hiding an unexpected Supabase message (wrong project, disabled
 * provider, RLS denial) makes production incidents undebuggable.
 */
export function toAuthError(error: unknown, fallbackCode: AuthErrorCode = "unknown"): NexoraAuthError {
  if (error instanceof NexoraAuthError) return error;

  const raw = rawMessage(error);
  const lower = raw.toLowerCase();
  const status = statusOf(error);

  if (isOffline()) {
    return new NexoraAuthError("offline", "You appear to be offline. Reconnect and try again.", { cause: error });
  }
  if (/failed to fetch|network ?error|load failed|econnrefused|fetch failed/i.test(raw)) {
    return new NexoraAuthError("network", "We could not reach Nexora. Check your connection and retry.", { cause: error });
  }
  if (status === 429 || /rate ?limit|too many requests|email rate limit/i.test(lower)) {
    return new NexoraAuthError("rate_limited", "Too many attempts. Please wait a moment and try again.", { cause: error });
  }
  if (/invalid login credentials|invalid credentials|invalid email or password/i.test(lower)) {
    return new NexoraAuthError(
      "invalid_credentials",
      "Email or password is incorrect. If you just signed up, confirm your email first.",
      { cause: error },
    );
  }
  if (/email not confirmed|confirm your email|email_not_confirmed/i.test(lower)) {
    return new NexoraAuthError(
      "email_not_confirmed",
      "Please confirm your email address first. Check your inbox and spam folder for the Nexora link.",
      { cause: error },
    );
  }
  if (/already registered|user already exists|already been registered|duplicate key.*users/i.test(lower)) {
    return new NexoraAuthError(
      "email_taken",
      "An account with this email already exists. Log in instead, or reset your password.",
      { cause: error },
    );
  }
  if (/password should be at least|password is too short|weak password|password.*6 characters/i.test(lower)) {
    return new NexoraAuthError("weak_password", raw || "Please choose a stronger password.", { cause: error });
  }
  if (/signups? (are )?(not allowed|disabled)|signup disabled/i.test(lower)) {
    return new NexoraAuthError(
      "signup_disabled",
      "New account creation is temporarily disabled. Please contact Nexora support.",
      { cause: error },
    );
  }
  if (/jwt expired|token (has )?expired|session (from session_id claim )?(is )?(not )?expired|refresh_token_not_found|invalid refresh token/i.test(lower)) {
    return new NexoraAuthError("session_expired", "Your session expired. Please sign in again.", { cause: error });
  }
  if (/code (challenge|verifier)|pkce|both auth code and code verifier|invalid request.*code/i.test(lower)) {
    return new NexoraAuthError(
      "pkce_failed",
      "This sign-in link is invalid, already used, or was opened in a different browser. Request a new link.",
      { cause: error },
    );
  }
  if (/oauth|provider is not enabled|unsupported provider|redirect_uri/i.test(lower)) {
    return new NexoraAuthError(
      "oauth_failed",
      "Social sign-in is unavailable right now. Use your email and password instead.",
      { cause: error },
    );
  }
  if (status === 403 || /permission denied|row-level security|not authorized|forbidden/i.test(lower)) {
    return new NexoraAuthError(
      "forbidden",
      "Your account is not allowed to perform this action.",
      { cause: error },
    );
  }

  return new NexoraAuthError(fallbackCode, raw || "Something went wrong. Please try again.", { cause: error });
}

/** Convenience: the user-facing string for any thrown value. */
export function authErrorMessage(error: unknown): string {
  return toAuthError(error).message;
}

/**
 * Recovery flows must not reveal whether an email is registered.
 * Real transport failures are still surfaced so users are not left guessing.
 */
export function neutralRecoveryMessage(email: string): string {
  return `If an account exists for ${email}, we've sent a password reset link. Check your inbox and spam folder.`;
}
