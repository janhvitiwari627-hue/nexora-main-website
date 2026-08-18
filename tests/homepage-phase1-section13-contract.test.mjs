/**
 * Homepage Phase 1 — Section 13 (Best Offers) integration contract.
 * Authoritative: PHASE1_SECTION13.md + 13.1–13.9 implementation.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const nexoraApp = await read("app/nexora-app.tsx");
const globalsCss = await read("app/globals.css");
const routedPage = await read("app/[...path]/page.tsx");

const hookStart = nexoraApp.indexOf("function useMarketplaceOffers(");
const hookEnd = nexoraApp.indexOf("function trimPublicText(", hookStart);
const hookBlock = nexoraApp.slice(hookStart, hookEnd);
const helpersStart = nexoraApp.indexOf("function trimPublicText(");
const helpersEnd = nexoraApp.indexOf("function BestOffersSection(");
const helpersBlock = nexoraApp.slice(helpersStart, helpersEnd);
const sectionStart = nexoraApp.indexOf("function BestOffersSection(");
const cardStart = nexoraApp.indexOf("function OfferDetailCard(");
const cardEnd = nexoraApp.indexOf("// Section 03 — Smart Search helpers.");
const sectionBlock = nexoraApp.slice(sectionStart, cardStart);
const cardBlock = nexoraApp.slice(cardStart, cardEnd);
const section13Block = nexoraApp.slice(sectionStart, cardEnd);

test("PHASE1_SECTION13.md records the Best Offers contract", async () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION13.md", import.meta.url)));
  const md = await read("PHASE1_SECTION13.md");
  assert.match(md, /SECTION 13: BEST OFFERS/);
  assert.match(md, /`best-offers`/);
  assert.match(md, /marketplace_offers/);
});

test("dedicated Section 13 component and stable id exist exactly once", () => {
  assert.equal((nexoraApp.match(/function BestOffersSection\(/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/<BestOffersSection/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/id="best-offers"/g) ?? []).length, 1);
});

test("Section 13 mounts after Trending and before Customer Reviews under offers visibility", () => {
  const section12 = nexoraApp.indexOf("<TrendingMostBookedSection");
  const offersGate = nexoraApp.indexOf("{visible('offers')");
  const section13 = nexoraApp.indexOf("<BestOffersSection");
  const reviews = nexoraApp.indexOf("What customers say");
  assert.ok(section12 > 0 && section12 < offersGate);
  assert.ok(offersGate < section13);
  assert.ok(section13 < reviews);
  assert.match(nexoraApp.slice(offersGate, section13 + 80), /\{visible\('offers'\) && \(/);
});

test("no duplicate homepage Best Offers / OffersStrip render site", () => {
  assert.doesNotMatch(nexoraApp, /function OffersStrip\(/);
  assert.equal((nexoraApp.match(/id="best-offers"/g) ?? []).length, 1);
  assert.doesNotMatch(sectionBlock, /Sample Offer|Demo Deal|Coming Soon/);
  assert.match(nexoraApp, /Partner Approved Offers/);
});

test("single public marketplace_offers source; backend order preserved", () => {
  assert.equal((nexoraApp.match(/useMarketplaceOffers\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_offers"/g) ?? []).length, 1);
  assert.match(hookBlock, /p_limit: MARKETPLACE_OFFERS_LIMIT/);
  assert.match(nexoraApp, /const MARKETPLACE_OFFERS_LIMIT = 12/);
  assert.match(sectionBlock, /for \(const offer of offers\)/);
  assert.match(sectionBlock, /rows\.length >= MARKETPLACE_OFFERS_LIMIT/);
  assert.doesNotMatch(sectionBlock, /\.sort\(/);
  assert.doesNotMatch(helpersBlock, /\.sort\(/);
  assert.doesNotMatch(nexoraApp, /useBestOffers|marketplace_best_offers/);
});

test("cards use OfferDetail public fields only and hide missing optionals", () => {
  assert.match(cardBlock, /offer\.name/);
  assert.match(cardBlock, /offer\.salon_name/);
  assert.match(cardBlock, /offerServiceNames\(offer\)/);
  assert.match(cardBlock, /formatOfferDiscount\(offer\)/);
  assert.match(cardBlock, /offer\.code/);
  assert.match(cardBlock, /formatOfferValidity/);
  assert.match(cardBlock, /minimum_booking_paise/);
  assert.match(cardBlock, /membership_only/);
  assert.doesNotMatch(cardBlock, /remaining_global|service_id|customer_id|user_id|booking_id/);
  assert.doesNotMatch(cardBlock, /original.?price|crossed|strikethrough|₹0 OFF/i);
});

test("percentage and fixed discounts fail safe; no fake original price", () => {
  assert.match(helpersBlock, /kind === "percent"\) return `\$\{value\}% OFF`/);
  assert.match(helpersBlock, /money\(value \* 100\)\} OFF/);
  assert.match(helpersBlock, /!Number\.isFinite\(value\) \|\| value <= 0\) return null/);
  assert.match(helpersBlock, /percent off/);
  assert.doesNotMatch(cardBlock, /was \{|originalPrice|save ₹/);
});

test("coupon is display-only copy; not applied or routed", () => {
  assert.match(cardBlock, /clipboard\.writeText\(coupon\)/);
  assert.match(cardBlock, /Code copied/);
  assert.match(cardBlock, /Copy coupon code/);
  assert.match(cardBlock, /stopPropagation/);
  assert.doesNotMatch(cardBlock, /coupon=|\?promo=|redeem|Apply Coupon/);
  assert.doesNotMatch(section13Block, /\/offers|\/deals/);
});

test("validity hides expired/invalid/exhausted; scheduled is not live bookable", () => {
  assert.match(helpersBlock, /windowState === "expired" \|\| windowState === "invalid"/);
  assert.match(helpersBlock, /offerIsExhausted/);
  assert.match(helpersBlock, /remaining === 0/);
  assert.match(cardBlock, /offerWindow === "scheduled"/);
  assert.match(cardBlock, /Starts later/);
  assert.match(cardBlock, /canBookNow = Boolean\(bookingPath\) && \(offerWindow === "open" \|\| offerWindow === "undated"\)/);
  assert.doesNotMatch(cardBlock, /Only \d+ left|Hurry|expires in/i);
});

test("eligibility is public-only; no first-booking or private history personalization", () => {
  assert.match(cardBlock, /Members only/);
  assert.match(cardBlock, /Minimum spend/);
  assert.doesNotMatch(section13Block, /Eligible for you|Exclusive for you|Used before|first.?booking/i);
  assert.doesNotMatch(hookBlock, /\.from\(["'](?:bookings|appointments|profiles|auth\.users)["']\)/);
});

test("CTAs use existing salon and customer booking paths only", () => {
  assert.match(cardBlock, /navigate\(`\/salons\/\$\{salonSlug\}`\)/);
  assert.match(helpersBlock, /\/app\/customer\/\?\$\{params\.toString\(\)\}/);
  assert.match(helpersBlock, /params\.set\("salon"/);
  assert.match(helpersBlock, /params\.set\("returnTo"/);
  assert.match(cardBlock, /disabled=\{!canOpenSalon\}/);
  assert.match(cardBlock, /disabled=\{!canBookNow\}/);
  assert.doesNotMatch(section13Block, /View Offer|View All Offers|href="#"|javascript:void/);
  assert.doesNotMatch(section13Block, /navigate\("\/offers"\)|navigate\("\/deals"\)/);
});

test("auth/returnTo reuse existing customer portal handoff", () => {
  assert.match(helpersBlock, /returnTo.*\/salons\/\$\{salonSlug\}/);
  assert.match(nexoraApp, /window\.history\.pushState\(\{\}, "", target\)/);
  assert.match(nexoraApp, /addEventListener\("popstate"/);
  assert.match(routedPage, /NexoraRoot initialPath/);
});

test("loading empty error retry offline states are truthful", () => {
  assert.match(sectionBlock, /Section13OfferSkeletons/);
  assert.match(sectionBlock, /Abhi koi active Best Offer available nahi hai/);
  assert.match(sectionBlock, /Offers load nahi ho sake\. Dobara try karein/);
  assert.match(sectionBlock, /Dobara Try Karein/);
  assert.match(sectionBlock, /Aap offline hain\. Live offers update nahi kiye ja sakte/);
  assert.match(sectionBlock, /Saved results/);
  assert.match(sectionBlock, /onRetry/);
  assert.doesNotMatch(sectionBlock, /className="loader"|Sample Offers|Demo Deal/);
  assert.doesNotMatch(sectionBlock, /Supabase|Postgres|stack trace|marketplace_offers/);
});

test("responsive 3/2/1 grid and 44px targets with reduced motion", () => {
  assert.match(globalsCss, /\.section13-offers-grid \{ display:grid; grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(globalsCss, /@media\(max-width:920px\) \{\s*\.section13-offers-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(globalsCss, /@media\(max-width:620px\) \{\s*\.section13-offers-grid \{ grid-template-columns:minmax\(0,1fr\)/);
  assert.match(globalsCss, /\.section13 \{ min-width:0; overflow-x:clip; \}/);
  assert.match(globalsCss, /\.section13 button \{ min-height:44px; min-width:44px; \}/);
  assert.match(globalsCss, /prefers-reduced-motion: reduce[\s\S]*section13-offer-skeleton/);
  assert.match(globalsCss, /\.section13 button:focus-visible/);
});

test("semantics, keyboard names, and no private DOM fields", () => {
  assert.match(sectionBlock, /<section id="best-offers"/);
  assert.match(sectionBlock, /<h2 id="best-offers-heading">Active Offers<\/h2>/);
  assert.match(cardBlock, /<h3>\{title\}<\/h3>/);
  assert.match(cardBlock, /View salon \$\{salonName\}/);
  assert.match(cardBlock, /Book \$\{bookingServiceName\} at \$\{salonName\}/);
  assert.match(cardBlock, /role="status" aria-live="polite"/);
  assert.match(sectionBlock, /role="status" aria-live="polite"/);
  assert.doesNotMatch(section13Block, /\b(?:user_id|customer_id|booking_id|appointment_id|service_role|phone|email)\b/i);
  assert.doesNotMatch(section13Block, /console\.(?:log|debug|info)|JSON\.stringify/);
  assert.match(sectionBlock, /OfferDetailCard key=\{o\.offer_id\}/);
});

test("HomePage still owns the single offers request and no N+1 card fetch", () => {
  assert.match(nexoraApp, /offers=\{marketplaceOffers\}/);
  assert.doesNotMatch(cardBlock, /client\.rpc|getClient\(/);
  assert.doesNotMatch(sectionBlock, /client\.rpc|getClient\(/);
  assert.match(hookBlock, /requestVersion/);
  assert.match(cardBlock, /copyTimerRef/);
});
