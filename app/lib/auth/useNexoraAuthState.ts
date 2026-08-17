"use client";

/**
 * Homepage Phase 1 — Section 02
 * ============================================================================
 * React binding for the shared auth-state projection.
 *
 * Shared navigation calls THIS hook — never `useAuth()` directly — so that:
 *
 *  - navigation depends on a tiny, stable surface instead of the full
 *    `AuthContextValue`, and cannot accidentally invoke a mutation such as
 *    `signOut()` or `requireRole()`;
 *  - the existing `AuthProvider` remains the single auth authority and is not
 *    modified, wrapped or duplicated;
 *  - navigation rendered outside an `AuthProvider` degrades to the signed-out
 *    state instead of throwing.
 */

import { useContext, useMemo } from "react";
import { AuthContext } from "../../../packages/auth/src";
import {
  ANONYMOUS_AUTH_STATE,
  projectAuthState,
  type NexoraAuthState,
} from "./authState";

/**
 * Read-only auth state for navigation.
 *
 * Returns `ANONYMOUS_AUTH_STATE` when no `AuthProvider` is mounted above the
 * caller, which keeps shared navigation renderable in isolation (tests,
 * storybook-style previews, static shells) without ever inventing a session.
 */
export function useNexoraAuthState(): NexoraAuthState {
  const context = useContext(AuthContext);

  return useMemo(() => {
    if (!context) return ANONYMOUS_AUTH_STATE;
    return projectAuthState(context);
  }, [context]);
}
