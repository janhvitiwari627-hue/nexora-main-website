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

