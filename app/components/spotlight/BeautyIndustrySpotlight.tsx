"use client";

import { BeautyVideoCarousel } from "./BeautyVideoCarousel";
import { SectionHeader } from "./SectionHeader";
import { PreviewCoordinatorProvider } from "./previewCoordinator";
import { useCarouselScroll } from "./useCarouselScroll";
import {
  SpotlightInteractionsProvider,
  useSpotlightInteractions,
} from "./spotlightInteractions";
import {
  BEAUTY_SPOTLIGHT_VIDEOS,
  type BeautySpotlightVideo,
  type BeautyVideoComment,
} from "./beautySpotlightData";

/*
 * ── BEAUTY INDUSTRY SPOTLIGHT ──────────────────────────────────────────────
 * A premium, editorial video rail: the calm light-gray stage and white cards of
 * the reference design, layered with the interaction model people already know
 * from a video platform —
 *
 *   hover → silent preview → click → destination opens in a new tab
 *   like · comments · share · save (never opens the destination)
 *
 * Ten data-driven slots, three cards per view on desktop with the next card
 * peeking, one per view on mobile with native swipe, and Previous/Next that
 * stop honestly at both ends.
 *
 * Structure (one component per concern, no duplicated card markup):
 *   BeautyIndustrySpotlight
 *    ├── SectionHeader
 *    └── BeautyVideoCarousel
 *         └── BeautyVideoCard × N
 *              ├── VideoThumbnail (poster, tier + sponsored pills, duration)
 *              ├── HoverPreview   (muted clip, fade-in, quiet failure)
 *              ├── PlayButton
 *              ├── VideoMetadata  (channel, title link, category)
 *              └── VideoActions   (like, comments, share, save)
 *
 * Nothing about a video is hardcoded here: pass `videos` (from an admin table,
 * a CMS, a hook) to replace the placeholder rows.
 */

const SECTION_ID = "beauty-industry-spotlight";
const HEADING_ID = "beauty-industry-spotlight-heading";

export interface BeautyIndustrySpotlightProps {
  /** Video slots. Defaults to the ten placeholder entries. */
  videos?: readonly BeautySpotlightVideo[];
  /** Supplies a comment thread for a card once the site's system is wired up. */
  resolveComments?: (video: BeautySpotlightVideo) => readonly BeautyVideoComment[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function BeautyIndustrySpotlight({
  videos = BEAUTY_SPOTLIGHT_VIDEOS,
  resolveComments,
  eyebrow = "Beauty Industry",
  title = "Beauty Industry Spotlight",
  subtitle = "Discover products, brands and innovations trusted by beauty professionals.",
}: BeautyIndustrySpotlightProps) {
  // Nothing configured → no empty stage. The section simply is not there.
  if (videos.length === 0) return null;

  return (
    <SpotlightInteractionsProvider>
      <PreviewCoordinatorProvider>
        <SpotlightStage
          videos={videos}
          resolveComments={resolveComments}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
        />
      </PreviewCoordinatorProvider>
    </SpotlightInteractionsProvider>
  );
}

export default BeautyIndustrySpotlight;

interface SpotlightStageProps {
  videos: readonly BeautySpotlightVideo[];
  resolveComments?: (video: BeautySpotlightVideo) => readonly BeautyVideoComment[];
  eyebrow: string;
  title: string;
  subtitle: string;
}

/**
 * The section itself. Split from the exported component only so the two
 * providers sit above every consumer (the toast reads the interaction
 * context, the carousel reads the preview coordinator).
 */
function SpotlightStage({
  videos,
  resolveComments,
  eyebrow,
  title,
  subtitle,
}: SpotlightStageProps) {
  const carousel = useCarouselScroll();

  return (
    <section id={SECTION_ID} className="bis-section" aria-labelledby={HEADING_ID}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        total={videos.length}
        headingId={HEADING_ID}
        canPrev={carousel.canPrev}
        canNext={carousel.canNext}
        onPrev={carousel.goPrev}
        onNext={carousel.goNext}
      />

      <BeautyVideoCarousel
        videos={videos}
        trackRef={carousel.trackRef}
        onScroll={carousel.handleScroll}
        canPrev={carousel.canPrev}
        canNext={carousel.canNext}
        resolveComments={resolveComments}
      />

      <p className="bis-hint">
        {/* The hover clause is a mouse affordance — hidden on touch-only
            devices so the hint never promises something a tap cannot do. */}
        <span className="bis-hint-hover">
          Hover a thumbnail for a silent preview ·{" "}
        </span>
        swipe or use the arrows to browse all {videos.length} videos
      </p>

      <SpotlightToast />
    </section>
  );
}

/** The confirmation line. Always mounted so the live region is registered. */
function SpotlightToast() {
  const { toast } = useSpotlightInteractions();
  return (
    <p
      className="bis-toast"
      role="status"
      aria-live="polite"
      data-visible={toast ? "true" : "false"}
    >
      {toast ?? ""}
    </p>
  );
}

