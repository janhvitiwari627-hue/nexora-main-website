"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Silent hover preview — the production-safe equivalent of a YouTube
 * hover-preview clip.
 *
 * Why not an iframe embed: a YouTube embed cannot be started on hover without
 * the IFrame API plus a ready handshake, needs network round-trips before the
 * first frame, and is frequently blocked by embed/consent policy. Instead this
 * plays the card's own `previewUrl` clip — the dedicated short muted MP4 every
 * slot carries — with exactly the briefed element behaviour:
 *
 *   <video muted playsInline loop preload="metadata" />
 *
 *   mouseenter → (coordinator dwell delay) → video.play()
 *   mouseleave → video.pause() · video.currentTime = 0 · poster returns
 *
 * Lifecycle: the element mounts when the card is first granted a preview
 * (`mounted`, a sticky flag owned by useHoverPreview) and then stays mounted —
 * paused, rewound, opacity 0 — so re-hovering resumes instantly and the leave
 * path is a real pause + rewind rather than a teardown. Nothing is fetched
 * until a preview is actually requested; `preload="metadata"` then loads just
 * enough for an immediate first frame.
 *
 * State here is deliberately minimal and derived: `ready` flips on in the
 * play() callback (never inside an effect body) and the revealed state is
 * `active && ready`, so losing the slot hides the clip on the very same
 * render without a cascading setState.
 *
 * Failure is quiet and permanent per card: a refused play() (autoplay policy,
 * decoder exhaustion, missing codec) or a load error calls `onFailed`, the
 * clip unmounts and the poster simply stays — the UI never breaks. The
 * crossfade is a single opacity transition — no flashing, no strobe.
 */
interface HoverPreviewProps {
  url: string;
  /** True only while the coordinator has granted this card the preview slot. */
  active: boolean;
  /** True once the card has ever previewed — keeps the element warm. */
  mounted: boolean;
  onFailed: () => void;
}

export function HoverPreview({ url, active, mounted, onFailed }: HoverPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    if (!active) {
      // mouseleave / lost slot / carousel scroll: pause, rewind to the poster
      // frame; the opacity ramp below reveals the thumbnail again.
      element.pause();
      try {
        element.currentTime = 0;
      } catch {
        /* Not seekable yet (metadata still in flight): a stopped element
           shows nothing anyway — the poster is what is on screen. */
      }
      return;
    }

    let cancelled = false;
    const attempt = element.play();
    // play() is a promise in every browser this ships to; the branch keeps a
    // non-conforming implementation from throwing an unhandled rejection.
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
          onFailed();
        });
    } else {
      // Ancient engines whose play() returns undefined: still reveal the clip,
      // but off the synchronous path so the mount render stays single-pass.
      queueMicrotask(() => {
        if (!cancelled) setReady(true);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [active, mounted, onFailed]);

  if (!url.trim() || failed || !mounted) return null;

  return (
    <video
      ref={videoRef}
      className="bis-preview"
      data-ready={active && ready ? "true" : "false"}
      src={url}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden="true"
      onError={() => {
        setFailed(true);
        onFailed();
      }}
    />
  );
}
