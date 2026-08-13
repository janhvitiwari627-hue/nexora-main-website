import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../supabase/migrations/20260813093000_post_pr67_release_security_parity.sql", import.meta.url),
  "utf8",
);

async function setupParityDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema private;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function private.is_active_org_member(p_organization_id uuid)
    returns boolean language sql stable security definer set search_path = '' as $$ select false $$;
    create function private.is_admin()
    returns boolean language sql stable security definer set search_path = '' as $$ select false $$;

    create table public.salon_setup_proposals(
      id uuid primary key,
      salon_id uuid,
      growth_partner_id uuid,
      onboarding_application_id uuid,
      status text not null default 'draft',
      payload jsonb not null default '{}'::jsonb,
      version integer not null default 1,
      owner_reviewed_at timestamptz,
      owner_reviewed_by uuid,
      owner_notes text,
      published_at timestamptz
    );
    create table public.organization_members(
      id uuid primary key default gen_random_uuid(),
      organization_id uuid not null,
      user_id uuid not null,
      role text not null,
      status text not null default 'invited',
      invited_by uuid,
      joined_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (organization_id, user_id)
    );
  `);
  await db.exec(migration);
  return db;
}

test("forward migration executes in a disposable Postgres environment", async () => {
  const db = await setupParityDatabase();
  await db.close();
});

test("security-definer functions have immutable empty search paths and least-privilege grants", async () => {
  const db = await setupParityDatabase();
  try {
    const functions = await db.query(`
      select n.nspname as schema_name, p.proname, p.prosecdef, p.provolatile, p.proconfig,
        has_function_privilege('anon', p.oid, 'execute') as anon_execute,
        has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
        has_function_privilege('service_role', p.oid, 'execute') as service_execute
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where (n.nspname, p.proname) in (
        ('private', 'publish_salon_setup'),
        ('private', 'validate_salon_setup_payload'),
        ('public', 'review_salon_setup')
      ) order by n.nspname, p.proname
    `);
    assert.equal(functions.rows.length, 3);
    for (const fn of functions.rows) {
      assert.equal(fn.prosecdef, true);
      assert.equal(fn.provolatile, "v");
      assert.deepEqual(fn.proconfig, ['search_path=""']);
      assert.equal(fn.anon_execute, false);
      if (fn.proname === "review_salon_setup") {
        assert.equal(fn.authenticated_execute, true);
        assert.equal(fn.service_execute, true);
      } else {
        assert.equal(fn.authenticated_execute, false);
        assert.equal(fn.service_execute, false);
      }
    }
  } finally {
    await db.close();
  }
});

test("payload validation rejects malformed input and a missing required RPC argument", async () => {
  const db = await setupParityDatabase();
  try {
    await assert.rejects(() => db.query("select private.validate_salon_setup_payload('[]'::jsonb)"), /must be an object/);
    await assert.rejects(
      () => db.query("select private.validate_salon_setup_payload('{\"services\":{}}'::jsonb)"),
      /invalid setup payload sections/,
    );
    await assert.rejects(() => db.query("select private.validate_salon_setup_payload()"), /does not exist/);
  } finally {
    await db.close();
  }
});

test("organization_members is forced-RLS, SELECT-only for authenticated, and indexed", async () => {
  const db = await setupParityDatabase();
  try {
    const relation = await db.query(`
      select relrowsecurity, relforcerowsecurity
      from pg_class where oid = 'public.organization_members'::regclass
    `);
    assert.deepEqual(relation.rows[0], { relrowsecurity: true, relforcerowsecurity: true });

    const privileges = await db.query(`
      select
        has_table_privilege('authenticated', 'public.organization_members', 'select') as can_select,
        has_table_privilege('authenticated', 'public.organization_members', 'insert') as can_insert,
        has_table_privilege('authenticated', 'public.organization_members', 'update') as can_update,
        has_table_privilege('authenticated', 'public.organization_members', 'delete') as can_delete,
        has_table_privilege('anon', 'public.organization_members', 'select') as anon_select
    `);
    assert.deepEqual(privileges.rows[0], {
      can_select: true,
      can_insert: false,
      can_update: false,
      can_delete: false,
      anon_select: false,
    });

    const policies = await db.query(`
      select policyname, cmd, roles, qual, with_check
      from pg_policies where schemaname = 'public' and tablename = 'organization_members'
    `);
    assert.equal(policies.rows.length, 1);
    assert.equal(policies.rows[0].policyname, "organization_members_scoped_select");
    assert.equal(policies.rows[0].cmd, "SELECT");
    assert.equal(policies.rows[0].with_check, null);

    const index = await db.query(`
      select indexname from pg_indexes
      where schemaname = 'public' and tablename = 'organization_members'
        and indexname = 'organization_members_invited_by_idx'
    `);
    assert.equal(index.rows.length, 1);
  } finally {
    await db.close();
  }
});

test("organization membership allow/deny behavior is isolated and direct writes are denied", async () => {
  const db = await setupParityDatabase();
  const ACTIVE_OWNER = "00000000-0000-0000-0000-000000000101";
  const INACTIVE_OWNER = "00000000-0000-0000-0000-000000000102";
  const UNRELATED_OWNER = "00000000-0000-0000-0000-000000000103";
  const CUSTOMER = "00000000-0000-0000-0000-000000000104";
  const PARTNER = "00000000-0000-0000-0000-000000000105";
  const ORG = "00000000-0000-0000-0000-000000000201";
  const OTHER_ORG = "00000000-0000-0000-0000-000000000202";
  try {
    await db.exec(`
      create or replace function private.is_active_org_member(p_organization_id uuid)
      returns boolean language sql stable security definer set search_path = '' as $$
        select exists (
          select 1 from public.organization_members m
          where m.organization_id = p_organization_id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
      $$;
      grant usage on schema private, auth to authenticated;
      grant execute on function private.is_active_org_member(uuid), private.is_admin(), auth.uid() to authenticated;
      insert into public.organization_members(organization_id, user_id, role, status) values
        ('${ORG}', '${ACTIVE_OWNER}', 'owner', 'active'),
        ('${ORG}', '${INACTIVE_OWNER}', 'owner', 'inactive'),
        ('${OTHER_ORG}', '${UNRELATED_OWNER}', 'owner', 'active');
    `);

    async function rowsVisibleTo(userId) {
      await db.exec(`set "request.jwt.claim.sub" = '${userId}'; set role authenticated`);
      try {
        return (await db.query("select user_id::text, organization_id::text from public.organization_members order by user_id")).rows;
      } finally {
        await db.exec(`reset role; reset "request.jwt.claim.sub"`);
      }
    }

    assert.equal((await rowsVisibleTo(ACTIVE_OWNER)).length, 2, "active Owner may read the organization roster");
    assert.equal((await rowsVisibleTo(UNRELATED_OWNER)).length, 1, "unrelated Owner is isolated to the other organization");
    assert.equal((await rowsVisibleTo(INACTIVE_OWNER)).length, 1, "inactive member may see only their own membership record");
    assert.equal((await rowsVisibleTo(CUSTOMER)).length, 0, "Customer without membership is denied");
    assert.equal((await rowsVisibleTo(PARTNER)).length, 0, "Partner without membership is denied");

    await db.exec(`set "request.jwt.claim.sub" = '${ACTIVE_OWNER}'; set role authenticated`);
    try {
      await assert.rejects(
        () => db.query("insert into public.organization_members(organization_id, user_id, role) values ($1, $2, 'owner')", [ORG, CUSTOMER]),
        /permission denied/,
      );
      await assert.rejects(
        () => db.query("update public.organization_members set status = 'active' where user_id = $1", [INACTIVE_OWNER]),
        /permission denied/,
      );
      await assert.rejects(
        () => db.query("delete from public.organization_members where user_id = $1", [INACTIVE_OWNER]),
        /permission denied/,
      );
    } finally {
      await db.exec(`reset role; reset "request.jwt.claim.sub"`);
    }

    await db.exec("set role anon");
    try {
      await assert.rejects(() => db.query("select * from public.organization_members"), /permission denied/);
    } finally {
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
});
