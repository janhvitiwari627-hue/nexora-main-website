"use client";

import { useEffect, useRef, useState } from "react";
import { homePathForRole, useAuth } from "./lib/auth";
import { SplashScreen } from "./SplashScreen";
import { LandingPage } from "./LandingPage";

/**
 * Homepage entry experience (path `/`).
 *
 * Sequence: splash overlay → landing page.
 * While the splash plays, the real session resolves via the shared
 * `@nexora/auth` provider. When it settles:
 *   - authenticated  → route straight to that role's portal
 *   - signed out     → fade the splash out and reveal the landing page
 * If session resolution hangs, a manual "Continue" action drops the splash
 * and reveals the landing page so the user is never stuck.
 */
export function HomeEntry() {
  const { loading, isAuthenticated, role } = useAuth();
  const [showLanding, setShowLanding] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    if (settledRef.current) return;

    const start = Date.now();
    const minDisplayMs = 1200;
    const maxWaitMs = 2600;
    let fallbackTimer: number | undefined;
    let settleTimer: number | undefined;

    const settle = () => {
      if (settledRef.current) return;
      const remaining = Math.max(0, minDisplayMs - (Date.now() - start));
      settleTimer = window.setTimeout(() => {
        if (settledRef.current) return;
        settledRef.current = true;
        if (isAuthenticated && role) {
          // Signed-in visitor: skip the landing, go straight to their portal.
          document.body.style.transition = "opacity 400ms ease-in-out";
          document.body.style.opacity = "0";
          window.setTimeout(() => {
            window.location.href = homePathForRole(role);
          }, 400);
        } else {
          // Signed-out visitor: reveal the marketing landing page.
          setShowLanding(true);
        }
      }, remaining);
    };

    if (!loading) {
      settle();
    } else {
      // Still resolving — offer a manual fallback if it drags on.
      fallbackTimer = window.setTimeout(() => {
        if (!settledRef.current && loading) setShowFallback(true);
      }, maxWaitMs);
    }

    return () => {
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
    };
  }, [loading, isAuthenticated, role]);

  const handleFallback = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    setShowLanding(true);
  };

  return (
    <>
      <div
        className="landing-splash"
        style={{
          opacity: showLanding ? 0 : 1,
          transition: "opacity 400ms ease-in-out",
          pointerEvents: showLanding ? "none" : "auto",
        }}
      >
        <SplashScreen showFallback={showFallback} onContinue={handleFallback} />
      </div>
      {showLanding && <LandingPage />}
    </>
  );
}
