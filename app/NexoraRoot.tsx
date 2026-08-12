"use client";

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
export function NexoraRoot({ initialPath }: { initialPath: string }) {
  return (
    <AuthProvider clientOptions={websiteClientOptions}>
      <NexoraApp initialPath={initialPath} />
    </AuthProvider>
  );
}
