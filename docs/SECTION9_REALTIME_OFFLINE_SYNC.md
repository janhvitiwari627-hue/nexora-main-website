# Section 9 — Realtime, Offline, Synchronization & Service Worker Behavior

**Sub-point:** 9.1 — Realtime Usage Rules  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Realtime is an **exception path for short-lived, user-actionable state**. It is not a general-purpose data transport, cache invalidation mechanism, analytics feed, or replacement for a normal authenticated query.

A client MAY subscribe only after it has rendered the relevant authenticated screen and knows the smallest authorized scope it needs. Every realtime payload is advisory: the client must validate its schema, preserve local UI consistency, and refetch an authorized canonical resource when a state transition requires complete data.

The database remains the authority. Payment providers and trusted server-side webhook processors remain the authority for payment state.

## 2. Allowed realtime use cases

Only the following domains may create client-visible realtime events. Each event must contain the minimum data required to update the active UI and must be filtered to its authorized row scope.

| Domain | Permitted events | Authorized recipients | Required client behavior |
|---|---|---|---|
| **Bookings lifecycle** | Booking created, confirmed, declined, rescheduled, cancelled, checked-in, completed, no-show | The booking customer and staff/owner users authorized for that booking's salon | Update the active booking view/list; refetch the booking on version gaps or terminal transitions. |
| **User notifications** | A notification addressed to the authenticated user is created, read, or withdrawn | The `recipient_user_id` only | Update badge/inbox state. Notification content must never be broadcast on salon-wide channels. |
| **Proposal / verification status** | Status transition or request-for-information for a proposal, onboarding, or verification record | The subject user and explicitly authorized reviewing staff | Refresh the status panel; fetch documents through existing authorized endpoints rather than placing them in payloads. |
| **Live staff availability** | Availability-slot opened/held/released/closed, or staff availability changed | Users authorized to book or manage the relevant salon/service | Treat as a freshness hint and re-check availability before booking. Holds and final booking decisions are server-authoritative. |
| **Server-verified payment status** | A server-verified payment attempt changes state (for example `processing`, `succeeded`, `failed`, `refunded`) | The paying customer and authorized salon finance/owner users, where applicable | Show status only. Never mark a payment successful from client/provider SDK events alone; reconcile using the server-authorized payment record. |

### 2.1 Exclusions within allowed domains

- Do not send payment card data, provider secrets, webhook bodies, invoice line-item detail beyond the viewer's authorization, verification documents, internal reviewer notes, or full user profiles in realtime payloads.
- Do not use a booking or availability event to grant access to a salon, customer, employee, or payment record.
- Realtime presence/broadcast features must not be used to sidestep database RLS. If introduced later, they require a separate security review and server-issued, scope-bound authorization.

## 3. Forbidden realtime use cases

The following data must **not** be delivered by a client realtime subscription, even when it appears convenient:

| Forbidden category | Required alternative |
|---|---|
| **Static salon information** — profiles, addresses, service catalogues, imagery, policy text, public opening hours | Normal API/database query with HTTP caching, CDN/cache headers, and explicit cache invalidation on writes. |
| **Historical reports** — booking history aggregates, operational dashboards, exports, trend views | On-demand authenticated queries or precomputed reports; paginate and cache according to report requirements. |
| **Financial datasets** — payouts, commissions, wallet ledgers, revenue reports, reconciliation data, audit events | Server-side authenticated/reporting endpoints with least-privilege access. Financial records must remain protected by RLS and existing revocations. |
| **Public cached content** — marketing pages, discovery results, public reviews, blog/content assets | CDN/HTTP caching and standard query refresh; do not maintain anonymous public realtime channels. |

If a product request does not fit an allowed domain, it is forbidden until this specification is explicitly amended following security review.

## 4. Channel naming and authorization model

### 4.1 Naming convention

Use private, versioned, entity-scoped channel names. Names are identifiers only; they must not contain email addresses, names, telephone numbers, tokens, payment-provider IDs, or other sensitive values.

```text
nexora:v1:booking:<booking_uuid>
nexora:v1:notification:user:<user_uuid>
nexora:v1:proposal:<proposal_uuid>
nexora:v1:verification:<verification_uuid>
nexora:v1:availability:salon:<salon_uuid>:service:<service_uuid>
nexora:v1:payment:<payment_attempt_uuid>
```

Rules:

1. UUID values must be canonical IDs, not user-controlled display strings.
2. Subscribe to the narrowest entity channel possible. A salon-level availability channel is permitted only for availability, never bookings, notifications, proposals, verification, or payment events.
3. A user may not subscribe to wildcard, organization-wide, role-wide, anonymous, or cross-tenant channels (for example `booking:*`, `salon:<id>:*`, or `payments`).
4. Channel names are not authorization. Authorization is enforced independently for every delivered row/event.
5. Use the `nexora:v1` prefix. Any incompatible payload or authorization change requires a new channel version; clients must unsubscribe from obsolete versions.

### 4.2 RLS and per-event filtering requirements

All realtime source tables must have RLS enabled and force RLS where ownership bypass is not explicitly required by trusted server operations. Realtime publication must expose only tables/events whose SELECT policy is suitable for the intended recipients.

For each delivered INSERT, UPDATE, or DELETE event:

- **Bookings:** policy must authorize only the booking's `customer_id` or a current staff/owner membership for its `salon_id`. Membership must be active and tenant/salon-scoped.
- **Notifications:** policy must require `recipient_user_id = auth.uid()`. No staff, tenant, or salon fan-out is allowed unless each recipient has an individually authorized notification row.
- **Proposals and verification:** policy must require subject ownership or an active, scoped reviewer/staff assignment. Reviewer access must not imply access to unrelated subject records.
- **Availability:** policy must authorize users who may view/book the specific salon and service, or active staff/owners for that salon. Availability records must be scoped by `salon_id` and `service_id`; staff identity is included only when the viewer is authorized to see it.
- **Payments:** policy must require the payer's ownership of the payment record or an active salon role specifically entitled to view the payment. Raw provider events, webhook event rows, ledger rows, commissions, payouts, and audit logs are never published to clients.

RLS must be tested with authenticated JWTs representing: the owning customer, authorized salon owner/staff, authorized reviewer where applicable, a different user in the same tenant, a user in another tenant, and anonymous access. The last three must receive no row/event.

## 5. Subscription lifecycle and safety controls

1. Authenticate before subscribing. On token refresh, reconnect/resubscribe using the refreshed authenticated session; on sign-out, tenant switch, role loss, or screen exit, immediately unsubscribe and clear realtime-derived state.
2. Subscribe only while the corresponding screen/component is active. Do not retain background subscriptions for static data or historical lists.
3. Enforce a maximum subscription scope in the client: one current booking/payment/proposal/verification entity, the current user's notification channel, and the currently viewed salon/service availability channel(s). Product-specific limits may be tighter.
4. Include an immutable record ID, event type, schema version, `updated_at`, and monotonically increasing entity version (or equivalent server sequence) in events. Do not include secrets or sensitive data not required by the view.
5. Deduplicate by event ID/version. Ignore stale/out-of-order events. On a version gap, reconnect, authorization failure, malformed payload, or reconnect after offline time, refetch canonical state through the normal authorized API.
6. Mutations remain RPC/API driven and idempotent. A realtime event confirms or refreshes a server result; it must not be the only evidence that a mutation succeeded.
7. Log subscription authorization denials, unexpected channel names, reconnect storms, and dropped/error events without logging protected payload content.

## 6. Payment-specific rule

The client may display a realtime payment update only after the trusted server has verified the provider webhook/signature and committed the canonical payment state. Browser redirects, provider SDK callbacks, and client-submitted status values are provisional UI signals only. The authoritative transition must be written by the server's secure payment workflow, be idempotent, and then be eligible for the scoped payment event above.

## 7. Implementation acceptance checklist for 9.1

- [ ] Each new subscription is mapped to one allowed use case in this document.
- [ ] No forbidden category is included in a realtime publication or broadcast channel.
- [ ] The channel follows the `nexora:v1` naming and minimum-scope rules.
- [ ] Source table RLS and SELECT policies enforce the specified recipient scope.
- [ ] Cross-user, cross-salon/tenant, unauthorized-role, and anonymous negative tests prove that no event is delivered.
- [ ] Payloads are versioned, minimal, non-sensitive, and safely handled out of order.
- [ ] The client unsubscribes on logout, role/tenant change, and view teardown.
- [ ] Payment events originate only after server verification and canonical persistence.

## 8. Change control

Adding a use case, broadening a channel, or publishing a new table requires: a threat-model review, explicit RLS policy review, payload minimization review, negative authorization tests, and an update to this specification before release.

---

**Sub-point:** 9.2 — Offline Data Access & Caching Rules  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Offline data access enables resilience in low-connectivity environments while strictly respecting authorization boundaries established in Section 9.1 and database RLS. Caching must never bypass Row-Level Security, must never allow unauthorized writes, and must guarantee that cached data is always scoped to the currently authenticated user, salon, or tenant.

The canonical source of truth remains the server database. Cached data is advisory only and must be treated as potentially stale. Offline writes are queued and reconciled only after successful server-side authorization validation.

## 2. Client-side caching strategy

### 2.1 Primary storage technologies

- **IndexedDB** (via `idb` or native APIs): Used for structured, queryable offline data (appointments, salon profiles, user preferences, cached lists).
  - Stores normalized relational-like records with indexes on `id`, `salon_id`, `user_id`, `updated_at`, and authorization scope keys.
  - Separate object stores per data domain: `bookings`, `salon_profiles`, `user_settings`, `services`, `availability_slots`, `notifications`.
- **CacheStorage API** (via Service Worker): Used for static assets, API response snapshots, and offline-first pages.
  - Named caches: `nexora-static-v1`, `nexora-api-v1`, `nexora-images-v1`.
  - Service Worker intercepts fetch events and serves from cache when offline or for stale-while-revalidate strategies.

All caching logic must be implemented inside a registered Service Worker (`/public/sw.js` or equivalent) and a dedicated client-side cache manager module (`lib/offline/cache-manager.ts`).

### 2.2 Data flow

1. On successful authenticated API response: write minimal authorized projection to IndexedDB + CacheStorage.
2. On app load or screen mount: attempt network-first, fall back to IndexedDB + CacheStorage.
3. Background sync (via Background Sync API or periodic `sync` event): reconcile queued writes and refresh read-only caches.

## 3. Read-only offline data scopes

Only explicitly authorized, read-only data may be cached for offline access. The following scopes are permitted:

| Data Scope | Example Entities | Authorization Constraint | Offline Access Mode |
|---|---|---|---|
| **Appointments / Bookings** | User's own bookings, staff-managed bookings for their salon | `customer_id = auth.uid()` OR active staff/owner membership on `salon_id` | Read-only. Cached by booking UUID + salon scope. |
| **Salon Profiles** | Public profile fields, services catalogue, opening hours, staff roster (public view) | Salon is published and viewer has at least read membership or is a potential customer | Read-only. Never cache private financial or internal notes. |
| **User Settings** | Preferences, notification toggles, saved locations, theme | Strictly `user_id = auth.uid()` | Read-only. |
| **Availability Slots** | Future open slots for a specific salon/service | Viewer authorized to view/book that salon | Read-only snapshot. Must be refreshed on reconnect. |
| **Notifications** | Inbox for the authenticated user | `recipient_user_id = auth.uid()` | Read-only. |

**Explicit restrictions:**
- Never cache full user profiles, payment methods, ledger entries, verification documents, internal audit logs, or cross-tenant data.
- Never cache data belonging to other salons or users even if the current user has partial access.
- Anonymous users may cache only fully public, published marketing content (no personal data).

## 4. Restricted offline write operations & queue mechanisms

### 4.1 Permitted offline writes (queued only)

- Booking creation / reschedule / cancel (customer self-service)
- Service request / proposal submission
- User preference updates
- Read receipts for notifications

All other mutations (staff schedule changes, financial operations, role assignments, salon configuration) **must** be performed online only.

### 4.2 Queue implementation

- Use a dedicated IndexedDB object store: `offline_write_queue`.
- Each queued item contains:
  ```ts
  {
    id: string,                    // uuid
    operation: 'create' | 'update' | 'delete',
    entity: 'booking' | 'notification' | ...,
    payload: object,               // minimal validated data
    auth_scope: { user_id, salon_id?, tenant_id? },
    timestamp: number,
    retry_count: number,
    last_error?: string
  }
  ```
- On network restoration: process queue in order (FIFO) using authenticated RPC/API calls.
- On conflict or authorization failure: discard item, notify user, and clear affected cache entries.
- Use `navigator.serviceWorker.ready` + Background Sync registration (`sync` tag: `nexora-sync-writes`).

### 4.3 Safety rules

- Every queued write must include the authenticated user context captured at enqueue time.
- Never trust client-provided `user_id`, `salon_id`, etc. — always re-validate server-side via RLS + JWT.
- On sign-out or role revocation: immediately purge the entire write queue and all cached data.

## 5. Cache invalidation, TTL, and storage quota management rules

### 5.1 Invalidation triggers

- Explicit server `updated_at` or version mismatch on refetch.
- Authorization scope change (user signs out, switches salon, role revoked).
- Successful write reconciliation (invalidate related read caches).
- Manual user action ("Refresh data") or forced logout.
- Service Worker update detected.

### 5.2 TTL & freshness policies

| Data Type | Max Age (TTL) | Strategy | Notes |
|---|---|---|---|
| Bookings / Appointments | 15 minutes | stale-while-revalidate | Refresh on screen focus or realtime event |
| Salon Profiles | 60 minutes | cache-first + background refresh | Public data; revalidate on reconnect |
| User Settings | 24 hours | network-first | Must be fresh on login |
| Availability Slots | 5 minutes | network-first | Critical for booking flow |
| Notifications | 5 minutes | stale-while-revalidate | Badge updates via realtime preferred |
| Static Assets | 7 days | cache-first | Service Worker precache |

### 5.3 Storage quota management

- Target maximum usage: 50 MB per user (IndexedDB + CacheStorage combined).
- Implement quota monitoring via `navigator.storage.estimate()`.
- On approaching quota (≥80%):
  - Evict least-recently-used (LRU) entries older than TTL.
  - Prioritize eviction: historical bookings > salon profiles > user settings.
  - Never evict the current user's active booking or queued writes.
- On quota exceeded: clear all non-essential caches, show warning banner, and force online-only mode until space is freed.
- Periodic cleanup job (on app idle or every 24h): remove entries where `updated_at < now - 30 days`.

### 5.4 Security & privacy rules for caching

- All cached data must be encrypted at rest where the platform supports it (IndexedDB encryption via Web Crypto or platform-specific).
- On logout / session end: immediately delete all IndexedDB stores and CacheStorage entries for the user.
- Never persist sensitive fields (tokens, payment details, PII beyond what's strictly necessary for offline UX).
- Cache keys must incorporate the authenticated `user_id` / `salon_id` to prevent cross-user leakage.

## 6. Implementation acceptance checklist for 9.2

- [ ] IndexedDB schema and CacheStorage strategy documented and implemented in Service Worker.
- [ ] Only read-only scopes listed above are cached; all other data is excluded.
- [ ] Offline write queue exists with proper auth_scope capture and server re-validation.
- [ ] TTL, invalidation, and LRU quota policies are enforced.
- [ ] Logout / role change immediately clears all caches and queues.
- [ ] Negative tests confirm no cross-user / cross-salon cached data leakage.
- [ ] Quota monitoring and graceful degradation implemented.
- [ ] All offline operations respect the Authorization & Data Isolation rules below.

## 7. 9.2 Authorization & Data Isolation (applies to both realtime and offline)

- Realtime must never bypass Row-Level Security.
- RLS must remain enabled on every Realtime-exposed private table.
- Channel names, topics, filters, and record IDs are not security boundaries.
- Every subscription must be protected by database-level authorization.
- A user must receive only events they are authorized to read through a normal authenticated query.
- Every private subscription must be scoped by the authenticated user, salon, tenant, booking, proposal, or partner attribution.
- Never subscribe a normal user to an unrestricted private table.
- Never trust a client-provided `user_id`, `salon_id`, `partner_id`, or channel name as proof of authorization.
- Private Broadcast and Presence channels must verify authenticated membership.
- Anonymous users may subscribe only to explicitly public and published data.
- Service-role credentials must never be used to create browser Realtime connections.
- Role, ownership, or membership changes must take effect without requiring a full application restart.
- When access is revoked, the client must unsubscribe immediately, clear unauthorized cached data, and refetch the permitted scope.
- Realtime payloads must expose only required fields. Sensitive internal fields must use protected projections, views, or server-generated events.

## 8. Change control for 9.2

Any modification to caching scopes, TTL values, queue behavior, or offline write permissions requires:
- Threat-model review
- RLS + authorization policy review
- Storage quota impact analysis
- Negative authorization and cross-tenant leakage tests
- Update to this specification before release.

---

**Sub-point:** 9.3 — Subscription Lifecycle  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Every realtime subscription in the Nexora platform must have **exactly one clear owner** — a page, component, authenticated session, or application-level manager — and must be **torn down deterministically** when that owner's lifecycle ends. No subscription may outlive its owner, leak across user boundaries, or persist after the authorization scope that created it has changed.

The subscription lifecycle is the primary defense against: unauthorized data delivery after role/tenant changes, phantom state updates to destroyed components, duplicate connections consuming server resources, and cross-account event contamination on shared devices.

This specification governs the **creation, tracking, maintenance, and destruction** of every Supabase Realtime channel subscription across all Nexora client applications.

## 2. Subscription ownership model

### 2.1 Owner types

Every subscription must be assigned to exactly one of the following owner categories. No subscription may exist without an owner.

| Owner Type | Scope | Example | Lifetime Boundary |
|---|---|---|---|
| **Component** | A single React component instance | A `<BookingDetailCard>` subscribing to `nexora:v1:booking:<uuid>` | Mount → unmount of the component |
| **Page / Route** | A top-level page or route handler | The bookings list page subscribing to notification updates | Route mount → route exit or replacement |
| **Authenticated Session** | The current `auth.uid()` identity | A notification subscription for `nexora:v1:notification:user:<uuid>` | Sign-in → sign-out or session expiry |
| **Application-Level Manager** | A singleton service (e.g., global notification badge) | A notification badge manager subscribing on user login | App boot with valid session → sign-out |

### 2.2 Ownership invariants

The following invariants are **non-negotiable** and must hold at all times:

1. **One owner per subscription.** A channel subscription reference is held by exactly one owner. If two components need the same channel, they must share via a single owner (e.g., a context provider or singleton manager), not create two subscriptions.
2. **Owner destruction = subscription destruction.** When the owning component unmounts, the owning page is left, or the owning session ends, the subscription **must** be unsubscribed synchronously in the cleanup phase.
3. **No orphaned subscriptions.** At no point may a subscription exist whose owner has been destroyed or whose auth scope is invalid.
4. **Subscription references are non-transferable.** A subscription created under `user_A`'s session may never be reused, renamed, or handed off to `user_B`'s session. It must be destroyed and a new one created.

## 3. Mandatory teardown triggers

Every subscription must be removed when **any** of the following conditions is met. The teardown must be immediate — not deferred to garbage collection, idle callbacks, or "next render."

### 3.1 Component unmount

When a React component that owns a subscription unmounts (including route transitions, conditional rendering, parent removal, or error boundaries):

```typescript
useEffect(() => {
  let active = true; // guards against post-unmount state updates
  const channel = supabase
    .channel('nexora:v1:booking:' + bookingId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` }, (payload) => {
      if (!active) return; // component already unmounted — discard
      handleBookingUpdate(payload);
    })
    .subscribe();

  return () => {
    active = false; // mark destroyed BEFORE unsubscribe
    supabase.removeChannel(channel);
  };
}, [bookingId, supabase]);
```

**Rules:**
- The `active` flag (or equivalent abort signal) must be checked **before** every state update triggered by the subscription callback.
- `removeChannel()` must be called in the effect cleanup function — never inside a conditional, never wrapped in a timeout.
- If the component re-renders and the `bookingId` changes, the old channel is removed and a new one is created (the effect dependency array enforces this).

### 3.2 User leaves the relevant route

When the user navigates away from a route that requires a subscription:

```typescript
// In a route-level subscription manager
useEffect(() => {
  if (!isBookingsRoute(currentPath)) return;
  
  const channel = createBookingChannel(supabase, activeSalonId);
  
  return () => {
    supabase.removeChannel(channel);
    clearBookingRealtimeState(); // clear any in-memory derived state
  };
}, [currentPath, activeSalonId, supabase]);
```

**Rules:**
- Route detection must use the actual navigation state, not component visibility or scroll position.
- If the user navigates to a different portal (e.g., from `/app/customer` to `/app/owner`), all subscriptions owned by the previous portal must be torn down.
- The `portalRoleFromPath()` utility from `lib/portalRoutes.ts` can be used to detect portal transitions.

### 3.3 Active salon or tenant changes

When the user switches the active salon or tenant context (e.g., a business owner with multiple salons selecting a different salon):

```typescript
useEffect(() => {
  if (!activeSalonId) return;

  const channel = supabase
    .channel(`nexora:v1:availability:salon:${activeSalonId}`)
    .on('postgres_changes', { /* ... */ }, handleAvailabilityChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    // Clear all salon-scoped realtime-derived state
    clearSalonScopedState(activeSalonId);
  };
}, [activeSalonId, supabase]); // salonId in deps forces teardown + recreation
```

**Rules:**
- The `activeSalonId` (or `tenantId`) must appear in the effect dependency array so that any change triggers the cleanup → recreation cycle.
- All in-memory state derived from the previous salon's subscription must be cleared. Retaining it risks displaying stale data from a salon the user is no longer viewing.
- Never accumulate subscriptions across salon switches. Only the current salon's subscription may be active.

### 3.4 Authenticated user changes

When the authenticated identity changes (sign-out, sign-in of a different user, or forced session replacement):

```typescript
// Application-level auth state listener — mirrors the pattern in nexora-app.tsx
useEffect(() => {
  let active = true;
  let sessionRevision = 0;

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const revision = ++sessionRevision;
    if (!active) return;

    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Tear down ALL user-scoped subscriptions
      teardownAllUserSubscriptions();
      clearAllPrivateInMemoryState();
      return;
    }

    if (event === 'TOKEN_REFRESHED') {
      // Recreate subscriptions with the new token
      recreateSubscriptionsForSession(session, revision);
      return;
    }

    if (event === 'SIGNED_IN') {
      // Clear any previous user's state before subscribing
      clearAllPrivateInMemoryState();
      initializeSubscriptionsForSession(session, revision);
    }
  });

  return () => {
    active = false;
    sessionRevision += 1;
    subscription.unsubscribe();
    teardownAllUserSubscriptions();
  };
}, [supabase]);
```

**Rules:**
- On `SIGNED_OUT`: immediately remove all channels and purge private in-memory state. Do not wait for a "graceful" transition.
- On `SIGNED_IN` with a different `auth.uid()`: clear all state from the previous user before creating any new subscription. This prevents cross-account event contamination.
- The `sessionRevision` pattern (already used in `nexora-app.tsx`) must be used to prevent stale callbacks from acting on a session that has been superseded.

### 3.5 Session expiry

When the Supabase session expires (refresh token expired, server rejects the token, or `getSession()` returns null):

```typescript
async function handleSessionExpiry() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    teardownAllUserSubscriptions();
    clearAllPrivateInMemoryState();
    clearOfflineQueues(); // per 9.2 §4.3
    // Redirect to login with reason parameter
    navigate('/login?reason=session-expired');
  }
}
```

**Rules:**
- Session expiry must trigger the same teardown as sign-out.
- Expired sessions must not silently retry subscription reconnection. The retry logic must check session validity before each attempt.
- Per the existing codebase pattern in `nexora-app.tsx`, a failed profile fetch after session refresh must fail closed (sign out the user) rather than leaving a half-authenticated state.

### 3.6 User signs out

When the user explicitly signs out (clicking "Sign out"):

```typescript
const signOut = useCallback(async (destination = '/') => {
  // 1. Teardown subscriptions BEFORE sign-out
  teardownAllUserSubscriptions();
  clearAllPrivateInMemoryState();
  clearOfflineQueues();

  // 2. Clear auth state
  setAuthState({ loading: false, session: null });

  // 3. Call Supabase sign-out
  await getClient()?.auth.signOut();

  // 4. Navigate away
  navigate(destination);
}, [navigate]);
```

**Rules:**
- Subscription teardown must happen **before** `supabase.auth.signOut()` is called, not after. Once sign-out completes, the client's JWT is invalid, and any in-flight subscription reconnection attempt will fail with an auth error that should not trigger a retry.
- The `signOut` function must be idempotent — calling it twice must not cause errors.

### 3.7 Authorization is revoked

When a user's role or membership changes in a way that revokes access (e.g., staff removed from salon, role downgraded, account deactivated):

```typescript
// Server-side: RLS policies enforce authorization on every event delivery.
// Client-side: detect revocation signals and tear down immediately.

function handleAuthStateChange(event: string, session: Session | null) {
  // Profile re-validation (mirrors nexora-app.tsx pattern)
  const profile = await fetchProfile(session.user.id);
  if (!profile || !profile.is_active) {
    // Account deactivated — full teardown
    teardownAllUserSubscriptions();
    clearAllPrivateInMemoryState();
    await supabase.auth.signOut();
    return;
  }

  // Role change detection
  if (profile.platform_role !== previousRole) {
    teardownRoleSpecificSubscriptions(previousRole);
    initializeSubscriptionsForRole(profile.platform_role);
  }

  // Salon membership loss detection
  const currentSalonIds = await fetchAuthorizedSalonIds(session.user.id);
  const lostSalons = previousSalonIds.filter(id => !currentSalonIds.includes(id));
  for (const salonId of lostSalons) {
    teardownSalonSubscriptions(salonId);
    clearSalonScopedState(salonId);
  }
}
```

**Rules:**
- Authorization revocation must be detected proactively (via profile re-fetch on auth state change) and reactively (via server-side RLS rejection of subscription events).
- When RLS rejects a subscription event (Supabase returns a channel error), the client must treat it as a revocation signal, unsubscribe from that channel, and clear the associated state.
- Never silently retry a subscription that was rejected due to authorization failure.

### 3.8 Browser tab no longer requires the stream

When the tab enters a state where the stream is no longer needed (e.g., user switches to a non-subscription page, tab is backgrounded for extended periods on mobile):

```typescript
// Optional optimization: pause subscriptions when tab is hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause non-critical subscriptions (e.g., availability)
      pauseNonCriticalSubscriptions();
    } else {
      // Resume and refetch stale state
      resumeSubscriptions();
      refetchStaleState();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**Rules:**
- Critical subscriptions (active booking state, payment status) must remain active even when the tab is hidden, as users may switch tabs during payment confirmation.
- Non-critical subscriptions (availability slots, notification badge) may be paused on tab hide, but must be resumed and state refetched on tab restore.
- The `document.hidden` API must be used — do not rely on `blur`/`focus` events alone, which are unreliable.

## 4. Duplicate subscription prevention

### 4.1 The duplicate problem

Duplicate subscriptions occur when:
- A component re-renders and creates a new subscription without removing the old one.
- Navigation back to a page creates a second subscription while the first is still active.
- React Strict Mode double-invokes effects during development, masking cleanup bugs.
- Multiple components subscribe to the same channel independently.

### 4.2 Prevention strategy

**Rule 1: Effect cleanup must precede creation.**

Every subscription effect must return a cleanup function that removes the channel. React's effect lifecycle guarantees cleanup runs before the next effect invocation, preventing overlap.

```typescript
// ✅ CORRECT: cleanup always runs before next creation
useEffect(() => {
  const channel = createChannel();
  return () => removeChannel(channel);
}, [dependencyA, dependencyB]);

// ❌ WRONG: no cleanup — duplicate on every re-render
useEffect(() => {
  const channel = createChannel();
  // Missing: return () => removeChannel(channel);
}, []);
```

**Rule 2: Subscription identity keys must be precise.**

The effect dependency array must include every value that changes the subscription's scope. Missing dependencies cause stale subscriptions to persist; extra dependencies cause unnecessary teardown/recreation.

```typescript
// ✅ CORRECT: bookingId changes → old channel removed, new one created
useEffect(() => {
  const channel = createBookingChannel(bookingId);
  return () => removeChannel(channel);
}, [bookingId]);

// ❌ WRONG: empty deps — subscription persists even if bookingId changes
useEffect(() => {
  const channel = createBookingChannel(bookingId);
  return () => removeChannel(channel);
}, []); // bookingId missing!
```

**Rule 3: Use a subscription registry for deduplication.**

For application-level managers, maintain a central registry that prevents duplicate subscriptions to the same channel:

```typescript
class SubscriptionRegistry {
  private channels = new Map<string, { channel: RealtimeChannel; refCount: number }>();

  subscribe(channelKey: string, factory: () => RealtimeChannel): RealtimeChannel {
    const existing = this.channels.get(channelKey);
    if (existing) {
      existing.refCount += 1;
      return existing.channel;
    }
    const channel = factory();
    this.channels.set(channelKey, { channel, refCount: 1 });
    return channel;
  }

  unsubscribe(channelKey: string): void {
    const entry = this.channels.get(channelKey);
    if (!entry) return;
    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      supabase.removeChannel(entry.channel);
      this.channels.delete(channelKey);
    }
  }

  teardownAll(): void {
    for (const [key, entry] of this.channels) {
      supabase.removeChannel(entry.channel);
    }
    this.channels.clear();
  }

  get activeCount(): number {
    return this.channels.size;
  }
}
```

### 4.3 React Strict Mode safety

In React 18+ Strict Mode, effects are double-invoked in development (mount → unmount → mount). The cleanup function must handle this gracefully:

```typescript
useEffect(() => {
  let cancelled = false;
  const channel = supabase
    .channel(`nexora:v1:booking:${bookingId}`)
    .on('postgres_changes', { /* ... */ }, (payload) => {
      if (cancelled) return;
      handleUpdate(payload);
    })
    .subscribe();

  return () => {
    cancelled = true;
    // removeChannel is idempotent in Supabase JS v2 — safe to call even
    // if the channel was never fully subscribed
    supabase.removeChannel(channel);
  };
}, [bookingId]);
```

## 5. Channel reference storage and removal

### 5.1 Storage requirements

Every created channel reference must be stored in a location that is:
- **Accessible** to the cleanup function.
- **Scoped** to the owner's lifetime.
- **Never leaked** to a scope outside the owner.

```typescript
// ✅ CORRECT: channel ref stored in effect-local closure
useEffect(() => {
  const channel = supabase.channel(key).subscribe();
  return () => supabase.removeChannel(channel);
}, [key]);

// ❌ WRONG: channel ref stored in component state — persists across renders,
// may be stale when cleanup runs
const [channel, setChannel] = useState<RealtimeChannel | null>(null);
useEffect(() => {
  const ch = supabase.channel(key).subscribe();
  setChannel(ch); // stored in state — stale reference risk
}, [key]);

// ❌ WRONG: channel ref stored in module-level variable — shared across
// all component instances, destroyed only on last unmount
let globalChannel: RealtimeChannel | null = null;
function MyComponent() {
  useEffect(() => {
    globalChannel = supabase.channel(key).subscribe();
    return () => {
      if (globalChannel) supabase.removeChannel(globalChannel);
      globalChannel = null;
    };
  }, [key]);
}
```

### 5.2 Removal guarantees

- `supabase.removeChannel(channel)` must be called **exactly once** per created channel.
- Calling `removeChannel` on an already-removed channel is a no-op in Supabase JS v2, but implementations should not rely on this — use the `active` flag or `cancelled` flag to prevent double-removal logic.
- After removal, the channel reference must be discarded (set to `null` or let it fall out of scope). Retaining a removed channel reference risks accidental reuse.

## 6. Scope-efficient subscriptions

### 6.1 Avoid one subscription per list row

When displaying a list of entities (e.g., a list of bookings), do **not** create one subscription per row. Instead, use a single filtered subscription at the list level:

```typescript
// ✅ CORRECT: one subscription for the entire salon's bookings
useEffect(() => {
  const channel = supabase
    .channel(`nexora:v1:bookings:salon:${salonId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `salon_id=eq.${salonId}`,
      },
      (payload) => {
        updateBookingInList(payload);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [salonId]);

// ❌ WRONG: one subscription per booking row
function BookingRow({ booking }: { booking: Booking }) {
  useEffect(() => {
    const channel = supabase
      .channel(`nexora:v1:booking:${booking.id}`)
      .on('postgres_changes', { /* ... */ }, handleUpdate)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [booking.id]); // 50 bookings = 50 subscriptions!
}
```

### 6.2 Maximum concurrent subscription limits

The client must enforce the following concurrent subscription limits per application instance:

| Subscription Category | Maximum Concurrent | Notes |
|---|---|---|
| Active booking entity subscriptions | 1 | The currently viewed booking detail |
| Active payment entity subscriptions | 1 | The currently pending payment |
| Active proposal/verification subscriptions | 1 | The currently viewed proposal or verification |
| User notification channel | 1 | Scoped to `auth.uid()` |
| Salon availability channels | 3 | Currently viewed salon/service combinations |
| **Total** | **7** | Hard limit. Exceeding requires architecture review. |

**Rules:**
- If the limit is reached and a new subscription is requested, the oldest non-critical subscription must be evicted.
- The subscription registry must log a warning when the total approaches the limit (≥5 active channels).
- These limits apply per application instance (per tab/PWA), not per user account.

## 7. Token refresh and subscription recreation

### 7.1 Supabase auto-refresh behavior

The Supabase JS client (`autoRefreshToken: true`, as configured in `supabaseClient.ts`) automatically refreshes JWTs before expiry. The `onAuthStateChange` callback fires with `TOKEN_REFRESHED` when a new token is issued.

### 7.2 Subscription reconnection after refresh

Realtime channels authenticated with the old JWT may become invalid after a token refresh. The client must handle this as follows:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && session) {
    // Supabase Realtime channels auto-reconnect with the new token
    // in most cases. However, private channels may need explicit
    // re-subscription if the server rejected the old token.
    
    for (const [key, entry] of subscriptionRegistry.entries()) {
      if (entry.channel.state === 'CLOSED' || entry.channel.state === 'ERRORED') {
        // Recreate the channel with the current session
        supabase.removeChannel(entry.channel);
        const newChannel = recreateChannel(key, session);
        subscriptionRegistry.set(key, { channel: newChannel, refCount: entry.refCount });
      }
    }
  }
});
```

### 7.3 Safe recreation rules

- **Never create a new subscription before removing the old one.** This prevents duplicate connections during the brief overlap.
- **Preserve the subscription registry's reference counts.** When recreating a channel, do not reset `refCount` — the owning components still hold their logical references.
- **Re-validate authorization before recreation.** If the token was refreshed because of a role change, re-fetch the user's profile and authorized scope before recreating channels. A refreshed token may carry different claims.
- **Use the `sessionRevision` pattern.** Assign a new revision on each token refresh and pass it to recreated subscriptions. Any callback that fires with a stale revision must be discarded.

## 8. Post-authentication-failure subscription behavior

### 8.1 Stop retrying after invalid authentication

When a private subscription fails because authentication is invalid (expired token, revoked role, deactivated account, wrong tenant), the client must:

1. **Not retry** the subscription automatically.
2. **Log the failure** with the channel key and error code (without logging payload content).
3. **Remove the channel** from the registry.
4. **Clear derived state** for the affected scope.
5. **Signal the auth manager** to re-validate the session.

```typescript
function handleChannelError(channelKey: string, error: RealtimeChannelError) {
  // Supabase returns specific error codes for auth failures
  const isAuthError = 
    error.message?.includes('JWT') ||
    error.message?.includes('token') ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('forbidden') ||
    error.status === 401 ||
    error.status === 403;

  if (isAuthError) {
    console.warn(`[Realtime] Auth failure on channel ${channelKey}: ${error.message}`);
    subscriptionRegistry.unsubscribe(channelKey);
    clearStateForChannel(channelKey);
    // Trigger session re-validation — do NOT auto-retry
    triggerSessionRevalidation();
    return;
  }

  // For transient network errors, Supabase handles auto-reconnection.
  // Do not implement custom retry logic — it risks reconnection storms.
}
```

### 8.2 Reconnection storm prevention

- The client must not implement custom exponential backoff for subscription reconnection. Supabase Realtime has built-in reconnection with backoff.
- If a channel enters an error loop (≥3 errors within 30 seconds), it must be permanently removed and logged as a critical issue.
- Reconnection attempts must always check session validity first. Never reconnect with a known-expired or revoked session.

## 9. Post-destruction state update prevention

### 9.1 The stale callback problem

A realtime event may arrive after the owning component has unmounted but before the subscription is fully torn down (race condition). If the callback triggers a React state update on an unmounted component, it causes:
- React warnings ("Can't perform a React state update on an unmounted component").
- Potential memory leaks if the callback holds references to component state.
- Silent data corruption if the update targets a state object that has been reallocated.

### 9.2 Prevention pattern

Every subscription callback must check an `active` or `cancelled` flag before performing state updates:

```typescript
useEffect(() => {
  let cancelled = false;

  const channel = supabase
    .channel(`nexora:v1:booking:${bookingId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` }, 
      (payload) => {
        if (cancelled) return; // component is gone — discard this event
        
        // Safe to update state
        setBooking(prev => ({
          ...prev,
          status: payload.new.status,
          updated_at: payload.new.updated_at,
        }));
      }
    )
    .subscribe();

  return () => {
    cancelled = true; // set BEFORE removeChannel to close the race window
    supabase.removeChannel(channel);
  };
}, [bookingId]);
```

### 9.3 Additional safeguards

- **AbortController pattern:** For subscriptions that trigger async operations (e.g., refetch on event), pass an `AbortSignal` so that in-flight requests are cancelled on unmount.

```typescript
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  const channel = supabase
    .channel(`nexora:v1:booking:${bookingId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, 
      async (payload) => {
        if (cancelled) return;
        // Refetch full booking data — abort if component unmounts mid-fetch
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', payload.new.id)
          .abortSignal(controller.signal)
          .maybeSingle();
        if (cancelled || !data) return;
        setBooking(data);
      }
    )
    .subscribe();

  return () => {
    cancelled = true;
    controller.abort();
    supabase.removeChannel(channel);
  };
}, [bookingId]);
```

- **Error boundary integration:** If a subscription callback throws, the error must be caught and logged, not propagated to an unmounted component tree.

## 10. Cross-user contamination prevention

### 10.1 The shared-device scenario

On shared devices (family tablets, internet café PCs, demo kiosks), User A may sign out and User B may sign in on the same browser. If User A's subscriptions or in-memory state are not fully cleared, User B may see:
- Events addressed to User A (e.g., User A's booking confirmation).
- Stale state from User A's session (e.g., User A's notification badge count).
- Cached private data from User A's scope (e.g., User A's salon history).

### 10.2 Mandatory clearing on user change

Before any new subscription is created for a newly authenticated user, the following must be executed:

```typescript
async function handleUserChange(newSession: Session | null) {
  // Step 1: Teardown ALL existing subscriptions
  subscriptionRegistry.teardownAll();

  // Step 2: Clear ALL private in-memory state
  clearBookingState();
  clearNotificationState();
  clearPaymentState();
  clearProposalState();
  clearAvailabilityState();
  clearUserProfileState();

  // Step 3: Clear offline caches (per 9.2 §4.3)
  await clearIndexedDBStores();
  await clearCacheStorageEntries();
  await clearOfflineWriteQueue();

  // Step 4: Only NOW create subscriptions for the new user
  if (newSession) {
    initializeSubscriptionsForSession(newSession);
  }
}
```

### 10.3 Prevention rules

- **No subscription may be created until the previous user's state is fully cleared.** The clearing must be synchronous for in-memory state and awaited for IndexedDB/CacheStorage.
- **The `auth.uid()` must be verified** against the subscription's expected scope before any event is processed. If `payload.new.customer_id !== currentUser.id`, the event must be discarded and logged.
- **Channel names incorporating `user_id` or `salon_id`** (per 9.1 §4.1) provide a structural defense: a channel named `nexora:v1:notification:user:<userA_uuid>` cannot receive events for User B even if it were accidentally retained. However, channel names are not authorization — RLS enforcement remains the authority.
- **LocalStorage and SessionStorage** may contain user-scoped data. On sign-out, all Nexora-namespaced keys must be removed. On sign-in, any leftover keys from a previous user must be detected and cleared.

### 10.4 Private in-memory state clearing

"Private in-memory state" includes all React state, context values, ref contents, and module-level variables that hold user-specific data:

```typescript
function clearAllPrivateInMemoryState() {
  // React contexts — reset to initial values
  resetBookingContext();
  resetNotificationContext();
  resetPaymentContext();
  
  // Module-level caches
  bookingCache.clear();
  notificationCache.clear();
  
  // Refs holding user-specific data
  currentUserRef.current = null;
  activeSalonRef.current = null;
  
  // Query client caches (if using React Query or SWR)
  queryClient.clear(); // removes ALL cached queries
  
  // Custom event emitters
  realtimeEventEmitter.removeAllListeners();
}
```

## 11. Implementation acceptance checklist for 9.3

- [ ] Every subscription has a documented owner (component, page, session, or manager).
- [ ] All 8 teardown triggers (§3.1–§3.8) are implemented and tested.
- [ ] No duplicate subscriptions can exist for the same channel key — verified via the subscription registry or effect cleanup guarantees.
- [ ] Channel references are stored in effect-local closures or a scoped registry, never in component state or module-level globals shared across instances.
- [ ] List views use a single filtered subscription, not one per row.
- [ ] The concurrent subscription limit (§6.2) is enforced and logged.
- [ ] Token refresh triggers subscription re-validation without creating duplicates (§7).
- [ ] Auth-failed subscriptions are not retried and trigger session re-validation (§8).
- [ ] The `active`/`cancelled` flag pattern prevents all post-destruction state updates (§9).
- [ ] On user change, all subscriptions are torn down, all private state is cleared, and clearing completes before any new subscription is created (§10).
- [ ] Cross-user contamination is tested: sign in as User A → create subscriptions → sign out → sign in as User B → verify no User A events, state, or cached data are visible.
- [ ] React Strict Mode double-invocation does not create duplicate subscriptions.
- [ ] All teardown paths are exercised in automated tests (component unmount, route change, salon switch, sign-out, session expiry, auth revocation).

## 12. Change control for 9.3

Any modification to subscription ownership rules, teardown triggers, deduplication logic, token refresh behavior, or cross-user clearing requirements requires:
- Threat-model review (focus on cross-user contamination and authorization bypass)
- RLS and channel authorization review
- Automated negative tests proving no leaked subscriptions or stale state
- Regression tests for all 8 teardown triggers
- Update to this specification before release.

---

**Sub-point:** 9.4 — Connection State & Reconnection  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

A connection state is a **derived, verifiable property** of the realtime transport, the authenticated session, and the set of subscriptions the current view requires — never a guess from `navigator.onLine` alone. The UI must display an accurate connection state wherever it affects user decisions (booking, payment, availability, notifications), and the client must converge to `Live` only after every precondition has been verified.

Governing rules:

1. **Realtime is a change signal, not the single source of truth** (per 9.1 §1 and 9.2 §1). Every transition back to `Live` includes a refetch of the authoritative scopes the current view depends on. Missed events are the expected case, not the exception.
2. **Reconnection is bounded, jittered, and conditional**: exponential backoff with a hard cap and full jitter, suspended or slowed while the browser is offline or the tab is hidden, and stopped entirely on permanent authorization failure.
3. **`Live` is a claim that must be earned**: authenticated session + transport open + every view-required channel `SUBSCRIBED` + authoritative data validated. Until those hold, the UI must show a transitional or degraded state. Never show `Live` merely because an HTTP request succeeded or the socket is open.
4. **No retry loop may outlive its cause**: component unmount, route exit, sign-out, session expiry, and authorization revocation must cancel timers, sockets, and in-flight refetches (extending 9.3 §3 teardown triggers).

## 2. Canonical connection state machine

A single application-level **connection manager** (one singleton per tab, built around the Supabase client singleton from `lib/supabaseClient.ts`) owns all connection state. It is exposed to the UI through a `ConnectionStateProvider` (React context) and `useConnectionState()`. Components never compute their own state from `navigator.onLine`, socket callbacks, or channel status; they consume the manager's state only.

### 2.1 States

| State | UI label | Meaning | Default presentation |
|---|---|---|---|
| `idle` | *(no indicator)* | No session, or no active subscriptions exist; nothing to keep alive. Also the state after teardown. | No status element |
| `connecting` | "Connecting…" | Socket handshake and/or authentication in progress; no required channel confirmed yet. | Amber/gray, spinner |
| `live` | "Live" | Transport open, session valid, every view-required channel `SUBSCRIBED`, and authoritative data for visible scopes validated. | Green indicator |
| `reconnecting` | "Reconnecting…" | Transport lost; bounded backoff active; on-screen data may be stale. | Amber, pulsing |
| `syncing` | "Syncing…" | Transport re-established and channels resubscribed; refetch of authoritative scopes in progress; events are not yet trusted. | Blue/amber, spinner |
| `offline` | "Offline" | Browser reports no connectivity **and** the probe fails; retries suspended. | Gray |
| `stale` | "Data may be outdated" | Connected or not, but a required refetch failed or is incomplete; last-known-good sync timestamp is displayed. | Amber warning |
| `sync_failed` | "Synchronization failed" | Resync failed repeatedly despite connectivity; the bounded retry budget is exhausted; recovery action required. | Red |

`stale` and `sync_failed` are deliberately distinct: `stale` is informational and transient (data older than acceptable, likely to self-heal), while `sync_failed` is a terminal-for-now condition that exhausted the retry budget and requires user or application action (retry now, re-authenticate, or contact support). Both always display the last-known-good sync time.

### 2.2 Transition rules

The table is exhaustive; every arc below must be implemented. No other transitions are permitted.

| From | To | Trigger | Mandatory actions |
|---|---|---|---|
| `idle` | `connecting` | Manager start with a valid session and ≥ 1 required subscription | Open socket; register channels per 9.3 §4.2 |
| `connecting` | `live` | Socket `OPEN` + auth accepted + all required channels `SUBSCRIBED` + initial validation fetch OK | Record sync timestamp; start heartbeat monitor |
| `connecting` | `offline` | `navigator.onLine === false` or probe failure during handshake | Suspend attempts; preserve attempt counter |
| `connecting` | `reconnecting` | Socket closed/timed out (transient error, no auth markers) | Begin §4 backoff |
| `live` | `reconnecting` | Socket close, heartbeat timeout, or non-auth `CHANNEL_ERROR` on a required channel | Mark realtime-derived data suspect; begin §4 backoff |
| `live` | `stale` | An event-driven refetch of a required scope fails | Keep channels; show staleness with last-good timestamp |
| `live` | `sync_failed` | Event-driven refetch fails and the retry budget is exhausted | Show recovery action (§3, rule 4) |
| `reconnecting` | `syncing` | An attempt succeeds: socket `OPEN` + required channels `SUBSCRIBED` | Run full resync (§6.2) |
| `reconnecting` | `offline` | Browser goes offline during backoff | Suspend; preserve attempt counter |
| `syncing` | `live` | All required refetches succeed | Update sync timestamp; reset backoff attempt counter |
| `syncing` | `stale` | Partial refetch failure | Apply what succeeded; show last-good timestamp |
| `syncing` | `sync_failed` | All refetches fail; retry budget exhausted | Show recovery action (§3, rule 4) |
| `offline` | `syncing` | `online` event **and** probe success | Immediate resync (§6.2) |
| `offline` | `reconnecting` | `online` event but socket fails to open | Begin §4 backoff |
| any | `idle` | Sign-out, session expiry, portal change, teardown, or zero required subscriptions | Full teardown per §10 |

State machine invariants:

1. `live` is reachable **only** from `connecting` or `syncing` — never directly from a socket or channel callback.
2. Every transition out of `live` or `syncing` marks realtime-derived data as suspect. No realtime event received before the next `live` may be applied without a matching refetch (§6).
3. The manager keeps a monotonically increasing `epoch`. Every async callback (socket event, timer, fetch, BroadcastChannel message) is tagged with the epoch at scheduling time and discarded if the epoch has advanced. This is the same pattern as `sessionRevision` in `nexora-app.tsx`, applied manager-wide.
4. `offline` requires two independent signals (browser state **and** probe) — see §5.1. A socket failure alone is `reconnecting`, never `offline`.

### 2.3 View-required channel set

`live` requires the **view-required** channel set for the currently mounted screens — not merely "any channel":

| Screen | Required channels for `Live` |
|---|---|
| Booking detail | `nexora:v1:booking:<booking_uuid>` |
| Checkout / payment confirmation | `nexora:v1:payment:<payment_attempt_uuid>` |
| Proposal / verification status panel | `nexora:v1:proposal:<uuid>` or `nexora:v1:verification:<uuid>` |
| Authenticated dashboard with badge | `nexora:v1:notification:user:<user_uuid>` |
| Availability / booking flow | `nexora:v1:availability:salon:<salon_uuid>:service:<service_uuid>` |
| Static/public pages (catalog, marketing) | *None* — realtime is not required; the connection manager stays `idle`-family and the normal HTTP error states apply, not the connection machine |

Screens with no required channels must not show a `Live`/`Reconnecting` indicator at all; their freshness is governed by normal fetch error handling, not by this state machine.

## 3. UI presentation rules

1. The connection indicator must appear wherever a user decision depends on freshness: a global status pill in the authenticated portal header, an inline status on booking/payment/proposal screens, and the existing `offline-banner` pattern from `nexora-app.tsx` when `offline`.
2. **Never show `Live`** until §2.2 preconditions hold. In particular: an authenticated HTTP request succeeding is not evidence of realtime liveness; a socket that is `OPEN` but whose required channels are not yet `SUBSCRIBED` is `connecting`/`syncing`, not `Live`.
3. For `stale` and `sync_failed`, always show the last-known-good sync time (e.g., "Data may be outdated — last synced 14:32").
4. `sync_failed` must include a working recovery action, chosen by cause:
   - Session invalid → **"Sign in again"** (routes through the normal sign-in flow; never silently re-authenticates).
   - Session valid, server reachable → **"Retry now"** (manual resync that resets the budget; the user may also pull-to-refresh).
   - Authorization revoked → **"Access removed"** message with contact-support guidance; no retry affordance (§8).
5. `offline` must disable or clearly annotate network-dependent actions (consistent with the existing `online` prop usage in `nexora-app.tsx`) and surface queued-write state per 9.2 §4.
6. Accessibility: every state is conveyed by icon **and** text, never color alone; the global indicator uses `aria-live="polite"`; timestamps are localized.
7. Single source of UI state: components render from `useConnectionState()`; duplicating the machine in a component is a spec violation.

## 4. Bounded exponential backoff with jitter

### 4.1 Nexora default parameters

| Parameter | Value | Rationale |
|---|---|---|
| Base delay | 1 000 ms | Fast recovery for brief blips |
| Multiplier | ×2 | Exponential growth |
| Max delay (cap) | 30 000 ms | Hard bound — never exceeded |
| Jitter | Full jitter: `random(0, delay)` | Breaks thundering-herd synchronization across clients |
| Minimum wait | 250 ms | Avoids sub-100 ms spin loops |
| Budget reset | 30 s of continuous `live`, or one completed full resync (§6.2) | Attempt counter returns to 0 |
| Socket failure circuit | ≥ 5 transport failures within any 60 s window → hold at max delay until a 60 s healthy window | Prevents aggressive retry loops |
| Handshake timeout | 10 s to reach socket `OPEN`; additional 15 s to reach all required channels `SUBSCRIBED` | Prevents hanging `connecting` |
| Boot stagger | `random(0, 2000)` ms before the first connection attempt on app start | Fleet of tabs/PWAs opening together (e.g., after a deployment) must not hit the server simultaneously |

Backoff for attempt *n* (n ≥ 0), full jitter:

```ts
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const MIN_DELAY_MS = 250;

function delayMs(attempt: number): number {
  const cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  const jittered = Math.floor(Math.random() * cap); // uniform in [0, cap)
  return Math.max(MIN_DELAY_MS, jittered);
}
```

**Server-published hints take precedence.** If the server closes the socket with a backoff hint, or the transport responds `429` / `Retry-After`, the client must wait at least the indicated duration (capped at 60 s) before the next attempt and must not use jitter to go below the server's value.

### 4.2 Rules

1. All reconnect scheduling lives in the connection manager. Components never schedule their own retries; per-channel SDK auto-reconnect (e.g., the Supabase Realtime client's built-in retry) must be configured off or overridden with this policy so there is exactly one scheduler.
2. The scheduler is **paused** (timers cancelled, not merely deferred) when the machine is `offline`; the attempt counter is preserved, and on the `online` event the next attempt runs immediately (§5.1).
3. The scheduler is slowed or paused when the tab is hidden (§5.2).
4. No attempt may start unless all of: (a) session is valid, (b) browser online, (c) tab visible (or the portal is entitled to background liveness, §5.2). Attempts violating any precondition are skipped, not queued.
5. Every attempt is logged at `debug` (attempt number, computed delay, result) without payload content; transitions to `sync_failed` and all auth-aborts are logged at `warn`/`error`.
6. The circuit breaker (§4.1) applies to *transport* failures. The *resync* phase has its own budget: 2 consecutive full-resync failures → `sync_failed` (§6.2). The two budgets are independent.

## 5. Offline and hidden-tab behavior

### 5.1 Offline detection — never trust `navigator.onLine` alone

`navigator.onLine` only reflects the browser's view of the link layer: it can be `true` without internet access (captive portals, dead Wi-Fi) and `false` on some platforms despite connectivity. Therefore:

1. Listen to `window.online` / `window.offline` events **and** reconcile with the realtime socket state and an explicit probe.
2. Probe: a lightweight authenticated request to a health/API endpoint with a 5 s timeout. Cadence: every 30 s while offline; immediately on the `online` event; also after any socket failure while `navigator.onLine === true` (to distinguish `reconnecting` from `offline`).
3. The machine enters `offline` only when the browser reports offline **or** the probe fails, **and** the socket is down. A socket failure with a working probe is `reconnecting`, never `offline`.

```ts
window.addEventListener("online", () => manager.onTransportSignal("online"));
window.addEventListener("offline", () => manager.onTransportSignal("offline"));

// The probe distinguishes "link layer down" from "no real connectivity":
async function probe(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("/api/health", { signal: controller.signal, cache: "no-store" });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
```

### 5.2 Hidden tab (Page Visibility API)

While `document.visibilityState === 'hidden'`:

- **Suspend non-critical reconnect attempts entirely.** If the current portal requires background liveness (a booking/payment screen that must stay current while the user switches tabs), keep attempts at the max interval (30 s) only — never faster.
- Pause periodic probes and background refetch loops. (Service Worker background sync and cache refreshes may still run per 9.2; the connection manager does not poll while hidden.)
- Keep existing `live` channels subscribed; do not tear down on hide. The socket heartbeat continues at its normal rate.

On becoming `visible` (use `visibilitychange`, never `focus`/`blur`, per 9.3 §3.8):

1. Verify socket health immediately (state + heartbeat check). If the socket died while hidden — browsers and mobile OSes may freeze or kill background sockets — treat it as a fresh reconnect starting at attempt 0.
2. Run the full resync (§6.2): the tab may have missed events while hidden, and realtime does not replay them.
3. If the tab was hidden long enough for the access token to expire (Supabase access tokens are short-lived, ~1 h), session refresh runs first (§7); the resync never runs with a stale token.

The `visible → verify → resync` sequence is **mandatory, not an optimization**.

## 6. Realtime as a change signal: refetch and validation rules

### 6.1 What a realtime event may do

- Update a visible, schema-validated projection (badge count, status chip, list row) **only if** the machine is `live` and the event's entity version is a direct successor of the locally held version (`new.version === local.version + 1`, or a strictly newer `updated_at` per the entity policy in 9.1 §5.4).
- Trigger a scoped refetch of the canonical record through the normal authenticated API for: terminal transitions, version gaps (`new.version > local.version + 1`), out-of-order events, malformed payloads, and any event received while the machine was not `live`.
- A realtime event alone must never be treated as the evidence that a mutation succeeded (9.1 §5.6), nor may it mark a payment successful (9.1 §6).

### 6.2 Mandatory resync scope on every reconnection

On entering `syncing` (from `reconnecting` or `offline`), the manager refetches in parallel, with per-request timeouts:

1. Every entity with a mounted view: active booking, payment attempt, proposal/verification record, notification inbox/badge.
2. Every cache domain whose TTL is expired per 9.2 §5.2 (availability slots always; bookings older than 15 minutes; notifications older than 5 minutes).
3. The user's authorization profile (role, active salon memberships) — required by §7 before channels are trusted.

Outcomes:

- **All succeed** → `live`; reset the backoff counter; record the sync timestamp.
- **Some fail** → apply what succeeded; enter `stale` with the last-good timestamp; schedule exactly one bounded re-sync attempt (single retry after 15 s — not a loop).
- **All fail despite connectivity** → `sync_failed` once the budget (2 consecutive full resyncs) is exhausted; show the recovery action (§3, rule 4). Retry resumes only on an explicit user action or a state-changing trigger (online event, visibility change, fresh sign-in).

### 6.3 Never trust a resume

- The realtime server does **not** queue or replay missed changes. Any downtime — socket drop, hidden tab, offline period — means events were missed; only the refetch closes the gap.
- A channel reaching `SUBSCRIBED` after reconnect delivers **future** events only. "Subscribed again" is not "caught up"; caught-up means resync complete and machine `live`.
- While `reconnecting` or `offline`, realtime callbacks are dropped entirely — never partially applied. This prevents applying an event sequence with gaps.

## 7. Authentication, token refresh, and re-subscription

### 7.1 Ordering invariant

**Authenticate first, subscribe second.** No socket or channel is created for a private scope without a validated session, and no subscription is created or recreated while the session is known-expired (9.1 §5.1, 9.3 §3.5).

### 7.2 Token refresh (`TOKEN_REFRESHED`)

`lib/supabaseClient.ts` runs `autoRefreshToken: true`; Supabase's client propagates the refreshed access token to the realtime layer and reconnects the socket. The manager must **verify, not assume**:

1. On `TOKEN_REFRESHED`, do not preemptively recreate channels. Give the SDK's re-authentication up to 15 s to bring every required channel back to `SUBSCRIBED`.
2. If all required channels reach `SUBSCRIBED` → run the §6.2 resync (a refreshed token may carry different claims — e.g., after a role change), then `live`.
3. If any required channel closes with an auth/permission error instead → classify per §8: remove that channel, clear its derived state, re-validate the session via `getSession()`.
4. If the session is now absent (refresh token expired/invalid) → tear down all subscriptions, clear private in-memory state and offline queues (9.2 §4.3, 9.3 §3.5), and route to sign-in with `reason=session-expired`. Never attempt re-subscription without a session.
5. If the session is valid but the post-refresh profile fetch fails → fail closed per the existing `nexora-app.tsx` rule: sign out rather than operate half-authenticated.

### 7.3 Session expiry mid-connection

- When the realtime socket rejects an expired access token, the client must not reconnect with that token. Path: teardown → `getSession()` → refresh or sign-in → on a valid `SIGNED_IN`, start a fresh manager epoch and subscriptions.
- During this window the machine is `reconnecting` **only if** a valid session exists; otherwise it is `idle` with the sign-in screen — never a perpetual "Reconnecting…".

### 7.4 Re-establishment without losing state

- UI state that is not realtime-derived (user-entered form values, navigation, drafts) is untouched by reconnection; only realtime-derived projections and caches are revalidated.
- The channel registry from 9.3 §4.2 (ownership, refcounts) survives a *socket* reconnect: reconnecting the transport does not recreate channels or reset refcounts. Only channel failure/teardown does.
- If a channel must be recreated, follow 9.3 §7.3: remove the old channel first, preserve refcounts, re-validate authorization before creation, and tag new callbacks with the current epoch.

## 8. Permanent authorization failures: stop retrying

### 8.1 Classification

A channel or socket failure is **permanent** when any of the following holds:

- HTTP status `401`/`403` on the realtime handshake or an event rejection;
- close code `1008` (policy violation) or any server-documented auth/permission close code (4xxx reserved range);
- error messages matching `JWT`, `token expired`, `unauthorized`, `forbidden`, `permission denied`, `RLS`, or `policy`;
- the session is absent or the refresh token is invalid at attempt time;
- a profile/role re-fetch proves access was revoked (role downgrade, salon membership removed, account deactivated) — 9.3 §3.7.

Everything else — network loss, timeouts, 5xx, `CHANNEL_ERROR` without auth markers — is **transient** and eligible for §4 backoff.

### 8.2 Behavior on permanent failure (mandatory)

1. **Stop retrying that subscription.** Remove it from the registry (9.3 §8.1); never recreate it for the same scope and session.
2. **Clear all derived state** for the affected scope (9.3 §10.4).
3. **Re-validate the session.** Invalid → sign-out flow with reason. Valid → surface the scope-specific recovery action ("Access removed — contact support" or "Your salon membership may have changed — reload"). Never a silent retry, never `Live`.
4. If **all** required channels fail permanently, the machine enters `sync_failed` (or `idle` if the session is gone) and remains there until the user re-authenticates or the authorization scope demonstrably changes (a fresh `SIGNED_IN`).
5. **Log** the failure with channel key, close code/status, and scope — never payload content (9.1 §5.7).

### 8.3 Server-side revocation

When RLS/authorization revokes access while a channel is subscribed, the server closes that channel with an auth close code. The client treats this as a revocation signal per 9.3 §3.7: tear down the channel, clear its state, re-fetch the profile, and do not resubscribe until the profile demonstrates the scope is authorized again.

## 9. Multi-tab coordination (duplicate background activity)

Multiple tabs of the same origin must not multiply background work. Where practical, exactly one tab performs background maintenance.

### 9.1 Leader election

- Use the **Web Locks API**: `navigator.locks.request('nexora:conn:v1', ...)`. The tab holding the lock is the **leader**.
- **Leader-only responsibilities**: periodic background re-sync cadence, offline-write queue flushing (9.2 §4.2), heartbeat-driven health probing, and periodic session-validity checks.
- **Followers**: still run their own realtime socket — the visible tab needs live UI, and per-instance limits in 9.3 §6.2 apply per tab — but they run no background cadence and never flush the write queue.
- On leader loss (close, crash, tab kill) the lock is released and a remaining tab takes over. Takeover must be idempotent; the queue flush itself is guarded by a lock so no write is flushed twice.
- **Fallback** where Web Locks is unavailable: `BroadcastChannel('nexora:conn:v1')` heartbeat — the leader broadcasts every 5 s; followers elect a new leader after 20 s of silence.

### 9.2 State sharing

- The leader broadcasts its connection state and last-sync timestamp on `BroadcastChannel('nexora:conn:v1')`.
- Followers adopt the shared state for *global* indicators (shared offline/sync banner) while keeping per-tab state for their own live channels. For view-local indicators, the tab's own socket state wins; the shared state governs only global/background claims.
- A tab becoming visible must verify **its own** socket rather than trust the leader's state — the leader's liveness does not prove this tab's socket is open (§5.2).

### 9.3 Limits

- One socket per tab (the `getClient()` singleton in `lib/supabaseClient.ts`); never a socket per component.
- The 7-channel limit of 9.3 §6.2 applies per tab.
- If two tabs display the same entity, each may subscribe (per-instance limits allow it), but background *refetch* of that entity is leader-only unless a tab is visible and actively displaying it.

## 10. Cleanup, teardown, and cross-account protection

This section extends 9.3 §3 (teardown triggers) and §10 (cross-user contamination) to the connection manager.

1. **Teardown cancels everything.** On sign-out, session expiry, portal change, or application teardown, the manager must, in order: increment `epoch` (invalidating all in-flight callbacks); cancel all backoff timers and probes; remove all channels (`supabase.removeChannel` per registry entry, or `removeAllChannels`); close the realtime socket; close the `BroadcastChannel`; release the Web Lock; remove `online`/`offline`/`visibilitychange`/`pagehide` listeners.
2. **Order on sign-out**: (a) increment epoch + cancel timers; (b) remove channels and clear realtime-derived state (9.3 §3.6); (c) clear offline queues and caches (9.2 §4.3); (d) call `auth.signOut()`; (e) set the machine to `idle`. No reconnection may run after (a).
3. **Cross-account**: on `SIGNED_IN`, the machine starts from `idle`/`connecting` with a fresh epoch. It is forbidden to inherit `live`, sync timestamps, backoff state, or any channel from a previous user. The UI must never show a previous user's "last synced" time.
4. **Component-level**: components that only consume connection state may unmount freely; components that own subscriptions follow 9.3 §3.1 (cleanup + `removeChannel`). The manager itself has exactly one owner: the authenticated-session boundary (9.3 §2.1).
5. **Memory-leak guardrails**: every timer and listener is referenced and cleared in teardown; automated tests assert zero timers and zero listeners remain after teardown (checklist §13).

## 11. Server-side rules and requirements

1. **Connection admission**: the realtime server must reject socket upgrades carrying an expired or invalid JWT with a documented auth close code (e.g., `1008` or a reserved 4xxx code), so clients can classify permanent failures (§8). It must not silently accept and later drop.
2. **Backoff hints**: under connect pressure, the server may close with a backoff hint (seconds to wait). Clients must honor it (capped at 60 s, §4.1).
3. **Rate limiting**: enforce per-user (e.g., 20 connects/min/user) and per-IP (60/min) connection attempt limits. Excess attempts receive the backoff hint; persistent offenders are logged and flagged — never permanently blocked, because legitimate clients do retry.
4. **Heartbeats**: keep the server heartbeat/keep-alive configuration aligned with the client timeouts in §4.1; terminate silent connections so dead sockets do not consume quota.
5. **Per-user connection quota** consistent with 9.3 §6.2 (1 socket, ≤ 7 channels per tab) and a documented maximum sockets per user. Exceeding it must produce a clear error, never silent eviction of unrelated channels.
6. **No replay**: the server does not queue or replay missed events; the §6.2 refetch is the only recovery contract. Any future replay feature would amend this specification through change control (§14).
7. **Monitoring/alerting**: track connection churn (disconnects/min), reconnect storms (spikes in connect attempts from a cohort of clients — the signature of missing jitter or a bad deployment), auth-rejection rate (JWT expiry vs. revocation), and p95 time from connect to `SUBSCRIBED`. Alert on: churn > 5× baseline for 5 minutes; auth-rejection spikes; any client persistently exceeding the rate limit (possible retry-loop bug).
8. **Deployments**: realtime server restarts must use the backoff-hint close path where supported, so clients back off instead of stampeding; client-side jitter (§4) is the second line of defense.

## 12. Client-side monitoring, logging, and SLOs

- **Log at `debug`**: attempt scheduling (attempt number, computed delay, result), socket state transitions, per-scope refetch outcomes (scope IDs only).
- **Log at `warn`**: heartbeat timeouts, entries into `stale`, resync budget exhaustion, auth-close events.
- **Log at `error`**: entry into `sync_failed` (with the recovery action shown), teardown leaks (timers/listeners still active after teardown).
- **Never log**: tokens, channel payload content, payment data, or user PII beyond scope IDs.
- **Client SLOs**:
  - p95 time from `reconnecting` → `live` ≤ 45 s given connectivity and a valid session.
  - `offline → syncing` starts ≤ 1 s after the `online` event.
  - False `Live` (machine `live` while a required channel is not `SUBSCRIBED`, or auth unconfirmed) = 0 occurrences.

## 13. Implementation acceptance checklist for 9.4

- [ ] A single connection manager + `ConnectionStateProvider` exists; no component computes connection state from `navigator.onLine`, socket callbacks, or channel status directly.
- [ ] The state machine implements every transition in §2.2; `live` is reachable only via `connecting`/`syncing` and only with auth + required channels + data validation confirmed.
- [ ] Backoff uses bounded exponential growth with full jitter and the §4.1 parameters; server backoff hints (`Retry-After`, close-code hints) are honored and never shrunk below the server value.
- [ ] No retry loop can exceed the §4.1 cadence; the ≥5-failures/60 s circuit holds at max delay; the attempt counter resets only after 30 s of `live` or a completed full resync.
- [ ] `offline` is derived from browser state + probe + socket state, never a single signal; probe cadence per §5.1.
- [ ] Hidden tabs suspend/slow retries per §5.2 and always run the verify + resync sequence on becoming visible.
- [ ] Every reconnection runs the §6.2 resync; `SUBSCRIBED` alone never sets `Live`; no realtime event is applied while not `live` or without version validation (§6.1).
- [ ] `TOKEN_REFRESHED` is verified per §7.2: required channels back to `SUBSCRIBED` within 15 s or classified; expired session leads to teardown + sign-in with reason, never silent retry.
- [ ] Permanent auth failures stop retries, clear derived state, and show the correct recovery action; no automatic retry on 401/403/1008/RLS errors (§8).
- [ ] Multi-tab: Web Locks (or BroadcastChannel fallback) leader election; background cadence and queue flush are leader-only; takeover is idempotent; followers verify their own socket on visibility (§9).
- [ ] Teardown (§10) increments epoch, cancels timers, closes socket/channels, closes the BroadcastChannel, releases the Web Lock, and removes all listeners; automated tests assert zero timers/listeners remain.
- [ ] Cross-account test: sign out → sign in as another user; connection state, sync timestamps, channels, and backoff state are fresh; no `Live` or "last synced" value from the previous user appears.
- [ ] UI: indicators on all decision-relevant surfaces with icon + text + `aria-live`; `stale` shows last-synced time; `sync_failed` shows a working recovery action; no indicator on screens with no required channels.
- [ ] Network fault-injection tests: socket drop without an offline event, `navigator.onLine` toggle, tab hide/suspend, session expiry mid-connection, role revocation mid-connection, server backoff hint, mass-disconnect reconnect storm (asserting bounded server connect rate). Each produces the specified state and recovers or degrades as specified.

## 14. Change control for 9.4

Any modification to the state machine, UI states, backoff parameters, resync scope, auth-failure classification, multi-tab coordination, or server-side admission/limit behavior requires:
- Threat-model review (focus: cross-account leakage, retry loops, thundering herd)
- Load/soak test proving a bounded server connect rate under mass disconnect and under a realtime server restart
- Network fault-injection test suite update covering all §13 scenarios
- Accessibility review of any new status presentation
- Update to this specification before release.

---

**Sub-point:** 9.5 — Event Ordering, Deduplication & Consistency  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Realtime delivery may be delayed, duplicated, missed, or received out of order. The client therefore cannot trust arrival order, receipt time, or the fact of receipt — it must trust only the **ordering primitives the server attaches to each event** and must converge to server truth through reconciliation whenever local state is uncertain.

Governing rules:

1. **Every event must include or reference a stable entity ID**, and events must carry a **server-generated version (or sequence/revision) plus a server-clock timestamp** wherever ordering matters. The per-entity version chain is the only authority for "newer".
2. **Clients must deduplicate events by event ID or entity version**, and **older events must never overwrite newer server state** — in views, in memory, or in caches.
3. **Client device time must never decide the authoritative order of financial or workflow transitions.** Device time is used for display and cache TTL only.
4. **Realtime events must trigger reconciliation when local state is uncertain** (gaps, out-of-order arrivals, malformed payloads, events received while not `Live`, processing failures); **if event processing fails, the client must refetch the affected record**.
5. **Full collections must not be duplicated when one record can be safely patched**: collection views merge row-by-row from events; whole-collection refetches occur only on defined reconciliation triggers.
6. **Payment, balance, commission, entitlement, and payout values must always come from authoritative server records.** Notifications and badge counts must be reconcilable with the server. **Deleted or revoked records must be removed from local state after authorization-aware reconciliation.**

## 2. Event envelope and ordering primitives

### 2.1 Application-level envelope

Every realtime event carries the following fields (as row columns on the subscribed table, or as a server-generated JSON envelope where the transport supports it):

| Field | Type | Requirement |
|---|---|---|
| `entity_type` | string | Stable type name: `booking`, `payment_attempt`, `wallet`, `commission`, `payout`, `notification`, `proposal`, `verification`, `availability_slot` |
| `entity_id` | uuid | Stable canonical ID per 9.1 §4.1. Never a display string, email, or user-controlled value. |
| `event_id` | string | **Deterministic**: `hex(SHA-256(entity_type + ":" + entity_id + ":" + version))`. Identifies the exact state transition, so a redelivery of the same change carries the same ID. The client recomputes it and treats a mismatch as a malformed payload (§4.1). |
| `version` | integer ≥ 1 | Server-assigned, strictly increasing per entity. The **ordering authority**. |
| `updated_at` | timestamptz | Server clock at commit. Secondary tie-break and display value only (§2.3). |
| `operation` | `insert` \| `update` \| `delete` | The committed change, mirrored from the transport event type. |
| `schema_version` | integer | Payload schema version. On mismatch the payload is not parsed; the record is refetched (§4.1). |
| `payload` | object | Minimal authorized projection per 9.1 §2 and §5.4. Financial values are server-computed absolutes, never deltas (§5.1). |

### 2.2 Transport-level fields (Supabase Realtime contract)

`postgres_changes` delivers (`realtime-js` v2 payload shape):

- `payload.eventType` — `INSERT` \| `UPDATE` \| `DELETE`.
- `payload.new` / `payload.old` — **INSERT: row in `new`, `old` empty. UPDATE: new state in `new`, previous state in `old`. DELETE: deleted row in `old`, `new` empty.** All row fields above (§2.1) are read from the same projections.
- `payload.commit_timestamp` — server commit time; usable as a secondary cross-entity hint only (§2.3).
- `payload.errors: string[]` — non-empty when RLS suppressed the row ("new row violates row-level security policy"). The event then carries **no row data** and must be handled as a revocation signal per §9.3, never parsed as a normal event.

### 2.3 Ordering authority

| Signal | Role |
|---|---|
| Entity `version` (server-assigned) | **Only** authority for per-entity ordering |
| `updated_at` / `commit_timestamp` (server clock) | Secondary tie-break and cross-entity hint; never a substitute for version |
| Client device time | **Never** ordering. Display of timestamps and cache TTL evaluation (9.2 §5.2) only. |
| Arrival order / socket order | Never — transports may reorder |

Rule: when two events conflict, the one with the **higher server version** wins regardless of arrival order, local receipt time, or any client-side clock. A device clock set years into the past or future must not change a single applied transition; this is enforced by construction because no ordering decision ever reads `Date.now()`.

### 2.4 Where ordering matters

| Domain | Ordering requirement |
|---|---|
| Payments, wallets, commissions, payouts, entitlements | Strict version chain; values always from server records (§5.1) |
| Booking lifecycle transitions | Strict version chain; terminal transitions require refetch confirmation (9.4 §6.1) |
| Proposals / verification status | Strict version chain |
| Notifications / badge counts | Version-checked, reconcilable, advisory (§8) |
| Availability slots | Version-checked freshness hints (9.1 §2) |

### 2.5 Server-side version assignment

- Every ordering-relevant table has `version bigint NOT NULL DEFAULT 1` and `updated_at timestamptz NOT NULL DEFAULT now()`.
- A `BEFORE INSERT OR UPDATE` trigger bumps the version **in the same transaction as the write**, so a row's content can never change without its version increasing atomically:

```sql
CREATE OR REPLACE FUNCTION nexora_bump_version() RETURNS trigger AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER nexora_bump_version_trigger
--   BEFORE INSERT OR UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION nexora_bump_version();
```

- `now()` is the transaction timestamp: multiple writes in one transaction share it, so `version` — not the timestamp — remains the ordering authority.
- DELETE events carry the deleted row's final version (via `payload.old`). Version numbers are never reused after deletion (§9.1).

## 3. Deduplication

### 3.1 Dedup keys

Two independent keys, both checked at ingest:

1. **Event ID** — deterministic per `(entity_type, entity_id, version)`; collapses redeliveries of the same change.
2. **Entity version** — collapses same-version duplicates even when the event ID is unavailable or legacy.

### 3.2 Seen-set and watermarks

- The ingest layer keeps a bounded **seen-set** of processed event IDs: LRU with capacity 10 000 entries **or** 15-minute TTL, whichever evicts first. In-memory per tab; discarded on teardown (9.4 §10).
- A **per-entity watermark** (last applied version) is persisted with the cached row (9.2 §2.1). Watermarks survive restarts, make post-reconnect gap detection possible (§6.3), and are purged with the cache on sign-out.

### 3.3 Single ingest pipeline

- All events for a channel flow through exactly one ingest function owned by the connection manager (9.4 §2). Components receive already-deduplicated, version-checked, validated projections. Component-level dedup sets are a spec violation.
- Duplicates are dropped at ingest and logged at `debug` with the event ID only.

## 4. Stale-event protection and out-of-order handling

### 4.1 Apply decision table

For an incoming event with version `v` against local watermark `w` for the same entity:

| Condition | Decision |
|---|---|
| `v ≤ w` | **Drop** — stale or duplicate. Older events must never overwrite newer server state. Log `debug`. |
| `v = w + 1` | **Apply** (patch, insert, or delete per §7/§9); advance watermark to `v`. |
| `v > w + 1` | **Gap** — buffer for the out-of-order window (§4.2); if the gap is not filled, refetch the canonical record (§6.2), apply, advance watermark. |
| `event_id` mismatch after recomputation | **Malformed** — do not parse; refetch entity; log `warn`. |
| `schema_version` mismatch | **Malformed** — do not parse payload; refetch entity; log `warn`. |
| `payload.errors` non-empty (RLS suppression) | **Revocation** — §9.3; never parse as an event. |

### 4.2 Out-of-order buffer

- Per entity, hold events with `v > w + 1` for at most **2 seconds** or **8 buffered events per entity**, whichever comes first. When the missing versions arrive, flush the buffer in version order. When the window expires with gaps, refetch (§6.2).
- Buffer contents never advance watermarks, never reach views, and are discarded on sign-out/teardown (9.4 §10).
- Rationale: transport reorderings are typically short; the buffer absorbs them without a refetch, while the bounds prevent memory growth and unbounded staleness.

### 4.3 Write-newer-only invariant (all caches)

- Every cache write — from events, refetches, or offline-write reconciliation (9.2 §4.2) — is guarded by the same comparison: write only if `incoming.version > cached.version` or no cached row exists. Equal version → no-op; lower → skip and log `debug`.
- Cached rows store `version` beside `updated_at` in every object store (9.2 §2.1). Read paths surface `version` to the UI layer so staleness decisions (9.4 §3) have a concrete basis.
- This invariant holds for **every** code path that touches a cache; it is not optional per-path.

### 4.4 Client time rules

- Client device time is used for: timestamp display, cache TTL evaluation (9.2 §5.2), and out-of-order buffer expiry. It is **never** compared with a server `updated_at` to decide which of two states is newer.
- A code review check: any ordering branch reading `Date.now()` or `new Date()` is a 9.5 violation unless it is display/TTL/buffer-expiry logic.

## 5. Financial and workflow transitions

### 5.1 Authoritative values only

**Payment, balance, commission, entitlement, and payout values must always come from authoritative server records.** Rules:

1. The displayed value is read from the canonical authenticated record (query/RPC). It is never accumulated, computed, or derived client-side.
2. A realtime event may signal that a value changed and may carry a server-computed **absolute** value for provisional display, but that value must be confirmed by refetch before it is treated as settled (9.1 §6, 9.4 §6.1).
3. Client-side arithmetic on money or entitlements (`balance += delta`) is **forbidden**. Deltas in payloads, if any, exist for UX animation only and must never be summed into authoritative state.

```ts
// ✅ Event invalidates; the value always comes from the canonical record
ingest.on("wallet:update", () => invalidateQuery("wallet"));

// ❌ Forbidden: accumulating client-side deltas
// balance = balance + ev.payload.delta; // never
```

### 5.2 Ordering of workflow transitions

- Workflow transitions (booking status, payment states, proposal/verification) follow the entity's version chain; the state shown is always the state at the highest applied version.
- Cross-entity workflows (payment attempt → booking confirmation) are **serialized server-side**: the downstream write commits after the upstream one. Clients converge by refetching the downstream entity on the upstream terminal event (9.1 §2) — never by assuming a global event order.
- A transition displayed from a realtime event before version-confirmed refetch is **provisional** and must be labeled as such (e.g., "pending confirmation").

### 5.3 Idempotent mutations

- Mutation endpoints accept a client-generated `Idempotency-Key` (a UUID per logical operation, stable across retries). The server replays return the original result, so duplicate business effects are impossible even when the client retries after a timeout.
- The realtime event for the resulting change is a confirmation signal (9.1 §5.6) — never the only evidence of success. The mutation's own response remains authoritative for the initiating client.

## 6. Reconciliation

### 6.1 Triggers — realtime events trigger reconciliation when local state is uncertain

| Trigger | Detection | Action |
|---|---|---|
| Version gap | `v > w + 1` at ingest | Buffer (§4.2), then refetch entity (§6.2) |
| Stale / out-of-order older event | `v ≤ w` | Drop; log `debug`; no state change |
| Malformed payload (`event_id` or `schema_version` mismatch) | validation at ingest | Refetch entity; log `warn` |
| Event received while not `Live` | connection state (9.4 §2) | Add scope to resync (9.4 §6.2); never apply |
| Processing failure | handler throw / cache write error | Refetch affected record (§10) |
| RLS suppression or auth close | `payload.errors` non-empty / close code (9.4 §8.1) | Revocation handling (§9.3) |
| Reconnect, visibility resume, token refresh | 9.4 §5–§7 | Full resync per 9.4 §6.2 |
| Cache TTL expiry | 9.2 §5.2 | Refetch on read |
| Offline-write conflict | 9.2 §4.2 | Server result wins; invalidate affected caches |
| Unknown entity in a collection event | list merge (§7.1) | Insert on INSERT; otherwise refetch the collection |

### 6.2 Reconciliation procedure

1. Identify the smallest affected scope: one entity, or the collection containing it.
2. Refetch through the normal authenticated API with a per-request timeout, tagged with the current epoch (9.4 §2.2), aborted on teardown.
3. Apply the fetched records under the write-newer-only invariant (§4.3); advance the watermark to the fetched version.
4. If the refetch fails, never fabricate state: mark the scope `stale` (9.4 §3) and retry within the bounded resync budget of 9.4 §6.2; on exhaustion the machine enters `sync_failed` with its recovery action.
5. Log reconciliation outcomes at `debug` (scope IDs only).

### 6.3 Watermarks across restarts

- The watermark is the persisted per-entity last applied version (cache row, 9.2 §2.1). After restart, reconnect, or cache restore, the first event with `v > w + 1` triggers refetch. A cached row without a watermark is treated as version 0 (refetch on first event).
- On sign-out, watermarks are purged with the cache (9.2 §4.3). A new user starts at version 0: no ordering state from a previous account may influence the next session (9.3 §10, 9.4 §10).

## 7. Collections: patch, don't duplicate

### 7.1 Row-level merge rules

A collection view is a keyed map (`entity_id` → `{ version, updated_at, data }`). Events merge row-by-row; the list itself is never rebuilt from scratch for one event:

| Operation | Local row exists? | Action |
|---|---|---|
| INSERT | no | Insert row; advance watermark |
| INSERT | yes (same ID) | Version-compared update — higher version wins; equal → dedupe |
| UPDATE | yes | Higher version wins (§4.1); lower/equal dropped |
| UPDATE | no | Client missed the insert → refetch the collection (§6.1) |
| DELETE | yes | Remove row; advance watermark; confirm per §9.1 |
| DELETE | no | Ignore (already removed); log `debug` |

```ts
function mergeRow(list: Map<string, RowState>, ev: Envelope): "applied" | "stale" {
  if (ev.operation === "delete") { list.delete(ev.entity_id); return "applied"; }
  const cur = list.get(ev.entity_id);
  if (!cur) { list.set(ev.entity_id, { version: ev.version, data: ev.payload }); return "applied"; }
  if (ev.version <= cur.version) return "stale"; // older must not overwrite newer
  list.set(ev.entity_id, { version: ev.version, data: ev.payload });
  return "applied";
}
```

### 7.2 Rules

1. **Full collections must not be duplicated when one record can be safely patched**: a single INSERT/UPDATE/DELETE event updates exactly one row; the collection is never re-fetched as a whole in response to a patchable event, and no second copy of the collection is kept per component — one canonical collection store per scope, shared via the subscription registry (9.3 §4.2).
2. Lists use one filtered subscription (9.3 §6.1); row identity is the stable `entity_id`, never an array index or a client-generated key.
3. When the collection's ordering key changes (e.g., sort by `updated_at`), reposition the single row; do not re-fetch to re-sort.
4. Whole-collection refetch is permitted only on the §6.1 triggers (gap, missed insert, resync, TTL, authorization change) and is **debounced**: at most one refetch per collection per 10 seconds, to avoid refetch storms after mass events (9.4 §11.7).

### 7.3 When a full refetch is required

Version gap the buffer cannot fill; UPDATE for an unknown row (missed insert); post-reconnect resync (9.4 §6.2); TTL expiry; authorization scope change; or an event burst exceeding the buffer bounds. These follow the §6.2 procedure with identical failure semantics.

## 8. Notifications and badge counts

### 8.1 Advisory vs authoritative

- Notification events are advisory UI signals and are version-checked like any other event. The badge is **never** the sum of client-observed events.
- The authoritative unread state is the server's notification rows for `recipient_user_id = auth.uid()` (9.1 §2).

### 8.2 Badge reconciliation

- Reconcile the badge on every trigger in §6.1, on reconnect/resync (9.4 §6.2), on tab visibility resume (9.4 §5.2), and on notification TTL expiry (5 minutes, 9.2 §5.2).
- Reconciliation = server count query applied to the badge store; drift between advisory events and the server count is corrected at each reconciliation — never by replaying missed events:

```ts
async function reconcileBadge(): Promise<void> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_user_id", uid)
    .eq("read", false);
  if (!error && count !== null) badgeStore.set(count); // server-authoritative
}
```

- Marking a notification read is an idempotent RPC; the resulting version-bumped event confirms the local change. On a version gap, refetch the inbox.

## 9. Deletes and revocations

### 9.1 Hard deletes

- A DELETE event with `v > w` removes the record from views, caches, and derived state immediately (the delete event is server-authoritative; Supabase delivers the deleted row in `payload.old`, per §2.2), and advances the watermark.
- Removal is followed by **authorization-aware reconciliation**: a confirming refetch of the record must return nothing (or 404). If the refetch returns the record — the delete was reversed, or it was actually a soft-delete — re-apply the authoritative fetched state.
- This "delete → confirm" pair is the required meaning of *removed from local state after authorization-aware reconciliation*: the client removes data only when the server confirms the record is gone **or** confirms the client is no longer authorized to see it (§9.3).

### 9.2 Soft deletes and terminal states

- Status transitions to terminal values (cancelled, declined, completed, no-show, revoked, refunded) are UPDATE events, not DELETEs. Records stay in views that require history — with the terminal status — and the version chain governs the transition.
- Terminal transitions always trigger the entity refetch (9.4 §6.1) before the UI may treat the state as settled.

### 9.3 Authorization revocation

When RLS suppresses a change (`payload.errors` non-empty, no row data) or the channel closes with an auth code (9.4 §8.1):

1. Remove the affected record(s) from local state and caches **immediately, regardless of versions** — the client may no longer be authorized to hold them (9.3 §3.7, 9.3 §10.4).
2. Re-fetch the profile/authorization scope; do not resubscribe without proof of access (9.4 §8.2).
3. **Never resurrect removed data on reconnection**: a revoked record returns to local state only after a successful authenticated refetch under the current session. A version chain from before the revocation is not proof of access.

Sign-out and user change additionally purge all caches, queues, and watermarks (9.2 §4.3, 9.3 §10, 9.4 §10).

## 10. Failure handling

1. **If event processing fails** — handler throws, schema validation fails, cache write fails, or a derived-state update throws — **the client must refetch the affected record** (§6.2). The failure is logged at `error` with the entity scope. The event itself is not replayed: replaying risks double-apply; the refetch converges to truth.
2. Consecutive processing failures for the same entity (≥ 3) escalate: mark the scope `stale` (9.4 §3) and raise the connection manager's attention; the bounded resync budget of 9.4 §6.2 applies thereafter.
3. Delivery failures (events that never arrived) are detected via version gaps on the next event, or by the mandatory resync on reconnect/visibility (9.4 §5–§6). There is no delivery-receipt protocol; watermark + refetch is the contract.
4. Handlers must never throw into the transport: the ingest catches, logs, and continues; the affected scope is refetched.
5. All failure logs contain scope IDs only — never payload content, tokens, or PII (9.1 §5.7, 9.4 §12).

## 11. Server-side requirements

1. **Atomic versions**: version assignment is a trigger in the same transaction as the write; no code path may change row content without bumping `version`.
2. **Delete payloads**: DELETE events carry the deleted row's final version (via `payload.old`); version numbers are never reused for a recreated row — a recreated row's version must exceed the previous watermark.
3. **Envelope completeness**: every published event includes `entity_type`, `entity_id`, `event_id`, `version`, `updated_at`, `operation`, and `schema_version` per §2.1; event IDs are deterministic per `(entity_type, entity_id, version)`.
4. **RLS suppression is explicit**: suppressed changes arrive with a non-empty `errors` marker rather than vanishing silently, so clients can run the §9.3 revocation handling.
5. **Cross-entity serialization**: workflows spanning entities are committed server-side in dependency order (upstream write commits before the downstream write); clients converge by refetch, not by assumed global order. If a global sequence is ever exposed, it is a hint only.
6. **Idempotency support**: mutation endpoints accept and honor `Idempotency-Key` (§5.3).
7. **No replay beyond transport redelivery**: missed events are covered by watermark + refetch (9.4 §11.6).
8. **Monitoring**: track version-gap frequency, per-scope refetch rates, dedup hit rate, and out-of-order buffer overflow. Spikes indicate missed events or misconfigured publication and alert per 9.4 §11.7.

## 12. Implementation acceptance checklist for 9.5

- [ ] Every subscribed table carries `version` + server `updated_at` with the atomic bump trigger; DELETE events include the deleted row's final version.
- [ ] All events carry `entity_type`, `entity_id`, `event_id`, `version`, `updated_at`, `operation`, `schema_version`; the client verifies `event_id` derivation and treats mismatches as malformed.
- [ ] One ingest pipeline deduplicates by event ID and entity version (bounded LRU/TTL seen-set); no component-level dedup sets exist.
- [ ] The §4.1 decision table is implemented: stale dropped, `+1` applied, gaps buffered ≤ 2 s then refetched; the write-newer-only invariant (§4.3) holds for every cache write path.
- [ ] Clock-skew test: set the device clock ±24 h; the applied state and event order are unchanged. No ordering branch reads client time.
- [ ] Payment/balance/commission/entitlement/payout values are displayed only from authoritative server records; no client-side money arithmetic exists in the codebase (enforced by review/lint).
- [ ] Mutation endpoints accept idempotency keys; duplicate retries produce no duplicate effects (verified by replay test).
- [ ] All §6.1 reconciliation triggers are implemented with the §6.2 procedure; refetch failures degrade to `stale`/`sync_failed` per 9.4.
- [ ] Collections merge row-by-row per §7.1; no whole-collection refetch on patchable events; collection refetches debounced (≤ 1 per 10 s per collection).
- [ ] Badge counts reconcile with the server on all §8.2 triggers; no unbounded client-side badge accumulation.
- [ ] DELETE handling: remove + confirming refetch (§9.1); soft-deletes handled as terminal UPDATEs (§9.2); revoked records removed immediately and never resurrected without an authenticated refetch (§9.3).
- [ ] Event processing failure always triggers a refetch of the affected record; ≥ 3 consecutive failures escalate to `stale` (§10).
- [ ] Watermarks persist with cache rows, are purged on sign-out, and a new user starts at version 0 (§6.3).
- [ ] Fault-injection suite passes: duplicate delivery, reordering, version gap, stale event, clock skew, missed insert, delete-then-refetch conflict, RLS suppression, processing throw, reconnect resync. Each scenario converges to server truth without stale overwrites.

## 13. Change control for 9.5

Any modification to the envelope schema, version semantics, deduplication policy, apply rules, out-of-order buffer, reconciliation triggers, badge reconciliation, delete/revocation handling, or idempotency requirements requires:
- Threat-model review (focus: stale-state overwrite, financial ordering, cross-account resurrection)
- Trigger/sequence review proving version atomicity
- Fault-injection regression suite update covering all §12 scenarios
- Load test of the out-of-order buffer and debounced refetch paths
- Update to this specification before release.

---

**Sub-point:** 9.6 — Optimistic Interface Rules  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

An **optimistic update** applies the intended outcome to the UI *before* the server confirms it, to mask latency. Optimistic updates are a UI latency strategy — **never a business semantic**. The server remains the authority; optimistic values are provisional, version-less, and reconcilable per 9.5.

Governing rules:

1. **Optimistic updates may be used only for low-risk, easily reversible actions.** Permission is **allowlist-based**: an action is optimistic only if it is listed in §2.2. Anything not on the allowlist — including every action in the §2.3 denylist — is forbidden until it passes the qualification review and this specification is amended (§12).
2. Every permitted optimistic update implements the **seven-step contract** of §3, unmodified: pending marker, preserved confirmed state, idempotency key, confirmation-before-replacement, rollback/refetch on failure, no timeout-to-success, and dependency gating.
3. **Optimistic state is never authoritative**: it must not be written into the version chain or caches as confirmed data (9.5 §4.3), must not advance watermarks (9.5 §3.2), must not be used as evidence in any financial or entitlement decision (9.5 §5.1), and must never outlive its session or cross account boundaries (9.4 §10).
4. The pending state is displayed per 9.4 §3: distinguishable from `Live`-confirmed state, with text (never color alone), and reconciled through the normal 9.4/9.5 machinery.

## 2. Qualification — the allowlist model

### 2.1 Qualification criteria

An action qualifies for optimistic treatment only if it passes **all** of the following tests:

| Criterion | Requirement |
|---|---|
| **Low risk** | A wrong or failed optimistic display costs the user at most minor, recoverable inconvenience |
| **Easily reversible** | The server state can be restored to the exact previous confirmed state, or the operation is a natural no-op when repeated (idempotent) |
| **No financial significance** | Cannot change balances, entitlements, commissions, payouts, refunds, or obligations, even transiently |
| **No authorization significance** | Cannot alter ownership, roles, membership, or access — even transiently (9.3 §3.7) |
| **No cross-user visibility** | A wrong optimistic value must not be observable by, or misleading to, any other user |
| **No side effects** | Cannot trigger webhooks, emails, notifications to others, inventory holds, or any downstream workflow |
| **Detectable, bounded failure** | Failure is deterministic and detectable; rollback is well-defined; timeout does not create ambiguity that a refetch cannot resolve |

### 2.2 Permitted actions (exhaustive allowlist)

The complete list of actions that may use optimistic updates. No other action may.

| Action | Scope | Why permitted | Mandatory conditions |
|---|---|---|---|
| **Mark a notification as read** | The authenticated user's own notification rows (`recipient_user_id = auth.uid()`), per 9.1 §2 | Idempotent, reversible, single-user visibility, no side effects | Idempotent RPC; badge reconciled with the server per 9.5 §8.2; read state never inferred for other users |
| **Update non-sensitive display preferences** | `user_settings` fields such as theme, language, list density, sound/notification toggles | Reversible, non-financial, own-account only | Never security- or privacy-sensitive fields (visibility toggles, balance display, sharing settings, contact info) — those are server-confirmed updates only; optimistic value never persisted as confirmed (9.5 §4.3) |
| **Edit a reversible draft** | Local or server-side drafts (service-request drafts, review drafts, profile-edit drafts) that have not been submitted | Drafts are not-yet-submitted by definition; trivially reversible | The **submission** of a draft is a normal, non-optimistic mutation gated on the draft's save being confirmed (§3.8); drafts carry no business effect until submitted |

### 2.3 Forbidden actions (denylist with required alternative)

Optimistic success must **never** be shown for the following. The denylist is illustrative of the general rule — the allowlist is exhaustive, so an unlisted action is forbidden regardless of whether it appears here.

| Forbidden action | Why forbidden | Required alternative |
|---|---|---|
| **Booking confirmation** | Workflow trigger with cross-user visibility and commitment; server-side side effects | Show the server-driven `pending` state; confirm via the idempotent mutation response and the version-bumped realtime event (9.1 §5.6, 9.5 §5.2); availability holds remain server-authoritative (9.1 §2) |
| **Payment completion** | Financially significant; client/provider SDK signals are provisional (9.1 §6) | Display only the server-verified payment record; label provisional states as such (9.4 §3) |
| **Refund approval** | Financially significant; irreversible in effect | Server workflow only; display after the authoritative record commits |
| **Payout processing** | Financially significant; server-side ledger and compliance | Values and status from server records only (9.5 §5.1) |
| **Commission calculation** | Financially significant; never computed client-side | Server-computed values displayed as-is (9.5 §5.1) |
| **Subscription activation** | Entitlement change | Server-confirmed activation; UI reflects the confirmed entitlement record |
| **Ownership or role changes** | Authorization-significant; wrong display risks access confusion and security decisions (9.3 §3.7) | Server-confirmed; UI updates only after the authorized refetch confirms the change |
| **Verification approval** | Compliance and authorization significance | Server workflow; status panel reflects authoritative records |
| **Review publication** | Cross-user public visibility; moderation and legal exposure | Publish only after server confirmation; never pre-render a published review |
| **Inventory reservation** | Cross-user resource semantics; holds are server-authoritative (9.1 §2) | Server-side hold/reserve RPC; the UI reflects the server's hold result |
| **Any irreversible or financially significant action** | General rule | Normal server-confirmed mutation with pending state, idempotency key, and reconciliation |

## 3. The seven-step optimistic update contract

Every permitted optimistic action must implement the following sequence exactly. Steps 3.2–3.8 map to the mandatory rules (1)–(7).

### 3.1 Preconditions

- The action is on the §2.2 allowlist and passes all §2.1 criteria for the specific instance.
- If the machine state is `offline` (9.4 §2.1), the operation is **queued** per 9.2 §4.2 rather than sent; the pending marker is attached to the queue entry and resolves through queue reconciliation. An optimistic request is never sent while the transport is down (9.4 §4.2).
- A valid session exists; otherwise the action is offered after sign-in, never optimistically pre-applied.

### 3.2 Rule 1 — Mark it visibly as pending

- The affected element immediately enters the `pending` state: distinct visual treatment (spinner/dim/italic), a text label ("Pending…", "Saving…", or the specific "Checking result…" from §5), and `aria-busy="true"` on the region. Never color-only (9.4 §3.6).
- The pending marker attaches to the **operation**, not the screen: if the user navigates away, the pending state persists in the optimistic store (§4) and is surfaced again (badge, inline banner) when the affected view returns, until resolution.
- The optimistic value is always visually distinguishable from confirmed state (e.g., tooltip: "Not yet confirmed"). The state machine passes through `pending` even when confirmation is nearly instantaneous; skipping the state is a spec violation.

### 3.3 Rule 2 — Preserve the previous confirmed state

- Before applying the optimistic value, snapshot the confirmed state: `{ version, data }` for the entity (9.5 §2.1), stored in the operation record (§4). The snapshot is the exact rollback target.
- The snapshot is in-memory per tab; for queue-persisted operations (9.2 §4.2) it is stored with the queue entry so a tab restart can still resolve or roll back.
- The optimistic value is stored as a **pending overlay** — it never replaces the confirmed row in the cache and never advances the watermark (9.5 §4.3). A cache row may carry `pendingOverlay` beside the confirmed `{ version, data }`.

### 3.4 Rule 3 — Send the operation with an idempotency key where applicable

- Every optimistic mutation carries a client-generated `Idempotency-Key` (a UUID per logical operation, stable across retries), honored by the server per 9.5 §5.3. The key lives in the operation record; retries and outcome queries reuse it.
- Where an endpoint is a naturally idempotent RPC (e.g., `mark_notification_read`), the server must still enforce idempotency (replay returns the original result, no double effect) per 9.5 §5.3.
- The key is never reused for a different logical operation; a new user action is a new key.

### 3.5 Rule 4 — Replace the pending state only after server confirmation

"Server confirmation" is exactly one of:

1. The mutation response returning the **authoritative new state with its new version** (e.g., `Prefer: return=representation`);
2. A version-bumped realtime event for the same entity that **matches the operation's expectation** (expected next version `v+1` with the expected values) — matched per §6;
3. A refetch whose result reflects the operation's effect.

Explicitly **not** confirmation: absence of error, request completion, a timeout, a realtime event for a different entity, or a version that does not match expectation.

On confirmation: apply the confirmed values (write-newer-only per 9.5 §4.3), advance the watermark to the confirmed version, clear the pending overlay, and log at `debug`. If the confirmed state differs from the optimistic value, the server state wins and the UI renders the server state.

### 3.6 Rule 5 — Roll back or refetch if the operation fails

| Failure class | Handling |
|---|---|
| Validation / 4xx (non-auth) | Do not retry. Restore the snapshot (rollback); show inline error with "Undo"/"Retry" affordances. |
| Auth failure (401/403, close code, RLS) | Permanent per 9.4 §8: rollback, clear pending, remove from store, surface the recovery action. Never retry. |
| Transient (5xx, network) | Retry with the **same idempotency key**, bounded by 9.4 §4 backoff; pending persists with a "Retrying…" sub-state. |
| Timeout | Not a failure *or* a success — see §5 (never assumed success). |
| Version conflict / superseding event | Server wins; reconcile per §6 — never a blind restore that clobbers newer server state. |
| Queue flush failure (offline path) | Per 9.2 §4.2: discard the item, notify the user, roll back, clear affected cache entries. |
| Session ends mid-pending | Drop the pending operation, clear the store, never resurrect after sign-in (9.4 §10). |

Rollback applies the snapshot **only if** `snapshot.version >= current confirmed version`. If a realtime event advanced the entity while pending, rollback must not clobber it — refetch and adopt the newer server state instead (9.5 §4.3).

### 3.7 Rule 6 — Never convert a timeout into assumed success

- A timeout means the outcome is **unknown** — the server may have committed the operation or not. The UI must never transition pending → confirmed on a timeout.
- On timeout the operation enters `resolving` ("Checking result…") and follows the §5 resolution path: outcome query by idempotency key when available, otherwise entity refetch and comparison; only when the server state is known does pending resolve to confirmed (apply) or to rollback/retry.
- If resolution is itself inconclusive, retry the operation with the same idempotency key (safe by construction — §3.4), bounded per 9.4; on budget exhaustion, roll back and surface `stale` per 9.4 §3 with the recovery action. Assumed success is prohibited at every step.

### 3.8 Rule 7 — Prevent dependent actions until the required server state is confirmed

- Any action that logically depends on a pending operation is **disabled or queued** until that operation reaches confirmed state (§3.5). "Confirmed" means §3.5 confirmation — not "request finished".
- Concrete gating for the allowlist:
  - **Draft edit → Submit**: the submit button is disabled (with an explanatory tooltip) while the draft's save is pending; submitting an unsaved draft is impossible.
  - **Mark read**: no dependent actions; dependent *display* (badge count) is reconciled per 9.5 §8.2.
  - **Preference update**: no dependent actions beyond the preference's own consumers, which render the pending overlay until confirmation.
- Gating is implemented in the UI layer from the optimistic store (§4): a dependent action checks `store.hasPending(requiredEntity)` before enabling. Duplicate submission prevention (submit disabled while a submission is in flight, same idempotency key on retry) applies to **all** mutations, optimistic or not (9.5 §5.3).

## 4. Optimistic state model and store

A single `OptimisticStore` per tab (same ownership rules as the subscription registry, 9.3 §4.2) holds all in-flight operations:

```ts
type OptimisticOperation = {
  key: string;                    // == Idempotency-Key (UUID)
  action: "notification:mark_read" | "settings:update" | "draft:save";
  entityType: string;             // 9.5 §2.1 envelope type
  entityId: string;
  previous: { version: number; data: unknown }; // confirmed snapshot (rule 2)
  pending: unknown;               // optimistic overlay value
  status: "pending" | "retrying" | "resolving" | "confirmed" | "failed";
  attempt: number;
  createdAt: number;              // display/TTL only — never ordering (9.5 §4.4)
  queueEntryId?: string;          // when persisted via 9.2 §4.2
};
```

Rules:

1. **One in-flight operation per entity.** A second optimistic update on an entity with a pending operation is serialized (queued behind the first) or rejected with a "wait for confirmation" message — never stacked. Stacking makes rollback targets ambiguous.
2. **Deduplication by key**: the store is keyed by `key`; retries re-use the existing record, they never create a second one.
3. **Persistence**: only queue-eligible actions (9.2 §4.1 — read receipts) persist their operation with the offline write queue; all others are in-memory and dropped on teardown (9.4 §10). On restart, a persisted pending operation is re-sent with its original idempotency key and re-resolved before its pending marker is restored.
4. **Clear on sign-out / user change / portal exit**: the store is emptied before any new session's subscriptions are created (9.3 §10, 9.4 §10); pending state never crosses accounts.
5. The store is the **only** source of pending state for the UI; components render from it via the connection/optimistic context and never maintain private optimistic flags.

## 5. Timeout, retry, and outcome resolution

| Phase | Behavior |
|---|---|
| Request | Optimistic overlay applied; request sent with `Idempotency-Key`; per-request timeout (10 s default, configurable per action). |
| Timeout | `pending → resolving`; UI label "Checking result…"; no success assumption (§3.7). |
| Resolution 1 | If the endpoint exposes an outcome query (`GET .../mutations/{key}` or equivalent RPC): query by idempotency key; the server returns the committed result or "not found". Found → confirm (§3.5). |
| Resolution 2 | No outcome query: refetch the entity (9.5 §6.2) and compare with the operation's expectation. Reflects the operation → confirm. Does not → rollback/retry decision. |
| Retry | Same idempotency key; bounded by 9.4 §4 backoff (attempt counter, cap, circuit); `retrying` sub-state; never faster than the 9.4 cadence. |
| Budget exhausted | Roll back (or queue per 9.2 if offline); mark the scope `stale` per 9.4 §3; show recovery action. |
| Confirmed | Apply authoritative state, advance watermark, clear overlay, log `debug`. |

Resolution runs under the current epoch (9.4 §2.2) and is aborted on teardown; a resolution that completes after sign-out is discarded.

## 6. Conflict handling

1. **Event matching**: a realtime event for the pending entity with version `v+1` (the expected next version) and values matching the operation's expectation confirms it (§3.5). An event with `v+1` and *different* values means the server committed something else — the server state wins: apply it, clear the overlay, and surface a conflict notice if material.
2. **Gap while pending**: an event with `v+2` (or higher) arrives before `v+1` — refetch the entity per 9.5 §4.1; the refetched state resolves the pending operation (confirm or roll back) rather than the buffered gap.
3. **Stale event for the same entity**: `v ≤ watermark` — dropped per 9.5 §4.1; it can never resurrect an overlay.
4. **Concurrent tabs**: tab A's optimistic update and tab B's confirmed update to the same entity — the version chain decides (9.5 §4.3). The losing optimistic operation rolls back to the **newer** server state (refetch), never to its own snapshot if the server advanced.
5. **Rollback vs. newer state**: rollback applies the snapshot only when `snapshot.version >= current` (§3.6); otherwise reconcile. The write-newer-only invariant (9.5 §4.3) governs every write in this section.

## 7. UI presentation and accessibility

1. Pending overlay is shown on the affected element with `aria-busy="true"`, a text label, and the element-level marker — a global toast alone is insufficient.
2. Optimistic values are visually distinguishable from confirmed (dim/italic + "Not yet confirmed" tooltip); color is never the only channel (9.4 §3.6).
3. On rollback, the UI restores the snapshot (or adopted newer state) and shows an inline error with recovery affordances ("Undo", "Retry", or the 9.4 §3.4 recovery action as applicable).
4. Dependent actions are disabled with an explanatory tooltip ("Wait for confirmation") — never silently dropped.
5. `resolving` ("Checking result…") and `retrying` are distinct labels; the user must never see "Confirmed" from a timeout (§3.7).

## 8. Server-side requirements

1. All mutation endpoints that can receive optimistic calls honor `Idempotency-Key` per 9.5 §5.3: replay returns the original response and causes no second effect; the key is stored with the mutation result for the outcome query (§5).
2. Mutations return the authoritative new state with its new version (representation with `version` and `updated_at`), so the client can apply §3.5 confirmation atomically.
3. Permitted-action RPCs (mark read, settings update) are naturally idempotent and scoped by `auth.uid()`; settings updates reject sensitive fields server-side regardless of client claims.
4. Permitted actions must not trigger side effects (webhooks, fan-out notifications, emails, holds). If a future change adds a side effect, the action leaves the allowlist until re-reviewed (§12).
5. An outcome-by-key query endpoint is provided for timeout resolution where feasible (§5).

## 9. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Optimistic updates never apply to realtime-forbidden domains; events confirm or conflict per 9.1 §5.6 and §6 |
| 9.2 | Offline-queue entries may carry pending state; queue reconciliation is the server-confirmation step; rollback on queue failure |
| 9.3 | The optimistic store follows subscription-registry ownership and teardown rules; cleared on every 9.3 §3 trigger |
| 9.4 | Pending overlay renders under the connection state; requests gated on machine state; resolution respects epochs; `stale`/`sync_failed` consume pending resolution |
| 9.5 | Versions, watermarks, write-newer-only, idempotency keys, refetch-on-gap — all apply unchanged; the overlay is version-less and never advances watermarks |

## 10. Failure and rollback matrix

| Outcome | Detection | Action |
|---|---|---|
| Validation error (4xx non-auth) | response | Roll back; inline error; no retry |
| Auth failure (401/403, close code 1008, RLS suppression) | response/transport (9.4 §8.1) | Roll back; clear store entry; recovery action; no retry |
| Transient error (5xx, network) | error | Retry, same key, 9.4 backoff; `retrying` sub-state |
| Timeout | timer | `resolving`; outcome query/refetch; never success (§5) |
| Version conflict | response/event | Server wins; apply newer; conflict notice |
| Superseding event while pending | ingest (9.5 §4.1) | Reconcile; roll back to newer server state |
| Queue flush failure | 9.2 §4.2 | Discard item; notify; roll back; clear cache |
| Session ends mid-pending | auth event | Drop pending; clear store; never resurrect |

## 11. Implementation acceptance checklist for 9.6

- [ ] Only the three §2.2 actions exist in optimistic code paths; a search of the codebase finds no optimistic pre-application for any §2.3 action (enforced by review and lint).
- [ ] Each permitted action implements the full seven-step contract (§3.2–§3.8).
- [ ] A single `OptimisticStore` exists with one-in-flight-per-entity, key-based dedup, session-scoped clearing, and no component-private pending flags.
- [ ] Pending state is marked visibly (text + `aria-busy`) and is distinguishable from confirmed; the state machine always passes through `pending`.
- [ ] Rollback preserves and restores the confirmed snapshot, and never clobbers newer server state (snapshot-version check).
- [ ] Idempotency keys are sent, stable across retries, and never reused across logical operations; the server honors replay (verified by double-submit test: two sends, one effect).
- [ ] Timeout test: response withheld past the timeout; the UI shows "Checking result…", never "Confirmed"; the outcome query/refetch resolves the operation; no path converts timeout to success.
- [ ] Dependent actions are gated: submit is impossible while the draft save is pending; duplicate submission is impossible (verified by test).
- [ ] Conflict tests: server commits a different value while pending → server state wins; concurrent tabs → version chain decides; rollback respects newer state.
- [ ] Cross-account test: pending state from user A is cleared on sign-out and never appears for user B.
- [ ] No optimistic value is ever persisted as confirmed, advances a watermark, or appears in financial/entitlement displays (9.5 §5.1 invariant holds).
- [ ] Offline path: queued optimistic operations resolve through 9.2 queue reconciliation; queue failure rolls back and notifies.

## 12. Change control for 9.6

Adding an action to the allowlist, or changing the contract (timeout values, gating rules, store semantics), requires:
- Risk review against all §2.1 criteria (reversibility, financial/authorization significance, cross-user visibility, side effects)
- Idempotency and replay verification for the new endpoint
- Conflict and failure-injection tests for the new action
- Accessibility review of the pending presentation
- Update to this specification before release.

---

**Sub-point:** 9.7 — Offline Read Behavior  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Offline mode may display **read-only, previously retrieved data only when doing so is safe**. "Safe" means: the record is authorized for the current user, structurally valid, schema-compatible, within its freshness rule (or explicitly degraded to aged mode), and rendered with the mandatory offline chrome of §4. The server database remains the only authority; **offline data is informational, not authoritative** (9.2 §1).

Governing rules:

1. **Display permission is derived from the record itself.** Every offline read validates the cached record's scope, schema version, integrity, and expiry (§5–§6) before a single field is rendered. A record that fails any check is discarded, never displayed.
2. **No stale offline data may be used to guarantee** appointment availability, current prices or discounts, booking confirmation, payment status, account balance, subscription entitlement, commission or payout amount, verification status, current permissions, inventory availability, or notification unread count (§2.2). Cached values may inform, never guarantee; anything they cannot guarantee is shown as unknown or unavailable.
3. **Every offline screen must show** the four mandatory elements: an offline/stale-data indicator, the last successful server synchronization time, which actions are unavailable, and a retry/reconnect option (§4).
4. **Cache records carry a mandatory contract** — cache schema version, authenticated user ID, tenant/salon scope, server update timestamp, local cache timestamp, expiration/maximum-age rule, and data classification (§5).
5. **Expired, incompatible, corrupted, or incorrectly scoped cache entries must be discarded** (§7) — deleted, never repaired by guesswork, never served, and never migrated to another user or scope.

## 2. Safety model for offline reads

### 2.1 Definition of "safe to display"

A cached record is displayable offline **only if all** of the following hold at read time:

| # | Check | Source of truth | Failure consequence |
|---|---|---|---|
| 1 | **Authorization match**: record `user_id` + tenant/salon scope equal the current session's scope | Fields on the record itself (§5) — never assumed from the store name or key | Incorrectly scoped → discard + log security event (§7) |
| 2 | **Schema compatibility**: record `cache_schema_version` equals the current reader version | Record field vs. app constant | Incompatible → discard (§7) |
| 3 | **Structural integrity**: record parses; required fields present; checksum valid | Verification at read (§6) | Corrupted → discard (§7) |
| 4 | **Freshness**: within the record's stored freshness window, or explicitly degraded to aged mode (§4.4) | Record's own max-age rule (§5) | Expired → discard or aged-mode per tier (§3) |
| 5 | **No revocation**: scope still authorized per the last known profile; no revocation marker | 9.3 §3.7, 9.5 §9.3 | Remove + hide (§7) |

If any check fails, the entry is discarded and the screen shows the "no offline data" state (§4.5) — never a partially validated record.

### 2.2 Forbidden guarantees — never derived from stale offline data

The following must **never** be guaranteed, asserted, or acted upon from cached data. "Guarantee" includes: rendering as confirmed/settled (a green check, "Confirmed", "Succeeded" styling), enabling a decision, auto-completing a workflow step, or displaying without a staleness qualifier.

| Domain | Offline display policy | Guarantee policy | Decision gating |
|---|---|---|---|
| **Appointment availability** | Cached slots may render only from fresh cache (Tier C, ≤ 5 min per 9.2 §5.2); otherwise "Unavailable offline" | Never guarantee a slot is open — holds and final decisions are server-authoritative (9.1 §2) | Booking actions offline only via the queued-request path of §9 with server re-validation before commit |
| **Current prices or discounts** | Fresh cache only (Tier C); totals never computed from cached prices | Never guarantee a price or discount applies | Checkout/quote generation blocked offline |
| **Booking confirmation** | Cached status may render as an informational snapshot with "as of" time; never with confirmed styling | Never guarantee a booking is confirmed | Check-in, claims, or any action relying on confirmation blocked offline |
| **Payment status** | Fresh cache only (Tier C), always labeled non-authoritative | Never guarantee a payment succeeded/failed/refunded | Payment decisions blocked; 9.1 §6 unaffected |
| **Account balance** | Not displayed offline (Tier D) — "Available when online" | Never guaranteed, ever | Affordability checks, auto-pay, or transfers blocked offline |
| **Subscription entitlement** | Not displayed/gated offline (Tier D) | Never guarantee an entitlement offline | Entitlement-gated features blocked offline, regardless of cached claims |
| **Commission or payout amount** | Not displayed offline (Tier D) | Never guaranteed; 9.5 §5.1 applies unchanged | Financial actions blocked offline |
| **Verification status** | Cached status may render informational (Tier B) with "as of" time | Never guarantee approval | Actions that consume approval status blocked offline |
| **Current permissions** | Roles/permissions never read from cache — session claims + profile only | Never guaranteed from cache | Permission-gated actions blocked offline (9.6 §2.1) |
| **Inventory availability** | Same as appointment availability (Tier C) | Never guaranteed | Reservation actions blocked; holds server-authoritative |
| **Notification unread count** | Cached count informational with "as of" (Tier C), adjusted for queued read receipts (§9) | Never guaranteed; reconciles per 9.5 §8.2 | None (advisory) — but never shown as an exact guarantee |

General rule: when a cached value cannot guarantee the user's decision, the UI must present the **unknown** — "Unavailable offline — reconnect to check" — rather than the cached value dressed as truth.

## 3. Data classification tiers

Every cached record declares one of four tiers (the record's `data_class`, §5). Tiers determine offline display, freshness windows, and labeling. Tiers are assigned by the server/client contract per data domain — a client may not self-promote a record to a less restrictive tier.

| Tier | Domains (examples) | Offline display | Freshness rule (9.2 §5.2) | Label |
|---|---|---|---|---|
| **A — Static/public informational** | Salon profiles, service catalogue text, policies, imagery | Display from cache | 60 min, cache-first + background refresh | Standard stale marker only |
| **B — User-scoped informational** | Own booking lists, own notifications, user settings, drafts, verification status snapshot | Display from cache; aged mode allowed (§4.4) | 15 min / 5 min / 24 h per domain, stale-while-revalidate | "As of \<time>" required |
| **C — Freshness-critical informational** | Availability slots, prices/discounts, payment status snapshot, unread count | Fresh cache only; **no aged mode** | 5 min, network-first | "As of \<time>" + "may be outdated" |
| **D — Financial & entitlement** | Balance, commissions, payouts, refunds, entitlements, permissions | **Never displayed offline** — "Available when online" | n/a (never cached into SW; no-store per §11) | n/a |

Rules:
1. Tier C and D records are never served past their freshness — there is no stale-while-revalidate for them; past the window they are discarded (§7) and the domain renders as unavailable.
2. Tier A/B records may be served in aged mode (§4.4) past their freshness window, but only with the full aged chrome, and never beyond the hard discard horizon (§7).
3. Tier D endpoints must be marked `Cache-Control: no-store` server-side so the Service Worker never intercepts them into cache (§11); a Tier D record found in any cache is treated as a defect — discarded and logged.

## 4. Mandatory offline screen elements

Every screen rendering offline or stale data must display **all four** of the following. This applies to every portal (Main Website, Customer PWA, Owner PWA, Growth Partner PWA).

### 4.1 Offline/stale-data indicator

- A persistent banner or status pill derived from the connection state (9.4 §2.1): `Offline`, `Reconnecting…`, `Syncing…`, `Data may be outdated`, or `Synchronization failed` — never a component-local guess.
- The existing `offline-banner` pattern from `nexora-app.tsx` is the baseline; it must include the state text and icon, and use `aria-live="polite"` (9.4 §3.6).
- A **per-screen** variant must additionally state what the screen shows: "Showing saved data from \<time>", "Showing saved data that may be outdated", or "No saved data available".

### 4.2 Last successful server synchronization time

- Each screen shows the last successful server synchronization time for its scope, from the connection manager's sync timestamp (9.4 §2.1) and the per-record `server_updated_at` (9.5 §2.1): "Last synced 14:32" for the scope; "As of 14:28" per data element when it differs.
- The displayed time is the **server-confirmed** time. If only a local receipt time exists (record fetched long ago, no resync since), it is displayed as "Retrieved \<local time>" — clearly distinguished from a server sync time. Client clock is display-only (9.5 §4.4).
- Where the screen shows a queue of pending offline writes (9.2 §4.2), the count is shown: "2 changes waiting to sync".

### 4.3 Which actions are unavailable

- The screen lists unavailable actions inline, with a reason: "Booking is unavailable while offline — reconnect to book", "Payment requires a connection".
- Disabled controls use `disabled` + explanatory tooltip; the reason is never implied by gray-out alone (a11y: 9.4 §3.6).
- The list is derived from the §9 gating matrix — it must be accurate per screen, not a generic disclaimer.

### 4.4 Retry/reconnect option

- A visible "Retry now" / "Reconnect" action on every offline/stale screen, wired to the connection manager (9.4 §3.4): triggers an immediate probe + resync (9.4 §5–§6), respecting the 9.4 backoff budget.
- In addition to the manual control, automatic behavior continues per 9.4 §5 (online event → immediate resync; visibility resume → verify + resync).
- When retry fails, the screen reflects the resulting state (`stale`/`sync_failed`) with the appropriate recovery action.

### 4.5 Aged-data mode (Tier A/B only)

When a Tier A/B record is past its freshness window but within its discard horizon, the screen renders it in **aged mode**: stronger banner ("You're viewing old data — details may have changed"), per-element "as of" times, unavailable-action list expanded to everything that depends on that data, and the retry option promoted. Aged mode is never applied to Tier C/D (§3).

## 5. Cache record contract

Every cache entry (IndexedDB object stores per 9.2 §2.1 and any CacheStorage API snapshot) stores the following fields **with the record itself** — not in the key, not in a side table:

```ts
type CachedRecord<T> = {
  // — mandatory contract fields (9.7 §5) —
  cache_schema_version: number;   // schema of THIS cache record; bumped on migration (§7)
  user_id: string;                // auth.uid() at fetch time
  tenant_id: string | null;       // tenant scope; null for public/global data
  salon_id: string | null;        // salon scope; null when not salon-scoped
  server_updated_at: string;      // server clock timestamptz from the source record
  cached_at: number;              // local wall-clock write time (display/TTL only — never ordering, 9.5 §4.4)
  max_age_seconds: number;        // this record's freshness window (9.2 §5.2)
  revalidate_window_seconds: number; // stale-while-revalidate window; 0 for Tier C/D
  data_class: "A" | "B" | "C" | "D"; // §3 tier
  // — consistency fields (9.5) —
  version: number;                // source entity version (watermark, 9.5 §3.2)
  entity_type: string;            // 9.5 §2.1 envelope type
  checksum: string;               // hex(SHA-256(canonical JSON of data))
  // — payload —
  data: T;                        // minimal authorized projection (9.1 §2, §5.4)
};
```

Rules:

1. The seven mandatory contract fields (`cache_schema_version`, `user_id`, tenant/salon scope, `server_updated_at`, `cached_at`, expiry/max-age rule, `data_class`) must exist on **every** cache entry, including CacheStorage API snapshots (encoded in the response headers or a wrapper). An entry missing any field is treated as incompatible and discarded (§7).
2. `cached_at` (local) and `server_updated_at` (server) are never compared for ordering (9.5 §4.4). `cached_at` seeds the TTL countdown; `server_updated_at` is what the UI displays as "as of".
3. `max_age_seconds` + `revalidate_window_seconds` encode the full freshness rule per record, so readers need no config lookup; Tier C/D always have `revalidate_window_seconds = 0`.
4. `checksum` is computed at write and verified at every read (§6); the payload's canonical JSON excludes volatile envelope fields.
5. Collection entries store the same contract per row plus a collection-level `fetched_at`; a collection is only as valid as its most recently validated member (§7).

## 6. Read-time validation pipeline

Every offline read executes the following pipeline, in order. Any failure discards the entry (§7) and short-circuits to the appropriate screen state:

```ts
function readOffline<T>(store, key): ReadOutcome<T> {
  const entry = store.get(key);              // 1. load
  if (!entry) return { status: "absent" };
  if (!hasAllContractFields(entry))          // 2. structure
    return discard(entry, "incomplete");
  if (entry.checksum !== hash(entry.data))   // 3. integrity
    return discard(entry, "corrupt");
  if (entry.cache_schema_version !== CACHE_SCHEMA_VERSION) // 4. schema
    return discard(entry, "schema-version");
  if (entry.user_id !== currentUser.id ||
      entry.tenant_id !== currentTenantId ||
      entry.salon_id !== currentSalonId)     // 5. scope
    return discard(entry, "wrong-scope", /* log security event */);
  if (!isKnownTier(entry.data_class))        // 6. classification
    return discard(entry, "unknown-tier");
  const age = now() - entry.cached_at;
  if (age > entry.max_age_seconds + entry.revalidate_window_seconds) // 7. expiry
    return discard(entry, "expired");
  if (isRevoked(entry.entity_type, entry.entity_id)) // 8. revocation (9.5 §9.3)
    return discard(entry, "revoked");
  if (age > entry.max_age_seconds)
    return { status: "aged", entry };        // Tier A/B only (§4.4)
  return { status: "fresh", entry };         // 9. serve
}
```

Notes:

- Step 5 (scope) is the security boundary: a correctly keyed store can still contain a wrong-scope entry (e.g., restored backup, bug, previous account). The record's own fields — not the key — decide. Wrong-scope entries are deleted and logged as a security event, never returned.
- Step 8 consults the connection manager's revocation state and the entity watermark (9.5 §9.3): entries for revoked scopes are removed immediately regardless of freshness.
- Aged outcomes are only produced for Tier A/B; Tier C/D entries past `max_age_seconds` fall through to discard.
- Reads are never served from a partially written record: writes are single-transaction (record + checksum committed atomically), so a torn write fails step 2/3 rather than rendering partial data.

## 7. Discard and invalidation rules

**Expired, incompatible, corrupted, or incorrectly scoped cache entries must be discarded.** Discard = delete from the store; the affected UI hides the data and shows the appropriate state (unavailable / no offline data / reconnect prompt).

| Discard cause | Detection | Consequence |
|---|---|---|
| **Expired** — beyond `max_age + revalidate_window` | §6 step 7 | Delete; Tier C/D domains render "Unavailable offline"; Tier A/B may be refetched on reconnect |
| **Schema-incompatible** — `cache_schema_version` mismatch | §6 step 4 | Delete; on app upgrade, purge all entries of the old schema version in one migration pass |
| **Corrupted** — checksum/parse failure | §6 step 3 | Delete; log `warn`; attempt one refetch on reconnect; remain hidden if it fails |
| **Incorrectly scoped** — wrong `user_id`/tenant/salon | §6 step 5 | Delete; log **security event**; never display, never migrate, never "repair" |
| **Revoked** — authorization loss, RLS suppression, sign-out | 9.3 §3.7, 9.5 §9.3, §6 step 8 | Delete immediately; never resurrect without an authenticated refetch (9.5 §9.3) |
| **Superseded** — lower version than confirmed state | 9.5 §4.3 write-newer-only | Overwrite with newer; equal version = no-op |
| **Offline-write conflict** — server rejected a queued write | 9.2 §4.2 | Delete affected entries, notify user |
| **Sign-out / user change** | 9.2 §4.3, 9.4 §10 | Purge all user-scoped stores and queues |

Collection integrity rule: if **any** member of a cached collection is discarded, the entire collection is treated as unusable (a list with holes is worse than no list) — the collection renders "No offline data" until a whole-collection refetch succeeds (9.5 §7.3).

## 8. Informational, not authoritative — rendering rules

1. Every offline-rendered value carries its qualifier: "As of 14:28", "Cached", "May be outdated", or the aged-mode banner. Values are rendered with subdued/read-only styling; confirmed-state styling (green "Confirmed", checkmarks, "Succeeded") is prohibited for cached data — only server-confirmed state may use it (9.4 §3).
2. Cached values are never: copied into authoritative fields, used to compute financial/entitlement outcomes (9.5 §5.1), attached to outgoing mutations as truth, or exported as evidence.
3. Offline reads never trigger a §2.2 guarantee. When a decision needs a guarantee, the UI presents the unknown instead of the cached value (§2.2 general rule).
4. If the user initiates a mutation that depends on cached data (e.g., queued booking request), the request must carry the snapshot it was based on (§9) and the server re-validates before commit; the client never asserts the cached values as current.
5. Logging: offline serves are logged at `debug` (entity scope + served tier); discards are logged per §7. Payload content is never logged (9.1 §5.7, 9.4 §12).

## 9. Decision gating matrix (offline behavior by action)

| Action | Offline behavior |
|---|---|
| Read-only browsing of Tier A/B cached data | Allowed with §4 chrome and qualifiers |
| Booking create / reschedule / cancel | **Queued request** per 9.2 §4.1, only if based on fresh (Tier C) cached availability/prices; the queue entry records the exact snapshot used (`server_updated_at` + `version`); UI marks the request "Pending — will be confirmed when online"; the server re-validates availability/prices/authorization at flush and may reject (9.2 §4.2) — a queued request is never shown as confirmed (9.6 §3.7) |
| Mark notification read | Queued per 9.2 §4.1; pending per 9.6; badge shows "(cached)" until reconciled (9.5 §8.2) |
| Non-sensitive preference update | Queued per 9.2 §4.1 |
| Draft save | Queued (9.2 §4.1); draft edits allowed locally |
| Payment, refund, payout, commission, entitlement actions | **Blocked** — Tier D (§3), "Available when online" |
| Anything requiring current availability, prices, permissions, or confirmation | **Blocked or queued-with-server-revalidation** per row above; never executed on cached truth |
| Sign-out, portal switch | Allowed (local) — triggers full purge (9.2 §4.3, 9.4 §10) |

Gating is enforced in the UI from the connection state (9.4) and the queue (9.2 §4.2); a blocked action explains itself (§4.3).

## 10. Cross-account and multi-tab offline safety

1. **Cache keys incorporate `user_id` + tenant/salon scope** (9.2 §5.4), and §6 step 5 re-validates scope from the record itself. Both layers are mandatory; the key is convenience, the record field is the boundary.
2. **Sign-out purges** all user-scoped stores, queues, and watermarks (9.2 §4.3, 9.4 §10, 9.5 §6.3). A new user's reads start from an empty cache: unexpired entries from a previous account are still purged — expiry does not make them safe to inherit.
3. **Multi-tab**: any tab may write cache updates; writers follow write-newer-only (9.5 §4.3); readers run §6 on every read, so a concurrently updated entry is always re-validated before display. Background refresh is leader-only (9.4 §9).
4. **Offline writes in one tab** surface as pending in other tabs only through the leader's broadcast state (9.4 §9.2) and the queue store; cached reads reflect only confirmed state plus explicitly queued items.

## 11. Server-side and Service Worker requirements

1. **No-store for Tier D**: endpoints serving balance, commission, payout, refund, entitlement, and permission data respond `Cache-Control: no-store` (plus `private`); the Service Worker must never intercept them into CacheStorage. A Tier D response in cache indicates a defect — discard and alert (9.4 §11.7).
2. **TTL alignment**: server responses for cacheable domains carry the same freshness values as 9.2 §5.2 (`max-age` per tier), so client and server agree on expiry; the Service Worker maps these onto the record's `max_age_seconds`.
3. **Versioned cache names**: `nexora-static-v1` / `nexora-api-v1` (9.2 §2.1) bump on schema migrations, and an upgrade activates the new cache while purging old versions in one pass (§7 schema-incompatible rule).
4. **Read endpoints stay reachable** for Tier A/B content under degraded networks (CDN/cache-first per 9.2 §2.2) so "offline" is a graceful degradation, not a blank screen.
5. Server responses include the authoritative `server_updated_at` and entity `version` so every cache write records the server truth (9.5 §2.1).

## 12. Failure and edge cases

| Edge case | Handling |
|---|---|
| One corrupt record in a collection | Whole collection invalidated (§7) until refetch — never a list with holes |
| Client clock skew (fast) | Entries appear older → discarded early (safe direction); Tier A/B data may simply be missing until reconnect |
| Client clock skew (slow) | Entries appear fresher; bounded by the mandatory resync on reconnect (9.4 §5–§6) and the §3 rule that Tier C/D never serve past window — plus a hard cap: Tier B aged mode ends after 30 min offline regardless of TTL |
| Offline longer than any TTL | All Tier C/D data discarded; Tier A/B in aged mode up to the 30-min cap, then discarded; screens show "No saved data" + reconnect |
| Torn write (crash mid-write) | Atomic write + checksum → fails §6 step 2/3, discarded, never partially rendered |
| Restored/imported backup with wrong-scope entries | §6 step 5 discards and logs — scope is in the record, not the key |
| App upgrade mid-session | Cache schema version bump → one-pass purge of old-schema entries (§7) |
| Queued write conflicts at flush | 9.2 §4.2: server result wins, affected cache entries discarded, user notified |

## 13. Implementation acceptance checklist for 9.7

- [ ] Every offline/stale screen renders all four mandatory elements (§4.1–§4.4); verified across all four portals.
- [ ] Last-sync times are server-confirmed; local receipt times are labeled distinctly; no screen omits them when showing cached data.
- [ ] The cache record contract (§5) is implemented with all seven mandatory fields + `version`/`entity_type`/`checksum`; enforced for IndexedDB and CacheStorage entries.
- [ ] The §6 read pipeline is implemented in order; every discard path deletes the entry and logs the correct level (security event for wrong-scope).
- [ ] Negative guarantee tests: for each §2.2 domain, an automated test proves a stale cached value cannot produce a guarantee, confirmed styling, or an enabled decision.
- [ ] Tier enforcement: Tier C never serves aged; Tier D is never displayed offline and its endpoints are `no-store` (verified by SW interception test).
- [ ] Aged mode exists and is limited to Tier A/B with the 30-min cap.
- [ ] Collection integrity: one discarded member invalidates the whole collection until refetch (tested).
- [ ] Offline booking path: queued request records the snapshot, shows "Pending — will be confirmed when online", never shows confirmed state, and the server re-validates at flush (9.2 §4.2).
- [ ] Cross-account: sign out → sign in as user B; none of user A's unexpired entries are visible or served (purge + scope-validation tests).
- [ ] Clock-skew tests: fast and slow clocks produce the specified behaviors (§12) with no guarantee violations.
- [ ] Multi-tab: concurrent writes/reads converge; readers re-validate on every read (9.5 §4.3, §6).
- [ ] Upgrade test: cache schema version bump purges old-schema entries in one pass.

## 14. Change control for 9.7

Any modification to tier assignments, freshness windows, the cache record contract, read-time validation, discard rules, aged-mode policy, or the decision gating matrix requires:
- Threat-model review (focus: stale-data guarantees, cross-account leakage, financial display)
- Negative-test expansion covering the changed domains and tiers
- Storage/quota impact analysis (9.2 §5.3)
- Accessibility review of any new offline chrome
- Update to this specification before release.

---

**Sub-point:** 9.8 — Sensitive Offline Data  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Offline caching is a **privilege, not a default**: the app stores for offline use only the minimum data needed for the approved offline experience (9.2 §3, 9.7 §3), and only in storage appropriate to the data's sensitivity. Anything not explicitly approved is not cached; anything explicitly denied is **never** written to any browser storage, by any code path.

Governing rules:

1. **Cache only the minimum data needed for the approved offline experience.** Every offline-eligible domain has a fixed, reviewable field projection (§3). Full rows, extra columns, and "just in case" data are prohibited.
2. **Identity documents, government IDs, payment credentials, access tokens, private signed URLs, audit records, and highly sensitive financial data must not be stored for offline use** (§4). The denylist is enforced at the source (server), at the transport (Service Worker), and at the cache layer (client) — three independent gates.
3. **Do not place sensitive records in unrestricted `localStorage`** (§5). localStorage is restricted to non-sensitive, non-private values; every other layer of the storage matrix is chosen by sensitivity and platform capability.
4. **Browser storage must be treated as potentially accessible to injected scripts** (§2). Storage security is defense-in-depth; the denylist, not encryption, is the primary control — a script that can run in the page can read any storage the page can.
5. **Private cache entries are separated by authenticated user and tenant** (§6) and **cleared on logout, account switching, account deletion, tenant removal, permission revocation, and session invalidation** (§7) — with the same rigor for shared devices (§10).
6. **Signed URLs must not be cached beyond their validity period** (§9), and **offline cache retention is short, documented, and aligned with the application's privacy policy** (§11).

## 2. Threat model: browser storage is script-accessible

### 2.1 Assumptions

- Any script executing in the page context (first-party bug, compromised dependency, injected payload) can read, write, and delete **everything** the application can: memory, `localStorage`, `sessionStorage`, IndexedDB, CacheStorage, and cookies that are not `HttpOnly`.
- Therefore: **nothing that must remain secret from an XSS attacker may be placed in any of these stores.** This is not a flaw to be mitigated later — it is the design constraint.
- Storage *privacy* is further bounded by the platform: other users of the same device (shared devices), browser profiles, backups, and forensic extraction may access persisted storage outside the app's control.
- HTTP(S) boundaries hold: storage is origin-scoped. Cross-origin isolation (COOP/COEP) and CSP are compensating controls that reduce *exfiltration* channels but do not make storage unreadable to injected scripts.

### 2.2 Design consequences

| Consequence | Rule |
|---|---|
| Secrets never in storage | Access tokens, refresh tokens, payment credentials, and private signed URLs are never written to offline caches; session material is handled per §8 |
| Denylist is the primary control | §4 categories are rejected at three gates, so even a compromised cache layer cannot be tricked into persisting them |
| Encryption is secondary | Encryption-at-rest (§12) defends against offline extraction of storage (backups, device forensics); it does **not** defend against an injected script, which can read both key and ciphertext. Never claim "encrypted, therefore safe from XSS" |
| Minimization is security | The fewer fields stored, the less a successful script read or a device-loss exposure leaks (§3) |
| Short retention bounds exposure | Retention limits (§11) cap the window in which stored data can be read by anyone other than the user |

## 3. Data minimization — approved offline scope and field projections

### 3.1 Binding to the approved offline experience

Only the domains in 9.2 §3 (read-only offline scopes) may be cached, and only in the tiers assigned in 9.7 §3. Adding a domain, or adding a field to an existing projection, requires change control (§15) — including a privacy review. The "approved offline experience" is exactly what these tables permit; nothing else.

### 3.2 Field projections (allowlist per domain)

Each offline-eligible domain stores **only** the fields below. Server responses for these domains project to exactly these fields; the cache layer validates the projection on write and refuses anything else.

| Domain (9.2 §3) | Allowed offline fields | Explicitly excluded (never cached) |
|---|---|---|
| **Bookings** (own/staff) | Booking ID, salon name + address, service name, staff name, start/end time, status, price (display only, Tier B), `version`, `updated_at` | Customer phone/email beyond the viewer's own, internal staff notes, cancellation reasons from other users, payment method details, documents |
| **Salon profiles** (public) | Public profile fields, services catalogue (name, description, price, duration), opening hours, published staff roster, imagery | Private financial data, internal notes, unpublished draft content, staff contact details beyond published fields |
| **User settings** | Non-sensitive preferences (theme, language, list density, notification toggles) | Security/privacy settings, sharing settings, contact info, anything governing access (9.6 §2.2) |
| **Availability slots** | Slot ID, salon/service scope, start/end, version | Staff identity beyond what the viewer is authorized to see (9.1 §4.2), internal hold metadata |
| **Notifications** | Notification ID, type, title, snippet, read flag, `version`, `updated_at` | Full message bodies containing documents/PII beyond the snippet, recipient PII beyond the viewer, attachments |

Rules:

1. Server-side projection is the enforcement point: RLS-scoped views/endpoints return only allowed fields (9.1 §4.2). The client additionally validates the projection on write — two gates.
2. A cached record containing any excluded field is a **defect**: discarded per 9.7 §7, logged as a security event, and the projection bug fixed before further writes.
3. Full-row caching (`SELECT *` into cache) is prohibited for every domain.
4. Cached data is read-only by construction (9.2 §3); no cached field may be used as input to a mutation (9.7 §8).

## 4. Absolute denylist — never stored for offline use

The following categories are **never** written to any browser storage for offline use, under any circumstance — not to IndexedDB, CacheStorage, localStorage, sessionStorage, or memory-mapped persistence (the in-memory active-view exception is noted per row):

| Category | Examples | In-memory exception? |
|---|---|---|
| **Identity documents** | Passports, government-issued IDs, driver's licenses, visa documents | May be displayed in the active view only; never retained past view teardown; always fetched on demand from authorized endpoints (9.1 §2) |
| **Government IDs** | ID numbers, tax identifiers, citizenship/registration numbers | Never — not even in memory beyond the server response lifecycle of the screen that legitimately shows them |
| **Payment credentials** | Card numbers, PANs, CVV, expiry, payment-provider tokens, bank account/IFSC numbers, stored-payment-method records | Never in any app storage; provider SDK fields stay inside provider-managed inputs (9.1 §2.1) |
| **Access tokens** | JWTs, refresh tokens, API keys, provider OAuth tokens | Auth session material is governed by §8 — never written into offline caches; memory-only on shared devices |
| **Private signed URLs** | Signed document/image URLs with embedded credentials | Active view only, per §9; never persisted past validity or view teardown |
| **Audit records** | Server audit logs, webhook event rows, internal reviewer notes, internal activity trails | Never cached client-side (9.1 §2.1) |
| **Highly sensitive financial data** | Wallet ledgers, commission/payout records, refund records, reconciliation data, payment-attempt detail beyond the status snapshot | Tier D per 9.7 §3 is never displayed offline at all — the value and the record are both excluded |

### 4.1 Three enforcement gates

| Gate | Mechanism | Failure handling |
|---|---|---|
| **Server** | RLS + projections; denylisted endpoints respond `Cache-Control: no-store, private` (9.7 §11) and never include denylisted fields in cacheable responses | n/a (server contract) |
| **Service Worker** | Routing rules refuse interception of denylisted path patterns (documents, payments, audit, auth, signed URLs); requests bypass the cache (`cache: "no-store"` / network-only) | A denylisted response entering CacheStorage is treated as a defect: discard, log `error`, alert (9.4 §11.7) |
| **Cache layer** | The cache manager validates entity type + projection on every write (§3.2) and refuses denylisted entity types | Write refused, `error` log, security event |

The three gates are independent: any single gate failing must still block the write. Tests prove each gate independently (§14).

## 5. Storage selection matrix

Storage choice is a function of sensitivity and platform capability. "Appropriately protected" means: the least persistent storage that satisfies the offline UX, with the strongest available protection for the data's tier.

| Storage | Script-accessible | Persistence | Allowed content | Notes |
|---|---|---|---|---|
| **Memory (JS)** | Yes | Tab lifetime | Tier C transient values, active signed URLs (§9), optimistic overlays (9.6 §4), session material on shared devices (§8) | First choice for anything sensitive-but-required; lost on tab close/restart by design |
| **`sessionStorage`** | Yes | Tab session | Ephemeral non-sensitive UI state only | Not for tokens, not for private records; cleared on tab close |
| **`localStorage`** | Yes | Indefinite | **Non-sensitive, non-private values only**: theme, language, list density, "remember last salon" preferences — namespaced (`nexora:*`) | **Sensitive records are prohibited here.** Static scan enforces: no private entity data, no tokens, no PII beyond the above |
| **IndexedDB** | Yes | Indefinite | Tier A/B/C records under the 9.7 §5 contract, partitioned per §6, TTL per §11, encrypted per §12 where supported | The only persistence for private offline data; every entry passes the 9.7 §6 read pipeline |
| **CacheStorage** | Yes | Indefinite | Tier A static assets and non-sensitive API snapshots with the §5 contract encoded in headers (9.7 §11) | Never private financial/identity content; denylisted paths excluded by SW routing |
| **Cookies** | No (if `HttpOnly`) | Per policy | Session material only where the cookie transport is used; `HttpOnly` + `Secure` + `SameSite` | Supabase cookie-based auth may use this instead of storage (§8) |
| **Web Crypto (encrypted blobs)** | Yes (key + ciphertext) | Indefinite (data) / tab (key) | Tier C payloads encrypted with an in-memory key (§12) | Defends against offline extraction; not against XSS (§2.2) |

Rules:

1. **No sensitive record in unrestricted `localStorage`** — the single most common leak vector for client caches. Enforcement: code review + static scan rule that bans private entity types, tokens, and PII in `localStorage` writes; `nexora-app.tsx`-level audit at each release.
2. Storage capability is probed at startup (`crypto.subtle`, quota via `navigator.storage.estimate()`, private-mode behavior). Where a capability required by a tier is unavailable, that tier's offline cache **fails closed**: Tier C caching is disabled entirely if `crypto.subtle` is unavailable (§12); quota exhaustion follows 9.2 §5.3.
3. Persistence selection is decided once per (domain, tier) in the cache manager — components do not choose storage.

## 6. Partitioning by authenticated user and tenant

1. **Every private cache entry is scoped by authenticated user + tenant/salon**, in two independent layers (9.7 §10.1): (a) the storage key namespace incorporates `user_id` and tenant/salon scope; (b) the record itself carries `user_id`, `tenant_id`, `salon_id` fields (9.7 §5) which the read pipeline validates (9.7 §6 step 5). The key is convenience; the record field is the boundary.
2. **Key derivation**: `cacheKey = "nexora:" + hash(user_id + ":" + tenant_id) + ":" + domain + ":" + entity_id` where `hash` is a stable non-cryptographic digest (e.g., first 16 hex of SHA-256) — IDs are canonical UUIDs (9.1 §4.1), never display strings.
3. **No cross-tenant read paths**: a query for scope X never enumerates scope Y keys; store indexes are prefixed by the same scope hash. Reading with an empty or mismatched scope returns nothing, not "all".
4. **Single active account**: the app supports exactly one authenticated session at a time. Signing in as user B **purges user A's partitions before B's session starts** (9.3 §10 ordering: teardown → clear → subscribe). Partitioning is the defense-in-depth for any purge failure, not a substitute for it.
5. **Tenant/salon switches** within the same account (owner with multiple salons) tear down and clear the previous salon's private partitions (9.3 §3.3) — an entry from salon X is never served while salon Y is active, even if the same user owns both.

## 7. Clearing triggers

Private cache data **must be cleared** — from IndexedDB, CacheStorage, localStorage namespaced keys, and in-memory stores — on every trigger below. Clearing is immediate (never deferred to idle), ordered before any new session's writes, and verified by read-back (§10.2).

| Trigger | Clear scope | Timing / ordering | Reference |
|---|---|---|---|
| **Logout (explicit sign-out)** | All user-scoped stores, queues, watermarks, in-memory private state | Before `auth.signOut()` completes; synchronous for memory, awaited for IndexedDB/CacheStorage | 9.2 §4.3, 9.3 §3.6, 9.4 §10 |
| **Account switching** | Previous user's complete partitions | Before the new session initializes any subscription or cache write | 9.3 §10.2 |
| **Account deletion** | All of the deleted user's partitions, on every device where present | At deletion confirmation; server also revokes sessions (supabase-admin `signOutAllSessions`-equivalent) | — |
| **Tenant removal** | The removed tenant's/salon's partitions (and queues) | Immediately on revocation detection (9.3 §3.7), before any refetch of the permitted scope | 9.3 §3.7 |
| **Permission revocation** | Partitions of the revoked scope — record-level removal per 9.5 §9.3, plus related collections | Immediate; never resurrected without an authenticated refetch | 9.5 §9.3 |
| **Session invalidation** (expiry, refresh failure, server revocation) | All user-scoped stores and queues (per 9.3 §3.5) | At the moment invalidation is detected — including mid-connection (9.4 §7.3); re-authentication starts from an empty cache (9.7 §10.2) | 9.3 §3.5, 9.4 §7.3 |
| **App upgrade / schema change** | Entries with stale `cache_schema_version` | One-pass purge during activation (9.7 §7) | 9.7 §7 |
| **Idle / shared-device lock** | In-memory stores; full purge on lock expiry per §10.3 | Per shared-device policy | §10 |

Rules:

1. A purge is not complete until a **read-back verification** confirms zero entries remain for the scope (§10.2). Purge failures are logged as security events and retried; the affected scope is not usable until verified.
2. Clearing triggers apply to **all** Nexora apps on the device — the purge runs in whatever client performs the sign-out; other tabs converge via the leader broadcast (9.4 §9) and re-run purge on their own visibility resume.
3. A sign-out that fails partway (network error during `auth.signOut()`) still runs the full local purge — local clearing never depends on server reachability.

## 8. Session and access-token material

Access tokens are not offline-cache data, but their handling determines the blast radius of storage exposure (§2):

1. **No access or refresh token is ever written into an offline cache, the write queue, or any Nexora data store** — the auth client owns session persistence exclusively (`lib/supabaseClient.ts`, `persistSession: true`).
2. **Private devices**: session persistence may remain in the auth client's default storage, subject to compensating controls — access tokens short-lived (~1 h), refresh tokens rotated on use, sign-out clearing the auth storage key, and CSP + no-inline-script hardening to raise the XSS bar.
3. **Shared devices**: session persistence is disabled (`persistSession: false`, memory-only session) — no token touches persistent storage at all (§10).
4. Where the platform supports it, the Supabase cookie transport (`HttpOnly`, `Secure`, `SameSite`) may replace storage-based persistence; `HttpOnly` removes token readability from injected scripts entirely. This is the preferred configuration where cookies are available.
5. The Service Worker must never intercept auth endpoints (`/auth/*`, token refresh); auth traffic bypasses all caches.
6. On session invalidation (§7), the auth storage key is cleared as part of the purge — a stale session must not survive in storage after server revocation.

## 9. Signed URLs

Private signed URLs (documents, images, receipts) embed credentials; they are governed strictly:

1. **Never cached beyond validity**: signed URLs are held in memory for the active view only and are never written to IndexedDB, CacheStorage, localStorage, the offline write queue, or any log. They expire with the view; on teardown (9.3 §3, 9.4 §10) they are dropped.
2. **Validity is server-set and short**: the server issues signed URLs with the minimum validity the view needs (default 5 minutes, hard maximum 15 minutes), scoped to the authenticated request (9.1 §2). The client never extends, re-signs, or caches them.
3. **Expiry behavior**: on expiry (or on any 401/403 while displaying), the client discards the URL, shows a placeholder ("Link expired — refresh to view"), and fetches a fresh URL only through the authorized endpoint on explicit user action or automatic refresh while `Live` (9.4). An expired URL is never served from cache — it cannot be, because it was never cached.
4. **Transport**: requests to signed URLs bypass the Service Worker cache (network-only, `cache: "no-store"`). Responses are likewise never written into CacheStorage by SW logic.
5. **Containment**: signed URLs never appear in payloads of other events, in queue entries, in logs (9.4 §12), or in analytics.

## 10. Shared-device behavior

### 10.1 Shared-device mode

- The sign-in screen offers **"This is a shared device"** (opt-in, remembered per device in a non-sensitive preference). When enabled:
  - Session persistence is disabled (memory-only session, §8.3) — closing the tab or signing out leaves no token in storage.
  - Offline caching of private data is **disabled entirely**; only Tier A public content may remain cached, and it is purged on sign-out too.
  - Idle auto-lock: after 15 minutes of inactivity the session is signed out and the purge runs (§10.2).
- On shared devices without the toggle, the §10.2 purge still runs on every sign-out — the toggle is defense-in-depth, not the only control.

### 10.2 Purge verification

Every purge (any trigger in §7) ends with a **read-back check**:

```ts
async function purgeAndVerify(scope: AuthScope): Promise<void> {
  await purgeAllUserStores(scope);            // IndexedDB stores, CacheStorage, localStorage keys, queues
  const remaining = await enumerateRemaining(scope);
  if (remaining.length > 0) {
    logSecurityEvent("purge-incomplete", scope);  // never log content
    await purgeAllUserStores(scope, { force: true }); // retry once
  }
}
```

If verification still fails, the scope is marked unusable (reads return "No offline data"), the security event is escalated (9.4 §11.7), and a full storage reset is offered to the user.

### 10.3 Preventing one user from viewing another user's cached information

1. **Ordering** (9.3 §10): user B's session may not initialize any subscription or cache write until user A's partitions are purged **and verified** (§10.2).
2. **Partitioning** (§6): even a failed purge cannot cross partitions — B's reads are keyed and field-validated to B's scope.
3. **Back/forward cache (bfcache)**: browsers may restore the previous user's in-memory page state after sign-out. On `pageshow` with `event.persisted === true`, the app re-validates the session; if absent, it re-runs the purge and redirects to sign-in. In-memory private state is not trusted across `pagehide`/`pageshow` boundaries.
4. **Kiosk/demo**: kiosk deployments additionally disable account switching and auto-sign-out on idle (configurable, documented in the deployment runbook).
5. **Testing**: the §14 suite includes sign-out → sign-in-as-B with read-back enumeration proving zero A entries in every store.

## 11. Retention policy — short, documented, privacy-aligned

### 11.1 Retention table

Retention is per record, counted from `cached_at` (9.7 §5), and is the **maximum** the app keeps data in the absence of user action; every §7 trigger clears earlier.

| Data | Freshness TTL (9.2 §5.2) | Aged mode (9.7 §4.4) | Hard purge (max retention) |
|---|---|---|---|
| Tier A — static/public | 60 min | Allowed | 24 h from `cached_at` |
| Tier B — user-scoped informational | 15 min / 5 min / 24 h per domain | Allowed, ≤ 30 min cap | 24 h from `cached_at` |
| Tier C — freshness-critical | 5 min | Never (9.7 §3) | 24 h from `cached_at` (typically discarded at TTL) |
| Tier D — financial/entitlement | n/a — never cached | n/a | n/a |
| Offline write queue (9.2 §4.2) | n/a | n/a | 7 days max, then discarded + user notified |
| In-memory transient (signed URLs, overlays) | n/a | n/a | Tab/teardown lifetime |

### 11.2 Cleanup and documentation

1. **Cleanup job**: on app start, on visibility resume, and every 24 h (idle), the cache manager sweeps entries past their hard purge, plus orphaned/partial entries (9.7 §7). Quota pressure triggers earlier eviction per 9.2 §5.3.
2. **Documented**: the retention table is mirrored in the application's **privacy policy**, including: what is stored offline, where, for how long, the §7 clearing triggers, and shared-device behavior. The privacy policy is the user-facing contract; the table must not drift from it.
3. **User control**: a "Clear offline data" control in settings performs an immediate purge + verification (§10.2) and reports completion; it is available in every portal.
4. **Retention is a maximum, not a target**: default behavior deletes at TTL; hard-purge values exist as upper bounds and for anomaly handling (e.g., app not opened for a day — data is not "preserved" for the user).

## 12. Encryption at rest and integrity

1. **Policy by tier** (aligning 9.2 §5.4 with platform capability):
   - **Tier C** (freshness-critical, user-scoped): payloads are encrypted in IndexedDB with **AES-GCM** using a key generated per session (`crypto.subtle.generateKey`, non-extractable where supported) and held **in memory only**. After a tab/restart the key is gone, the cache is unreadable, and entries are treated as discarded (they would be expired anyway per TTL). If `crypto.subtle` is unavailable, Tier C offline caching is **disabled** (fail closed, §5 rule 2).
   - **Tier A** (public) and **Tier B** (non-sensitive informational): encryption optional; integrity via the 9.7 §5 `checksum` on every read is mandatory regardless.
   - **Tier D and denylisted data**: never present (§4).
2. **Key management**: the cache key never leaves memory and is never serialized; there is no persisted key, because a persisted key would negate the protection (and would be readable by injected scripts, §2.1). Consequence — cache loss on restart — is accepted and documented.
3. **Integrity**: every cached record carries `checksum` (9.7 §5), verified on every read (9.7 §6 step 3). Integrity protects against corruption and casual tampering; it is not a security boundary against injected scripts (which could recompute checksums) — the denylist and minimization are (§2.2).
4. **Scope-field integrity**: `user_id`/tenant/salon fields are included in the checksummed canonical payload, so a scoped record cannot be silently re-scoped by corruption.

## 13. Audit, monitoring, and incident handling

1. **Log (never content)**: cache writes by class/domain, purges with trigger + scope, denylist write attempts (`error` + security event), wrong-scope reads (`warn`), purge verification failures (`error` + escalation), retention sweep counts (`debug`). Scope IDs only — no payloads, tokens, signed URLs, financial values, or PII (9.4 §12, 9.7 §8.5).
2. **Security events** (wrong-scope records, denylist attempts, incomplete purges) are reported through the monitoring pipeline (9.4 §11.7) and trigger the incident procedure.
3. **Incident: suspected script injection / storage exposure** — immediately: revoke the session (server-side), rotate refresh tokens, invalidate all issued signed URLs, force sign-out on all devices, purge local storage, and follow the operations runbook. The denylist (no secrets in storage) is what makes this incident *containable*.
4. **Release gate**: each release runs the static scans (§5 rule 1, §14) and re-verifies the §4 gates before deploy.

## 14. Implementation acceptance checklist for 9.8

- [ ] Denylist enforced at three independent gates (server `no-store` + projections, SW routing, cache-layer refusal); each gate has its own passing test, and a combined test proves a denylisted write fails even when one gate is bypassed.
- [ ] Field projections (§3.2) are implemented server-side and validated client-side; a cache write containing an excluded field is refused and logged as a security event.
- [ ] No sensitive record, token, or PII exists in `localStorage` (static scan passes; grep for private entity types and token keys in localStorage writes returns zero).
- [ ] Storage selection matrix enforced: Tier C disabled when `crypto.subtle` unavailable (fail-closed test); storage capability probe runs at startup.
- [ ] Partitioning: entries keyed and record-validated by user + tenant; cross-tenant/cross-user read tests return zero rows; salon-switch clears the previous salon's partitions.
- [ ] All §7 clearing triggers tested with read-back verification; purge runs even when `auth.signOut()` fails (network-cut test); bfcache restore re-validates and re-purges.
- [ ] Session material: no token in any offline store (enumeration test); shared-device mode uses memory-only session and disables private offline caching; cookie transport used where available.
- [ ] Signed URLs: never persisted (enumeration test after view teardown), never in logs; expiry shows placeholder and refetches only via authorized endpoint; SW bypass verified.
- [ ] Shared device: sign-out → sign-in-as-B with full store enumeration proves zero A entries; idle auto-lock purges.
- [ ] Retention: TTL, aged-cap, and hard-purge values enforced; cleanup job tested; privacy policy documents the retention table and user control ("Clear offline data") works with verification.
- [ ] Encryption: Tier C entries unreadable after restart (key in memory); checksum verified on every read including scope fields.
- [ ] Incident drill: simulated script access to storage exfiltrates no token, no signed URL, no financial value (denylist effectiveness test).

## 15. Change control for 9.8

Any modification to the denylist, field projections, storage matrix, partitioning scheme, clearing triggers, signed-URL policy, shared-device behavior, retention values, or encryption policy requires:
- Privacy review and privacy-policy update (retention documentation must stay in lockstep)
- Threat-model review (injected-script scenario; cross-account/cross-tenant exposure; device-loss exposure)
- Static-scan and denylist test updates
- Storage/quota impact analysis (9.2 §5.3)
- Update to this specification before release.

---

**Sub-point:** 9.9 — Offline Write Policy  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

**Never simulate server success while offline.** No queued, drafted, or locally stored write may ever be presented as server-confirmed state. This section formalizes 9.2 §4 (restricted offline writes and the write queue) into an explicit **four-policy taxonomy**, assigns one policy to **every** write action in a machine-enforced registry, and defines the outbox, flush, and conflict machinery that makes queued writes safe.

Governing rules:

1. **Every write action must be assigned exactly one explicit offline policy**: `disabled_offline`, `draft_only`, `queued`, or `online_required` (§2). The assignment lives in a single action-policy registry (§3); a mutation with no registry entry cannot execute.
2. **Queueing is permitted only when all eight conditions of §4 hold** — idempotent endpoint, safe retry, stable idempotency key, versioned payload schema, no dependence on unverified stale state, no duplicate financial/business effects, explicitly defined conflict behavior, and queued data safe to store locally.
3. **High-risk actions are online-only** unless a separately reviewed protocol proves safe (§9): payments, refunds, payouts, booking confirmation, role changes, verification decisions, ownership transfers, commission settlement, and document approvals.
4. **A queued operation is a request, never a result.** It reserves nothing, confirms nothing, and becomes authoritative only when the server commits it during flush (§6) — and then only with the server's response as evidence (9.6 §3.5).
5. Pending queued items are rendered per 9.6 §3 (visible pending marker, preserved confirmed state, no timeout-to-success); cached and authoritative state are never mutated by queued items (9.5 §4.3).

## 2. Policy taxonomy

| Policy | Definition | Offline UI affordance | Persistence | Submission path |
|---|---|---|---|---|
| **`disabled_offline`** | The action requires an active server connection. No local write path exists beyond in-memory form state. | Control disabled with reason: "Requires a connection" (9.4 §3, 9.7 §4.3) | None (form state in memory only; lost on teardown unless a separately approved draft path exists, §2.1) | Online only, normal mutation |
| **`draft_only`** | Input may be saved locally, but it is **not submitted** — by the system or automatically. Submission is a separate, explicit user action governed by its own policy. | "Save draft" enabled; "Submit" affordance gated by the submission action's policy | IndexedDB drafts store, user-scoped, projection-limited, TTL 30 days, purged on sign-out (9.2 §4.3, 9.8 §10) | Explicit submit only; submit action policy applies |
| **`queued`** | A validated operation is written to the outbox with a stable idempotency key and submitted automatically when connectivity returns. | "Save for later — send when online" enabled; item shows pending state (§8) | Outbox store (IndexedDB), user-scoped, per §5 | Automatic flush per §6 with server re-validation |
| **`online_required`** | The action cannot proceed until authoritative data for its dependency scope has been refreshed. Once fresh, it proceeds as a normal online mutation. | Control disabled with "Refreshing data required"; auto-enabled when the scope's resync completes (9.4 §6.2) | None beyond the refreshed data | Online mutation after the required refresh |

### 2.1 Rules

1. **Exactly one policy per action**, registered in §3. An action may additionally offer a draft-only *input* path (e.g., a document-upload draft) where separately approved, but the action's submission policy is what governs the write — a draft is never auto-promoted to queued or submitted.
2. **Policy is a property of the action, not of the moment.** The connection state (9.4) decides whether a queued action enqueues now or submits directly; it never changes the policy itself.
3. `draft_only` extends 9.2 §4.1 by this amendment: drafts are local input records, not writes to server state, and are governed by 9.6 §2.2's draft allowlist.
4. Policy decisions are enforced in the UI from the connection state + registry (9.4 §2) and re-checked server-side where the server can (§11) — never by per-component logic.

## 3. Action policy registry — every write action

### 3.1 Registry

The registry is a single, versioned module (`lib/offline/action-policies.ts`) listing every mutation the clients can perform. **No mutation may execute without an entry.** A new mutation with no entry fails closed at the mutation gateway.

| Action | Policy | Rationale / dependency | Conflict policy (§7) |
|---|---|---|---|
| Mark notification read | `queued` | Idempotent RPC; 9.2 §4.1; 9.6 §2.2 | Replay → success; no conflicts |
| Non-sensitive preference update | `queued` | Idempotent; 9.2 §4.1; 9.6 §2.2 | Server version wins (9.5 §4.3) |
| Draft save (service request, review, profile edit) | `draft_only` | 9.6 §2.2 — never submitted automatically | n/a (local) |
| Service request / proposal submission | `queued` | 9.2 §4.1; server re-validates at flush | Rejection → discard + notify, promote to draft |
| Booking creation (customer request) | `queued` | 9.2 §4.1; 9.7 §9 — snapshot basis required; server re-validates availability/prices at flush | Rejection → discard + notify with rebook option |
| Booking reschedule / cancel | `queued` | 9.2 §4.1; depends on current booking state — snapshot required (§4 cond. 5) | Rejection → promote to draft + notify |
| Own profile update (non-sensitive fields) | `online_required` | Depends on fresh profile state to avoid overwriting concurrent changes | Server wins; diff surfaced |
| Payment initiation | `disabled_offline` | Financial; provider SDK requires network; 9.1 §6 | — |
| Refund approval | `disabled_offline` | High-risk (§9) | — |
| Payout processing | `disabled_offline` | High-risk (§9) | — |
| Commission settlement | `disabled_offline` | High-risk (§9) | — |
| Booking confirmation (staff/owner) | `disabled_offline` | High-risk (§9); cross-user commitment | — |
| Role change / assignment | `disabled_offline` | High-risk (§9); authorization (9.3 §3.7) | — |
| Ownership transfer | `disabled_offline` | High-risk (§9) | — |
| Verification decision | `disabled_offline` | High-risk (§9) | — |
| Document approval | `disabled_offline` | High-risk (§9) | — |
| Review publication | `disabled_offline` | Cross-user visibility (9.6 §2.3) | — |
| Availability hold / inventory reservation | `disabled_offline` | Server-authoritative holds (9.1 §2) | — |
| Staff schedule / salon configuration changes | `disabled_offline` | 9.2 §4.1: online only | — |
| Sign-out / portal switch | *(local)* | Not a server write; triggers full purge (9.2 §4.3, 9.4 §10) | — |

### 3.2 Enforcement

1. **Mutation gateway**: every mutation call passes through a wrapper that (a) looks up the action's policy, (b) checks the connection state, (c) routes: direct submit (online, fresh scope), enqueue (queued + offline), block with reason (disabled_offline / online_required not yet fresh), or draft save (draft_only). A missing registry entry aborts the call.
2. **Static completeness test**: the test suite enumerates all exported mutation functions and asserts a registry entry exists for each — no unregistered mutation can ship.
3. The registry is versioned; policy changes are change-controlled (§14) and every entry cites its conflict policy (§7) and qualification evidence (§4).

## 4. Queueing qualification — the eight conditions

An action may be assigned `queued` **only when all eight** conditions below hold. Each is verified before the action enters the registry and re-verified on any endpoint/payload change.

| # | Condition | Requirement | Verification |
|---|---|---|---|
| 1 | **Idempotent endpoint** | The server endpoint honors `Idempotency-Key`: replay returns the original result and causes no second effect (9.5 §5.3) | Replay test: same key sent twice → one business effect, identical responses |
| 2 | **Safely retryable** | Retry at any point (including after timeout or crash mid-request) is harmless; follows from 1 | Crash-resume test: kill the tab mid-flush, restart, re-submit same key |
| 3 | **Stable idempotency key** | One key per logical operation, generated at enqueue, persisted with the item, reused for every attempt, never reused across operations (9.6 §3.4) | Key-stability test incl. restart |
| 4 | **Versioned payload schema** | Payload carries `payload_schema_version`; the server rejects unknown versions; changes are additive or new-versioned | Schema-version rejection test |
| 5 | **No dependence on unverified stale state** | Either the action is state-independent, or the outbox item records its exact snapshot basis (`entity_type`, `entity_id`, `version`, `server_updated_at`) and the server re-validates at flush; freshness-critical inputs must be within TTL at enqueue (9.7 §3) | Snapshot-recording test; stale-snapshot rejection test |
| 6 | **No duplicate financial/business effects** | Duplicate submission cannot create duplicate charges, bookings, requests, or effects — proven by 1 + business-rule review | Duplicate-submission test at the server |
| 7 | **Explicitly defined conflict behavior** | The registry entry names its conflict policy (§7) for every plausible rejection | Conflict-injection tests per action |
| 8 | **Queued data safe to store locally** | Payload passes 9.8 §3 projection rules and the 9.8 §4 denylist; stored in the user-scoped outbox with §5 protections | Storage-safety review + denylist scan of the outbox store |

If any condition fails, the action is `disabled_offline` (or `online_required`) until the gap is closed through change control (§14).

## 5. Outbox specification

### 5.1 Store

The outbox is the IndexedDB `offline_write_queue` store of 9.2 §4.2, extended and formalized as follows (this schema supersedes the 9.2 §4.2 item shape):

```ts
type OutboxItem = {
  id: string;                      // uuid
  idempotency_key: string;         // stable UUID per logical operation (§4 cond. 3)
  action: string;                  // registry action id (e.g., "booking:create")
  endpoint: string;                // canonical endpoint/RPC identifier
  payload: object;                 // minimal projection, schema-versioned
  payload_schema_version: number;  // §4 cond. 4
  auth_scope: { user_id: string; tenant_id: string | null; salon_id: string | null };
  snapshot?: {                     // required when the action depends on state (§4 cond. 5)
    entity_type: string;
    entity_id: string;
    version: number;
    server_updated_at: string;
  };
  state: "pending" | "submitting" | "succeeded" | "failed_transient"
       | "failed_permanent" | "superseded" | "expired";
  attempt_count: number;
  next_attempt_at: number | null;
  last_error_code: string | null;  // code only — never content (9.8 §13)
  created_at: number;              // local clock — display/TTL only (9.5 §4.4)
  updated_at: number;
  max_age_ms: number;              // 7 days per 9.8 §11.1
};
```

### 5.2 Rules

1. **One item per `idempotency_key`.** Double-tap enqueue deduplicates by key; the second tap returns the existing item.
2. **Ordering**: FIFO within `(user_id, tenant_id, salon_id)` scope, with dependency awareness — an item whose snapshot scope failed to refresh is skipped (held `pending`) until its scope is fresh (§6.3), never failed for that reason alone.
3. **Capacity**: hard limit 50 items per user. On overflow the app **blocks new queueing** with an explanatory message (never silently drops, never evicts a queued item).
4. **Security**: outbox payloads follow 9.8 §3 projections and the 9.8 §4 denylist; payloads containing private data (booking/service requests) are encrypted per 9.8 §12 with the in-memory key — if encryption is unavailable for a payload class that requires it, that action **fails closed to `disabled_offline`**.
5. **Lifecycle**: items are purged on sign-out, account switch, tenant removal, session invalidation (9.2 §4.3, 9.8 §7); items expire at `max_age_ms` (7 days) → `expired`, discarded, user notified (9.8 §11.1).
6. **Never authoritative**: outbox items never update caches, watermarks, or confirmed state (9.5 §4.3); they only feed the pending UI (§8) and the flush protocol (§6).

### 5.3 Operation state machine

```text
                ┌────────── retry (same key, 9.4 backoff) ──────────┐
                ▼                                                  │
pending ──► submitting ──► succeeded        (removed from outbox; caches invalidated)
                │
                ├──► failed_transient ──► (retry scheduled via next_attempt_at) ──► submitting
                ├──► failed_permanent ──► (notified; promoted to draft or discarded per conflict policy)
                ├──► superseded        (a newer user action replaced it; discarded)
                └──► expired           (max_age reached; discarded + notified)
```

Transitions are guarded by the current epoch (9.4 §2.2) and are idempotent — a crash at any point leaves the item resumable with the same key (§4 cond. 2).

## 6. Submission and flush protocol

### 6.1 Flush triggers

- `online` event + probe success (9.4 §5.1);
- visibility resume (9.4 §5.2);
- app start with a valid session;
- leader takeover (9.4 §9.1);
- manual "Sync now" / "Retry" (9.7 §4.4).

### 6.2 Ordered reconnection sequence

After the connection machine leaves `offline`/`reconnecting`, the **leader tab** (9.4 §9.1) runs, in order:

1. **Verify session** (9.4 §7) — no flush with a stale token.
2. **Resync authoritative scopes** (9.4 §6.2) — flush decisions must run against fresh server state. Items whose dependency scope failed to resync are held `pending` and retried on the next window; they are not failed.
3. **Flush the outbox**: iterate FIFO within scope; submit each item with its `idempotency_key`; bounded concurrency (≤ 3 in flight); bounded by 9.4 §4 backoff on transient failure.
4. **Handle responses** per §6.3; on success, invalidate affected caches (9.2 §5.1) and reconcile derived state (badges per 9.5 §8.2).
5. **Surface per-item outcomes** in the outbox UI (§8); if any item entered `failed_permanent`, notify the user with the recovery path.

### 6.3 Response handling

| Response | Outcome |
|---|---|
| 2xx with authoritative state | `succeeded`; remove item; apply server state write-newer-only (9.5 §4.3); invalidate affected caches |
| 2xx replay (key already known) | `succeeded` — the original result is returned; same handling (9.5 §5.3) |
| 409 / 422 conflict | Per the action's conflict policy (§7): discard + notify, promote to draft, or apply server result — never auto-retry |
| 4xx validation / schema-version | `failed_permanent`; notify; promote payload to draft for editing |
| 401 / 403 / RLS | `failed_permanent`; purge item + scope state (9.5 §9.3); recovery action per 9.4 §8.2; no retry |
| 5xx / network / timeout | `failed_transient`; retry with same key, bounded by 9.4 §4 backoff; timeout never becomes success (9.6 §3.7) — the outcome query of 9.6 §5 resolves ambiguity |

### 6.4 Flush safety rules

1. **Leader-only flush** (9.4 §9.1); followers never flush. Two tabs submitting the same key concurrently are safe by construction (idempotency) but must not happen by design.
2. **Never flush while `offline` or with a stale session** (§6.2 step 1).
3. A flush batch is resumable: items not attempted remain `pending`; items `submitting` at crash are re-submitted with the same key on the next flush (replay-safe).
4. Flush results are logged at `debug` (action, key hash, outcome); never payload content (9.8 §13).

## 7. Conflict behavior

### 7.1 General conflict matrix

| Conflict class | Detection at flush | Default resolution | Auto-retry? |
|---|---|---|---|
| Idempotent replay | server returns original result for the key | Treat as success; apply server state | — |
| Stale-state rejection (availability, prices, booking state changed) | 409/422 with structured reason | The action's registered conflict policy (§3): discard + notify, promote to draft, or apply server result | Never |
| Validation failure | 4xx validation | `failed_permanent`; promote to draft; notify | Never |
| Authorization failure | 401/403/RLS | `failed_permanent`; purge per 9.5 §9.3; recovery action (9.4 §8.2) | Never |
| Payload/endpoint incompatibility | 400 schema-version | `failed_permanent`; notify; app-upgrade path | Never |
| Duplicate business effect | — | Impossible by construction (§4 cond. 6); any occurrence is an incident (9.4 §11.7) | — |

### 7.2 Explicit conflict policies per action (registry §3)

- **Mark notification read** — idempotent; replay is success; no conflict path exists.
- **Preference update** — last-write-wins by server version; conflict → server state applies (9.5 §4.3), local overlay discarded.
- **Booking create** — server re-validates availability/prices/authorization at flush (9.7 §9); on rejection → discard + notify with a rebook option carrying the rejected input as a draft.
- **Booking reschedule/cancel** — server re-validates against the current booking state; on rejection → promote to draft + notify; the local snapshot is never used to override the server.
- **Service request/proposal submission** — same pattern as booking create.

Any queued action whose conflict behavior is not explicitly defined in the registry fails §4 cond. 7 and must not be queued.

## 8. Never simulate server success — UI and behavior rules

### 8.1 Prohibited patterns

1. **No confirmed styling for queued items**: no success toasts, green "Confirmed" chips, checkmarks, or "Sent" states derived from local enqueue (9.6 §3.2, 9.7 §8).
2. **No client-minted reference numbers**: the app never generates booking/reference/order numbers that resemble server-issued ones; references appear only from server responses.
3. **No local flags as truth**: the app never writes "submitted", "completed", or "confirmed" flags into authoritative state for a queued item (9.5 §4.3).
4. **No timeout-to-success**: an unresolved flush attempt is `submitting`/`failed_transient`/`resolving` — never `succeeded` (9.6 §3.7).
5. **No restart promotion**: after a tab/device restart, persisted items return as **pending**, not confirmed; re-flush with the same key resolves them (idempotent).
6. **No badge/counter claiming server state** while unsynced items exist (9.5 §8.2): e.g., a notification badge may show "(cached)" until reconciled.

### 8.2 Required outbox UI

- A persistent outbox indicator (count of pending items) in the authenticated header: "2 changes waiting to sync".
- An outbox list with per-item state and actions: **Pending — will be sent when online** / **Retrying…** / **Failed — retry** (manual retry, same key) / **Rejected — review** (opens the promoted draft) / **Edit** (supersedes the item — new logical operation, new key, old item marked `superseded`) / **Cancel** (discards the queued request).
- Server confirmation is the only event that moves an item to "Sent/Confirmed", and it must come from the §6.3 response path (9.6 §3.5).
- Accessibility: pending states are text + icon + `aria-live` (9.4 §3.6).

## 9. High-risk actions: online-only unless separately reviewed

### 9.1 Denylist

The following are `disabled_offline` **by default** and may become queueable **only** through the separately reviewed protocol of §9.2:

| Action | Risk basis |
|---|---|
| Payment initiation / processing | Financial; provider SDK network dependency; 9.1 §6 (server verification required) |
| Refund approval | Financial; irreversible in effect |
| Payout processing | Financial + compliance |
| Commission settlement | Financial |
| Booking confirmation | Workflow commitment; cross-user visibility |
| Role change / assignment | Authorization (9.3 §3.7) |
| Ownership transfer | Authorization + financial |
| Verification decision | Compliance |
| Document approval | Compliance |

### 9.2 The separately reviewed protocol

To move a high-risk action off `disabled_offline`, a written protocol must prove safety and pass review **before** any code changes. Minimum contents:

1. **Threat model & risk assessment** covering: offline window, device loss, replay, clock, cross-account exposure (9.8), and injection scenarios — signed off by security review.
2. **Idempotency design** with replay and duplicate-effect tests (both financial and business-effect assertions) passing.
3. **Explicit conflict and reconciliation spec** per §7, including compensation/rollback semantics if a partially applied effect is possible.
4. **Outbox security review** per 9.8: payload minimization, encryption, scope partitioning, retention.
5. **Financial audit trail requirements**: every committed effect attributable to the outbox flush must appear in server audit logs with the idempotency key.
6. **Fault-injection suite**: crash mid-flush, double-submit, key replay, timeout, partial batch, server restart.
7. **Load test** of the flush path under §6 concurrency bounds.
8. **Specification amendment** through §14 change control, updating the registry.

If any requirement fails, the action remains `disabled_offline`. No high-risk action is currently queued; the denylist is the default and the protocol is the only exception path.

## 10. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Queued writes remain RPC/API driven; realtime events confirm or reject after flush; offline queues never bypass RLS (9.1 §5.6) |
| 9.2 | Outbox extends the 9.2 §4.2 queue (schema superseded by §5.1); purge rules and queue safety apply unchanged |
| 9.4 | Enqueue only while `offline`/`reconnecting`; flush on §6.1 triggers; leader-only flush (9.4 §9); epochs guard all transitions |
| 9.5 | Idempotency keys (9.5 §5.3), write-newer-only (9.5 §4.3), watermarks untouched by queued items |
| 9.6 | Queued items render as pending per 9.6 §3; optimistic overlays never mark queued business effects confirmed; resolution paths shared (9.6 §5) |
| 9.7 | Gating matrix (9.7 §9) drives enqueue eligibility; snapshots must be fresh (9.7 §3); offline rendering rules apply to the outbox UI |
| 9.8 | Outbox storage safety: projections, denylist, encryption, partitioning, retention (7 days), purge on all clearing triggers |

## 11. Server-side requirements

1. **Idempotency is mandatory for queued-class endpoints**: the server requires and honors `Idempotency-Key`, stores the result keyed by it, and replays the stored result — with key retention ≥ outbox max age + grace (30 days minimum).
2. **Re-validation at flush**: the server re-validates availability, prices, permissions, and business rules at submission time. A queued request is never a pre-authorization or reservation created offline (9.1 §2 holds: the database commits nothing before flush).
3. **Structured rejections**: conflicts return 409/422 with a machine-readable reason code and affected fields; validation returns 422; schema-version mismatches return 400 with the accepted version.
4. **Outcome query** per 9.6 §5 for timeout resolution.
5. **Audit**: idempotency replays and flush-originated commits are logged (key, action, outcome — never payload content) and available to the §9.2 financial audit trail where applicable.
6. **Rate limiting** of flush bursts per 9.4 §11.3; a client flushing 50 items at once must not trip per-user limits designed for human cadence — limits distinguish burst-flush from abusive reconnects.

## 12. Edge cases

| Edge case | Handling |
|---|---|
| Crash mid-flush | Item `submitting`; restart re-submits the same key; server replays the original result (§4 cond. 2) |
| Two tabs flush same key | Impossible by design (leader-only, 9.4 §9); harmless if it occurs (idempotent) — verified by test |
| Double-tap enqueue | Dedupe by `idempotency_key` (§5.2) |
| User edits a queued item | Old item `superseded` (discarded locally); new item enqueued with a **new** key (new logical operation) |
| Queue full (50 items) | New queueing blocked with message; nothing dropped; user prompted to review/reduce |
| Item older than 7 days | `expired`; discarded + notified on next flush (9.8 §11.1) |
| Payload schema upgraded mid-queue | Old-version items: server 400 → `failed_permanent`, notified; additive migrations may re-enqueue via change control |
| Endpoint removed/changed | `failed_permanent` + notify; app-upgrade path |
| Offline longer than snapshot TTL | Items with stale snapshots are held `pending` (not failed); they flush only after the dependency scope resyncs (§6.3); if the underlying data changed, conflict policy decides |
| Sign-out / account switch with queued items | Outbox purged (9.2 §4.3); items never survive across accounts (9.8 §7) |
| Flush while another tab signs out | Epoch + leader election: the flush stops; purge wins (9.4 §10) |

## 13. Implementation acceptance checklist for 9.9

- [ ] Every mutation has exactly one registry entry with a policy; the static completeness test passes; an unregistered mutation fails closed at the gateway.
- [ ] No code path simulates server success: UI tests prove queued items never show confirmed styling, references, or state; the timeout and restart scenarios leave items pending.
- [ ] Each `queued` action's eight §4 conditions are documented and verified (replay, crash-resume, key-stability, schema-version, snapshot, duplicate-effect, conflict-policy, storage-safety tests all pass).
- [ ] Outbox implements §5: schema, key dedupe, FIFO with dependency holds, 50-item capacity with block-on-overflow, encryption per 9.8 §12, 7-day expiry, purge on all clearing triggers.
- [ ] Flush protocol: leader-only, ordered after session verify + resync (§6.2), bounded concurrency, per-item state machine, idempotent crash resume, per-response handling per §6.3.
- [ ] Every queued action's conflict policy is explicit in the registry and exercised by conflict-injection tests (§7).
- [ ] High-risk actions: all nine §9.1 actions are `disabled_offline`; the §9.2 protocol is documented and no exception has been granted without it.
- [ ] Server: idempotency required + replay test, structured 409/422/400 codes, outcome query, key retention ≥ 30 days, audit logging without content.
- [ ] Edge cases of §12 are covered by automated tests (crash, double-tap, supersede, overflow, expiry, schema upgrade, stale snapshot, cross-tab sign-out).
- [ ] Outbox UI: indicator, per-item states with distinct labels, manual retry/edit/cancel, confirmation only from server responses, `aria-live` on state changes.

## 14. Change control for 9.9

Any modification to the policy taxonomy, the registry (new action, policy change, conflict-policy change), the qualification conditions, the outbox schema, the flush protocol, or the high-risk denylist requires:
- Policy review against §2/§4 criteria and the §9.2 protocol where applicable
- Security review (threat model: replay, stale-state, cross-account, injection)
- Regression of the full fault-injection suite (crash, replay, conflict, overflow, expiry)
- Privacy/storage review per 9.8 for any new queued payload
- Update to this specification before release.

---

**Sub-point:** 9.10 — Typed Outbox  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

The outbox of 9.9 §5 is **typed**: every operation is a first-class, schema-validated record with a fixed envelope, an explicit state machine, and processing guarantees. Typing exists so that every guarantee of 9.9 — idempotent replay, safe retry, no simulated success, no cross-account sends, no secrets — is *enforced by construction* at the storage and processing layers, not by convention.

Governing rules:

1. **Every queued operation contains all thirteen required fields** of §2. An operation missing any field is malformed: refused at write, never claimed, discarded and logged (9.8 §13).
2. **Operations transition through the eight allowed states** of §3 (`draft`, `queued`, `syncing`, `confirmed`, `failed`, `conflict`, `expired`, `cancelled`) via the §3 transition machine only. No state is set by convention.
3. **The outbox processes operations in a controlled order** (§4), **never processes the same operation concurrently** (§4), **retries with bounded exponential jitter and only transient failures** (§5), and **re-verifies authentication, user, tenant, role, and ownership before every send** (§6) — including the hard rule that **an operation created by a previously signed-in account is never sent** (§6.4).
4. **Confirmed operations are removed or safely archived** (§7); **pending, failed, and conflicted actions have visible status** with **safe retry or cancellation where appropriate** (§8).
5. **The outbox never stores secrets, access tokens, payment credentials, or sensitive documents** (§9); the write gate enforces 9.8 §3–§4 at enqueue time.

This section supersedes the 9.9 §5.1 item shape and the 9.9 §5–§6 processing rules where they conflict; 9.9's registry, qualification conditions, flush triggers, and conflict policies continue to apply unmodified.

## 2. Typed operation model

### 2.1 Schema

Every operation is an `OutboxOperation<T>` record with **exactly** the following required fields:

```ts
type OpType = "notification:mark_read" | "settings:update" | "booking:create"
  | "booking:reschedule" | "booking:cancel" | "service_request:submit";
// OpType values are drawn from the action registry (9.9 §3), never invented locally.

type OutboxState = "draft" | "queued" | "syncing" | "confirmed"
  | "failed" | "conflict" | "expired" | "cancelled";

type DependencyRef =
  | { kind: "op"; op_id: string }                       // op must be confirmed first
  | { kind: "entity"; entity_type: string; entity_id: string; min_version?: number };

interface OutboxOperation<TPayload = unknown> {
  op_id: string;                    // unique operation ID
  idempotency_key: string;          // stable idempotency key
  op_type: OpType;                  // operation type (registry action id)
  payload: { schema_version: number; data: TPayload }; // versioned payload
  user_id: string;                  // authenticated user ID (creator)
  tenant_id: string | null;         // tenant scope
  salon_id: string | null;          // salon scope
  created_at: number;               // creation timestamp (local; display/TTL only, 9.5 §4.4)
  last_attempt_at: number | null;   // last-attempt timestamp
  attempt_count: number;            // attempt count
  state: OutboxState;               // current state
  endpoint_version: string;         // required endpoint version
  dependencies: DependencyRef[];    // dependency references (empty when none)
  expires_at: number;               // safe expiration time
}
```

### 2.2 Field rules

| # | Field | Source | Rules |
|---|---|---|---|
| 1 | `op_id` | Generated at creation (UUID) | Unique per operation; never reused, never re-derived; key of the outbox store |
| 2 | `idempotency_key` | Generated at creation of the **logical** operation (UUID) | Stable across all retries; unique per logical operation; one outbox entry per key (9.9 §5.2); a user edit creates a new logical operation with a new key (9.9 §12) |
| 3 | `op_type` | Action registry (9.9 §3) | Every value maps to exactly one policy; unknown `op_type` is refused at write |
| 4 | `payload` | Client, from typed inputs | `schema_version` per 9.9 §4 cond. 4; validated against the per-type projection (9.8 §3) and denylist (§9) at write; server rejects unknown versions |
| 5 | `user_id` | **Bound at creation from the session — never caller-supplied** | The purge and pre-flight boundary (§6.4); an operation whose `user_id` differs from the current session is never claimed |
| 6 | `tenant_id` / `salon_id` | Bound at creation from the current scope | Must match the current scope at send time or the op is held (§6.3); tenant removal purges (9.8 §7) |
| 7 | `created_at` | Local clock at creation | Display and TTL anchor only — never ordering authority (9.5 §4.4) |
| 8 | `last_attempt_at` | Set on every send attempt | Updated when the op is claimed (`syncing`), including retries; `null` until the first attempt |
| 9 | `attempt_count` | Incremented on every send attempt | Incremented on send, not on holds or skips; no hard cap — bounded by `expires_at` and §5 rate limits |
| 10 | `state` | §3 machine only | Persisted atomically with claims (§4); never set by components |
| 11 | `endpoint_version` | From the registry entry | The endpoint contract version required by this op (e.g., `"bookings/v2"`); server rejects mismatch with 400 + accepted version (§10) |
| 12 | `dependencies` | Computed at creation | `{kind:"op"}` refs must be `confirmed` before this op is claimed; `{kind:"entity"}` refs require the dependency scope to have completed resync (9.4 §6.2) and the entity watermark ≥ `min_version` when present (§4) |
| 13 | `expires_at` | `created_at + action max age` (default 7 days per 9.8 §11.1; action-specific values only via registry) | Hard stop: an op at or past `expires_at` is never claimed; transitions to `expired` (§3) |

Implementation note: scheduler metadata such as `next_attempt_at` may be stored alongside (as in 9.9 §5.1) for restart safety; it is derived state, not part of the required envelope.

## 3. States and transition machine

### 3.1 States

| State | Meaning | Visible to user? | UI label (§8) |
|---|---|---|---|
| `draft` | Input saved locally, not submitted (9.9 `draft_only`) | Yes (drafts UI) | "Draft" |
| `queued` | Validated, waiting for flush | Yes | "Waiting to sync" |
| `syncing` | Claimed; a send attempt is in flight | Yes | "Sending…" |
| `confirmed` | Server committed; response received | Transient ("Sent") then removed/archived (§7) | "Sent" |
| `failed` | Permanent failure (auth/authorization/validation/business rule) — auto-retry stopped | Yes | "Failed — review" |
| `conflict` | Structured rejection (409/422) — auto-retry stopped | Yes | "Needs review" |
| `expired` | `expires_at` reached | Yes (briefly) | "Expired" |
| `cancelled` | User withdrew it | Hidden or in history | "Cancelled" |

### 3.2 Transitions

The table is exhaustive. Every transition is a single atomic store write; no other transitions are permitted.

| From | To | Trigger | Guard / notes |
|---|---|---|---|
| `draft` | `queued` | Explicit user submit | Validation passes (schema, projection, scope, policy); key already assigned at draft creation |
| `draft` | `cancelled` | User discards draft | — |
| `queued` | `syncing` | Flush claim | CAS `queued → syncing`; §4 claim rules; §6 pre-flight passes; dependencies confirmed; not expired |
| `syncing` | `confirmed` | 2xx with authoritative state, or idempotent replay (9.5 §5.3) | Response is the only evidence (§6.3 of 9.9) |
| `syncing` | `failed` | Permanent classification (§5.2): auth, authorization, validation, business rule, schema/endpoint version | Stores `failure_code` + `failure_class`; no auto-retry |
| `syncing` | `conflict` | 409/422 structured rejection (9.9 §7.1) | Per registry conflict policy; no auto-retry |
| `syncing` | `queued` | Transient failure (network, 5xx, 429, timeout-unresolved) | Backoff scheduled per §5; same key on retry |
| `queued` | `expired` | `now ≥ expires_at` | Evaluated at claim and between attempts; never claimed again |
| `queued` / `syncing` | `cancelled` | User cancels | `syncing` cancel is best-effort withdrawal — the in-flight request may still commit server-side; reconciliation via refetch surfaces it (§8.3) |
| `failed` | `queued` | Explicit user "Retry" | Only after remediation; §6 pre-flight must pass; never automatic |
| `failed` | `draft` | User edits ("Edit") | New logical operation on resubmit (new key); old op cancelled |
| `conflict` | `queued` | Explicit user "Try again" | Re-validated at server; never automatic |
| `conflict` | `draft` | User edits | New logical operation on resubmit |
| `conflict` | `cancelled` | User cancels | — |

Terminal states: `confirmed` (removed/archived, §7), `expired`, `cancelled`. No transitions leave a terminal state.

### 3.3 Invariants

1. **Single writer**: only the outbox processor (leader, 9.4 §9) transitions `queued/syncing`; user actions transition `draft/queued/syncing → cancelled` and `failed/conflict → {queued,draft,cancelled}`; the purge (9.2 §4.3) removes any state.
2. **Atomicity**: a claim and its state write are one transaction; an op cannot be `syncing` twice (§4).
3. **No skipped states**: an op never jumps `queued → confirmed` without `syncing`; never `failed → confirmed` without a new attempt.
4. **Epoch discipline**: all transitions are epoch-guarded (9.4 §2.2); a sign-out mid-transition wins (§11).
5. **Expiry at claim**: expiry is checked at claim time and between attempts — not mid-flight; an op already `syncing` at its `expires_at` completes normally.

## 4. Processing order and concurrency control

### 4.1 Controlled order

1. **Scope-ordered FIFO**: within `(user_id, tenant_id, salon_id)`, operations are processed in `created_at` order.
2. **Ready predicate**: an op is *ready* when: state `queued`; all `{kind:"op"}` dependencies are `confirmed`; all `{kind:"entity"}` dependency scopes completed resync (9.4 §6.2) with watermark ≥ `min_version` where specified; pre-flight (§6) passes; `now < expires_at`.
3. **Dependency-aware skip, not stall**: an unready op is skipped for that cycle and re-evaluated next cycle — it does **not** block later ready ops (no head-of-line blocking for dependencies). A skip is not an attempt (`attempt_count` unchanged).
4. **Batch bounds**: per flush cycle, at most 3 ops in flight (9.9 §6.2) and at most 10 ops claimed; the cycle repeats until the outbox is empty, exhausted, or blocked.

### 4.2 No concurrent processing of the same operation

1. **Claim via CAS**: an op is claimed by atomically transitioning `queued → syncing` in one IndexedDB transaction keyed on `op_id`. A second claim on a `syncing` op is refused (state mismatch → no-op).
2. **In-memory inflight set**: the processor keeps a set of claimed `op_id`s for the cycle; the same id cannot be claimed twice, even after a re-read.
3. **Leader-only**: only the leader tab flushes (9.4 §9.1); followers never claim.
4. **Defense in depth**: claim attempts additionally take a Web Lock per `op_id` (`nexora:outbox:op:<op_id>`); if the lock is unavailable (another tab claiming despite the leader rule), the claim is skipped and logged.
5. **Crash recovery**: at startup, ops left in `syncing` (crash mid-send) are re-queued (`syncing → queued`, attempt count preserved) — safe because re-send with the same key is idempotent (9.9 §4 cond. 2). A `syncing` op older than the send timeout (30 s) without a response is resolved via the outcome query (9.6 §5); unresolved → re-queued for retry.

## 5. Retry policy

### 5.1 Bounded exponential backoff with jitter

Retries reuse the 9.4 §4 parameters and rules exactly: base 1 000 ms, ×2, cap 30 000 ms, full jitter `random(0, delay)`, minimum 250 ms; the ≥ 5 failures / 60 s circuit holds at max delay; server `Retry-After`/backoff hints honored (capped 60 s). Additionally:

- Per-item backoff is computed from `attempt_count` at the previous attempt, so a crash between attempts preserves the schedule.
- Batch-start jitter `random(0, 1000)` ms prevents many items flushing in lockstep after a reconnect.
- There is **no hard attempt cap**: transient retries continue until success, cancellation, or `expires_at` — the expiration is the natural bound (§3.2).

### 5.2 Retry only transient failures

| Class | Signals | Auto-retry? |
|---|---|---|
| **Transient** | Network error, socket loss, 5xx, 429 (+ `Retry-After`), timeout unresolved by outcome query, connection state not `live` | **Yes** — same key, §5.1 backoff |
| **Authorization** | 401/403, close code 1008, RLS suppression (9.4 §8.1) | **Never** — `failed`; purge scope state (9.5 §9.3); recovery action (9.4 §8.2); manual retry only after remediation and §6 re-verification |
| **Authentication** | Session absent/expired at send time | **Never sends** — op is *held* `queued` (not failed) until a valid session exists (§6.1); if the session cannot be restored, the user resolves it; on sign-out the op is purged |
| **Validation** | 400 schema/endpoint-version, 422 validation | **Never** — `failed` with code; promote to draft; notify |
| **Business rule** | 409/422 structured business rejection (per registry) | **Never** — `conflict`; explicit user action only (§8) |

### 5.3 Send timeout

A send attempt has a per-request timeout (default 10 s, per 9.6 §5). On timeout: resolve via outcome query by `idempotency_key` (9.6 §5); confirmed → `confirmed`; not found → `queued` with backoff; ambiguous → same. **A timeout never becomes success** (9.6 §3.7).

## 6. Pre-flight verification before every send

Before **every** claim and send attempt — first attempt and each retry — the processor runs the following gates in order. Any gate failing holds the op (`queued`, no attempt) or, for security gates, refuses it permanently.

### 6.1 Fresh authentication

1. `getSession()` must return a session; `session.expires_at > now + 30 s` margin. Otherwise attempt a token refresh through the auth client first.
2. Refresh failure → hold (no send with a stale token); if the session is gone entirely → the op is held pending sign-in; if sign-out occurred → purge (9.2 §4.3). The outbox never sends with an expired token, and it never stores a token to "send later" (9.8 §8).

### 6.2 Recheck current user, tenant, role, and ownership before every retry

1. **User**: `session.user.id === op.user_id` — mandatory; mismatch is a security event (§6.4).
2. **Tenant/salon**: the current active scope must equal `op.tenant_id`/`op.salon_id`, or the op must be global (`null`). Mismatch → hold until the scope returns; tenant removal → purge (9.8 §7).
3. **Role/permission**: the role required by `op_type` (registry) must still be held. The profile is refreshed if older than 60 s or after any auth event; on revocation the op is held (or `failed` per §5.2) and scope state purged (9.5 §9.3).
4. **Ownership**: for entity-scoped ops (e.g., `booking:cancel`), the client re-checks that the current user still owns/authorizes the entity per the freshest known state (watermark, 9.5 §3.2). This is a client-side pre-flight only — the **server re-validates authoritatively at commit** (9.9 §11.2); the client check reduces wasted sends, never substitutes for RLS.

### 6.3 Gate outcomes

| Gate result | Action |
|---|---|
| Pass | Claim and send |
| Session expired, refresh pending | Hold (`queued`); no attempt |
| Scope mismatch (tenant/salon) | Hold; re-evaluated each cycle |
| Role/ownership lost | Hold if possibly transient (role refresh in progress); `failed` if confirmed revoked (9.5 §9.3) |
| User mismatch | Security event; **never claim, never send** (§6.4) |

### 6.4 Never send an operation created by a previously signed-in account

1. **Boundary**: the `user_id` field is bound at creation from the session and is never caller-supplied (§2.2). The claim gate (§6.2 step 1) refuses any op whose `user_id` differs from the current session — even if it survived a purge (restored backup, purge failure, bug).
2. **Purge remains primary**: sign-out/account switch purges the outbox with read-back verification (9.2 §4.3, 9.8 §7, 9.8 §10.2). The per-op check is defense in depth, not a substitute.
3. **Tenant/salon scope** is the second layer: an op from a previous tenant context of the same account is held or purged (§6.2 step 2).
4. **Tested**: cross-account enumeration + claim-attempt tests (§13) prove zero sends for a foreign `user_id`, including after a deliberately failed purge.

## 7. Confirmation, removal, and archival

1. **On `confirmed`**: (a) apply the authoritative server state write-newer-only (9.5 §4.3); (b) invalidate affected caches (9.2 §5.1) and reconcile derived state (badges per 9.5 §8.2); (c) **remove the operation from the active outbox**; (d) log at `debug` (op_id, key hash, outcome — no payload, 9.8 §13).
2. **Authoritative record**: the server's audit trail (idempotency key + outcome + committed effects, 9.9 §11.5) is the canonical record of confirmed operations. The client does **not** need to retain them.
3. **Optional local archive** (default off): if enabled, confirmed ops move to an `outbox_archive` store containing **envelope fields only** — `op_id`, `op_type`, `idempotency_key`, `confirmed_at`, server reference — **no payload content**. Bounds: 30-day TTL, 200-entry cap (oldest evicted), purged on sign-out, quota-checked (9.2 §5.3). The archive is never read as authority; it exists for user-facing receipts only.
4. **Replay after confirmation**: a duplicate of a confirmed key (legacy copy, double delivery) is answered by the server with the stored result (9.5 §5.3); the client treats it as `confirmed` idempotently — no second business effect.

## 8. Visible status, retry, and cancellation

### 8.1 Status presentation

| State | UI | Actions offered |
|---|---|---|
| `draft` | Drafts list, "Draft" label (9.9 §2) | Edit, Delete, Submit |
| `queued` | Outbox list, "Waiting to sync"; global count includes it | Cancel, Edit |
| `syncing` | "Sending…" (spinner + text, `aria-busy`) | Cancel (best-effort, §8.3) |
| `conflict` | "Needs review" + server reason code | Try again, Edit, Cancel |
| `failed` | "Failed — review" + failure class/code | Retry (after remediation), Edit, Cancel |
| `expired` | "Expired" (dismissible) | Dismiss |
| `cancelled` | History (or hidden) | — |

Rules (from 9.9 §8): the global indicator counts `queued + syncing + conflict + failed` ("2 changes waiting to sync"); per-item states are text + icon + `aria-live` (9.4 §3.6); **no confirmed styling or server-like references for any non-`confirmed` state** (9.9 §8.1).

### 8.2 Safe retry

- **Automatic retry**: transient failures only (§5.2), same key, §5.1 backoff.
- **Manual retry**: offered for `failed` and `conflict`, and it re-runs the full §6 pre-flight before the attempt. Manual retry never resets `attempt_count` or `expires_at` (it does not extend the safe window); it only re-enables the next attempt.
- **Re-verification before retry**: any manual retry re-checks user, tenant, role, ownership (§6.2); a retry after an auth event re-fetches the profile first.

### 8.3 Safe cancellation

- **Allowed for**: `draft` (delete), `queued` (cancel), `syncing` (best-effort), `failed`/`conflict` (cancel).
- **Forbidden for**: `confirmed`, `expired` (terminal).
- **Best-effort semantics**: cancelling a `syncing` op marks it `cancelled` locally; the in-flight request may still commit server-side. The client then reconciles: on the next resync (9.4 §6.2) or on a relevant event (9.5 §6.1), the refetched state reveals whether the server committed; the user is shown the outcome ("Your request was sent before you cancelled — see status below") when it did. Cancellation never deletes server state and never claims to have retracted an in-flight request.

## 9. Security and storage constraints

The outbox store is governed by 9.8 with these outbox-specific enforcements:

1. **Write gate at enqueue** — every write (draft or queued) is validated: (a) all §2 fields present with correct types; (b) `user_id`/scope bound from the session, not the caller; (c) payload matches the per-`op_type` projection (9.8 §3.2); (d) **denylist scan** — refusal patterns for access tokens, payment credentials (card/BIN/expiry/CVV patterns), signed URLs, and embedded documents fail the write with a security event (9.8 §4).
2. **Sensitive documents are referenced, never embedded**: document payloads contain only the server-issued record ID; content is fetched on demand via short-lived signed URLs (9.8 §9) — never stored in the outbox.
3. **No secrets**: the outbox never contains tokens, credentials, or secret material; the flush uses the **live session** (§6.1), never a stored token. A secret-shaped field found in any existing entry is a defect: entry discarded, security event logged (9.8 §13).
4. **Encryption**: payloads containing private data are encrypted per 9.8 §12 (in-memory key, fail-closed when `crypto.subtle` is unavailable — the action then degrades to `disabled_offline`, 9.9 §5.2).
5. **Partitioning & capacity**: store keyed and field-scoped by user/tenant (§2.2, 9.8 §6); capacity 50 items with block-on-overflow (9.9 §5.2).
6. **Retention**: `expires_at` per §2.2; hard purge sweep per 9.8 §11.2; full purge on every clearing trigger (9.8 §7).

## 10. Server-side requirements

1. **Idempotency**: as 9.9 §11.1 — key required, result stored and replayed, retention ≥ 30 days.
2. **Endpoint versioning**: the server exposes a versioned endpoint contract per action; a request with an unsupported `endpoint_version` is rejected with 400 and `accepted_endpoint_version`; the client marks the op `failed` (`endpoint_version` class) and routes the user through the app-upgrade path.
3. **Payload schema versioning**: 400 on unknown `schema_version` with the accepted version (9.9 §4 cond. 4).
4. **Structured outcomes**: 409/422 with reason codes (9.9 §11.3); outcome query by key (9.6 §5).
5. **Re-validation**: server re-validates user, tenant, role, ownership, availability, prices, and business rules at commit — the client's §6 pre-flight is never a substitute (9.9 §11.2, RLS per 9.1 §4.2).
6. **Audit**: every flush-originated commit and every idempotent replay is logged with key, action, outcome, and committed effects — no payload content (9.9 §11.5).

## 11. Edge cases

| Edge case | Handling |
|---|---|
| Crash mid-`syncing` | Startup re-queue (`syncing → queued`), same key, attempt preserved (§4.2); server replays if committed |
| `syncing` past send timeout | Outcome query resolves; unresolved → re-queue with backoff (§5.3) |
| Two devices, same account, same logical op | Both enqueue with the same key (created on one device, sync-restored on the other); server dedupes by key — one commit, two `confirmed` responses |
| Cancel while in flight | Best-effort; server may commit; refetch reconciles and informs (§8.3) |
| Restore/backup with a foreign `user_id` | Claim gate refuses; security event; entry discarded (§6.4) |
| User edits a queued op | Old op `cancelled`/`superseded`; new logical op with a new key (9.9 §12) |
| Expiry during a long offline period | `expired` at next evaluation; user notified; payload promoted to draft if useful |
| Endpoint version bumped while items queued | Old-version items → `failed` (`endpoint_version`); app-upgrade path; no silent re-versioning |
| Salon switch mid-queue (same account) | Ops scoped to the previous salon are held (scope mismatch, §6.2) — not failed; flushed when the scope returns or cancelled by the user |
| Tenant removal / role revocation | Purge per 9.8 §7; items never survive to a later session (9.5 §9.3) |
| Sign-out during flush | Epoch abort wins; in-flight responses discarded; purge completes; no op from the previous account is ever sent or retained (§6.4) |
| Queue full (50) | New enqueues blocked with message (9.9 §5.2); nothing evicted |

## 12. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Queued writes are RPC/API-driven and RLS-checked at commit; realtime events confirm post-commit |
| 9.2 | Outbox is the 9.2 §4.2 queue, typed; purge rules unchanged |
| 9.4 | Flush triggers, leader-only processing, epochs, backoff parameters, connection gating |
| 9.5 | Idempotency keys, write-newer-only, watermarks untouched by outbox items, refetch reconciliation |
| 9.6 | Pending presentation, timeout resolution, no simulated success |
| 9.7 | Offline rendering of outbox UI; snapshots and freshness |
| 9.8 | No secrets, projections, encryption, partitioning, retention, purge triggers |
| 9.9 | Registry, qualification, flush protocol, conflict policies — all apply; this section supersedes only the item schema and state/claim mechanics |

## 13. Implementation acceptance checklist for 9.10

- [ ] Every operation contains all 13 required fields; a write missing any field is refused and logged (schema-validation test).
- [ ] The state machine implements exactly the §3 transition table; a programmatic check proves no other transitions compile; every transition is atomic and epoch-guarded.
- [ ] All eight states exist and are observable; terminal states (`confirmed`, `expired`, `cancelled`) have no outgoing transitions.
- [ ] Processing order: scope-ordered FIFO; dependency-aware skip without head-of-line blocking; batch bounds enforced.
- [ ] Concurrency: CAS claim prevents double-processing (two concurrent claim attempts → one winner); inflight set; leader-only; Web Lock defense-in-depth test; crash recovery re-queues `syncing` items safely.
- [ ] Retry: transient-only auto-retry with the §5.1 backoff (jitter, cap, circuit, `Retry-After`); auth/authorization/validation/business-rule failures stop auto-retry; timeout never becomes success.
- [ ] Pre-flight: fresh authentication (with margin) before every send; refresh failure holds; user/tenant/role/ownership rechecked on every retry; profile refreshed after auth events.
- [ ] Cross-account: an operation with a foreign `user_id` is never claimed or sent — proven by test including a deliberately failed purge (backup restore scenario).
- [ ] Confirmation: ops removed on `confirmed`; local archive (if enabled) is envelope-only, bounded, purged; server audit is authoritative; replay idempotent.
- [ ] Visibility: per-state UI labels and actions per §8.1; global count = `queued + syncing + conflict + failed`; no confirmed styling for non-confirmed states; cancel is best-effort with reconciliation.
- [ ] Security: write gate enforces projections + denylist; secret-shaped writes refused; documents referenced by ID only; encryption fail-closed; capacity and retention enforced.
- [ ] Server: endpoint-version and schema-version rejection with accepted-version payloads; structured conflict codes; outcome query; audit logging without content.
- [ ] Edge-case suite: crash, timeout, two-device same-key, in-flight cancel, backup restore, expiry, version bump, salon switch, revocation, sign-out mid-flush — each converges as specified.

## 14. Change control for 9.10

Any modification to the operation schema, the state machine, ordering/claim semantics, retry policy, pre-flight gates, archive policy, or security write gate requires:
- Threat-model review (cross-account sends, replay, secret leakage, stale-state commits)
- Fault-injection regression suite update (all §13 scenarios)
- Schema-migration review for existing outbox entries (upgrade path for `payload.schema_version` / `endpoint_version`)
- Privacy/storage review per 9.8
- Update to this specification before release.

---

**Sub-point:** 9.11 — Conflict Resolution  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

A **conflict** is two divergent changes to the same record or scope where applying both silently would lose information. Conflict handling must be defined for **every offline-editable entity** (§2.1) — there is no default, and there is no "ask forgiveness later" path.

Governing rules:

1. **The server remains authoritative.** Every resolution converges to server state; the client's role is to detect, present, and re-submit — never to decide unilaterally what the server should contain.
2. **Sensitive or financial records must never use silent "last write wins" (LWW).** Silent LWW is permitted only for independent, low-risk fields explicitly registered as mergeable (§4). For everything else, a conflicting write is rejected and routed to user intervention (§5).
3. **Conditional mutations**: version numbers (primary) or server `updated_at` timestamps (secondary) are submitted with mutations. **The server must reject writes based on outdated versions where overwriting could lose data** (§3), returning a structured conflict response.
4. **Automatic field merging is allowed only for independent, low-risk fields** (§4); **user intervention is required when two changes cannot be safely combined** (§5).
5. **The interface must clearly distinguish** the five states of §6 — local draft, pending submission, server-confirmed, conflict requiring action, permanently failed — and **a rejected or conflicted write must never remain displayed as confirmed** (§6.4).
6. **After resolution, the client must refetch the authoritative record** (§7). Resolution is not complete until the refetched state is applied (write-newer-only, 9.5 §4.3).

## 2. Conflict model and per-entity requirements

### 2.1 Conflict strategy registry

Every offline-editable entity must have a registered conflict strategy before any offline write path for it can exist. The registry (extending the 9.9 §3 action registry) lists: entity, its offline-editable operations, whether any sensitive/financial fields are involved, the conflict strategy, and the mutation's conditional form.

| Entity | Offline-editable ops | Sensitive fields involved? | Conflict strategy | Mutation form |
|---|---|---|---|---|
| **Notifications** (read state) | mark read | No | Idempotent no-op — replay is success; no conflict path exists | RPC, conditional not required (idempotency key suffices) |
| **User settings** (non-sensitive display prefs) | update | No (security/privacy fields excluded, 9.6 §2.2) | **Field-level merge** for independent low-risk fields; same-field divergence → server version wins silently **only** for registered mergeable fields, else user (§4) | Conditional RPC: `expected_version` + field-scoped payload |
| **Drafts** (service request, review, profile edit) | save | Possibly (draft content may include documents — referenced, 9.10 §9) | **Local-only while draft** — drafts are client-owned until submission; on submission the *target* entity's strategy applies | Local save (no server condition); submission is conditional on the target |
| **Bookings** (create/reschedule/cancel) | create, reschedule, cancel | Yes (price, payment linkage — never merged) | **Create**: server re-validation; conflicts = availability/price drift → `conflict` + user. **Reschedule/cancel**: conditional on current booking `version`; outdated → 409 → user intervention | Conditional mutation: `expected_version` of the booking; create carries snapshot (9.7 §9) |
| **Service requests / proposals** (submission) | submit | Partial (documents referenced) | Conditional on the draft's server version if server-side drafts; otherwise server re-validation → `conflict` + user | Conditional RPC: `expected_version` where the server stores the draft |

Rules:

1. An entity with no registry entry **cannot** be offline-edited — the mutation gateway (9.9 §3.2) refuses it.
2. Any change to an entity's strategy (fields, mergeability, sensitivity) is change-controlled (§12).
3. The strategy applies at **commit time on the server**; the client's §5 UI is the presentation of the server's decision, never a substitute for it.

### 2.2 What counts as a conflict

| Situation | Conflict? | Class |
|---|---|---|
| Two offline edits to **different independent fields** of the same record | No — mergeable (§4) | merge |
| Two offline edits to the **same field** (or dependent fields) | Yes — needs a winner | field/entity conflict |
| Reschedule/cancel submitted against a booking that changed server-side (status, time) | Yes | version conflict |
| Booking create whose snapshot availability/price drifted | Yes (server re-validation) | business conflict |
| Edit to a record **deleted** server-side | Yes | deleted-entity conflict |
| Edit to a record whose **scope changed** (salon switch, ownership moved) | Yes | scope conflict |
| Replay of an already-committed operation (same idempotency key) | No — replay is success (9.5 §5.3) | replay |
| Edit of a record the user is **no longer authorized** to edit | Not a conflict — authorization failure (9.4 §8, 9.10 §5.2) | authz failure |

## 3. Conditional mutations

### 3.1 Client requirements

1. Every mutation of an offline-editable entity that is not purely idempotent-no-op submits **`expected_version`** (the entity version the client's change is based on, from the confirmed watermark, 9.5 §3.2) with the request.
2. `expected_updated_at` (server timestamp from the same base) is submitted **in addition** where the endpoint supports it, as a secondary check; the server treats version as primary (9.5 §2.3 — client time is never an authority).
3. The base must be a **server-confirmed** version — never a local draft version, never an optimistic overlay (9.6 §3.3), never a queued item's own expectation.
4. Version mismatch handling on the client: a 409 is **not retried automatically** (9.10 §5.2) and **not** silently overwritten — it enters the conflict workflow (§5).

```ts
// Conditional mutation shape (RPC or body):
{
  idempotency_key: "…",
  expected_version: 7,          // from confirmed watermark
  expected_updated_at: "2026-08-05T09:14:00Z", // secondary, server-clock
  fields: { /* field-scoped payload, per §4 */ }
}
```

### 3.2 Server requirements

1. The server compares `expected_version` (or, where unavailable, `expected_updated_at`) against the current row **inside the same transaction as the write** (9.5 §2.5 version trigger).
2. **The server must reject writes based on outdated versions where overwriting could lose data**: if `expected_version < current.version` (or timestamps disagree), the write is **aborted** — no partial application, no silent overwrite — and the server returns `409` with a structured conflict body (§8.2) containing the current authoritative representation.
3. Writes where `expected_version == current.version` proceed normally (version bumped atomically).
4. For **registered mergeable fields** (§4), the server may accept a field-scoped write at an outdated version only when it can prove the incoming fields are independent of the intervening changes (per the registered field map). Proof = server-side diff against the current row's changed-field set; anything overlapping is rejected as a conflict. This is a server capability, not a client right.

### 3.3 Deleted and scope-changed records

- Mutation targeting a **deleted** record → `409 entity_deleted` (or 404 where specified); the client discards local edits (or promotes to draft) and refetches (§7).
- Mutation whose **scope** (tenant/salon/ownership) changed since enqueue → `409 scope_changed`; the client purges per 9.8 §7 / 9.5 §9.3 and shows the recovery action — never a blind resubmit.

## 4. Automatic field merging (low-risk, independent fields only)

### 4.1 Eligibility

Automatic merging is permitted only when **all** of the following hold:

1. The field is on the entity's registered **mergeable-field allowlist** (per-entity, in the §2.1 registry). Fields are added only through change control after a risk review.
2. The fields are **independent**: no cross-field invariants (e.g., a currency field is never mergeable with its amount; a notification-toggle is never mergeable with the channel it governs). Dependencies are declared in the registry as field groups; a group is merged atomically or not at all.
3. The fields are **low-risk and non-sensitive**: no financial, entitlement, authorization, identity, or compliance data (§1 rule 2). Sensitive/financial records are **never** merged automatically, even per-field — any conflict on them requires user intervention or server-side reconciliation designed by the backend (never client-side).
4. The merge base is the **server-confirmed** state, never local stale state; the merge produces a single re-submission carrying `expected_version` of the server state it was built on (a new conditional write).

### 4.2 Merge rules

| Case | Handling |
|---|---|
| Intervening changes touched **only mergeable, non-overlapping** fields | Server-side field merge accepts the write; result is authoritative; client refetches (§7) |
| Intervening changes touched **overlapping** fields (same field or dependent group) | **No silent LWW.** Server rejects with `409 field_conflict`; user intervention (§5) |
| Either side touched any **sensitive/financial** field | No merge; conflict path (or server-side reconciliation by the backend) |
| Merge result violates schema/invariants | Server rejects (422); user intervention |
| Mergeable write arrives at an outdated version and the server cannot prove independence | Server rejects (409 version_conflict) — safe default |

Silent LWW is therefore limited to exactly: same-field divergence on registered, low-risk, non-sensitive, independent fields where the server can prove the incoming write does not clobber intervening changes. Everything else routes to §5.

## 5. User intervention workflow

### 5.1 Trigger

The conflict workflow opens when: a conditional mutation returns 409 (any class), a merged write returns `field_conflict`, a business re-validation fails (9.9 §7.2), or a realtime event reveals a divergent server state while a local edit is pending (9.6 §6).

### 5.2 Presentation

The conflict UI shows, for each conflicted field group:

1. **Server state** — the current authoritative value with its version and "as of" time (fetched via §7 refetch before display — never rendered from the stale local copy).
2. **Local state** — the user's pending change, labeled as local ("Your change — not saved").
3. **Per-field resolution choices**, limited to safe options for the field class:
   - **Use server version** (discard local change for that field);
   - **Keep local version** (re-submit conditionally with the new `expected_version` — the server still validates business rules; it is a new conditional write, not an override);
   - **Edit manually** (compose a new value, then re-submit);
   - For deleted-entity conflicts: **Discard local edits** or **Save as draft** (no "restore the record" option — recreation is a separate online operation).
4. Resolution applies per field group; the user may mix "use server" and "keep local" across independent groups, then submits **one** new conditional mutation carrying the server version it is based on.

### 5.3 Constraints

1. No resolution option may be presented that implies silent overwrite of sensitive/financial data: "keep local" on such fields re-enters normal server validation and can still be rejected; it never bypasses business rules.
2. "Keep local" never resets the server's version — it submits with the *current* `expected_version` and is subject to a new conditional check.
3. The workflow is cancelable (returns to the previous state; the local change is preserved as a draft, never silently discarded).
4. While the conflict is open, the entity's other offline operations are held (§6.3 dependency rule): no new queued edit may be created against the conflicted entity until resolution and refetch complete.
5. Resolution is logged (`conflict` class, chosen action — no content, 9.8 §13).

## 6. Interface state distinction

### 6.1 The five mandatory states

| State | Definition | Source of truth | Styling | User actions |
|---|---|---|---|---|
| **Local draft** | Input saved locally; not submitted (9.9 `draft_only` / 9.10 `draft`) | Local store | "Draft" label; subdued; editable | Edit, Delete, Submit |
| **Pending submission** | Validated and waiting, or in flight (9.10 `queued`/`syncing`; 9.6 pending) | Outbox | "Waiting to sync" / "Sending…" with `aria-busy`; **no confirmed styling** (9.9 §8) | Cancel, Edit |
| **Server-confirmed** | Server committed; response/replay received (9.10 `confirmed`) | Server response applied write-newer-only (9.5 §4.3) | Confirmed styling allowed (9.7 §8) | Standard entity actions |
| **Conflict requiring action** | Conditional write rejected (409) or merge rejected; needs the user (§5) | Server's current representation (fetched) | "Needs review" banner; conflicted fields highlighted; **never confirmed styling** | Per-field resolution, Cancel |
| **Permanently failed** | Auth/authz/validation/business failure, auto-retry stopped (9.10 `failed`) | Server error response | "Failed — review" with class/code | Retry (after remediation), Edit, Cancel |

### 6.2 Mapping to existing machinery

- The five states map one-to-one onto 9.10 §3 states (`draft`, `queued`/`syncing`, `confirmed`, `conflict`, `failed`); `expired` and `cancelled` remain out-of-band states with their own presentations (9.10 §8.1).
- The state shown is always the **outbox/registry state**, never a component guess (9.4 §3.7 single source of truth).
- Transition into `conflict` is visible immediately on receipt of the 409 — no intermediate "still pending" period, no toast-only handling (9.4 §3.6).

### 6.3 No new edits against a conflicted entity

While an entity is in `conflict`, further offline edits to it are held (enqueue blocked with "Resolve the conflict first"); dependent operations referencing it wait per 9.10 §4.1 ready-predicate.

### 6.4 Rejected or conflicted writes never remain displayed as confirmed

1. On any rejection (409/422/4xx), the client **immediately** demotes the affected entity from any pending/optimistic presentation to the conflict or failed state — the entity's displayed value reverts to the last server-confirmed state (from the confirmed watermark), never to the optimistic/local value (9.6 §3.6 rollback guard: rollback only when `snapshot.version >= current`).
2. If the local optimistic overlay is older than the server's current version (event advanced it), the display adopts the newer server state (9.5 §4.3, 9.6 §6) — never the overlay.
3. Automated test: after every simulated 409, no UI assertion can find confirmed styling or success copy for the rejected write (§11).

## 7. Refetch after resolution — mandatory

1. **Refetch the authoritative record after resolution** — every resolution path (accept server, keep local, manual merge, discard, save-as-draft) ends with a refetch of the entity through the normal authenticated API (9.5 §6.2 procedure: smallest scope, epoch-tagged, aborted on teardown, per-request timeout).
2. The refetch **precedes** any follow-up action: the "keep local" submission's success is itself confirmed by the refetch showing the new version; the "use server" resolution is confirmed by the refetch showing the server value; the merge result is confirmed by refetch after the merged write commits.
3. Apply the refetched state write-newer-only (9.5 §4.3), advance the watermark, clear the conflict markers, and reconcile derived state (badges, lists, 9.5 §8.2).
4. **Refetch failure** → the resolution is not considered complete: the conflict UI remains with a `stale` marker (9.4 §3) and the standard bounded retry applies; the user is never shown "resolved" on the basis of local state alone.
5. A refetch that reveals the record was deleted server-side clears the entity from local state per 9.5 §9.1 (remove + confirm).
6. Multi-tab: after resolution in one tab, other tabs converge via their own resync/refetch triggers (9.4 §5.2, 9.5 §6.1) — resolution state is per-tab, authoritative state is shared.

## 8. Server-side requirements

### 8.1 Conditional write support

1. Version-gated mutations for every offline-editable entity (per §3.2) — transactional compare-and-set against the 9.5 §2.5 version column.
2. Field-scoped merge endpoint capability for registered mergeable fields, with server-side independence proof and overlap rejection (§4.2).
3. No silent overwrite paths: any code path that would update a record without a version check is prohibited for offline-editable entities (review + lint gate).

### 8.2 Structured conflict codes

Extending 9.9 §11.3 / 9.10 §10.4, the server returns 409 with a machine-readable body:

| Code | Meaning | Client action |
|---|---|---|
| `version_conflict` | `expected_version` outdated | Open conflict workflow (§5); display server state |
| `field_conflict` | Merge rejected: overlapping or non-mergeable fields | Open conflict workflow per field group |
| `business_conflict` | Re-validation failed (availability, price, rules) | Open conflict workflow; show server reason |
| `entity_deleted` | Target deleted server-side | Discard or save-as-draft; refetch (§3.3, §7) |
| `scope_changed` | Tenant/salon/ownership changed | Purge per 9.8 §7; recovery action (9.4 §8.2) |
| `replay` | Same idempotency key, already committed | Treat as success; refetch (§7) — never a conflict |

The body includes the current authoritative representation (or the changed-field set for `field_conflict`) so the client can render §5.2 without a second round trip; the client still refetches before presenting (§5.2) when the body lacks the full record.

### 8.3 Reconciliation-by-design

- For sensitive/financial domains, the backend defines **server-side reconciliation** where needed (e.g., payment status transitions are server-ordered per 9.1 §6); client conflict UI applies only where the user legitimately chooses — the server never accepts a client choice that contradicts its own invariants.
- The server logs every rejection with code, idempotency key, and affected entity — no payload content (9.8 §13).

## 9. Edge cases

| Edge case | Handling |
|---|---|
| Two devices edit the same booking time offline | Second flush → `version_conflict`; user intervention; refetch resolves both views |
| Local optimistic overlay older than an event that advanced the entity | Event wins (9.5 §4.3); pending op reconciles to newer state (9.6 §6) |
| Conflict arises while the user is on another screen | The entity enters `conflict`; the outbox/global indicator shows "Needs review"; the conflict UI opens on return (9.10 §8) |
| User keeps local after conflict, then the server rejects again | New conditional write → possibly a new conflict; loop is bounded by user decisions — the UI never auto-repeats |
| Delete vs update race | Deletion wins server-side; update gets `entity_deleted`; local edit saved as draft (never resurrected — 9.5 §9.3) |
| Merge with cross-field invariant (e.g., two fields must match) | Fields are a declared dependent group → not mergeable; conflict path (§4.1) |
| Conflict while offline | Resolution requires server state (refetch) — offered only after reconnect (9.4); the conflict persists visibly meanwhile |
| Conflict resolved, refetch fails | Resolution incomplete; conflict UI + `stale`; bounded retry (§7.4) |
| Same idempotency key after conflict resolution | New logical operation → new key; the old key's stored result remains authoritative for the old op (9.10 §11) |

## 10. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Server-authoritative rule originates here; payment/workflow events confirm or diverge post-commit |
| 9.4 | Conflict UI renders under connection state; resolution requires `live`/`syncing`; epochs guard resolution callbacks |
| 9.5 | Versions/watermarks are the conflict substrate; write-newer-only governs every apply; refetch procedure (§7) is 9.5 §6.2 |
| 9.6 | Rollback guard (snapshot vs. newer state) applies on rejection; pending overlays never become confirmed |
| 9.7 | Offline rendering rules apply to conflict presentation; refetched state displayed with qualifiers until confirmed |
| 9.8 | Conflict payloads/refetches respect projections and denylist; no sensitive content in logs or UI |
| 9.9 | Registry entries carry conflict policies (9.9 §7.2); flush response handling routes 409/422 here |
| 9.10 | `conflict` and `failed` states, visible status, safe retry/cancel; conditional bases come from confirmed watermarks |

## 11. Implementation acceptance checklist for 9.11

- [ ] Every offline-editable entity has a conflict strategy in the §2.1 registry; the mutation gateway refuses unregistered entities (completeness test).
- [ ] All non-idempotent mutations of offline-editable entities send `expected_version` (+ `expected_updated_at` secondary); the server aborts outdated-version writes transactionally and returns structured 409s.
- [ ] No silent LWW exists for sensitive/financial records or for non-mergeable fields (code review + server-side test: an outdated-version write to such a field is always rejected).
- [ ] Automatic field merging exists only for registered, independent, low-risk, non-sensitive fields; overlap and cross-field invariants are rejected server-side.
- [ ] User intervention UI presents server state (refetched), local state, and per-field-group choices; "keep local" is a new conditional write, never an override; workflow is cancelable.
- [ ] The five §6.1 states are visually distinct and map to outbox states; no component-local state guesses.
- [ ] Rejection demotion test: for every simulated 409/422, the entity never retains pending/confirmed styling or success copy; displayed value reverts to the last confirmed state or newer server state.
- [ ] No new offline edits are enqueued against a conflicted entity; dependents hold (9.10 §4.1).
- [ ] Every resolution path ends in the §7 refetch; refetch failure keeps the conflict visible with `stale` (never "resolved" from local state).
- [ ] Server: version-gated CAS, field-merge capability with independence proof, structured codes with current representation, deletion/scope conflicts, replay handling, content-free rejection logging.
- [ ] Edge-case suite: two-device same-field, delete-vs-update, merge with invariants, conflict-while-offline, refetch-failure, key-replay-after-resolution.

## 12. Change control for 9.11

Any modification to the conflict strategy registry (entities, mergeable fields, sensitivity classification), the conditional-mutation contract, merge eligibility, the conflict workflow, or structured conflict codes requires:
- Threat-model review (data loss via overwrite, silent LWW on sensitive data, cross-account conflict exposure)
- Server-side conditional-write and merge tests update
- Fault-injection regression suite update (all §11 scenarios)
- UX review of the conflict presentation (state distinction, accessibility)
- Update to this specification before release.

---

**Sub-point:** 9.12 — Service Worker Restrictions  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

The Service Worker is a **transport and caching layer with no business authority**. It may cache approved static assets and explicitly permitted read responses, and it may serve previously fetched representations — but it must **never invent, modify, or inject business records**. Every byte it serves is either (a) an approved asset, (b) a genuine server response previously cached under the explicit allowlist, or (c) an explicit, clearly labeled "unavailable" signal — never a synthesized business outcome.

Governing rules:

1. **No fabrication**: the SW never generates or fabricates bookings, confirmations, payment/refund success, balances, commissions/payouts, entitlements, notifications/unread counts, reviews/ratings, verification approvals, proposal acceptance, or role/ownership information (§3). It does not parse business payloads to make decisions and does not construct response bodies.
2. **Explicit cache allowlist**: only entries registered in the SW cache registry may be cached or served from cache (§4). Everything else passes through to the network untouched.
3. **Endpoint avoidance**: authentication, payment, administrative, webhook, RPC, and mutation endpoints are never cached; non-GET requests are never cached; responses containing `Set-Cookie`, authorization data, or sensitive private records are never cached unless explicitly designed and reviewed (§5, §6).
4. **Never cache error responses as successful business data**; every cache write respects response status, `Cache-Control`, and data classification (§6).
5. **Public static caches are separated from user-scoped data caches** (§7); cache names are versioned and obsolete caches are removed during activation (§8).
6. **No global cache-first for API routes**: freshness-sensitive approved reads use network-first or server-revalidation; cache-first is reserved for versioned static assets (§9).
7. **The SW never replays mutation requests automatically** — the only automatic retry mechanism is the approved typed outbox (9.10), which the SW merely signals (§10).
8. **Payment-provider redirects and webhook routes are never intercepted** (§10); the SW fails safely if installation, activation, cache migration, or update fails (§11).

## 2. Role and boundaries

### 2.1 What the SW may do

| Capability | Bound |
|---|---|
| Precache and serve approved static assets (JS/CSS bundles, fonts, icons, app shell) | Only assets listed in the registry (§4) |
| Serve the app shell offline for navigation requests | GET navigations only; the shell is UI code, not business data |
| Cache and serve explicitly permitted read responses | Only registry-approved GET reads, validated per §6 |
| Signal the client to flush the typed outbox | Background Sync (`nexora-sync-writes`, 9.2 §4.2) delivers a message; the client's outbox processor does the sending (9.10) |
| Purge user-scoped caches on sign-out | Via a validated `purge-user` message from the app (§7) |
| Report health/update status to the app | PostMessage protocol; no business data |

### 2.2 What the SW never does

- Never constructs a response body containing business data — from template, from request parameters, or from any combination of cached fragments.
- Never decides a business outcome (confirmed, paid, approved, entitled, unread count) — it has no knowledge of what those mean and no authority to assert them.
- Never retries, re-sends, or reorders mutations.
- Never intercepts authentication, payment, webhook, RPC, or mutation traffic.
- Never reads, logs, or stores authorization headers, tokens, or credentials (9.8 §8); it never needs them — it is not the auth boundary.
- Never caches opaque or unvalidated responses as data.

The SW's decision inputs are limited to: the request URL/method, the registry, response status/headers, and cache entries. That is the complete interface surface.

## 3. Fabrication denylist — never generated by the SW

The SW must never generate or fabricate the following, in whole or in part:

| Forbidden fabrication | Offline behavior instead |
|---|---|
| Bookings or booking confirmations | No cached booking response served without validation; the app renders its own offline state from the connection machine (9.4) and outbox (9.10) |
| Payment or refund success | Payment endpoints are never intercepted (§10); the app's payment views are governed by 9.1 §6 and 9.4 states |
| Account balances | Tier D (9.7 §3): never cached, never served by the SW; requests pass through and fail when offline |
| Commissions or payouts | Same as balances — passthrough, no caching |
| Subscription entitlements | Same — never cached; entitlement decisions require live server state (9.7 §2.2) |
| Notifications or unread counts | Notification reads are user-scoped; any approved caching is app-managed with the 9.7 record contract and reconciled per 9.5 §8.2 — the SW never synthesizes a count |
| Reviews or ratings | Public reads may be cached per registry with strict TTL; the SW never composes or averages ratings |
| Verification approvals | Never cached; passthrough |
| Proposal acceptance | Never cached; passthrough |
| Role or ownership information | Never cached (9.7 §2.2: permissions from session claims + profile only); passthrough |

Mechanism (three layers):

1. **Registry absence**: none of these domains is in the cache allowlist (§4) — interception never happens for them.
2. **Method and URL gating**: they are served by RPC/mutation/admin/payment endpoints that §5 excludes and §10 passes through.
3. **Validation**: even a registry-approved read is cached only after §6 validation (status, cache-control, classification); an error or mislabeled response is never cached as business data.

If the SW is ever asked to serve one of these offline, the correct result is a **network failure or an explicit 503 "Unavailable offline" stub with `Cache-Control: no-store`** — never a 200 with invented content, never a cached success without validation, and never a generic "something" body that the app could mistake for data. The app maps the failure to its own offline UI (9.4 §4).

## 4. Explicit cache allowlist (the SW cache registry)

### 4.1 Registry

Every cacheable resource is declared in a single, versioned registry inside the SW script (`SW_CACHE_REGISTRY`):

```ts
type CacheEntry = {
  id: string;                    // stable registry id (e.g., "static:core")
  kind: "static" | "images" | "read_api_public" | "read_api_user";
  match: string | RegExp;        // URL pattern (origin-relative)
  cache: string;                 // cache name family (§7)
  strategy: "cache-first" | "network-first" | "stale-while-revalidate";
  cacheable_status?: number[];   // default [200]
  max_age_s?: number;            // TTL; required for read_api entries
  content_types?: string[];      // allowed response content-types
  data_class?: "A" | "B" | "C";  // 9.7 §3; "D" is never registered
  note: string;                  // approval reference (review ticket)
};
```

The registry enumerates:

- **Static assets** (`kind: "static"`, `cache-first`): framework bundles, fonts, icons, the app shell — every entry is a hashed/versioned URL.
- **Images** (`kind: "images"`, `cache-first`): public salon imagery, avatars, gallery assets.
- **Approved public read API** (`kind: "read_api_public"`, `stale-while-revalidate` or `network-first`): explicitly permitted Tier A reads (e.g., published salon catalogue summaries) with `max_age_s` per 9.2 §5.2.
- **Approved user-scoped read API** (`kind: "read_api_user"`, `network-first`): only where an approved offline experience requires it (9.2 §3, 9.7 tiers); subject to §7 separation, §6 validation, and 9.8 review. Default: **no user-scoped entries** — each addition is a designed, reviewed exception.

### 4.2 Rules

1. **Everything not in the registry passes through** — network only, no read, no write, no interception. There is no implicit or wildcard caching.
2. A registry entry exists only for: an asset in the build manifest, or an explicitly permitted read response approved through change control (§14). Adding or removing an entry is change-controlled.
3. The registry is validated at SW install: malformed entries, unknown cache names, missing `max_age_s` on reads, `data_class: "D"`, or non-GET methods fail the install (§11).
4. The registry version is part of the cache-name version (§8); a registry change therefore renames caches and triggers cleanup — obsolete entries are never served after upgrade.

## 5. Endpoint avoidance rules

| Endpoint class | Examples | SW behavior |
|---|---|---|
| **Authentication** | `/auth/*`, token refresh, sign-in/out callbacks | Passthrough, never cached, never intercepted (9.8 §8.5) |
| **Payment** | `/payments/*`, provider session/confirm endpoints, checkout RPC | Passthrough, never cached (9.1 §6) |
| **Administrative** | Admin APIs, staff management, salon configuration | Passthrough, never cached |
| **Webhook** | `/webhooks/*`, provider callbacks | Never intercepted — not even routed through the SW (they are server-to-server; the app never calls them) |
| **RPC** | `/rest/v1/rpc/*` | Passthrough, never cached (RPC = mutations/actions) |
| **Mutation** | POST/PUT/PATCH/DELETE to data endpoints | Passthrough, never cached, never retried (§10) |

Additional rules:

1. **Non-GET requests are never cached** — including GET-with-side-effects patterns (URLs triggering actions) which are excluded by registry review.
2. **`Set-Cookie` responses are never cached**; a response with a `Set-Cookie` header fails §6 validation regardless of registry entry.
3. **Authorization data is never cached** — the SW never persists tokens or auth headers, and no registry entry may target an endpoint whose response carries authorization material (9.8 §4).
4. **Sensitive private records are never cached automatically**: user-scoped caching of anything beyond the approved offline scope (9.2 §3, 9.7 tiers) is prohibited; the designed-and-reviewed path is the `read_api_user` registry entry plus 9.8 review, §6 validation, and §7 separation — and even then only for records the approved offline experience needs.

## 6. Response validation before caching

A response is eligible for caching **only if all** checks pass. Any failure → no write (and for reads, the request proceeds without caching):

| # | Check | Rule |
|---|---|---|
| 1 | **Method** | GET only (§5) |
| 2 | **Status** | `200` only for data (configurable per entry, never ≥ 400). **Error responses (4xx/5xx) are never cached as successful business data** — including 401/403 (never cached, ever), 429, 5xx, and opaque errors |
| 3 | **`Cache-Control`** | Respect server directives: `no-store`, `no-cache`, `private`, `max-age=0` → no cache write; `max-age` → entry TTL = `min(max_age_s, max-age)`; `s-maxage`/`immutable` honored for static |
| 4 | **Headers** | No `Set-Cookie`; no authorization material in body/headers (per entry review); `Vary: *` or `Vary: Authorization|Cookie` → no cache write; `Content-Type` within the entry's allowlist |
| 5 | **Classification** | The entry's `data_class` matches 9.7 §3; Tier D never registered; Tier C entries are never served stale past TTL (§9) |
| 6 | **Integrity** | Response body size within the entry cap (default 5 MB; images per asset); body written atomically — a torn write is discarded and the cache entry deleted |
| 7 | **Not opaque** | Opaque responses (no status/headers visible, cross-origin) are never cached as data |
| 8 | **Freshness metadata** | For `read_api` entries the cached response records `fetchedAt` (local) + the server's timestamp/version headers so the app layer can apply the 9.7 §6 read pipeline and 9.5 watermarks |

The SW also honors revalidation: `network-first` and `stale-while-revalidate` entries revalidate against the server (`If-None-Match`/`If-Modified-Since` from cached headers where available); a 304 refresh keeps the cached copy and updates its timestamp; a 200 replaces it atomically.

## 7. Cache separation: public vs user-scoped

1. **Three cache families** (extending 9.2 §2.1):
   - `nexora-static-vN` — public, app-wide; precached at install; served to any client of this origin.
   - `nexora-images-vN` — public imagery; cache-first.
   - `nexora-api-vN` — approved read responses. **Split at runtime into public (`nexora-api-vN:public`) and per-user namespaces (`nexora-api-vN:<userScopeHash>`)** where `<userScopeHash>` is the same scope digest used by 9.8 §6.2.
2. **User-scoped data never lives in a public cache**: no `read_api_user` response is ever written to a public namespace, and public reads are never written into a user namespace.
3. **Serving is namespace-strict**: the SW serves a `read_api_user` request only from the matching `<userScopeHash>` namespace; a request whose namespace marker differs (or is absent) is served from network only. The app supplies the marker via a validated `set-scope` message at sign-in; it is cleared at sign-out.
4. **Purge on sign-out**: the app sends `purge-user` (with the scope hash) on every §7 clearing trigger of 9.8; the SW deletes all caches in that namespace and acknowledges; the app verifies by enumeration (9.8 §10.2). A namespace with no matching active session is never served — if the marker is absent, user-scoped cache reads are refused (fail closed).
5. **Two independent layers again**: the namespace restricts *which cache the SW may read*; the 9.7 §6 record contract (user/tenant fields) restricts *what the app may display*. Both are mandatory.

## 8. Versioning, activation, and updates

1. **Cache names embed the registry version**: `nexora-static-vN`, `nexora-api-vN:<scope>` where N derives from `SW_CACHE_REGISTRY.version`. Any registry change bumps N.
2. **Activation cleanup**: during `activate`, the SW enumerates all caches it owns and deletes any whose name is not in the current registry/version set — **removing obsolete caches during activation** is mandatory, not best-effort:

```ts
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set(currentCacheNames()); // from SW_CACHE_REGISTRY
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("nexora-") && !keep.has(k))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
```

3. **Update flow**: `install` builds the new caches in full (precache list must complete). The new SW does **not** `skipWaiting()` automatically; it waits for clients to close, or the app offers "Reload to update" when `updatefound` fires (controlled activation — never rip a working app out from under an active session). `clientsClaim` is used only at activation (as above) so the new SW controls fetches immediately on next navigation.
4. **Update checks**: `registration.update()` on app start and on visibility resume (throttled to ≤ 1/hour) so upgrades reach users without polling storms.
5. **Schema migrations** (9.7 §7, 9.8 §11.3) are implemented as registry-version bumps: old-schema caches are simply obsolete names and are removed by activation cleanup in one pass — the SW never migrates cache entries field-by-field.

## 9. Fetch strategies

### 9.1 Decision table

| Request class | Strategy | Notes |
|---|---|---|
| Versioned static assets (hashed URLs) | **Cache-first** | The only cache-first class; cache hit served, miss → network + cache |
| App shell / navigation (GET) | **Network-first** with cache fallback | Offline → cached shell (approved); never an invented page |
| Public images | Cache-first | With content-type + size validation |
| Approved public reads (Tier A) | **Stale-while-revalidate** | Serve cached ≤ TTL; revalidate in background; 9.2 §5.2 TTLs |
| Approved freshness-sensitive reads (Tier C) | **Network-first**; cache fallback **only within TTL** | Age check on fallback (TTL from §6 check 3/8); past TTL → network error, never stale data |
| Approved user-scoped reads (Tier B) | Network-first (or SWR per entry) | Namespace-strict (§7); app-layer 9.7 validation on display |
| Tier D / unlisted API | **Passthrough (network-only)** | No caching, no fallback |
| Mutations (non-GET) | Passthrough | Never cached, never retried (§10) |

### 9.2 Rules

1. **No global cache-first on API routes** — cache-first exists only for the static class; every API entry pins its strategy in the registry, and the default for anything API-shaped is network-first or passthrough.
2. **Freshness-sensitive reads never serve stale data**: a network-first fallback older than the entry's TTL returns the network error rather than the stale body (the app then shows its offline state, 9.4 §4) — the SW never decides "stale is better than nothing" for freshness-critical data.
3. **Server-revalidation is the preferred path** for approved reads (ETag/304) — it keeps caches fresh without full downloads and honors server truth.
4. Strategy is a property of the registry entry, decided at review time — never at runtime from request shape.

## 10. Mutations, navigation, payment, and webhook boundaries

1. **The SW never replays mutation requests automatically.** A failed POST/PUT/PATCH/DELETE is never retried, re-queued, or stored by the SW. The only automatic retry mechanism in the system is the approved **typed outbox** (9.10) — and the outbox lives in the app layer: the SW's Background Sync handler (`sync` event for `nexora-sync-writes`) merely posts a message that wakes the client's outbox processor, which then performs its own §6 pre-flight and flush per 9.10. The SW holds no requests, no keys, and no payloads.
2. **Navigation fallback**: offline GET navigations receive the cached app shell only; the shell renders the app's own offline/error UI (9.4). The SW never serves an API response, a stub document, or any generated page for a navigation it cannot satisfy with the shell.
3. **Payment-provider redirects are never intercepted**: return/redirect URLs for payment providers (checkout callbacks, `redirect_to` targets) are excluded from interception by registry absence and a passthrough rule for URLs matching provider-callback patterns; the SW never caches, rewrites, or re-orders them (9.1 §6).
4. **Webhook routes are never intercepted** — and the app never calls them from the browser at all (9.1 §2.1); the SW has no webhook handling code whatsoever.
5. **Auth traffic** passes through untouched (9.8 §8.5): the SW never caches auth responses, never serves them from cache, and never inspects token payloads.

## 11. Fail-safe behavior

| Failure | Behavior |
|---|---|
| **Install failure** (precache incomplete, registry invalid, `addAll` partial) | Delete the partially built caches; **abort installation** — the previous SW stays active; the app is never served from a half-built cache |
| **Activation failure** (cleanup throws) | Abort activation; the old SW remains controlling; obsolete-cache cleanup is retried on the next activation |
| **Cache migration failure** | There is no field-level migration (registry-version bump, §8); a failed rename/cleanup leaves old names untouched and never serves mixed-version entries |
| **Update failure** (fetching new SW script fails) | The current SW keeps running unchanged; `updatefound`/error surfaced to the app at `debug` (9.4 §12); retry on next cadence |
| **Fetch handler exception** | Fail open to the network: `return fetch(request)`; never serve a cache entry on the basis of a half-evaluated match; the error is logged (scope: URL class, no content) |
| **Unhandled rejection / event error** | Global guard logs and continues with passthrough semantics; repeated failures raise the SW-health alert (9.4 §11.7) |
| **Corrupt cache entry at read** (undecodable body) | Delete the entry, serve network; never serve the corrupt body (§6 integrity) |
| **Purge message validation failure** | Purge is refused if the message lacks a valid scope marker; the app retries and escalates (9.8 §10.2) |
| **Scope marker absent at serve time** | User-scoped reads fail closed to network (never served from a guessed namespace) |

The SW also runs a **startup self-check**: registry schema validation, cache-name whitelist, and precache manifest completeness — any failure follows the install/activation paths above. It never operates with an invalid registry.

## 12. Edge cases

| Edge case | Handling |
|---|---|
| First visit offline (no caches at all) | Navigation fails to the network; the app shows its offline screen. The SW cannot fabricate a first visit (no shell cached) and does not attempt one |
| Opaque cross-origin response | Never cached (§6); passthrough |
| Redirect chain ends in an error | Final status decides; errors never cached |
| `Vary`-negotiated responses | `Vary: *`/auth/cookie → not cached (§6); other `Vary` values cached only with exact request matching |
| Update available while user is mid-checkout | Controlled activation (no `skipWaiting`); the reload prompt defers; in-flight user-scoped work is not torn down (§8) |
| Multiple tabs, different scopes (two accounts, two tabs) | Per-tab scope markers; namespaces are per-user; each tab serves only its own namespace; sign-out in one tab purges its namespace and broadcasts (9.4 §9) |
| Purge in flight while a fetch is being served | Serving is namespace-strict: a fetch already matched to the old namespace completes, subsequent fetches fail closed; the app re-validates session on the next event |
| Cache write races (two tabs) | Writes are atomic per entry (build-then-put); last validated write wins; the app layer's write-newer-only (9.5 §4.3) governs business records — the SW never decides between versions |
| 304 revalidation of a deleted server resource | The network returns 404/410 → the cached copy is deleted, never served |
| SW script hash mismatch (deploy anomaly) | Update fails; current SW continues; alert raised (§11) |

## 13. Implementation acceptance checklist for 9.12

- [ ] The SW cache registry is explicit, versioned, and validated at install; an entry outside the registry is never cached or served (interception test).
- [ ] No fabrication: for each of the 10 denylisted domains, a test proves the SW cannot produce a 200 business response offline — at most a network error or a labeled 503 stub with `no-store`; no synthetic body exists in the SW codebase.
- [ ] Auth, payment, admin, webhook, RPC, and mutation endpoints are never intercepted (route tests); non-GET requests are never cached; `Set-Cookie` and authorization-bearing responses are never cached.
- [ ] Error responses (4xx/5xx/opaque) are never cached as data; status/`Cache-Control`/`Vary`/content-type validation is enforced by tests.
- [ ] Cache separation: public and per-user namespaces are distinct; a user-scoped request never reads a public cache or another user's namespace; `purge-user` deletes the namespace with app-verified enumeration.
- [ ] Activation deletes all obsolete cache names (test: old-version caches removed in one pass); install/activation/migration/update failures leave the previous SW and caches intact.
- [ ] No global cache-first on API: strategy per registry entry; Tier C fallback is age-checked and never serves stale data; cache-first applies only to versioned static assets.
- [ ] The SW contains no mutation replay: no stored requests, no auto-retry; Background Sync only signals the typed outbox (9.10), and the outbox performs its own pre-flight and flush.
- [ ] Payment-provider redirects and webhook routes are never intercepted (test with representative URLs).
- [ ] Fail-safe tests: forced install failure, activation failure, fetch-handler exception (passthrough), corrupt cache entry (delete + network), missing scope marker (fail closed).
- [ ] SW health errors surface through the 9.4 monitoring pipeline without payload content.

## 14. Change control for 9.12

Any modification to the cache registry (entries, strategies, TTLs, cache names), endpoint avoidance rules, response validation, cache separation, activation/update flow, or fetch strategy assignments requires:
- Security review (fabrication, interception, cross-account cache reads, token exposure)
- Privacy/storage review per 9.8 (any new user-scoped entry must pass the designed-and-reviewed path)
- Cache-strategy and TTL review against 9.2 §5.2 and 9.7 tiers
- Regression of the full interception/fail-safe test suite
- Update to this specification before release.

---

**Sub-point:** 9.13 — Cache Strategy  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Every resource category has an **explicit, pre-declared cache strategy**. No request is cached or served from cache by default, by pattern, or by runtime inference — the strategy is pinned per category in the Service Worker registry (9.12 §4) and enforced identically in every portal.

Governing rules:

1. **One explicit strategy per resource category** (§2). The strategy is a property of the category, decided and reviewed in the registry — never at runtime from request shape (9.12 §9.2 rule 4).
2. **Cache-first is reserved for versioned static assets** (and approved public media); **freshness-sensitive reads use network-first with scoped, short-lived fallback**; **network-only categories are never cached, ever** (§3–§10).
3. **Realtime reconciles after the network fetch for booking/proposal status; server reconciliation governs notifications** (§8–§9). Caches never replace these reconciliations.
4. **Sensitive authenticated responses must never be stored in a shared public cache** (§11): the HTTP cache, the Service Worker's public namespaces, and any CDN/proxy layer are all "shared public" unless strictly scoped to the authenticated user.
5. Expiration is mandatory wherever stale data may be served: every fallback and every stale-while-revalidate entry carries an explicit expiration (§12) beyond which the entry is discarded — never served.
6. Any category change, TTL change, or exception (including the two "unless separately approved" paths) is change-controlled (§16).

## 2. Canonical strategy matrix

| # | Resource category | Strategy | Cache / namespace | Freshness (9.2 §5.2) | Offline behavior | Governing gates |
|---|---|---|---|---|---|---|
| 1 | **Versioned JS, CSS, fonts, icons** | **Cache-first with versioned filenames** | `nexora-static-vN` (public) | Immutable; 1 year; superseded by version bump (9.12 §8) | Served from cache (that is the point) | Registry; precache manifest; hash-verified URLs (9.12 §6) |
| 2 | **Public published salon media** | **Cache-first** (versioned media) **or stale-while-revalidate with expiration** (unversioned media) | `nexora-images-vN` (public) | 7 days TTL; revalidation on read | Served from cache; stale-with-marker within window; discarded at expiration | Content-type + size validation (9.12 §6); Tier A |
| 3 | **Public salon information** (profiles, services catalogue, opening hours, policy text) | **Stale-while-revalidate with expiration** | `nexora-api-vN:public` | 60 min TTL (9.2 §5.2); hard discard at 24 h (9.8 §11.1) | Cached copy served with "as of" marker; background revalidate; on revalidate failure, aged mode per 9.7 §4.4 | Tier A; registry entry; §6 validation |
| 4 | **User-specific low-risk reads** (user settings, own saved preferences, own lists of non-sensitive data) | **Network-first with scoped short-lived fallback** | `nexora-api-vN:<userScopeHash>` (per-user, 9.12 §7) | 24 h settings / 15 min lists (9.2 §5.2) | Network fail → serve fallback **only** if within TTL and scope-validated (9.7 §6); past TTL → no fallback | Tier B; namespace-strict; record contract; write-newer-only (9.5 §4.3) |
| 5 | **Booking and proposal status** | **Network-first, then Realtime reconciliation** | `nexora-api-vN:<userScopeHash>` (fallback) | 15 min TTL (9.2 §5.2) | Fallback = last server-confirmed state (watermark, 9.5 §3.2) within TTL, rendered with "as of"; realtime events reconcile once live (9.1) | Tier B; version chain; 9.4 connection states |
| 6 | **Notifications** | **Network-first with server reconciliation** | `nexora-api-vN:<userScopeHash>` (fallback) | 5 min TTL (9.2 §5.2) | Fallback within TTL labeled "(cached)"; badge reconciled with the server count (9.5 §8.2); queued read receipts shown as pending (9.6, 9.9) | Tier B; reconciliation query; pending markers |
| 7 | **Financial records and balances** | **Network-only by default** | none | n/a | "Available when online" (Tier D, 9.7 §3) | Tier D; `no-store` (9.7 §11); exception only via §10.1 protocol |
| 8 | **Payments, refunds, payouts, commissions** | **Network-only** | none | n/a | Blocked; payment views per 9.1 §6 | Hard exclusion; never registered (9.12 §5) |
| 9 | **Authentication and authorization** | **Network-only** | none | n/a | Sign-in unavailable offline; session material per 9.8 §8 | Passthrough; never intercepted (9.12 §5) |
| 10 | **RPC, mutations, and administrative APIs** | **Network-only** | none | n/a | Blocked or queued per 9.9 policies | Passthrough; outbox is the only retry path (9.12 §10) |
| 11 | **Private documents and signed URLs** | **Network-only unless separately approved** | none (memory-only active view, 9.8 §9) | n/a | "Unavailable offline — refresh to view" | Signed-URL rules (9.8 §9); exception via §10.3 |

Rules:

1. Rows 7–11 are **never written to any cache** by the Service Worker or app layers; "network-only" means passthrough with zero caching semantics (§10).
2. The matrix is the reference; the registry (§3) is the enforcement; a request is classified by its URL against registry entries, and the **most restrictive** matching entry wins (§3.3).

## 3. Strategy resolution and enforcement

### 3.1 Classification

1. Every request is classified by exact URL against the registry entries (9.12 §4.1). Classification order: exact-match entries first, then prefix/pattern entries; a request matching both a static and a network-only pattern (e.g., a path that was later moved into admin) resolves to the **most restrictive** strategy — network-only beats cache-first (see §3.3).
2. Classification is deterministic and testable: the registry ships a decision table used by both the SW and the test suite, so the strategy applied is always the strategy reviewed.
3. The registry is the only place strategies exist. There is no inline `fetch` handler logic that chooses strategies.

### 3.2 Enforcement layers

| Layer | Enforces |
|---|---|
| **Server headers** | `Cache-Control` per category (public content cacheable with TTL; sensitive content `private`/`no-store`, 9.7 §11, §11 below) — the server is the first authority |
| **Service Worker registry** | Interception, strategy, cache namespace, validation gates (9.12 §4–§6) |
| **CDN/proxy config** | Only public categories reach the CDN; authenticated routes are excluded by config (cookie/auth bypass) |
| **App/cache layer** | Record contract, tiers, scope validation, watermarks (9.7 §5–§6, 9.5 §4.3) |

### 3.3 Most-restrictive-wins

1. If two entries could match the same URL, the **most restrictive** strategy applies (order: network-only > network-first > stale-while-revalidate > cache-first).
2. A registry containing two entries for one URL with the same restrictiveness is a **validation error** — installation fails (9.12 §11).
3. Authorization presence is an override: a request carrying an `Authorization` header (or a session cookie) is **never** served from a public namespace, regardless of the matched entry (§11.3) — matching 9.12 §6 check 4's `Vary: Authorization` rule.

### 3.4 Strategy vs. connection state

- Cache-first and SWR categories operate independently of the connection state (9.4) — they are designed for offline.
- Network-first categories consult the connection state for *display* (9.4 states) but always attempt the network first; the fallback decision is made on network failure, within TTL.
- Network-only categories are governed entirely by the connection state and the 9.9/9.10 outbox — the SW does not participate.

## 4. Cache-first with versioned filenames (category 1)

1. **Versioned filenames are mandatory**: every JS/CSS/font/icon URL includes a content hash (e.g., `app.a1b2c3.js`). A file change ⇒ a new URL ⇒ a new cache entry; the old entry is superseded naturally and cleaned by activation (9.12 §8).
2. Cache-first with **immutable** semantics: `Cache-Control: public, max-age=31536000, immutable` on the server; the SW serves from cache without revalidation (the URL version is the invalidation).
3. Precache at install from the build manifest; a failed precache aborts installation (9.12 §11).
4. Cache hit → serve; miss → network + store (validated per 9.12 §6). The SW never serves a *different* version of the file for the URL, and never renames URLs.
5. Offline navigation to the app shell resolves through this category (shell = versioned static) per 9.12 §10.2.

## 5. Public published salon media (category 2)

1. **Versioned media** (hashed image URLs from the CDN): cache-first, 7-day TTL, immutable.
2. **Unversioned media** (salon-uploaded images with stable URLs): **stale-while-revalidate with expiration** — serve cached copy, revalidate in background; within the 7-day TTL a failed revalidation may serve the cached copy **with a stale marker** (Tier A aged mode, 9.7 §4.4); at expiration the entry is discarded (9.12 §11 corrupt/deleted handling).
3. Validation: content-type image allowlist, size cap (default 5 MB per 9.12 §6), atomic writes; never cached if the response is an error, redirect-to-error, or opaque (9.12 §6).
4. Media with private content is never published through this category — it is a private document (category 11) and follows §10.3.

## 6. Public salon information (category 3)

1. **Stale-while-revalidate with expiration**: serve the cached copy immediately (≤ 60 min TTL), revalidate in the background; on 304, refresh timestamps; on 200, replace atomically; on revalidation failure, keep serving the cached copy within the aged window (Tier A, hard discard at 24 h per 9.8 §11.1) with "as of" markers.
2. This is the only category where serving stale-with-marker is the *designed* behavior (public, non-decision data); all other categories degrade differently.
3. Only **public, published** content is eligible: no unpublished drafts, no staff-private fields (9.8 §3.2 salon-profile projection), no authenticated variants. The server enforces `Cache-Control: public, max-age=3600` and the CDN may cache these routes.
4. Cache key = exact URL including query string (e.g., `?salon=slug`); query parameters are never stripped unless the registry entry explicitly declares a canonical key.

## 7. User-specific low-risk reads (category 4)

1. **Network-first with scoped short-lived fallback**: attempt the network; on failure, serve the fallback **only if all of**: (a) the entry exists in the caller's own namespace `nexora-api-vN:<userScopeHash>` (9.12 §7), (b) it is within its TTL (24 h settings / 15 min lists, 9.2 §5.2), (c) it passes the record contract and read pipeline — user/tenant/salon fields match, schema valid, checksum ok (9.7 §5–§6), (d) no revocation is known (9.5 §9.3). Any failure of (a)–(d) → no fallback.
2. The fallback is rendered with "as of" + "(cached)" markers (9.7 §8) and is never confirmed-styled (9.7 §8.1).
3. Writes to the namespace follow write-newer-only with the record's `version` (9.5 §4.3); the SW itself never chooses between versions (9.12 §12).
4. "Low-risk" is defined by the category's approved domains (9.2 §3, 9.7 tiers): settings, own non-sensitive lists. Anything financial, entitlement, or authorization-related is category 7/9, never here.
5. Per-user namespaces make the cache strictly user-scoped — a fallback is **never** served from a public namespace or another user's namespace (§11).

## 8. Booking and proposal status (category 5)

1. **Network-first, then Realtime reconciliation**: the authoritative read is the network fetch of the current status (booking/proposal/verification record). Once fetched (and on every subsequent fetch), the view is kept current by the realtime events of 9.1 (subscription lifecycle per 9.3, version discipline per 9.5).
2. The fetch and realtime events race by design — the version chain resolves them: applied state is always the highest server version (9.5 §4.1); an event older than the fetched state is dropped, an event newer triggers a scoped refetch (9.5 §6.1).
3. Offline fallback: the last **server-confirmed** state (from the app's confirmed store/watermark, 9.5 §3.2) may render within the 15-minute TTL, with "as of" markers and the connection-state banner (9.4 §4); past TTL → "status unavailable offline". Pending local operations (reschedule/cancel, 9.9) render as pending per 9.6 §3 — never as confirmed status changes.
4. Terminal transitions (confirmed, declined, cancelled, completed) always trigger the entity refetch (9.4 §6.1, 9.5 §5.2) before the UI treats the state as settled — the cache never decides terminality.
5. The SW fallback for this category is subject to the same gates as category 4 (scope, TTL, contract) — status records are user-scoped and never public.

## 9. Notifications (category 6)

1. **Network-first with server reconciliation**: fetch the inbox on read; reconcile the badge against the server count (9.5 §8.2) on every applicable trigger (reconnect, visibility resume, TTL expiry, event).
2. Offline fallback within 5-minute TTL, labeled "(cached)" and with an explicit note that unread counts may be outdated; queued read receipts (9.9) adjust the *pending* display only (9.6 §3), never the authoritative count.
3. Notification payloads follow the 9.8 §3.2 projection (ID, type, title, snippet, read flag, version); full bodies and attachments are private documents (category 11).
4. Realtime events update the badge advisory-only; the server count is the authority (9.5 §8.1).

## 10. Network-only categories (rows 7–11)

### 10.1 Financial records and balances — network-only **by default**

1. Default is hard network-only: passthrough, no caching in any layer, `Cache-Control: no-store, private` from the server (9.7 §11), Tier D display rules (9.7 §3), "Available when online".
2. **Exception path** (the "by default" escape): a written protocol proving safety — modeled on 9.9 §9.2 — covering encryption at rest (9.8 §12), short TTL (≤ 5 min), per-user namespace with record contract, revocation purge, threat model (device loss, injection, cross-account), and change control. An exception applies to one named endpoint only, never to a category. **No such exception currently exists.**

### 10.2 Payments, refunds, payouts, commissions — network-only

1. Hard exclusion: never registered in the SW registry, never intercepted, never cached, never replayed (9.12 §5, §10.3). Payment views follow 9.1 §6 (server-verified records only) and 9.4/9.7 rendering.
2. There is no exception path in this row. Payment-adjacent *status snapshots* displayed elsewhere are Tier C reads (9.7 §3) and follow category 5/6 rules — the financial *values and outcomes* remain network-only.

### 10.3 Private documents and signed URLs — network-only unless separately approved

1. **Private documents**: referenced by server-issued record ID only (9.10 §9.2); content fetched on demand over authorized endpoints; never cached, never in the outbox, never in IndexedDB (9.8 §4).
2. **Signed URLs**: memory-only active view, short server-set validity (5 min default / 15 min max), SW passthrough (`cache: "no-store"`), never in logs/queues (9.8 §9).
3. **Separately approved exception**: none exists. Any future approval would require: per-endpoint scope, short TTL, encrypted user-namespace storage with in-memory key, immediate purge semantics, and the 9.8 §15 review path. Signed URLs themselves remain memory-only regardless — the exception could never extend to caching the *credentials* in the URL.

### 10.4 Authentication, authorization, RPC, mutations, admin — network-only

- Auth/authz: passthrough; tokens never cached or inspected (9.8 §8, 9.12 §5); session persistence is the auth client's exclusive domain.
- RPC/mutations/admin: passthrough; the typed outbox (9.10) is the only retry mechanism, and it operates in the app layer with its own pre-flight — the SW holds nothing (9.12 §10.1).

## 11. Sensitive authenticated responses are never stored in a shared public cache

### 11.1 What counts as a "shared public cache"

Any cache that is not strictly scoped to the authenticated user: the browser HTTP cache (disk-backed), the Service Worker's public namespaces (`nexora-static-vN`, `nexora-images-vN`, `nexora-api-vN:public`), CDN edge caches, and shared proxy caches. A device's disk cache is shared across users of that device and with anyone who can access the disk (9.8 §2).

### 11.2 Rules

| Layer | Rule |
|---|---|
| **Server (HTTP)** | Sensitive authenticated responses carry `Cache-Control: private, no-store` (financial/payment/auth per 9.7 §11; `private` alone is insufficient for highly sensitive data — no-store is required so even the browser's disk cache cannot persist them). Never `public`, never a positive `max-age` |
| **CDN / proxy** | Public categories only (rows 1–3). Authenticated routes are excluded by configuration (bypass on cookie/Authorization); a misconfiguration that caches an authenticated response is an incident (9.4 §11.7) |
| **Service Worker** | Authenticated responses are written only to per-user namespaces (§7, 9.12 §7), and only for approved low-risk reads; public namespaces never receive authenticated content; `Authorization`/session-cookie requests are never served from public namespaces (§3.3) |
| **App layer** | Every displayed cached record passes the 9.7 §6 read pipeline; the record's own user/tenant fields are the boundary (9.8 §6) — a record that fails scope validation is discarded, never displayed |

### 11.3 Authorization override

A request carrying an `Authorization` header or session cookie is treated as authenticated: the SW serves it **only** from the matching per-user namespace, and only if the registry entry is a user-scoped read; otherwise passthrough. There is no "authenticated request served from the public cache" path, in either direction (write or read).

### 11.4 Verification

- Automated header audit: every sensitive endpoint's response includes `no-store` (test per endpoint class).
- SW interception tests: authenticated responses never land in public namespaces; cross-user namespace reads return nothing (9.12 §13).
- CDN config test: authenticated route list is excluded at the edge (deployment check).

## 12. TTL, expiration, and cache-key parameters

### 12.1 TTL and expiration summary

| Category | TTL (9.2 §5.2) | Expiration behavior |
|---|---|---|
| Versioned static | 1 year (immutable URL) | Never expires within a URL version; superseded by version bump |
| Public media | 7 days | Discard at expiration; stale-with-marker within window (Tier A) |
| Public salon info | 60 min | Serve stale with marker ≤ window; hard discard at 24 h (9.8 §11.1) |
| User low-risk reads | 24 h settings / 15 min lists | Fallback refused past TTL (no aged mode for fallbacks — 9.7 §3) |
| Booking/proposal status | 15 min | Fallback refused past TTL; confirmed-store display per 9.7 aged rules |
| Notifications | 5 min | Fallback refused past TTL; badge always reconciled server-side |
| Financial/payment/auth/admin/RPC | n/a | Never cached |

### 12.2 Rules

1. TTL evaluation uses the server's `Date`/`Age`/`max-age` when available; the local clock is the fallback and is display/TTL-only (9.5 §4.4, 9.7 §12 clock skew).
2. Every fallback and SWR entry stores `fetchedAt` + server timestamp/version headers (9.12 §6 check 8) so the app can apply the 9.7 §6 pipeline and 9.5 watermarks.
3. Cache keys: exact URL by default; user-scoped reads keyed with the scope hash namespace; static assets keyed by hashed filename; query strings preserved unless the registry declares a canonical key.
4. TTL and expiration values are part of the registry and therefore change-controlled (§16); a server `max-age` shorter than the registry TTL wins at write time (9.12 §6 check 3).

## 13. Edge cases

| Edge case | Handling |
|---|---|
| URL matches two registry entries | Most restrictive wins (§3.3); duplicate same-level entries fail install |
| Authenticated request hits a public-category pattern | Authorization override (§11.3): never served/written to public namespaces |
| User switches account mid-session | New scope hash namespace; old namespace purged with verification (9.8 §10.2); fallbacks from the old user never served |
| CDN serves a stale public catalogue after a salon update | Public info is SWR: next revalidation (≤ 60 min) or explicit invalidation refreshes; SW caches are bumped via cache-name version on release (9.12 §8) |
| Realtime event arrives between fetch and render (category 5) | Version chain resolves; newer wins; gap triggers refetch (9.5 §4.1) |
| Revalidation 304 for a resource deleted server-side | Cached copy deleted, never served (9.12 §12) |
| First visit offline | No cache exists → network error → app offline UI (9.12 §12); no fabricated page |
| Signed URL inside a cached page snapshot | Signed URLs are memory-only (9.8 §9); page snapshots never contain them (projection + denylist, 9.8 §4) |
| Media over size cap / wrong content type | Not cached; passthrough (9.12 §6) |
| Clock skew stretches a fallback window | TTL uses server time when present; skew bounded by mandatory resync on reconnect (9.4 §5–§6) and hard expiration (§12.1) |
| Notifications fetched while a read receipt is queued | Server count excludes the pending receipt until flush (9.9); the queued item renders as pending, never as confirmed (9.6 §3) |

## 14. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Realtime reconciles categories 5–6 after network fetches; cached payloads never substitute for server-verified events |
| 9.2 | TTLs and cache families originate in 9.2 §2.1/§5.2; this section assigns strategies to them |
| 9.4 | Connection states govern display and fallback eligibility for network-first categories |
| 9.5 | Versions/watermarks resolve fetch-vs-event races; write-newer-only governs cache writes |
| 9.6/9.9/9.10 | Queued operations render as pending over cached/confirmed state; outbox is the only retry path |
| 9.7 | Tiers and the record contract gate every fallback; Tier D is never cached (categories 7–8) |
| 9.8 | Sensitive data and namespaces: per-user separation, projections, signed URLs, no-store |
| 9.12 | The registry, validation gates, separation, and activation cleanup are the enforcement machinery for this section |

## 15. Implementation acceptance checklist for 9.13

- [ ] Every resource category in §2 has exactly one strategy in the registry; a request's strategy is deterministic (decision-table test) and no runtime strategy inference exists.
- [ ] Cache-first applies only to versioned static assets (and approved public media); all static URLs are hash-versioned and immutable.
- [ ] Public salon info is SWR with 60-min TTL and 24-h hard discard; stale serving is marked; no stale data beyond expiration.
- [ ] User low-risk reads, booking/proposal status, and notifications are network-first with TTL-bounded, scope-validated fallbacks; past-TTL fallbacks are refused (tests per category).
- [ ] Booking/proposal status reconciles via realtime after fetch; version races resolve per 9.5 (race test).
- [ ] Notification badge reconciles with the server count (9.5 §8.2); fallback labels "(cached)" and never shows authoritative counts.
- [ ] Financial, payment, auth, RPC/mutation/admin, and private-document/signed-URL categories are network-only: interception tests prove zero caching, zero replay, zero namespace writes; signed URLs memory-only.
- [ ] No sensitive authenticated response exists in any shared public cache: header audit (no-store), SW namespace tests, CDN exclusion check (§11.4).
- [ ] Authorization override enforced: authenticated requests never read/write public namespaces (test).
- [ ] Registry conflict validation: duplicate same-level entries fail install; most-restrictive-wins is tested.
- [ ] TTL/expiration parameters match §12.1 and 9.2 §5.2; server `max-age` shorter than registry TTL wins (test).
- [ ] Edge-case suite: account switch, 304-on-deleted, first-visit offline, signed-URL-in-snapshot, clock skew, media validation.

## 16. Change control for 9.13

Any modification to the strategy matrix, per-category strategies or TTLs, fallback eligibility, cache-key rules, or the exception paths (financial default, private documents/signed URLs) requires:
- Security/privacy review (shared-cache exposure, cross-account fallback reads, sensitive-data caching)
- Cache-strategy and TTL review against 9.2 §5.2 and 9.7 tiers
- Registry and interception-test updates
- CDN/edge configuration review for any public-category change
- Update to this specification before release.

---

**Sub-point:** 9.14 — Sign-Out, Account Switching & Revocation  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

The **identity boundary** is the point at which no state, subscription, queue, cache entry, or background task may continue to be associated with a session that is ending. This section consolidates the teardown rules scattered across 9.2 §4.3, 9.3 §3.4/§3.6/§3.7/§10, 9.4 §10, 9.8 §7, 9.10 §6.4, and 9.12 §7 into **one canonical procedure** applied to sign-out, account switching, and permission/tenant revocation.

Governing rules:

1. **The nine-step sign-out sequence of §3 is mandatory and ordered.** Every step runs, in order, on every sign-out path (user-initiated, session expiry, server revocation, shared-device lock, forced sign-out). Skipping, reordering, or deferring a step is a spec violation.
2. **Step 0 precedes everything**: the identity epoch advances before the first teardown action, so no in-flight callback, timer, or background task can act on the old identity after the boundary (9.4 §2.2).
3. **Local purge never depends on server reachability.** Even if `auth.signOut()` or revocation notices fail at the network layer, every local step still completes and verifies.
4. **Account switching is sign-out followed by sign-in**: no cached record, queued write, notification, or Realtime event from the previous account may be reused, processed, or displayed; all state is rebuilt from the new verified session and authorized server queries (§6).
5. **Permission/tenant revocation triggers cleanup equivalent to sign-out, scoped to the affected tenant or resource scope** (§7) — the session may survive, but nothing for the revoked scope does.
6. Every purge is verified by read-back enumeration (9.8 §10.2); an unverified purge leaves the scope **unusable** (fail closed) until the purge is confirmed.

## 2. Identity boundary — what must be cleared

"User-scoped state" is defined exhaustively. Every item below is subject to the §3 procedure on sign-out and to §7 scope filtering on partial revocation:

| # | Class | Contents | Reference |
|---|---|---|---|
| 1 | **Realtime subscriptions** | All channels owned by the session/registry; the realtime socket | 9.3 §3.4, 9.4 §10 |
| 2 | **Outbox operations** | All queued/draft/syncing ops for the user; flush timers and claims | 9.9 §5.2, 9.10 §6.4 |
| 3 | **Private in-memory state** | React state/contexts, refs, module singletons, optimistic store (9.6 §4), connection-manager state, event emitters, sessionRevision-bound values | 9.3 §10.4, 9.4 §10 |
| 4 | **Query caches** | Client-side query stores (React Query/SWR equivalent), in-memory entity maps | 9.3 §10.4 |
| 5 | **Offline records** | IndexedDB user-scoped object stores, watermarks (9.5 §6.3), outbox store, drafts | 9.2 §4.3, 9.5 §6.3 |
| 6 | **Cached private API responses** | CacheStorage per-user namespaces, SW `read_api_user` entries | 9.12 §7, 9.13 §11 |
| 7 | **Temporary signed URLs** | All in-memory signed URLs for the user's scopes | 9.8 §9 |
| 8 | **Background tasks** | Timers (backoff, probes, heartbeats, retries), listeners (online/offline/visibility/pageshow), BroadcastChannel, Web Locks, in-flight fetches, workers | 9.4 §10 |
| 9 | **Session material** | Auth client storage/cookies (token, refresh token), any namespaced localStorage/sessionStorage keys | 9.8 §8 |
| 10 | **UI** | Connection state → `idle`; all screens → public/auth state | 9.4 §2 |

Public, non-sensitive state that may survive the boundary (and only this): theme, language, list density preferences (9.8 §5), the public catalog cache (Tier A, public namespace, 9.12 §7), and the previous route for redirect purposes. Everything else is identity-scoped.

## 3. The canonical sign-out sequence

**Step 0 — Advance the epoch and freeze the old identity** *(preamble, runs first)*:

1. Increment the connection manager's `epoch` (9.4 §2.2) and the auth `sessionRevision` (9.3 §3.4). Every callback tagged with the old epoch/revision is now inert by construction — it may fire, but it cannot act.
2. Abort all in-flight fetches and mutations via their `AbortController`s; discard responses that arrive after the abort (they carry the old identity's auth).
3. Cancel and clear all timers: backoff, probes, heartbeats, retry schedules, badge reconciliation (9.4 §10).
4. Release the Web Lock (leader election, 9.4 §9.1) and close the `BroadcastChannel` (9.4 §9).

**Steps 1–9 (the mandatory sequence):**

| Step | Requirement | Actions | Blocking |
|---|---|---|---|
| **1** | Stop all Realtime subscriptions | Tear down every channel in the subscription registry (`removeChannel` per entry), close the realtime socket, discard channel references | Synchronous removal; socket close awaited best-effort |
| **2** | Stop outbox processing | Cancel flush cycles and retry timers; release any in-flight claims (9.10 §4.2); mark nothing else `syncing` — items left `syncing` by a crash are purged anyway (§5) | Immediate; no new claim possible (epoch) |
| **3** | Remove private in-memory state | Clear per 9.3 §10.4: contexts, refs, module singletons, optimistic store (9.6 §4), connection state → `idle`, event emitters | Synchronous |
| **4** | Clear user-scoped queries and caches | `queryClient.clear()`-equivalent; clear in-memory entity maps; reset watermarks to none | Synchronous |
| **5** | Remove private IndexedDB or other offline records | Delete user-scoped object stores (bookings, settings, notifications, drafts), the outbox store, watermarks; per 9.2 §4.3 | Awaited (IndexedDB transaction per store) |
| **6** | Remove cached private API responses | Send `purge-user` (scope hash) to the Service Worker; SW deletes the user's CacheStorage namespaces (9.12 §7); clear any CacheStorage entries written by the app directly | Awaited; verified by enumeration (§5) |
| **7** | Invalidate temporary signed URLs | Drop every signed URL from memory and from rendered views; replace with "sign in to view" placeholders; server-side invalidation per §9 | Synchronous (local); server action where supported |
| **8** | Ensure no background task continues using the old identity | Verify timer/listener counts are zero (9.4 §10.5); confirm no fetch/socket/BroadcastChannel/worker retains the old token or scope; the only "background" that may remain is the Service Worker, which holds no identity state (9.12 §2) | Verified by audit checks (§5) |
| **9** | Terminate the session and redirect | Call `auth.signOut()` (local clearing first; server revocation attempt best-effort); clear auth storage keys and session cookies (9.8 §8); set connection state `idle`; navigate to the appropriate public or authentication screen (`/` or `/login?reason=...` per trigger) | Redirect last — nothing user-visible may precede the purge |

The sequence is executed by a single `signOut(reason, destination)` routine owned by the app shell; components call it and never implement their own partial teardown.

## 4. Per-step requirements

### 4.1 Step 1 — Stop all Realtime subscriptions

- Tear down the registry in full (9.3 §4.2 `teardownAll()`): iterate channels, `removeChannel`, clear refcounts. Then close the socket (`supabase.removeAllChannels()` + transport close per 9.4 §10) so no further handshake can occur with the old token.
- A channel that errors during teardown is still removed; teardown never retries a failing removal (9.3 §5.2).
- This runs **before** `auth.signOut()` (step 9): after sign-out the old JWT is invalid and any reconnection attempt would surface auth errors (9.3 §3.6).

### 4.2 Step 2 — Stop outbox processing

- Flush cycle, claim CAS, retry timers, and Background Sync registration for `nexora-sync-writes` are all cancelled. The SW is told to stop signalling the outbox (or the signal is ignored — epoch makes it inert).
- No operation is *sent* after step 0: the pre-flight of 9.10 §6 already refuses sends when the epoch advances mid-flight; an in-flight send is aborted and its result discarded; the item is purged in step 5 — **never** re-queued for a future session (9.10 §6.4).

### 4.3 Step 3 — Remove private in-memory state

Exactly the 9.3 §10.4 inventory: reset contexts and stores, null refs, clear the optimistic store (9.6 §4), reset the connection manager to `idle`, remove event-emitter listeners, and clear any module-level cache. The UI must not flash the previous user's data during the transition — state is cleared before navigation (step 9) and before any new subscription (9.3 §10).

### 4.4 Step 4 — Clear user-scoped queries and caches

- Client query caches are cleared wholesale (`queryClient.clear()`), not invalidated-and-refetched: refetching under the old identity is forbidden.
- In-memory entity maps and per-scope stores (booking cache, notification cache) are cleared (9.3 §10.4).
- Watermarks (9.5 §3.2) are dropped; the new session starts at version 0 (9.5 §6.3).

### 4.5 Step 5 — Remove private IndexedDB or other offline records

- Delete every user-scoped object store listed in 9.2 §2.1 (bookings, salon profiles, user settings, services, availability, notifications), the outbox store (9.10 §5), the drafts store (9.9 §2), and watermark records.
- Deletion is per-store in one transaction set; failure deletes the remaining stores on retry and is reported by the §5 verification.
- The offline write queue is purged with read-back verification (9.2 §4.3, 9.8 §10.2) — queued writes never survive across accounts (9.10 §6.4).

### 4.6 Step 6 — Remove cached private API responses

- The app sends `purge-user` with the user's scope hash; the Service Worker deletes every `nexora-api-vN:<userScopeHash>` namespace (9.12 §7.4) and acknowledges.
- The app enumerates remaining entries to verify (9.8 §10.2); anything left is deleted in a forced pass.
- Public namespaces (`nexora-static-vN`, `nexora-images-vN`, `nexora-api-vN:public`) are untouched — they contain no identity data by construction (9.13 §11).

### 4.7 Step 7 — Invalidate temporary signed URLs

- All signed URLs in memory are dropped immediately and never rendered again (9.8 §9).
- Client-side invalidation is a *release*, not a *revocation*: the URL may still be valid server-side until expiry. The server bounds the risk via short validity (5 min default / 15 min max) and, where supported, revokes outstanding URLs on sign-out (§9).

### 4.8 Step 8 — No background task with the old identity

- Audit: zero timers, zero listeners, zero open channels, zero in-flight fetches with the old auth, BroadcastChannel closed, Web Lock released (9.4 §10.5).
- The Service Worker is the only permitted survivor, and it is identity-free by design: it holds no tokens, no payloads, no business state (9.12 §2.2); its user-scoped namespaces were deleted in step 6.
- If the audit finds anything, the sign-out completes anyway and the finding is logged as a teardown-leak error (9.4 §12) — the epoch guarantees it cannot act, but leaks are bugs to fix, not conditions to wait for.

### 4.9 Step 9 — Terminate the session and redirect

- `auth.signOut()`: local auth state cleared synchronously; server-side refresh-token revocation attempted (best-effort — if the network is down, local sign-out still stands; the token remains valid server-side only until expiry/rotation, which is bounded by design, 9.8 §8).
- For account deletion or compromise: `signOut({ scope: "global" })`-equivalent so all tabs/devices and the server session set are revoked (9.8 §7, §10).
- Auth storage keys and cookies cleared (9.8 §8.6).
- Redirect: public content (`/`) or the sign-in screen (`/login`) with a `reason` parameter matching the trigger (`user-initiated`, `session-expired`, `revoked`, `account-deleted`, `shared-device-lock`); the previous route may be carried for post-sign-in return **only** if it is non-sensitive (never a route whose data was user-scoped).

## 5. Verification, idempotency, and failure handling

1. **Read-back verification**: after steps 5–6, enumerate IndexedDB stores, the outbox, watermarks, and SW namespaces; zero entries for the scope is the completion condition (9.8 §10.2). Failure → forced second pass, then the scope is marked unusable (reads fail closed, 9.7 §6) and the failure escalates as a security event (9.8 §13).
2. **Idempotency**: `signOut()` called twice is a no-op the second time (state already `idle`, stores already empty, epoch already advanced). The procedure is safe to re-enter from any step (crash mid-sign-out resumes by re-running the whole sequence).
3. **Network failure during `auth.signOut()`**: local steps 0–8 already completed; the redirect still happens; the server-side session remains valid only until token expiry — for sensitive triggers (account deletion, compromise) the app schedules a retry of the server revocation and alerts (9.4 §11.7).
4. **Purge failure**: a failed step 5/6 blocks *new-account* initialization (fail closed, 9.3 §10): user B's session may load, but no subscription or cache write occurs until user A's purge verifies (9.8 §10.3). This is the last line of defense after namespaces/record contracts (§6).
5. **Crash mid-sign-out**: on next launch, the app detects a session mismatch or leftover user-scoped data (namespace marker absent but entries present, or stores not matching the session) and re-runs the purge before allowing sign-in.
6. **Every step logs** at `debug` (step id, outcome); failures log at `error`; nothing logs content (9.8 §13).

## 6. Account switching — the purge-before-subscribe invariant

When another account signs in (user-initiated switch, sign-in after sign-out, or session replacement), **all** of the following hold:

1. **Do not reuse the previous user's cached records.** Three independent layers: (a) the §3 purge ran with read-back verification; (b) per-user namespaces (9.12 §7) make the previous user's CacheStorage unreachable; (c) the record contract (9.7 §5–§6) validates `user_id`/tenant/salon on every read — a surviving entry fails scope validation and is discarded, never displayed (9.8 §6).
2. **Do not process the previous user's queued writes.** The outbox was purged (§4.5); additionally, the 9.10 §6.4 claim gate refuses any op whose `user_id` differs from the current session — a restored or leaked item is a security event, never a send.
3. **Do not show the previous user's notifications or Realtime events.** Subscriptions were torn down (§4.1); the new session's channels are created fresh with the new `auth.uid()` scope (9.3 §3.4); the epoch makes any late event from the old channels inert (9.4 §2.2); notification state is rebuilt from the new inbox query, never from retained state.
4. **Rebuild state using the new verified session and authorized server queries.** On `SIGNED_IN` with a new `auth.uid()`: verify the session (9.4 §7.1), fetch the profile and authorized scopes (roles, salon memberships — fail closed per `nexora-app.tsx`), then initialize: connection state → `connecting`, subscriptions for the new scope (9.3 §2), fresh query cache, watermarks at version 0 (9.5 §6.3), empty optimistic store (9.6 §4), fresh outbox (empty).
5. **Ordering**: purge (verified) → session verify → profile/scope fetch → subscribe → render. The UI shows a loading/skeleton state across the boundary; rendering the previous user's data at any point is a spec violation.
6. **Same-account re-auth** (expired session refresh, not a switch): the full §3 procedure is **not** required — only session re-verification and the 9.4 §7.2 channel verification run. The identity did not change; `user_id` and scopes are unchanged.

## 7. Permission and tenant revocation (scoped cleanup)

### 7.1 Triggers

| Trigger | Example | Scope of cleanup |
|---|---|---|
| Role downgrade | Staff → customer, reviewer removed | The role's resources: subscriptions, cached records, queued ops, in-memory state for that role's scopes |
| Salon membership removed | Staff removed from salon, salon deactivated | That `salon_id` scope only |
| Tenant removal | Partner tenant removed | That `tenant_id` scope |
| Account deactivated | `is_active` false | **Full** sign-out procedure (§3) |
| Record-level RLS revocation | A booking/proposal the user could see becomes unauthorized | The affected entity records (9.5 §9.3) + related collection entries |

Detection: RLS suppression markers and auth close codes (9.4 §8.1, 9.5 §9.3), profile/scope refetch on auth events (9.3 §3.7), periodic scope revalidation (on token refresh and resync, 9.4 §7), and server-pushed revocation notices where supported.

### 7.2 Scoped cleanup — equivalent to sign-out, restricted to the scope

For the affected `scope` (tenant/salon/resource), run the same sequence as §3 restricted to scope-owned items:

1. **Subscriptions**: tear down channels whose channel key/scope matches the revoked scope (9.3 §3.3/§3.7); others stay.
2. **Outbox**: purge ops whose `tenant_id`/`salon_id`/entity scope matches (9.10 §6.2); others stay.
3. **In-memory state**: clear scope-scoped contexts/stores (e.g., salon-scoped booking state, 9.3 §3.3); other scopes untouched.
4. **Queries/caches**: invalidate scope-scoped queries; delete the scope's cached records (record contract match, 9.7 §6) from IndexedDB and the per-user SW namespace (delete by scope-key prefix, 9.12 §7).
5. **Signed URLs**: drop URLs issued for the revoked scope (§9).
6. **Background tasks**: cancel scope-scoped timers/refetches; subscriptions to the scope's channels are gone; nothing may keep polling the revoked scope.
7. **UI**: refetch the **permitted** scope (9.3 §3.7) and re-render — the user sees the reduced scope immediately; "Access removed" messaging where the loss is material (9.4 §8.2), never silent.

Rules:

- The session and other scopes **remain** — this is the difference from sign-out. The connection state may dip to `syncing` while the permitted scope refetches (9.4 §6.2).
- **Never resurrect**: a revoked scope's records return only after a fresh authenticated refetch under the current session (9.5 §9.3); the version chain from before revocation is not proof of access.
- **Revocation while offline**: cleanup is queued locally (scope marked revoked in the connection manager); on reconnect, the first resync (9.4 §6.2) applies it — subscriptions for the revoked scope are never recreated, and the profile refetch confirms the scope.
- **Re-grant later**: the user must go through the normal authorized query path; nothing is auto-restored from cache.

## 8. Cross-tab and multi-device coordination

1. **Broadcast**: on sign-out, the app broadcasts `identity:signout` (with scope hash) on the connection channel (9.4 §9.2); other tabs of the same origin purge their own state (same §3 procedure) — on receiving the message if visible, or on `visibilitychange` resume (9.4 §5.2) if hidden.
2. **Leader election**: the sign-out broadcast also releases the Web Lock; a remaining tab takes over leader duties (9.4 §9.1) with the old identity's queues already purged.
3. **Service Worker**: `purge-user` per tab; the SW deletes the namespace idempotently (a second purge of an absent namespace is a no-op, 9.12 §7).
4. **Multi-device**: server-side session revocation (step 9, `global` scope) forces other devices' sessions invalid on their next request; their clients then run the full §3 procedure on session invalidation (9.8 §7 session-invalidation trigger).
5. **Kiosk/shared devices**: the shared-device mode (9.8 §10) additionally runs the §3 procedure on idle auto-lock and on tab close (best-effort via `pagehide`), and disables account switching per deployment policy.

## 9. Signed URL invalidation

1. **Client release**: on sign-out/switch/scope revocation, every signed URL for the affected identity/scope is dropped from memory and views (§4.7). The client cannot cryptographically revoke a URL it holds; it can only stop holding and rendering it.
2. **Server revocation**: the server, on session invalidation or scope revocation, invalidates outstanding signed URLs for that identity/scope where the provider supports revocation (denylist of URL IDs at issuance time); otherwise, short validity (5 min default / 15 min max, 9.8 §9.2) bounds staleness.
3. **Post-boundary fetch**: any request made with a stale URL (e.g., from a captured link) fails authorization server-side and never returns content (9.8 §9.3).
4. Signed URLs are never persisted (§4.7, 9.8 §9.1), so there is no offline-cache path to purge — only memory and any in-flight render.

## 10. Server-side requirements

1. **Session revocation**: endpoints for single-session and global sign-out (`auth.signOut` with `scope: "global"` equivalent); account deletion revokes all sessions server-side (9.8 §7).
2. **Revocation notice**: tenant-removal and membership changes are enforced by RLS at the row level (9.1 §4.2) and surfaced to clients through realtime auth close codes / RLS suppression markers (9.4 §8.1) so the client runs §7 cleanup promptly.
3. **Signed URL invalidation**: URL-ID denylist or equivalent for revocation and sign-out (§9).
4. **Audit**: sign-out, session revocation, and scope-revocation events are logged (user/scope IDs, trigger — no content, 9.8 §13) and available for incident analysis.
5. **Auth token lifetime**: short access-token lifetime (~1 h) and refresh-token rotation bound the window in which a sign-out that failed to reach the server leaves a usable session (9.8 §8.2).

## 11. Edge cases

| Edge case | Handling |
|---|---|
| Network down during sign-out | Local steps 0–8 complete and verify; step 9 local portion runs; server revocation retried later; redirect still occurs (§5.3) |
| Purge verification fails | Scope marked unusable; new session blocked from subscribing/caching until verified; security event (§5.4) |
| Crash mid-sign-out | Next launch detects leftover state and re-runs the purge before any sign-in (§5.5) |
| bfcache restores the previous user's page | `pageshow` with `persisted` re-validates the session; absent → re-run purge + redirect (9.8 §10.3) |
| Two tabs sign out simultaneously | Idempotent procedure; broadcast deduplicates; purge runs per tab; SW purge idempotent (§8) |
| Sign-out during outbox flush | Epoch abort wins; in-flight response discarded; item purged, never re-queued (§4.2) |
| Sign-out during a payment redirect | Payment provider flow is out-of-app; on return the session is absent → sign-in screen; the payment record's authority is server-side (9.1 §6), unaffected |
| Revocation while offline | Cleanup deferred to reconnect; revoked scope never recreated; profile refetch confirms (§7.2) |
| Switch to the same account (re-auth) | Not a boundary crossing; only session re-verification and channel checks (§6.6) |
| Revocation of a record, not a scope | Record-level purge (9.5 §9.3) + collection invalidation (9.7 §7) |
| Leftover SW namespace after purge failure | Forced pass + enumeration; namespace stays unusable (fail closed) until empty (§5.4) |
| Sign-out from a public page (no session) | No-op path: state already `idle`, stores already empty; redirect only |

## 12. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Channel authorization and RLS make revocation observable (auth close codes, suppression) |
| 9.2 | Store deletion and queue purge originate in 9.2 §4.3; this section is their canonical execution |
| 9.3 | Ownership/teardown triggers and cross-user clearing are the foundation; §3 executes 9.3 §3.4–§3.6/§10 |
| 9.4 | Epoch, connection states, teardown inventory, leader election, permanent-auth-failure recovery |
| 9.5 | Watermark reset, write-newer-only, revocation records, refetch-before-restore |
| 9.6 | Optimistic store cleared at the boundary; pending ops never cross accounts |
| 9.7 | Record contract validates scope on every read; purge verification fail-closed |
| 9.8 | Clearing triggers, shared-device mode, session material, signed URLs, encryption keys (in-memory — gone with the tab) |
| 9.9 | Outbox purge; policies gate what could exist at the boundary |
| 9.10 | Typed outbox claim gate refuses foreign `user_id`; states terminalized at purge |
| 9.12 | `purge-user` and namespace deletion; SW identity-free |
| 9.13 | Public namespaces survive; user namespaces die; sensitive responses never shared |

## 13. Implementation acceptance checklist for 9.14

- [ ] The nine-step sequence runs on every sign-out path (user-initiated, expiry, revocation, lock, forced); a single `signOut()` routine exists and is the only entry point.
- [ ] Step 0 epoch/revision advance precedes all teardown; an injected callback firing after the boundary cannot mutate state (test).
- [ ] Step-by-step tests: zero channels/socket after step 1; zero flush/claims after step 2; zero in-memory state after step 3; zero query-cache entries after step 4; zero IndexedDB/outbox/watermark entries after step 5 (enumerated); zero user-namespace CacheStorage entries after step 6 (enumerated, SW acknowledged); zero signed URLs after step 7; zero timers/listeners/channels/fetches after step 8; redirect with correct `reason` after step 9.
- [ ] Purge runs and verifies even when `auth.signOut()` is network-blocked (network-cut test).
- [ ] Idempotency: double sign-out is a no-op; crash mid-sign-out resumes and completes on next launch.
- [ ] Account switching: sign in as A (populate state, queue a write, open subscriptions) → sign out → sign in as B: enumeration proves zero A records, zero A queue items processed (claim-gate test), zero A notifications/events displayed (subscription + epoch test), and B's state built only from B's session + authorized queries (no A data at any render frame).
- [ ] Revocation: for each trigger in §7.1, scoped cleanup removes only the affected scope's subscriptions, records, queue items, and signed URLs; other scopes and the session survive; permitted-scope refetch re-renders correctly; offline revocation applies on reconnect; nothing is resurrected without an authenticated refetch.
- [ ] Cross-tab: sign-out in tab 1 purges tab 2 (visible or on resume); leader handoff is clean; SW purge idempotent.
- [ ] bfcache: restoring the previous user's page re-validates and purges (9.8 §10.3).
- [ ] Signed URLs: after sign-out/scope revocation, no URL from the old identity/scope is rendered or held; server-side invalidation verified where supported.
- [ ] Shared device: idle auto-lock triggers the full procedure; account switching disabled per policy.

## 14. Change control for 9.14

Any modification to the sign-out sequence, step ordering or blocking semantics, purge verification, account-switching invariants, scoped-revocation behavior, cross-tab coordination, or signed-URL invalidation requires:
- Threat-model review (cross-account leakage, residual identity state, resurrected data)
- Regression of the full boundary test suite (all §13 scenarios)
- Cross-device session-revocation review
- Update to this specification before release.

---

**Sub-point:** 9.15 — Multi-Tab & Multi-Device Behavior  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Users may hold multiple tabs of the same origin (one browser, one account) and multiple devices (same account, different browsers). The platform must behave as one coherent system across all instances: **no corruption, no duplicate processing, no stale authority, and no leakage**.

Governing rules:

1. **Different tabs must not corrupt the cache and must not process the same queued operation multiple times** — enforced by atomic writes, write-newer-only (9.5 §4.3), single-writer claims, and leader-only processing (§2–§4).
2. **Safe locking or coordination is required where only one tab should process the outbox**: Web Locks as the primary mechanism, BroadcastChannel election as the fallback, CAS claims as the per-operation guard (§3).
3. **Every server mutation remains idempotent even if multiple tabs (or devices) submit it** — the server keyed by `Idempotency-Key` is the final arbiter (§5); client coordination reduces duplicate *attempts*, server idempotency eliminates duplicate *effects*.
4. **Realtime updates from another device reconcile with pending local state** — the version chain and the 9.11 conflict workflow decide, never arrival order (§6).
5. **Logout or account suspension propagates across open tabs where supported** (§7); **a stale tab revalidates authentication and permissions before performing sensitive actions** (§8); **background tabs must not indefinitely retain unauthorized subscriptions** (§9).

## 2. Tab topology and coordination primitives

### 2.1 Roles

| Role | Assignment | Responsibilities |
|---|---|---|
| **Leader tab** | Web Lock `nexora:conn:v1` (9.4 §9.1); takeover on loss | Outbox flush (9.10 §4), background re-sync cadence, queue-flush lock, periodic session-validity checks, health probing |
| **Follower tab** | All other tabs | Live UI + own socket/channels (per-instance limits, 9.3 §6.2); no flush, no background cadence |
| **Any tab (user-initiated)** | — | Sign-out (triggers broadcast), manual "Retry", sensitive actions (after §8 revalidation) |

### 2.2 Primitives

| Primitive | Use | Limitation |
|---|---|---|
| **Web Locks API** (`navigator.locks`) | Leader election, per-op claims (`nexora:outbox:op:<op_id>`, 9.10 §4.2), queue-flush guard | Not available in all browsers → BroadcastChannel fallback (9.4 §9.1) |
| **BroadcastChannel** (`nexora:conn:v1`, `nexora:identity:v1`) | State sharing, leader heartbeat (5 s / 20 s silence), sign-out/suspension propagation | Same-origin only; hidden tabs may be throttled → visibility-resume revalidation (§7) |
| **Storage events** (`storage` on keys the app writes) | Cross-tab notifications where BroadcastChannel is unavailable; session-key change detection | Fires only for `localStorage`-level keys; IndexedDB writes do not fire it |
| **IndexedDB transactions** | Atomic multi-store writes; compare-and-swap claims via read-then-write in one transaction | Single-process-per-tab semantics; cross-tab atomicity comes from transactions, not locks |
| **Server idempotency** | The final arbiter for duplicate submissions (§5) | Requires every mutation to carry a key (9.5 §5.3) |

### 2.3 Coordination rules

1. **Coordination reduces duplicate work; idempotency eliminates duplicate effects.** No client coordination is assumed perfect; every server mutation stays idempotent regardless (9.9 §4 cond. 1).
2. All coordination messages are content-free (scope hashes, op IDs, state names — never payloads) (9.8 §13).
3. A tab that cannot reach the coordination channel (channel closed, lock unavailable) degrades to **independent-but-idempotent** operation: it may run its own flush only after acquiring the leader lock; without the lock it never flushes (fail closed, 9.10 §4.2).

## 3. Cache integrity across tabs

1. **Atomic writes**: every cache write is a single IndexedDB transaction (record + checksum + watermark together, 9.7 §5); a torn write from a crashed tab leaves no partial entry (9.7 §12).
2. **Write-newer-only everywhere**: all tabs apply the 9.5 §4.3 comparison (higher version wins; equal no-op; lower dropped) — enforced in the cache layer, so two tabs writing the same entity converge to the newest version without corruption (9.12 §12).
3. **Read-time revalidation**: every display read runs the 9.7 §6 pipeline (structure, checksum, schema, **scope**, expiry, revocation); a concurrently updated entry is re-validated before render, so a tab can never display a stale or wrong-scope record even if it missed the other tab's write.
4. **Single store, not per-tab copies**: components share one canonical store per scope (9.3 §4.2 registry); tabs keep their own *instances* of the same logical store, and convergence comes from (2)+(3), not from copying between tabs.
5. **SW namespace writes** are idempotent per URL (put-then-verify, 9.12 §6); concurrent writes from two tabs result in the last validated response — the app layer's version rules govern business records (9.12 §12).
6. **Never cache-migrate between tabs**: no tab ever imports another tab's in-memory state; the only cross-tab data flows are the content-free broadcast messages and the shared IndexedDB/SW stores themselves.

## 4. Outbox single-processing guarantees

### 4.1 Layered protection (defense in depth)

| Layer | Mechanism | Defeats |
|---|---|---|
| 1 | **Leader-only flush** (Web Lock / election, 9.4 §9.1) | Two tabs flushing simultaneously |
| 2 | **CAS claim** `queued → syncing` in one IndexedDB transaction (9.10 §4.2) | A second claim of the same op |
| 3 | **Per-op Web Lock** `nexora:outbox:op:<op_id>` (9.10 §4.2) | Concurrent claims despite leader failure |
| 4 | **In-memory inflight set** per processor | Re-claim within one cycle |
| 5 | **Server idempotency by key** (§5) | Any duplicate submission producing a duplicate effect |

### 4.2 Rules

1. Only the leader's outbox processor claims; followers never attempt a claim (9.10 §4.2).
2. If the leader dies mid-flush, its claims are released by its death (Web Lock release + IndexedDB transaction rollback/epoch); the successor leader re-queues `syncing` items per 9.10 §4.2 crash recovery and re-submits with the same keys — replay-safe by design.
3. A follower that detects the leader is unresponsive (heartbeat timeout, 9.4 §9.1) attempts takeover: acquire the leader lock; **before flushing, it re-queues any `syncing` ops** (a crashed leader may have left them in flight) — then flushes under its own CAS claims.
4. Cross-device: there is **no** cross-device outbox coordination (devices cannot share a lock). Each device has its own outbox; the same logical operation created on two devices carries the **same idempotency key only when the operation itself was synced between devices** (e.g., via an account-level op log — see §5.2). Otherwise each device's operations have distinct keys and are distinct logical operations by definition.

## 5. Idempotent mutations across tabs and devices

1. **Key generation**: `Idempotency-Key` is a UUID generated at the creation of the logical operation (9.10 §2.2) — per tab, per device, per logical operation. Two tabs racing the same user action (double-tap across tabs) each generate a key; if the UI's double-submit prevention fails, the server sees two keys and two operations — this is why the *server* must also deduplicate the *business* effect where the user intent was single (§5.3).
2. **Same-key collision**: if the same key arrives twice (retry, replay, restored op, or synced op log), the server returns the stored original result — one effect, multiple identical responses (9.5 §5.3, 9.10 §7.4).
3. **Intent-level deduplication**: for effect-bearing actions (booking create, service request), the server additionally enforces a **business-idempotency guard** where defined: a short-window uniqueness constraint on the natural business key (e.g., one active request per `(user, service, salon, time-window)` or a client-supplied `request_token` hashed server-side). Two different keys expressing the same intent collapse to one effect; the loser receives a structured 409 `duplicate_intent` with a reference to the existing record. This guard is per-action, registered, and change-controlled (9.9 §3).
4. **Result propagation**: after the winner commits, the realtime event (9.1) and the 9.5 version chain reconcile all tabs/devices; the loser's UI adopts the server state (9.11 §5) — never a client-side merge of two commits.

## 6. Realtime reconciliation with pending local state (other devices)

When a realtime event arrives for an entity with local pending state (optimistic overlay 9.6, outbox item 9.9/9.10, or a conflict-in-progress 9.11):

1. **Version comparison decides**: the event's `version` is compared against the local confirmed watermark (9.5 §4.1).
   - Event newer than local confirmed + local pending is a *foreign change*: the local pending op is now based on an outdated version → it is a **version conflict** per 9.11 §3 — surfaced to the user (or auto-resolved per its registered conflict policy, 9.11 §2.1).
   - Event equals the version the local op expects (the op committed on this device) → confirm the pending op (9.10 §7) and clear it.
   - Event older → dropped (9.5 §4.1).
2. **No arrival-order authority**: an event from another device arriving early or late never reorders the version chain (9.5 §2.3); the local pending overlay is never "overwritten" by a lower-version event, and never *wins* over a higher-version event (9.6 §6).
3. **Outbox items for the same entity** are held per the 9.10 §4.1 ready-predicate: if the entity's watermark advanced (foreign change), the item's snapshot is stale → the item transitions per its conflict policy (9.11 §7.2); a `booking:reschedule` based on a superseded state is re-presented, never blindly flushed.
4. **Derived state** (badges, list positions) reconciles via the 9.5 §6 triggers on every event: version gaps → refetch; the 9.5 §8.2 server count is the badge authority regardless of which device marked the read.
5. **The connection state (9.4) governs presentation** per tab: a tab receiving the event while `reconnecting` buffers/refetches per 9.4 §6.3 — the other device's change still converges via resync, not via the dropped event.

## 7. Logout and account-suspension propagation across tabs

1. **Broadcast**: the sign-out routine (9.14 §3 step 0) broadcasts `identity:signout` (+ scope hash) on `nexora:identity:v1` *before* local teardown completes. Receiving tabs run the full 9.14 §3 procedure immediately (visible) or on `visibilitychange` resume (hidden, throttled) (9.14 §8.1).
2. **Fallback channels**: where BroadcastChannel is unavailable, tabs detect sign-out via (a) the auth storage key disappearing (storage event or key re-read on focus), (b) the SW namespace purge message, or (c) session revalidation failure on the next action (9.14 §8).
3. **Account suspension** (server-side): the server revokes sessions (9.14 §10.1); every tab/device discovers it on its next authenticated request or socket event (auth close code, 9.4 §8.1) and runs the session-invalidation path (9.8 §7, 9.14 §4.9 with `reason=revoked`). Push propagation: where supported, the server notifies via the realtime channel so *active* tabs are suspended without waiting for a request.
4. **Not supported cases**: a tab that is fully suspended by the OS may not receive the broadcast or a socket close; it revalidates on resume (9.4 §5.2) and then runs the procedure. This is why §8 revalidation is mandatory, not best-effort.
5. **Leader handoff** follows sign-out per 9.14 §8.2; the old identity's queues are purged before any new leader flushes.

## 8. Stale-tab revalidation before sensitive actions

A **stale tab** is any tab whose session/permission knowledge may be outdated: hidden for a long time, restored from bfcache, resumed after suspension, or missed a broadcast.

1. **When revalidation is mandatory** — before any **sensitive action** (defined per 9.9 §3 registry as any action not `draft_only`/`queued`-low-risk, plus any action on financial/authorization/verification domains): the tab must have (a) a session that is valid *now* (expiry margin ≥ 30 s, 9.10 §6.1 — refresh first), and (b) permissions for the action's scope *now* (profile/scope refetch if the profile is older than 60 s or any auth event occurred, 9.10 §6.2), and (c) no known revocation (9.14 §7).
2. **Trigger points**: `visibilitychange → visible`, `pageshow` with `persisted`, focus after ≥ 5 min away (blur/focus alone is insufficient — 9.3 §3.8), and before every outbox flush claim for effect-bearing ops (9.10 §6).
3. **Behavior on failure**: revalidation failure blocks the action (disabled with "Session expired — sign in again" or "Access changed — reload"), runs the 9.14 session-invalidation path for expired sessions, and never falls back to cached permissions (9.7 §2.2 — permissions are never cached).
4. **Fast path**: if the tab was continuously visible and the profile is fresh, revalidation is a no-op — it is a state check, not a forced refetch.
5. **Sensitive actions** always pass through the mutation gateway (9.9 §3.2), which performs this check centrally — components cannot bypass it.

## 9. Background tabs must not indefinitely retain unauthorized subscriptions

1. **Subscription lifecycle is visibility-aware** (extending 9.3 §3.8): non-critical channels (availability, badge) are **paused** on hide; critical channels (active booking/payment view, 9.3 §3.8) remain subscribed while the session is valid.
2. **Bounded background retention**: a hidden tab's *critical* subscriptions remain only while (a) the session is valid, and (b) the entity is still in the user's authorized scope. Both are re-verified on a **hidden-tab revalidation cadence** (every 15 min while hidden, using the leader's session/scope check results where available via the broadcast — 9.4 §9) and on every visibility resume.
3. **Revocation in the background**: if the server revokes access while the tab is hidden (RLS suppression on the channel, auth close code, or the leader's revalidation discovering it), the tab must not retain the subscription: the channel errors/closes → the tab (or leader on its behalf) tears it down and clears the scope state (9.5 §9.3) — retention is bounded by the revocation detection latency (≤ 15 min cadence + socket close), never indefinite.
4. **No unauthorized retention**: a background tab never *keeps* a subscription whose authorization it cannot confirm; on resume, before resubscribing, it revalidates (§8) — "still subscribed because nothing errored" is not authorization proof.
5. **Socket lifetime**: a hidden tab's socket may be frozen by the browser; on resume it verifies socket health and resubscribes per 9.4 §5.2 — the pause/teardown rules above apply to *authorization*, not to whether the transport is momentarily suspended.
6. **Limits still apply per tab** (9.3 §6.2); background tabs never accumulate channels beyond their visible scope.

## 10. Multi-device specifics

| Aspect | Rule |
|---|---|
| **Identity** | Same account on multiple devices; sessions are per-device but bound to one identity; revocation of the identity (suspension, deletion, global sign-out) ends all device sessions (9.14 §10.1) |
| **Outbox** | Per-device outboxes; no cross-device locking; correctness via server idempotency (§5) and business-intent guards (§5.3) |
| **Caches** | Per-device caches; no cross-device cache sync (never — devices do not copy cached records between each other; convergence is via server truth + refetch, 9.5 §6.2) |
| **Realtime** | Each device subscribes independently (per-instance limits, 9.3 §6.2); events fan out to all; version chain reconciles (9.5) |
| **Pending state** | Another device's committed change arrives as a realtime event → §6 reconciliation with this device's pending state; conflicts per 9.11 |
| **Session** | Refresh-token rotation is per-device; a device whose refresh token is rotated away (stolen-token protection) re-authenticates via the normal sign-in path |
| **Offline writes** | A device offline when another device commits a conflicting change: on reconnect, flush → 409 → 9.11 conflict workflow (never silent overwrite) |

## 11. Edge cases

| Edge case | Handling |
|---|---|
| Two tabs claim the same op | CAS + per-op lock: one wins; loser's claim is a no-op (9.10 §4.2) |
| Leader dies mid-flush | Locks released; successor re-queues `syncing` ops and re-submits same keys — replay-safe (§4.2) |
| Same logical op on two devices (synced op log) | Same key → server replays stored result for both; one effect (§5.2) |
| Double-tap across two tabs (distinct keys, same intent) | Server business-intent guard collapses to one effect; loser gets `duplicate_intent` → adopts server state (§5.3) |
| Tab hidden during sign-out in another tab | Receives broadcast on resume (or session revalidation fails); full 9.14 procedure runs (§7) |
| bfcache restore of a stale tab | `pageshow.persisted` → revalidate session + permissions before anything renders user-scoped data (§8) |
| Background tab misses a revocation | Hidden-cadence revalidation (≤ 15 min) or socket close; never indefinite retention (§9.3) |
| Two devices edit the same booking offline | Second flush → 409 version conflict → 9.11 workflow; refetch resolves both devices (§6, §10) |
| A tab's socket freezes while hidden | On resume: verify socket, resubscribe, resync (9.4 §5.2) — authorization revalidated first (§9.4) |
| BroadcastChannel unavailable | Storage-event fallback + revalidation on focus/resume; leader election via Web Locks only (§2.2) |
| Web Locks unavailable | BroadcastChannel election (9.4 §9.1); no tab flushes without the lock-equivalent (leader role) (§2.3) |
| Tab A signs out while Tab B is mid-flush of the same account | Tab B's epoch is unaffected (same account); flush continues with revalidation (9.10 §6) — cross-tab sign-out of the *same* session is impossible (one session per origin) |

## 12. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Events fan out to all instances; RLS per-instance; payloads advisory |
| 9.2 | Shared IndexedDB stores; atomic transactions; quota per origin |
| 9.3 | Ownership/limits per tab; registry per tab; teardown triggers per instance |
| 9.4 | Leader election, epochs, connection state per tab; broadcast state sharing; §7/§8 use 9.4 machinery |
| 9.5 | Version chain is the cross-instance reconciliation authority; write-newer-only |
| 9.6 | Pending overlays per tab; foreign events supersede per version |
| 9.7 | Read pipeline revalidates cross-tab writes; scope fields per record |
| 9.8 | Namespaces per user (shared across tabs of the same account); purge broadcasts |
| 9.9/9.10 | Outbox per tab; claims/leader/CAS; idempotency; §4 layered guarantees |
| 9.11 | Conflicts from other tabs/devices enter the same workflow; no cross-instance silent LWW |
| 9.13 | Cache strategies per instance; public caches shared by design, user caches per user |
| 9.14 | Sign-out/suspension propagation; scoped revocation per instance; §7 and §9 depend on it |

## 13. Implementation acceptance checklist for 9.15

- [ ] Cache integrity: concurrent writes from two tabs to the same entity converge to the newest version (write-newer-only test); no torn entries after a mid-write tab kill; read pipeline revalidates cross-tab writes.
- [ ] Outbox: two tabs cannot process the same op — CAS + per-op lock + leader-only (concurrent-claim test with one winner); leader death → successor re-queues and replays safely; no tab flushes without the leader role.
- [ ] Idempotency: duplicate key across tabs/devices → one effect, identical responses; distinct keys with the same business intent → business-intent guard collapses to one effect with `duplicate_intent` for the loser (per registered actions).
- [ ] Realtime-vs-pending: a foreign-device event superseding local pending state routes to the 9.11 workflow (or auto-resolves per the registered conflict policy); lower-version events never overwrite; outbox items with stale snapshots are held/re-presented, never blindly flushed.
- [ ] Sign-out/suspension propagation: sign-out in tab A purges tab B (visible and hidden-resume paths); suspension discovered via socket close and via next-request rejection; leader handoff clean.
- [ ] Stale-tab revalidation: a bfcache-restored or long-hidden tab revalidates session + permissions before any sensitive action (test per trigger point); failure blocks the action and routes to sign-in; cached permissions are never used.
- [ ] Background subscriptions: non-critical paused on hide; critical subscriptions bounded by the 15-min hidden revalidation cadence and torn down on revocation — enumeration test proves no unauthorized subscription survives beyond the cadence + socket-close latency.
- [ ] Multi-device: two devices with the same account — per-device outboxes, no cross-device cache copy (test: no cache-sync code path exists), realtime reconciliation via version chain, offline-conflict path → 9.11.
- [ ] Fallback paths: BroadcastChannel unavailable → storage events + revalidation; Web Locks unavailable → election fallback; fail-closed (no flush without leader role) tested in both.

## 14. Change control for 9.15

Any modification to coordination primitives, leader election, claim semantics, revalidation triggers, hidden-tab retention cadence, or propagation behavior requires:
- Threat-model review (duplicate effects, cross-instance stale authority, unauthorized retention)
- Multi-tab/multi-device regression suite update (all §13 scenarios)
- Idempotency and business-intent guard verification for any new mutation
- Update to this specification before release.

---

**Sub-point:** 9.16 — Push Notifications  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Push notifications are **delivery hints, not authoritative records**. The authoritative source of any notification is its server-side row (`recipient_user_id = auth.uid()`, 9.1 §2); the push payload exists only to tell the user *that something happened* and *where to look*. Every claim a push makes is re-validated by an authenticated refetch before it may influence the UI (9.7 §8).

Governing rules:

1. **Push = hint.** A push never proves a state (payment succeeded, booking confirmed, approval granted). It never updates caches, watermarks, or confirmed state (9.5 §4.3). It triggers display, and display triggers refetch.
2. **Clicking a notification must open an authenticated route and refetch current authorized data** (§7). Clicks never perform mutations, never mark records by inference, and never render payload content as the record.
3. **Notification payloads must contain minimal information** (§3): identifiers, a display snippet, and a safe route — nothing more. **Government IDs, payment details, private notes, access tokens, and sensitive customer data never appear in push payloads** (§3.2) — the 9.8 denylist extends to the push channel verbatim.
4. **Device tokens are associated with the authenticated user server-side** (§4) and are **removed or disabled on logout, account removal, revocation, and delivery invalidation** (§5).
5. **Sending verifies that the recipient is still authorized at send time** (§11) — registration is not authorization, and authorization is not permanent.
6. **Duplicate delivery must not duplicate actions or records** (§6): delivery is at-least-once; the client deduplicates by notification ID, and no click or app action can create a duplicate business effect (9.5 §5.3).
7. **Notification badge counts are reconciled with server state** (§9): the push's badge hint is advisory; the server count is the authority (9.5 §8.2).

## 2. Architecture and role boundaries

| Layer | Role | Authority |
|---|---|---|
| **Server (authority)** | Creates the notification row (9.1 §2), enforces authorization at send (§4, §11), manages device tokens (§4–§5), composes and signs payloads, hands them to the push provider (Web Push / FCM APNs equivalent) | Source of truth; the only layer that decides *whether* and *what* to deliver |
| **Push provider** | Transports the payload to the device; reports delivery failures (`410 Gone`, invalid token) | Delivery only — no business meaning |
| **Service Worker** | Receives the push event, validates the payload (§3.3), displays the notification, handles clicks by opening the app route (§7); **never fabricates or infers business data** (9.12 §3) | Display + navigation only |
| **App (client)** | On click/open: revalidates session, refetches the notification and its target entity (§7), reconciles the badge (§9), performs any user action (e.g., mark read) as a normal idempotent RPC | Interpretation and reconciliation only |

Boundary rules:

1. The SW holds no tokens, no business state, and no payloads beyond the current display cycle (9.12 §2.2); push payloads are transient — never cached, never stored (9.8 §9.4 analog).
2. The app never *sends* pushes; there is no client-side send capability (VAPID/service keys exist server-side only, §10).
3. A push that cannot be validated (§3.3) is dropped silently and logged — it is never displayed, never retried, and never synthesized into a different message.

## 3. Payload schema and minimization

### 3.1 Payload envelope (display hint only)

```json
{
  "schema_version": 1,
  "notification_id": "uuid",          // the authoritative row ID — dedup key (§6)
  "type": "booking.status_changed",   // registry type (9.1 §2 domains)
  "title": "Booking updated",         // server-composed, localized display string
  "body": "Your 14:30 appointment was confirmed.",
  "route": "/app/customer/bookings/<booking_uuid>", // allowlisted deep link (§7.2)
  "entity": { "type": "booking", "id": "<uuid>" },  // refetch target (§7)
  "badge_hint": 3,                    // advisory count hint — never authoritative (§9)
  "sent_at": "2026-08-05T09:20:00Z"   // server clock; display only (9.5 §4.4)
}
```

Rules:

1. **Every field is optional-or-minimal by design**: the mandatory fields are `schema_version`, `notification_id`, and `type`; everything else exists only to support display or the click-refetch path.
2. The `body` is a **display snippet** composed server-side, localized from the user's stored locale, and limited to the projection rules of 9.8 §3.2 (notifications row): type, title, snippet — never full message bodies, attachments, or recipient PII beyond the viewer's own data (9.1 §2.1).
3. `route` comes from a **server-side allowlist** of deep links (per portal), never from user input, and never carrying parameters beyond canonical UUIDs and non-sensitive slugs (§7.2).
4. The payload carries **no version chain**: pushes are hints; the version lives in the authoritative row and is fetched on click (§7). `notification_id` is the only dedup identity needed (§6).
5. **Hard size cap: 2 KB serialized.** Payloads exceeding it are truncated by dropping `body`/`badge_hint` before send (never by sending partial sensitive data); oversized generation is a defect and alerts.

### 3.2 Absolute payload denylist (mirrors 9.8 §4)

The following **never appear in push payloads** — not in `body`, not in data fields, not encoded in routes or entity IDs:

- Government IDs and identity-document numbers
- Payment details: card numbers, CVV, expiry, provider tokens, bank/IFSC numbers
- Private notes, internal reviewer notes, audit content
- Access tokens, refresh tokens, session material, signed URLs
- Sensitive customer data: full addresses beyond what the display snippet requires, phone/email beyond the viewer's own, financial values (balances, commissions, payouts, refund amounts — even as hints), verification documents
- The notification row's full body, attachments, or any field not in the §3.1 projection

Enforcement gates (extending 9.8 §4.1 to the push channel): server-side payload builder validates against the projection and runs a denylist pattern scan before send; any violation aborts the send, logs a security event (no content), and alerts. A client that receives a payload containing denylisted material drops it, logs, and escalates.

### 3.3 SW validation before display

The Service Worker validates every received push before displaying: `schema_version` matches the current reader; `notification_id` is a well-formed UUID; `type` is a known registry type; `body`/`title` pass the denylist scan and size check; `route` (if present) matches the allowlist. Any failure → drop + log at `warn` (payload metadata only). The SW displays exactly the validated fields; it composes nothing (9.12 §3).

## 4. Device token registry and association

### 4.1 Server-side registry

Device tokens live in a server-side table, never in client-accessible storage:

```sql
-- device_tokens
-- id uuid PK
-- user_id uuid NOT NULL REFERENCES auth.users       -- bound at registration (§4.2)
-- tenant_id / salon_id (nullable scope at registration)
-- token text (encrypted at rest, §10)
-- platform text            -- 'web-push' | 'fcm' | 'apns'
-- device_fingerprint text  -- opaque, derived, non-PII
-- locale text
-- created_at, last_seen_at timestamptz
-- disabled_at timestamptz NULL   -- set on logout/revocation/invalidation (§5)
-- disabled_reason text NULL      -- 'logout' | 'account_removed' | 'revoked' | 'delivery_invalid' | 'limit'
-- UNIQUE (user_id, device_fingerprint, platform)  -- one live token per device
```

### 4.2 Registration — association with the authenticated user

1. Registration happens **only from an authenticated client**: the request carries the user's session; the server binds `user_id` from the session (never from client-supplied fields — 9.8 §6 analog: the server is the authority on identity).
2. The client obtains a push subscription (Web Push `pushManager.subscribe` with VAPID public key) and posts it; the server stores the token with `user_id`, scope, and locale.
3. **Registration grants delivery capability, not authorization**: storing the token never entitles the user to a single message; every send re-verifies authorization (§11).
4. **Token limits**: maximum 10 live tokens per user. Excess registrations displace the oldest inactive token (`disabled_reason = 'limit'`); the user's other devices are unaffected.
5. Token rotation: a device that re-registers with a new token (browser reset, reinstall) replaces the old token for the same fingerprint (`UNIQUE` constraint) — old tokens are disabled, not leaked.

## 5. Device token lifecycle — removal and disabling

| Trigger | Action | Mechanism |
|---|---|---|
| **Logout (user-initiated)** | Token removed/disabled | Client unsubscribes from `pushManager` and calls `unregister_device_token` (idempotent RPC) **before** sign-out completes (9.14 §3 step 9); the server marks the token `disabled_at = now, reason = 'logout'`. On sign-out, the client also purges any local push state per 9.14 §3 |
| **Session invalidation / expiry** | Token disabled | Server-side session revocation disables tokens bound to that session/device (9.14 §10.1); tokens are not deleted — they are disabled so re-login can re-enable the same device cleanly (or the client re-registers) |
| **Account removal / deletion** | All tokens purged | On account deletion, all `device_tokens` rows for the user are deleted (9.14 §10.1, 9.8 §7) |
| **Permission/tenant revocation** | Scope-bound tokens disabled | Tokens registered under a revoked tenant/salon scope are disabled (`reason = 'revoked'`, 9.14 §7); the user's other-scope tokens survive |
| **Delivery invalidation** (`410 Gone`, `404 InvalidRegistration` from the provider) | Token disabled | The provider's rejection disables the token (`reason = 'delivery_invalid'`); no retry to a dead token; a future registration replaces it |
| **Repeated send failures** | Token disabled | ≥ 3 consecutive provider failures → disabled (`delivery_invalid`) and removed from rotation |
| **Token limit overflow** | Oldest inactive disabled | `reason = 'limit'` (§4.2) |

Rules:

1. **Client unregistration is best-effort; server disabling is authoritative.** A logout that never reaches the server (network cut, crash) still ends server-deliverability when the session is revoked — push sending requires the recipient's session/authorization checks (§11), which fail for the revoked account; token disabling closes the residual window.
2. Disabled tokens are never re-enabled automatically; only a fresh authenticated registration (§4.2) re-establishes a device.
3. Token state transitions are logged (token ID, reason — never the token value) and visible to the user in device management ("Signed-out device", "Remove").
4. On account switch (9.14 §6), the new user's session never touches the previous user's tokens: registration is per authenticated session, and the previous user's tokens were disabled at the boundary.

## 6. Duplicate delivery and deduplication

1. **Delivery is at-least-once**: providers may redeliver; the same notification may also reach a device through multiple channels (push + realtime event on the open app). Duplicates must never duplicate actions or records.
2. **Client dedup by `notification_id`**: the app and SW maintain a bounded seen-set of displayed notification IDs (LRU, 200 entries, 48 h TTL — display-layer only, mirroring 9.5 §3.2's seen-set). A push whose ID is already displayed is ignored; a push whose ID matches an already-fetched row is ignored for display purposes.
3. **No action from delivery**: nothing in the push path performs a mutation — no auto-mark-read on display, no click-triggered server calls beyond navigation + refetch (§7.3). Therefore duplicates cannot duplicate *actions* by construction; app actions remain idempotent regardless (9.5 §5.3, 9.15 §5).
4. **Record-level dedup is the server's job**: one notification row per event (the server enqueues once, even if the event fans out); duplicate pushes of the same row are display-deduped client-side (§6.2); duplicate *rows* are prevented by server-side event idempotency (the event's `event_id`/`version`, 9.5 §2.1, keys notification creation).
5. **Realtime + push convergence**: when the app is open and both channels deliver, the realtime event is processed per 9.5 (version-validated) and the push is display-deduped against it; the badge is reconciled once (§9).

## 7. Click behavior — authenticated route + refetch

### 7.1 Sequence (mandatory)

On notification click (SW `notificationclick`):

1. **Focus or open** the app (existing window or new tab).
2. **Validate the session**: if absent/expired, route to sign-in with `reason=notification` and the return route; the notification's data is never rendered without a session (9.14 §6).
3. **Open the allowlisted route** (`route` from the payload, validated at §3.3; parameters are canonical IDs only).
4. **Refetch current authorized data**: the app fetches (a) the notification row itself (idempotent read, 9.5 §6.2) and (b) the target entity (`entity.type`/`entity.id`) through the normal authorized API — with the 9.5 §6.2 procedure (timeout, epoch-tag, abort-on-teardown). The payload's `title`/`body` may be shown **as placeholder** while the fetch is in flight, labeled "(from notification)".
5. **Render the authoritative record**: the fetched row/entity replaces the placeholder; a payload that disagrees with the fetched record is discarded in favor of the fetched state (9.7 §8 — payloads are never authoritative).
6. **Mark-read** (if the user opens the notification): the app calls the idempotent `mark_notification_read` RPC (9.6 §2.2) **after** the refetch — never inferred from the click itself, never from the SW.

### 7.2 Route allowlist

- Routes are server-registered per portal: booking detail, proposal/verification status, notification inbox, salon availability. Each is a static pattern with canonical-ID parameters only.
- A route outside the allowlist (or with unexpected parameters) is dropped at §3.3 validation; the click opens the inbox instead — never a constructed URL.

### 7.3 What a click never does

- Never performs a mutation (no confirm, no payment, no approval, no mark-read-by-inference).
- Never renders payload content as the record (placeholder → refetch → authoritative render).
- Never uses the payload to decide authorization, entitlement, or state (9.7 §2.2).

## 8. Display rules (Service Worker and OS)

1. The SW displays only validated payload fields: `title`, `body`, and optional `route` (as the click target). It shows no unvalidated data, composes no summary, and never augments the message from local state (9.12 §3).
2. OS notification options are minimal: `tag = notification_id` (so the OS collapses duplicates — a second line of dedup behind §6.2), `renotify` off for duplicates, `data` containing only `{ notification_id, route }`.
3. Notifications carry no actions that mutate (no "Confirm", "Approve", "Pay" action buttons); the only action is "View" (navigate).
4. The SW clears its notification record when dismissed/clicked; payloads are never retained (transient display cycle, §2.1).
5. Quiet hours / category preferences (user settings, 9.8 §3.2) are enforced **server-side at send** (§11.3) — the client never filters silently.

## 9. Badge count reconciliation

1. **Push badge hints are advisory**: the `badge_hint` may update the badge *provisionally* (e.g., +1 on receipt, displayed as "(cached)"), but it is never accumulated into an authoritative count and never trusted as the final value.
2. **The server count is the authority**: the app reconciles the badge with the server's unread count for `recipient_user_id = auth.uid()` (9.5 §8.2 query) on every reconciliation trigger: app open, visibility resume (9.4 §5.2), notification click (§7), connectivity restore, and realtime events for the notification channel (9.1 §2).
3. **Multi-device**: each device reconciles independently; a read performed on device A reflects on device B only after B's reconciliation (push hint + server count) — B never trusts A's count.
4. **Offline**: the badge renders from the last confirmed count with "(cached)" and reconciles on reconnect (9.7 §9 notifications row, 9.5 §8.2).

## 10. Token and channel security

1. **Server-side secrets only**: VAPID public/private keys and provider service credentials exist server-side; the client holds only the VAPID **public** key for subscription. There is no client-side send path (§2.1).
2. **Tokens are sensitive**: `device_tokens.token` is encrypted at rest (9.8 §12 standards); never logged, never in analytics, never in error payloads; access to the registry is service-role/least-privilege only (9.1 §2.1 — service credentials never in the browser).
3. **Send path is server-only and audited**: sends originate from trusted server workflows (the notification row's creation path), are rate-limited per user (e.g., 20 pushes/min/user) and per token, and every send is logged (notification ID, user scope, outcome — no payload content, 9.8 §13).
4. **Transport**: Web Push is end-to-end encrypted by the provider protocol (payload encrypted to the subscription); the app never sees provider internals, and the SW receives only the encrypted payload via the standard push event.
5. **Registration requests are CSRF-safe**: token registration/unregistration RPCs are authenticated (session) and idempotent; a forged unregister can only disable the caller's own token (user-scoped, 9.6 §2.2 scope discipline).

## 11. Authorization verification at send time

1. **Authorization is checked at send time, per recipient, per message** — never inherited from registration, never cached from a previous send:
   - The recipient `user_id` still exists and the account is active (not deactivated/suspended);
   - The notification row exists and is addressed to this recipient (`recipient_user_id = auth.uid()`, 9.1 §2);
   - The event's scope authorization still holds at send time — the same predicates as 9.1 §4.2 (e.g., the booking's customer or current staff membership; the salon is still active; the tenant relationship is intact);
   - The recipient's per-category notification preferences permit this message;
   - No revocation is pending for the user/scope (9.14 §7).
2. **Send-time checks run in the send transaction**: an event enqueued before a revocation is *not delivered* after it; the send is skipped and logged (`authz_denied`, scope IDs only).
3. **Race bound**: revocation between check and provider delivery leaves at most one stale hint in flight; the click path refetches, the fetch fails authorization (404/403), and the app shows "This notification is no longer available" and removes the row locally (9.5 §9.3) — the stale hint can never produce a record or an action.
4. **Batching**: sends are batched per event with per-recipient checks (no batch-level shortcuts); a batch never bypasses per-recipient authorization.

## 12. Edge cases

| Edge case | Handling |
|---|---|
| Provider redelivers the same push | Display dedup by `notification_id` (§6.2); OS `tag` collapse (§8.2) |
| Push arrives while the app is open and subscribed to realtime | Realtime event processed per 9.5; push display-deduped; badge reconciled once (§6.5) |
| Recipient deactivated between enqueue and send | Send-time check skips delivery; token disabled on revocation (§11.2, §5) |
| Token rejected by provider (`410 Gone`) | Token disabled (`delivery_invalid`); no retry to dead tokens (§5) |
| User signs out on another device | That device's tokens disabled server-side; its SW stops receiving; residual in-flight pushes are hint-only (§5, §11.3) |
| Click while signed out | Sign-in with `reason=notification` + return route; nothing rendered without a session (§7.2) |
| Click on a deleted notification/entity | Refetch 404 → "no longer available"; local row removed per 9.5 §9.1 (§7.5) |
| Payload too large | Truncated to the 2 KB cap (drop `body`/`badge_hint`); never partial sensitive data (§3.1) |
| Invalid payload received | Dropped + logged; never displayed, never synthesized (§3.3) |
| Quiet hours active | Server-side preference check skips send; a queued notification row remains and is displayed in-app (§8.5) |
| Multiple devices, one account | All authorized devices receive; each dedups and reconciles independently (§6, §9) |
| Token limit reached | Oldest inactive token displaced (`limit`); active devices unaffected (§4.2) |
| Locale change | Server composes `title`/`body` at send using current stored locale (§3.1) |
| Browser push permission revoked by the user | Provider returns 410 on next send → token disabled (`delivery_invalid`); app UI reflects "notifications off" on next launch |

## 13. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Push is an allowed-domain delivery channel for notifications; payloads follow 9.1 §2 projection rules; events remain server-verified |
| 9.2 | Badge TTL and stale-while-revalidate apply to the inbox; push never writes offline caches |
| 9.4 | Click/open revalidates the connection; offline pushes render per offline rules; session checks per 9.4 §7 |
| 9.5 | Dedup by ID (9.5 §3.2 pattern), no version authority in payloads, refetch per 9.5 §6.2, badge reconciliation per 9.5 §8.2 |
| 9.7 | Payloads are display hints — never authoritative displays (9.7 §8); refetched records render with full qualifiers |
| 9.8 | The payload denylist mirrors 9.8 §4; tokens are sensitive server-side records; no sensitive data in the push channel |
| 9.12 | The SW validates and displays only; no fabrication (9.12 §3); push handling is a SW capability bounded by 9.12 §2 |
| 9.13 | Notifications remain network-first with server reconciliation (9.13 category 6); pushes do not change cache strategy |
| 9.14 | Tokens disabled on every sign-out path; account switch never touches the previous user's tokens |
| 9.15 | Multi-tab dedup and badge reconciliation across instances; click focuses the correct tab |
| 9.11 | Conflicts never originate from pushes — a push is a hint to look; resolution happens in the app against authoritative state |

## 14. Implementation acceptance checklist for 9.16

- [ ] Push payloads contain only §3.1 fields, are ≤ 2 KB, and pass the §3.2 denylist at build time (server test); a denylisted value aborts the send with a security event.
- [ ] The SW validates every push (§3.3) before display; invalid pushes are dropped and logged; no payload content is ever stored or synthesized (9.12 §3).
- [ ] Device tokens are bound to the authenticated user server-side at registration (never from client claims), encrypted at rest, ≤ 10 per user, and unique per (user, fingerprint, platform).
- [ ] Token lifecycle: logout disables tokens (client unregister is best-effort, server disable is authoritative); account removal purges; revocation disables scope-bound tokens; 410/invalid tokens are disabled with no retry; disabled tokens never auto-re-enable.
- [ ] Send-time authorization: per-recipient checks (active account, row addressed, scope predicates per 9.1 §4.2, preferences, no pending revocation) run in the send transaction; a post-revocation event is never delivered.
- [ ] Duplicate delivery: redelivered pushes display once (seen-set + OS `tag`); no click or delivery path performs a mutation; server event idempotency prevents duplicate rows (tests: double delivery, push+realtime convergence).
- [ ] Click path: opens allowlisted route, validates session (sign-in with reason when absent), refetches notification + entity per 9.5 §6.2, renders authoritative state, marks read only via the idempotent RPC after refetch (test: click with signed-out session, click on deleted record).
- [ ] Badge: hints are advisory; reconciliation with the server count runs on all §9 triggers; multi-device reconciles independently; offline badge labeled "(cached)".
- [ ] Security: no client-side send capability; VAPID private keys server-only; token registry least-privilege; send rate limits; content-free audit logging.
- [ ] Edge-case suite: §12 rows covered (redelivery, deactivation mid-queue, dead token, sign-out on another device, payload overflow, invalid payload, quiet hours, multi-device, token limit, permission revoked).

## 15. Change control for 9.16

Any modification to the payload schema or size cap, the payload denylist, the deep-link allowlist, token registry semantics, token lifecycle triggers, send-time authorization predicates, deduplication behavior, or badge reconciliation requires:
- Security/privacy review (payload leakage, token misuse, unauthorized delivery)
- Provider and delivery-failure regression testing
- Payload minimization and projection review against 9.1 §2 and 9.8 §4
- Update to this specification before release.

---

**Sub-point:** 9.17 — Error Handling & User Communication  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

The UI communicates the **true state of every user operation**, and the only source of "true" is the server. An operation is shown as completed **only when the server confirms it** (9.6 §3.5) — never on local enqueue, optimistic application, timeout, or delivery acknowledgment. Every asynchronous operation renders through one canonical state vocabulary, so the user always knows exactly what has happened, what the data state is, and what they can do next.

Governing rules:

1. **Never display an operation as completed until the server confirms it.** Success presentation (copy, styling, references, sounds) requires the 9.6 §3.5 confirmation: the mutation response with the authoritative new version, a matching version-bumped realtime event, or a reflecting refetch. Nothing else qualifies.
2. **Every operation uses the canonical state vocabulary of §2** — "Saved as local draft", "Waiting for connection", "Sending", "Confirmed by server", "Failed — retry required", "Conflict — review required", "Session expired — sign in again", "Permission changed — refresh required". These are the only states a user-facing operation may claim; states are rendered from the machinery (9.10 outbox states, 9.4 connection states), never from component guesses.
3. **Vague messages are prohibited.** "Done", "Saved", "Sent ✓", "Success" must never appear for an operation that is merely queued, pending, or in flight. Every message states what happened, what state the data is in, and what the user can do.
4. **Timeouts are unknown outcomes.** A timeout is neither success nor failure: the client must check the server using the operation ID or idempotency key (outcome query, 9.6 §5 / 9.10 §5.3) **before** retrying or rolling back — never retry on the assumption of failure, never confirm on the assumption of success (§4).
5. **Errors are recoverable or terminal, and the UI says which.** Every error presentation carries its recovery path (§8); permanent failures are persistent until resolved (never toast-and-gone); transient conditions are communicated through the connection/operation state, not through repeated error toasts.

## 2. Canonical state vocabulary

### 2.1 The eight states

| # | Canonical label | Machinery state (source of truth) | Meaning | Styling | User actions |
|---|---|---|---|---|---|
| 1 | **Saved as local draft** | 9.10 `draft` / 9.9 `draft_only` | Input stored locally; not submitted; no server effect | "Draft" tag, subdued, editable | Edit, Delete, Submit |
| 2 | **Waiting for connection** | 9.10 `queued` + 9.4 `offline`/`reconnecting` | Validated and queued; will send when connectivity returns | Pending styling (amber, `aria-busy`); "2 changes waiting to sync" indicator | Cancel, Edit |
| 3 | **Sending** | 9.10 `syncing` / 9.6 pending-request-in-flight | A send attempt is in progress (or being resolved after a timeout, see §4: "Checking result…") | Spinner + text | Cancel (best-effort, 9.10 §8.3) |
| 4 | **Confirmed by server** | 9.10 `confirmed` | Server committed; authoritative response received and applied | Success styling allowed (9.7 §8) | Normal entity actions |
| 5 | **Failed — retry required** | 9.10 `failed` | Auto-retry stopped (validation, auth, business, or exhausted budget); manual action needed | Red/amber, persistent | Retry (after remediation), Edit, Cancel |
| 6 | **Conflict — review required** | 9.10 `conflict` / 9.11 | A conditional write was rejected (409); the server state differs from the local intent | "Needs review" banner; conflicted fields highlighted | 9.11 resolution workflow, Cancel |
| 7 | **Session expired — sign in again** | 9.14 session invalidation / 9.4 §7.3 | No valid session; no operation can proceed | Sign-in screen / blocking banner | Sign in (with `reason`), return route |
| 8 | **Permission changed — refresh required** | 9.14 §7 revocation / 9.5 §9.3 | The user's authorization for the scope changed; cached knowledge is void | "Access changed" banner | Reload/refresh; never retry the operation |

Rules:

1. The eight labels are the **exact copy vocabulary** — localized, but semantically identical. Screens may add context ("Your booking request is Waiting for connection"), never substitute different meanings.
2. States map one-to-one onto machinery: 1 = 9.10 `draft`; 2 = `queued` (+ connection state); 3 = `syncing`; 4 = `confirmed`; 5 = `failed`; 6 = `conflict`; 7–8 = session/permission conditions (9.14). A UI state with no machinery backing is a spec violation (9.4 §3.7 single-source rule).
3. State 4 is the **only** state with success styling; states 1–3 and 5–6 are pending/problem states by construction (9.9 §8).
4. Operations that are `expired` or `cancelled` (9.10 §3) render as out-of-band states with their own labels ("Expired", "Cancelled") per 9.10 §8.1 — they are not part of the eight but are never mislabeled as any of them.

### 2.2 Message anatomy

Every operation-status message contains, in order: the **state** (canonical label), the **subject** (what operation/entity), the **data status** ("your draft is saved locally", "not yet sent"), and the **action** ("Retry", "Review", "Sign in"). A message missing any element is incomplete; e.g., "Failed" alone is prohibited — it must say what failed and what to do.

## 3. The confirmation-only rule (display of completion)

1. **Success presentation requires the 9.6 §3.5 confirmation**, exactly: (a) the mutation response returning the authoritative state with its new version, or (b) a version-bumped realtime event matching the operation's expectation, or (c) a refetch whose result reflects the effect. Absence of error, request completion, local enqueue, optimistic overlay, and delivery acknowledgment are **not** confirmation.
2. **Prohibited patterns** (from 9.9 §8.1, extended):
   - "Done"/"Saved"/"Sent ✓"/"Success"/"Completed"/"Confirmed" copy for anything not in state 4;
   - Success toasts, checkmarks, green styling, or success sounds on enqueue, optimistic apply, or flush;
   - Client-minted reference/order numbers (9.9 §8.1);
   - Auto-dismissing a failure toast while the operation is still unresolved;
   - Moving an item out of its pending presentation before state 4.
3. **Delivery acknowledgment is not completion**: "Request sent — awaiting confirmation" is permitted only where the server accepted the request and the operation is visibly still in state 3 (e.g., async workflows); the next transition must come from the server's authoritative record (9.6 §3.5), never from the clock.
4. **Cached/offline data** never carries confirmed styling (9.7 §8.1) — state 4 refers to *operations confirmed by the server*, which is a different claim than displaying previously fetched data with qualifiers.

## 4. Timeouts — unknown outcomes, check before retry

### 4.1 Principle

A timeout means the client does not know whether the server committed. The UI shows state 3 with the label **"Sending… Checking result…"** — never success, never failure.

### 4.2 Mandatory resolution protocol (before any retry)

```ts
async function resolveUnknown(key: string, entity: { type: string; id: string }): Promise<Outcome> {
  // 1. Query the server by idempotency key / operation ID (outcome endpoint, 9.6 §5)
  const result = await queryOutcomeByKey(key);          // GET .../mutations/{key}
  if (result.found) return { status: "confirmed", state: result.state };   // committed → confirm
  if (result.definitive) return { status: "not_committed" };               // server says never seen

  // 2. No outcome query (or ambiguous): refetch the entity and compare (9.5 §6.2)
  const current = await refetchEntity(entity);
  if (reflectsOperation(current)) return { status: "confirmed", state: current };
  if (definitelyNotApplied(current)) return { status: "not_committed" };

  // 3. Still unknown: bounded retry with the SAME idempotency key (9.10 §5.1 backoff),
  //    then re-run this resolution. Never retry without re-checking.
  return { status: "unknown" };
}
```

1. **Check first, then act.** Retry happens only after the check: committed → confirm (state 4); not committed → retry with the same key (9.10 §5.1 backoff) or surface state 5 with "Retry"; unknown → re-resolve after backoff, bounded per 9.4 §4; budget exhausted → state 5 with "Check again" (re-runs the resolution) — never an assumed outcome.
2. The retry always uses the **same idempotency key** (9.10 §2.2), so even a race where the first request *did* commit is harmless — the server replays the stored result (9.5 §5.3).
3. Timeout resolution runs under the current epoch (9.4 §2.2) and is aborted on teardown; a resolution completing after sign-out is discarded (9.14 §3).
4. While resolving, dependent actions stay gated (9.6 §3.8): nothing that depends on the outcome is enabled until state 4 or a definitive failure.

### 4.3 User communication for timeouts

- Copy: "Took longer than expected — checking with the server…" (state 3, resolving), then the resolved state (4, 5, or 6) — the user never sees "timed out = failed" or "timed out = done".
- A repeated unresolved state (budget exhausted) shows state 5 with "Check again" and "Cancel", and the entity's data remains the last server-confirmed state (9.6 §3.6 rollback guard).

## 5. Error taxonomy and canonical presentation

| # | Error class | Detection | Canonical presentation | Recovery action | Auto-retry? |
|---|---|---|---|---|---|
| 1 | **Transient connectivity** | 9.4 `offline`/`reconnecting`; network error | State 2 ("Waiting for connection") — no error toast; the operation is queued per 9.9 | None needed (auto-flush on reconnect, 9.10 §6) | Yes — 9.4 §4 backoff |
| 2 | **Server unavailable (5xx)** | 5xx response | State 3 → "Sending… retrying" (within budget); then state 5 | "Retry" (same key) | Yes — bounded 9.4 §4 |
| 3 | **Timeout** | timer | State 3 "Checking result…" → resolved per §4 | Per §4 outcome | Only after the §4 check |
| 4 | **Validation (4xx)** | 422/400 (schema/endpoint) | State 5 + inline field errors ("Please correct: <field>") | Edit + resubmit (new or same key per 9.10 §3) | Never |
| 5 | **Authentication** | 401, session absent/expired, refresh failure | State 7 ("Session expired — sign in again") blocking; sign-in with `reason` | Sign in; return route (9.14 §4.9) | Never — re-auth first |
| 6 | **Authorization** | 403, close 1008, RLS suppression | State 8 ("Permission changed — refresh required") with "Reload" | Reload/refresh; re-validated scope (9.14 §7) | Never |
| 7 | **Conflict** | 409 structured codes (9.11 §8.2) | State 6 ("Conflict — review required") + server reason | 9.11 workflow per field group | Never |
| 8 | **Business rejection** | 409/422 business reason (9.9 §7.1) | State 6 or 5 + server-provided reason ("Slot no longer available") | Rebook/retry per registry conflict policy | Never |
| 9 | **Storage/quota/offline-write failure** | 9.2 §5.3, 9.9 §12 | "Couldn't save offline — storage is full" + guidance | Free space / retry; never silent drop | Per 9.2 §5.3 |
| 10 | **Unknown/app error** | unhandled, unexpected | "Something went wrong" + correlation ID + "Retry" | Retry; support with correlation ID | Manual only |

Rules:

1. **Raw error details never reach the user**: no stack traces, no internal codes (except the correlation ID), no payload content, no token/credential text (9.8 §13). The full detail is logged with the correlation ID (9.4 §12) and surfaced to support.
2. **Auto-retry column is decisive**: only classes 1–2 auto-retry (plus class 3 *after* the check); everything else requires user action. Auto-retry never triggers success copy — it keeps the operation in state 3 with retry labels.
3. Each presentation includes the recovery action inline (per §8); a state without its action is incomplete (§2.2).
4. Multiple simultaneous errors each carry their own state (§6); there is no global "everything failed" summary that replaces per-operation states.

## 6. Placement and presentation hierarchy

| Channel | Used for | Rules |
|---|---|---|
| **Inline (field/action-level)** | Validation errors, per-field conflict choices (9.11 §5.2), action-specific failures | Required wherever the error binds to a specific field/action; positioned adjacent to it; `aria-describedby` wired |
| **Banner (persistent)** | Connection states (9.4 §4), states 7–8, aged/stale data (9.7 §4) | Persistent until resolved; `aria-live="polite"`; never dismissible for states 7–8 until resolved |
| **Toast (transient)** | Non-critical, auto-resolving notices (e.g., "Synced", state 4 confirmations for background ops) | Dismissible, auto-expire ≤ 8 s; **never** used for permanent failures (states 5–8) — those are persistent |
| **Outbox/operation list** | States 1–6 per operation (9.10 §8.1) | The authoritative per-operation view; global indicator counts pending items |
| **Sign-in screen** | State 7 | With `reason` parameter and return route (9.14 §4.9) |

Rules:

1. A permanent failure (5–8) appearing only as a toast is a spec violation — it must persist until the user resolves or dismisses it explicitly from the operation list.
2. Success confirmations (state 4) are subtle and contextual — a toast is acceptable for background confirmations; inline state change for foreground actions.
3. Accessibility: all state changes announce via `aria-live` regions; states are icon + text (never color alone, 9.4 §3.6); pending states set `aria-busy="true"` on the affected region (9.6 §7); copy is localized; timestamps use the user's locale.
4. One operation, one state, one channel: an operation's status appears consistently in the operation list and (where applicable) inline — the two must never disagree (single source: the machinery state, 9.10 §3).

## 7. Message quality rules

1. **Precision over brevity**: "Your booking request is Waiting for connection — we'll send it automatically when you're back online" beats "Request pending". Every message passes the three-question test: what happened? what is the data state? what can I do?
2. **No vague success**: the words "Done", "Saved", "Sent", "Success", "Completed", "Confirmed", "OK" are reserved for state 4 (and "Saved as local draft" for state 1). A lint/copy test enforces this vocabulary (§13).
3. **No false urgency or false reassurance**: never "Almost done" for an operation with no server confirmation; never "Everything is fine" while states 2/3/5/6 exist.
4. **Consistent verbs and tone**: all portals share the copy library; user actions are imperative ("Retry", "Review", "Sign in", "Cancel"); states are declarative.
5. **Data-state honesty**: any message about data mentions whether it is server-confirmed, local, cached, or unknown (§2.2), per 9.7 §8 qualifiers.
6. **Correlation for support**: every unexpected error attaches a short correlation ID (also logged server-side); support copy references it — never raw internal identifiers.

## 8. Recovery paths per state

| State | Recovery path | References |
|---|---|---|
| 1 Saved as local draft | Edit → Submit; Delete | 9.9 §2 |
| 2 Waiting for connection | Auto-flush on reconnect; Cancel/Edit meanwhile | 9.10 §6, §8 |
| 3 Sending / Checking result | Cancel (best-effort); wait; timeout → §4 resolution | 9.10 §5.3, §8.3 |
| 4 Confirmed by server | Normal entity actions | — |
| 5 Failed — retry required | "Retry" (manual; same key; full 9.10 §6 pre-flight re-runs; may be disabled until remediation, e.g., validation fixed or session restored); "Edit" (new logical op, new key); "Cancel" | 9.10 §8.2 |
| 6 Conflict — review required | 9.11 per-field resolution (server version / keep local / edit); "Cancel" | 9.11 §5 |
| 7 Session expired | "Sign in again" with `reason` + return route; queued ops hold until a session exists (9.10 §6.1), then flush | 9.14 §4.9 |
| 8 Permission changed | "Refresh" — re-validates session + authorized scope (9.10 §6.2, 9.14 §7); the affected operation moves to 5/6 or is discarded per 9.5 §9.3; never retried blindly | 9.14 §7 |

General rules:

1. Every manual "Retry" re-runs the 9.10 §6 pre-flight (session, user, tenant, role, ownership) before sending — a retry after a permission change is caught before it sends (9.10 §6.2).
2. "Retry" never resets `expires_at` (9.10 §8.2) and never changes the idempotency key.
3. Recovery actions are surfaced in the operation list and, where the operation is foreground, inline — never only in a toast (§6).

## 9. Edge cases

| Edge case | Handling |
|---|---|
| Success response lost (op committed, response never arrived) | Timeout path → outcome query finds the commit → state 4 (confirmed), no duplicate effect (9.5 §5.3) |
| Outcome query itself times out | Re-resolve after backoff; bounded per 9.4 §4; then state 5 "Check again" — never assumed success/failure (§4) |
| User navigates away mid-operation | Operation state persists in the outbox list (9.10 §8.1); the indicator and item-level state surface it on return (9.6 §3.2) |
| App restarts mid-operation | Outbox resumes from IndexedDB (9.10 §4.2 crash recovery); items re-render in their persisted state — never promoted to confirmed by restart (9.9 §8.1) |
| Error during optimistic apply | Roll back per 9.6 §3.6 (snapshot guard); state 5 with the rollback notice ("Your change was not saved") |
| Error during rollback | Adopt newer server state via refetch (9.6 §6); state reflects the authoritative state with a notice |
| Session expires during retry click | Pre-flight fails → state 7 with sign-in; the operation stays queued/failed per its state; no send (9.10 §6.1) |
| Permission changes between retry and send | Pre-flight (9.10 §6.2) blocks the send; state 8 + scope cleanup (9.14 §7) |
| Multiple operations fail simultaneously | Each keeps its own state and recovery action in the operation list; banners show connection-level states once (no per-item duplicate banners) (§6) |
| Realtime event confirms an operation the user believed failed | Version chain applies it (9.5 §4.1); state moves 5 → 4 with a notice ("Your change was applied") — the server is the final word in both directions |
| Offline queue item expires | State "Expired" per 9.10 §3 with notice and draft promotion if useful (9.9 §12) |
| Same operation visible in two tabs | Each tab renders its own instance from shared state (9.15 §3); confirmations converge via realtime + refetch; no duplicate toasts across tabs are synthesized (per-tab toasts only) |

## 10. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.4 | Connection states drive states 2–3 and 7–8 banners; epoch guards message callbacks |
| 9.5 | Confirmation requires the version chain; version gaps trigger refetch; write-newer-only applies to displayed state |
| 9.6 | Pending presentation and the §3.5 confirmation definition are this section's foundation; optimistic overlays never confirm |
| 9.7 | Cached data rendering and qualifiers; offline chrome |
| 9.8 | No sensitive content in messages; correlation IDs only |
| 9.9 | "Never simulate server success" is this section's headline rule; policies decide which states are reachable |
| 9.10 | Outbox states are the machinery source for states 1–6; retry/cancel semantics; pre-flight on retry |
| 9.11 | Conflict workflow is state 6's recovery path; structured codes map to copy |
| 9.14 | States 7–8 and their recovery paths; sign-in reasons; scope cleanup |
| 9.15 | Multi-tab convergence; per-tab toasts; shared-state consistency |
| 9.16 | Push hints render through the same vocabulary (placeholder → refetch → authoritative), never as confirmations |

## 11. Implementation acceptance checklist for 9.17

- [ ] No operation can display success styling or success copy without a 9.6 §3.5 confirmation — enforced by a test harness that asserts success presentation requires a server response carrying a version (simulated enqueue/timeout/optimistic paths cannot produce it).
- [ ] The eight canonical states are implemented with the exact vocabulary; a copy audit (lint test) fails on prohibited vague-success words ("Done", "Saved", "Sent", "Success") in non-confirmed contexts.
- [ ] Every operation-status message contains state + subject + data status + action (§2.2); sampled by automated copy tests across all portals.
- [ ] Timeout path: a request that times out never shows success or failure — it shows "Checking result…", resolves via the outcome query/refetch (§4.2), and retries only with the same key after the check (test: committed-behind-timeout → confirmed without duplicate effect; not-committed → retry).
- [ ] Error taxonomy: each class in §5 maps to its canonical presentation and recovery action; classes 4–8 never auto-retry; raw errors/payloads never reach the UI (test with injected internal error strings).
- [ ] Placement rules: permanent failures are persistent (never toast-only); toasts are transient and non-critical only; inline errors are adjacent to their fields with `aria-describedby`.
- [ ] Accessibility: state changes announce (`aria-live`), pending regions set `aria-busy`, states are icon + text, copy localized.
- [ ] Recovery paths: every state's action works as specified — retry re-runs 9.10 §6 pre-flight with the same key (test: retry after permission change is blocked and routes to state 8); conflict → 9.11 workflow; session expiry → sign-in with reason + return route.
- [ ] Edge-case suite: lost success response, outcome-query timeout, navigate-away, restart mid-operation (no promotion), optimistic rollback failure, session-expiry mid-retry, realtime confirms a "failed" op (5 → 4 with notice), multi-tab consistency.

## 12. Change control for 9.17

Any modification to the state vocabulary, confirmation rule, timeout resolution protocol, error taxonomy, message placement, recovery paths, or prohibited-copy list requires:
- UX review (state distinction, accessibility, localization)
- Copy-library update across all portals
- Regression of the confirmation-enforcement and timeout-resolution test suites
- Update to this specification before release.

---

**Sub-point:** 9.18 — Performance & Resource Controls  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

The platform consumes realtime, cache, outbox, and client resources **in proportion to what the user is doing right now** — never in proportion to what the user has ever done or might do. Every resource has an explicit limit, every allocation has a teardown, and every consumption pattern is measurable so regressions are caught before they affect users.

Governing rules:

1. **Every resource class has a hard limit and a reclaim path** (§2): channels, subscriptions, timers, listeners, cache entries, outbox items, in-flight requests. Nothing grows without bound; nothing is allocated without an owner and a teardown trigger (9.3 §2).
2. **Minimum required scope**: subscribe to the minimum required tables, events, and entities (§3); paginate initial queries instead of loading complete histories (§4); send smaller server-approved payloads instead of full records (§5).
3. **High-frequency refreshes are debounced; safe updates are batched** (§6) — client traffic is shaped, not emitted per event.
4. **Caches are bounded** — size, entry count, and retention limits with an eviction policy (§7) — and **abandoned subscriptions, timers, listeners, and cached records are removed** by the teardown and sweep machinery (§8).
5. **Everything is monitored**: connection counts, event volume, reconnect rate, outbox size, retry count, and synchronization latency (§9), with alerts at defined thresholds (§10).

## 2. Resource limits and ownership (summary)

| Resource | Hard limit (per tab unless noted) | Owner | Reclaim path |
|---|---|---|---|
| Realtime socket | 1 per tab (9.4 §9.3) | Connection manager | Teardown (9.4 §10) |
| Realtime channels | **7** per tab total; per category: 1 booking, 1 payment, 1 proposal/verification, 1 notification, 3 availability (9.3 §6.2) | Subscription registry | Eviction of oldest non-critical (9.3 §6.2); teardown |
| Tables/events subscribed | Minimum set per §3 | Registry entries | Scope reduction on route change |
| Outbox items | 50 per user (9.9 §5.2) | Outbox processor | Expiry (7 days), purge, user reduction |
| Outbox in-flight | 3 concurrent / 10 claimed per cycle (9.10 §4.1) | Processor | Cycle bounds |
| Timers (backoff/probe/heartbeat) | Bounded by 9.4 §4; none without owner | Connection manager | §8 sweep + teardown |
| Event listeners (window/doc) | Named inventory; zero orphans (§8.1) | Owning module | §8 sweep + teardown |
| In-flight requests | ≤ 8 concurrent authenticated requests per tab (global cap) | Request layer | AbortController on teardown (9.3 §9.3) |
| Cache: IndexedDB | 50 MB/user combined (9.2 §5.3); entry limits per store (§7) | Cache manager | LRU + TTL eviction (9.2 §5.3, 9.7 §7) |
| Cache: CacheStorage | Within the same 50 MB budget; per-entry caps (5 MB data / assets, 9.12 §6) | SW + cache manager | Activation cleanup (9.12 §8); sweep |
| Drafts | 30-day TTL (9.9 §2) | Drafts store | Sweep |
| Signed URLs (memory) | ≤ 5 concurrent; active-view only (9.8 §9) | View layer | View teardown |
| Pending optimistic ops | 1 in-flight per entity (9.6 §4); store bounded | Optimistic store | Confirmation/rollback/teardown |
| Realtime seen-set | 10 000 entries or 15 min TTL (9.5 §3.2) | Ingest | LRU/TTL eviction |
| Push seen-set | 200 entries / 48 h (9.16 §6.2) | SW/app | LRU/TTL eviction |

Rules:

1. **No limit is advisory**: exceeding a hard limit fails the allocation (blocked with a message, e.g., 9.9 §5.2 overflow) or evicts per policy — never silently grows.
2. **Ownership is mandatory** (9.3 §2): every allocated resource records its owner and teardown trigger at allocation time; the §8 sweep asserts the pairing.
3. Limits are per tab except outbox items and cache budgets, which are per user/origin (shared); multi-tab totals are therefore bounded by tabs × per-tab limits, and the origin-level budgets (cache, outbox capacity per user) are enforced by the shared stores themselves (9.15 §3).

## 3. Minimal subscription scope

### 3.1 Table/event/entity minimization

1. **Tables**: a subscription exists only for a table in the 9.1 §2 allowed domains; static/forbidden content is never subscribed (9.1 §3).
2. **Events**: subscribe to the specific event types the view needs (`INSERT` for lists that must show new items, `UPDATE` for status views, `DELETE` only where removal must be live). A view needing only status changes does not subscribe to `*`.
3. **Entities/rows**: channel filters target the exact entity scope (9.1 §4.1): `id=eq.<uuid>` for entity channels, `salon_id=eq.<uuid>` for list views — never table-wide subscriptions (9.3 §6.1).
4. **Columns**: server publication projects only the fields the view consumes (9.1 §5.4, 9.8 §3.2); the client requests/validates the projection (9.8 §3).

### 3.2 Rules

- One subscription per logical need, shared via the registry (9.3 §4.2) — no per-row subscriptions (9.3 §6.1).
- Subscription scope is re-evaluated on route change: leaving a view tears down its channels immediately (9.3 §3.2); entering a view subscribes to the new minimum.
- Background/hidden tabs pause non-critical subscriptions (9.3 §3.8, 9.15 §9); critical ones remain but are bounded (9.15 §9.2).
- The registry logs when the total approaches the cap (≥ 5 of 7) per 9.3 §6.2 — a growth warning, not a failure.

## 4. Pagination of initial queries

1. **No complete histories**: every list query is paginated (cursor or offset with server-side `limit`, default page 25, max 100). Initial loads fetch the first page only; the UI renders immediately and fetches more on scroll/click (infinite scroll or "Load more" per view design).
2. **Pagination metadata** (`has_more`, `next_cursor`) comes from the server response; the client never guesses or prefetches unboundedly (prefetch is limited to the next page, only on explicit view intent).
3. **Collections** follow 9.5 §7 merge semantics across pages: a paged list merges row-by-row (9.5 §7.1); a realtime event for a row not in the current pages triggers the collection-level reconciliation rules (9.5 §7.3), not a full re-fetch.
4. **Historical/analytical views** (9.1 §3 forbidden realtime) are paginated server-side queries with cache TTLs (9.2 §5.2); never loaded into memory wholesale.
5. **Badge/notification counts** use count queries (`head: true`, 9.5 §8.2) — never full-list fetches to derive a number.

## 5. Payload minimization

1. **Server-approved payloads**: realtime publications carry only the fields the receiving view needs (9.1 §5.4); the server defines the projection; the client validates it (9.8 §3.2). Full-record transmission is prohibited where a smaller approved projection suffices.
2. **Rule of thumb**: if a view consumes 5 of 40 columns, the payload carries 5 — never the row, never `select *` into the cache (9.8 §3.2 rule 3).
3. **Event payload size guard**: the ingest layer logs `warn` when a payload exceeds 4 KB (above the 9.16 §3.1 push cap but a signal of projection drift) — repeated oversize events raise an alert (§10).
4. **Response payloads**: list endpoints support server-side field selection and pagination (§4); image/media responses are sized per 9.12 §6 caps.
5. Payload minimization applies to pushes (9.16 §3), realtime (9.1 §5.4), offline cache records (9.8 §3), and outbox items (9.10 §9) — one principle, four channels.

## 6. Debouncing and batching

### 6.1 Debounce high-frequency interface refreshes

| Refresh type | Debounce | Notes |
|---|---|---|
| Badge count refresh | 5 s after the triggering event; coalesced | Server reconciliation per 9.5 §8.2 on its own cadence (reconnect, visibility, TTL) — the debounce governs event-driven refreshes |
| List re-sort/re-position after bursts | 250 ms trailing | Multiple events in a burst reposition once (9.5 §7.2) |
| Availability re-check during booking flow | 1 s trailing | Server-authoritative on submit regardless (9.1 §2) |
| SW `registration.update()` | ≤ 1/hour (9.12 §8.4) | Update checks, not data refreshes |
| Visibility-resume resync burst | Coalesce into one resync pass (9.4 §6.2) | Never one resync per queued trigger |

Rules: debounce timers are owned (9.3 §2) and cleared on teardown (§8); a debounced refresh never *delays* a user-initiated action — only automatic refreshes are debounced; debouncing never drops the final state (trailing edge always fires).

### 6.2 Batch safe updates where appropriate

1. **Batchable**: mark-read of multiple notifications (single RPC with an ID array — one idempotent operation per 9.5 §5.3), cache writes per flush cycle (9.10 §6.2), telemetry/analytics samples (≤ 50 events or 5 s, whichever first — content-free, 9.8 §13), outbox flush submissions (≤ 3 in flight, 9.10 §4.1).
2. **Never batch**: operations with independent idempotency keys that must fail separately (each queued op keeps its own key and state, 9.10 §2), mutations whose outcomes drive separate UI states (9.17 §2), anything where a partial batch failure would be ambiguous (the batch must be all-or-nothing-reportable per item — each item reports its own outcome).
3. A batch is always decomposable: every batched item remains individually queryable by its idempotency key (§4 of 9.17's resolution protocol) so a timeout on a batch resolves per item (9.6 §5).

## 7. Cache bounds

### 7.1 Limits

| Store | Size limit | Entry-count limit | Retention limit |
|---|---|---|---|
| IndexedDB (all user stores, 9.2 §2.1) | 50 MB/user combined (9.2 §5.3) | 2 000 entries per store (hard) | Per-record TTL + hard purge (9.8 §11.1) |
| CacheStorage (static/images) | Within the 50 MB budget | 500 assets / 200 images (hard) | Versioned: removed at activation (9.12 §8); media 7-day TTL |
| CacheStorage (API public) | Within budget | 200 entries | TTL per 9.13 §12.1 |
| CacheStorage (API per-user) | Within budget | 200 entries per user namespace | TTL + purge on sign-out (9.14 §3) |
| Outbox | 50 items/user (9.9 §5.2) | 50 (hard) | 7-day expiry (9.8 §11.1) |
| Drafts | 20 per user | 20 (hard) | 30-day TTL |
| Seen-sets | 10 000 (realtime) / 200 (push) | hard | 15 min / 48 h TTL (9.5 §3.2, 9.16 §6.2) |

### 7.2 Eviction policy

1. **Order**: expired first (TTL/hard purge, 9.7 §7), then LRU within a store, then oldest versioned assets, then user-scoped API entries. Never evict: in-flight outbox items, the current view's confirmed records, queued writes (9.2 §5.3).
2. **Quota pressure** (≥ 80% of 50 MB): the eviction sequence of 9.2 §5.3 runs; on quota exceeded, non-essential caches are cleared and the app runs online-only with a warning banner (9.2 §5.3).
3. Evictions are logged at `debug` (store, count, reason); a store at ≥ 90% of its entry cap logs `warn` (capacity planning signal).

## 8. Removal of abandoned resources

### 8.1 Sweep inventory (what the sweeper removes)

| Resource | Detection | Removal |
|---|---|---|
| Subscriptions whose view is gone | Route/owner teardown (9.3 §3.2) — immediate, not swept | `removeChannel` at teardown |
| Timers without owners | Allocation registry (owner+trigger recorded, §2.2) | Asserted zero at teardown (9.4 §10.5); leaks logged as errors |
| Event listeners | Named listener inventory (online/offline/visibility/pageshow/storage/BC) | Removed at teardown; leak test asserts zero (9.3 §3.8, 9.4 §10) |
| Cached records past TTL/hard purge | Sweep on start, visibility resume, every 24 h (9.8 §11.2) | Deleted per 9.7 §7 |
| Expired outbox items | Evaluation at claim + sweep | `expired` + notify (9.10 §3) |
| Orphaned/partial cache entries | Checksum/scope validation (9.7 §6) | Discarded (9.7 §7) |
| Dead SW namespaces | Purge messages + idle sweep | Deleted (9.12 §7) |
| Stale in-memory singletons | Module teardown on sign-out (9.14 §3) | Cleared with verification |

### 8.2 Rules

1. **Teardown is the primary reclaim; the sweep is the backstop.** Abandonment is prevented at the owner boundary (9.3 §2); the sweep handles failures of that discipline (leaks) and time-based expiry.
2. The allocation registry (owner + trigger) is the single inventory; the sweep asserts every allocated item is either active-with-owner or already reclaimed.
3. Sweep work is itself bounded: it runs on the leader tab only (9.4 §9.1), never while the tab is hidden beyond a single pass, and its own timers are owned.
4. Leak findings (timers/listeners/channels alive after teardown) are `error`-logged and alert (9.4 §12, §10 below) — they are bugs, not acceptable states.

## 9. Monitoring

### 9.1 Client metrics (per tab, sampled; aggregated leader-side)

| Metric | Definition | Collection |
|---|---|---|
| **Realtime connection count** | Active sockets (expected: 1); channels (expected ≤ 7) | Connection manager counters, sampled 30 s |
| **Event volume** | Events received per minute per channel; payload bytes | Ingest counters; oversize guard (§5.3) |
| **Reconnect rate** | Reconnects/min, attempt distribution, circuit events | 9.4 §4 scheduler logs |
| **Outbox size** | Items per state (`queued`, `syncing`, `failed`, `conflict`, …); total | Outbox store counts on change |
| **Retry count** | Retries per item; per-class (transient/auth/conflict) | 9.10 §5 counters |
| **Synchronization latency** | Time from `reconnecting`/`offline` → `live`; resync duration per scope | 9.4 machine transitions + resync timers |
| **Cache usage** | Bytes per store; entry counts; eviction counts | 9.2 §5.3 + §7 counters |
| **In-flight requests** | Concurrent requests (cap 8); abort counts | Request layer |
| **Subscription churn** | Subscriptions created/removed per minute; peak concurrent | Registry |

### 9.2 Server-side metrics

| Metric | Source |
|---|---|
| Connections per user/origin; channels per user; connection churn | Realtime server (9.4 §11.7) |
| Event volume per table/channel; payload size distribution | Publication layer |
| Reconnect storm detection (cohort connect spikes) | 9.4 §11.7 |
| Outbox flush load; idempotency replay rate; conflict rate | 9.9/9.10/9.11 server paths |
| Push delivery success/failure; token invalidation rate | 9.16 §10.4 |

### 9.3 Rules

1. Metrics are content-free (counts, durations, scope IDs) — never payloads, tokens, or PII (9.8 §13).
2. Client metrics are batched to the leader (9.4 §9) and flushed with telemetry per §6.2 batching (≤ 50 samples / 5 s); the leader aggregates per-origin totals.
3. Sampling is adaptive: normal operation samples at 30 s; under anomalies (reconnect burst, quota pressure) sampling tightens to 5 s for diagnosis, then relaxes.

## 10. Thresholds and alerts

| Alert | Threshold | Severity | Action |
|---|---|---|---|
| Channel count at cap | ≥ 5 of 7 channels | `warn` (client log) | Registry warning per 9.3 §6.2 |
| Channel count exceeded | > 7 | `error` + alert | Eviction ran; investigate scope creep (9.3 §6.2) |
| Reconnect rate spike | > 5 reconnects/min/tab sustained 5 min, or circuit events | `warn` → `error` at 10/min | Check 9.4 §4 compliance; storm detection server-side (9.4 §11.7) |
| Sync latency SLO breach | p95 `reconnecting` → `live` > 45 s (9.4 §12) | `warn` → `error` sustained | Investigate server health / backoff misconfig |
| Event volume anomaly | > 5× baseline per channel sustained 5 min | `warn` | Check publication scope (9.1 §2) / projection drift |
| Payload oversize | Repeated > 4 KB realtime payloads | `warn` | Projection drift fix (§5.3) |
| Outbox growth | > 25 items, or > 10 in `failed`/`conflict` | `warn` | User-facing prompt; investigate systemic rejections |
| Outbox capacity | 50 items (hard) | Blocked enqueue + `warn` | 9.9 §5.2 overflow path |
| Retry loops | Same item retried > 5 times transient, or auth-class retries attempted | `error` | Classification bug (9.10 §5.2) |
| Cache quota | ≥ 80% of 50 MB | `warn` | 9.2 §5.3 eviction; ≥ 100% → `error` + online-only mode |
| Teardown leaks | Any timer/listener/channel alive after teardown | `error` | Leak bug fix (§8.2) |
| In-flight cap | > 8 concurrent | `error` | Request-layer bug |

Rules: alerts route through the 9.4 §11.7 monitoring pipeline; client-side anomalies surface in the app's diagnostic view (developer/ops), never as user-facing errors (9.17 §5 rule 1); thresholds are configurable server-side so fleet-wide tuning doesn't require a client release.

## 11. Edge cases

| Edge case | Handling |
|---|---|
| User opens many tabs | Per-tab limits hold; origin budgets (cache, outbox) enforced by shared stores; channel count across tabs bounded by tabs × 7 — the server-side per-user connection quota (9.4 §11.5) is the fleet-level backstop |
| Route changes rapidly | Teardown-before-create per 9.3 §4.2; subscriptions never accumulate across routes; channel count returns to the new view's minimum |
| Event burst (mass availability update) | Ingest dedups + version-gates (9.5 §3–§4); collection re-sort debounced 250 ms; payloads bounded (§5); no per-event refetch storm (9.5 §7.2 debounce) |
| Deep history navigation | Pagination applies; no full-history load (§4); cached pages respect TTL |
| Slow network with large lists | Page size 25; images sized; requests ≤ 8 concurrent; UI renders first page immediately |
| Hidden tab for hours | Non-critical subscriptions paused; critical bounded (9.15 §9); on resume one coalesced resync (9.4 §5.2) |
| Quota exhaustion mid-session | 9.2 §5.3 sequence; online-only mode + banner; never evicts active/queued items (§7.2) |
| Sweep runs during a flush | Sweep skips in-flight/queued outbox items (owner check); no race with claims (9.10 §4.2) |
| Multiple portals in one origin | Per-portal instances share origin budgets; leader election is per-origin (9.4 §9.1) |
| Telemetry batching loses the tail on crash | Last batch may be lost — acceptable (diagnostic data only); the leader's aggregate counters are not user-facing truth |

## 12. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Allowed domains bound what may be subscribed; payload minimization originates in 9.1 §5.4 |
| 9.2 | Cache stores, quotas, TTLs, and the 9.2 §5.3 eviction sequence |
| 9.3 | Ownership, teardown triggers, channel limits, registry dedup — the §8 sweep's substrate |
| 9.4 | Backoff bounds, epochs, leader election, monitoring pipeline (9.4 §11.7, §12) |
| 9.5 | Dedup/seen-set limits, watermark discipline, refetch debounce |
| 9.6 | Pending-store bounds; optimistic ops one-per-entity |
| 9.7 | Record contract gates eviction safety (never evict active confirmed records wrongly) |
| 9.8 | Storage budgets, projections, retention — the §7 limits' authority |
| 9.9/9.10 | Outbox capacity, claim bounds, retry classification feeds §10 alerts |
| 9.12 | SW cache bounds, activation cleanup, update throttling |
| 9.13 | Strategy TTLs feed §7 retention; per-user namespaces bound per-user API cache |
| 9.15 | Leader-only sweep; multi-tab budgets; per-tab limits × tabs |
| 9.16 | Push seen-set bounds; badge refresh debounce |
| 9.17 | Alerts never surface as user-facing errors; operations keep their states |

## 13. Implementation acceptance checklist for 9.18

- [ ] Every §2 limit is enforced by a test: channel cap (7, eviction at overflow), outbox cap (50, block), in-flight cap (8), seen-set bounds, signed-URL concurrent cap.
- [ ] Subscription minimization: registry entries subscribe only to required tables/events/entities; a `*`-event or table-wide filter in a review is a violation (static test).
- [ ] Pagination: every list endpoint enforces server-side limits; initial loads fetch ≤ 100; no code path loads complete histories (test with a 10 000-row dataset).
- [ ] Payload minimization: realtime publications carry approved projections only; no `select *` into cache (static scan); oversize guard logs `warn`.
- [ ] Debounce/batch: high-frequency refreshes are debounced per §6.1; batchable operations batch, non-batchable never batch; each batched item remains individually queryable by key.
- [ ] Cache bounds: size/entry/retention limits enforced with eviction per §7.2; quota-pressure sequence runs at ≥ 80%; nothing active/queued is ever evicted.
- [ ] Abandoned-resource removal: teardown leaves zero timers/listeners/channels (asserted per 9.4 §10.5); sweeps remove expired/orphaned entries on the documented cadence; leak findings log `error`.
- [ ] Monitoring: all §9.1 metrics collected content-free, batched to the leader, aggregated per origin; server-side metrics per §9.2.
- [ ] Alerts: every §10 threshold fires at the right severity through the 9.4 pipeline; client anomalies appear in the diagnostic view only.
- [ ] Edge-case suite: many tabs, rapid route change, event burst, deep history, slow network, long-hidden tab, quota exhaustion, sweep-during-flush.

## 14. Change control for 9.18

Any modification to resource limits, subscription-scope rules, pagination defaults, payload projections, debounce/batch policies, cache bounds or eviction, sweep cadence, monitoring metrics, or alert thresholds requires:
- Capacity/load review (multi-tab, multi-device, event-burst scenarios)
- Regression of the limit-enforcement and sweep test suites
- Monitoring/alerting configuration review
- Update to this specification before release.

---

**Sub-point:** 9.19 — Observability & Auditability  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Observability is the ability to reconstruct *what the system did* — from the realtime transport through the offline queue to the server commit — from safe, structured operational records. Auditability is the ability to *prove* what high-risk operations did, per the immutable audit requirements of Section 8. Both are achieved **without ever logging the data that would make them dangerous**: logs and metrics carry identifiers, counts, durations, and outcomes — never content.

Governing rules:

1. **Record safe operational metrics** for the ten required areas of §2: subscription creation/removal, connection and reconnection failures, authentication-related channel failures, missed-event reconciliation, outbox queue length, retry and permanent-failure counts, conflict frequency, Service Worker installation/activation failures, cache migration failures, and synchronization duration. Each metric is defined with a collection point, aggregation, and alert binding (§2).
2. **High-risk server-side operations retain the audit requirements defined in Section 8** (§3): the immutable `audit_events` trail (`private.log_audit()`, service-role only, capturing actor, action, old/new state, and idempotency key), immutable idempotent payment webhook records, RPC-only mutations with `auth.uid()`/role/ownership verification, and `REVOKE ALL` protection of financial tables. Section 9 adds the realtime/offline operations that must enter that trail, never replacing Section 8's requirements.
3. **The log denylist is absolute** (§4): access/refresh tokens, service-role credentials, complete private Realtime payloads, sensitive offline-cache contents, private signed URLs, identity documents, and payment credentials never appear in any log, metric, error, or telemetry record — enforced by field-allowlist schemas, a redaction layer, and static scans, not by writer discipline alone.
4. **Structured, correlated, content-free**: every log line carries a correlation ID and scope identifiers; payloads are replaced by hashes and counts (§5). Client telemetry is batched, leader-aggregated, and redacted at the edge (§6).
5. **Observability is bounded and non-disruptive**: logging never blocks the critical path, never grows without retention limits, and never leaks PII (§7–§8).

## 2. Operational metrics catalogue

Each metric below is recorded client-side (per tab, aggregated leader-side per 9.18 §9), server-side, or both, as marked. All are content-free (counts, durations, scope IDs, outcome classes). Threshold/alert bindings reference 9.18 §10.

| # | Metric | Definition | Collection point | Aggregation | Alert binding |
|---|---|---|---|---|---|
| 1 | **Subscription creation and removal** | Channels created / removed per minute; peak concurrent; removal reason (route exit, teardown, auth failure, eviction) | Subscription registry (9.3 §4.2), both client + server (channel joins/leaves) | Leader-side per-origin; server per-user/per-table | 9.18 §10 channel-cap and churn alerts |
| 2 | **Connection and reconnection failures** | Socket open failures, disconnects, reconnect attempts by attempt-number bucket, circuit events, handshake timeouts | Connection manager (9.4 §4–§5) | Leader-side; server-side connect attempts per user/IP | 9.18 §10 reconnect-rate spike; 9.4 §11.7 churn alert |
| 3 | **Authentication-related channel failures** | Channel failures classified as auth (401/403, close 1008, RLS suppression, JWT errors per 9.4 §8.1): count by code, channel scope class, resolution (session revalidated, teardown, recovery action) | Ingest + registry (9.5 §9.3, 9.4 §8) | Client per tab; server-side auth-rejection rate (9.4 §11.7) | Auth-rejection spike alert (9.4 §11.7); 9.18 §10 classification-bug alert if retried |
| 4 | **Missed-event reconciliation** | Version-gap detections, buffer overflows, reconciliation refetches per scope (9.5 §6), time-to-converge | Ingest + resync (9.5 §3–§6) | Leader-side | 9.18 §10 event-volume anomaly; repeated gaps → projection/publication review (9.5 §11.8) |
| 5 | **Outbox queue length** | Items per state (`queued`, `syncing`, `failed`, `conflict`, `expired`, `cancelled`), total, delta over time | Outbox store (9.10 §5) on change | Per user (server sees flush load) | 9.18 §10 outbox growth/capacity alerts |
| 6 | **Retry and permanent-failure counts** | Retries per item, per class (transient/auth/validation/conflict); permanent failures by `failure_class` + code | Outbox processor (9.10 §5) | Leader-side; server-side replay rate | 9.18 §10 retry-loop alert; §10 auth-class-retry alert |
| 7 | **Conflict frequency** | Conditional-write rejections by code (`version_conflict`, `field_conflict`, `business_conflict`, `entity_deleted`, `scope_changed`, 9.11 §8.2), per entity class; resolution outcomes (accepted server, kept local, edited, cancelled) | Mutation gateway + 9.11 workflow | Server-side primary (rejections are server facts); client records workflow outcomes | 9.18 §10; sustained conflict-rate rise → UX/merge-policy review (9.11 §12) |
| 8 | **Service Worker installation and activation failures** | Install aborts (precache/registry failures, 9.12 §11), activation cleanup failures, update failures, SW-health events | SW lifecycle hooks (9.12 §8, §11) | Per origin | 9.18 §10; SW-health alert (9.12 §11) |
| 9 | **Cache migration failures** | Registry-version-bump cleanup failures (9.12 §8), purge failures (9.14 §5), namespace-deletion failures, quota-pressure evictions | Cache manager + SW (9.7 §7, 9.8 §10.2, 9.12 §8) | Leader-side | 9.18 §10 cache-quota alert; purge-incomplete security events (9.8 §13) |
| 10 | **Synchronization duration** | Time `reconnecting`/`offline` → `live`; per-scope resync durations; p95/percentile distribution; budget exhaustion events | Connection manager + resync (9.4 §6.2, §12) | Leader-side; server-side connect-to-`SUBSCRIBED` p95 (9.4 §11.7) | 9.18 §10 sync-latency SLO (p95 ≤ 45 s) |

Rules:

1. Metrics are emitted via the §6 pipeline (batched, leader-aggregated, redacted); raw per-tab metrics never leave the origin except as aggregates.
2. Each metric's definition includes its unit, sampling interval (normal 30 s; 5 s under anomaly per 9.18 §9.3), and retention class (§7).
3. Metric names follow a fixed taxonomy (`nexora.realtime.channels.active`, `nexora.outbox.items.{state}`, …) so dashboards and alert rules are stable; taxonomy changes are change-controlled (§12).

## 3. Audit requirements — Section 8 retained, extended to Section 9 operations

### 3.1 Section 8 requirements (retained verbatim in force)

1. **Immutable audit trail**: the `audit_events` table with its immutable trigger; writes only via `private.log_audit()` (service-role only); entries capture **actor, action, old/new status, idempotency key** — and are never updatable or deletable (Section 8 §2.4).
2. **Payment webhook integrity**: `payment_webhook_events` with unique `idempotency_key`, signature-verification flag, and immutable trigger; ingest/process via the secure RPCs (Section 8 §2.5).
3. **RPC-only mutations**: all mutations go through secure RPCs verifying `auth.uid()`, role, and ownership (Section 8 §2.3); financial tables (`growth_partner_commissions`, `owner_payout_*`, `wallet_transactions`, `rewards`, `audit_events`, `payment_webhook_events`) keep `REVOKE ALL` (Section 8 §2.6).
4. These requirements apply unchanged to every operation described in Section 9. Nothing in Section 9 relaxes them; Section 9 only adds operations that must also be audited.

### 3.2 Section 9 operations that enter the immutable audit trail

| Operation class | Audit event (actor, action, old/new, key) | Notes |
|---|---|---|
| **Outbox flush commits** | `outbox.flush.commit` with `idempotency_key`, op_id, outcome | Every flush-originated commit is auditable (9.9 §11.5); replays logged as `outbox.flush.replay` with the original key — never as a new effect (9.5 §5.3) |
| **High-risk action attempts** (9.9 §9.1: payments, refunds, payouts, commissions, booking confirmation, roles, ownership, verification, document approval) | Attempt + result via the existing secure RPC audit path | Denied attempts are audited too (actor, action, denial reason code) — auditability includes what *didn't* happen and why |
| **Conflict resolutions** (9.11) | `conflict.resolved` with entity, code, chosen resolution (server/keep-local/edit/cancel), resulting version | Resolution choices are business-relevant; per §3.1's old/new status capture |
| **Conditional-write rejections** (9.11 §3) | Rejection with code + expected vs. current version | Feeds conflict-frequency metric (§2 #7) |
| **Device-token lifecycle** (9.16 §5) | Token register/disable/purge with reason (never the token value) | §4 denylist applies — token is a credential-shaped secret reference, logged by ID only |
| **Revocation and sign-out** (9.14) | Session revocation, scope revocation, global sign-out, purge outcomes | Cross-references the §2 #9 cache-migration/purge metrics |
| **Idempotent replays** | Replay of a stored result by key | Proves no duplicate business effect (9.5 §5.3, 9.15 §5) |
| **Signed URL issuance/revocation** (9.8 §9, 9.14 §9) | URL-ID issued/revoked, scope, validity | Never the URL itself (§4) |

### 3.3 Rules

1. Audit events are written **server-side only**, through `private.log_audit()` (or the equivalent immutable path); client-side logs are operational, never the audit of record.
2. An operation is not "committed" until its audit row exists (audit write in the same transaction where Section 8 requires it); audit failures abort or surface per §8.
3. Audit retention is defined by Section 8's retention policy; operational metrics follow §7.
4. Audit rows are immutable: no Section 9 mechanism (cache purge, sign-out, conflict resolution, outbox expiry) may delete or modify an audit row.

## 4. Log denylist — absolute prohibitions

### 4.1 The denylist

The following never appear in any log, metric label, error message, telemetry sample, alert, or diagnostic view — in plaintext, encoded, hashed-reversibly, or as truncations:

| # | Category | Examples of what is prohibited | Allowed alternative |
|---|---|---|---|
| 1 | **Access or refresh tokens** | JWTs, session tokens, refresh tokens, API keys | Token ID hash (irreversible, keyed) or no reference at all |
| 2 | **Service-role credentials** | Supabase service_role key, provider secrets, VAPID private key, admin credentials | The fact that a service-role path ran, with a correlation ID |
| 3 | **Complete private Realtime payloads** | Full `payload.new`/`payload.old` bodies of private channels (9.1 §2) | Event type, entity scope ID, version, size, outcome |
| 4 | **Sensitive offline-cache contents** | Values from cached private records, outbox payloads, drafts content, watermark values | Store name, entry count, eviction reason |
| 5 | **Private signed URLs** | The URL string, its query credentials, its token | URL-ID hash + scope + validity window |
| 6 | **Identity documents** | Passport/ID numbers, government IDs, document content | Document record ID only |
| 7 | **Payment credentials** | Card numbers, CVV, expiry, bank/IFSC numbers, provider payment tokens, wallet balances, commission/payout amounts | Payment record ID + status class only |

Scope IDs (entity UUIDs, user UUIDs, salon UUIDs) are **permitted** — they are the correlation key — but never the *values* they reference (9.8 §13 established this consistently; this section makes it an absolute contract).

### 4.2 Enforcement gates (defense in depth)

| Gate | Mechanism |
|---|---|
| **Structured schemas** | Every log/telemetry record is validated against a field allowlist at emission; a record containing a field outside the allowlist (or a denylisted pattern) is dropped and the *emission site* is flagged — content never reaches the transport |
| **Redaction layer** | A central serializer redacts by pattern (JWT regex, URL-credential patterns, card-number patterns) at the boundary of every sink (console, network, file); redaction is applied even to fields believed safe |
| **Static scans** | CI scans for denylisted literals, `console.log` of payload objects, and unsafe interpolation into log strings (9.8 §5 rule 1 analog) |
| **Runtime test** | Fault-injection tests force every log path to emit with a denylisted value present in scope and assert the output contains only the safe alternative (§10) |
| **Metrics cardinality guard** | Metric labels are restricted to a fixed enum of scope classes — user IDs may appear only as pre-aggregated counts, never as per-user label keys (prevents both leakage and cardinality blowup) |

## 5. Structured logging

### 5.1 Log record schema (all sinks)

```json
{
  "ts": "2026-08-05T09:20:00.000Z",
  "level": "debug" | "info" | "warn" | "error",
  "correlation_id": "uuid",          // per operation/flow; spans client+server
  "source": "client:tab:<tabId> | sw | server:<service>",
  "scope": { "user_id": "uuid", "salon_id": "uuid|null", "tenant_id": "uuid|null" },
  "event": "nexora.realtime.channel.auth_failure",
  "fields": { /* allowlisted fields only — counts, codes, durations, IDs, hashes */ },
  "error": { "class": "transient|auth|validation|conflict|unknown", "code": "…", "retryable": true }
}
```

### 5.2 Rules

1. **Levels** (consistent with 9.4 §12): `debug` = attempt scheduling, state transitions, cache serves/evictions; `info` = lifecycle milestones (subscription created, outbox flushed, sign-out completed); `warn` = anomalies within recovery (gaps, stale entries, channel auth failures, SW update failures); `error` = failures requiring investigation (teardown leaks, purge failures, sync budget exhaustion, permanent failures).
2. **Correlation**: one `correlation_id` spans a user action from client through outbox flush to the server audit row; the server logs the same ID (derived from the idempotency key where applicable) so a single query reconstructs the whole path.
3. **Scope**: `user_id`/`salon_id`/`tenant_id` UUIDs are the correlation context; no other identifiers, no display strings, no payload-derived values.
4. **Never log content** (§4); when a field is "logged", what is logged is its hash (keyed, irreversible) or its size/count, per the §4.1 allowed-alternative column.
5. Client logs are buffered and flushed with telemetry (§6); a crash loses the tail (accepted — 9.18 §11 telemetry rule) but server audit rows (the record of truth) are never lost that way.

## 6. Telemetry pipeline

1. **Client → leader**: each tab buffers metric samples and logs (bounded: 1 000 events / 64 KB in memory); the leader (9.4 §9.1) aggregates per-origin totals and flushes to the server in batches (≤ 50 samples or 5 s, per 9.18 §6.2).
2. **Edge redaction**: the ingestion endpoint re-validates every batch against the §4 denylist before persistence (a second independent gate from the client-side one) — a batch failing validation is quarantined, the sender flagged, and nothing partially written.
3. **Server aggregation**: metrics are aggregated server-side into the monitoring store (counters, histograms with bounded buckets, no per-user label keys); raw samples are retained short-term (§7).
4. **Server-side metrics** (§2 server rows and 9.4 §11.7) flow directly into the same store, so client and server views of the same phenomenon (e.g., reconnect rate vs. server connect attempts) are joinable by time window and scope class.
5. **Sampling**: normal operation samples at 30 s (9.18 §9.3); anomaly windows tighten to 5 s; `error`-level logs are never sampled away.
6. **Diagnostic view**: client anomalies surface in the app's ops/diagnostic view (9.18 §10) fed by the leader's aggregated state — never user-facing error copy (9.17 §5).

## 7. Retention and access control

| Class | Retention | Access |
|---|---|---|
| Debug/info operational logs | 7 days (client-side buffer: session only) | Ops/support with the correlation ID; no direct user access |
| Warn/error operational logs | 30 days | Ops/support |
| Aggregated metrics | 90 days (1-year for SLO metrics: sync latency, reconnect rate) | Ops dashboards; no per-user labels |
| Server audit trail (`audit_events`) | Per Section 8 policy (immutable, long-term) | Service-role/trusted reviewers only; append-only |
| Payment webhook records | Per Section 8 (immutable, long-term) | Service-role/trusted reviewers only |
| Quarantined batches (denylist failures) | 30 days, then deleted | Security/incident response only |

Rules:

1. Retention is enforced by the storage layer (TTL indexes / lifecycle rules), not by periodic manual cleanup — with the 9.8 §11.2 sweep as backstop.
2. Access is least-privilege: dashboards expose aggregates; raw logs require the correlation ID and an authenticated ops role; audit rows are append-only with no update/delete path (Section 8 §2.4).
3. Logs are treated as sensitive data: the log store is isolated from application data stores; log access is itself audited (access events enter the audit trail).

## 8. Failure modes

| Failure | Behavior |
|---|---|
| Logging fails (quota, storage down) | Logging degrades gracefully: counters drop oldest-buffer entries; the critical path (mutations, flush) never blocks on logging; a persistent logging outage raises an ops alert — silent loss of observability is itself an incident |
| Audit write fails for a high-risk operation | The operation **does not commit** where Section 8 requires same-transaction audit; elsewhere, the operation completes and the audit failure escalates immediately (§3.3) |
| Denylist violation detected | The record is dropped/quarantined, the emission site flagged, a security event raised; the violation is treated as a bug with the highest priority (§4.2) |
| Telemetry batch rejected at the edge | Quarantine + sender flag; client logs the rejection at `error`; no retry storm (bounded retry per 9.4 §4 if the rejection is transient) |
| Sampling under anomaly overloads the pipeline | Bounded buffers + drop-oldest; aggregates remain correct at window granularity; never sample below `error` |
| Client crash before telemetry flush | Tail loss accepted (9.18 §11); server-side metrics and audit rows remain the record of truth |

## 9. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1 | Event-type/scope-only logging of realtime activity; allowed domains bound what may be observed |
| 9.2/9.7/9.8 | Cache metrics feed the §2 #9 row; cache contents never logged (§4) |
| 9.3 | Registry churn feeds §2 #1; teardown leaks surface as `error` logs (9.4 §12) |
| 9.4 | Connection/reconnect/auth-failure metrics (§2 #2–#3); epochs guard telemetry callbacks; monitoring pipeline (9.4 §11.7) is the alert sink |
| 9.5 | Gap/reconciliation metrics (§2 #4); dedup seen-sets never logged as content |
| 9.6/9.9/9.10 | Outbox and retry metrics (§2 #5–#6); flush commits enter the audit trail (§3.2); idempotency keys are the correlation spine |
| 9.11 | Conflict frequency (§2 #7) and resolution audit events (§3.2) |
| 9.12 | SW install/activation/cache-migration metrics (§2 #8–#9); SW logs are content-free per 9.12 §2 |
| 9.13 | Cache-strategy TTLs inform retention of cache-derived metrics |
| 9.14 | Sign-out/revocation audit events; purge metrics; token lifecycle logging (never the token) |
| 9.15 | Leader aggregation; multi-tab telemetry convergence; per-origin budgets |
| 9.16 | Token lifecycle audit (§3.2); push metrics (delivery success/failure) join §2 #5/#6 views; payload denylist extends to logs |
| 9.17 | Errors are logged with class/code/correlation — the user never sees logs; the diagnostic view is the only client-facing surface |
| 9.18 | Thresholds/alerts consume the §2 metrics; monitoring pipeline shared |

## 10. Implementation acceptance checklist for 9.19

- [ ] All ten §2 metrics are implemented with definitions, collection points, and alert bindings; metric names follow the fixed taxonomy (taxonomy test).
- [ ] Section 8 audit requirements retained: `audit_events` immutable via `private.log_audit()` (service-role only) capturing actor/action/old-new/idempotency_key; payment webhook records immutable + idempotent; RPC-only mutations; financial tables `REVOKE ALL` — verified by the existing Phase 8 contract tests plus new tests for the §3.2 additions.
- [ ] Every §3.2 operation class produces an audit row (outbox commits, replays, high-risk attempts + denials, conflict resolutions, token lifecycle, revocations, signed-URL issuance/revocation); replays are logged as replays, never as new effects.
- [ ] Denylist enforcement: runtime fault-injection test — force each of the 7 categories into log scope and assert the output contains only the safe alternative; edge redaction rejects a planted token/card/URL in a batch; static scans pass.
- [ ] Structured logging: every log record validates against the §5.1 schema (field allowlist); correlation IDs span client → flush → audit row (end-to-end test); levels per §5.2.
- [ ] Telemetry pipeline: client → leader aggregation → batched flush → edge revalidation; sampling per 9.18 §9.3; `error` never sampled away; diagnostic view is the only client surface.
- [ ] Retention/access: TTL-enforced retention per §7; aggregate-only dashboards (no per-user labels); log-store isolation; log-access auditing.
- [ ] Failure modes: logging failure degrades without blocking the critical path; audit-write failure blocks high-risk commit where Section 8 requires; denylist violation quarantines + security event; telemetry tail loss accepted with server truth intact.
- [ ] No log contains any §4 value — proven by a full-scan test of captured test-suite logs (all suites run with a logging sink that asserts the denylist).

## 11. Change control for 9.19

Any modification to the metrics catalogue, audit event classes, log schema, denylist, telemetry pipeline, retention classes, or access controls requires:
- Security/privacy review (log leakage, PII, credential exposure)
- Redaction/static-scan test updates
- Audit-trail compatibility review (Section 8 immutability must be preserved)
- Dashboard/alert configuration review
- Update to this specification before release.

---

**Sub-point:** 9.20 — Required Testing  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Every rule in Section 9 exists to be **verified by an automated test**. This section is the mandatory testing contract: the catalogue of required tests, the scenarios they must run under, the deterministic infrastructure that makes them reliable, and the CI gating that makes them non-negotiable.

Governing rules:

1. **The required test catalogue of §4 is mandatory and exhaustive for its 23 areas**: an area with no automated test is an unshipped rule. The catalogue maps each test to the specification it enforces (§4 column) and to a concrete procedure with a decisive assertion.
2. **Tests run under the scenario matrix of §5**: slow networks, temporary disconnections, expired sessions, permission revocation, duplicated events, out-of-order events, multiple browser tabs, stale caches, failed service-worker updates, and interrupted synchronization — as applicable per test, via deterministic fault injection (§6), never by "hoping the network misbehaves".
3. **Determinism is a requirement, not a goal**: the harness (§3, §6) controls time, transport, event sequences, auth state, cache state, and SW lifecycle so every failure is reproducible. A test that flakes is a bug in the harness or the product — and is quarantined, not tolerated.
4. **Traceability is enforced**: every acceptance-checklist item in 9.1–9.19 maps to at least one test in §4; every test cites its spec rule (§8). Coverage is measured against the checklist inventory, not against line coverage alone.
5. **Negative tests outrank positive tests**: the highest-value assertions are that unauthorized events do not arrive, stale state does not render, duplicates do not apply, and no cross-account artifact survives.

## 2. Test strategy and layers

| Layer | Scope | Tools/approach | Runs on |
|---|---|---|---|
| **Unit** | Pure logic: version decision table (9.5 §4.1), backoff/jitter (9.4 §4), envelope validation (9.10 §2), merge eligibility (9.11 §4), redaction (9.19 §4) | Vitest/Jest + fake timers | Every PR |
| **Integration (client)** | Outbox processor, connection manager state machine, ingest/dedup pipeline, optimistic store, purge routines — against an in-memory fake Supabase + IndexedDB (`fake-indexeddb`) | Component/integration harness (§3) | Every PR |
| **E2E (browser)** | Real browser (Playwright), app + Service Worker against a controllable fake server: subscription lifecycle, offline screens, sign-out propagation, SW cache behavior | Playwright + fake server + network profiles (§5) | Every PR (core), nightly (full matrix) |
| **Contract (server/RLS)** | RLS and authorization isolation: cross-user, cross-salon, partner attribution, anonymous — using authenticated JWTs per 9.1 §4.2 | SQL/contract runner (extends the Phase 8 pattern) | Every PR |
| **Fault injection** | Scripted reordering/duplication/drops, crash points, clock skew, SW update failures | Deterministic harness (§6) | Every PR (targeted), nightly (full) |
| **Load/perf** | Event bursts, many tabs, quota pressure, reconnect storms — bounded budgets per 9.18 | K6/Playwright load | Nightly / pre-release |
| **Static scans** | Denylist literals in logs (9.19 §4), sensitive data in `localStorage` (9.8 §5), cache registry validity (9.12 §4), `select *` into cache (9.18 §5), vague-success copy (9.17 §3) | ESLint/custom scanners | Every PR |

## 3. Deterministic test harness

### 3.1 Components

| Component | Purpose | Notes |
|---|---|---|
| **Fake transport** | In-memory Realtime server: scripted event sequences, controllable delay, reorder/duplicate/drop injection, auth-close codes, RLS-suppression markers | Implements the 9.1 §2.2/9.5 §2.2 payload contract exactly (INSERT `new`/`old`, DELETE `old`, `errors`) |
| **Fake clock** | Deterministic time: TTL expiry, backoff schedules, out-of-order buffer windows, sync timestamps | Inject skew (± 24 h per 9.5 §4.4 tests) |
| **Fake auth** | Controllable sessions: expiry at will, refresh success/failure, token rotation, sign-out, revocation mid-flight | Bound to the 9.4 §7 and 9.10 §6 pre-flight paths |
| **Fake IndexedDB / CacheStorage** | Real API semantics in-memory; crash simulation (transaction aborts, torn writes) | `fake-indexeddb`; SW cache simulated or real via browser |
| **Scripted scenario runner** | Defines scenario = sequence of (event, delay, network state, auth state, tab count, cache state) steps; asserts expected state machine and UI at each step | The §5 matrix is expressed in this runner |
| **Contract runner** | Executes RLS tests with minted JWTs (owner, staff, customer, reviewer, other-tenant, anonymous) | Extends the existing Phase 8 contract-test pattern |
| **Log sink** | Captures all logs during any test and asserts the 9.19 §4 denylist post-run | Runs on every suite |

### 3.2 Fixture factory

- Per-domain factories (booking, payment attempt, notification, proposal, availability, wallet) producing versioned records with deterministic UUIDs; a **multi-tenant seed** (salon A/B, users across tenants) shared by all isolation tests.
- Fixtures never contain real PII, real tokens, or real credentials — test data is synthetic and denylist-clean by construction.

## 4. Required test catalogue

Each entry: **ID, requirement, spec reference, layer, procedure, decisive assertion.**

### 4.1 Authorization isolation

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T1 | **One user cannot receive another user's Realtime events** | 9.1 §4.2, 9.3 §10 | Contract + integration | User A's channel delivers no event addressed to user B (RLS denial at the server; `errors` marker at the transport; nothing rendered client-side) — tested with A and B subscribed simultaneously |
| T2 | **One salon cannot receive another salon's booking or financial events** | 9.1 §4.2, 9.2 §7 | Contract + integration | A salon-scoped channel for salon A delivers zero booking/payment events for salon B; cross-tenant queries return zero rows |
| T3 | **Partners receive only attributed records** | 9.1 §2 (attribution), 9.2 §7 | Contract | Partner P receives events/rows only for records where P is the attributed partner; unrelated partner records return nothing (positive + negative cases) |
| T4 | **Anonymous users receive only explicitly public events** | 9.1 §3, 9.2 §3 | Contract + integration | Anonymous session receives public catalogue events only; any private-channel attempt is refused; no anonymous subscription to `nexora:v1:notification:*` or entity channels succeeds |

### 4.2 Subscription lifecycle

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T5 | **Duplicate subscriptions are not created after navigation** | 9.3 §4 (registry, Strict Mode) | E2E | Navigate A→B→A across every portal; registry/channel count returns to the view's minimum; no duplicate channel objects exist for the same key (asserted via the registry, not the network) |
| T6 | **Subscriptions stop after sign-out and route teardown** | 9.3 §3, 9.14 §3 | E2E + integration | After sign-out: zero channels in the registry, socket closed, zero events delivered post-teardown (epoch test). After route exit: the exited route's channels are removed immediately |

### 4.3 Reconnection and ordering

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T7 | **Reconnection performs an authoritative refetch** | 9.4 §6.2 | Integration + E2E | Disconnect → reconnect: the machine enters `syncing`, all view-required scopes are refetched (server sees the fetches), `live` is reached only after refetch success; events missed during the gap are reflected in the refetched state — never in replay |
| T8 | **Duplicate and out-of-order events do not corrupt state** | 9.5 §3–§4 | Integration | Deliver [v3, v1, v3, v2, v4] scripted: final state equals v4 exactly; duplicates applied once; out-of-order buffered then flushed in version order; watermarks end at 4; seen-set dedup verified |
| T9 | **Older events cannot overwrite newer records** | 9.5 §4, §6.4 | Integration | With watermark at v5, deliver v4 and v3: dropped; state remains v5; cache writes with lower versions are refused (write-newer-only on every path, including refetch races) |

### 4.4 Offline UI

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T10 | **Offline screens display a visible stale timestamp** | 9.7 §4.2 | E2E | In every offline/stale state, the screen shows the last successful server synchronization time ("Last synced 14:32"/"As of …"), server-confirmed, distinct from local receipt times; asserted per portal |
| T11 | **Offline actions are never shown as server-confirmed** | 9.9 §8, 9.17 §3 | E2E | Queue a booking request offline: no confirmed styling, no success copy, no client-minted reference at any point; the item shows "Waiting to send"; confirmation appears only after the fake server commits and the response/replay is processed |

### 4.5 Offline writes

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T12 | **Non-idempotent writes are disabled offline** | 9.9 §4 (cond. 1), §3.2 | Integration | For every action whose endpoint lacks idempotency support (registry test), offline enqueue is refused — the mutation gateway blocks with the policy reason; no outbox item is created |
| T13 | **Queued writes contain valid operation and idempotency IDs** | 9.10 §2 | Integration | Every created item passes the §2 schema validation (13 fields, UUID formats, unique op_id, stable key, scope-bound user_id); a crafted item missing/with invalid IDs is refused at write |
| T14 | **Duplicate retries create only one server-side result** | 9.5 §5.3, 9.10 §5, 9.15 §5 | Integration + contract | Same key submitted 5× (retry loop, crash recovery, two tabs): the fake server records one effect; responses identical; business-intent guard (9.15 §5.3) collapses two-key-same-intent to one effect with `duplicate_intent` for the loser |

### 4.6 Retry and isolation

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T15 | **Permanent failures are not retried endlessly** | 9.10 §5.2, 9.4 §8 | Integration | For each permanent class (401, 403, 1008, validation 422, business 409/422): exactly zero automatic retries after classification; item enters `failed`/`conflict`; manual retry requires the §6 pre-flight; transient classes retry per §5.1 with the circuit breaker honored (timer assertion) |
| T16 | **Queued operations cannot cross users or tenants** | 9.10 §6.4, 9.14 §6 | Integration | Crafted outbox rows with foreign `user_id`/tenant (restored backup scenario): the claim gate refuses every send attempt; items are purged; a security event is logged; user B's flush never touches user A's items even after a deliberately failed purge |

### 4.7 Conflict and cleanup

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T17 | **Conflicted writes do not silently overwrite server data** | 9.11 §3, §6.4 | Integration | Conditional write with `expected_version` older than current: server rejects (409 `version_conflict`) — no partial write; the UI demotes to "Needs review" immediately; no confirmed styling survives; resolution refetches before applying (9.11 §7) |
| T18 | **Sensitive data is removed after logout or permission revocation** | 9.14 §3/§7, 9.8 §7 | E2E + integration | Populate state + caches + outbox + SW namespaces; sign out / revoke a scope; enumerate every store (IndexedDB, CacheStorage namespaces, localStorage, memory, outbox): zero entries for the scope/user; sign-in as B shows zero A artifacts at any render frame |

### 4.8 Service worker

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T19 | **SW does not cache mutation, payment, authentication, RPC, or administrative endpoints** | 9.12 §5 | E2E | Interception test per endpoint class: requests pass through untouched; no CacheStorage entry is created for any of them; non-GET never cached; `Set-Cookie` responses never cached |
| T20 | **Old SW caches are removed safely** | 9.12 §8, §11 | E2E | Install v2 over v1: activation deletes all v1 cache names in one pass; a failed install/activation leaves v1 serving intact; no mixed-version serving (asserted by cache-name enumeration) |

### 4.9 Push, multi-tab, financial

| ID | Requirement | Spec | Layer | Decisive assertion |
|---|---|---|---|---|
| T21 | **Push notifications do not expose sensitive data** | 9.16 §3.2 | Contract + integration | Payload builder test: injecting denylisted values (card number, government ID, token, signed URL, private note) into any notification's source data never reaches the payload (abort + security event); SW validation drops a planted malicious payload; log sink confirms no content leakage |
| T22 | **Multi-tab processing does not duplicate writes** | 9.15 §4–§5 | E2E (2+ tabs) | Two tabs with the same queued op: one claim wins (CAS), one flush; server records one effect; leader death → successor re-queues and replays the same key → still one effect; double-tap across tabs with distinct keys → business-intent guard → one effect |
| T23 | **Financial and high-risk state always matches the authoritative server** | 9.5 §5.1, 9.13 §7–§8 | E2E + contract | Across a scripted sequence (realtime events, refetch races, offline fallback, reconnect), every rendered balance/commission/payout/payment/entitlement value equals the fake server's authoritative record at every assertion point; no client-side arithmetic path exists (static scan); Tier D data never renders offline |

## 5. Scenario matrix

The following environments are composed into every applicable test. Each scenario is a deterministic profile in the harness, applied for the duration it names.

| Scenario | Profile | Applicable tests (non-exhaustive) |
|---|---|---|
| **Slow networks** | Latency 300–1 500 ms, throughput 50–200 KB/s, jittered | T7, T10, T11, T23; 9.4 §4 backoff timing assertions |
| **Temporary disconnections** | Network drops of 5 s / 2 min / 30 min at scripted points | T7, T10, T11, T15, T23 |
| **Expired sessions** | Token expires mid-flight (during flush, during subscribe, during retry); refresh fails once then succeeds; refresh fails permanently | T6, T15, T16, T22 |
| **Permission revocation** | Role downgrade / salon removal / tenant removal / record-level RLS denial mid-connection and while hidden | T1–T4, T16, T18 |
| **Duplicated events** | Every event delivered 2–3×; duplicate pushes; duplicate realtime + push convergence | T8, T9, T14, T21 |
| **Out-of-order events** | Scripted permutations of [v1…v5], including gaps the buffer cannot fill and gaps it can | T8, T9, T17 |
| **Multiple browser tabs** | 2–5 tabs: same account, different accounts (separate contexts), leader death, simultaneous sign-out, bfcache restore | T5, T6, T16, T18, T22 |
| **Stale caches** | Caches pre-seeded at various ages (within TTL, past TTL, aged window, hard-expired, corrupt, wrong-scope) | T10, T11, T18, T23 |
| **Failed service-worker updates** | New SW script fetch fails; precache fails; activation cleanup throws; registry invalid | T19, T20 |
| **Interrupted synchronization** | Crash at every outbox state (`pending`, `syncing`, mid-response), mid-purge, mid-resync, mid-batch | T7, T13, T14, T15, T18, T22 |

Rule: a test that is sensitive to a scenario (e.g., T7 under disconnections) runs in that scenario automatically; the harness composes scenario × test matrix and the CI gating (§7) defines which combinations run per gate.

## 6. Deterministic fault injection

1. **Scripted transport**: the fake Realtime server accepts an event *script* — ordered steps of `deliver(version, {delay, duplicate: n, drop, reorder_before: [...]})` — so T8/T9/T17 execute the exact same permutation every run.
2. **Crash points**: outbox/processor/purge functions expose injectable failure points (`failNext("idb.commit")`, `failNext("flush.response")`); the runner asserts the recovery path (re-queue, same key, resume) and that no state was corrupted.
3. **Clock control**: the fake clock freezes/advances deterministically; skew scenarios inject ± 24 h (9.5 §4.4) and verify ordering and TTL behavior per 9.7 §12.
4. **Auth scripting**: sessions expire/refresh/revoke on scripted steps, so pre-flight paths (9.10 §6) are exercised at every decision point.
5. **SW lifecycle scripting**: install/activate/update outcomes are scripted per 9.12 §8/§11 (partial precache, cleanup throw, script mismatch).
6. **Assertion at every step**: each scenario step ends with a state assertion (machine state, watermark, rendered UI, store contents, server effect count) — a test may not "eventually pass"; it must pass at every intermediate assertion point (e.g., T11 asserts the pending state *before* the confirmation, not just the end state).

## 7. CI pipeline and gating

| Gate | Trigger | Suites | Passing requirements |
|---|---|---|---|
| **PR** | Every pull request | Unit; integration (core); contract (authorization isolation T1–T4); static scans; log-sink denylist over all suites; core E2E (T5–T7, T10, T11, T18–T20) | 100% pass; zero flake tolerance (a flake quarantines the PR and files a harness bug); coverage thresholds per layer (unit ≥ 90% branches on 9.5 §4.1/9.10 §5/9.19 §4 logic) |
| **Nightly** | Daily | Full E2E scenario matrix (all 23 tests × applicable scenarios); load/perf budgets (9.18 §10 thresholds); full fault-injection suite; push contract tests | 100% pass; performance budgets within §10 thresholds; no new alerts |
| **Pre-release** | Release candidate | Everything in nightly + cross-browser matrix (Chromium, Firefox, WebKit) + quota/device-emulation profiles + audit-trail regression (Section 8 immutability + 9.19 §3.2 additions) | All of the above + audit immutability proofs pass |
| **On-demand** | Debugging | Any single test with verbose harness traces and the log-sink report | — |

Rules:

1. **A failing required test blocks release**; there is no waiver path except the change control of §9 with a documented, time-boxed exception.
2. Flaky tests are quarantined immediately and the harness/product bug fixed within the same sprint — never shipped around.
3. Coverage is measured against the **traceability inventory** (§8), not line coverage alone: 100% of checklist items mapped, 100% of mapped tests passing.
4. The CI matrix runs against the deterministic harness by default; a nightly *real-network* smoke suite (limited, non-authoritative) runs against staging to catch harness-only blind spots — its results are advisory, never the gate.

## 8. Traceability

1. Every acceptance-checklist item in 9.1–9.19 has a `spec → test` mapping recorded in a machine-readable inventory (`tests/section9-traceability.json`), e.g., `9.4 §13 "no false Live" → T7`, `9.7 §13 negative guarantees → T10/T11/T23`, `9.10 §13 cross-account → T16`, `9.12 §13 no-fabrication → T19/T21`, `9.14 §13 boundary steps → T6/T18`.
2. Every test in §4 cites its spec rule in its definition; the CI step fails if a test exists without a spec reference or a checklist item exists without a test (bidirectional completeness).
3. The traceability report is generated per gate and published with the release notes; gaps block pre-release.

## 9. Required testing acceptance checklist for 9.20

- [ ] All 23 tests (T1–T23) exist, are automated, and pass in CI at the gates defined in §7.
- [ ] The §5 scenario matrix is implemented as deterministic profiles; every applicable test × scenario combination runs in nightly.
- [ ] The harness provides fake transport, fake clock, fake auth, fake IndexedDB/CacheStorage, scripted scenario runner, contract runner, and the log sink — each with a self-test proving it works (a harness bug is a test-suite failure).
- [ ] Fault injection is scripted and deterministic: reordering/duplication/drop sequences, crash points at every outbox/purge/resync step, ± 24 h clock skew, SW lifecycle failures — each with intermediate assertions, not just end-state assertions.
- [ ] The authorization isolation suite (T1–T4) runs with minted JWTs (owner, staff, customer, reviewer, other-tenant, anonymous) per 9.1 §4.2 and includes both positive and negative cases.
- [ ] The log sink runs over every suite and asserts the 9.19 §4 denylist; a single violation fails the run.
- [ ] Traceability inventory is complete and bidirectional (spec↔test); the report is generated per gate; gaps block pre-release.
- [ ] Flake policy enforced: zero flake tolerance at PR; quarantined flakes produce a harness/product bug ticket in the same sprint.
- [ ] The real-network staging smoke suite runs nightly with advisory results only.
- [ ] Load/perf budgets (9.18 §10) are asserted in nightly; regressions fail the nightly gate.

## 10. Change control for 9.20

Any modification to the required test catalogue, scenario matrix, harness, CI gating, or traceability requirements requires:
- Review of the affected specification change (tests must change with the rule they verify — a spec change without its test change is incomplete)
- Harness/self-test updates
- Traceability inventory update
- Update to this specification before release.

---

**Sub-point:** 9.21 — Mandatory Release Gate  
**Status:** Specification baseline  
**Applies to:** Main Website, Customer PWA, Owner PWA, and Growth Partner PWA

## 1. Purpose and governing rule

Realtime and offline features must not be released until the fifteen conditions of this gate are met. The gate is the **enforcement point of the entire Section 9**: it converts the specification into a binary release decision with evidence, and it states the one principle that all conditions reduce to:

> **Default rule:** Realtime is a delivery mechanism, not an authorization mechanism or permanent source of truth. Offline data is a temporary last-known view, not confirmed current state. No business-critical action is successful until the authenticated server has validated, committed, and confirmed it.

Governing rules:

1. **The fifteen conditions (§3) are mandatory, conjunctive, and evidence-backed.** A release touching any realtime or offline capability ships only when every condition is `pass` with its evidence attached (§4). A single `fail` or missing evidence blocks the release.
2. **The default rule is the acceptance criterion for every condition.** Each condition maps to one of the rule's three clauses (§5): delivery-not-authorization, offline-is-not-current, server-validates-commits-confirms. A release that satisfies the letter of a condition while violating the rule fails the gate.
3. **Blocking classes are explicit (§6):** security, isolation, and financial-correctness conditions admit no exception; non-security conditions may be excepted only through the documented, time-boxed change-control path — never silently.
4. **The gate is automated where possible and signed where not.** CI generates the gate report from tests, scans, and traceability (9.20 §7–§8); human sign-off covers only what automation cannot (code review, manual verification records) and is recorded with the release artifact (§2).
5. **The gate extends past release (§7):** post-release monitoring must confirm the released behavior within defined thresholds for a verification window, and rollback criteria are pre-defined.

## 2. Applicability and gate mechanics

### 2.1 What triggers the gate

| Trigger | Example |
|---|---|
| Any change to realtime subscription, connection, or event-handling code | Channel registry, ingest pipeline, connection manager |
| Any change to offline caching, outbox, queue, or sync code | Cache manager, outbox processor, SW registry |
| Any change to the 9.9/9.11 policy or conflict registries | A new action policy, a new mergeable field |
| Any change to Section 9 test harness, scenarios, or traceability | 9.20 suites |
| Any server change affecting RLS, publication, audit, or push sending | Realtime publication, `audit_events`, token registry |
| Any release that ships one of the four portals | Always — the gate is a standing release requirement |

### 2.2 Gate artifact

Every qualifying release carries a machine-generated gate report (CI) reviewed and signed by engineering, security, and QA:

```json
{
  "release": "vX.Y.Z",
  "gate_version": "9.21-1",
  "trigger": "realtime-offline",
  "conditions": [
    { "id": "G1", "status": "pass",
      "evidence": { "tests": ["T1","T2","T3","T4"], "scans": ["rls-scan"],
                    "review": "PR#1234", "manual": "cross-tenant manual check recorded" } }
  ],
  "exceptions": [],
  "signoff": { "engineering": "…", "security": "…", "qa": "…" },
  "post_release": { "window_days": 7, "thresholds": "9.19 §2 + 9.18 §10" }
}
```

### 2.3 Rules

1. The gate report is generated per release candidate at the pre-release CI gate (9.20 §7) and re-verified on the final artifact; a changed artifact re-runs the gate.
2. A release without a gate report is **not a release** — the pipeline refuses to promote.
3. Sign-off is recorded and retained with the release notes; exceptions are visible in the report, never buried.

## 3. The fifteen mandatory conditions

| ID | Condition | Spec authority | Required tests (9.20) | Evidence beyond tests |
|---|---|---|---|---|
| **G1** | **Every Realtime subscription is narrowly scoped and protected by RLS** | 9.1 §2/§4.2, 9.2 §7 | T1–T4 | RLS contract scan; channel-scope review of every registry entry; negative tests in the traceability report |
| **G2** | **Subscription cleanup works on route teardown, sign-out, account switching, and permission revocation** | 9.3 §3, 9.14 §3/§7 | T5, T6, T18 | Teardown-leak sweep in the gate run (9.4 §10.5 assertion) |
| **G3** | **Reconnection includes authenticated server reconciliation** | 9.4 §6–§7 | T7 | Sync-duration and auth-refresh evidence in the gate run's 9.19 metrics |
| **G4** | **Duplicate and out-of-order events are handled safely** | 9.5 §3–§4 | T8, T9, T14 | Ingest decision-table review; watermark tests in the run |
| **G5** | **Every offline-capable action has a documented policy** | 9.9 §2–§3 | T12, T13 | Registry completeness scan: every mutation function has an entry (9.9 §3.2) |
| **G6** | **Only reviewed, idempotent operations can enter the typed outbox** | 9.9 §4, 9.10 | T13, T14 | Per-action qualification evidence (the §4 eight conditions) attached in review |
| **G7** | **High-risk and non-idempotent mutations remain online-only** | 9.9 §9, 9.13 §10 | T12, T19, T23 | Registry audit: the 9.9 §9.1 denylist has no queued entry |
| **G8** | **Pending operations are never shown as confirmed** | 9.17 §3, 9.9 §8 | T11 | Copy-vocabulary static scan (9.17 §3.2); UI state-distinction review |
| **G9** | **Conflict-resolution behavior is defined and tested** | 9.11 §2/§5/§7 | T17 | Conflict-policy completeness per registry entry (9.11 §2.1) |
| **G10** | **Private caches are user-scoped, tenant-scoped, short-lived, and cleared correctly** | 9.8 §6–§7, 9.7 §5 | T10, T18 | Purge verification logs; scope-field validation scan (9.7 §6) |
| **G11** | **Service workers use explicit allowlists and never fabricate business data** | 9.12 §3–§4 | T19, T20, T21 | SW registry validation (9.12 §4.3); fabrication-denylist code scan |
| **G12** | **Authentication, financial, payment, RPC, mutation, and administrative routes remain network-only** | 9.12 §5, 9.13 §10 | T19 | Endpoint-class route audit (SW + CDN config review) |
| **G13** | **Multi-tab and multi-device cases do not create duplicate side effects** | 9.15 §4–§5 | T22 | Idempotency contract tests for every queued-class endpoint (9.5 §5.3) |
| **G14** | **Offline, stale, pending, failed, and confirmed states are clearly visible** | 9.17 §2, 9.7 §4 | T10, T11 | Per-portal state-presentation review (a11y + copy) |
| **G15** | **Security, isolation, synchronization, and recovery tests pass** | 9.20 §4 | T1–T23 (full matrix) | Complete gate CI run: unit, integration, E2E, contract, fault-injection, load — per 9.20 §7 |

Rules:

1. Conditions are evaluated on the **release candidate**, not on `main`; a condition satisfied in a previous release does not carry over without re-verification on the changed artifact.
2. Each condition's evidence is explicit: tests IDs, scan names, review references, and manual records — "verified by code review" alone is insufficient where a test exists.
3. The fifteen conditions map bidirectionally to the traceability inventory (9.20 §8): the gate report lists, per condition, the checklist items from 9.1–9.19 it covers, proving the gate is the aggregate of the whole specification.

## 4. Evidence requirements

| Evidence type | Applies to | Requirement |
|---|---|---|
| **Automated tests** | All conditions | The 9.20 §4 catalogue passing in the pre-release gate run (full matrix + scenarios); test IDs cited per condition (§3) |
| **Static scans** | G1, G5, G8, G11, G12, G14 | RLS scan, registry-completeness scan, copy-vocabulary scan, SW fabrication scan, endpoint-class route audit, denylist scans (9.19 §4) — all green in the gate run |
| **Code review** | All conditions | Reviewed PRs cited per condition; security review sign-off for G1, G7, G10–G12; the review confirms the change matches the cited spec sections |
| **Manual verification** | Where automation cannot cover | Recorded with steps + outcome (e.g., cross-tenant manual check, shared-device scenario on a real device); an unverifiable condition is a blocking gap, not a manual-test substitute |
| **Metrics baseline** | G3, G13, G15 | Pre-release run's 9.19 metrics within 9.18 §10 thresholds (sync latency, reconnect rate, conflict rate, outbox metrics) — the gate run's numbers become the post-release comparison baseline (§7) |
| **Audit-trail proofs** | G7, G9, G15 | Section 8 immutability regression + 9.19 §3.2 additions (pre-release suite, 9.20 §7) |

## 5. The default rule as acceptance criteria

Every condition is judged against the default rule's three clauses. A release fails the gate if any condition's *implementation* contradicts the rule, even when the condition's letter is met:

| Clause of the default rule | Conditions it governs | Gate question |
|---|---|---|
| **Realtime is a delivery mechanism, not an authorization mechanism or permanent source of truth** | G1, G2, G3, G4, G13 | Is every event validated server-side (RLS), treated as advisory, and reconciled against authoritative refetch — with no path where an event grants access or becomes the only evidence of state? |
| **Offline data is a temporary last-known view, not confirmed current state** | G5, G6, G7, G8, G10, G14 | Does every offline artifact carry its qualifiers, expire, and never present as confirmed — with no path where a cached value decides a business outcome? |
| **No business-critical action is successful until the authenticated server has validated, committed, and confirmed it** | G7, G8, G9, G11, G12, G15 | Is every mutation server-validated (auth + RLS + business rules), committed transactionally (audit where required), and confirmed via the 9.6 §3.5 path before the UI may claim success — with no client-side success simulation anywhere? |

The gate report includes a per-condition "default-rule check" line answering the governing question with the evidence. This is the anti-formalist guard: it prevents a release that passes checklists while violating the specification's core principle.

## 6. Blocking classes and the exception path

### 6.1 Blocking classes

| Class | Conditions | Exception policy |
|---|---|---|
| **A — Security, isolation, financial correctness** | G1, G4 (ordering corruption), G7, G9 (silent overwrite), G10 (cross-account), G12, G13 (duplicate effects), G15 | **No exception, ever.** A release failing any of these is blocked indefinitely until fixed |
| **B — Correctness and UX** | G2, G3, G5, G6, G8, G11, G14 | Blocking; a **documented, time-boxed exception** is possible only through §10 change control, with a named owner, a deadline, and a compensating control (e.g., feature flag) that keeps the risk user-invisible |

### 6.2 Exception mechanics (Class B only)

1. The exception request cites: the condition, the gap, the compensating control (feature flag / disabled path), the owner, and the deadline (≤ 30 days).
2. The exception is recorded in the gate report (`exceptions[]`), signed by engineering + QA, and visible in release notes.
3. At the deadline the condition must pass; a missed deadline is a release-blocking defect with the same severity as the original condition.
4. **No exception may weaken a rule of the default rule itself**: an exception can defer an implementation detail, never a clause (e.g., a deferred test is acceptable with a flag; a "pending operations may show as confirmed until next release" is not).

## 7. Post-release verification window

1. **Window**: 7 days after release (or 14 for releases touching G1/G7/G10/G12), with thresholds from the pre-release baseline (§4) and 9.18 §10.
2. **Monitored** (9.19 §2 + 9.4 §11.7): reconnect rate, sync latency p95, auth-rejection rate, conflict rate, outbox metrics, event-volume anomalies, SW-health events, audit-trail integrity (no unexpected mutations), and the §5 default-rule proxies (no false-Live, no unauthorized delivery).
3. **Outcomes**: thresholds met → gate closed; threshold breached → the pre-defined rollback/incident path runs (rollback to the previous artifact, or feature-flag disable of the affected capability per the exception mechanism), and the finding re-enters the release pipeline as a blocking defect.
4. **Closure**: the post-release report is appended to the gate artifact and retained with the release notes.

## 8. Interaction with the rest of Section 9

| Section | Interaction |
|---|---|
| 9.1–9.2 | G1/G10 source the RLS and cache-scope conditions |
| 9.3–9.4 | G2/G3 source the lifecycle and reconciliation conditions |
| 9.5–9.6 | G4/G8 source ordering-safety and no-false-success conditions |
| 9.7–9.8 | G10/G14 source cache-scoping, retention, and state-visibility conditions |
| 9.9–9.10 | G5–G7/G13 source policy, outbox, and idempotency conditions |
| 9.11 | G9 sources the conflict-resolution condition |
| 9.12–9.13 | G11/G12 source the SW and network-only conditions |
| 9.14–9.16 | G2/G10/G13 source identity-boundary, multi-instance, and push conditions |
| 9.17 | G8/G14 source the state-vocabulary conditions |
| 9.18–9.19 | Baselines, thresholds, and evidence for §4/§7 |
| 9.20 | The gate's test evidence and traceability machinery |

The gate is the terminus: every section's acceptance checklist terminates in at least one condition here, and the traceability inventory (9.20 §8) proves the mapping.

## 9. Acceptance checklist for the gate itself

- [ ] A qualifying change (any §2.1 trigger) cannot be released without a gate report; the pipeline refuses promotion without it (verified by a CI negative test).
- [ ] All fifteen conditions appear in the report with status, cited tests, scans, and reviews; a missing evidence field renders the condition `fail`.
- [ ] The pre-release CI run executes the full 9.20 §7 pre-release gate (unit, integration, E2E, contract, fault-injection, load, static scans, audit-trail proofs) and the report is generated from that run.
- [ ] The §5 default-rule check is present per condition and answered with evidence — a release that passes letter conditions but violates a clause cannot ship (review test: a planted rule-violating change fails the gate review).
- [ ] Blocking classes enforced: Class A failure blocks with no exception path; Class B exception requests are machine-validated (fields present, deadline ≤ 30 days, compensating control named) and visible in the report.
- [ ] Post-release window configured with thresholds; a breach triggers the defined rollback/flag path and re-enters the pipeline as blocking.
- [ ] The traceability inventory covers the gate: every 9.1–9.19 checklist item maps to a condition, and every condition maps to its checklist items (bidirectional, CI-verified).
- [ ] Gate versioning: `gate_version` bumps when this specification changes; a release may cite only the current gate version.

## 10. Change control for 9.21

Any modification to the fifteen conditions, blocking classes, exception mechanics, evidence requirements, default-rule check, or post-release window requires:
- Review against the default rule (no change may weaken any of its three clauses)
- Traceability inventory update (condition ↔ checklist mappings)
- Gate-mechanic tests update (negative CI test, exception validation)
- Security review for any Class A condition change — Class A conditions are amended only to **strengthen**, never to relax
- Update to this specification before release.

