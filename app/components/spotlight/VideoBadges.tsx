"use client";

import { tierSlug, type BeautySpotlightVideo } from "./beautySpotlightData";

/*
 * Card badge row: tier pill (DIAMOND / PLATINUM / GOLD) top-left, sponsorship
 * disclosure top-right — the premium pill treatment from the reference.
 *
 * Both are data-driven and honest: `badge` picks the pill's tone, and the
 * SPONSORED pill renders only when `sponsored` is true, so paid placement is
 * always disclosed and never implied by styling alone.
 */
export function VideoBadges({ video }: { video: BeautySpotlightVideo }) {
  return (
    <div className="bis-badges">
      <span className={`bis-tier bis-tier--${tierSlug(video.badge)}`}>
        {video.badge}
      </span>
      {video.sponsored && (
        <span className="bis-sponsored">
          <span aria-hidden="true">✦</span> SPONSORED
        </span>
      )}
    </div>
  );
}
