"use client";

import { WatchLink } from "./WatchLink";
import type { BeautySpotlightVideo } from "./beautySpotlightData";

/*
 * Card metadata: channel/brand, then the title, then the category.
 *
 * Compact platform-style type: the brand reads as the byline, the title is the
 * card's h3 (the section owns the h2) and is itself a watch link — clicking it
 * opens the configured destination in a new tab, exactly like the thumbnail.
 * Two-line clamp keeps every card the same height, so the row never reflows.
 */
export function VideoMetadata({ video }: { video: BeautySpotlightVideo }) {
  return (
    <div className="bis-meta">
      <p className="bis-brand">{video.brandName}</p>
      <h3 className="bis-title">
        <WatchLink video={video} className="bis-title-link">
          {video.title}
        </WatchLink>
      </h3>
      <p className="bis-category">{video.category}</p>
    </div>
  );
}
