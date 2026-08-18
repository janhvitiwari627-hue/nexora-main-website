import assert from "node:assert/strict";
import test from "node:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TrendingMostBookedSection, section12TabIndexForKey } from "../app/nexora-app";

type Section12Props = ComponentProps<typeof TrendingMostBookedSection>;
type TrendingRowProp = Section12Props["trendingRows"][number];
type PopularServiceProp = Section12Props["popularServices"][number];
type SalonReference = Section12Props["salonReferences"] extends ReadonlyMap<string, infer Value> ? Value : never;

const privateSentinel = "PRIVATE-CUSTOMER-SENTINEL";

function trendingRows(count = 8): TrendingRowProp[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `salon-${index + 1}`,
    slug: `salon-${index + 1}`,
    name: `Salon ${index + 1}`,
    business_category: "Hair",
    area: `Area ${index + 1}`,
    city: "Jaipur",
    rating_avg: 4.5,
    review_count: 20 + index,
    booking_count: 10 + index,
    trending_score: 999 - index,
    overridden: index === 0,
    // Deliberately inject private-looking runtime fields. The component must
    // consume only its declared public aggregate allowlist, never these.
    customer_name: privateSentinel,
    customer_email: privateSentinel,
    booking_id: privateSentinel,
  } as TrendingRowProp));
}

function popularServices(count = 8): PopularServiceProp[] {
  return Array.from({ length: count }, (_, index) => ({
    service_id: `service-${index + 1}`,
    salon_id: `salon-${index + 1}`,
    salon_name: `Salon ${index + 1}`,
    service_name: `Service ${index + 1}`,
    price_paise: 50000 + index,
    duration_minutes: 30,
    booking_count: 5 + index,
    booking_id: privateSentinel,
    customer_phone: privateSentinel,
  } as PopularServiceProp));
}

function salonReferences(count = 8): ReadonlyMap<string, SalonReference> {
  return new Map(Array.from({ length: count }, (_, index) => [
    `salon-${index + 1}`,
    {
      id: `salon-${index + 1}`,
      slug: `salon-${index + 1}`,
      coverImagePath: `https://images.example.test/salon-${index + 1}.jpg`,
    } as SalonReference,
  ]));
}

const baseProps: Section12Props = {
  trendingRows: trendingRows(),
  trendingLoading: false,
  trendingError: false,
  onRetryTrending: () => {},
  popularServices: popularServices(),
  popularLoading: false,
  popularError: false,
  onRetryPopular: () => {},
  salonReferences: salonReferences(),
  online: true,
  navigate: () => {},
};

function renderSection(overrides: Partial<Section12Props> = {}): string {
  return renderToStaticMarkup(<TrendingMostBookedSection {...baseProps} {...overrides} />);
}

function classCount(html: string, className: string): number {
  return [...html.matchAll(/class="([^"]+)"/g)]
    .filter((match) => match[1].split(/\s+/).includes(className))
    .length;
}

test("runtime DOM renders only six ordered public results per panel", () => {
  const html = renderSection();
  assert.equal(classCount(html, "trending-salon-card"), 6);
  assert.equal(classCount(html, "section12-service-card"), 6);
  assert.equal(classCount(html, "section12-area-card"), 6);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 6);
  assert.doesNotMatch(html, new RegExp(privateSentinel));
  assert.doesNotMatch(html, /Salon 7|Service 7|Area 7/);

  let previous = -1;
  for (let index = 1; index <= 6; index += 1) {
    const position = html.indexOf(`Salon ${index}`);
    assert.ok(position > previous, `Salon ${index} should preserve backend order`);
    previous = position;
  }
  assert.match(html, /<em>Featured<\/em>/);
  assert.doesNotMatch(html, /999|Trending score|Ranking score/);
});

test("runtime DOM groups normalized areas without inventing totals", () => {
  const rows = trendingRows(3);
  rows[0] = { ...rows[0], area: "  Malviya   Nagar  ", city: " Jaipur " };
  rows[1] = { ...rows[1], area: "malviya nagar", city: "jaipur" };
  rows[2] = { ...rows[2], area: "   ", city: "Jaipur" };
  const html = renderSection({ trendingRows: rows });
  assert.equal(classCount(html, "section12-area-card"), 1);
  assert.match(html, />Malviya Nagar<\/h3>/);
  assert.doesNotMatch(html, /active salons|area bookings|customers in/);
});

test("runtime DOM disables a service CTA when no canonical salon slug resolves", () => {
  const references = new Map(salonReferences());
  references.delete("salon-1");
  const html = renderSection({ salonReferences: references });
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-label="View Salon 1 for Service 1"/);
  assert.doesNotMatch(html, /\/salons\/(?:undefined|null)(?:"|\?)/);
});

test("runtime DOM exposes deterministic loading, empty, error and offline states", () => {
  const loading = renderSection({ trendingRows: [], popularServices: [], trendingLoading: true, popularLoading: true });
  assert.equal(classCount(loading, "section12-service-skeleton"), 4);
  assert.equal(classCount(loading, "section12-area-skeleton"), 3);
  assert.match(loading, /Trending salons load ho rahe hain/);

  const empty = renderSection({ trendingRows: [], popularServices: [] });
  assert.match(empty, /Abhi enough trending activity available nahi hai/);
  assert.match(empty, /Most-booked services abhi available nahi hain/);
  assert.match(empty, /Trending area data abhi available nahi hai/);

  const error = renderSection({ trendingRows: [], popularServices: [], trendingError: true, popularError: true });
  assert.equal((error.match(/role="alert"/g) ?? []).length, 3);
  assert.match(error, /Dobara Try Karein/);
  assert.doesNotMatch(error, /Supabase|Postgres|marketplace_trending|marketplace_popular_services/);

  const offline = renderSection({ online: false });
  assert.match(offline, /Saved results/);
  assert.match(offline, /Live trends update nahi kiye ja sakte/);
  assert.doesNotMatch(offline, /<em>Trending<\/em>/);
});

test("runtime Arrow-key transitions wrap in both directions", () => {
  assert.equal(section12TabIndexForKey("ArrowRight", 0, 3), 1);
  assert.equal(section12TabIndexForKey("ArrowRight", 2, 3), 0);
  assert.equal(section12TabIndexForKey("ArrowLeft", 2, 3), 1);
  assert.equal(section12TabIndexForKey("ArrowLeft", 0, 3), 2);
  assert.equal(section12TabIndexForKey("Home", 2, 3), 0);
  assert.equal(section12TabIndexForKey("End", 0, 3), 2);
  assert.equal(section12TabIndexForKey("Enter", 0, 3), null);
});

test("runtime DOM has one accessible, default-active three-tab shell", () => {
  const html = renderSection();
  assert.equal((html.match(/role="tablist"/g) ?? []).length, 1);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 3);
  assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
  assert.match(html, /id="section12-tab-trending"[^>]*aria-selected="true"/);
  assert.match(html, /id="section12-panel-services"[^>]*hidden=""/);
  assert.match(html, /id="section12-panel-areas"[^>]*hidden=""/);
});
