// PHASE 6 — LOCATION DATABASE CONTRACT (runtime verification).
//
// Executes the real migrations inside PGlite and proves, with live RLS:
//
//   * the canonical pipeline stays the authority:
//       save_my_private_location() → user_private_locations
//         → compatibility trigger → user_locations
//   * direct user_locations access is own-row only (auth.uid() = user_id)
//     for SELECT / INSERT / UPDATE / DELETE
//   * anon has no access of any kind
//   * no reverse path exists from the mirror into the canonical table.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const phase7 = await readFile(
  new URL("../supabase/migrations/20260812_phase7_shared_location_security.sql", import.meta.url),
  "utf8",
);
const phase6 = await readFile(
  new URL("../supabase/migrations/20260824_phase6_user_locations_compat.sql", import.meta.url),
  "utf8",
);

const ALICE = "00000000-0000-0000-0000-00000000a11c";
const BOB = "00000000-0000-0000-0000-00000000b0b0";

async function setupDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;

    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create schema private;
    grant usage on schema private to authenticated, service_role;

    create function private.can_manage_salon_settings(p_salon_id uuid)
    returns boolean language sql stable security definer set search_path = '' as $$
      select false
    $$;
    grant execute on function private.can_manage_salon_settings(uuid) to authenticated, service_role;

    -- Minimal dependencies the Phase 7 migration expects.
    create table public.profiles(
      id uuid primary key references auth.users(id),
      platform_role text not null,
      is_active boolean not null default true
    );
    create table public.salons(
      id uuid primary key,
      organization_id uuid not null,
      verified boolean not null default false,
      is_active boolean not null default true,
      deleted_at timestamptz
    );
    create table public.organization_members(
      organization_id uuid not null,
      user_id uuid not null,
      is_active boolean not null default true
    );
    create table public.salon_public_websites(
      id uuid,
      salon_id uuid references public.salons(id),
      slug text,
      template_key text,
      config jsonb not null default '{}'::jsonb,
      is_published boolean not null default false,
      published_at timestamptz
    );

    insert into auth.users(id) values ('${ALICE}'), ('${BOB}');
    insert into public.profiles(id, platform_role) values
      ('${ALICE}', 'customer'), ('${BOB}', 'customer');
  `);
  await db.exec(phase7);
  await db.exec(phase6);
  // Deployment migrations are re-runnable during recovery/preview setup.
  await db.exec(phase6);
  return db;
}

async function asRole(db, role, userId, operation) {
  await db.exec(`set role ${role}`);
  if (userId) await db.exec(`set "request.jwt.claim.sub" = '${userId}'`);
  else await db.exec(`reset "request.jwt.claim.sub"`);
  try {
    return await operation();
  } finally {
    await db.exec('reset role; reset "request.jwt.claim.sub"');
  }
}

test("Phase 6 user_locations contract holds at runtime", async () => {
  const db = await setupDatabase();
  try {
    // 0. Operator verification surface is green.
    const verification = await db.query("select * from public.verify_phase6_user_locations_contract()");
    assert.equal(verification.rows.length, 5);
    for (const row of verification.rows) {
      assert.equal(row.passed, true, `${row.check_name}: ${row.detail}`);
    }

    // 1. Canonical pipeline → compatibility mirror.
    await asRole(db, "authenticated", ALICE, () =>
      db.query(
        "select public.save_my_private_location($1, $2, $3)",
        [12.9716, 77.5946, 8],
      ),
    );
    const mirrored = await asRole(db, "authenticated", ALICE, () =>
      db.query("select user_id, latitude, longitude, accuracy_m from public.user_locations"),
    );
    assert.equal(mirrored.rows.length, 1, "the canonical save must sync into user_locations");
    assert.equal(mirrored.rows[0].user_id, ALICE);
    assert.equal(mirrored.rows[0].latitude, 12.9716);

    // 2. SELECT is own-row only: Bob sees nothing of Alice.
    const bobView = await asRole(db, "authenticated", BOB, () =>
      db.query("select * from public.user_locations"),
    );
    assert.equal(bobView.rows.length, 0, "a foreign user must not see another user's location");

    // 3. INSERT cannot target a foreign user_id.
    await assert.rejects(
      asRole(db, "authenticated", BOB, () =>
        db.query(
          "insert into public.user_locations(user_id, latitude, longitude, accuracy_m) values ($1, $2, $3, $4)",
          [ALICE, 1, 1, 5],
        ),
      ),
      /row-level security/i,
      "inserting a row for another user must violate RLS",
    );

    // 4. Own-row INSERT / UPDATE / DELETE work for the legacy direct path.
    await asRole(db, "authenticated", BOB, () =>
      db.query(
        "insert into public.user_locations(user_id, latitude, longitude, accuracy_m) values ($1, $2, $3, $4)",
        [BOB, 28.6139, 77.209, 10],
      ),
    );
    const bobUpdate = await asRole(db, "authenticated", BOB, () =>
      db.query("update public.user_locations set accuracy_m = 9 where user_id = $1", [BOB]),
    );
    assert.equal(bobUpdate.affectedRows ?? 1, 1);

    // 5. UPDATE/DELETE silently affect zero foreign rows.
    const bobUpdatesAlice = await asRole(db, "authenticated", BOB, () =>
      db.query("update public.user_locations set accuracy_m = 1 where user_id = $1", [ALICE]),
    );
    assert.equal(bobUpdatesAlice.affectedRows ?? 0, 0, "a foreign UPDATE must match zero rows");
    const bobDeletesAlice = await asRole(db, "authenticated", BOB, () =>
      db.query("delete from public.user_locations where user_id = $1", [ALICE]),
    );
    assert.equal(bobDeletesAlice.affectedRows ?? 0, 0, "a foreign DELETE must match zero rows");

    // 6. anon has no access at all.
    await assert.rejects(
      asRole(db, "anon", null, () => db.query("select * from public.user_locations")),
      /permission denied/i,
      "anon SELECT must be rejected outright",
    );
    await assert.rejects(
      asRole(db, "anon", null, () =>
        db.query(
          "insert into public.user_locations(user_id, latitude, longitude) values ($1, $2, $3)",
          [ALICE, 2, 2],
        ),
      ),
      /permission denied/i,
      "anon INSERT must be rejected outright",
    );

    // 7. Fabricated/degenerate coordinates are rejected on the direct path too.
    await asRole(db, "authenticated", BOB, () =>
      db.query("delete from public.user_locations where user_id = $1", [BOB]),
    );
    await assert.rejects(
      asRole(db, "authenticated", BOB, () =>
        db.query(
          "insert into public.user_locations(user_id, latitude, longitude) values ($1, 0, 0)",
          [BOB],
        ),
      ),
      /not_null_island|check constraint/i,
      "the 0,0 null island coordinate must be rejected",
    );

    // 8. Clearing the canonical row clears the mirror (no orphaned authority).
    await asRole(db, "authenticated", ALICE, () =>
      db.query("select public.clear_my_private_location()"),
    );
    const afterClear = await asRole(db, "authenticated", ALICE, () =>
      db.query("select * from public.user_locations"),
    );
    assert.equal(afterClear.rows.length, 0, "clearing the canonical row must clear the compat row");

    // 9. One-way sync: a direct compat write never reaches the canonical table.
    await asRole(db, "authenticated", BOB, () =>
      db.query(
        "insert into public.user_locations(user_id, latitude, longitude, accuracy_m) values ($1, $2, $3, $4)",
        [BOB, 19.076, 72.8777, 12],
      ),
    );
    const canonical = await asRole(db, "authenticated", BOB, () =>
      db.query("select * from public.user_private_locations"),
    );
    assert.equal(canonical.rows.length, 0, "the mirror must never write back into the canonical table");
  } finally {
    await db.close();
  }
});

test("Phase 6 migration is structurally sound", () => {
  // All four verbs carry the own-row rule.
  for (const verb of ["select", "insert", "update", "delete"]) {
    assert.match(
      phase6,
      new RegExp(`user_locations_${verb}_own[\\s\\S]{0,220}auth\\.uid\\(\\) = user_id`),
      `${verb} policy must enforce auth.uid() = user_id`,
    );
  }
  // No public/anon grants; authenticated only via RLS.
  assert.match(phase6, /revoke all on table public\.user_locations from public, anon, authenticated/);
  // The compat table is fed by the canonical pipeline, not a new RPC.
  assert.match(phase6, /user_private_locations_sync_compat/);
  assert.doesNotMatch(phase6, /create or replace function public\.save_my/i);
  // One-way: nothing here writes into the canonical table.
  assert.doesNotMatch(phase6, /insert into public\.user_private_locations/);
  assert.doesNotMatch(phase6, /update public\.user_private_locations/);
});
