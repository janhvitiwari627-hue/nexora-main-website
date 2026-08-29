"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Silent hover preview — the production-safe equivalent of a YouTube
 * hover-preview clip.
 *
 * Why not an iframe embed: a YouTube embed cannot be started on hover without
 * the IFrame API plus a ready handshake, needs network round-trips before the
 * first frame, and is frequently blocked by embed/consent policy. Instead this
 * plays the card's own `previewUrl` clip: muted (never audible), playsInline
 * (no fullscreen hijack on iOS), looped, and mounted only while the cursor is
 * dwelling — so nothing is fetched or decoded until a preview is real.
 *
 * Failure is quiet: a refused play() or a load error calls `onFailed`, the
 * clip unmounts and the poster simply stays. The crossfade is a single opacity
 * transition — no flashing, no strobe.
 */
interface HoverPreviewProps {
  url: string;
  /** True only while the coordinator has granted this card the preview slot. */
  active: boolean;
  onFailed: () => void;
}

export function HoverPreview({ url, active, onFailed }: HoverPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !active) return;
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
    } else if (!cancelled) {
      // Ancient engines whose play() returns undefined: still reveal the clip,
      // but off the synchronous path so the mount render stays single-pass.
      queueMicrotask(() => {
        if (!cancelled) setReady(true);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [active, onFailed]);

  if (!url.trim() || failed || !active) return null;

  return (
    <video
      ref={videoRef}
      className="bis-preview"
      data-ready={ready ? "true" : "false"}
      src={url}
      muted
      loop
      playsInline
      preload="none"
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
