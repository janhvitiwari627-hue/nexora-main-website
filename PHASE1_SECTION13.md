# NEXORA HOMEPAGE — PHASE 1 + SECTION 13

## SECTION 13: BEST OFFERS

### Scope

Section 13.1 is the foundation and live-data connection for Homepage Section 13. It consolidates the existing homepage Active Offers implementation (`OffersStrip` + `marketplace_offers`) into one dedicated section. It does not invent a new RPC, hook name, table, ranking rule, or visual system.

This phase is source implementation, not an audit-only or Markdown-only phase.

### Section Position

The locked homepage order for this part of the page is:

1. Section 12 — Trending and Most Booked (`id="trending-most-booked"`)
2. Section 13 — Best Offers (`id="best-offers"`)
3. Section 14 — Customer Reviews (existing “What customers say” block)

Section 13 is mounted immediately after the existing Section 12 component and immediately before the existing Partner Approved Offers strip and later homepage sections (Open Now, Sponsored, Recently viewed, Customer Reviews, Membership, Apps). Sections 01–12 remain intact except for the minimum wiring needed to lift the existing offers request to `HomePage`.

### Stable ID

`best-offers`

The ID is a stable public in-page contract and must render exactly once. No prior canonical homepage id for this section existed.

### Existing offer system (inspected)

Public / marketplace:

- RPC: `marketplace_offers` with `{ p_limit: 12 }` — the only homepage public offer aggregate call. **SQL for this RPC is not present in this repository**; the frontend contract is the sole in-repo definition.
- Types: `OfferDetail` (homepage RPC row), `Offer` (legacy card), `OfferRow` (salon-page table row), `PartnerPromo` (partner strip).
- Table: `public.offers` (`20260804_shop_owner_phase2_full.sql`) with columns `id`, `salon_id`, `title`, `description`, `discount_type`, `discount_value`, `is_active`, `created_at`.
- RLS: `offers_public_read` — `select` to `anon, authenticated` where `is_active=true`; `offers_owner_all` for salon managers.
- Related table name referenced in production-gate inventory: `offer_services`.
- Partner strip (separate, not Section 13): `marketplace_partner_promos` → `PartnerPromosStrip`.
- Salon detail: `fetchSalonMarketplace` reads `offers` with `.eq("is_active", true)` selecting `id,salon_id,name,description,discount_type,discount_value,valid_until`.
- Catalog offers-only filter uses the same public `offers` table.

`OfferDetail` fields actually typed and rendered:

- `offer_id`, `salon_id`, `salon_name`, `salon_slug`
- `name`, `description`, `terms`
- `discount_type`, `discount_value`
- `maximum_discount_paise`, `minimum_booking_paise`
- `valid_from`, `valid_until`
- `code` (public coupon code when the RPC returns one)
- `membership_only`
- `eligible_services: { service_id, service_name }[]`
- `remaining_global` (shown only when `<= 10`; not a private customer redemption list)

Validity / status rules confirmed in this repo:

- Table + salon-page query: `is_active = true`.
- Homepage RPC comment/empty copy: approved, in-date offers from published salons; usage limits and eligibility enforced server-side.
- Public RLS: `is_active=true`.
- Date windows (`valid_from` / `valid_until`) are displayed when present; the frontend does not re-filter them.
- Migration `offers` table does **not** define coupon code, usage limit, membership, min spend, or date columns — those exist only on the `OfferDetail` RPC type used by the website.

Routing:

- Offer cards navigate to `/salons/${offer.salon_slug}` (existing salon storefront).
- Booking remains the Customer PWA handoff used elsewhere (`/app/customer/?salon=…`).

### Ranking / “Best”

**Not defined in this repository.** There is no `priority`, featured flag, display-order column, popularity sort, or “best offers” RPC.

Section 13 therefore:

- preserves `marketplace_offers` response order
- does not sort by discount size
- does not claim a “best” ranking algorithm

### Existing homepage markup

The homepage already rendered:

- Active Offers (`visible('offers')` + former `OffersStrip`)
- Partner Approved Offers (`PartnerPromosStrip`) — **kept**; not Section 13

Section 13 consolidates Active Offers only. Partner promotions stay as a separate existing strip.

### Component contract

`BestOffersSection` receives typed props:

- `offers: OfferDetail[]` — RPC rows unchanged
- `loading: boolean`
- `navigate`

`HomePage` owns exactly one `useMarketplaceOffers(online)` call. The section does not issue a second RPC.

Visibility: existing `useHomepageSections()` key `offers`. Missing config row remains default-visible.

### Security

Section 13.1 makes no changes to schema, migrations, RPC SQL, RLS, auth, Edge Functions, or checkout. It does not query `bookings` or private redemptions.

### Unresolved backend gaps (factual)

- `marketplace_offers` function body is not in this repo — validity/order rules beyond the frontend type cannot be verified from source here.
- Live inventory notes the live `offers` table may lack `title` while the migration creates `title`; salon-page select uses `name`.
- No explicit “best” ranking contract exists.

### Out of scope

Section 13.2 and later visual/filter/carousel work. No new data sources.
