"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { HOVER_PREVIEW_DELAY_MS } from "./beautySpotlightData";

/*
 * Hover-to-play coordination for the Beauty Industry Spotlight.
 *
 * YouTube's hover preview fires after the cursor dwells, never on a passing
 * sweep, and only ever one clip plays at a time. This module reproduces both
 * rules:
 *
 *  - `PreviewCoordinatorProvider` owns the single "which card is previewing"
 *    slot, so moving across the row cannot start three clips at once.
 *  - `useHoverPreview` owns the dwell timer (HOVER_PREVIEW_DELAY_MS) and the
 *    state machine idle → waiting → previewing → failed.
 *
 * It is a MUTED PREVIEW SYSTEM, not a YouTube embed: an iframe cannot be
 * reliably autoplayed on hover (it needs the IFrame API, a ready handshake and
 * a user-gesture-free muted start), so the production-safe equivalent is a
 * silent local clip from `previewUrl` with the poster as its fallback. A card
 * without a `previewUrl` keeps its poster — nothing flashes, nothing breaks.
 */

/** idle: nothing. waiting: dwell timer running. previewing: clip playing. */
export type HoverPreviewState = "idle" | "waiting" | "previewing" | "failed";

interface PreviewCoordinator {
  /** The one card currently allowed to play, or null. */
  activeId: string | null;
  request: (id: string) => void;
  cancel: (id: string) => void;
  /** Drops whatever is playing (carousel scroll, tab hidden). */
  releaseAll: () => void;
}

/**
 * Standalone cards (tests, other pages) render without a provider: the no-op
 * default keeps them valid, they simply never start a preview.
 */
const NOOP_COORDINATOR: PreviewCoordinator = {
  activeId: null,
  request: () => undefined,
  cancel: () => undefined,
  releaseAll: () => undefined,
};

const PreviewCoordinatorContext =
  createContext<PreviewCoordinator>(NOOP_COORDINATOR);

export function PreviewCoordinatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo<PreviewCoordinator>(
    () => ({
      activeId,
      request: (id: string) => setActiveId(id),
      cancel: (id: string) => setActiveId((current) => (current === id ? null : current)),
      releaseAll: () => setActiveId(null),
    }),
    [activeId],
  );

  // Backgrounding the tab stops any running preview (audio is muted anyway,
  // but a hidden decoder burning cycles is not a preview anyone is watching).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") value.releaseAll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [value]);

  return (
    <PreviewCoordinatorContext.Provider value={value}>
      {children}
    </PreviewCoordinatorContext.Provider>
  );
}

export function usePreviewCoordinator(): PreviewCoordinator {
  return useContext(PreviewCoordinatorContext);
}

export interface HoverPreviewControls {
  state: HoverPreviewState;
  /** True while this card's silent clip is actually on screen. */
  previewActive: boolean;
  /** Attach to the thumbnail wrapper. */
  onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void;
  /** Keyboard parity: focusing the watch control previews it too. */
  onFocus: () => void;
  onBlur: () => void;
  /** Called by the clip when playback is refused/blocked → back to poster. */
  markFailed: () => void;
}

/**
 * Dwell-timer hover preview for one card.
 *
 * @param id          stable card id (the coordinator slot key)
 * @param previewUrl  silent clip to play; empty means "poster only"
 */
export function useHoverPreview(id: string, previewUrl: string): HoverPreviewControls {
  const coordinator = usePreviewCoordinator();
  const [state, setState] = useState<HoverPreviewState>("idle");
  // Mirror of `state` for the timer callbacks: reading it inside a setState
  // updater would make the updater impure (React StrictMode calls updaters
  // twice, which would arm two timers for one hover).
  const stateRef = useRef<HoverPreviewState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPreview = previewUrl.trim().length > 0;

  const applyState = useCallback((next: HoverPreviewState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const end = useCallback(() => {
    clearTimer();
    coordinator.cancel(id);
    if (stateRef.current !== "idle") applyState("idle");
  }, [applyState, clearTimer, coordinator, id]);

  const begin = useCallback(() => {
    if (!hasPreview) return;
    // Re-entry guards, checked against the timer and the coordinator slot
    // rather than local state: if the slot was released behind our back (a
    // carousel scroll, a hidden tab) the local flag can still read
    // "previewing", and a later hover must be allowed to start again.
    if (timer.current !== null) return;
    if (coordinator.activeId === id) return;
    applyState("waiting");
    timer.current = setTimeout(() => {
      timer.current = null;
      coordinator.request(id);
      applyState("previewing");
    }, HOVER_PREVIEW_DELAY_MS);
    // `coordinator` is re-created whenever activeId changes, so it already
    // carries the latest slot value — listing activeId too is redundant.
  }, [applyState, coordinator, hasPreview, id]);

  /*
   * Unmount safety: never leave a pending timer or a stuck coordinator slot.
   *
   * The cleanup deliberately does NOT depend on `coordinator`. The provider
   * re-creates that object whenever the active slot changes — including the
   * moment THIS card takes the slot — and a cleanup keyed on its identity
   * would fire immediately after `request(id)`, cancelling the preview it had
   * just started. The cancel function is kept in a ref (refreshed every
   * render) so this effect only ever cleans up on a real unmount.
   */
  const cancelRef = useRef(coordinator.cancel);
  useEffect(() => {
    cancelRef.current = coordinator.cancel;
  });
  useEffect(() => {
    return () => {
      clearTimer();
      cancelRef.current(id);
    };
  }, [clearTimer, id]);

  // No effect mirrors "the coordinator dropped us" back into local state:
  // `previewActive` below is derived from BOTH, so a released slot stops the
  // clip on the very same render, and begin()'s guards let the next hover
  // start again. One source of truth, no cascading update.

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      // Mouse only: a touch tap or swipe must not queue a preview behind the
      // user's next action.
      if (event.pointerType !== "mouse") return;
      begin();
    },
    [begin],
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      end();
    },
    [end],
  );

  const markFailed = useCallback(() => {
    clearTimer();
    coordinator.cancel(id);
    applyState("failed");
  }, [applyState, clearTimer, coordinator, id]);

  return {
    state,
    previewActive: state === "previewing" && coordinator.activeId === id,
    onPointerEnter,
    onPointerLeave,
    onFocus: begin,
    onBlur: end,
    markFailed,
  };
}
