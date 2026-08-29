"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Carousel scroll mechanics for the Beauty Industry Spotlight.
 *
 * The track is a native horizontal scroller with scroll-snap, which is what
 * makes touch swipe, trackpad flick, mouse wheel and drag all work for free on
 * mobile. The arrows are thin wrappers over scrollTo(), so they can never
 * desync from what the user did by hand.
 *
 * The geometry helpers below are pure functions of the track's three
 * measurements — they are unit-tested directly, and the hook just keeps those
 * measurements fresh (scroll, resize, and any card size change).
 */

export interface CarouselMetrics {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}

const EDGE_TOLERANCE_PX = 1;

/** Sub-pixel rounding differs per browser, so edge tests allow 1px of slack. */
export function carouselEdges(
  metrics: CarouselMetrics,
): { canPrev: boolean; canNext: boolean } {
  const maxScroll = Math.max(metrics.scrollWidth - metrics.clientWidth, 0);
  return {
    canPrev: metrics.scrollLeft > EDGE_TOLERANCE_PX,
    canNext: metrics.scrollLeft < maxScroll - EDGE_TOLERANCE_PX,
  };
}

/**
 * Arrow step: one viewport-width of the track, i.e. the next "page" of cards
 * (three on desktop, two on tablet, one on mobile). Page stepping keeps the
 * peeking card as the first card of the next page, so no video is skipped and
 * the last page always lands flush at the end.
 */
export function carouselStep(metrics: CarouselMetrics): number {
  return Math.max(Math.round(metrics.clientWidth), 1);
}

/** Clamped target for an arrow press: never negative, never past the end. */
export function carouselTarget(
  metrics: CarouselMetrics,
  direction: -1 | 1,
): number {
  const maxScroll = Math.max(metrics.scrollWidth - metrics.clientWidth, 0);
  const next = metrics.scrollLeft + direction * carouselStep(metrics);
  return Math.min(Math.max(next, 0), maxScroll);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface CarouselScroll {
  trackRef: React.RefObject<HTMLUListElement | null>;
  canPrev: boolean;
  canNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  /** Attach to the track's onScroll (passive). */
  handleScroll: () => void;
}

export function useCarouselScroll(): CarouselScroll {
  const trackRef = useRef<HTMLUListElement | null>(null);
  // All zeros on the server and on first client paint: both arrows render
  // disabled until the track has been measured, so server and client markup
  // agree and nothing hydrates into a different state.
  const [metrics, setMetrics] = useState<CarouselMetrics>({
    scrollLeft: 0,
    clientWidth: 0,
    scrollWidth: 0,
  });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const next = {
      scrollLeft: track.scrollLeft,
      clientWidth: track.clientWidth,
      scrollWidth: track.scrollWidth,
    };
    setMetrics((current) =>
      current.scrollLeft === next.scrollLeft &&
      current.clientWidth === next.clientWidth &&
      current.scrollWidth === next.scrollWidth
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    // ResizeObserver catches card growth (fonts loading, a poster swapping in)
    // that changes scrollWidth without a window resize.
    const observer =
      typeof ResizeObserver !== "undefined" && track
        ? new ResizeObserver(() => measure())
        : null;
    if (observer && track) observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollTo = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const current = {
      scrollLeft: track.scrollLeft,
      clientWidth: track.clientWidth,
      scrollWidth: track.scrollWidth,
    };
    track.scrollTo({
      left: carouselTarget(current, direction),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const goPrev = useCallback(() => scrollTo(-1), [scrollTo]);
  const goNext = useCallback(() => scrollTo(1), [scrollTo]);

  const { canPrev, canNext } = carouselEdges(metrics);

  return { trackRef, canPrev, canNext, goPrev, goNext, handleScroll: measure };
}
