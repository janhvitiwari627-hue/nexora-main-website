# Phase 7 — Shared Location and Security

## One location system

`packages/location` is the canonical implementation for all same-origin Nexora surfaces:

- Customer: `/app/customer`
- Owner: `/app/owner`
- Growth Partner: `/app/partner`
- Template: `/app/template` (Owner-gated)

The main shell binds the package once to the authenticated Supabase client and `auth.users.id`. Nested routes observe the same singleton instead of starting their own watcher. Reverse-proxied portal builds can consume the same package and recover the same private row from the shared project.

The package rejects clients pointed away from `qwaehqsmodekbgvnaavz`.

## Device location behavior

- Live coordinates come only from `navigator.geolocation.watchPosition()` with high accuracy, a 15-second timeout, and `maximumAge: 0`.
- Accepted readings are validated for coordinate range, accuracy, timestamp freshness and implausible jumps.
- A signed-in user's last accepted real GPS fix is saved centrally in `public.user_private_locations`.
- A loaded or aged reading is labelled **Saved device GPS — not live**. It is never presented as fresh GPS.
- Permission denied/unavailable uses that user's saved real GPS fix if one exists. Otherwise `fix` remains `null`; there is no area-centre, IP-derived or fabricated coordinate.
- Location acquisition still works if persistence is temporarily unavailable. Persistence failure is visible as `syncStatus: error` and does not manufacture a fallback.

## Private location RLS

Migration: `supabase/migrations/20260812_phase7_shared_location_security.sql`

`user_private_locations.user_id` is a foreign key and primary key to `auth.users.id`. Four RLS policies enforce `user_id = auth.uid()` for select, insert, update and delete. The save RPC does not accept a target user ID; it derives the caller from `auth.uid()`.

Roles do not participate in these policies. Consequently:

- an Owner cannot read another Owner's or Customer's private GPS;
- a Growth Partner cannot read Customer GPS;
- a Customer cannot read any other user's GPS;
- the Template route sees only the signed-in Owner's same private row.

## Business location separation and approval

`public.business_locations` is separate from private GPS. Owners submit coordinates through `submit_my_business_location`, which verifies `private.can_manage_salon_settings(salon_id)` and always sets the row to `pending`.

Only the backend-only `service_role` approval RPC can change a row to `approved`. The public RLS policy additionally requires a verified, active, non-deleted salon with a published website.

Broad browser grants on legacy `salons.latitude` / `salons.longitude` columns are removed. Marketplace and nearby code reads only `business_locations` rows with `approval_status = 'approved'`. Private user coordinates are used only as the local Haversine origin and are never sent to a nearby-search RPC.

## Authorization and credential hygiene

- Portal entry resolves `profiles.platform_role` and then runs the app-specific server-backed membership guard.
- Customer cannot enter Owner/Partner routes.
- Owner workspace IDs come only from `owner_salon_ids()` and Owner business-location submission rechecks salon ownership in PostgreSQL.
- Growth Partner membership is tied to `auth.uid()` and cannot promote itself to Owner/Admin.
- Template is mapped to `business_user`, not to a browser flag.
- Job Portal OAuth no longer stores a pending role in localStorage; callback authorization reads the server-owned `job_user_roles` row.
- Verification-build Supabase placeholders were removed. Builds require explicit shared-project environment variables.
- Historical hardcoded JWT text in vendored patch artifacts was scrubbed.
- Browser source reads no service-role key.

## Checks

```bash
npm run test:contracts
npm run test:location
npm run test:security
npm run typecheck
npm run lint
NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY='<anon-or-publishable-key>' npm run build
```

The repository includes contract tests, executable browser-geolocation harness cases, and a PGlite PostgreSQL RLS suite that applies the migration twice. The PGlite suite exercises Customer, two Owner, Partner, anonymous, and service-role contexts, but it does not replace deployment to the shared Supabase project.

Applying and exercising the migration against the live project requires authorized deployment credentials and should be followed by:

```sql
select * from public.verify_phase7_location_security();
```

Every returned `passed` value must be `true`. Then verify allow, deny, unavailable, saved, and stale states in a real secure-context browser so the operating system's permission UI and device provider are exercised in addition to the deterministic harness.
