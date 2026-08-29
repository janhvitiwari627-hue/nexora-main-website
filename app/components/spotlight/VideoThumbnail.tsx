"use client";

import { useState } from "react";
import { brandMonogram, tierSlug, type BeautySpotlightVideo } from "./beautySpotlightData";

/*
 * Thumbnail media layer: lazy poster image + the duration badge.
 *
 * Three honest states, one component:
 *   pending → soft skeleton wash while the lazy image is in flight
 *   loaded  → the configured poster
 *   failed  → branded fallback poster (also used when no URL is configured)
 * A broken remote image can never leave a hole or an alt-text box in the grid.
 *
 * The <img> carries alt="" on purpose: the enclosing watch anchor already owns
 * the accessible name ("Watch <title> by <brand>"), so announcing the file
 * again would be noise.
 */
export function VideoThumbnail({ video }: { video: BeautySpotlightVideo }) {
  const [status, setStatus] = useState<"pending" | "loaded" | "failed">("pending");
  const hasImage = video.thumbnailUrl.trim().length > 0;
  const showFallback = !hasImage || status === "failed";

  return (
    <>
      {hasImage && !showFallback && (
        /* Plain <img>, matching the rest of this codebase: next/image is used
           nowhere here and the vinext renderer is not verified against it (see
           the same documented adaptation in components/premium/TrendingShops).
           The poster is already lazy + async-decoded, and a failed load falls
           back to the branded poster below. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="bis-thumb-img"
          data-loaded={status === "loaded" ? "true" : "false"}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
        />
      )}

      {hasImage && status === "pending" && (
        <span className="bis-thumb-skeleton" aria-hidden="true" />
      )}

      {showFallback && <FallbackPoster video={video} />}

      {/* Bottom-right duration pill (dark translucent, platform-style). */}
      <span className="bis-duration">{video.duration}</span>
    </>
  );
}

/**
 * Branded placeholder poster used when no thumbnail is configured and when a
 * configured thumbnail fails to load. Tier-tinted gradient + brand monogram —
 * the card keeps its premium editorial look with zero external assets.
 */
function FallbackPoster({ video }: { video: BeautySpotlightVideo }) {
  return (
    <div
      className={`bis-poster bis-poster--${tierSlug(video.badge)}`}
      aria-hidden="true"
    >
      <span className="bis-poster-glow" />
      <span className="bis-poster-mono">{brandMonogram(video.brandName)}</span>
      <span className="bis-poster-brand">{video.brandName}</span>
    </div>
  );
}
