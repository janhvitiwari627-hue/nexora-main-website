"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/*
 * Small anchored panel used by the Comments and Share controls.
 *
 * It is portalled to <body> and positioned `fixed` on purpose: the carousel
 * track is a horizontal scroller, and any absolutely positioned panel inside
 * it would be clipped by that scroll container (and would force a scrollbar).
 * Portalling keeps the panel fully visible while the card stays put — no
 * layout shift, no clipped menu.
 *
 * Behaviour: focus moves into the panel on open, Escape closes it, an outside
 * pointerdown closes it, and any scroll/resize re-anchors it so it never
 * detaches from its trigger. The owner restores focus to the trigger on close.
 */
interface PopoverProps {
  /** The control that opened the panel. */
  anchorEl: HTMLElement | null;
  /** Accessible name announced with role="dialog". */
  label: string;
  width?: number;
  /** `escape` = closed with the Escape key (focus returns to the trigger). */
  onClose: (reason: "escape" | "outside") => void;
  children: ReactNode;
}

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 10;

export function Popover({
  anchorEl,
  label,
  width = 292,
  onClose,
  children,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "below" | "above";
  } | null>(null);

  const measure = useCallback(() => {
    if (!anchorEl || !panelRef.current || typeof window === "undefined") return;
    const anchor = anchorEl.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const panelWidth = Math.min(width, window.innerWidth - VIEWPORT_MARGIN * 2);

    let left = anchor.left;
    const maxLeft = window.innerWidth - VIEWPORT_MARGIN - panelWidth;
    if (left > maxLeft) left = Math.max(VIEWPORT_MARGIN, maxLeft);

    const fitsBelow =
      anchor.bottom + ANCHOR_GAP + panel.height <= window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? anchor.bottom + ANCHOR_GAP
      : Math.max(VIEWPORT_MARGIN, anchor.top - ANCHOR_GAP - panel.height);

    setPos({ top, left, placement: fitsBelow ? "below" : "above" });
  }, [anchorEl, width]);

  // Position after mount, then stay glued on scroll/resize (capture: the
  // carousel track scrolls without bubbling to window).
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose("escape");
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose("outside");
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [anchorEl, onClose]);

  // Focus into the panel so Escape and Tab both start in the right place.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // No document during server render — a panel is a client interaction only.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className="bis-popover"
      data-placement={pos?.placement ?? "below"}
      style={{
        top: pos?.top ?? -10000,
        left: pos?.left ?? -10000,
        width: `min(${width}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
