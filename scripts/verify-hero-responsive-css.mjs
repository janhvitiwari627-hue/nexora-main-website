#!/usr/bin/env node
/**
 * Section 02 Hero — responsive / a11y verification against the COMPILED CSS.
 *
 * Runs the project's actual PostCSS pipeline (@tailwindcss/postcss, same as
 * postcss.config.mjs) over app/globals.css, then asserts the compiled output
 * contains the exact rules the Hero depends on at desktop (>=1024px), tablet
 * (640-1023px) and mobile (<640px) widths, plus reduced-motion support.
 *
 * Tailwind v4 emits each responsive utility as a rule with a nested query:
 *   .sm\:flex-row { @media (width >= 40rem) { ... } }   (40rem = 640px)
 *   .lg\:col-span-6 { @media (width >= 64rem) { ... } } (64rem = 1024px)
 *
 * Usage: node scripts/verify-hero-responsive-css.mjs
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const root = new URL("..", import.meta.url);
const css = await readFile(new URL("app/globals.css", root), "utf8");
const tsx = await readFile(new URL("app/nexora-app.tsx", root), "utf8");

const result = await postcss([tailwindcss()]).process(css, {
  from: new URL("app/globals.css", root).pathname,
});
const out = result.css;

/**
 * Assert a compiled Tailwind utility exists and is gated by the given media
 * query (searched within the 160 chars after the selector).
 */
function assertUtility(selector, mediaQuery, message) {
  const index = out.indexOf(selector);
  assert.ok(index !== -1, `${message} — selector ${selector} missing from compiled CSS`);
  const window = out.slice(index, index + 160);
  assert.ok(window.includes(mediaQuery), `${message} — ${selector} not gated by ${mediaQuery}`);
}

// ---------------------------------------------------------------------------
// Mobile (<640px): stacked single column, full-width CTAs
// ---------------------------------------------------------------------------
assert.ok(out.includes(".grid-cols-1"), "mobile: hero grid stacks to one column");
assert.ok(out.includes(".flex-col"), "mobile: CTAs stack vertically");
assert.ok(out.includes(".w-full"), "mobile: CTAs span full width");

// ---------------------------------------------------------------------------
// Tablet (>=640px): CTAs side by side, two-column trust list
// ---------------------------------------------------------------------------
assertUtility(".sm\\:flex-row", "@media (width >= 40rem)", "tablet: CTAs switch to a row at 640px");
assertUtility(".sm\\:grid-cols-2", "@media (width >= 40rem)", "tablet: trust list becomes 2 columns at 640px");
assertUtility(".sm\\:aspect-\\[4\\/3\\]", "@media (width >= 40rem)", "tablet: hero image ratio adjusts");
assertUtility(".sm\\:w-auto", "@media (width >= 40rem)", "tablet: CTAs size to content");

// ---------------------------------------------------------------------------
// Desktop (>=1024px): two-column hero grid (6/6 split)
// ---------------------------------------------------------------------------
assertUtility(".lg\\:grid-cols-12", "@media (width >= 64rem)", "desktop: hero uses the 12-column grid at 1024px");
assertUtility(".lg\\:col-span-6", "@media (width >= 64rem)", "desktop: copy and visual split 6/6");
assertUtility(".lg\\:order-1", "@media (width >= 64rem)", "desktop: copy column moves left");
assertUtility(".lg\\:order-2", "@media (width >= 64rem)", "desktop: visual column moves right");
assertUtility(".lg\\:aspect-\\[4\\/5\\]", "@media (width >= 64rem)", "desktop: hero image ratio adjusts");

// ---------------------------------------------------------------------------
// The TSX actually consumes these responsive utilities
// ---------------------------------------------------------------------------
assert.match(tsx, /grid-cols-1 items-center gap-10 lg:grid-cols-12/);
assert.match(tsx, /flex w-full flex-col gap-3 sm:w-auto sm:flex-row/);
assert.match(tsx, /aspect-\[3\/4\] w-full object-cover sm:aspect-\[4\/3\] lg:aspect-\[4\/5\]/);
assert.match(tsx, /sizes="\(min-width: 1024px\) 46vw, \(min-width: 640px\) 70vw, 100vw"/);

// ---------------------------------------------------------------------------
// Reduced motion + smooth scroll, compiled
// ---------------------------------------------------------------------------
assert.match(out, /prefers-reduced-motion:\s*reduce/, "compiled: reduced-motion block present");
assert.match(out, /\.hero2-rise[\s\S]{0,120}animation:\s*none/, "compiled: hero entrance animation disabled under reduced motion");
assert.match(out, /prefers-reduced-motion:\s*no-preference[\s\S]{0,160}scroll-behavior:\s*smooth/, "compiled: smooth scroll only when motion allowed");
assert.ok(out.includes(".hero2-cta"), "compiled: hero CTA styles present");
assert.ok(out.includes("#nexora-apps:focus"), "compiled: scroll target focus rule present");

console.log("OK — compiled CSS contains mobile/tablet/desktop Hero rules + reduced-motion support.");
