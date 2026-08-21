/**
 * Template-app compatibility adapter for the canonical @nexora/auth package.
 *
 * The root <AuthProvider> from @nexora/auth owns the one Supabase session
 * listener and all canonical auth operations for this app. Every component
 * reads from the same useAuth() hook to avoid duplicate listeners.
 *
 * This file re-exports the canonical symbols and provides a no-arg
 * `signOut()` bridge for the handful of call sites in the upstream
 * application that still import a standalone function. New code should
 * prefer the canonical context methods: `const { signOut } = useAuth();`.
 *
 * NEVER create a second Supabase client or a second auth listener in this
 * application. Use the canonical @nexora/auth client and provider instead.
 */
import { getSupabaseClient, useAuth as canonicalUseAuth, type AuthContextValue } from '@nexora/auth';

export { useAuth } from '@nexora/auth';
export type { AuthContextValue as AuthState } from '@nexora/auth';

/**
 * Standalone signOut() bridge for legacy call sites.
 *
 * Reads the canonical Supabase client (the same instance the AuthProvider
 * is wired to) and ends the session there. Resolves to `void` whether the
 * underlying call succeeded or not so the upstream click handler
 * (`onClick={() => void signOut()}`) keeps working.
 */
export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut().catch(() => undefined);
}
