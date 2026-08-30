/**
 * Beauty Industry Spotlight — component + data contract.
 *
 * Executes the real components with a React render (react-dom/server — no
 * browser, no Supabase) and the pure helpers directly, so this covers the
 * render path a visitor actually hits: ten data-driven cards, tier/sponsored
 * pills, duration, the accessible labels, the YouTube destination policy, the
 * source-app gate and the carousel geometry.
 *
 * Run with: node --import tsx --test tests/beauty-industry-spotlight-contract.test.tsx
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BeautyIndustrySpotlight } from "../app/components/spotlight/BeautyIndustrySpotlight";
import {
  BEAUTY_SPOTLIGHT_VIDEOS,
  VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS,
  brandMonogram,
  filterUploadableVideos,
  formatCompactCount,
  hasVideoUpload,
  safeExternalUrl,
  sourceAppById,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeVideoId,
  youtubeWatchUrl,
} from "../app/components/spotlight/beautySpotlightData";
import {
  carouselEdges,
  carouselStep,
  carouselTarget,
} from "../app/components/spotlight/useCarouselScroll";
import {
  readSpotlightStore,
  toggleSpotlightLike,
  toggleSpotlightSaved,
} from "../app/components/spotlight/spotlightInteractions";
import type { BeautySpotlightVideo } from "../app/components/spotlight/beautySpotlightData";

const read = (relative: string) =>
  readFile(new URL(`../${relative}`, import.meta.url), "utf8");

/** Mirrors React's text escaping so lookups match the emitted markup. */
const esc = (text: string) => text.replace(/'/g, "&#x27;");

const configuredVideo: BeautySpotlightVideo = {
  id: "configured-001",
  brandName: "Test Brand",
  title: "Configured Destination",
  category: "Hair Care",
  thumbnailUrl: "/products/vitamin-c-serum.jpg",
  youtubeUrl: "https://www.youtube.com/watch?v=example",
  duration: "1:30",
  badge: "GOLD",
  sponsored: false,
  likes: 10,
  comments: 2,
  sourceAppId: "distributors-beauty-industry",
};

const unconfiguredVideo: BeautySpotlightVideo = {
  id: "unconfigured-001",
  brandName: "Pending Brand",
  title: "No Destination Yet",
  category: "Hair Care",
  thumbnailUrl: "",
  youtubeUrl: "",
  duration: "1:30",
  badge: "GOLD",
  sponsored: false,
  likes: 0,
  comments: 0,
  sourceAppId: "distributors-beauty-industry",
};

const sectionHtml = renderToStaticMarkup(<BeautyIndustrySpotlight />);
const configuredHtml = renderToStaticMarkup(
  <BeautyIndustrySpotlight videos={[configuredVideo]} />,
);
const unconfiguredHtml = renderToStaticMarkup(
  <BeautyIndustrySpotlight videos={[unconfiguredVideo]} />,
);

/* ── Structure: the ten visible slots from the brief ─────────────────────── */

test("renders all ten beauty-industry slots in order", () => {
  const expected = [
    "Nexora Luxe",
    "Nexora Salon",
    "Wahl Professional",
    "L'Oréal Professionnel",
    "Schwarzkopf Professional",
    "Dyson Beauty",
    "Wella Professionals",
    "Olaplex",
    "Moroccanoil",
    "Lakmé Salon",
  ];
  assert.equal(VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS.length, 10);
  const positions = expected.map((brand) => sectionHtml.indexOf(`>${esc(brand)}</span>`));
  positions.forEach((position, index) => {
    assert.ok(position > -1, `${expected[index]} must render as a channel byline`);
  });
  // Order matters: the rail is a curated 01 → 10 sequence.
  const sorted = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sorted, "brands must render in the briefed order");
  assert.equal((sectionHtml.match(/class="bis-card"/g) ?? []).length, 10);
});

test("section header carries the briefed title, subtitle and arrows", () => {
  // "Beauty Industry" in ivory, "Spotlight" in italic champagne — two spans,
  // one serif headline.
  assert.match(sectionHtml, /class="bis-title-lead">Beauty Industry<\/span>/);
  assert.match(sectionHtml, /class="bis-title-accent">Spotlight<\/span>/);
  // The flanked editorial eyebrow.
  assert.match(sectionHtml, /class="bis-eyebrow-line"/);
  assert.match(sectionHtml, /The Professional Edit/i);
  assert.match(
    sectionHtml,
    /Discover products, brands and innovations trusted by beauty professionals\./,
  );
  assert.equal((sectionHtml.match(/aria-label="Previous videos"/g) ?? []).length, 1);
  assert.equal((sectionHtml.match(/aria-label="Next videos"/g) ?? []).length, 1);
  assert.match(sectionHtml, /aria-labelledby="beauty-industry-spotlight-heading"/);
});

test("Previous starts disabled — the rail has no infinite loop backwards", () => {
  const previous = sectionHtml.slice(
    sectionHtml.lastIndexOf("<button", sectionHtml.indexOf('aria-label="Previous videos"')),
    sectionHtml.indexOf('aria-label="Previous videos"'),
  );
  assert.match(previous, /disabled/);
});

/* ── Card anatomy: badges, duration, metadata ────────────────────────────── */

test("every card shows its data-driven tier pill and duration", () => {
  for (const video of VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS) {
    const tierClass = `bis-tier bis-tier--${video.badge.toLowerCase()}`;
    assert.ok(
      sectionHtml.includes(tierClass),
      `${video.brandName} must render the ${video.badge} pill`,
    );
    assert.ok(
      sectionHtml.includes(`>${video.badge}</span>`),
      `${video.brandName} must name its tier`,
    );
    assert.ok(
      sectionHtml.includes(`class="bis-duration">${video.duration}</span>`),
      `${video.brandName} must show duration ${video.duration}`,
    );
  }
});

test("SPONSORED is disclosed only where the data says sponsored", () => {
  const sponsoredCount = VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS.filter((v) => v.sponsored).length;
  assert.ok(sponsoredCount > 0, "the brief requires sponsored slots to exist");
  assert.ok(
    sponsoredCount < VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS.length,
    "not every slot is sponsored — the badge must stay meaningful",
  );
  assert.equal(
    (sectionHtml.match(/class="bis-sponsored"/g) ?? []).length,
    sponsoredCount,
  );
});

test("channel, title, category and source app all render from the data row", () => {
  const first = VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS[0];
  assert.ok(sectionHtml.includes(`>${esc(first.title)}</`), "title renders");
  assert.ok(sectionHtml.includes(`>${first.category}</p>`), "category renders");
  assert.match(sectionHtml, /class="bis-title"/);
  assert.match(sectionHtml, /class="bis-category"/);
  // Channel identity: circular avatar with the brand monogram + tiny seal.
  assert.match(sectionHtml, /class="bis-channel"/);
  assert.match(sectionHtml, /class="bis-avatar bis-avatar--\w+"/);
  assert.match(sectionHtml, /class="bis-verified"/);
  // Source-app wiring: "From <app>" for the first row.
  assert.match(sectionHtml, /class="bis-source"/);
  const app = sourceAppById(first.sourceAppId);
  assert.ok(app, "the first row resolves to a known source app");
  assert.ok(sectionHtml.includes(`From ${app?.name}`), "the source-app line renders");
});

/* ── Source-app gate (which app a video came from) ───────────────────────── */

test("only videos from apps with a video option are surfaced", () => {
  // Twelve mock rows exist: ten from video-capable apps, two from apps
  // without video upload (Customer App, Job Portal).
  assert.equal(BEAUTY_SPOTLIGHT_VIDEOS.length, 12);
  assert.equal(VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS.length, 10);

  const excluded = BEAUTY_SPOTLIGHT_VIDEOS.filter(
    (v) => !VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS.includes(v),
  );
  assert.equal(excluded.length, 2);
  for (const video of excluded) {
    assert.equal(
      hasVideoUpload(video.sourceAppId),
      false,
      `${video.brandName} is excluded because its app has no video upload`,
    );
  }
  // The excluded rows never reach the rendered markup.
  for (const video of excluded) {
    assert.ok(!sectionHtml.includes(esc(video.title)), `${video.title} must not render`);
  }
  // The pure gate is the same one the component uses.
  assert.deepEqual(
    filterUploadableVideos(BEAUTY_SPOTLIGHT_VIDEOS),
    VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS,
  );
});

/* ── Accessibility labels ────────────────────────────────────────────────── */

test("every interactive control has the briefed accessible label", () => {
  const first = VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS[0];
  for (const label of [
    esc(`Watch ${first.title} by ${first.brandName} (opens in a new tab)`),
    `Like ${first.title}`,
    `Open comments for ${first.title}`,
    `Share ${first.title}`,
    `Save ${first.title}`,
  ]) {
    assert.ok(sectionHtml.includes(label), `missing accessible label: ${label}`);
  }
  // Like/Save are toggle buttons, not links: they must expose pressed state.
  assert.equal((sectionHtml.match(/aria-pressed="false"/g) ?? []).length, 20);
  // Comments/Share own popovers and must expose expansion + ownership.
  assert.equal((sectionHtml.match(/aria-expanded="false"/g) ?? []).length, 20);
  assert.match(sectionHtml, /aria-live="polite"/);
});

/* ── External navigation policy ──────────────────────────────────────────── */

test("every visible slot carries a safe YouTube destination", () => {
  for (const video of VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS) {
    assert.equal(safeExternalUrl(video.youtubeUrl), video.youtubeUrl);
    assert.match(video.youtubeUrl, /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/);
    assert.equal(youtubeVideoId(video.youtubeUrl)?.length, 11);
  }
  // All ten cards render real anchors (thumbnail + title) to YouTube.
  assert.equal((sectionHtml.match(/<a class="bis-thumb-link"/g) ?? []).length, 10);
  assert.equal((sectionHtml.match(/youtube\.com\/watch/g) ?? []).length, 20);
  // The anchors are hardened against opener/referrer leaks.
  assert.equal((sectionHtml.match(/rel="noopener noreferrer"/g) ?? []).length, 20);
});

test("an unconfigured video never invents a destination", () => {
  // A row whose youtubeUrl is empty renders an honestly disabled control.
  assert.doesNotMatch(unconfiguredHtml, /youtube\.com/i);
  assert.match(unconfiguredHtml, /video link not configured yet/);
  assert.equal(
    (unconfiguredHtml.match(/class="bis-thumb-link bis-thumb-link--unavailable"/g) ?? []).length,
    1,
  );
  assert.equal(
    (unconfiguredHtml.match(/disabled="" aria-disabled="true"/g) ?? []).length,
    2, // thumbnail control + title control
  );
});

/* ── YouTube URL helpers (pure) ──────────────────────────────────────────── */

test("youtubeVideoId parses every common URL shape and rejects junk", () => {
  const id = "dQw4w9WgXcQ";
  assert.equal(youtubeVideoId(`https://www.youtube.com/watch?v=${id}`), id);
  assert.equal(youtubeVideoId(`https://youtu.be/${id}`), id);
  assert.equal(youtubeVideoId(`https://www.youtube.com/embed/${id}`), id);
  assert.equal(youtubeVideoId(`https://m.youtube.com/watch?v=${id}&t=10s`), id);
  assert.equal(youtubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(youtubeVideoId("https://example.com/watch?v=12345678901"), null);
  assert.equal(youtubeVideoId("javascript:alert(1)"), null);
  assert.equal(youtubeVideoId(""), null);
  assert.equal(youtubeVideoId(null), null);
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=short"), null);
});

test("watch, thumbnail and embed URLs derive from a single id", () => {
  const id = "dQw4w9WgXcQ";
  assert.equal(youtubeWatchUrl(id), `https://www.youtube.com/watch?v=${id}`);
  assert.equal(youtubeThumbnailUrl(id), `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  const embed = youtubeEmbedUrl(id);
  assert.ok(embed.startsWith(`https://www.youtube-nocookie.com/embed/${id}?`));
  // Muted autoplay is what lets a hover start playback without a gesture.
  assert.match(embed, /autoplay=1/);
  assert.match(embed, /mute=1/);
  assert.match(embed, /playsinline=1/);
  assert.match(embed, /controls=0/);
  assert.match(embed, new RegExp(`playlist=${id}`));
});

test("every visible slot's poster is its own YouTube thumbnail", () => {
  for (const video of VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS) {
    const id = youtubeVideoId(video.youtubeUrl);
    assert.ok(id, `${video.brandName} has a parsable id`);
    assert.equal(
      video.thumbnailUrl,
      youtubeThumbnailUrl(id),
      `${video.brandName} poster is the video's own thumbnail`,
    );
    assert.ok(
      sectionHtml.includes(`src="${video.thumbnailUrl}"`),
      `${video.brandName} poster must render`,
    );
  }
  // Ten lazy, async-decoded posters — one per card.
  assert.equal((sectionHtml.match(/loading="lazy"/g) ?? []).length, 10);
});

test("a configured video opens in a new tab with a hardened rel", () => {
  assert.match(configuredHtml, /href="https:\/\/www\.youtube\.com\/watch\?v=example"/);
  assert.match(configuredHtml, /target="_blank"/);
  assert.match(configuredHtml, /rel="noopener noreferrer"/);
  // Poster image is lazy + async decoded.
  assert.match(configuredHtml, /loading="lazy"/);
  assert.match(configuredHtml, /decoding="async"/);
});

test("safeExternalUrl only ever allows http(s)", () => {
  assert.equal(
    safeExternalUrl("https://www.youtube.com/watch?v=abc"),
    "https://www.youtube.com/watch?v=abc",
  );
  assert.equal(safeExternalUrl("http://example.com/"), "http://example.com/");
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(safeExternalUrl("//evil.example/"), null);
  assert.equal(safeExternalUrl("/salons/local"), null);
  assert.equal(safeExternalUrl("   "), null);
  assert.equal(safeExternalUrl(""), null);
  assert.equal(safeExternalUrl(null), null);
  assert.equal(safeExternalUrl(undefined), null);
});

/* ── Carousel geometry (pure) ────────────────────────────────────────────── */

test("carousel edges disable correctly at both ends", () => {
  const start = { scrollLeft: 0, clientWidth: 900, scrollWidth: 3000 };
  assert.deepEqual(carouselEdges(start), { canPrev: false, canNext: true });

  const middle = { scrollLeft: 900, clientWidth: 900, scrollWidth: 3000 };
  assert.deepEqual(carouselEdges(middle), { canPrev: true, canNext: true });

  const end = { scrollLeft: 2100, clientWidth: 900, scrollWidth: 3000 };
  assert.deepEqual(carouselEdges(end), { canPrev: true, canNext: false });

  // Sub-pixel rounding must not leave Next enabled at the end.
  const endWithSlack = { scrollLeft: 2099.4, clientWidth: 900, scrollWidth: 3000 };
  assert.deepEqual(carouselEdges(endWithSlack), { canPrev: true, canNext: false });

  // Nothing to scroll: both arrows dead.
  assert.deepEqual(carouselEdges({ scrollLeft: 0, clientWidth: 900, scrollWidth: 900 }), {
    canPrev: false,
    canNext: false,
  });
});

test("arrow paging steps one viewport and clamps to both ends", () => {
  const metrics = { scrollLeft: 0, clientWidth: 900, scrollWidth: 3000 };
  assert.equal(carouselStep(metrics), 900);
  assert.equal(carouselTarget(metrics, 1), 900);
  assert.equal(carouselTarget(metrics, -1), 0); // never negative
  assert.equal(carouselTarget({ ...metrics, scrollLeft: 1800 }, 1), 2100); // clamped to max
  assert.equal(carouselTarget({ ...metrics, scrollLeft: 2100 }, 1), 2100); // stays at the end
  assert.equal(carouselTarget({ ...metrics, scrollLeft: 300 }, -1), 0);
  // A degenerate track still yields a usable step.
  assert.equal(carouselStep({ scrollLeft: 0, clientWidth: 0, scrollWidth: 0 }), 1);
});

/* ── Copy helpers (pure) ─────────────────────────────────────────────────── */

test("count copy and monograms stay compact and honest", () => {
  assert.equal(formatCompactCount(964), "964");
  assert.equal(formatCompactCount(1284), "1.3K");
  assert.equal(formatCompactCount(12400), "12K");
  assert.equal(formatCompactCount(0), "0");
  assert.equal(formatCompactCount(-5), "0");

  assert.equal(brandMonogram("Lakmé Salon"), "LS");
  assert.equal(brandMonogram("Olaplex"), "O");
  assert.equal(brandMonogram("L'Oréal Professionnel"), "LP");
  assert.equal(brandMonogram("   "), "✦");
});

/* ── Like / Save store ───────────────────────────────────────────────────── */

test("like and save toggle through the real store", () => {
  assert.equal(readSpotlightStore().likes.has("beauty-video-001"), false);
  assert.equal(toggleSpotlightLike("beauty-video-001"), true);
  assert.equal(readSpotlightStore().likes.has("beauty-video-001"), true);
  assert.equal(toggleSpotlightLike("beauty-video-001"), false);
  assert.equal(readSpotlightStore().likes.has("beauty-video-001"), false);

  assert.equal(toggleSpotlightSaved("beauty-video-007"), true);
  assert.equal(readSpotlightStore().saved.has("beauty-video-007"), true);
  assert.equal(toggleSpotlightSaved("beauty-video-007"), false);
  assert.equal(readSpotlightStore().saved.has("beauty-video-007"), false);
});

/* ── Stylesheet + mount contracts ────────────────────────────────────────── */

test("globals.css carries the section's responsive and motion contract", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.bis-section \{/);
  // Three-card desktop view with the next card peeking; two on tablet; one on mobile.
  assert.match(css, /--bis-per-view: 3/);
  assert.match(css, /--bis-per-view: 2/);
  assert.match(css, /--bis-per-view: 1/);
  assert.match(css, /--bis-peek: 46px/);
  assert.match(css, /scroll-snap-type: x mandatory/);
  // Dark theme (the site default) must cover the section.
  assert.match(css, /html\.dark \.bis-section \{/);
  // Luxury editorial tokens: near-black stage, champagne accent, italic serif accent.
  assert.match(css, /--bis-stage: #161210/);
  assert.match(css, /--bis-accent: #d9b46a/);
  assert.match(css, /\.bis-title-accent \{\s*\n?\s*font-style: italic/);
  // Flanked eyebrow hairlines + the starburst backdrop + the closing divider.
  assert.match(css, /\.bis-eyebrow-line \{/);
  assert.match(css, /repeating-conic-gradient/);
  assert.match(css, /border-bottom: 1px solid rgba\(217, 180, 106/);
  // The hover preview is the muted YouTube embed, click-transparent, with a
  // CSS-only ramp-in on mount.
  assert.match(css, /\.bis-preview \{[^}]*pointer-events: none/);
  assert.match(css, /@keyframes bisPreviewIn/);
  // Source-app line styles exist.
  assert.match(css, /\.bis-source \{/);
  // Reduced motion is honoured.
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {", css.indexOf(".bis-section {")));
  assert.ok(reduced.includes(".bis-card:hover { transform: none; }"));
  assert.ok(reduced.includes(".bis-track { scroll-behavior: auto; }"));
});

test("the homepage mounts the section exactly once", async () => {
  const app = await read("app/nexora-app.tsx");
  assert.equal(
    (app.match(/from "\.\/components\/spotlight\/BeautyIndustrySpotlight"/g) ?? []).length,
    1,
  );
  assert.equal((app.match(/<BeautyIndustrySpotlight \/>/g) ?? []).length, 1);
});
