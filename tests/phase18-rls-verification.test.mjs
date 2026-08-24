/**
 * Phase 18 — Supabase RLS verification.
 *
 * Verifies the final SQL definitions for profiles and both user-location tables,
 * then executes the read-only verification script against a small PostgreSQL
 * (PGlite) fixture to catch SQL syntax/regression errors.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const profileMigration = await read("supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql");
const privateLocationMigration = await read("supabase/migrations/20260812_phase7_shared_location_security.sql");
const userLocationsMigration = await read("supabase/migrations/20260824_phase6_user_locations_compat.sql");
const verifier = await read("scripts/verify-phase18-rls.sql");

const TABLES = ["profiles", "user_private_locations", "user_locations"];

function policyBlock(source, policyName) {
  const start = source.search(new RegExp(`create\\s+policy\\s+${policyName}\\b`, "i"));
  assert.ok(start >= 0, `missing policy ${policyName}`);
  const rest = source.slice(start + 13);
  const next = rest.search(/\n\s*create\s+policy\s+/i);
  return source.slice(start, next >= 0 ? start + 13 + next : source.length);
}

function assertAuthenticatedPolicy(source, name, command) {
  const block = policyBlock(source, name);
  assert.match(block, new RegExp(`for\\s+${command}`, "i"), `${name} command`);
  assert.match(block, /to\s+authenticated/i, `${name} role`);
  return block;
}

test("all three identity tables explicitly enable RLS in the final migrations", () => {
  assert.match(profileMigration, /alter table public\.profiles enable row level security/);
  assert.match(privateLocationMigration, /alter table public\.user_private_locations enable row level security/);
  assert.match(userLocationsMigration, /alter table public\.user_locations enable row level security/);
  assert.match(profileMigration, /alter table public\.profiles force row level security/);

  for (const table of TABLES) {
    assert.match(verifier, new RegExp(`public\\.${table}`), `${table} must be checked by verifier`);
    assert.match(verifier, new RegExp(`c\\.relrowsecurity`), `${table} RLS catalog check`);
  }
});

test("authenticated policies exist for profiles", () => {
  for (const [name, command] of [
    ["profiles_select_own", "select"],
    ["profiles_select_admin", "select"],
    ["profiles_insert_own", "insert"],
    ["profiles_update_own", "update"],
    ["profiles_update_admin", "update"],
  ]) assertAuthenticatedPolicy(profileMigration, name, command);

  // The profile table deliberately has no authenticated DELETE grant/policy.
  // Identity deletion is owned by auth.users cascade/service operations.
  assert.match(profileMigration, /revoke delete on table public\.profiles from anon, authenticated/);
});

test("authenticated CRUD policies exist for user_private_locations", () => {
  for (const [name, command] of [
    ["user_private_location_read_own", "select"],
    ["user_private_location_insert_own", "insert"],
    ["user_private_location_update_own", "update"],
    ["user_private_location_delete_own", "delete"],
  ]) assertAuthenticatedPolicy(privateLocationMigration, name, command);
});

test("authenticated CRUD policies exist for user_locations", () => {
  for (const [name, command] of [
    ["user_locations_select_own", "select"],
    ["user_locations_insert_own", "insert"],
    ["user_locations_update_own", "update"],
    ["user_locations_delete_own", "delete"],
  ]) assertAuthenticatedPolicy(userLocationsMigration, name, command);
});

test("private-row policies never use unconditional true", () => {
  const privatePolicies = [
    ...[
      "profiles_select_own",
      "profiles_select_admin",
      "profiles_insert_own",
      "profiles_update_own",
      "profiles_update_admin",
    ].map((name) => policyBlock(profileMigration, name)),
    ...[
      "user_private_location_read_own",
      "user_private_location_insert_own",
      "user_private_location_update_own",
      "user_private_location_delete_own",
    ].map((name) => policyBlock(privateLocationMigration, name)),
    ...[
      "user_locations_select_own",
      "user_locations_insert_own",
      "user_locations_update_own",
      "user_locations_delete_own",
    ].map((name) => policyBlock(userLocationsMigration, name)),
  ].join("\n");

  assert.doesNotMatch(privatePolicies, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(privatePolicies, /with\s+check\s*\(\s*true\s*\)/i);
  assert.match(verifier, /unconditional true policy found on a private identity table/);
});

test("authenticated UPDATE policies contain both USING and WITH CHECK", () => {
  const updatePolicies = [
    policyBlock(profileMigration, "profiles_update_own"),
    policyBlock(profileMigration, "profiles_update_admin"),
    policyBlock(privateLocationMigration, "user_private_location_update_own"),
    policyBlock(userLocationsMigration, "user_locations_update_own"),
  ].join("\n");
  assert.match(updatePolicies, /using\s*\(/i);
  assert.match(updatePolicies, /with\s+check\s*\(/i);

  for (const block of updatePolicies.split(/(?=create\s+policy)/i).filter(Boolean)) {
    assert.match(block, /for\s+update/i);
    assert.match(block, /using\s*\(/i);
    assert.match(block, /with\s+check\s*\(/i);
  }
  assert.match(verifier, /p\.cmd = 'UPDATE'/);
  assert.match(verifier, /p\.qual is null or p\.with_check is null/);
});

test("the SQL verifier executes successfully in a PostgreSQL fixture", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create table public.profiles(id uuid primary key, full_name text);
      create table public.user_private_locations(user_id uuid primary key, latitude double precision);
      create table public.user_locations(user_id uuid primary key, latitude double precision);
      grant usage on schema public to anon, authenticated, service_role;
      alter table public.profiles enable row level security;
      alter table public.user_private_locations enable row level security;
      alter table public.user_locations enable row level security;
      grant select, insert, update on public.profiles to authenticated;
      grant select, insert, update, delete on public.user_private_locations to authenticated;
      grant select, insert, update, delete on public.user_locations to authenticated;
      create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
      create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id);
      create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
      create policy private_select on public.user_private_locations for select to authenticated using (auth.uid() = user_id);
      create policy private_insert on public.user_private_locations for insert to authenticated with check (auth.uid() = user_id);
      create policy private_update on public.user_private_locations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy private_delete on public.user_private_locations for delete to authenticated using (auth.uid() = user_id);
      create policy locations_select on public.user_locations for select to authenticated using (auth.uid() = user_id);
      create policy locations_insert on public.user_locations for insert to authenticated with check (auth.uid() = user_id);
      create policy locations_update on public.user_locations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy locations_delete on public.user_locations for delete to authenticated using (auth.uid() = user_id);
    `);
    await db.exec(verifier);
  } finally {
    await db.close();
  }
});
