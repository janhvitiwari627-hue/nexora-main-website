import { NexoraRoot } from "../NexoraRoot";

/**
 * Dedicated authentication route — Sign Up (`/signup`).
 *
 * First-class route for the Sign Up / Log in flow (the `/login` sibling
 * lives at `app/login/page.tsx`). The homepage carries no embedded
 * login/signup UI — its "Log in" / "Get Started" entry points route here,
 * where `NexoraApp` renders the dedicated `AuthPage` (signup mode).
 *
 * `/auth/signup` remains supported as a canonical alias for deep links.
 */
export default function SignupPage() {
  return <NexoraRoot initialPath="/signup" />;
}
