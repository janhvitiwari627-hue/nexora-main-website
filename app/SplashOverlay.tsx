"use client";

import { useEffect, useRef, useState } from "react";
import { SplashScreen } from "./SplashScreen";

const SPLASH_SESSION_KEY = "nexora:splash:shown";
const SPLASH_MIN_MS = 1400;
const SPLASH_FADE_MS = 400;
const SPLASH_FALLBACK_MS = 3500;

/**
 * Short brand splash overlay for the homepage.
 *
 * Pure presentation, mounted above the Main Website Dashboard:
 *   - no auth logic, no session reads, no routing — it can never redirect
 *     `/` to a role portal or anywhere else;
 *   - the dashboard is rendered underneath from the first paint, so the
 *     splash can never block `/` or loop;
 *   - it plays once per browser session, so a normal refresh opens the
 *     dashboard immediately;
 *   - a hard fallback "Continue" action exists as a last resort, mirroring
 *     the manual escape hatch of the original splash.
 */
export function SplashOverlay() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    // Play only once per browser session so refresh lands straight on the
    // dashboard instead of replaying the intro.
    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") return;
    } catch {
      // Storage unavailable — still fine, the splash simply replays.
    }

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    const dismiss = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setFading(true);
      later(() => setVisible(false), SPLASH_FADE_MS);
    };

    // Fail-safe: the overlay can never trap the user behind the splash.
    later(() => {
      if (!dismissedRef.current) setShowFallback(true);
    }, SPLASH_FALLBACK_MS);

    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    } catch {
      // Ignore — worst case the splash replays on the next visit.
    }

    setVisible(true);
    later(dismiss, SPLASH_MIN_MS);

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="splash-overlay"
      aria-hidden={fading}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fcf9f8",
        opacity: fading ? 0 : 1,
        transition: `opacity ${SPLASH_FADE_MS}ms ease-in-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <SplashScreen
        showFallback={showFallback}
        onContinue={() => {
          dismissedRef.current = true;
          setVisible(false);
        }}
      />
    </div>
  );
}
