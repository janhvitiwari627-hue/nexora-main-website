-- ===========================================================================
-- SUPPLEMENTARY MARKETPLACE RPCs — REFERENCE IMPLEMENTATIONS
-- Shared Supabase project: qwaehqsmodekbgvnaavz
-- Authored: 2026-08-27 (backend audit follow-up)
--
-- ⚠️  READ BEFORE APPLYING ⚠️
-- The homepage (app/nexora-app.tsx) calls 19 marketplace_* RPCs that are NOT
-- defined anywhere in this repository — they exist only as unversioned objects
-- in the live database (evidence: fetchCatalogFromMarketplaceRpc's comment
-- "Security-definer marketplace_search already works…"). The live variants
-- may be richer than these reference bodies (e.g. the live `offers` table
-- carries columns the versioned schema does not define).
--
-- BEFORE running this file:
--   1. Export the live definitions:
--        select proname, prosrc from pg_proc
--        where proname in ('marketplace_categories','marketplace_salon_stats',
--          'marketplace_top_rated','marketplace_trending','marketplace_offers',
--          'marketplace_popular_services');
--   2. Diff them against these reference bodies.
--   3. Adopt whichever body is correct, and commit it — the goal of this file
--      is to close the version-control gap, not to blindly overwrite live
--      behaviour.
--
-- Contracts implemented here were extracted verbatim from the app's expected
-- return shapes (CategoryRow, SalonStats, TopRatedRow, TrendingRow,
-- OfferDetail, PopularService types in app/nexora-app.tsx).
-- Public catalog contract: verified = true AND is_active = true AND
-- is_published = true AND deleted_at IS NULL.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- marketplace_categories() → CategoryRow[]
--   { name, slug, icon, sort_order, salon_count, service_count }
-- Reference body derives categories from salons.business_category. If a
-- dedicated admin-managed categories table exists live, prefer its export.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_categories()
returns table (
  name text,
  slug text,
  icon text,
  sort_order integer,
  salon_count bigint,
  service_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with cat as (
    select s.business_category as name
    from public.salons s
    where s.verified = true
      and s.is_active = true
      and s.deleted_at is null
      and s.business_category is not null
    group by s.business_category
  )
  select
    cat.name,
    lower(regexp_replace(cat.name, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
    ''::text as icon,
    0::integer as sort_order,
    count(distinct s.id) as salon_count,
    count(distinct sv.id) as service_count
  from cat
  left join public.salons s
    on s.business_category = cat.name
   and s.verified = true and s.is_active = true and s.deleted_at is null
  left join public.services sv
    on sv.salon_id = s.id and sv.is_active = true
  group by cat.name
  order by salon_count desc, cat.name asc;
$$;

-- ---------------------------------------------------------------------------
-- marketplace_salon_stats() → SalonStats[] (per-salon public aggregates)
--   { salon_id, rating_avg, review_count, booking_count, recent_reviews,
--     partner_onboarded }
-- recent_reviews is a narrow public view model (rating + comment + created_at)
-- mirroring the app's MarketplaceRecentReview.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_salon_stats()
returns table (
  salon_id text,
  rating_avg numeric,
  review_count bigint,
  booking_count bigint,
  recent_reviews jsonb,
  partner_onboarded boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id::text as salon_id,
    coalesce(r.rating_avg, 0)::numeric as rating_avg,
    coalesce(r.review_count, 0)::bigint as review_count,
    coalesce(b.booking_count, 0)::bigint as booking_count,
    coalesce(r.recent_reviews, '[]'::jsonb) as recent_reviews,
    exists (
      select 1 from public.growth_partner_commissions gpc
      where gpc.salon_id = s.id
    ) as partner_onboarded
  from public.salons s
  left join (
    select
      cr.salon_id::uuid as salon_id,
      avg(cr.rating)::numeric as rating_avg,
      count(*)::bigint as review_count,
      jsonb_agg(
        jsonb_build_object(
          'rating', cr.rating,
          'comment', cr.comment,
          'created_at', cr.created_at
        ) order by cr.created_at desc
      ) filter (where cr.salon_id is not null) as recent_reviews
    from public.customer_reviews cr
    group by cr.salon_id::uuid
  ) r on r.salon_id = s.id
  left join (
    select bk.salon_id, count(*)::bigint as booking_count
    from public.bookings bk
    where bk.status in ('confirmed','completed')
    group by bk.salon_id
  ) b on b.salon_id = s.id
  where s.verified = true and s.is_active = true and s.deleted_at is null;
$$;

-- ---------------------------------------------------------------------------
-- marketplace_top_rated(p_min_reviews int, p_limit int) → TopRatedRow[]
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_top_rated(p_min_reviews integer default 1, p_limit integer default 20)
returns table (
  id text,
  slug text,
  name text,
  business_category text,
  area text,
  city text,
  rating_avg numeric,
  review_count bigint,
  booking_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id::text as id,
    s.slug,
    s.name,
    s.business_category,
    s.area,
    s.city,
    coalesce(r.rating_avg, 0)::numeric as rating_avg,
    coalesce(r.review_count, 0)::bigint as review_count,
    coalesce(b.booking_count, 0)::bigint as booking_count
  from public.salons s
  left join (
    select cr.salon_id::uuid as salon_id,
           avg(cr.rating)::numeric as rating_avg,
           count(*)::bigint as review_count
    from public.customer_reviews cr
    group by cr.salon_id::uuid
  ) r on r.salon_id = s.id
  left join (
    select bk.salon_id, count(*)::bigint as booking_count
    from public.bookings bk
    where bk.status in ('confirmed','completed')
    group by bk.salon_id
  ) b on b.salon_id = s.id
  where s.verified = true and s.is_active = true and s.deleted_at is null
    and coalesce(r.review_count, 0) >= p_min_reviews
  order by rating_avg desc, review_count desc, s.name asc
  limit greatest(p_limit, 1);
$$;

-- ---------------------------------------------------------------------------
-- marketplace_trending(p_limit int) → TrendingRow[]
-- Reference decay: bookings and reviews in the last 30 days, weighted.
-- Live variant may read a marketplace_events table that is not versioned.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_trending(p_limit integer default 6)
returns table (
  id text,
  slug text,
  name text,
  business_category text,
  area text,
  city text,
  rating_avg numeric,
  review_count bigint,
  booking_count bigint,
  trending_score numeric,
  overridden boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id::text as id,
    s.slug,
    s.name,
    s.business_category,
    s.area,
    s.city,
    coalesce(r.rating_avg, 0)::numeric as rating_avg,
    coalesce(r.review_count, 0)::bigint as review_count,
    coalesce(b.booking_count, 0)::bigint as booking_count,
    (coalesce(b.recent_booking_count, 0) * 1.0
      + coalesce(rr.recent_review_count, 0) * 1.5
      + coalesce(r.rating_avg, 0))::numeric as trending_score,
    false as overridden
  from public.salons s
  left join (
    select cr.salon_id::uuid as salon_id,
           avg(cr.rating)::numeric as rating_avg,
           count(*)::bigint as review_count
    from public.customer_reviews cr
    group by cr.salon_id::uuid
  ) r on r.salon_id = s.id
  left join (
    select cr.salon_id::uuid as salon_id, count(*)::bigint as recent_review_count
    from public.customer_reviews cr
    where cr.created_at > now() - interval '30 days'
    group by cr.salon_id::uuid
  ) rr on rr.salon_id = s.id
  left join (
    select bk.salon_id,
           count(*)::bigint as booking_count,
           count(*) filter (where bk.created_at > now() - interval '30 days')::bigint as recent_booking_count
    from public.bookings bk
    where bk.status in ('confirmed','completed')
    group by bk.salon_id
  ) b on b.salon_id = s.id
  where s.verified = true and s.is_active = true and s.deleted_at is null
  order by trending_score desc, review_count desc
  limit greatest(p_limit, 1);
$$;

-- ---------------------------------------------------------------------------
-- marketplace_offers(p_limit int) → OfferDetail[]
-- Reference body maps the VERSIONED offers columns only. The live table is
-- known to carry extra columns (terms, validity window, code, membership_only,
-- eligible_services, remaining_global) — diff and extend before adopting.
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_offers(p_limit integer default 12)
returns table (
  offer_id uuid,
  salon_id uuid,
  salon_name text,
  salon_slug text,
  name text,
  description text,
  terms text,
  discount_type text,
  discount_value numeric,
  maximum_discount_paise bigint,
  minimum_booking_paise bigint,
  valid_from timestamptz,
  valid_until timestamptz,
  code text,
  membership_only boolean,
  eligible_services jsonb,
  remaining_global integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id as offer_id,
    o.salon_id,
    s.name as salon_name,
    s.slug as salon_slug,
    o.title as name,
    o.description,
    null::text as terms,
    o.discount_type,
    o.discount_value,
    null::bigint as maximum_discount_paise,
    null::bigint as minimum_booking_paise,
    null::timestamptz as valid_from,
    null::timestamptz as valid_until,
    null::text as code,
    false as membership_only,
    '[]'::jsonb as eligible_services,
    null::integer as remaining_global
  from public.offers o
  join public.salons s on s.id = o.salon_id
  where o.is_active = true
    and s.verified = true and s.is_active = true and s.deleted_at is null
  order by o.created_at desc
  limit greatest(p_limit, 1);
$$;

-- ---------------------------------------------------------------------------
-- marketplace_popular_services(p_limit int) → PopularService[]
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_popular_services(p_limit integer default 6)
returns table (
  service_id uuid,
  salon_id uuid,
  salon_name text,
  service_name text,
  price_paise integer,
  duration_minutes integer,
  booking_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sv.id as service_id,
    sv.salon_id,
    s.name as salon_name,
    sv.name as service_name,
    sv.price_paise,
    sv.duration_minutes,
    count(bk.id)::bigint as booking_count
  from public.services sv
  join public.salons s on s.id = sv.salon_id
  left join public.bookings bk
    on bk.salon_id = sv.salon_id
   and bk.status in ('confirmed','completed')
   and bk.created_at > now() - interval '90 days'
  where sv.is_active = true
    and sv.is_bookable_online = true
    and s.verified = true and s.is_active = true and s.deleted_at is null
  group by sv.id, sv.salon_id, s.name, sv.name, sv.price_paise, sv.duration_minutes
  order by booking_count desc, sv.name asc
  limit greatest(p_limit, 1);
$$;

-- PostgREST exposure for the read-only public surface.
revoke all on function public.marketplace_categories() from public;
grant execute on function public.marketplace_categories() to anon, authenticated;

revoke all on function public.marketplace_salon_stats() from public;
grant execute on function public.marketplace_salon_stats() to anon, authenticated;

revoke all on function public.marketplace_top_rated(integer, integer) from public;
grant execute on function public.marketplace_top_rated(integer, integer) to anon, authenticated;

revoke all on function public.marketplace_trending(integer) from public;
grant execute on function public.marketplace_trending(integer) to anon, authenticated;

revoke all on function public.marketplace_offers(integer) from public;
grant execute on function public.marketplace_offers(integer) to anon, authenticated;

revoke all on function public.marketplace_popular_services(integer) from public;
grant execute on function public.marketplace_popular_services(integer) to anon, authenticated;

commit;

-- Notify PostgREST to pick up the new function signatures.
-- NOTIFY pgrst, 'reload schema';
