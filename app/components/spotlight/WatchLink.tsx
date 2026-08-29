"use client";

import type { ReactNode } from "react";
import {
  safeExternalUrl,
  type BeautySpotlightVideo,
} from "./beautySpotlightData";

/*
 * The single "go watch it" affordance of a card.
 *
 * Rendered as a real anchor when a safe destination is configured — that is
 * what makes middle-click, ctrl-click, "open in new tab" and screen-reader
 * link semantics work — and as an honestly disabled button when the data row
 * has no URL yet. `rel="noopener noreferrer"` plus the http(s)-only guard in
 * `safeExternalUrl` are the whole external-navigation policy: no referrer
 * leak, no window.opener handle, no javascript:/data: URL can ever reach an
 * href from a bad data row.
 */

interface WatchLinkProps {
  video: BeautySpotlightVideo;
  className?: string;
  /** Extra class applied only in the unconfigured (disabled) state. */
  classNameUnavailable?: string;
  children: ReactNode;
}

/** Accessible name for the watch control: "Watch <title> by <brand>". */
export function watchLabel(video: BeautySpotlightVideo): string {
  return `Watch ${video.title} by ${video.brandName} (opens in a new tab)`;
}

export function WatchLink({
  video,
  className,
  classNameUnavailable,
  children,
}: WatchLinkProps) {
  const href = safeExternalUrl(video.youtubeUrl);

  if (!href) {
    return (
      <button
        type="button"
        className={classNameUnavailable ?? className}
        disabled
        aria-disabled="true"
        aria-label={`${watchLabel(video)} — video link not configured yet`}
        title="This video's watch link has not been configured yet"
      >
        {children}
      </button>
    );
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={watchLabel(video)}
    >
      {children}
    </a>
  );
}
