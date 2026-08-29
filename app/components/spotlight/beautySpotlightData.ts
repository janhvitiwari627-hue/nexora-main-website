/**
 * Beauty Industry Spotlight — presentation data + pure helpers.
 *
 * WHY THIS FILE EXISTS
 * The carousel component renders whatever it is handed and hardcodes nothing:
 * every thumbnail, hover-preview clip and external destination lives here (or
 * is injected through `BeautyIndustrySpotlight`'s `videos` prop, e.g. from an
 * admin-managed table later). Swapping the ten placeholder entries for live
 * rows is a data change only — no component edit.
 *
 * HONEST PLACEHOLDERS + TWO LIVE SHOWCASE SLOTS
 * Two of the ten slots (beauty-video-001 / -002) are LIVE: they carry real
 * self-hosted media in `public/spotlight/` (a ~10 s muted cinematic teaser
 * built for this carousel, plus its poster frame) and their watch link opens
 * the Nexora app the teaser showcases. The remaining eight slots are the real
 * partner brands the brief names, but their `thumbnailUrl` / `previewUrl` /
 * `youtubeUrl` are deliberately EMPTY strings. No YouTube URL is invented
 * here: an unconfigured entry renders the branded fallback poster and an
 * honest "link not configured" watch control instead of a click that leads
 * somewhere fabricated. Fill the three URL fields (or pass your own array)
 * and the card immediately gets a lazy poster image, a muted hover preview
 * and a new-tab destination — nothing else changes.
 */

/** Partner tier shown as the top-left pill on every card. */
export type BeautyVideoTier = "DIAMOND" | "PLATINUM" | "GOLD";

export const BEAUTY_VIDEO_TIERS: readonly BeautyVideoTier[] = [
  "DIAMOND",
  "PLATINUM",
  "GOLD",
];

/** One slot in the Beauty Industry Spotlight carousel. */
export interface BeautySpotlightVideo {
  /** Stable id — also the localStorage key fragment for like/save state. */
  id: string;
  /** Channel / brand name, rendered as the video's byline. */
  brandName: string;
  /** Video title. Clicking it opens `youtubeUrl`. */
  title: string;
  /** Editorial category ("Bridal Beauty", "Hair Colour", …). */
  category: string;
  /** Poster frame (jpg/webp). Empty → branded fallback poster. */
  thumbnailUrl: string;
  /**
   * Silent hover-preview clip (.mp4/.webm), played muted + inline like a
   * YouTube hover preview. Empty → the poster simply stays on hover.
   */
  previewUrl: string;
  /**
   * Destination opened in a NEW TAB with rel="noopener noreferrer".
   * Empty → the watch control renders disabled with honest copy.
   */
  youtubeUrl: string;
  /** Display duration, e.g. "0:45", "2:35". */
  duration: string;
  /** Top-left tier pill. */
  badge: BeautyVideoTier;
  /** Top-right "✦ SPONSORED" pill — always disclosed, never implied. */
  sponsored: boolean;
  /** Baseline like count; a local like adds one on top of it. */
  likes: number;
  /** Baseline comment count shown on the Comments control. */
  comments: number;
}

/**
 * The ten slots. Two live showcase entries + placeholder copy, real structure:
 * each entry carries every field the card renders, so the UI never branches
 * on missing data.
 */
export const BEAUTY_SPOTLIGHT_VIDEOS: readonly BeautySpotlightVideo[] = [
  {
    id: "beauty-video-001",
    brandName: "Nexora Luxe",
    title: "Inside the B2B Beauty Marketplace",
    category: "Nexora Apps",
    thumbnailUrl: "/spotlight/nexora-luxe-sourcing.jpg",
    previewUrl: "/spotlight/nexora-luxe-sourcing.mp4",
    youtubeUrl: "https://beauty-shop-2.vercel.app/",
    duration: "0:10",
    badge: "DIAMOND",
    sponsored: false,
    likes: 1284,
    comments: 96,
  },
  {
    id: "beauty-video-002",
    brandName: "Nexora Salon",
    title: "The Salon Glow Ritual, On Demand",
    category: "Nexora Apps",
    thumbnailUrl: "/spotlight/nexora-salon-glow.jpg",
    previewUrl: "/spotlight/nexora-salon-glow.mp4",
    youtubeUrl: "https://remix-final-salon-app.vercel.app/",
    duration: "0:10",
    badge: "PLATINUM",
    sponsored: false,
    likes: 942,
    comments: 61,
  },
  {
    id: "beauty-video-003",
    brandName: "L'Oréal Professionnel",
    title: "Salon-Grade Colour Correction",
    category: "Hair Colour",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "2:35",
    badge: "DIAMOND",
    sponsored: false,
    likes: 2140,
    comments: 158,
  },
  {
    id: "beauty-video-004",
    brandName: "Schwarzkopf Professional",
    title: "Bond Repair for Bleached Hair",
    category: "Hair Care",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "1:00",
    badge: "PLATINUM",
    sponsored: true,
    likes: 1173,
    comments: 84,
  },
  {
    id: "beauty-video-005",
    brandName: "Dyson Beauty",
    title: "Heat-Control Styling Demo",
    category: "Styling Tools",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "4:21",
    badge: "DIAMOND",
    sponsored: false,
    likes: 3208,
    comments: 241,
  },
  {
    id: "beauty-video-006",
    brandName: "Wella Professionals",
    title: "Balayage Placement Technique",
    category: "Hair Colour",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "3:08",
    badge: "GOLD",
    sponsored: false,
    likes: 806,
    comments: 52,
  },
  {
    id: "beauty-video-007",
    brandName: "Olaplex",
    title: "Bond Building Aftercare Routine",
    category: "Hair Treatment",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "1:47",
    badge: "PLATINUM",
    sponsored: true,
    likes: 1655,
    comments: 133,
  },
  {
    id: "beauty-video-008",
    brandName: "Moroccanoil",
    title: "Argan Oil Finishing Ritual",
    category: "Hair Care",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "0:58",
    badge: "GOLD",
    sponsored: false,
    likes: 731,
    comments: 47,
  },
  {
    id: "beauty-video-009",
    brandName: "Matrix Professional",
    title: "Frizz Control Blow-Dry System",
    category: "Hair Styling",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "2:12",
    badge: "PLATINUM",
    sponsored: false,
    likes: 688,
    comments: 39,
  },
  {
    id: "beauty-video-010",
    brandName: "Redken",
    title: "Acidic Bonding for Coloured Hair",
    category: "Hair Treatment",
    thumbnailUrl: "",
    previewUrl: "",
    youtubeUrl: "",
    duration: "1:29",
    badge: "GOLD",
    sponsored: true,
    likes: 964,
    comments: 71,
  },
];

/**
 * One row of the card's comments panel. Nothing in this feature ships a
 * thread; the panel stays empty until the site's own comment system supplies
 * rows through `BeautyIndustrySpotlight`'s `resolveComments` prop.
 */
export interface BeautyVideoComment {
  id: string;
  author: string;
  body: string;
  /** Pre-formatted relative stamp, e.g. "2 h ago". */
  postedAt: string;
}

/**
 * Delay between cursor-enter and the muted preview starting. Inside the
 * 500–800 ms band the brief asks for: long enough that a cursor merely
 * crossing the row never fires a preview, short enough to feel responsive.
 */
export const HOVER_PREVIEW_DELAY_MS = 600;

/** How long the "Saved to your collection" confirmation stays on screen. */
export const SAVE_TOAST_DURATION_MS = 2400;

/**
 * External-navigation guard: only http(s) URLs may ever reach an `href`.
 * `javascript:`, `data:`, protocol-relative and relative values are rejected,
 * so a mistyped or tampered data row can never execute script from a click.
 * Returns the normalized absolute URL, or null when it is not usable.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Count copy for the action row: 964 → "964", 1284 → "1.3K", 12400 → "12K". */
export function formatCompactCount(value: number): string {
  const n = Math.max(0, Math.round(value || 0));
  if (n < 1000) return String(n);
  const thousands = n / 1000;
  const compact = thousands < 10 ? thousands.toFixed(1) : String(Math.round(thousands));
  return `${compact.replace(/\.0$/, "")}K`;
}

/**
 * Monogram for the fallback poster: up to two leading letters of the two
 * first words ("Lakmé Salon" → "LS", "Olaplex" → "O").
 */
export function brandMonogram(brandName: string): string {
  const words = brandName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "✦";
  const first = words[0]?.charAt(0) ?? "";
  const second = words.length > 1 ? (words[1]?.charAt(0) ?? "") : "";
  return (first + second).toUpperCase() || "✦";
}

/** Class-safe slug for a tier ("DIAMOND" → "diamond"). */
export function tierSlug(tier: BeautyVideoTier): string {
  return tier.toLowerCase();
}
