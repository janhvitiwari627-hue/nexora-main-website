"use client";

import {
  youtubeEmbedUrl,
  youtubeVideoId,
  type BeautySpotlightVideo,
} from "./beautySpotlightData";

/*
 * Muted hover autoplay — the actual YouTube video, started on hover.
 *
 * The card's `youtubeUrl` is parsed to its video id and embedded as a muted
 * `youtube-nocookie` player that autoplays inline (muted autoplay is the one
 * autoplay browsers allow without a user gesture, which is exactly what makes
 * a hover-to-play YouTube preview possible without the IFrame API):
 *
 *   <iframe src="…/embed/<id>?autoplay=1&mute=1&playsinline=1&controls=0&…"
 *           allow="autoplay; …" />
 *
 * Lifecycle is driven by the coordinator: `active` is true only while this
 * card owns the single preview slot (dwell elapsed, no other card playing).
 * The iframe MOUNTS on grant and UNMOUNTS on release — unmounting is the
 * reliable cross-origin way to stop YouTube without the IFrame API handshake,
 * so mouseleave (or a carousel scroll, or a hidden tab) truly stops playback.
 *
 * The fade-in is a pure CSS keyframe on mount (see .bis-preview), so there is
 * no extra render pass and no JS timer to desync: the poster shows through
 * for the first instant, then the clip ramps in — no flash, no strobe. Clicks
 * pass through to the watch link underneath (pointer-events: none), so the
 * affordance stays "go watch it" even while a preview is playing.
 */
interface HoverPreviewProps {
  video: BeautySpotlightVideo;
  /** True only while the coordinator has granted this card the preview slot. */
  active: boolean;
}

export function HoverPreview({ video, active }: HoverPreviewProps) {
  const videoId = youtubeVideoId(video.youtubeUrl);

  if (!videoId || !active) return null;

  return (
    <iframe
      className="bis-preview"
      src={youtubeEmbedUrl(videoId)}
      title={video.title}
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
