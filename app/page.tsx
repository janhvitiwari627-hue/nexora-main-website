import { NexoraRoot } from "./NexoraRoot";
import { SplashOverlay } from "./SplashOverlay";

/**
 * Homepage entry (path `/`).
 *
 * The Main Website Dashboard always renders here — for signed-out visitors
 * and for every authenticated role (Customer, Shop Owner, Growth Partner,
 * Delivery Partner, Admin) alike. There is deliberately no role-based
 * redirect off `/`: role portals open only from their explicit `/app/*`
 * routes (or from a header nav button the user clicks).
 *
 * The brand splash is a short, self-dismissing overlay on top of the
 * dashboard. It has no auth or routing logic: it can never redirect `/`
 * anywhere, never gate the dashboard, and plays only once per browser
 * session so a normal refresh lands straight on the dashboard.
 */
export default function Home() {
  return (
    <>
      <SplashOverlay />
      <NexoraRoot initialPath="/" />
    </>
  );
}
