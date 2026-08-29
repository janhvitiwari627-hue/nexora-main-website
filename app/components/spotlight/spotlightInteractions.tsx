"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SAVE_TOAST_DURATION_MS } from "./beautySpotlightData";
import type { ReactNode } from "react";

/*
 * Like / Save state for the Beauty Industry Spotlight.
 *
 * One module-level store + one provider at the section root own both sets and
 * the single confirmation line, so every card stays in sync and no card renders
 * its own duplicate toast.
 *
 * Storage policy: localStorage only — per device, no account, no network. A
 * like or a bookmark here is a private reading habit, not marketplace data, so
 * nothing is sent anywhere and a signed-out visitor keeps it too.
 *
 * Read through `useSyncExternalStore` rather than an effect: that is the
 * SSR-safe way to hydrate from the browser without a second render pass the
 * linter (correctly) treats as a cascading update, and it means a storage write
 * from one card re-renders every subscriber immediately.
 */

const LIKES_STORAGE_KEY = "nexora-spotlight-likes-v1";
const SAVED_STORAGE_KEY = "nexora-spotlight-saved-v1";

export interface SpotlightStore {
  likes: ReadonlySet<string>;
  saved: ReadonlySet<string>;
}

const EMPTY_STORE: SpotlightStore = {
  likes: new Set<string>(),
  saved: new Set<string>(),
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Memoized snapshot: useSyncExternalStore requires a stable reference. */
let cache: SpotlightStore | null = null;

/** Reads a stored id list. Any malformed value degrades to an empty set. */
function readStoredIds(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === "string"));
  } catch {
    return new Set();
  }
}

/** Writes a stored id list. Private-browsing quota errors are swallowed. */
function writeStoredIds(key: string, ids: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* Storage unavailable (private mode / disabled) — memory keeps the state. */
  }
}

export function readSpotlightStore(): SpotlightStore {
  if (!cache) {
    cache = {
      likes: readStoredIds(LIKES_STORAGE_KEY),
      saved: readStoredIds(SAVED_STORAGE_KEY),
    };
  }
  return cache;
}

/** Server render has no storage: a stable empty store keeps markup identical. */
function getServerSnapshot(): SpotlightStore {
  return EMPTY_STORE;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: SpotlightStore): void {
  cache = next;
  listeners.forEach((listener) => listener());
}

/** Toggles one id inside a set, returning a NEW set (never mutates the cache). */
function toggleInSet(source: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(source);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** @returns the resulting state — true means "now liked/saved". */
export function toggleSpotlightLike(id: string): boolean {
  const current = readSpotlightStore();
  const likes = toggleInSet(current.likes, id);
  const nowLiked = likes.has(id);
  writeStoredIds(LIKES_STORAGE_KEY, likes);
  commit({ likes, saved: current.saved });
  return nowLiked;
}

/** @returns the resulting state — true means "now in the collection". */
export function toggleSpotlightSaved(id: string): boolean {
  const current = readSpotlightStore();
  const saved = toggleInSet(current.saved, id);
  const nowSaved = saved.has(id);
  writeStoredIds(SAVED_STORAGE_KEY, saved);
  commit({ likes: current.likes, saved });
  return nowSaved;
}

interface SpotlightInteractions {
  isLiked: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  /** Toggles the like and returns the new state (true = liked). */
  toggleLike: (id: string) => boolean;
  /** Toggles the bookmark, announces it, and returns the new state. */
  toggleSaved: (id: string) => boolean;
  /** Current confirmation copy, or null when nothing is showing. */
  toast: string | null;
}

interface SpotlightInteractionsContextValue extends SpotlightInteractions {
  store: SpotlightStore;
}

const SpotlightInteractionsContext =
  createContext<SpotlightInteractionsContextValue | null>(null);

export function SpotlightInteractionsProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribe, readSpotlightStore, getServerSnapshot);
  // A nonce rides along with the copy so repeating the SAME message (save →
  // remove → save) still produces a new object and restarts the timer.
  const [toast, setToast] = useState<{ message: string; nonce: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastNonce = useRef(0);

  // Auto-dismiss. The setState happens in a timer callback (an external
  // event), never synchronously in the effect body.
  useEffect(() => {
    if (toast === null) return;
    toastTimer.current = setTimeout(() => setToast(null), SAVE_TOAST_DURATION_MS);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = null;
    };
  }, [toast]);

  const isLiked = useCallback((id: string) => store.likes.has(id), [store]);
  const isSaved = useCallback((id: string) => store.saved.has(id), [store]);

  const toggleLike = useCallback((id: string) => toggleSpotlightLike(id), []);

  const toggleSaved = useCallback((id: string) => {
    const nowSaved = toggleSpotlightSaved(id);
    toastNonce.current += 1;
    setToast({
      message: nowSaved ? "Saved to your collection" : "Removed from your collection",
      nonce: toastNonce.current,
    });
    return nowSaved;
  }, []);

  return (
    <SpotlightInteractionsContext.Provider
      value={{ store, isLiked, isSaved, toggleLike, toggleSaved, toast: toast?.message ?? null }}
    >
      {children}
    </SpotlightInteractionsContext.Provider>
  );
}

/** Consumes the section-level like/save/toast state. */
export function useSpotlightInteractions(): SpotlightInteractions {
  const context = useContext(SpotlightInteractionsContext);
  if (!context) {
    throw new Error(
      "useSpotlightInteractions must be used inside <SpotlightInteractionsProvider>",
    );
  }
  return context;
}
