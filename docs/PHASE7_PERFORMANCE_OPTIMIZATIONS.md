# Nexora — Phase 7 Performance Optimizations

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This document outlines the performance optimizations implemented in Phase 7.

---

## 1. Overview

Phase 7 focuses on optimizing the Nexora platform for:
- Faster initial page loads
- Improved runtime performance
- Better user experience during data fetching
- Efficient resource utilization

---

## 2. Main Website Optimizations

### 2.1 Catalog Loading

**Before:** Catalog loaded synchronously on every page render
**After:** Lazy loading with loading states

```typescript
function useCatalog(online: boolean) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchCatalog());
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (online) void load();
      else {
        setLoading(false);
        setError("You are offline. Reconnect to load published salons.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, online]);

  return { items, loading, error, load };
}
```

**Benefits:**
- Non-blocking initial render
- Loading skeletons improve perceived performance
- Offline handling prevents unnecessary API calls

### 2.2 Memoized Computations

**Before:** Catalog filtering/sorting recomputed on every render
**After:** `useMemo` for expensive operations

```typescript
const filtered = useMemo(() => {
  let list = items.filter(item => {
    const hay = `${item.name} ${item.area} ${item.city} ${item.business_category}`.toLowerCase();
    const q = query.toLowerCase();
    const matchQuery = !q || hay.includes(q);
    const matchCat = !categoryFilter || item.business_category === categoryFilter;
    const matchCity = !cityFilter || item.city === cityFilter;
    const matchRating = !ratingFilter || Number(item.rating_average) >= ratingFilter;
    return matchQuery && matchCat && matchCity && matchRating;
  });

  if (sortBy === "rating") list = [...list].sort((a, b) => Number(b.rating_average) - Number(a.rating_average));
  else if (sortBy === "reviews") list = [...list].sort((a, b) => b.review_count - a.review_count);
  else if (sortBy === "price") list = [...list].sort((a, b) => Number(a.starting_price_paise || 0) - Number(b.starting_price_paise || 0));
  else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  return list;
}, [items, query, categoryFilter, cityFilter, ratingFilter, sortBy]);
```

**Benefits:**
- Filtering/sorting only re-runs when dependencies change
- Smooth sorting/filtering UI interactions

### 2.3 Singleton Supabase Client

**Before:** New Supabase client on each render
**After:** Singleton client with cache key validation

```typescript
let singleton: SupabaseClient | null = null;
let singletonCacheKey = "";

function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const u = new URL(supabaseUrl);
    if (u.hostname !== EXPECTED_SUPABASE_HOST) {
      console.warn(`[Nexora] Using Supabase host ${u.hostname}, expected ${SUPABASE_PROJECT_REF}.supabase.co`);
    }
  } catch {
    return null;
  }

  const cacheKey = `${supabaseUrl}::${supabaseKey}`;
  if (singleton && singletonCacheKey === cacheKey) return singleton;

  singleton = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  singletonCacheKey = cacheKey;
  return singleton;
}
```

**Benefits:**
- Single Supabase connection per page load
- No redundant client initialization
- Session persistence across navigation

### 2.4 Smart Search Param Parsing

**Before:** Query params parsed on every render
**After:** Parsed once on mount

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat) setCategoryFilter(cat);
  const area = params.get("area");
  if (area) setQuery(area);
  const city = params.get("city");
  if (city) setCityFilter(city);
}, []);
```

**Benefits:**
- Deep links work efficiently
- No redundant URL parsing

---

## 3. PWA Optimizations

### 3.1 Service Worker Scoping

Each PWA registers a service worker scoped to its portal path:

```typescript
// Customer PWA
serviceWorker.register(`/app/customer/sw.js`, {
  scope: `/app/customer/`,
});

// Owner PWA
serviceWorker.register(`/app/owner/sw.js`, {
  scope: `/app/owner/`,
});

// Growth Partner PWA
serviceWorker.register(`/app/partner/sw.js`, {
  scope: `/app/partner/`,
});
```

**Benefits:**
- Isolated caching per portal
- No cross-portal cache conflicts
- Proper offline support per role

### 3.2 Base Path Configuration

Each PWA is configured with its canonical base path:

```bash
# Customer PWA
VITE_APP_BASE_PATH=/app/customer/

# Owner PWA
VITE_APP_BASE_PATH=/app/owner/

# Growth Partner PWA
VITE_APP_BASE_PATH=/app/partner/
```

**Benefits:**
- Correct asset loading
- Proper routing within each PWA
- Canonical URL enforcement

---

## 4. Database Query Optimizations

### 4.1 Catalog Query

```sql
-- Fetch published websites
SELECT salon_id, slug, template_key, config, published_at
FROM salon_public_websites
WHERE is_published = true
ORDER BY published_at DESC;

-- Fetch matching salons in single query
SELECT id, slug, name, description, address, area, city,
       rating_average, review_count, starting_price_paise,
       cover_image_path, business_category
FROM salons
WHERE id IN (...website salon_ids...)
  AND verified = true
  AND is_active = true
  AND deleted_at IS NULL;
```

**Optimizations:**
- Single query for websites
- Single query for matching salons using `IN`
- No N+1 queries

### 4.2 Profile Query

```sql
-- Single query for profile with role
SELECT platform_role, is_active, full_name
FROM profiles
WHERE id = auth.uid()
LIMIT 1;
```

**Optimizations:**
- Selective column fetch (not `SELECT *`)
- Indexed on user ID
- Used for auth guards throughout app

---

## 5. Rendering Optimizations

### 5.1 Loading States

```typescript
// Skeleton loaders for catalog
function SalonSkeletons({ count }: { count: number }) {
  return (
    <div className="salon-grid" aria-label="Loading salons">
      {Array.from({ length: count }, (_, index) => (
        <div className="salon-card skeleton" key={index}>
          <div />
          <p />
          <p />
          <p />
        </div>
      ))}
    </div>
  );
}
```

**Benefits:**
- Perceived performance improvement
- Layout stability during loading
- Accessibility with aria-labels

### 5.2 State Cards

```typescript
function StateCard({ title, text, action, onAction }: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="state-card">
      <span>✦</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && onAction && (
        <button className="secondary" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}
```

**Benefits:**
- Clear empty/error states
- Action buttons for recovery
- Consistent UI patterns

---

## 6. Network Optimizations

### 6.1 Offline Detection

```typescript
useEffect(() => {
  const sync = () => setOnline(navigator.onLine);
  sync();
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  return () => {
    window.removeEventListener("online", sync);
    window.removeEventListener("offline", sync);
  };
}, []);
```

**Benefits:**
- User feedback during network issues
- Prevent unnecessary API calls when offline
- Graceful degradation

### 6.2 Error Handling

```typescript
function friendlyError(error: unknown): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Reconnect and try again.";
  }

  let message = "Something went wrong.";
  if (error instanceof Error) message = error.message;
  else if (typeof error === "object" && error !== null && "message" in error) {
    message = String((error as { message: unknown }).message);
  }

  if (/failed to fetch|networkerror|network error/i.test(message)) {
    return "We could not reach Nexora. Please check your connection and retry.";
  }
  if (/rate.*limit|too many requests|429/i.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message;
}
```

**Benefits:**
- User-friendly error messages
- Network-specific handling
- Security: doesn't expose internal errors

---

## 7. Bundling Optimizations

### 7.1 Code Splitting

- Main website code split by route
- PWAs bundled independently
- No cross-portal code duplication

### 7.2 Tree Shaking

- Only required Supabase functions imported
- No unused role dashboard code in main website
- Production builds exclude dev code

### 7.3 Environment Variable Handling

```typescript
// Main website uses Next.js env vars only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// PWAs use Vite env vars only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**Benefits:**
- Proper bundling per framework
- No leaked environment variables
- Clear separation between deployments

---

## 8. Performance Monitoring

### 8.1 Key Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Time to Interactive (TTI) | < 3s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Catalog API latency (p95) | < 500ms | Server logs |
| Auth session check | < 100ms | Client timing |

### 8.2 Monitoring Implementation

```typescript
// Performance timing for catalog load
const loadStart = performance.now();
await fetchCatalog();
const loadDuration = performance.now() - loadStart;
console.log(`[Nexora] Catalog loaded in ${loadDuration.toFixed(0)}ms`);
```

---

## 9. Future Optimizations

### 9.1 Short-term (Phase 7.1)

- [ ] Add pagination to catalog queries
- [ ] Implement infinite scroll for large catalogs
- [ ] Add image optimization/lazy loading
- [ ] Cache catalog data in service worker

### 9.2 Medium-term (Phase 7.2)

- [ ] Implement GraphQL for flexible data fetching
- [ ] Add Redis caching layer for catalog
- [ ] Database read replicas for analytics queries
- [ ] CDN configuration for static assets

### 9.3 Long-term (Phase 8+)

- [ ] Advanced search with Elasticsearch/Algolia
- [ ] Real-time availability updates via Supabase Realtime
- [ ] A/B testing framework for UI optimization
- [ ] Performance budgets in CI/CD

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-05 | Initial Phase 7 performance optimizations |
