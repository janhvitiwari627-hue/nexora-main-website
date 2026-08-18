/**
 * Homepage Phase 1 — Section 12.1 (Trending and Most Booked) contract tests.
 *
 * Authoritative contract: PHASE1_SECTION12.md (repo root).
 * These tests lock the foundation/live-data work only:
 *   • one dedicated mounted section with the stable id;
 *   • placement after Smart Picks and before Offers / Section 13;
 *   • one existing hook/RPC call per live data source;
 *   • backend row order preserved (direct map, no component-side sort);
 *   • old standalone Trending and Popular Services render sites consolidated.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const nexoraApp = await read("app/nexora-app.tsx");
const globalsCss = await read("app/globals.css");
const routedPage = await read("app/[...path]/page.tsx");

const componentStart = nexoraApp.indexOf("function TrendingMostBookedSection(");
const componentEnd = nexoraApp.indexOf("function TrendingCard(", componentStart);
const componentBlock = nexoraApp.slice(componentStart, componentEnd);
const trendingCardStart = componentEnd;
const trendingCardEnd = nexoraApp.indexOf("function PopularServiceCard(", trendingCardStart);
const trendingCardBlock = nexoraApp.slice(trendingCardStart, trendingCardEnd);
const popularServiceCardStart = trendingCardEnd;
const popularServiceCardEnd = nexoraApp.indexOf("function RecommendationCard(", popularServiceCardStart);
const popularServiceCardBlock = nexoraApp.slice(popularServiceCardStart, popularServiceCardEnd);
const section12RouteBlock = nexoraApp.slice(componentStart, popularServiceCardEnd);
const popularHookStart = nexoraApp.indexOf("function usePopularServices(");
const popularHookEnd = nexoraApp.indexOf("function useHomepageSections(", popularHookStart);
const popularHookBlock = nexoraApp.slice(popularHookStart, popularHookEnd);
const trendingHookStart = nexoraApp.indexOf("function useTrending(");
const trendingHookEnd = nexoraApp.indexOf("function recordMarketplaceEvent(", trendingHookStart);
const trendingHookBlock = nexoraApp.slice(trendingHookStart, trendingHookEnd);
const areaAggregationStart = componentBlock.indexOf("const trendingAreas = useMemo");
const areaAggregationEnd = componentBlock.indexOf("const handleTabKeyDown", areaAggregationStart);
const areaAggregationBlock = componentBlock.slice(areaAggregationStart, areaAggregationEnd);
const trendingPanelStart = componentBlock.indexOf('id="section12-panel-trending"');
const servicePanelStart = componentBlock.indexOf('id="section12-panel-services"');
const areaPanelStart = componentBlock.indexOf('id="section12-panel-areas"');
const trendingPanelBlock = componentBlock.slice(trendingPanelStart, servicePanelStart);
const servicePanelBlock = componentBlock.slice(servicePanelStart, areaPanelStart);
const areaPanelBlock = componentBlock.slice(areaPanelStart);

// ---------------------------------------------------------------------------
// 1 — Specification and dedicated component
// ---------------------------------------------------------------------------

test("PHASE1_SECTION12.md exists and records the Section 12.1 contract", async () => {
  assert.ok(existsSync(new URL("../PHASE1_SECTION12.md", import.meta.url)));
  const md = await read("PHASE1_SECTION12.md");
  assert.match(md, /SECTION 12: TRENDING AND MOST BOOKED/);
  assert.match(md, /`trending-most-booked`/);
  assert.match(md, /useTrending\(\)/);
  assert.match(md, /usePopularServices\(\)/);
});

test("dedicated Section 12 component and stable id each exist exactly once", () => {
  assert.equal((nexoraApp.match(/function TrendingMostBookedSection\(/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/<TrendingMostBookedSection/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/id="trending-most-booked"/g) ?? []).length, 1);
  assert.ok(componentStart >= 0 && componentEnd > componentStart);
});

// ---------------------------------------------------------------------------
// 2 — Locked homepage position and existing admin visibility
// ---------------------------------------------------------------------------

test("Section 12 is mounted after Smart Picks and before the offers section", () => {
  const smartPicksMount = nexoraApp.indexOf("<SmartPicksSection");
  const section12Mount = nexoraApp.indexOf("<TrendingMostBookedSection");
  const offersMount = nexoraApp.indexOf("{visible('offers')", section12Mount);
  assert.ok(smartPicksMount >= 0 && smartPicksMount < section12Mount);
  assert.ok(section12Mount < offersMount);
});

test("existing Trending homepage visibility gate protects consolidated Section 12", () => {
  const mountContext = nexoraApp.slice(
    nexoraApp.lastIndexOf("{visible('trending')", nexoraApp.indexOf("<TrendingMostBookedSection")),
    nexoraApp.indexOf("{visible('offers')", nexoraApp.indexOf("<TrendingMostBookedSection")),
  );
  assert.match(mountContext, /\{visible\('trending'\) && \(/);
  assert.match(mountContext, /<TrendingMostBookedSection/);
});

// ---------------------------------------------------------------------------
// 3 — Existing live hooks/RPC contracts; no duplicate request or re-sort
// ---------------------------------------------------------------------------

test("Trending hook and RPC remain single-source and connected", () => {
  assert.equal((nexoraApp.match(/useTrending\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_trending"/g) ?? []).length, 1);
  assert.match(nexoraApp, /trendingRows=\{trendingRows\}/);
  assert.match(componentBlock, /renderableTrendingRows\.map\(/);
  assert.doesNotMatch(componentBlock, /(?:trendingRows|renderableTrendingRows)(?:\.|\s)*sort\(/);
  assert.doesNotMatch(nexoraApp, /const trending\s*=.*\.sort\(/, "no parallel frontend Trending ranking");
});

test("Popular Services hook and RPC remain single-source and connected", () => {
  assert.equal((nexoraApp.match(/usePopularServices\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_popular_services"/g) ?? []).length, 1);
  assert.match(nexoraApp, /popularServices=\{popularServices\}/);
  assert.match(componentBlock, /renderablePopularServices\.map\(/);
  assert.doesNotMatch(componentBlock, /(?:popularServices|renderablePopularServices)(?:\.|\s)*sort\(/);
});

// ---------------------------------------------------------------------------
// 4 — Consolidation: no old duplicate render sites
// ---------------------------------------------------------------------------

test("Trending and Most Booked UI each render only inside Section 12", () => {
  assert.match(componentBlock, /<h3 id="trending-salons-heading">\{trendingHeading\}<\/h3>/);
  assert.match(componentBlock, /<h3 id="most-booked-services-heading">\{servicesHeading\}<\/h3>/);
  assert.equal((nexoraApp.match(/renderableTrendingRows\.map\(/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/renderablePopularServices\.map\(/g) ?? []).length, 1);
});

// ---------------------------------------------------------------------------
// 5 — Section 12.3 Trending Salon cards
// ---------------------------------------------------------------------------

test("Trending Salon rendering keeps backend order and enforces a maximum of six valid rows", () => {
  assert.match(nexoraApp, /const TRENDING_SALONS_DISPLAY_LIMIT = 6/);
  assert.match(componentBlock, /for \(const row of trendingRows\)/);
  assert.match(componentBlock, /rows\.length >= TRENDING_SALONS_DISPLAY_LIMIT/);
  assert.match(componentBlock, /renderableTrendingRows\.map\(/);
  assert.doesNotMatch(componentBlock, /(?:trendingRows|renderableTrendingRows)(?:\.|\s)*sort\(/);
  assert.match(nexoraApp, /isRenderableTrendingSalonRow/);
});

test("Trending cards use real row fields, published catalog images and accessible ratings", () => {
  assert.match(trendingCardBlock, /salonReference\?\.coverImagePath/);
  assert.match(trendingCardBlock, /loading="lazy"/);
  assert.match(trendingCardBlock, /alt=\{`\$\{name\} salon photo`\}/);
  assert.match(trendingCardBlock, /row\.business_category/);
  assert.match(trendingCardBlock, /row\.area/);
  assert.match(trendingCardBlock, /row\.city/);
  assert.match(trendingCardBlock, /row\.rating_avg/);
  assert.match(trendingCardBlock, /row\.review_count/);
  assert.match(trendingCardBlock, /out of 5/);
  assert.match(trendingCardBlock, /row\.booking_count/);
});

test("Trending cards label overrides honestly, hide internal score and use safe salon routes", () => {
  assert.match(trendingCardBlock, /row\.overridden \? "Saved featured" : "Saved"/);
  assert.match(trendingCardBlock, /row\.overridden \? "Featured" : "Trending"/);
  assert.doesNotMatch(trendingCardBlock, /trending_score/);
  assert.match(trendingCardBlock, /navigate\(`\/salons\/\$\{slug\}`\)/);
  assert.match(nexoraApp, /!slug\.includes\("\/"\)/);
  assert.doesNotMatch(trendingCardBlock, /#1 Trending|Most Popular|Customer Favourite/i);
});

// ---------------------------------------------------------------------------
// 6 — Section 12.4 Most Booked Service cards
// ---------------------------------------------------------------------------

test("Most Booked Services preserve RPC order and cap valid aggregate rows at six", () => {
  assert.match(nexoraApp, /const POPULAR_SERVICES_DISPLAY_LIMIT = 6/);
  assert.match(componentBlock, /for \(const service of popularServices\)/);
  assert.match(componentBlock, /rows\.length >= POPULAR_SERVICES_DISPLAY_LIMIT/);
  assert.match(componentBlock, /renderablePopularServices\.map\(/);
  assert.doesNotMatch(componentBlock, /(?:popularServices|renderablePopularServices)(?:\.|\s)*sort\(/);
  assert.match(nexoraApp, /isRenderablePopularService/);
});

test("Most Booked cards render trusted service fields with safe duration and INR price handling", () => {
  assert.match(popularServiceCardBlock, /service\.service_name/);
  assert.match(popularServiceCardBlock, /service\.salon_name/);
  assert.match(popularServiceCardBlock, /formatPopularServiceDuration\(service\.duration_minutes\)/);
  assert.match(popularServiceCardBlock, /service\.price_paise/);
  assert.match(popularServiceCardBlock, /hasPrice \? money\(pricePaise\) : "Price unavailable"/);
  assert.match(popularServiceCardBlock, /service\.booking_count/);
  assert.match(popularServiceCardBlock, /aggregate marketplace activity/);
  assert.doesNotMatch(popularServiceCardBlock, /250 bookings|500\+ booked|Trending Service|Most Popular/i);
});

test("Most Booked cards expose no private bookings and never emit a broken salon URL", () => {
  assert.match(nexoraApp, /resolvePopularServiceSalonSlug/);
  assert.match(componentBlock, /salonReferences\.get\(service\.salon_id\)/);
  assert.match(popularServiceCardBlock, /disabled=\{!salonSlug\}/);
  assert.match(popularServiceCardBlock, /salonSlug && navigate\(`\/salons\/\$\{salonSlug\}`\)/);
  assert.doesNotMatch(popularServiceCardBlock, /\/salons\/undefined|\/salons\/null|\/salons\/\$\{.*\?\?.*""/);
  assert.doesNotMatch(popularServiceCardBlock, /customer_(?:id|name)|phone|email|booking_id|appointment/i);
  assert.doesNotMatch(popularHookBlock, /\.from\(["'](?:bookings|appointments)["']\)/);
});

// ---------------------------------------------------------------------------
// 7 — Section 12.5 Trending Areas derived from existing Trending rows
// ---------------------------------------------------------------------------

test("Trending Areas use no dedicated or duplicate area request", () => {
  assert.equal((nexoraApp.match(/useTrending\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_trending"/g) ?? []).length, 1);
  assert.doesNotMatch(nexoraApp, /client\.rpc\("marketplace_(?:popular|trending)_areas?"/);
  assert.match(areaAggregationBlock, /for \(const row of renderableTrendingRows\)/);
  assert.match(areaAggregationBlock, /\}, \[renderableTrendingRows\]\)/);
});

test("Trending Areas normalize and group real localities safely in backend-presence order", () => {
  assert.match(nexoraApp, /const TRENDING_AREAS_DISPLAY_LIMIT = 6/);
  assert.match(nexoraApp, /value\.trim\(\)\.replace\(\/\\s\+\/g, " "\)/);
  assert.match(nexoraApp, /key: display\.toLowerCase\(\)/);
  assert.match(areaAggregationBlock, /const key = `\$\{area\.key\}::\$\{city\?\.key \?\? ""\}`/);
  assert.match(areaAggregationBlock, /areas\.length >= TRENDING_AREAS_DISPLAY_LIMIT/);
  assert.doesNotMatch(areaAggregationBlock, /\.sort\(|trending_score|booking_count/);
});

test("Trending Areas label, cards, route and unavailable state are truthful", () => {
  assert.match(nexoraApp, /label: "Trending Areas"/);
  assert.match(componentBlock, /const areasHeading =[\s\S]*?"Trending Areas"/);
  assert.match(areaPanelBlock, /<h3 id="trending-areas-heading">\{areasHeading\}<\/h3>/);
  assert.doesNotMatch(areaPanelBlock, /Most Booked Areas|Popular Areas|Top Booking Areas/);
  assert.match(areaPanelBlock, /trendingAreas\.map\(/);
  assert.match(areaPanelBlock, /navigate\(`\/salons\?area=\$\{encodeURIComponent\(area\.name\)\}`\)/);
  assert.match(areaPanelBlock, /Trending area data abhi available nahi hai/);
  assert.doesNotMatch(areaPanelBlock, /1,240 bookings|50 active salons|900 customers|#1 Jaipur area|80% trending/i);
});

// ---------------------------------------------------------------------------
// 8 — Section 12.6 supported routes, panel CTAs and browser history
// ---------------------------------------------------------------------------

test("Section 12 destinations use inspected /salons route and query contracts", () => {
  assert.match(nexoraApp, /if \(path === "\/salons"\) content = <CatalogPage/);
  assert.match(nexoraApp, /path\.startsWith\("\/salons\/"\)/);
  assert.match(nexoraApp, /const area = params\.get\("area"\)/);
  assert.match(nexoraApp, /\["rating", "popularity", "price", "availability", "name"\]\.includes\(sort\)/);
  assert.doesNotMatch(section12RouteBlock, /trending=true|sort=trending|popular=true|mostBooked=true|serviceTrending=true|areaTrending=true/);
});

test("Section 12 panel and card CTAs have supported, non-duplicated destinations", () => {
  assert.match(trendingPanelBlock, /navigate\("\/salons"\)\}>Sabhi Trending Salons Dekhein<\/button>/);
  assert.match(servicePanelBlock, /navigate\("\/salons"\)\}>Popular Services Explore Karein<\/button>/);
  assert.match(areaPanelBlock, />\s*Area Ke Salons Dekhein\s*<\/button>/);
  assert.match(trendingCardBlock, /navigate\(`\/salons\/\$\{slug\}`\)/);
  assert.match(popularServiceCardBlock, /salonSlug && navigate\(`\/salons\/\$\{salonSlug\}`\)/);
  assert.match(areaPanelBlock, /navigate\(`\/salons\?area=\$\{encodeURIComponent\(area\.name\)\}`\)/);
  assert.doesNotMatch(section12RouteBlock, /href="#"|href=""|<Link|<a\b/);
  assert.doesNotMatch(section12RouteBlock, /\/salons\/(?:undefined|null)|navigate\(""\)/);
});

test("client navigation supports Back/Forward and catch-all routes support direct load or refresh", () => {
  assert.match(nexoraApp, /window\.history\.pushState\(\{\}, "", target\)/);
  assert.match(nexoraApp, /window\.addEventListener\("popstate", handlePopState\)/);
  assert.match(nexoraApp, /window\.removeEventListener\("popstate", handlePopState\)/);
  assert.match(nexoraApp, /setPath\(window\.location\.pathname\)/);
  assert.match(routedPage, /NexoraRoot initialPath=\{`\/\$\{resolved\.path\.join\("\/"\)\}`\}/);
});

// ---------------------------------------------------------------------------
// 9 — Section 12.7 deterministic loading/empty/error/offline/partial states
// ---------------------------------------------------------------------------

test("Trending and Popular hooks expose retry errors without discarding loaded rows", () => {
  assert.match(nexoraApp, /const updateOnlineState = \(\) => setOnline\(navigator\.onLine\)/);
  assert.match(nexoraApp, /window\.addEventListener\("offline", updateOnlineState\)/);
  assert.match(nexoraApp, /window\.addEventListener\("online", updateOnlineState\)/);
  assert.match(trendingHookBlock, /const \[error, setError\] = useState\(false\)/);
  assert.match(popularHookBlock, /const \[error, setError\] = useState\(false\)/);
  assert.match(trendingHookBlock, /return \{ rows, loading, load, error \}/);
  assert.match(popularHookBlock, /return \{ services, loading, load, error \}/);
  assert.doesNotMatch(trendingHookBlock, /setRows\(\[\]\)/);
  assert.doesNotMatch(popularHookBlock, /setServices\(\[\]\)/);
  assert.match(nexoraApp, /onRetryTrending=\{retryTrending\}/);
  assert.match(nexoraApp, /onRetryPopular=\{retryPopularServices\}/);
});

test("each Section 12 tab uses a card-matched initial loading skeleton", () => {
  assert.match(trendingPanelBlock, /trendingLoading \? \([\s\S]*?<Section12SalonSkeletons count=\{3\}/);
  assert.match(servicePanelBlock, /popularLoading \? \([\s\S]*?<Section12ServiceSkeletons count=\{4\}/);
  assert.match(areaPanelBlock, /trendingLoading \? \([\s\S]*?<Section12AreaSkeletons count=\{3\}/);
  assert.match(section12RouteBlock, /section12-service-skeleton/);
  assert.match(section12RouteBlock, /section12-area-skeleton/);
  assert.doesNotMatch(componentBlock, /className="loader"/);
});

test("Trending tab has distinct empty, partial, error/retry, offline and retained-data states", () => {
  assert.match(trendingPanelBlock, /Abhi enough trending activity available nahi hai\./);
  assert.match(trendingPanelBlock, /trendingCount < TRENDING_SALONS_DISPLAY_LIMIT/);
  assert.match(trendingPanelBlock, /Trending data load nahi ho saka\. Dobara try karein\./);
  assert.match(trendingPanelBlock, /onRetryTrending\(\)/);
  assert.match(trendingPanelBlock, /Aap offline hain\. Live trends update nahi kiye ja sakte\./);
  assert.match(trendingPanelBlock, /Saved results/);
  assert.match(trendingPanelBlock, /Previously loaded results/);
  assert.match(trendingPanelBlock, /trendingCount \? \(/);
});

test("Services tab has distinct empty, partial, error/retry, offline and retained-data states", () => {
  assert.match(servicePanelBlock, /Most-booked services abhi available nahi hain\./);
  assert.match(servicePanelBlock, /serviceCount < POPULAR_SERVICES_DISPLAY_LIMIT/);
  assert.match(servicePanelBlock, /Most-booked services load nahi ho saki\. Dobara try karein\./);
  assert.match(servicePanelBlock, /onRetryPopular\(\)/);
  assert.match(servicePanelBlock, /Aap offline hain\. Live trends update nahi kiye ja sakte\./);
  assert.match(servicePanelBlock, /Saved results/);
  assert.match(servicePanelBlock, /Previously loaded results/);
  assert.match(servicePanelBlock, /serviceCount \? \(/);
});

test("Areas tab derives separate empty, partial, error/retry, offline and retained-data states", () => {
  assert.match(areaPanelBlock, /Trending area data abhi available nahi hai\./);
  assert.match(areaPanelBlock, /areaCount < TRENDING_AREAS_DISPLAY_LIMIT/);
  assert.match(areaPanelBlock, /Trending areas load nahi ho sake\. Dobara try karein\./);
  assert.match(areaPanelBlock, /onRetryTrending\(\)/);
  assert.match(areaPanelBlock, /Aap offline hain\. Live trends update nahi kiye ja sakte\./);
  assert.match(areaPanelBlock, /Saved results/);
  assert.match(areaPanelBlock, /Previously loaded results/);
  assert.match(areaPanelBlock, /areaCount \? \(/);
});

test("Section 12 state announcements are accessible and visitor copy hides backend internals", () => {
  assert.equal((componentBlock.match(/className="sr-only" role="status" aria-live="polite"/g) ?? []).length, 3);
  assert.match(section12RouteBlock, /role=\{kind === "error" \? "alert" : "status"\}/);
  assert.match(trendingPanelBlock, /role="alert"/);
  assert.match(servicePanelBlock, /role="alert"/);
  assert.match(areaPanelBlock, /role="alert"/);
  assert.doesNotMatch(componentBlock, /Supabase error|Postgres|stack trace|database response|marketplace_trending|marketplace_popular_services/);
});

// ---------------------------------------------------------------------------
// 10 — Section 12.8 responsive layout and complete tab accessibility
// ---------------------------------------------------------------------------

test("Section 12 uses three/two/one responsive card columns without page overflow", () => {
  assert.match(globalsCss, /\.section12 \.salon-grid,\.section12 \.service-grid,\.section12 \.section12-area-grid \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(globalsCss, /@media\(max-width:920px\)[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(globalsCss, /@media\(max-width:620px\)[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
  assert.match(globalsCss, /\.section12 \{ min-width:0; overflow-x:clip; \}/);
  assert.match(globalsCss, /\.section12-tabs-scroll \{[^}]*overflow-x:auto/);
  assert.match(globalsCss, /minmax\(0,1fr\)/);
});

test("Section 12 touch targets, long content and salon media are responsive", () => {
  assert.match(globalsCss, /\.section12 button \{ min-height:44px; \}/);
  assert.match(globalsCss, /overflow-wrap:anywhere/);
  assert.match(globalsCss, /word-break:break-word/);
  assert.match(globalsCss, /\.section12-service-card \{[^}]*flex-direction:column/);
  assert.match(globalsCss, /\.trending-salon-card \.salon-visual \{[^}]*aspect-ratio:32\/19/);
  assert.match(globalsCss, /\.trending-salon-card \.salon-visual img \{[^}]*object-fit:cover/);
  assert.match(trendingCardBlock, /width=\{640\} height=\{380\} loading="lazy"/);
});

test("Section 12 keeps semantic section, h2 and unique tab/panel relationships", () => {
  assert.match(componentBlock, /<section[\s\S]*?id="trending-most-booked"/);
  assert.match(componentBlock, /<h2 id="trending-most-booked-heading">Abhi Kya Trending Hai<\/h2>/);
  assert.match(componentBlock, /role="tablist"/);
  assert.match(componentBlock, /role="tab"/);
  assert.equal((componentBlock.match(/role="tabpanel"/g) ?? []).length, 3);
  assert.match(componentBlock, /aria-selected=\{selectedTab === tab\.key\}/);
  assert.match(componentBlock, /aria-controls=\{tab\.panelId\}/);
  assert.match(componentBlock, /aria-labelledby="section12-tab-trending"/);
  assert.match(componentBlock, /aria-labelledby="section12-tab-services"/);
  assert.match(componentBlock, /aria-labelledby="section12-tab-areas"/);
  const tabIds = [...nexoraApp.matchAll(/tabId: "([^"]+)"/g)].map((match) => match[1]);
  const panelIds = [...nexoraApp.matchAll(/panelId: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(tabIds.length, 3);
  assert.equal(panelIds.length, 3);
  assert.equal(new Set([...tabIds, ...panelIds]).size, 6);
});

test("tabs use automatic Arrow-key activation, wrap and roving tabindex", () => {
  assert.match(nexoraApp, /key === "ArrowRight"\) return \(currentIndex \+ 1\) % tabCount/);
  assert.match(nexoraApp, /key === "ArrowLeft"\) return \(currentIndex - 1 \+ tabCount\) % tabCount/);
  assert.match(componentBlock, /section12TabIndexForKey\(event\.key, currentIndex\)/);
  assert.match(componentBlock, /setSelectedTab\(nextTab\.key\)/);
  assert.match(componentBlock, /document\.getElementById\(nextTab\.tabId\)\?\.focus\(\)/);
  assert.match(componentBlock, /tabIndex=\{selectedTab === tab\.key \? 0 : -1\}/);
  assert.match(componentBlock, /onClick=\{\(\) => setSelectedTab\(tab\.key\)\}/);
  assert.equal((componentBlock.match(/hidden=\{selectedTab !==/g) ?? []).length, 3);
  assert.match(globalsCss, /\.section12-panel\[hidden\] \{ display:none; \}/);
});

test("Section 12 controls have visible focus and contextual accessible names", () => {
  assert.match(globalsCss, /\.section12 button:focus-visible \{ outline:3px solid #8e004b/);
  assert.match(globalsCss, /\.section12 \.primary:focus-visible \{ outline-color:#26181c/);
  assert.match(globalsCss, /\.section12-panel:focus-visible/);
  assert.match(trendingCardBlock, /aria-label=\{`View \$\{name\}`\}/);
  assert.match(popularServiceCardBlock, /aria-label=\{`View \$\{salonName\} for \$\{serviceName\}`\}/);
  assert.match(areaPanelBlock, /aria-label=\{`View salons in \$\{area\.name\}`\}/);
  assert.match(trendingCardBlock, /out of 5/);
  assert.doesNotMatch(trendingCardBlock, /aria-label=.*★/);
});

test("Section 12 status, contrast and reduced-motion treatments remain accessible", () => {
  assert.equal((componentBlock.match(/role="status" aria-live="polite"/g) ?? []).length, 3);
  assert.match(section12RouteBlock, /role=\{kind === "error" \? "alert" : "status"\}/);
  assert.match(globalsCss, /\.section12 \.primary \{ background:var\(--pink-dark\); color:#fff; \}/);
  assert.match(globalsCss, /\.section12-tab\[aria-selected="true"\]/);
  assert.match(globalsCss, /\.section12-tab\[aria-selected="true"\]::after/);
  assert.match(globalsCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.section12 \.skeleton/);
  assert.match(globalsCss, /transition-duration:0s !important/);
  assert.match(section12RouteBlock, /aria-hidden="true"/);
});

// ---------------------------------------------------------------------------
// 11 — Section 12.9 public-data boundaries and bounded request/render behavior
// ---------------------------------------------------------------------------

test("Section 12 receives only a minimal published-salon reference adapter", () => {
  assert.match(nexoraApp, /type Section12SalonReference = \{\s*id: string;\s*slug: string;\s*coverImagePath: string \| null;\s*\}/);
  assert.match(nexoraApp, /useMemo<ReadonlyMap<string, Section12SalonReference>>/);
  assert.match(nexoraApp, /salonReferences=\{section12SalonReferences\}/);
  assert.doesNotMatch(componentBlock, /catalogItems: CatalogItem\[\]/);
  assert.doesNotMatch(section12RouteBlock, /\b(?:user_id|customer_id|booking_id|appointment_id|appointment_notes|phone|email|payment_details|service_role)\b/i);
  assert.doesNotMatch(section12RouteBlock, /console\.(?:log|debug|info)|JSON\.stringify/);
});

test("Section 12 hooks remain single-source and never query private booking tables", () => {
  assert.equal((nexoraApp.match(/useTrending\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/usePopularServices\(online\)/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_trending"/g) ?? []).length, 1);
  assert.equal((nexoraApp.match(/client\.rpc\("marketplace_popular_services"/g) ?? []).length, 1);
  assert.doesNotMatch(trendingHookBlock, /\.from\(["'](?:bookings|appointments|profiles|auth\.users)["']\)/);
  assert.doesNotMatch(popularHookBlock, /\.from\(["'](?:bookings|appointments|profiles|auth\.users)["']\)/);
  assert.doesNotMatch(trendingHookBlock + popularHookBlock, /selectedTab/);
});

test("bounded memoized arrays preserve backend order and stable real keys", () => {
  assert.match(componentBlock, /const renderableTrendingRows = useMemo/);
  assert.match(componentBlock, /rows\.push\(row\)[\s\S]*?rows\.length >= TRENDING_SALONS_DISPLAY_LIMIT/);
  assert.match(componentBlock, /renderableTrendingRows\.map\(\(row\) => \([\s\S]*?key=\{row\.id\}/);
  assert.match(componentBlock, /const renderablePopularServices = useMemo/);
  assert.match(componentBlock, /rows\.push\(service\)[\s\S]*?rows\.length >= POPULAR_SERVICES_DISPLAY_LIMIT/);
  assert.match(componentBlock, /renderablePopularServices\.map\(\(service\) => \([\s\S]*?key=\{service\.service_id\}/);
  assert.match(areaAggregationBlock, /for \(const row of renderableTrendingRows\)/);
  assert.match(areaAggregationBlock, /\}, \[renderableTrendingRows\]\)/);
  assert.match(areaPanelBlock, /trendingAreas\.map\(\(area\) => \([\s\S]*?key=\{area\.key\}/);
  assert.doesNotMatch(componentBlock, /\.sort\(/);
  assert.doesNotMatch(section12RouteBlock, /key=\{(?:index|i)\}|Math\.random\(|Date\.now\(/);
});

test("Section 12 rendering is capped and lower-homepage images remain lazy", () => {
  assert.match(nexoraApp, /const TRENDING_SALONS_DISPLAY_LIMIT = 6/);
  assert.match(nexoraApp, /const POPULAR_SERVICES_DISPLAY_LIMIT = 6/);
  assert.match(nexoraApp, /const TRENDING_AREAS_DISPLAY_LIMIT = 6/);
  assert.match(trendingCardBlock, /loading="lazy" decoding="async"/);
  assert.match(trendingCardBlock, /salonReference\?\.coverImagePath/);
  assert.doesNotMatch(componentBlock, /new Array\([^)]*DISPLAY_LIMIT|fill\(/);
});

test("latest-request guards prevent stale Trending or Services responses from winning", () => {
  for (const hookBlock of [trendingHookBlock, popularHookBlock]) {
    assert.match(hookBlock, /const requestVersion = useRef\(0\)/);
    assert.match(hookBlock, /const version = \+\+requestVersion\.current/);
    assert.match(hookBlock, /version === requestVersion\.current/);
    assert.match(hookBlock, /requestVersion\.current \+= 1/);
  }
});

test("Section 12 keeps the existing homepage visibility and placement contract", () => {
  const section12Mount = nexoraApp.indexOf("<TrendingMostBookedSection");
  const smartPicksMount = nexoraApp.indexOf("<SmartPicksSection");
  const offersMount = nexoraApp.indexOf("{visible('offers')", section12Mount);
  const visibilityGate = nexoraApp.lastIndexOf("{visible('trending')", section12Mount);
  assert.ok(visibilityGate >= 0 && visibilityGate < section12Mount);
  assert.ok(smartPicksMount < section12Mount && section12Mount < offersMount);
  assert.doesNotMatch(componentBlock, /useState<TrendingRow|useState<PopularService/);
});
