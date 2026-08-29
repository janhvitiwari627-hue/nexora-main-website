"use client";

/*
 * Large centred play affordance over the thumbnail.
 *
 * It lives INSIDE the watch anchor, so it is decorative to assistive tech
 * (aria-hidden) and inherits the link's click/keyboard behaviour — clicking
 * the triangle is clicking "watch". Hover scales it up slightly; once the
 * silent preview is on screen it steps back (smaller + softer) so the clip,
 * not the button, is what you see.
 */
export function PlayButton({ previewing = false }: { previewing?: boolean }) {
  return (
    <span
      className="bis-play"
      data-previewing={previewing ? "true" : "false"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M8.2 5.4a.7.7 0 0 1 1.06-.6l9.1 6.6a.7.7 0 0 1 0 1.2l-9.1 6.6a.7.7 0 0 1-1.06-.6V5.4Z" />
      </svg>
    </span>
  );
}
