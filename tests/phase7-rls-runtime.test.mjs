import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../supabase/migrations/20260812_phase7_shared_location_security.sql", import.meta.url),
  "utf8",
);

const CUSTOMER = "00000000-0000-0000-0000-000000000101";
const OWNER_A = "00000000-0000-0000-0000-000000000201";
const OWNER_B = "00000000-0000-0000-0000-000000000202";
const PARTNER = "00000000-0000-0000-0000-000000000301";
const ORG_A = "00000000-0000-0000-0000-000000000401";
const ORG_B = "00000000-0000-0000-0000-000000000402";
const SALON_A = "00000000-0000-0000-0000-000000000501";
const SALON_B = "00000000-0000-0000-0000-000000000502";

async function setupDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema private;

    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant usage on schema private to authenticated, service_role;

    create table public.profiles(
      id uuid primary key references auth.users(id),
      platform_role text not null,
      is_active boolean not null default true
    );
    create table public.salons(
      id uuid primary key,
      organization_id uuid not null,
      slug text,
      name text,
      verified boolean not null default false,
      is_active boolean not null default true,
      deleted_at timestamptz,
      latitude double precision,
      longitude double precision,
      updated_at timestamptz
    );
    create table public.salon_public_websites(
      salon_id uuid references public.salons(id),
      is_published boolean not null default false
    );
    create table public.organization_members(
      organization_id uuid not null,
      user_id uuid not null,
      is_active boolean not null default true
    );

    create function private.can_manage_salon_settings(p_salon_id uuid)
    returns boolean language sql stable security definer set search_path = '' as $$
      select exists(
        select 1
        from public.salons s
        join public.organization_members m on m.organization_id = s.organization_id
        join public.profiles p on p.id = m.user_id
        where s.id = p_salon_id
          and m.user_id = auth.uid()
          and m.is_active
          and p.is_active
          and p.platform_role = 'business_user'
      )
    $$;
    grant execute on function private.can_manage_salon_settings(uuid) to authenticated, service_role;

    insert into auth.users(id) values
      ('${CUSTOMER}'), ('${OWNER_A}'), ('${OWNER_B}'), ('${PARTNER}');
    insert into public.profiles(id, platform_role) values
      ('${CUSTOMER}', 'customer'),
      ('${OWNER_A}', 'business_user'),
      ('${OWNER_B}', 'business_user'),
      ('${PARTNER}', 'growth_partner');
    insert into public.salons(id, organization_id, slug, name, verified, latitude, longitude) values
      ('${SALON_A}', '${ORG_A}', 'salon-a', 'Salon A', true, 1.23, 4.56),
      ('${SALON_B}', '${ORG_B}', 'salon-b', 'Salon B', true, 7.89, 1.23);
    insert into public.salon_public_websites(salon_id, is_published) values
      ('${SALON_A}', true), ('${SALON_B}', true);
    insert into public.organization_members(organization_id, user_id) values
      ('${ORG_A}', '${OWNER_A}'), ('${ORG_B}', '${OWNER_B}');
    grant select on public.salons, public.salon_public_websites to anon, authenticated;
  `);
  await db.exec(migration);
  // Deployment migrations are re-runnable during recovery/preview setup.
  await db.exec(migration);
  return db;
}

async function asRole(db, role, userId, operation) {
  await db.exec(`set role ${role}`);
  if (userId) await db.exec(`set "request.jwt.claim.sub" = '${userId}'`);
  else await db.exec(`reset "request.jwt.claim.sub"`);
  try {
    return await operation();
  } finally {
    await db.exec("reset role; reset \"request.jwt.claim.sub\"");
  }
}

test("Phase 7 migration enforces private GPS and approved business RLS at runtime", async () => {
  const db = await setupDatabase();
  try {
    const verification = await db.query("select * from public.verify_phase7_location_security()");
    assert.ok(verification.rows.every((row) => row.passed === true));

    await asRole(db, "authenticated", CUSTOMER, () =>
      db.query(
        "select public.save_my_private_location($1,$2,$3,p_captured_at => now())",
        [26.91, 75.81, 12],
      ),
    );
    await asRole(db, "authenticated", OWNER_A, () =>
      db.query(
        "select public.save_my_private_location($1,$2,$3,p_captured_at => now())",
        [26.92, 75.82, 10],
      ),
    );

    const customerRows = await asRole(db, "authenticated", CUSTOMER, () =>
      db.query("select user_id, latitude from public.user_private_locations"),
    );
    assert.deepEqual(customerRows.rows.map((row) => row.user_id), [CUSTOMER]);

    const ownerRows = await asRole(db, "authenticated", OWNER_A, () =>
      db.query("select user_id, latitude from public.user_private_locations"),
    );
    assert.deepEqual(ownerRows.rows.map((row) => row.user_id), [OWNER_A]);

    const partnerRows = await asRole(db, "authenticated", PARTNER, () =>
      db.query("select user_id from public.user_private_locations"),
    );
    assert.equal(partnerRows.rows.length, 0, "partner must not read customer/owner private GPS");

    await assert.rejects(
      () => asRole(db, "authenticated", OWNER_A, () =>
        db.query(
          "insert into public.user_private_locations(user_id,latitude,longitude,accuracy_m,captured_at) values ($1,1,1,5,now())",
          [OWNER_B],
        ),
      ),
      /row-level security|policy/i,
    );

    await asRole(db, "authenticated", OWNER_A, () =>
      db.query("select public.submit_my_business_location($1,$2,$3,$4)", [SALON_A, 26.93, 75.83, "Approved address later"]),
    );
    await asRole(db, "authenticated", OWNER_B, () =>
      db.query("select public.submit_my_business_location($1,$2,$3,$4)", [SALON_B, 26.84, 75.74, "Second salon"]),
    );

    await assert.rejects(
      () => asRole(db, "authenticated", OWNER_B, () =>
        db.query("select public.submit_my_business_location($1,$2,$3,$4)", [SALON_A, 20, 70, "forged"]),
      ),
      /Shop Owner permission required/i,
    );
    await assert.rejects(
      () => asRole(db, "authenticated", PARTNER, () =>
        db.query("select public.submit_my_business_location($1,$2,$3,$4)", [SALON_A, 20, 70, "forged"]),
      ),
      /Shop Owner permission required/i,
    );

    const ownerPending = await asRole(db, "authenticated", OWNER_A, () =>
      db.query("select salon_id, approval_status from public.business_locations"),
    );
    assert.deepEqual(ownerPending.rows, [{ salon_id: SALON_A, approval_status: "pending" }]);

    const publicBeforeApproval = await asRole(db, "anon", null, () =>
      db.query("select salon_id from public.business_locations"),
    );
    assert.equal(publicBeforeApproval.rows.length, 0);

    await asRole(db, "service_role", null, () =>
      db.query("select public.review_business_location($1,true,null)", [SALON_A]),
    );

    const publicApproved = await asRole(db, "anon", null, () =>
      db.query("select salon_id,latitude,longitude,approval_status from public.business_locations"),
    );
    assert.deepEqual(publicApproved.rows, [{
      salon_id: SALON_A,
      latitude: 26.93,
      longitude: 75.83,
      approval_status: "approved",
    }]);

    const partnerBusinessRows = await asRole(db, "authenticated", PARTNER, () =>
      db.query("select salon_id,approval_status from public.business_locations order by salon_id"),
    );
    assert.deepEqual(partnerBusinessRows.rows, [{ salon_id: SALON_A, approval_status: "approved" }]);

    await assert.rejects(
      () => asRole(db, "anon", null, () => db.query("select latitude,longitude from public.salons")),
      /permission denied/i,
    );
  } finally {
    await db.close();
  }
});
