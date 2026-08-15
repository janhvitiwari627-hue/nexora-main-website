/**
 * Canonical Nexora authentication handoff.
 *
 * This imported app is a static catalog/demo surface. It must NEVER create its
 * own user accounts or session. All real sign-in / sign-up happens through the
 * canonical Nexora authentication routes, which use the single shared Supabase
 * project (qwaehqsmodekbgvnaavz.supabase.co). That preserves the same session
 * and `auth.users.id` across every Nexora app.
 *
 * The mock catalog data (see data/mockData.ts) is display-only and is
 * intentionally never used to mint accounts.
 */

export const BEAUTY_INDUSTRY_PATH = "/distributors-beauty-industry/";

const loginUrl = () => `/login?returnTo=${encodeURIComponent(BEAUTY_INDUSTRY_PATH)}`;
const signupUrl = () => `/signup?returnTo=${encodeURIComponent(BEAUTY_INDUSTRY_PATH)}`;

/** Replace the local/mock login with the canonical Nexora Login route. */
export function redirectToNexoraLogin(): void {
  window.location.assign(loginUrl());
}

/** Replace the local/mock signup with the canonical Nexora Sign up route. */
export function redirectToNexoraSignup(): void {
  window.location.assign(signupUrl());
}
