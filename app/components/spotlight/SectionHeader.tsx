"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/*
 * Section header, luxury-editorial style.
 *
 * Left: the flanked "THE PROFESSIONAL EDIT" eyebrow (thin champagne hairlines
 * either side), the large serif headline — "Beauty Industry" in warm ivory,
 * "Spotlight" in italic champagne — and the refined subtitle.
 * Right: the two carousel pills, Previous and Next (Next carries the slightly
 * stronger outlined treatment), aligned with the heading.
 *
 * The arrows are real buttons with honest disabled states: Previous is dead at
 * the first page and Next is dead once the final videos are on screen, so the
 * control always tells the truth about how much is left. No infinite loop —
 * the ends are ends.
 */
interface SectionHeaderProps {
  eyebrow: string;
  /** Lead of the headline, e.g. "Beauty Industry" — warm ivory. */
  titleLead: string;
  /** Accent of the headline, e.g. "Spotlight" — italic champagne. */
  titleAccent: string;
  subtitle: string;
  headingId: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function SectionHeader({
  eyebrow,
  titleLead,
  titleAccent,
  subtitle,
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
          <span className="bis-eyebrow-line" aria-hidden="true" />
          {eyebrow}
          <span className="bis-eyebrow-line bis-eyebrow-line--right" aria-hidden="true" />
        </span>
        <h2 id={headingId}>
          <span className="bis-title-lead">{titleLead}</span>{" "}
          <span className="bis-title-accent">{titleAccent}</span>
        </h2>
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
          className="bis-arrow bis-arrow--next"
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
