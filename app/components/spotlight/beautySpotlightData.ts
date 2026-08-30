/**
 * Beauty Industry Spotlight — presentation data + pure helpers.
 *
 * WHY THIS FILE EXISTS
 * The carousel component renders whatever it is handed and hardcodes nothing:
 * every thumbnail, hover-preview clip and external destination lives here (or
 * is injected through `BeautyIndustrySpotlight`'s `videos` prop, e.g. from an
 * admin-managed table later). Swapping the placeholder entries for live rows
 * is a data change only — no component edit.
 *
 * YOUTUBE-LINKED, HOVER-AUTOPLAY RAIL
 * Every slot carries a real `youtubeUrl`. The card's poster is the video's
 * own YouTube thumbnail, and hovering a card (after the dwell delay) mounts a
 * muted `youtube-nocookie` embed that autoplays inline — the production-safe
 * equivalent of YouTube's own hover preview — while the single-slot
 * coordinator (see previewCoordinator) guarantees only one clip plays at a
 * time. Clicking still opens the video on YouTube in a new tab.
 *
 * SOURCE-APP WIRING
 * Each row records which Nexora app the video was uploaded from
 * (`sourceAppId`). Only videos uploaded from an app that offers video upload
 * (`hasVideoUpload`) are surfaced; the spotlight filters the others out, so a
 * video from, say, the Customer App (no video upload) never renders. The app
 * capability list is MOCK DATA for now — wire `BEAUTY_VIDEO_SOURCE_APPS` and
 * the rows to the real apps table / media uploads when that lands.
 *
 * MOCK PLACEHOLDERS
 * The ten visible rows are the professional-brand editorial lineup the brief
 * names. Their `youtubeUrl` / thumbnail point at real, public, embeddable
 * YouTube videos chosen as stand-ins for the eventual partner uploads — they
 * are mock data, not a claim that these exact clips belong to the channel the
 * card labels. Replace the three URL/thumbnail fields (or pass your own
 * array) and nothing else changes.
 */

/** Partner tier shown as the top-left pill on every card. */
export type BeautyVideoTier = "DIAMOND" | "PLATINUM" | "GOLD";

export const BEAUTY_VIDEO_TIERS: readonly BeautyVideoTier[] = [
  "DIAMOND",
  "PLATINUM",
  "GOLD",
];

/**
 * The Nexora apps a spotlight video can be uploaded from.
 *
 * `hasVideoUpload` is the "does this app have a video option" switch: only
 * videos whose source app is true here ever render in the rail. Mock data —
 * replace with the real app capability when the media system is wired up.
 */
export type BeautyVideoSourceAppId =
  | "distributors-beauty-industry"
  | "job-portal"
  | "owner"
  | "partner"
  | "customer";

export interface BeautyVideoSourceApp {
  id: BeautyVideoSourceAppId;
  /** Product name exactly as the platform refers to the app. */
  name: string;
  /** Short label for the card's "From …" line. */
  shortName: string;
  /** Whether users can upload videos in this app. */
  hasVideoUpload: boolean;
}

export const BEAUTY_VIDEO_SOURCE_APPS: readonly BeautyVideoSourceApp[] = [
  {
    id: "distributors-beauty-industry",
    name: "Distributors Beauty Industry",
    shortName: "Distributors",
    hasVideoUpload: true,
  },
  {
    id: "owner",
    name: "Shop Owner App",
    shortName: "Shop Owner",
    hasVideoUpload: true,
  },
  {
    id: "partner",
    name: "Growth Partner App",
    shortName: "Growth Partner",
    hasVideoUpload: true,
  },
  {
    id: "job-portal",
    name: "Nexora Job Portal",
    shortName: "Jobs",
    hasVideoUpload: false,
  },
  {
    id: "customer",
    name: "Customer App",
    shortName: "Customer",
    hasVideoUpload: false,
  },
] as const;

const APPS_BY_ID = new Map<string, BeautyVideoSourceApp>(
  BEAUTY_VIDEO_SOURCE_APPS.map((app) => [app.id, app]),
);

/** Look up the source app for an id, or null when the id is unknown. */
export function sourceAppById(id: string): BeautyVideoSourceApp | null {
  return APPS_BY_ID.get(id) ?? null;
}

/** True when this app offers video upload (the "video option"). */
export function hasVideoUpload(id: string): boolean {
  return sourceAppById(id)?.hasVideoUpload ?? false;
}

/** The app that a video row was uploaded from, or null when unknown. */
export function sourceAppForVideo(video: BeautySpotlightVideo): BeautyVideoSourceApp | null {
  return sourceAppById(video.sourceAppId);
}

/**
 * The rail's source-app gate: only videos uploaded from apps that offer a
 * video upload option are surfaced. A row whose app is unknown or video-less
 * is excluded — never rendered with an empty claim.
 */
export function filterUploadableVideos<T extends BeautySpotlightVideo>(
  videos: readonly T[],
): readonly T[] {
  return videos.filter((video) => hasVideoUpload(video.sourceAppId));
}

/* ── YouTube URL helpers ─────────────────────────────────────────────────── */

/** The 11-char id of a YouTube video in any common URL shape, or null. */
export function youtubeVideoId(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^(www|m|music|m\.music)\./, "").toLowerCase();
  const idPattern = /^[A-Za-z0-9_-]{11}$/;

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return idPattern.test(id) ? id : null;
  }
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch" && parts[1] !== undefined) {
      const id = url.searchParams.get("v") ?? parts[1];
      return idPattern.test(id) ? id : null;
    }
    if (parts[0] === "watch") {
      const id = url.searchParams.get("v") ?? "";
      return idPattern.test(id) ? id : null;
    }
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
      const id = parts[1] ?? "";
      return idPattern.test(id) ? id : null;
    }
  }
  return null;
}

/** Canonical watch URL for a video id. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Reliable poster frame (always exists, unlike maxresdefault). */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Muted, inline, autoplaying embed URL used by the hover preview. Autoplay
 * only works because it is muted (the browser's autoplay policy), plays
 * inline, shows no controls/related/endscreens, and loops. `playlist=<id>` is
 * the YouTube requirement for `loop=1` on a single video.
 */
export function youtubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    controls: "0",
    rel: "0",
    loop: "1",
    playlist: videoId,
    modestbranding: "1",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

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
   * Destination opened in a NEW TAB with rel="noopener noreferrer" — and the
   * source of the muted hover autoplay (its video id is embedded on hover).
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
  /** The Nexora app this video was uploaded from (source-app wiring). */
  sourceAppId: string;
}

/** Shorthand: watch URL + poster frame for a given YouTube video id. */
function yt(videoId: string): Pick<BeautySpotlightVideo, "youtubeUrl" | "thumbnailUrl"> {
  return {
    youtubeUrl: youtubeWatchUrl(videoId),
    thumbnailUrl: youtubeThumbnailUrl(videoId),
  };
}

/**
 * The rail's rows. Ten VISIBLE slots (from apps with video upload) plus two
 * excluded rows (from apps without video upload) that demonstrate the source
 * gate: the spotlight filters them out before rendering, so exactly ten cards
 * appear even though twelve rows exist here.
 *
 * `youtubeUrl`/thumbnail point at real, public, embeddable YouTube videos as
 * MOCK stand-ins — see the file header.
 */
export const BEAUTY_SPOTLIGHT_VIDEOS: readonly BeautySpotlightVideo[] = [
  {
    id: "beauty-video-001",
    brandName: "Nexora Luxe",
    title: "Inside the B2B Beauty Marketplace",
    category: "BEAUTY BUSINESS",
    ...yt("kt8Yfs-IYqs"),
    duration: "08:14",
    badge: "DIAMOND",
    sponsored: false,
    likes: 1284,
    comments: 96,
    sourceAppId: "distributors-beauty-industry",
  },
  {
    id: "beauty-video-002",
    brandName: "Nexora Salon",
    title: "The Salon Glow Ritual, On Demand",
    category: "SALON RITUAL",
    ...yt("eKyD4yGgpCo"),
    duration: "06:52",
    badge: "PLATINUM",
    sponsored: false,
    likes: 942,
    comments: 61,
    sourceAppId: "owner",
  },
  {
    id: "beauty-video-003",
    brandName: "Wahl Professional",
    title: "Fade Fundamentals: Precision Clipper Techniques for Barbers",
    category: "BARBERING",
    ...yt("nMnSjH8-9OQ"),
    duration: "08:47",
    badge: "DIAMOND",
    sponsored: true,
    likes: 9800,
    comments: 241,
    sourceAppId: "distributors-beauty-industry",
  },
  {
    id: "beauty-video-004",
    brandName: "L'Oréal Professionnel",
    title: "Color Diagnostics: Mastering Dimensional Blondes",
    category: "HAIR COLOR",
    ...yt("RRez1J-kbAg"),
    duration: "12:05",
    badge: "PLATINUM",
    sponsored: true,
    likes: 12400,
    comments: 389,
    sourceAppId: "distributors-beauty-industry",
  },
  {
    id: "beauty-video-005",
    brandName: "Schwarzkopf Professional",
    title: "Bond Architecture: Repairing Lightened Hair",
    category: "HAIR CARE",
    ...yt("7F4x1OJjYl4"),
    duration: "09:58",
    badge: "GOLD",
    sponsored: false,
    likes: 4120,
    comments: 167,
    sourceAppId: "distributors-beauty-industry",
  },
  {
    id: "beauty-video-006",
    brandName: "Dyson Beauty",
    title: "Heat-Control Styling: The Science of Controlled Airflow",
    category: "PROFESSIONAL TOOLS",
    ...yt("5Auip2NyP8A"),
    duration: "14:32",
    badge: "DIAMOND",
    sponsored: false,
    likes: 15300,
    comments: 512,
    sourceAppId: "partner",
  },
  {
    id: "beauty-video-007",
    brandName: "Wella Professionals",
    title: "Balayage Placement: A Dimensional Colour Study",
    category: "TREND COLLECTIONS",
    ...yt("iPHh3fEqp7A"),
    duration: "11:19",
    badge: "PLATINUM",
    sponsored: false,
    likes: 6800,
    comments: 203,
    sourceAppId: "distributors-beauty-industry",
  },
  {
    id: "beauty-video-008",
    brandName: "Olaplex",
    title: "Bond Building Science: The Salon Treatment Protocol",
    category: "SALON EDUCATION",
    ...yt("NKfTbACBRfs"),
    duration: "10:44",
    badge: "GOLD",
    sponsored: true,
    likes: 8900,
    comments: 274,
    sourceAppId: "partner",
  },
  {
    id: "beauty-video-009",
    brandName: "Moroccanoil",
    title: "The Argan Ritual: Editorial Shine & Finish",
    category: "HAIR CARE",
    ...yt("AP6Ith7ZH8U"),
    duration: "07:21",
    badge: "GOLD",
    sponsored: false,
    likes: 5400,
    comments: 158,
    sourceAppId: "owner",
  },
  {
    id: "beauty-video-010",
    brandName: "Lakmé Salon",
    title: "The Bridal Glow: Editorial Indian Bridal Beauty",
    category: "SALON TRENDS",
    ...yt("BBU7-_SWfTw"),
    duration: "09:12",
    badge: "DIAMOND",
    sponsored: true,
    likes: 11200,
    comments: 346,
    sourceAppId: "owner",
  },
  /* ── Excluded by the source gate: these apps have no video option ──────── */
  {
    id: "beauty-video-011",
    brandName: "Nexora Customer",
    title: "Book, Track and Rebook — Inside the Customer App",
    category: "CUSTOMER",
    ...yt("caybbtduV_c"),
    duration: "04:20",
    badge: "GOLD",
    sponsored: false,
    likes: 320,
    comments: 12,
    sourceAppId: "customer",
  },
  {
    id: "beauty-video-012",
    brandName: "Nexora Job Portal",
    title: "Careers in Beauty: Inside the Job Portal",
    category: "CAREERS",
    ...yt("Zi2wFfoxUf8"),
    duration: "05:10",
    badge: "GOLD",
    sponsored: false,
    likes: 205,
    comments: 9,
    sourceAppId: "job-portal",
  },
];

/**
 * The rows the rail actually renders — the source-app gate applied to the
 * mock dataset (ten visible slots; the two non-video-app rows drop out).
 */
export const VISIBLE_BEAUTY_SPOTLIGHT_VIDEOS: readonly BeautySpotlightVideo[] =
  filterUploadableVideos(BEAUTY_SPOTLIGHT_VIDEOS);

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
