"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./lib/auth";
import { websiteClientOptions } from "./lib/supabaseClient";
import { NexoraApp } from "./nexora-app";

/**
 * Single auth boundary for every main-website route.
 *
 * Keeping this wrapper separate from the server route modules lets the shared
 * provider restore the same-origin PKCE session before any route reads it.
 * `websiteClientOptions` carries the statically inlined NEXT_PUBLIC_* values
 * so AuthProvider and marketplace fetches share one client.
 */
let appMountLogged = false;

export function NexoraRoot({ initialPath }: { initialPath: string }) {
  useEffect(() => {
    if (appMountLogged) return;
    appMountLogged = true;
    console.info("App mounted successfully");
  }, []);

  return (
    <AuthProvider clientOptions={websiteClientOptions}>
      {/* reducedMotion="user" makes every framer-motion animation in the app
          (hero entrance, AnimatedSection, StatsCounter, …) honour the OS
          "reduce motion" setting — matching the CSS reduced-motion contract
          the homepage already tests for. */}
      <MotionConfig reducedMotion="user">
        <NexoraApp initialPath={initialPath} />
      </MotionConfig>
    </AuthProvider>
  );
}
