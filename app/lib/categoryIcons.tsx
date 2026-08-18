/**
 * Homepage Phase 1 · Section 05 — approved category icon library.
 *
 * Beauty categories come from the live `marketplace_categories` RPC with an
 * admin-set `icon` field. The raw field value is NEVER rendered directly
 * (no raw emoji, no arbitrary glyphs): it is resolved through this approved
 * library to a decorative inline SVG. Unknown, missing or emoji values fall
 * back to the neutral catalog glyph — deterministic, never invented per row.
 *
 * Icons are purely decorative (`aria-hidden`); the category name and the
 * real salon/service counts carry the meaning for assistive tech.
 */

import type { ReactNode } from "react";

export const CATEGORY_ICON_KEYS = [
  "scissors",
  "hair",
  "spa",
  "nails",
  "makeup",
  "tattoo",
  "clinic",
  "salon",
  "facial",
  "bridal",
  "star",
  "sparkles",
  "grid",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

/** Shared stroke style for every glyph in the library. */
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const GLYPHS: Record<CategoryIconKey, ReactNode> = {
  scissors: (
    <svg {...svgProps} key="scissors">
      <circle cx="6" cy="7" r="2.6" />
      <circle cx="6" cy="17" r="2.6" />
      <path d="M8.3 8.6 20 17M8.3 15.4 20 7" />
    </svg>
  ),
  hair: (
    <svg {...svgProps} key="hair">
      <path d="M5 4v9a7 7 0 0 0 14 0V4" />
      <path d="M5 8h14M9 4v5M15 4v5" />
      <path d="M12 20v1" />
    </svg>
  ),
  spa: (
    <svg {...svgProps} key="spa">
      <path d="M12 20c-4.4 0-8-2.9-8-7 2.6 0 4.7.8 6.2 2.2C10.1 12 10.6 8.6 12 5c1.4 3.6 1.9 7 1.8 10.2C15.3 13.8 17.4 13 20 13c0 4.1-3.6 7-8 7Z" />
    </svg>
  ),
  nails: (
    <svg {...svgProps} key="nails">
      <path d="M9 3h6v5l1.5 2v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V10L9 8V3Z" />
      <path d="M9 10h6" />
    </svg>
  ),
  makeup: (
    <svg {...svgProps} key="makeup">
      <path d="M9 10h6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V10Z" />
      <path d="M10 10V7l2-4 2 4v3" />
    </svg>
  ),
  tattoo: (
    <svg {...svgProps} key="tattoo">
      <path d="m14.5 3.5 6 6L9 21H3v-6L14.5 3.5Z" />
      <path d="m12 6 6 6" />
    </svg>
  ),
  clinic: (
    <svg {...svgProps} key="clinic">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  salon: (
    <svg {...svgProps} key="salon">
      <path d="M6 21v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
      <path d="M8 11V6a4 4 0 0 1 8 0v5" />
      <path d="M4 21h16" />
    </svg>
  ),
  facial: (
    <svg {...svgProps} key="facial">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10h.01M15 10h.01" />
      <path d="M9 15a4.2 4.2 0 0 0 6 0" />
    </svg>
  ),
  bridal: (
    <svg {...svgProps} key="bridal">
      <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3Z" />
      <path d="M12 15v6M8 21h8" />
    </svg>
  ),
  star: (
    <svg {...svgProps} key="star">
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9L6.6 19.7l1.1-6L3.2 9.4l6.1-.8L12 3Z" />
    </svg>
  ),
  sparkles: (
    <svg {...svgProps} key="sparkles">
      <path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  ),
  grid: (
    <svg {...svgProps} key="grid">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
};

/**
 * Resolve the admin-set icon value to an approved library key.
 * Matching is tolerant of separators/casing; emoji or unknown values
 * deterministically resolve to the neutral `grid` glyph.
 */
export function resolveCategoryIcon(raw: string | null | undefined): CategoryIconKey {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return "grid";
  const has = (...needles: string[]) => needles.some((needle) => value.includes(needle));
  if (has("scissor")) return "scissors";
  if (has("tattoo")) return "tattoo";
  if (has("nail")) return "nails";
  if (has("makeup", "lipstick", "cosmetic")) return "makeup";
  if (has("clinic", "skin", "dermat", "aesthetic")) return "clinic";
  if (has("bridal", "wedding")) return "bridal";
  if (has("facial", "face")) return "facial";
  if (has("spa", "lotus", "massage", "wellness")) return "spa";
  if (has("hair", "barber", "salon", "parlour", "parlor", "beauty")) return "hair";
  if (has("star")) return "star";
  if (has("spark", "glam")) return "sparkles";
  return "grid";
}

/** Decorative approved icon for one live category. */
export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const key = resolveCategoryIcon(name);
  return (
    <span aria-hidden="true" className={className} style={{ display: "inline-grid", placeItems: "center" }}>
      {GLYPHS[key]}
    </span>
  );
}
