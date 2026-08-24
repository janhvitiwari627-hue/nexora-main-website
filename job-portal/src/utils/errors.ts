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
