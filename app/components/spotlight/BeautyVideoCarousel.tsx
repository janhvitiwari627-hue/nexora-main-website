"use client";

import { BeautyVideoCard } from "./BeautyVideoCard";
import { usePreviewCoordinator } from "./previewCoordinator";
import type {
  BeautySpotlightVideo,
  BeautyVideoComment,
} from "./beautySpotlightData";

/*
 * The horizontal track.
 *
 * Native scroller + CSS scroll-snap (see .bis-track in globals.css): touch
 * swipe, trackpad flick and drag all work without a gesture library, and the
 * card count per view is pure CSS, so every breakpoint stays correct without
 * JS measurement driving layout.
 *
 * Any scroll — user or arrow — releases the hover-preview slot, because a
 * preview pinned to a card that is sliding away is a distraction, not a
 * preview.
 */
interface BeautyVideoCarouselProps {
  videos: readonly BeautySpotlightVideo[];
  trackRef: React.RefObject<HTMLUListElement | null>;
  onScroll: () => void;
  canPrev: boolean;
  canNext: boolean;
  resolveComments?: (video: BeautySpotlightVideo) => readonly BeautyVideoComment[];
}

export function BeautyVideoCarousel({
  videos,
  trackRef,
  onScroll,
  canPrev,
  canNext,
  resolveComments,
}: BeautyVideoCarouselProps) {
  const coordinator = usePreviewCoordinator();

  const handleScroll = () => {
    coordinator.releaseAll();
    onScroll();
  };

  return (
    <div
      className="bis-viewport"
      data-at-start={canPrev ? "false" : "true"}
      data-at-end={canNext ? "false" : "true"}
    >
      <ul
        className="bis-track"
        ref={trackRef}
        onScroll={handleScroll}
        // A scrollable region must be reachable by keyboard: the track takes
        // focus so arrow keys / Page Up-Down can move through all ten cards.
        tabIndex={0}
        aria-label={`Beauty industry videos — scrollable list of ${videos.length}`}
      >
        {videos.map((video) => (
          <BeautyVideoCard
            key={video.id}
            video={video}
            resolveComments={resolveComments}
          />
        ))}
      </ul>

      {/* Scroll affordances: soft fades that disappear at the matching end. */}
      <span className="bis-fade bis-fade--left" aria-hidden="true" />
      <span className="bis-fade bis-fade--right" aria-hidden="true" />
    </div>
  );
}
