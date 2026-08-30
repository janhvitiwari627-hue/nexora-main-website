"use client";

import { HoverPreview } from "./HoverPreview";
import { PlayButton } from "./PlayButton";
import { VideoActions } from "./VideoActions";
import { VideoBadges } from "./VideoBadges";
import { VideoMetadata } from "./VideoMetadata";
import { VideoThumbnail } from "./VideoThumbnail";
import { WatchLink } from "./WatchLink";
import { useHoverPreview } from "./previewCoordinator";
import type {
  BeautySpotlightVideo,
  BeautyVideoComment,
} from "./beautySpotlightData";

/*
 * One Beauty Industry Spotlight card.
 *
 *   thumbnail → hover preview → play → title → channel → like/comment/share/save
 *
 * Anatomy of the hover behaviour, in order:
 *   1. pointer-enter on the thumbnail shell (mouse only) arms the dwell timer;
 *   2. after HOVER_PREVIEW_DELAY_MS the coordinator is asked for the single
 *      preview slot and, if granted, the muted clip fades in over the poster;
 *   3. pointer-leave (or focus loss, or a carousel scroll) clears the timer,
 *      releases the slot and the poster returns — no flash, no stuck decoder.
 *
 * The click area is the WatchLink around the thumbnail (and the title link in
 * VideoMetadata). The interaction row is a sibling, never a descendant, so
 * Like/Comments/Share/Save can never open the destination by accident.
 */
interface BeautyVideoCardProps {
  video: BeautySpotlightVideo;
  resolveComments?: (video: BeautySpotlightVideo) => readonly BeautyVideoComment[];
}

export function BeautyVideoCard({ video, resolveComments }: BeautyVideoCardProps) {
  const preview = useHoverPreview(video.id, video.previewUrl);

  return (
    <li className="bis-card" data-previewing={preview.previewActive ? "true" : "false"}>
      <div
        className="bis-thumb-shell"
        onPointerEnter={preview.onPointerEnter}
        onPointerLeave={preview.onPointerLeave}
        onFocus={preview.onFocus}
        onBlur={preview.onBlur}
      >
        {/* Tier + sponsorship pills sit above the thumbnail, as in the
            reference; the click target below is the thumbnail itself. */}
        <VideoBadges video={video} />

        <WatchLink
          video={video}
          className="bis-thumb-link"
          classNameUnavailable="bis-thumb-link bis-thumb-link--unavailable"
        >
          <span className="bis-thumb">
            <VideoThumbnail video={video} />
            <HoverPreview
              url={video.previewUrl}
              active={preview.previewActive}
              mounted={preview.previewMounted}
              onFailed={preview.markFailed}
            />
            <PlayButton previewing={preview.previewActive} />
          </span>
        </WatchLink>
      </div>

      <VideoMetadata video={video} />

      <VideoActions video={video} resolveComments={resolveComments} />
    </li>
  );
}
