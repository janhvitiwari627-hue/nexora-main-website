"use client";

import { brandMonogram, tierSlug, type BeautySpotlightVideo } from "./beautySpotlightData";
import { WatchLink } from "./WatchLink";

/*
 * Card metadata: channel identity, then the title, then the category.
 *
 * The channel row reads like a professional video platform without copying
 * anyone's branding: a small tier-tinted circular avatar carrying the brand
 * monogram, the channel name, and a tiny champagne verification seal.
 *
 * The title is the card's h3 (the section owns the h2) and is itself a watch
 * link — clicking it opens the configured destination in a new tab, exactly
 * like the thumbnail. Two-line clamp keeps every card the same height, so the
 * row never reflows.
 */
export function VideoMetadata({ video }: { video: BeautySpotlightVideo }) {
  return (
    <div className="bis-meta">
      <div className="bis-channel">
        <span
          className={`bis-avatar bis-avatar--${tierSlug(video.badge)}`}
          aria-hidden="true"
        >
          {brandMonogram(video.brandName)}
        </span>
        <span className="bis-channel-name">
          <span className="bis-brand">{video.brandName}</span>
          <svg
            className="bis-verified"
            viewBox="0 0 24 24"
            focusable="false"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path
              d="M8 12.6l2.7 2.7 5.3-5.9"
              fill="none"
              stroke="#20180f"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <h3 className="bis-title">
        <WatchLink video={video} className="bis-title-link">
          {video.title}
        </WatchLink>
      </h3>
      <p className="bis-category">{video.category}</p>
    </div>
  );
}
