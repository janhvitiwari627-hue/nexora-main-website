# Nexora — Phase 7 Scaling Strategy

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This document outlines the scaling strategy for the Nexora platform to handle growth in users, data volume, and traffic.

---

## 1. Scaling Objectives

### 1.1 Target Scale

| Metric | Current | Target (Phase 7) | Target (Phase 8+) |
|--------|---------|------------------|-------------------|
| Monthly Active Users | 1,000 | 10,000 | 100,000+ |
| Daily Bookings | 50 | 500 | 5,000+ |
| Salons | 50 | 500 | 5,000+ |
| API Requests/Day | 10,000 | 100,000 | 1,000,000+ |
| Database Size | 100 MB | 1 GB | 10 GB+ |

### 1.2 Scaling Principles

1. **Horizontal first:** Scale out rather than up
2. **Stateless services:** No server-side session state
3. **Database as bottleneck:** Optimize queries and use caching
4. **Graceful degradation:** Maintain core functionality under load
5. **Observability:** Monitor before, during, and after scaling

---

## 2. Database Scaling

### 2.1 Current Database Architecture

```
┌─────────────────────────────────────────┐
│           Supabase PostgreSQL           │
│  ┌───────────────────────────────────┐  │
│  │         Shared Project            │  │
│  │  qwaehqsmodekbgvnaavz            │  │
│  │                                   │  │
│  │  Tables:                          │  │
│  │  - profiles (users)              │  │
│  │  - salons (listings)             │  │
│  │  - services (catalog)            │  │
│  │  - bookings (appointments)       │  │
│  │  - wallet_transactions           │  │
│  │  - growth_partner_commissions    │  │
│  │  - owner_payouts                 │  │
│  │  - ...                           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  RLS: Enabled on all tables             │
│  Connection Pooling: Enabled            │
└─────────────────────────────────────────┘
```

### 2.2 Indexing Strategy

#### Required Indexes (Phase 7)

```sql
-- Profile lookups by email (auth joins)
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON public.profiles (email);

-- Salon listings by category/area/city
CREATE INDEX IF NOT EXISTS idx_salons_category
ON public.salons (business_category)
WHERE verified = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_salons_area
ON public.salons (area)
WHERE verified = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_salons_city
ON public.salons (city)
WHERE verified = true AND is_active = true;

-- Salon listings by rating/reviews (sorting)
CREATE INDEX IF NOT EXISTS idx_salons_rating
ON public.salons (rating_average DESC)
WHERE verified = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_salons_review_count
ON public.salons (review_count DESC)
WHERE verified = true AND is_active = true;

-- Booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer
ON public.bookings (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_salon
ON public.bookings (salon_id, appointment_start);

CREATE INDEX IF NOT EXISTS idx_bookings_status
ON public.bookings (status) WHERE status IN ('pending', 'confirmed');

-- Wallet transactions by user
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user
ON public.wallet_transactions (user_id, created_at DESC);

-- Commissions by growth partner
CREATE INDEX IF NOT EXISTS idx_commissions_gp
ON public.growth_partner_commissions (growth_partner_id, created_at DESC);

-- Attributions by growth partner
CREATE INDEX IF NOT EXISTS idx_attributions_gp
ON public.shop_attributions (growth_partner_id)
WHERE status = 'active';
```

#### Index Maintenance

```sql
-- Monitor index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 2.3 Query Optimization

#### Catalog Query Optimization

```sql
-- Optimized catalog query with covering index
EXPLAIN ANALYZE
SELECT
    s.id, s.slug, s.name, s.description, s.address, s.area, s.city,
    s.rating_average, s.review_count, s.starting_price_paise,
    s.cover_image_path, s.business_category,
    w.slug as website_slug, w.template_key, w.config, w.published_at
FROM public.salons s
JOIN public.salon_public_websites w ON w.salon_id = s.id
WHERE s.verified = true
  AND s.is_active = true
  AND s.deleted_at IS NULL
  AND w.is_published = true
ORDER BY w.published_at DESC
LIMIT 50;
```

#### Booking Query Optimization

```sql
-- Optimized customer bookings query
EXPLAIN ANALYZE
SELECT
    b.id, b.appointment_start, b.appointment_end, b.status,
    b.total_amount_paise, b.advance_amount_paise,
    s.name as salon_name, s.slug as salon_slug
FROM public.bookings b
JOIN public.salons s ON s.id = b.salon_id
WHERE b.customer_id = $1
  AND b.deleted_at IS NULL
ORDER BY b.appointment_start DESC
LIMIT 50;
```

### 2.4 Connection Pooling

Supabase provides connection pooling via PgBouncer. Ensure:

```typescript
// Use connection pooler for transactional workloads
const poolerUrl = process.env.DATABASE_URL_POLLER;

// Use direct connection for administrative tasks
const directUrl = process.env.DATABASE_URL;
```

### 2.5 Partitioning (Future)

For large tables, consider partitioning:

```sql
-- Example: Partition bookings by year
CREATE TABLE public.bookings_2026
PARTITION OF public.bookings
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE public.bookings_2027
PARTITION OF public.bookings
FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

### 2.6 Read Replicas (Future)

For analytics-heavy workloads:

```
┌─────────────┐     ┌─────────────┐
│  Main App   │────▶│  Primary    │
│  (writes)   │     │  (writes)   │
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │Replica1│  │Replica2│  │Replica3│
         │(reads) │  │(reads) │  │(reads) │
         └────────┘  └────────┘  └────────┘
```

---

## 3. Application Scaling

### 3.1 Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Apex Domain                         │  │
│  │               nexora.example.com                      │  │
│  │                    (Main Website)                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│        ┌───────────────────┼───────────────────┐            │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐       │
│  │ Customer │       │  Owner   │       │   GP     │       │
│  │   PWA    │       │   PWA    │       │   PWA    │       │
│  │(Vercel)  │       │ (Vercel) │       │ (Vercel) │       │
│  └──────────┘       └──────────┘       └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Stateless Design

All applications are stateless:
- No server-side session storage
- Supabase handles authentication state
- Client-side caching only for non-sensitive data
- Redis caching for shared data (future)

### 3.3 Auto-scaling (Vercel)

Vercel provides automatic scaling:
- Serverless functions scale automatically
- No capacity planning needed for Vercel layer
- Configure appropriate timeouts and memory

```json
{
  "functions": {
    "api/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### 3.4 Caching Strategy

#### Client-Side Caching

```typescript
// SWR-style caching pattern
function useCachedCatalog(online: boolean) {
  const [data, setData] = useState(null);
  const [stale, setStale] = useState(true);

  // Revalidate on mount, focus, interval
  useEffect(() => {
    const revalidate = () => {
      if (online) {
        fetchCatalog().then(setData).finally(() => setStale(false));
      }
    };

    revalidate();
    const interval = setInterval(revalidate, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [online]);

  return { data, stale, refresh: () => setStale(true) };
}
```

#### Service Worker Caching

```typescript
// PWA service worker caching
const CACHE_NAME = 'nexora-v1';
const STATIC_ASSETS = [
  '/app/customer/',
  '/app/customer/index.html',
  '/app/customer/assets/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets
  // Network-first for API calls
  // Stale-while-revalidate for catalog
});
```

#### Server-Side Caching (Future)

```typescript
// Redis caching for expensive queries
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedCatalog() {
  const cached = await redis.get('catalog:latest');
  if (cached) return JSON.parse(cached);

  const catalog = await fetchCatalogFromDB();
  await redis.setex('catalog:latest', 60, JSON.stringify(catalog));
  return catalog;
}
```

### 3.5 CDN Configuration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  CDN Edge   │────▶│   Origin    │
│             │     │  (Cloudflare│     │  (Vercel)   │
│             │     │  /Vercel)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Static assets cached at CDN:**
- JavaScript bundles
- CSS files
- Images (cover images, etc.)
- Fonts

**Cache headers:**
```
Cache-Control: public, max-age=31536000, immutable  # versioned assets
Cache-Control: no-cache  # HTML pages
Cache-Control: private, max-age=60  # API responses
```

---

## 4. Security Scaling

### 4.1 Rate Limiting

```sql
-- Rate limiting via Edge Functions or middleware
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_key text,
  p_limit int,
  p_window_seconds int
) RETURNS boolean AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limit_events
  WHERE key = p_key
    AND created_at > NOW() - (p_window_seconds || ' seconds')::interval;

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events (key, created_at)
  VALUES (p_key, NOW());

  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Authentication Scaling

- Supabase Auth handles authentication at scale
- No custom auth server to scale
- Session management via Supabase
- Rate limiting on auth endpoints

### 4.3 RLS at Scale

Row Level Security scales with the database:
- Policies evaluated per-row
- Indexes on RLS columns critical
- Avoid complex policy expressions

```sql
-- Efficient RLS policy
CREATE POLICY "users_view_own_data"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Inefficient (avoid)
CREATE POLICY "complex_policy"
ON public.some_table
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complex_join
    WHERE complex_join.user_id = auth.uid()
    AND complex_join.some_id = some_table.id
  )
);
```

---

## 5. Monitoring & Alerting at Scale

### 5.1 Key Metrics

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| Performance | P95 API latency | > 1000ms |
| Performance | Error rate | > 1% |
| Database | Connection count | > 80% of pool |
| Database | Slow queries (>100ms) | > 10/minute |
| Business | Booking failure rate | > 5% |
| Business | Auth failure rate | > 10% |

### 5.2 Dashboard Setup

```
┌──────────────────────────────────────────────────┐
│                  Operations Dashboard             │
├──────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Traffic     │  │  Errors      │             │
│  │  (requests/s)│  │  (rate, p95) │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Database    │  │  Business    │             │
│  │  (connections│  │  (bookings,  │             │
│  │   , queries) │  │   revenue)   │             │
│  └──────────────┘  └──────────────┘             │
└──────────────────────────────────────────────────┘
```

---

## 6. Disaster Recovery

### 6.1 Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Automated (Supabase) | Daily | 7 days | Supabase |
| Point-in-time recovery | Continuous | 7 days | Supabase |
| Manual exports | Before migrations | 30 days | S3/GCS |

### 6.2 Failover

- Supabase handles database failover automatically
- Vercel handles deployment failover
- Multi-region deployment (future): US, EU, Asia

### 6.3 Rollback Procedures

1. **Database migration rollback:**
   - Restore from backup if needed
   - Most migrations are idempotent

2. **Deployment rollback:**
   - Vercel: One-click rollback to previous deployment
   - PWA patches: Re-apply previous version

---

## 7. Capacity Planning

### 7.1 Growth Projections

| Timeframe | Users | Salons | Bookings/Day | Action |
|-----------|-------|--------|--------------|--------|
| Current | 1,000 | 50 | 50 | Baseline |
| 3 months | 5,000 | 200 | 200 | Monitor |
| 6 months | 10,000 | 500 | 500 | Optimize |
| 12 months | 50,000 | 2,000 | 2,000 | Scale |
| 24 months | 100,000+ | 5,000+ | 5,000+ | Re-architect |

### 7.2 Scaling Triggers

| Trigger | Action |
|---------|--------|
| CPU > 70% for 5 min | Scale up function memory |
| Database connections > 80% | Increase pool size |
| API latency p95 > 1s | Add caching layer |
| Error rate > 1% | Investigate, possibly rollback |
| Storage > 80% | Archive old data |

---

## 8. Future Architecture Considerations

### 8.1 Microservices (Phase 8+)

For very large scale:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Catalog    │  │  Booking    │  │  Payment    │
│  Service    │  │  Service    │  │  Service    │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 8.2 Event-Driven Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Booking   │────▶│   Event     │────▶│   Analytics │
│   Created   │     │   Bus       │     │   Consumer  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Notif.    │
                    │   Service   │
                    └─────────────┘
```

### 8.3 Multi-region (Phase 9+)

```
┌─────────────────┐     ┌─────────────────┐
│   US Region     │     │   EU Region     │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │  Vercel   │  │     │  │  Vercel   │  │
│  │  + DB     │  │     │  │  + DB     │  │
│  └───────────┘  │     │  └───────────┘  │
│         │       │     │         │       │
│         └───────┼─────┼─────────┘       │
│                 │     │                 │
│                 ▼     ▼                 │
│            ┌─────────────────┐          │
│            │   Global DB     │          │
│            │  (Citus/Citus)  │          │
│            └─────────────────┘          │
└─────────────────────────────────────────┘
```

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-05 | Initial Phase 7 scaling strategy |

---

## 10. References

- [Phase 7 Performance Optimizations](./PHASE7_PERFORMANCE_OPTIMIZATIONS.md)
- [Final Architecture Summary](../docs/FINAL_ARCHITECTURE_SUMMARY.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Scaling](https://vercel.com/docs/concepts/security/edge-network)
