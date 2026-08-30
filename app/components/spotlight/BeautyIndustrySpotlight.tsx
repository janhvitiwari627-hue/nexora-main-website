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
  filterUploadableVideos,
  type BeautySpotlightVideo,
  type BeautyVideoComment,
} from "./beautySpotlightData";

/*
 * ── BEAUTY INDUSTRY SPOTLIGHT ──────────────────────────────────────────────
 * A luxury-editorial video rail on a deep near-black stage: warm ivory serif
 * typography, champagne-gold hairlines, dark brown cards and cinematic
 * thumbnails — an exclusive professional beauty video editorial inside a
 * luxury digital magazine — layered with the interaction model people already
 * know from a video platform —
 *
 *   hover → muted YouTube autoplay → click → opens on YouTube in a new tab
 *   like · comments · share · save (never opens the destination)
 *
 * Ten data-driven slots, three cards per view on desktop with the next card
 * peeking, one per view on mobile with native swipe, and Previous/Next that
 * stop honestly at both ends.
 *
 * SOURCE-APP GATE — only videos uploaded from a Nexora app that offers video
 * upload are surfaced: `filterUploadableVideos` drops rows whose `sourceAppId`
 * belongs to an app without a video option before anything renders.
 *
 * Structure (one component per concern, no duplicated card markup):
 *   BeautyIndustrySpotlight
 *    ├── SectionHeader
 *    └── BeautyVideoCarousel
 *         └── BeautyVideoCard × N
 *              ├── VideoThumbnail (poster, duration)
 *              ├── HoverPreview   (muted YouTube embed, fade-in)
 *              ├── PlayButton
 *              ├── VideoMetadata  (channel identity, title link, category, source app)
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
  titleLead?: string;
  titleAccent?: string;
  subtitle?: string;
}

export function BeautyIndustrySpotlight({
  videos = BEAUTY_SPOTLIGHT_VIDEOS,
  resolveComments,
  eyebrow = "The Professional Edit",
  titleLead = "Beauty Industry",
  titleAccent = "Spotlight",
  subtitle = "Discover products, brands and innovations trusted by beauty professionals.",
}: BeautyIndustrySpotlightProps) {
  // Source-app gate: only videos uploaded from apps that offer video upload.
  const visibleVideos = filterUploadableVideos(videos);

  // Nothing configured → no empty stage. The section simply is not there.
  if (visibleVideos.length === 0) return null;

  return (
    <SpotlightInteractionsProvider>
      <PreviewCoordinatorProvider>
        <SpotlightStage
          videos={visibleVideos}
          resolveComments={resolveComments}
          eyebrow={eyebrow}
          titleLead={titleLead}
          titleAccent={titleAccent}
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
  titleLead: string;
  titleAccent: string;
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
  titleLead,
  titleAccent,
  subtitle,
}: SpotlightStageProps) {
  const carousel = useCarouselScroll();

  return (
    <section id={SECTION_ID} className="bis-section" aria-labelledby={HEADING_ID}>
      <SectionHeader
        eyebrow={eyebrow}
        titleLead={titleLead}
        titleAccent={titleAccent}
        subtitle={subtitle}
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
          Hover a card to auto-play a muted YouTube preview ·{" "}
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

