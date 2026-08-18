# NEXORA HOMEPAGE — PHASE 1 + SECTION 12

## SECTION 12: TRENDING AND MOST BOOKED

### Scope

Section 12.1 is the foundation and live-data connection for Homepage Section 12. It consolidates the existing Trending and Popular Services homepage implementations into one dedicated section without introducing a parallel data source, a second RPC request, fake marketplace data, or a new design system.

This phase is source implementation, not an audit-only or Markdown-only phase.

### Section Position

The locked homepage order for this part of the page is:

1. Section 11 — AI Smart Picks
2. Section 12 — Trending and Most Booked
3. Section 13 — Best Offers

Section 12 must be mounted immediately after the existing Smart Picks section and immediately before the existing offers section. Sections 01–11 and later sections remain intact except for the minimum wiring needed to consolidate and mount Section 12.

### Stable ID

`trending-most-booked`

The ID is a stable public in-page contract and must render exactly once.

### Existing Contracts to Reuse

Trending data:

- `useTrending()`
- `trendingRows`
- `marketplace_trending`

Most-booked service data:

- `usePopularServices()`
- `popularServices`
- `marketplace_popular_services`

Homepage configuration:

- Existing `useHomepageSections()` visibility behavior
- Existing section keys for Trending and Popular Services when provided by the backend

Existing shared cards, layout classes, navigation contracts, published salon catalog data, loading states, empty states, and online/offline hook behavior must be preserved wherever applicable.

### Trending Live-Data Rules

- Reuse the existing `useTrending(online)` call.
- Reuse the existing `marketplace_trending` RPC contract.
- Keep the RPC response order exactly as returned by the backend.
- Do not re-sort Trending rows by rating, reviews, bookings, name, or any other frontend rule.
- Do not hardcode salons.
- Do not fabricate booking counts, scores, reviews, or trending signals.
- Do not expose the internal trending score in public UI.
- Do not read private booking records directly.
- Do not modify the RPC parameters or backend ranking contract for Section 12.1.
- Preserve the existing online/offline request behavior.

### Popular Services Live-Data Rules

- Reuse the existing `usePopularServices(online)` call.
- Reuse the existing `marketplace_popular_services` RPC contract.
- Keep the RPC response data and order unchanged.
- Do not issue a second Popular Services RPC request.
- Do not hardcode or invent service examples.
- Do not fabricate booking counts, prices, duration, salon names, or service names.
- Do not access private booking records directly.
- Use the existing published salon catalog only to resolve an existing salon route.
- Preserve the existing online/offline request behavior.

### Component Contract

Create or safely extract one dedicated Section 12 component using the repository's current React architecture and existing styling primitives.

The component receives typed props for:

- Trending RPC rows
- Trending loading state
- Popular Services RPC rows
- Popular Services loading state
- Existing published catalog items needed for route resolution
- Existing visibility flags
- Existing navigation callback

The component must render the two existing live-data experiences as a single Section 12 source implementation. It must not call either RPC itself when the existing homepage hooks already own those requests.

### Duplicate Prevention

- Exactly one Section 12 element uses `id="trending-most-booked"`.
- Remove the old standalone Trending render site after consolidating it into Section 12.
- Remove the old standalone Popular Services render site after consolidating it into Section 12.
- Keep one `useTrending()` call and one `usePopularServices()` call on the homepage.
- Preserve the existing shared hooks and RPC names.
- Do not add a parallel Trending selector based on frontend rating sorting.
- Do not add a parallel most-booked service query.

### Visibility and Ordering

If the homepage configuration returns a visibility entry for Trending or Popular Services, Section 12 must respect it. A missing configuration row keeps the repository's existing default-visible behavior.

Section 12's fixed Phase 1 placement remains after Smart Picks and before Best Offers. Section 12.1 does not change the backend homepage configuration schema, RPC, or sort-order contract.

### Security and Data Integrity

Section 12.1 makes no changes to:

- Supabase schema
- Database migrations
- RPC definitions
- Row Level Security
- Authentication or authorization
- Service-role usage
- Private booking access

Only public-safe aggregate RPC responses already exposed by the application may be rendered.

### Section 12.1 Completion Gate

Section 12.1 is complete only when all of the following are true:

- `PHASE1_SECTION12.md` exists.
- A dedicated Section 12 source component exists.
- The stable ID is exactly `trending-most-booked`.
- Section 12 is mounted after AI Smart Picks and before Best Offers.
- Existing `useTrending()` data is connected.
- Existing `usePopularServices()` data is connected.
- `marketplace_trending` backend order is preserved.
- `marketplace_popular_services` response data is preserved.
- Existing Trending and Popular Services render sites are consolidated rather than duplicated.
- Existing homepage visibility behavior is preserved.
- Sections 01–11 remain intact.
- No backend, auth, RLS, schema, or migration changes are made.
- TypeScript and lint checks pass, excluding unrelated pre-existing failures.

A Markdown file, audit, or plan without the mounted live source component does not complete Section 12.1.

### Out of Scope

Section 12.2 and any later Section 12 visual or behavioral enhancement are not part of this implementation. Section 12.1 does not redesign cards, add filters, add carousels, add analytics, change ranking, add new data sources, or change backend contracts.
