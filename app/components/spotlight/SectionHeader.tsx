"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/*
 * Section header: eyebrow, title, subtitle on the left; the carousel arrows on
 * the right (per the reference layout).
 *
 * The arrows are real buttons with honest disabled states: Previous is dead at
 * the first page and Next is dead once the final videos are on screen, so the
 * control always tells the truth about how much is left. No infinite loop —
 * the ends are ends.
 */
interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Total video slots, surfaced as a quiet "N videos" chip. */
  total: number;
  headingId: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  total,
  headingId,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: SectionHeaderProps) {
  return (
    <header className="bis-header">
      <div className="bis-header-copy">
        <span className="bis-eyebrow">
          {eyebrow}
          <span className="bis-eyebrow-count">{total} videos</span>
        </span>
        <h2 id={headingId}>{title}</h2>
        <p className="bis-subtitle">{subtitle}</p>
      </div>

      <div className="bis-controls" role="group" aria-label="Carousel navigation">
        <button
          type="button"
          className="bis-arrow"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous videos"
          title="Previous"
        >
          <ChevronLeft aria-hidden="true" className="bis-arrow-icon" />
          <span className="bis-arrow-label">Previous</span>
        </button>
        <button
          type="button"
          className="bis-arrow"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next videos"
          title="Next"
        >
          <span className="bis-arrow-label">Next</span>
          <ChevronRight aria-hidden="true" className="bis-arrow-icon" />
        </button>
      </div>
    </header>
  );
}
