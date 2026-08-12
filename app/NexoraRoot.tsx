"use client";

import { AuthProvider } from "./lib/auth";
import { NexoraApp } from "./nexora-app";

/**
 * Single auth boundary for every main-website route.
 *
 * Keeping this wrapper separate from the server route modules lets the shared
 * provider restore the same-origin PKCE session before any route reads it.
 */
export function NexoraRoot({ initialPath }: { initialPath: string }) {
  return (
    <AuthProvider>
      <NexoraApp initialPath={initialPath} />
    </AuthProvider>
  );
}
