/**
 * Beauty Industry Spotlight — interaction contract (jsdom).
 *
 * Drives the REAL client components in a DOM: pointer events with the actual
 * dwell timer, the muted YouTube embed mount/unmount, and the interaction row.
 * These are the behaviours the render test cannot see, because they only exist
 * after hydration and after a user moves a cursor.
 *
 * Run with: node --import tsx --test tests/beauty-industry-spotlight-interaction.test.tsx
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { BeautyIndustrySpotlight } from "../app/components/spotlight/BeautyIndustrySpotlight";
import { HOVER_PREVIEW_DELAY_MS } from "../app/components/spotlight/beautySpotlightData";
import type { BeautySpotlightVideo } from "../app/components/spotlight/beautySpotlightData";

/* ── jsdom environment ───────────────────────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const win = dom.window as unknown as Window & typeof globalThis;

function installGlobals() {
  const define = (key: string, value: unknown) => {
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  };
  define("window", win);
  define("document", win.document);
  define("navigator", win.navigator);
  define("HTMLElement", win.HTMLElement);
  define("HTMLAnchorElement", win.HTMLAnchorElement);
  define("HTMLIFrameElement", win.HTMLIFrameElement);
  define("Element", win.Element);
  define("Node", win.Node);
  define("Event", win.Event);
  define("CustomEvent", win.CustomEvent);
  define("MouseEvent", win.MouseEvent);
  define("getComputedStyle", win.getComputedStyle.bind(win));
  define("requestAnimationFrame", win.requestAnimationFrame.bind(win));
  define("cancelAnimationFrame", win.cancelAnimationFrame.bind(win));
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

installGlobals();

/* ── fixtures ────────────────────────────────────────────────────────────── */

const base = {
  category: "Hair Care",
  thumbnailUrl: "",
  duration: "1:00",
  badge: "GOLD",
  sponsored: false,
  likes: 100,
  comments: 4,
  sourceAppId: "distributors-beauty-industry",
} as const;

const withPreview: BeautySpotlightVideo = {
  ...base,
  id: "fixture-preview",
  brandName: "Preview Brand",
  title: "Has A Muted Preview",
  youtubeUrl: "https://www.youtube.com/watch?v=kt8Yfs-IYqs",
};

const noPreview: BeautySpotlightVideo = {
  ...base,
  id: "fixture-poster",
  brandName: "Poster Brand",
  title: "Poster Only",
  youtubeUrl: "",
};

const secondWithPreview: BeautySpotlightVideo = {
  ...base,
  id: "fixture-preview-2",
  brandName: "Second Preview Brand",
  title: "Competes For The Preview Slot",
  youtubeUrl: "https://www.youtube.com/watch?v=eKyD4yGgpCo",
};

const VIDEOS = [withPreview, noPreview, secondWithPreview];

/* ── helpers ─────────────────────────────────────────────────────────────── */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let root: Root | null = null;
let container: HTMLElement;

async function mount() {
  container = win.document.createElement("div");
  win.document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<BeautyIndustrySpotlight videos={VIDEOS} />);
  });
}

async function unmount() {
  await act(async () => {
    root?.unmount();
  });
  root = null;
  container.remove();
}

/** The hover surface of a card (the element the dwell timer is armed on). */
function shellFor(cardIndex: number): HTMLElement {
  const card = container.querySelectorAll(".bis-card")[cardIndex];
  assert.ok(card, `card ${cardIndex} must exist`);
  const shell = card.querySelector<HTMLElement>(".bis-thumb-shell");
  assert.ok(shell, `card ${cardIndex} must have a thumbnail shell`);
  return shell;
}

/** The muted YouTube preview iframe in a card, or null. */
function previewIn(cardIndex: number): HTMLIFrameElement | null {
  return (
    container.querySelectorAll(".bis-card")[cardIndex]?.querySelector("iframe") ?? null
  );
}

/**
 * jsdom has no PointerEvent, and React derives enter/leave from the bubbling
 * pointerover/pointerout pair — so that is what a real cursor produces here.
 */
function pointer(type: "over" | "out", target: HTMLElement, pointerType = "mouse") {
  const event = new win.Event(`pointer${type}`, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => {
    target.dispatchEvent(event);
  });
}

function click(target: HTMLElement) {
  const event = new win.MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => {
    target.dispatchEvent(event);
  });
}

before(async () => {
  await mount();
});

after(async () => {
  await unmount();
  await dom.window.close();
});

/* ── Hover-to-play ───────────────────────────────────────────────────────── */

test("a passing cursor does not start a preview; dwelling does", async () => {
  const shell = shellFor(0);

  pointer("over", shell);
  assert.equal(previewIn(0), null, "no embed may mount the instant the cursor arrives");

  // Well inside the dwell window: still just the poster.
  await act(async () => {
    await wait(Math.floor(HOVER_PREVIEW_DELAY_MS / 3));
  });
  assert.equal(previewIn(0), null, "the dwell delay must actually elapse first");

  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  const embed = previewIn(0);
  assert.ok(embed, "a muted YouTube embed mounts after the dwell delay");
  assert.match(
    embed.getAttribute("src") ?? "",
    /youtube-nocookie\.com\/embed\/kt8Yfs-IYqs\?/,
  );
  const src = embed.getAttribute("src") ?? "";
  assert.match(src, /autoplay=1/, "the preview must autoplay");
  assert.match(src, /mute=1/, "the preview must be muted — the only autoplay browsers allow");
  assert.match(src, /playsinline=1/, "the preview plays inline, never fullscreen");
  assert.match(src, /controls=0/, "the preview shows no controls");
  assert.match(embed.getAttribute("allow") ?? "", /autoplay/);
  assert.equal(embed.getAttribute("aria-hidden"), "true", "the embed is decorative");
});

test("leaving stops the preview and restores the poster", async () => {
  const shell = shellFor(0);
  pointer("over", shell);
  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  const before = previewIn(0);
  assert.ok(before, "a muted YouTube embed mounts after the dwell delay");

  pointer("out", shell);
  assert.equal(previewIn(0), null, "unmounting the iframe is what stops the YouTube player");
});

test("a card with no YouTube link keeps its poster, however long you hover", async () => {
  const shell = shellFor(1);
  pointer("over", shell);
  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  assert.equal(previewIn(1), null);
  assert.ok(
    container.querySelectorAll(".bis-card")[1]?.querySelector(".bis-poster"),
    "the branded fallback poster stays on screen",
  );
  pointer("out", shell);
});

test("touch input never arms a preview", async () => {
  pointer("over", shellFor(0), "touch");
  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  // A tap must never queue a preview behind the next action.
  assert.equal(previewIn(0), null);
});

test("only one card previews at a time", async () => {
  pointer("over", shellFor(0));
  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  assert.ok(previewIn(0), "the first hovered card previews");
  assert.match(
    previewIn(0)?.getAttribute("src") ?? "",
    /embed\/kt8Yfs-IYqs/,
  );

  // The cursor moves to another card that ALSO has a link: it takes the single
  // slot, so the first card must unmount its embed rather than play two.
  pointer("over", shellFor(2));
  await act(async () => {
    await wait(HOVER_PREVIEW_DELAY_MS + 160);
  });
  assert.equal(
    previewIn(0),
    null,
    "the previously hovered card stops previewing",
  );
  assert.match(
    previewIn(2)?.getAttribute("src") ?? "",
    /embed\/eKyD4yGgpCo/,
    "the newly hovered card owns the slot",
  );

  pointer("out", shellFor(0));
  pointer("out", shellFor(2));
  assert.equal(previewIn(0), null);
  assert.equal(previewIn(1), null);
  assert.equal(previewIn(2), null);
});

/* ── Interaction row stays independent of the watch link ─────────────────── */

test("Save confirms in a live region and never navigates", async () => {
  let opened: string | null = null;
  const realOpen = win.open;
  (win as unknown as { open: (url: string) => null }).open = (url: string) => {
    opened = url;
    return null;
  };

  const card = container.querySelectorAll(".bis-card")[0];
  const save = card?.querySelector<HTMLButtonElement>('.bis-action--save');
  assert.ok(save, "the save control exists");
  assert.equal(save?.getAttribute("aria-label"), "Save Has A Muted Preview");
  click(save!);

  const toast = container.querySelector(".bis-toast");
  assert.equal(toast?.textContent, "Saved to your collection");
  assert.equal(toast?.getAttribute("data-visible"), "true");
  assert.equal(toast?.getAttribute("role"), "status");
  assert.equal(save?.getAttribute("aria-pressed"), "true");
  assert.equal(opened, null, "saving must not open the destination");

  // Toggling back is honest too.
  click(save!);
  assert.equal(container.querySelector(".bis-toast")?.textContent, "Removed from your collection");
  assert.equal(save?.getAttribute("aria-pressed"), "false");

  (win as unknown as { open: unknown }).open = realOpen;
});

test("Like flips its pressed state and its count, without navigating", async () => {
  let opened: string | null = null;
  const realOpen = win.open;
  (win as unknown as { open: (url: string) => null }).open = (url: string) => {
    opened = url;
    return null;
  };

  const card = container.querySelectorAll(".bis-card")[0];
  const like = card?.querySelector<HTMLButtonElement>(".bis-action--like");
  assert.equal(like?.querySelector(".bis-action-count")?.textContent, "100");
  click(like!);
  assert.equal(like?.getAttribute("aria-pressed"), "true");
  assert.equal(like?.querySelector(".bis-action-count")?.textContent, "101");
  assert.equal(opened, null);
  click(like!);
  assert.equal(like?.getAttribute("aria-pressed"), "false");
  assert.equal(like?.querySelector(".bis-action-count")?.textContent, "100");

  (win as unknown as { open: unknown }).open = realOpen;
});

test("Comments opens an on-page panel — not YouTube", async () => {
  let opened: string | null = null;
  const realOpen = win.open;
  (win as unknown as { open: (url: string) => null }).open = (url: string) => {
    opened = url;
    return null;
  };

  const card = container.querySelectorAll(".bis-card")[0];
  const comments = card?.querySelector<HTMLButtonElement>(".bis-action--comments");
  assert.equal(comments?.getAttribute("aria-label"), "Open comments for Has A Muted Preview");
  click(comments!);

  const panel = win.document.querySelector('[role="dialog"][aria-label="Comments for Has A Muted Preview"]');
  assert.ok(panel, "the comments panel opens");
  assert.match(panel?.textContent ?? "", /Comments/);
  assert.match(panel?.textContent ?? "", /No comments yet/);
  assert.equal(comments?.getAttribute("aria-expanded"), "true");
  assert.equal(opened, null, "comments must never open the destination");

  // Escape closes it and returns focus to the trigger.
  act(() => {
    const event = new win.Event("keydown", { bubbles: true });
    Object.defineProperty(event, "key", { value: "Escape" });
    win.document.dispatchEvent(event);
  });
  assert.equal(
    win.document.querySelector('[role="dialog"][aria-label="Comments for Has A Muted Preview"]'),
    null,
    "Escape closes the panel",
  );
  assert.equal(comments?.getAttribute("aria-expanded"), "false");

  (win as unknown as { open: unknown }).open = realOpen;
});

test("Share copies the configured video URL", async () => {
  const copied: string[] = [];
  Object.defineProperty(win.navigator, "clipboard", {
    value: { writeText: async (text: string) => void copied.push(text) },
    configurable: true,
  });

  const card = container.querySelectorAll(".bis-card")[0];
  const share = card?.querySelector<HTMLButtonElement>(".bis-action--share");
  click(share!);

  const items = [...(win.document.querySelectorAll(".bis-share-item") as NodeListOf<HTMLButtonElement>)];
  const labels = items.map((item) => item.textContent ?? "");
  assert.deepEqual(
    labels.map((label) => label.trim()),
    ["Copy Link", "WhatsApp", "Facebook", "X"],
  );

  click(items[0]!);
  await act(async () => {
    await wait(10);
  });
  assert.deepEqual(copied, ["https://www.youtube.com/watch?v=kt8Yfs-IYqs"]);
  assert.match(
    win.document.querySelector(".bis-share-item")?.textContent ?? "",
    /Link copied/,
  );

  // The network targets carry the configured URL, never an invented one.
  const whatsapp = items[1]!;
  click(whatsapp);
  await act(async () => {
    await wait(10);
  });

  // Close the menu.
  act(() => {
    const event = new win.Event("keydown", { bubbles: true });
    Object.defineProperty(event, "key", { value: "Escape" });
    win.document.dispatchEvent(event);
  });
});

test("the watch control is a real anchor with a hardened rel", () => {
  const card = container.querySelectorAll(".bis-card")[0];
  const watch = card?.querySelector<HTMLAnchorElement>("a.bis-thumb-link");
  assert.ok(watch, "a configured video renders an anchor");
  assert.equal(watch?.tagName, "A");
  assert.equal(watch?.getAttribute("target"), "_blank");
  assert.equal(watch?.getAttribute("rel"), "noopener noreferrer");
  assert.equal(watch?.getAttribute("href"), "https://www.youtube.com/watch?v=kt8Yfs-IYqs");
  // The interaction row is a sibling of the anchor, never inside it.
  assert.equal(
    watch?.querySelector(".bis-actions"),
    null,
    "like/comments/share/save must not live inside the watch link",
  );
});
