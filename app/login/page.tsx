import { NexoraRoot } from "../NexoraRoot";

/**
 * Dedicated authentication route — Log in (`/login`).
 *
 * This is a first-class route for the Sign Up / Log in flow (the `/signup`
 * sibling lives at `app/signup/page.tsx`). The homepage carries no embedded
 * login/signup UI — its "Log in" / "Get Started" entry points route here,
 * where `NexoraApp` renders the dedicated `AuthPage` (login mode).
 *
 * `/auth/login` remains supported as a canonical alias for PKCE callbacks
 * and deep links.
 */
export default function LoginPage() {
  return <NexoraRoot initialPath="/login" />;
}
