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

