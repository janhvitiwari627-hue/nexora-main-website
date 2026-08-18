# NEXORA HOMEPAGE — PHASE 1 + SECTION 14

## SECTION 14: CUSTOMER REVIEWS

### Scope and position

Section 14 is the homepage **Customer Reviews** display foundation. Its stable homepage ID is `customer-reviews`.

The homepage now renders the single Section 14 component immediately after Section 13 (`BestOffersSection`, ID `best-offers`) and before Section 15’s existing Membership section. The pre-existing homepage review block was consolidated into this component; no second homepage review/testimonial block remains.

Existing non-review homepage strips remain between the moved Section 14 component and the existing Membership section. Their implementation was not changed.

### Authoritative homepage source

The existing main-site public review path is:

1. `useMarketplaceStats(online)` in `app/nexora-app.tsx`
2. `client.rpc("marketplace_salon_stats")`
3. `SalonStats.recent_reviews`

`marketplace_salon_stats` is the only existing main-site RPC call that returns individual review content. The frontend’s existing source comment identifies these as live marketplace aggregates intended for anonymous aggregate reads without exposing private rows. The SQL/function body, grants, and RLS implementation for this RPC are **not present in this repository**, so no server-side filtering beyond the returned shape is claimed here.

There is no `useCustomerReviews`, `homepage_reviews`, `featured_reviews`, or `marketplace_customer_reviews` contract in the repository.

### Actual interfaces and adapter

The existing frontend `SalonStats` aggregate is now expressed with this nested RPC row shape:

```ts
type MarketplaceRecentReview = {
  author: string;
  rating: number;
  comment: string;
  verified_booking: boolean;
  created_at: string;
};

type SalonStats = {
  salon_id: string;
  rating_avg: number;
  review_count: number;
  booking_count: number;
  recent_reviews: MarketplaceRecentReview[];
  partner_onboarded: boolean;
};
```

Section 14 uses `adaptMarketplaceReviews(...)` to pass only these confirmed presentation fields to its cards:

- salon name and existing public salon slug (joined from the already-public published catalog)
- rating
- unchanged comment text
- unchanged `author` text as the display name

The adapter deliberately excludes `user_id`, booking ID, service ID/name, any auth identifier, avatar, reply, review ID, and the raw `verified_booking` boolean. `marketplace_salon_stats` does not expose an avatar, reply, or review ID in the checked-in type.

### Related review/feedback tables and submission implementation

The supplied migrations contain two separate review-like table contracts:

- `public.customer_reviews` in `20260803_customer_phase1_completion.sql`:
  `id`, `user_id`, `salon_id`, `service_id`, `service_name`, `author`, `rating`, `comment`, `verified_booking`, `booking_id`, and `created_at`.
- Existing `public.reviews` is conditionally augmented in `20260802_customer_phase1_schema.sql` with `salon_id`, `service_id`, `service_name`, `user_id`, `author`, `rating`, `comment`, and `verified`.

`public.customer_feedback` is separate app feedback (`user_id`, optional 1–5 `rating`, `message`, `created_at`) and is not used by Section 14.

The actual Customer PWA source repository is not checked out here. The historical integration artifact only references a `ServiceReview` import; it does not contain a review-submission implementation to inspect. The `20260803` migration comment states that the Customer PWA repository targets `public.customer_reviews`, but this checkout does not contain that client implementation. No review form or submission route was added by this work.

### Publication and moderation

No review-specific `published`, `approved`, `moderated`, `hidden`, `reported`, `deleted`, or status column/policy/RPC was found in the checked-in `customer_reviews` migration or main-site review code.

`public.customer_reviews` has RLS enabled with self-only `select`, `insert`, `update`, and `delete` policies (`auth.uid() = user_id`). Therefore it is not queried directly by the homepage. The homepage relies exclusively on the existing public aggregate RPC.

The repository does not include the body of `marketplace_salon_stats`, so its precise server-side public-selection/moderation predicate cannot be verified. Section 14 adds no publication filter and does not expose a direct table query. The old homepage phrase “once published” was not backed by a checked-in review publication contract and has been removed.

Review-related RPCs such as `review_salon_setup` and `review_business_location` concern salon website/location approval, not customer-review moderation.

### Verified booking

`public.customer_reviews.verified_booking` is an existing boolean (`not null default false`). However, the checked-in self-only insert/update policies only require `auth.uid() = user_id`; the supplied schema does not check a completed booking, join to a booking, or prevent a customer from setting that boolean. The `marketplace_salon_stats` function body is unavailable.

A trusted verified-booking/public-review rule is therefore **not verified in this repository**. Section 14 keeps the raw field in the source type for compatibility but does **not** render a “Verified booking,” “Verified customer,” or equivalent badge. Authentication is not treated as booking verification.

### Customer privacy and identity

The public aggregate row contains `author`; Section 14 displays that exact returned text only, without a profile lookup, formatting, name synthesis, or anonymous fallback. The repository provides no separate display-name normalization, anonymization, or avatar contract for public reviews.

No avatar field is present in `MarketplaceRecentReview` or the `customer_reviews` DDL. Section 14 does not render one.

Section 14 does not pass or render phone, email, `user_id`, auth UUID, customer UUID, booking ID, appointment details, service ID, or address data. It never queries `profiles`, `bookings`, `auth.users`, `customer_reviews`, or `reviews` for review cards.

### Rating and aggregate contract

- `public.customer_reviews.rating` is `smallint not null check (rating between 1 and 5)`.
- The conditional `public.reviews.rating` addition is also `smallint check (rating between 1 and 5)`.
- The public RPC/frontend aggregate exposes `rating_avg: number` and `review_count: number` per salon, and each `recent_reviews` item exposes `rating: number`.
- `service_id` and `service_name` exist in the customer-review table, but the checked-in public aggregate does not expose a service-specific rating aggregate.
- No aggregate formula is present in the repository. Section 14 does not calculate ratings or aggregates in the browser.

### Ordering and limit

No featured, helpful, admin-selected, or global homepage review-ranking RPC/field was found.

The previous homepage code collected aggregate rows and client-sorted them by `created_at`. Section 14 now preserves the `marketplace_salon_stats` RPC row order and, within each aggregate row, the returned `recent_reviews` array order. It adds no recency, rating, or featured sort.

The existing homepage display cap was three reviews (`slice(0, 3)`). It is retained as the named frontend constant `SECTION14_REVIEW_LIMIT = 3`. No backend or admin-configured review limit was found.

### Existing homepage and salon-detail review UI

Before this work, the homepage had one inline “What customers say” block using the same `reviewFeed`; it had no stable Section 14 ID and was rendered later in the page. It is now consolidated into `CustomerReviewsSection`.

The existing public salon-detail page (`SalonPage`) also uses `marketplace_salon_stats` and renders up to four `stats.recent_reviews` rows. Its existing review UI and `/salons/:slug` route were inspected and not changed. `NexoraApp` routes both `/salons/:slug` and `/shops/:slug` to `SalonPage`; Section 14 uses the established `/salons/${slug}` destination.

The unrelated `beauty-industry` application contains mock distributor video testimonials. It is a separate static distributor application and is not a Nexora main-homepage customer-review source; it was not reused.

### Homepage visibility/order configuration

The existing `useHomepageSections()` calls `marketplace_homepage_sections` and checks known `section_key` values for `visible`; it retains a `sort_order` field but does not render sections dynamically by that field.

No existing review/customer-review section key was found in the homepage implementation. The prior homepage review block was already unconditional, so Section 14 preserves that existing behavior rather than inventing a configuration key. The review block now has the required DOM position after Section 13 and before Section 15.

### Owner/business replies

No public owner/business review-reply field or UI was found in the source type, migrations, or review components. Section 14 adds no reply text or owner-response card.

### Security and out-of-scope boundaries

Section 14.1 changes no Supabase schema, migration, table, RPC definition, grants, RLS policy, moderation workflow, booking completion logic, auth/session behavior, or service-role usage. No backend review submission/moderation UI is added.

### Unresolved backend gaps (factual)

- The SQL body, grants, and server-side publication/moderation predicate for `marketplace_salon_stats` are absent from this repository.
- No trusted enforcement of `customer_reviews.verified_booking` against a completed booking is present in the supplied migration.
- No public-review display-name/anonymization/avatar policy is defined beyond the aggregate’s `author` field.
- No public owner/business reply contract is present.
- No review-specific homepage visibility key, review ranking contract, or backend-configured review limit is present.
- The actual Customer PWA review submission source is not included in this checkout.
