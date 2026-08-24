# Phase 17 — Location Test Matrix

**Date:** 2026-08-24  
**Branch:** `arena/01a03415-nexora-main-website`  
**Scope:** Main Website, Job Portal, Template App, Beauty Industry catalog, and Customer/Owner/Growth Partner integration artifacts

## Result

**Location matrix: PASS.** All eleven requested scenarios are represented and verified across the location-capable surfaces in this repository.

The required security property is proven at runtime in the PGlite database harness:

```text
User A writes a private location.
User B SELECTs user_private_locations.
User B receives zero rows for User A.
```

The production migration enforces the same boundary with RLS and `auth.uid()`.

## Matrix

| # | Scenario | Main Website | Job Portal | Template App | Beauty Industry | External PWA artifacts |
|---:|---|---|---|---|---|---|
| 1 | Login | Session-bound `useLocation` | `useLocationSync` reads authenticated user | Protected owner workspace | No auth/location feature | Auth patches mount shared provider |
| 2 | Permission prompt | Shared `PermissionManager` → `prompting` | Same shared package | `getCurrentPosition` only from explicit user action | Not applicable | Target-app location flow represented by checked-in patches |
| 3 | Permission allowed | `granted` → live GPS fix | Same | Browser location resolves valid coordinates | Not applicable | Patch artifacts preserve location flow |
| 4 | Permission denied | `PERMISSION_DENIED`, no fabricated fix | Same | Clear user-facing error | Not applicable | Target-app verification required after patch application |
| 5 | Permission unavailable | `POSITION_UNAVAILABLE` / unsupported / offline states | Same | Unsupported/error path | Not applicable | Target-app verification required after patch application |
| 6 | Valid coordinate | Range + accuracy validation | Same | Range validation | Not applicable | Shared migration validates persisted coordinates |
| 7 | Invalid coordinate | Rejects out-of-range, stale, null-island and weak readings | Same | Rejects invalid and `0,0` null-island coordinates | Not applicable | Shared database constraints apply |
| 8 | Location persisted | `save_my_private_location` via `auth.uid()` | Same | Authenticated owner business location via `business_locations` | No persistence | Shared SQL boundary applies |
| 9 | Refresh | Loads only the current user's saved fix | Same | Reloads salon location from authenticated service | Not applicable | Shared provider/client persistence contract |
| 10 | Logout | `unbind` + `clearIdentityLocation` | `auto: Boolean(userId)` stops sync on logout | Owner/business location remains server-owned; private user table is not used | Not applicable | Provider logout clears auth state |
| 11 | Second user cannot read first user's location | RLS-backed private table | RLS-backed private table | Private-user RLS is shared centrally; business coordinates are a separate approved dataset | Not applicable | Shared SQL applies to all Nexora identities |

## Security verification

`supabase/migrations/20260812_phase7_shared_location_security.sql` provides:

- `user_private_locations.user_id` as the `auth.users(id)` owner key.
- RLS enabled and forced on the private table.
- No public or anonymous access.
- Separate own-row policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`.
- `save_my_private_location(...)` derives the owner internally from `auth.uid()` and accepts no target user ID.
- `clear_my_private_location()` deletes only the current user's row.
- Coordinate and accuracy constraints reject invalid values.

The PGlite runtime test in `tests/phase6-location-db-runtime.test.mjs` executed the migration and confirmed:

- Alice's private fix can be written through the canonical save path.
- Bob's `SELECT` returns zero Alice rows.
- Bob cannot insert a row targeting Alice.
- Own-row operations work.
- Anonymous access is denied.
- Null-island coordinates are rejected.
- Clearing the canonical row removes the compatibility mirror.

## Browser/location verification

The existing browser harness in `tests/location-runtime.test.ts` passed all seven cases:

1. Allowed GPS produces a fresh live coordinate.
2. Denied permission retains only an explicitly saved real fix.
3. Denied permission with no saved row exposes no coordinates.
4. Unavailable geolocation never fabricates coordinates.
5. Aged live readings are labelled stale.
6. Production diagnostics do not retain coordinate payloads.
7. Nearby distance excludes pending and legacy business coordinates.

The static location suite passed all 13 cases, covering watch-only tracking, permission handling, validation, persistence, Haversine distance, approved business coordinates, and no private-coordinate leakage.

## Changes applied

- Added `tests/phase17-location-flow-matrix.test.mjs`.
- Added `npm run test:phase17`.
- Added this report.
- Tightened Template App coordinate normalization to reject the `0,0` null-island/fabricated fallback sentinel.
- Changed Template App browser location requests to `maximumAge: 0` so refreshes request a fresh reading instead of reusing cached coordinates.

## Verification commands

- `npm run test:phase17` — **11/11 passed**
- `npm run test:location` — **20/20 passed** (13 static + 7 browser harness)
- `node --test tests/phase7-location-security.test.mjs tests/phase5-job-portal-location-sync-contract.test.mjs tests/phase6-location-db-runtime.test.mjs tests/location-system.test.mjs` — **38/38 passed**
- `npm run test:security` — **57/57 passed**, including the PGlite RLS isolation checks

## Scope limitation

Customer, Owner, and Growth Partner applications are external repositories in this checkout. Their location implementations are represented by checked-in integration patches, not executable source trees, so their live browser permission prompts must be rerun in each target repository after patch application. The shared production SQL privacy boundary is executable and was verified here.
