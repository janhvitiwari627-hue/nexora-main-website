# Phase 18 — Supabase RLS Verification

**Date:** 2026-08-24  
**Branch:** `arena/01a03415-nexora-main-website`  
**Tables:** `public.profiles`, `public.user_private_locations`, `public.user_locations`

## Result

**RLS verification: PASS.** The final migration set enables RLS on all three identity/private-location tables, provides authenticated own-row policies, contains no unconditional private-row policy, and protects authenticated updates with both `USING` and `WITH CHECK`.

## SQL verifier

A read-only verifier is available at:

```text
scripts/verify-phase18-rls.sql
```

Run it in the shared Supabase SQL Editor or with `psql` after applying the migrations:

```bash
psql "$SUPABASE_DB_URL" -f scripts/verify-phase18-rls.sql
```

The script:

1. Checks `pg_class.relrowsecurity` for all three tables.
2. Checks that authenticated `SELECT` policies exist.
3. Checks authenticated CRUD policies for both location tables.
4. Rejects `USING (true)` / `WITH CHECK (true)` variants on the private identity tables.
5. Rejects any authenticated `UPDATE` policy missing either `USING` or `WITH CHECK`.
6. Prints a table-level summary and the exact policy expressions.
7. Rolls back its transaction and makes no persistent changes.

## Final policy inventory

### `public.profiles`

- `profiles_select_own` — authenticated `SELECT`, `auth.uid() = id`
- `profiles_select_admin` — authenticated `SELECT`, `private.is_admin()`
- `profiles_insert_own` — authenticated `INSERT`, `WITH CHECK (auth.uid() = id)`
- `profiles_update_own` — authenticated `UPDATE`, both `USING` and `WITH CHECK`
- `profiles_update_admin` — authenticated `UPDATE`, both `USING` and `WITH CHECK`
- Authenticated `DELETE` is revoked; identity removal is owned by `auth.users` cascade/service operations.

RLS is enabled and forced by `20260811_phase1_centralized_auth_profiles_rls.sql`.

### `public.user_private_locations`

- `user_private_location_read_own` — authenticated `SELECT`, `user_id = auth.uid()`
- `user_private_location_insert_own` — authenticated `INSERT`, `WITH CHECK (user_id = auth.uid())`
- `user_private_location_update_own` — authenticated `UPDATE`, both `USING` and `WITH CHECK`
- `user_private_location_delete_own` — authenticated `DELETE`, `user_id = auth.uid()`

RLS is enabled by `20260812_phase7_shared_location_security.sql`. Public and anonymous table privileges are revoked.

### `public.user_locations`

- `user_locations_select_own` — authenticated `SELECT`, `auth.uid() = user_id`
- `user_locations_insert_own` — authenticated `INSERT`, `WITH CHECK (auth.uid() = user_id)`
- `user_locations_update_own` — authenticated `UPDATE`, both `USING` and `WITH CHECK`
- `user_locations_delete_own` — authenticated `DELETE`, `auth.uid() = user_id`

RLS is enabled by `20260824_phase6_user_locations_compat.sql`. This is a one-way compatibility mirror of `user_private_locations`, not a second authority.

## Unconditional-policy check

No `USING (true)` or `WITH CHECK (true)` policy exists on any of:

```text
public.profiles
public.user_private_locations
public.user_locations
```

The repository does contain a `USING (true)` policy for an unrelated public business-rules table. The Phase 18 verifier scopes the rejection specifically to the three requested private identity/location tables, so that unrelated public policy is not incorrectly treated as a private-row violation.

## Verification commands and results

- `npm run test:phase18` — **7/7 passed**
- `node --test tests/phase18-rls-verification.test.mjs` — **7/7 passed**
- `npm run test:security` — **57/57 passed**
- Existing PGlite location RLS runtime checks — **passed**, including cross-user SELECT isolation
- SQL verifier execution against a PostgreSQL-compatible PGlite fixture — **passed**

## Important runtime security evidence

The existing database runtime suite executes the real location migrations and confirms that:

- User A can read only User A's private location.
- User B can read only User B's private location.
- User B cannot insert a row targeting User A.
- Anonymous callers cannot read or write private location rows.
- Own-row updates require the authenticated identity.

The verifier and repository tests run locally against migration/fixture data. A direct query against the deployed Supabase project still requires access to the production database or SQL Editor.
