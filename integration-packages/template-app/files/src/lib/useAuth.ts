/**
 * Template-app compatibility adapter.
 *
 * The root @nexora/auth AuthProvider owns the one session listener and all
 * canonical auth operations. Consumers import this local path only to avoid a
 * broad application rewrite.
 */
export { useAuth } from '@nexora/auth';
export type { AuthContextValue as AuthState } from '@nexora/auth';
