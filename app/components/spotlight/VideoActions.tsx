"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Bookmark,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { Popover } from "./Popover";
import {
  formatCompactCount,
  safeExternalUrl,
  type BeautySpotlightVideo,
  type BeautyVideoComment,
} from "./beautySpotlightData";
import { useSpotlightInteractions } from "./spotlightInteractions";

/*
 * The interaction row: Like · Comments · Share · Save.
 *
 * Independence from the watch link is STRUCTURAL, not defensive-only: these
 * controls are siblings of the thumbnail/title anchors, never nested inside
 * them, so activating one cannot activate the other. A stopPropagation on the
 * row keeps that true even if the card wrapper ever becomes clickable.
 *
 * None of these controls navigates to YouTube except Share's network links,
 * which open the user's chosen network in a new tab with the configured URL.
 */

type PanelKind = "comments" | "share";
type CopyState = "idle" | "copied" | "failed";

const COPIED_FEEDBACK_MS = 1800;

/** Clipboard write with a legacy fallback for non-secure contexts. */
async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

interface VideoActionsProps {
  video: BeautySpotlightVideo;
  /**
   * Extension point for the site's own comment system: return the thread for
   * this video (from a database, a hook, anywhere) and it renders here.
   */
  resolveComments?: (video: BeautySpotlightVideo) => readonly BeautyVideoComment[];
}

export function VideoActions({ video, resolveComments }: VideoActionsProps) {
  const { isLiked, isSaved, toggleLike, toggleSaved } = useSpotlightInteractions();
  const [open, setOpen] = useState<PanelKind | null>(null);
  /**
   * The trigger element, captured in the click handler (never read from a ref
   * during render). The Popover needs the real node to anchor itself.
   */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const commentsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shareTriggerRef = useRef<HTMLButtonElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Unique per card, so two cards can never collide on a panel id.
  const reactId = useId();
  const commentsPanelId = `bis-comments-panel${reactId}`;
  const sharePanelId = `bis-share-panel${reactId}`;

  const liked = isLiked(video.id);
  const saved = isSaved(video.id);
  const destination = safeExternalUrl(video.youtubeUrl);
  const likeCount = video.likes + (liked ? 1 : 0);
  const thread = resolveComments ? resolveComments(video) : [];

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const closePanel = useCallback(
    (restoreFocus: boolean) => {
      if (restoreFocus) {
        const trigger =
          open === "comments" ? commentsTriggerRef : shareTriggerRef;
        trigger.current?.focus();
      }
      setOpen(null);
    },
    [open],
  );

  const handlePanelClose = useCallback(
    (reason: "escape" | "outside") => closePanel(reason === "escape"),
    [closePanel],
  );

  const togglePanel = (next: PanelKind, trigger: HTMLElement) => {
    if (open === next) {
      // Closing from its own trigger: focus is already there.
      setOpen(null);
      return;
    }
    setCopyState("idle");
    setAnchorEl(trigger);
    setOpen(next);
  };

  const handleCopy = async () => {
    if (!destination) return;
    const copied = await copyTextToClipboard(destination);
    setCopyState(copied ? "copied" : "failed");
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), COPIED_FEEDBACK_MS);
  };

  const openShareTarget = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareText = `${video.title} — ${video.brandName}`;
  const shareTargets = destination
    ? [
        {
          id: "whatsapp",
          label: "WhatsApp",
          url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${destination}`)}`,
        },
        {
          id: "facebook",
          label: "Facebook",
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(destination)}`,
        },
        {
          id: "x",
          label: "X",
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(destination)}`,
        },
      ]
    : [];

  const stop = (event: ReactMouseEvent) => event.stopPropagation();

  return (
    <div className="bis-actions" onClick={stop}>
      <button
        type="button"
        className="bis-action bis-action--like"
        aria-pressed={liked}
        aria-label={`Like ${video.title}`}
        title={liked ? "Remove your like" : "Like"}
        onClick={() => toggleLike(video.id)}
      >
        <Heart
          aria-hidden="true"
          className="bis-action-icon"
          data-filled={liked ? "true" : "false"}
        />
        <span className="bis-action-count">{formatCompactCount(likeCount)}</span>
      </button>

      <button
        type="button"
        ref={commentsTriggerRef}
        className="bis-action bis-action--comments"
        aria-expanded={open === "comments"}
        aria-controls={commentsPanelId}
        aria-label={`Open comments for ${video.title}`}
        title="Comments"
        onClick={(event) => togglePanel("comments", event.currentTarget)}
      >
        <MessageCircle aria-hidden="true" className="bis-action-icon" />
        <span className="bis-action-count">{formatCompactCount(video.comments)}</span>
      </button>

      <button
        type="button"
        ref={shareTriggerRef}
        className="bis-action bis-action--share"
        aria-expanded={open === "share"}
        aria-controls={sharePanelId}
        aria-haspopup="menu"
        aria-label={`Share ${video.title}`}
        title="Share"
        onClick={(event) => togglePanel("share", event.currentTarget)}
      >
        <Share2 aria-hidden="true" className="bis-action-icon" />
      </button>

      <button
        type="button"
        className="bis-action bis-action--save"
        aria-pressed={saved}
        aria-label={`Save ${video.title}`}
        title={saved ? "Remove from your collection" : "Save to your collection"}
        onClick={() => toggleSaved(video.id)}
      >
        <Bookmark
          aria-hidden="true"
          className="bis-action-icon"
          data-filled={saved ? "true" : "false"}
        />
      </button>

      {open === "comments" && (
        <Popover
          anchorEl={anchorEl}
          label={`Comments for ${video.title}`}
          width={320}
          onClose={handlePanelClose}
        >
          <div id={commentsPanelId} className="bis-panel">
            <div className="bis-panel-head">
              <h4 className="bis-panel-title">Comments</h4>
              <span className="bis-panel-count">
                {formatCompactCount(video.comments)}
              </span>
              <button
                type="button"
                className="bis-panel-close"
                aria-label={`Close comments for ${video.title}`}
                onClick={() => closePanel(true)}
              >
                <X aria-hidden="true" className="bis-panel-close-icon" />
              </button>
            </div>

            {thread.length > 0 ? (
              <ul className="bis-thread">
                {thread.map((comment) => (
                  <li className="bis-thread-item" key={comment.id}>
                    <span className="bis-thread-author">{comment.author}</span>
                    <span className="bis-thread-when">{comment.postedAt}</span>
                    <p className="bis-thread-body">{comment.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="bis-panel-empty">
                No comments yet. This panel is the site&rsquo;s own discussion
                surface — it stays on the page and never opens YouTube.
              </p>
            )}

            <p className="bis-panel-note">
              {formatCompactCount(video.comments)} comment
              {video.comments === 1 ? "" : "s"} · the Nexora comment system
              connects here.
            </p>
          </div>
        </Popover>
      )}

      {open === "share" && (
        <Popover
          anchorEl={anchorEl}
          label={`Share ${video.title}`}
          width={248}
          onClose={handlePanelClose}
        >
          <div
            id={sharePanelId}
            className="bis-panel bis-panel--share"
            role="menu"
            aria-label={`Share ${video.title}`}
          >
            <button
              type="button"
              role="menuitem"
              className="bis-share-item"
              disabled={!destination}
              onClick={() => void handleCopy()}
            >
              <span className="bis-share-icon" aria-hidden="true">
                {copyState === "copied" ? (
                  <Check className="bis-action-icon" />
                ) : (
                  <Copy className="bis-action-icon" />
                )}
              </span>
              <span className="bis-share-label">
                {copyState === "copied"
                  ? "Link copied"
                  : copyState === "failed"
                    ? "Copy failed — try again"
                    : "Copy Link"}
              </span>
            </button>

            {shareTargets.map((target) => (
              <button
                type="button"
                role="menuitem"
                className="bis-share-item"
                key={target.id}
                onClick={() => openShareTarget(target.url)}
              >
                <span className="bis-share-icon" aria-hidden="true">
                  <ShareGlyph network={target.id} />
                </span>
                <span className="bis-share-label">{target.label}</span>
              </button>
            ))}

            {!destination && (
              <p className="bis-panel-note">
                No watch link is configured for this video yet, so there is
                nothing to share.
              </p>
            )}
          </div>
        </Popover>
      )}
    </div>
  );
}

/** Minimal, brand-neutral glyphs for the three share targets. */
function ShareGlyph({ network }: { network: string }) {
  if (network === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M12 3.5a8.4 8.4 0 0 0-7.2 12.7L4 20.5l4.5-.8A8.4 8.4 0 1 0 12 3.5Zm0 1.6a6.8 6.8 0 1 1-3.5 12.6l-.4-.2-2.3.4.4-2.2-.2-.4A6.8 6.8 0 0 1 12 5.1Zm-2.6 3.3c-.2 0-.5.1-.7.4-.3.3-.8.9-.8 1.9s.7 2 1 2.4c.3.4 1.5 2.4 3.7 3.2 1.8.7 2.2.6 2.6.5.4 0 1.3-.5 1.5-1.1.2-.6.2-1 .1-1.1l-.6-.3-1.5-.7c-.2-.1-.4 0-.5.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.3-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3Z" />
      </svg>
    );
  }
  if (network === "facebook") {
    return (
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M13.6 20.5v-7.2h2.4l.4-2.9h-2.8V8.6c0-.8.2-1.4 1.4-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.2v2.9h2.4v7.2h3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M17.3 4h2.4l-5.2 6 6.1 8h-4.8l-3.7-4.9-4.3 4.9H5.4l5.6-6.4L5.2 4H10l3.4 4.5L17.3 4Zm-.8 12.6h1.3L9.1 5.3H7.7l8.8 11.3Z" />
    </svg>
  );
}
