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
 *
 * Slots 01–02 are the live Nexora showcase entries (self-hosted media in
 * `public/spotlight/`, watch link = the app the teaser showcases). Slots 03–10
 * are the professional-brand editorial lineup: real brands, placeholder demo
 * copy, each with a self-generated thematic editorial poster (no brand
 * footage/logos) — and no fabricated claims. Their preview/watch URLs stay
 * empty until an approved one is supplied for the row: a rich poster never
 * implies a working destination.
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
    duration: "00:10",
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
    duration: "00:10",
    badge: "PLATINUM",
    sponsored: false,
    likes: 942,
    comments: 61,
  },
  {
    id: "beauty-video-003",
    brandName: "Wahl Professional",
    title: "Fade Fundamentals: Precision Clipper Techniques for Barbers",
    category: "BARBERING",
    thumbnailUrl: "/spotlight/vid-barbering.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "08:47",
    badge: "DIAMOND",
    sponsored: true,
    likes: 9800,
    comments: 241,
  },
  {
    id: "beauty-video-004",
    brandName: "L'Oréal Professionnel",
    title: "Color Diagnostics: Mastering Dimensional Blondes",
    category: "HAIR COLOR",
    thumbnailUrl: "/spotlight/vid-blondes.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "12:05",
    badge: "PLATINUM",
    sponsored: true,
    likes: 12400,
    comments: 389,
  },
  {
    id: "beauty-video-005",
    brandName: "Schwarzkopf Professional",
    title: "Bond Architecture: Repairing Lightened Hair",
    category: "HAIR CARE",
    thumbnailUrl: "/spotlight/vid-bondcare.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "09:58",
    badge: "GOLD",
    sponsored: false,
    likes: 4120,
    comments: 167,
  },
  {
    id: "beauty-video-006",
    brandName: "Dyson Beauty",
    title: "Heat-Control Styling: The Science of Controlled Airflow",
    category: "PROFESSIONAL TOOLS",
    thumbnailUrl: "/spotlight/vid-heattools.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "14:32",
    badge: "DIAMOND",
    sponsored: false,
    likes: 15300,
    comments: 512,
  },
  {
    id: "beauty-video-007",
    brandName: "Wella Professionals",
    title: "Balayage Placement: A Dimensional Colour Study",
    category: "TREND COLLECTIONS",
    thumbnailUrl: "/spotlight/vid-balayage.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "11:19",
    badge: "PLATINUM",
    sponsored: false,
    likes: 6800,
    comments: 203,
  },
  {
    id: "beauty-video-008",
    brandName: "Olaplex",
    title: "Bond Building Science: The Salon Treatment Protocol",
    category: "SALON EDUCATION",
    thumbnailUrl: "/spotlight/vid-treatment.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "10:44",
    badge: "GOLD",
    sponsored: true,
    likes: 8900,
    comments: 274,
  },
  {
    id: "beauty-video-009",
    brandName: "Moroccanoil",
    title: "The Argan Ritual: Editorial Shine & Finish",
    category: "HAIR CARE",
    thumbnailUrl: "/spotlight/vid-argan.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "07:21",
    badge: "GOLD",
    sponsored: false,
    likes: 5400,
    comments: 158,
  },
  {
    id: "beauty-video-010",
    brandName: "Lakmé Salon",
    title: "The Bridal Glow: Editorial Indian Bridal Beauty",
    category: "SALON TRENDS",
    thumbnailUrl: "/spotlight/vid-bridal.jpg",
    previewUrl: "",
    youtubeUrl: "",
    duration: "09:12",
    badge: "DIAMOND",
    sponsored: true,
    likes: 11200,
    comments: 346,
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
