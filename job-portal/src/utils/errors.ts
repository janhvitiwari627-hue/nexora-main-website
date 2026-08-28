/**
 * Error normalization for Supabase responses.
 *
 * WHY THIS EXISTS (the "Unable to create account" bug):
 * supabase-js (postgrest-js) does NOT reject with Error instances unless you
 * opt into `.throwOnError()`. The `error` field it returns is a plain JSON
 * object — `JSON.parse(body)` for API errors (e.g. PGRST202 "function not
 * found", RLS denials, constraint violations) and a hand-built
 * `{ message, details, hint, code }` literal for network/CORS failures.
 *
 * Any code that does `throw error` and any catch block that does
 * `err instanceof Error ? err.message : 'generic fallback'` therefore
 * silently discards the real backend message and shows the generic one.
 *
 * Every catch block in this app must extract messages through
 * `getErrorMessage`, and the service layer must throw through `asError`.
 */

type SupabaseErrorShape = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
  status?: unknown;
  error_description?: unknown;
};

/** Extract the most specific human-readable message from any thrown value. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message.trim() || fallback;
  }
  if (typeof error === 'string') {
    return error.trim() || fallback;
  }
  if (error && typeof error === 'object') {
    const shape = error as SupabaseErrorShape;
    const message =
      (typeof shape.message === 'string' && shape.message.trim()) ||
      (typeof shape.error_description === 'string' && shape.error_description.trim()) ||
      '';
    if (message) {
      // Surface the PostgREST/PostgreSQL error code — it is the single most
      // useful datum when a user reports a failure (e.g. PGRST202, 23505).
      const code = typeof shape.code === 'string' && shape.code.trim() ? ` [${shape.code}]` : '';
      return `${message}${code}`;
    }
  }
  return fallback;
}

/**
 * Normalize any thrown value into a real Error (preserving the original as
 * `cause` and copying `code`/`details`/`hint` for programmatic handling).
 */
export function asError(error: unknown, fallback = 'Request failed.'): Error {
  if (error instanceof Error) return error;
  const normalized = new Error(getErrorMessage(error, fallback), { cause: error });
  if (error && typeof error === 'object') {
    const shape = error as SupabaseErrorShape;
    const carrier = normalized as Error & { code?: unknown; details?: unknown; hint?: unknown };
    if (shape.code !== undefined) carrier.code = shape.code;
    if (shape.details !== undefined) carrier.details = shape.details;
    if (shape.hint !== undefined) carrier.hint = shape.hint;
  }
  return normalized;
}

/** The PostgREST code returned when an RPC function does not exist. */
export const PG_FUNCTION_NOT_FOUND_CODES = new Set(['PGRST202', '42883']);

export function isMissingFunctionError(error: unknown): boolean {
  const code =
    error && typeof error === 'object' ? (error as SupabaseErrorShape).code : undefined;
  return typeof code === 'string' && PG_FUNCTION_NOT_FOUND_CODES.has(code);
}

// ---------------------------------------------------------------------------
// Portal email conflicts (duplicate-email sign-up)
// ---------------------------------------------------------------------------

/** The two portal roles a browser is allowed to self-assign. */
export type PortalRole = 'seeker' | 'employer';

/** The server-authoritative portal state of an email address. */
export type PortalEmailRole = 'job_seeker' | 'employer' | 'unassigned';

export const portalRoleLabel = (role: PortalRole): string =>
  role === 'seeker' ? 'Job Seeker' : 'Employer';

/** Narrow the portal role a browser asked for onto the two public roles. */
export const requestedPortalRole = (role: string): PortalRole =>
  role === 'employer' ? 'employer' : 'seeker';

const portalRoleFromBackend = (role: PortalEmailRole): PortalRole =>
  role === 'employer' ? 'employer' : 'seeker';

/** "a Job Seeker" / "an Employer" — keeps the product copy grammatical. */
const withArticle = (label: string): string => (/^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`);

export type PortalEmailConflictInput = {
  /** Server-reported state of the email that was submitted. */
  existingRole: PortalEmailRole;
  /** Portal the user was signing up through. */
  requestedRole: PortalRole;
  /** `null` when the deployment cannot report email-confirmation state. */
  emailConfirmed: boolean | null;
};

/**
 * WHY THIS EXISTS (the dead-end "already registered" bug):
 * sign-up used to answer a duplicate email with
 *   "This email is already registered as a Job Seeker. Please sign in through
 *    the Job Seeker portal."
 * — which points the user at the screen they are already standing on and gives
 * them no way forward. The worst case was worse: an account whose verification
 * email was never opened can neither sign up (duplicate) nor sign in
 * ("Email not confirmed"), so the user was permanently locked out.
 *
 * Every duplicate-email message is therefore written as the NEXT ACTION, and
 * the error carries the machine-readable state the screens need to render the
 * matching button (sign in instead / resend verification link).
 */
export function portalEmailConflictMessage(input: PortalEmailConflictInput): string {
  const requested = portalRoleLabel(input.requestedRole);

  if (input.existingRole === 'unassigned') {
    return (
      'This email already belongs to a Nexora account that has not chosen a Jobs portal yet. ' +
      'Sign in and you will be asked to pick your portal type once.'
    );
  }

  if (input.existingRole !== (input.requestedRole === 'seeker' ? 'job_seeker' : 'employer')) {
    return (
      `This email is already linked to ${withArticle(portalRoleLabel(portalRoleFromBackend(input.existingRole)))} account, ` +
      `so it cannot be used for the ${requested} portal. Sign in to that account, or register with a different email.`
    );
  }

  if (input.emailConfirmed === false) {
    return (
      `${withArticle(requested).replace(/^./, (c) => c.toUpperCase())} account was started with this email but never verified, so it cannot sign in yet. ` +
      'Send a new verification link below and open it to finish setting up your account.'
    );
  }

  return (
    `This email already has ${withArticle(requested)} account. Sign in with your password to continue — ` +
    'choose "Forgot password?" on the sign-in screen if you do not remember it.'
  );
}

/**
 * Thrown by the sign-up service when the email already belongs to a Nexora
 * account. Presentational screens type-guard this (they never import the
 * Supabase client) to render the one-tap recovery path.
 */
export class PortalEmailConflictError extends Error {
  readonly kind = 'portal_email_conflict' as const;
  readonly email: string;
  readonly existingRole: PortalEmailRole;
  readonly requestedRole: PortalRole;
  readonly emailConfirmed: boolean | null;

  constructor(input: PortalEmailConflictInput & { email: string }) {
    super(portalEmailConflictMessage(input));
    this.name = 'PortalEmailConflictError';
    this.email = input.email;
    this.existingRole = input.existingRole;
    this.requestedRole = input.requestedRole;
    this.emailConfirmed = input.emailConfirmed;
  }
}

export function isPortalEmailConflictError(error: unknown): error is PortalEmailConflictError {
  if (error instanceof PortalEmailConflictError) return true;
  return Boolean(
    error &&
      typeof error === 'object' &&
      (error as { kind?: unknown }).kind === 'portal_email_conflict',
  );
}
