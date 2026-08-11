/**
 * Phase 1 SQL verification harness.
 *
 * Executes the Phase 1 migration against a real Postgres engine (PGlite, the
 * WASM build of Postgres) on top of a minimal Supabase-shaped fixture:
 * an `auth.users` table, the `anon` / `authenticated` / `service_role` roles,
 * and an `auth.uid()` that reads the request JWT claims the way PostgREST
 * sets them.
 *
 * This proves the migration parses, applies, is idempotent, and that the RLS
 * policies and role guards actually behave as intended — static text
 * assertions cannot demonstrate any of that.
 *
 * Usage:  node scripts/verify-phase1-sql.mjs
 * Exit code 0 = all checks passed.
 */

import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = new URL(
  "../supabase/migrations/20260811_phase1_centralized_auth_profiles_rls.sql",
  import.meta.url,
);

const results = [];
let failures = 0;

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  if (!passed) failures += 1;
}

/** Roll back whatever transaction state a failed statement left behind. */
async function reset(db) {
  await db.exec("rollback;").catch(() => {});
  await db.exec("reset role;").catch(() => {});
}

async function expectFailure(db, sql, matcher, name) {
  try {
    await db.exec(sql);
    record(name, false, "statement unexpectedly succeeded");
  } catch (error) {
    const message = String(error.message ?? error);
    record(name, matcher.test(message), message.split("\n")[0]);
  } finally {
    await reset(db);
  }
}

/** Emulate PostgREST: run a statement as a given role with a given auth.uid(). */
async function asUser(db, { userId = null, role = "authenticated" }, fn) {
  await db.exec("begin;");
  const claims = userId ? JSON.stringify({ sub: userId, role }) : JSON.stringify({ role });
  await db.exec(`select set_config('request.jwt.claims', '${claims}', true);`);
  await db.exec(`select set_config('request.jwt.claim.role', '${role}', true);`);
  await db.exec(`set local role ${role};`);
  try {
    return await fn();
  } finally {
    // A denied statement aborts the transaction, so cleanup must tolerate it.
    await reset(db);
  }
}

const db = new PGlite();
await db.waitReady;

// ---------------------------------------------------------------------------
// Supabase-shaped fixture
// ---------------------------------------------------------------------------
await db.exec(`
  create schema if not exists auth;

  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
  end $$;

  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role;

  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  -- PostgREST exposes the JWT subject through auth.uid().
  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
  $$;

  create or replace function auth.role()
  returns text
  language sql
  stable
  as $$
    select current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  $$;
`);

// ---------------------------------------------------------------------------
// Apply the migration (twice — it must be idempotent)
// ---------------------------------------------------------------------------
let sql = await readFile(MIGRATION, "utf8");

// PGlite ships without the pgcrypto extension; Supabase always has it, and
// Postgres 13+ provides gen_random_uuid() natively, so the extension line is
// the ONLY substitution made to the migration under test.
sql = sql.replace(
  /create extension if not exists pgcrypto;/,
  "-- [harness] pgcrypto omitted: gen_random_uuid() is built into Postgres 13+",
);

try {
  await db.exec(sql);
  record("migration applies cleanly", true);
} catch (error) {
  record("migration applies cleanly", false, String(error.message ?? error));
  console.error(error);
}

try {
  await db.exec(sql);
  record("migration is idempotent (second apply is a no-op)", true);
} catch (error) {
  record("migration is idempotent (second apply is a no-op)", false, String(error.message ?? error));
}

// ---------------------------------------------------------------------------
// Built-in self-test
// ---------------------------------------------------------------------------
try {
  const { rows } = await db.query("select check_name, passed, detail from public.verify_phase1_auth();");
  for (const row of rows) {
    record(`verify_phase1_auth: ${row.check_name}`, row.passed === true, row.detail ?? "");
  }
} catch (error) {
  record("verify_phase1_auth() runs", false, String(error.message ?? error));
}

// ---------------------------------------------------------------------------
// Signup trigger: roles and aliases
// ---------------------------------------------------------------------------
const users = {
  customer: "11111111-1111-4111-8111-111111111111",
  owner: "22222222-2222-4222-8222-222222222222",
  partner: "33333333-3333-4333-8333-333333333333",
  delivery: "44444444-4444-4444-8444-444444444444",
  sneaky: "55555555-5555-4555-8555-555555555555",
  admin: "66666666-6666-4666-8666-666666666666",
};

await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${users.customer}', 'c@example.com', '{"signup_role":"user","full_name":"Cust One"}'),
    ('${users.owner}',    'o@example.com', '{"signup_role":"shop_owner","full_name":"Owner One"}'),
    ('${users.partner}',  'p@example.com', '{"signup_role":"growth-partner","full_name":"Partner One"}'),
    ('${users.delivery}', 'd@example.com', '{"signup_role":"delivery_partner","full_name":"Rider One"}'),
    ('${users.sneaky}',   's@example.com', '{"signup_role":"admin","full_name":"Sneaky"}'),
    ('${users.admin}',    'a@example.com', '{"full_name":"Real Admin"}');
`);

const expectations = [
  [users.customer, "customer", "alias user → customer"],
  [users.owner, "business_user", "alias shop_owner → business_user"],
  [users.partner, "growth_partner", "alias growth-partner → growth_partner"],
  [users.delivery, "delivery_partner", "delivery_partner is a real role"],
  [users.sneaky, "customer", "self-assigned admin at signup is refused"],
];

for (const [id, expected, name] of expectations) {
  const { rows } = await db.query("select platform_role from public.profiles where id = $1", [id]);
  record(`trigger: ${name}`, rows[0]?.platform_role === expected, `got ${rows[0]?.platform_role}`);
}

{
  const { rows } = await db.query("select full_name, email, is_active from public.profiles where id = $1", [
    users.customer,
  ]);
  record(
    "trigger: profile carries name, email and active status",
    rows[0]?.full_name === "Cust One" && rows[0]?.email === "c@example.com" && rows[0]?.is_active === true,
    JSON.stringify(rows[0]),
  );
}

// Promote a real admin the only supported way (service_role).
await db.exec(`select public.assign_platform_role('${users.admin}', 'admin');`);
{
  const { rows } = await db.query("select platform_role from public.profiles where id = $1", [users.admin]);
  record("assign_platform_role promotes to admin", rows[0]?.platform_role === "admin", rows[0]?.platform_role);
}

// ---------------------------------------------------------------------------
// RLS behaviour
// ---------------------------------------------------------------------------
await asUser(db, { userId: users.customer }, async () => {
  const { rows } = await db.query("select id from public.profiles;");
  record(
    "RLS: a user sees only their own profile",
    rows.length === 1 && rows[0].id === users.customer,
    `${rows.length} row(s) visible`,
  );
});

await asUser(db, { userId: users.owner }, async () => {
  const { rows } = await db.query("select id from public.profiles where id = $1", [users.customer]);
  record("RLS: a user cannot read another user's profile", rows.length === 0, `${rows.length} row(s)`);
});

await asUser(db, { userId: users.admin }, async () => {
  const { rows } = await db.query("select id from public.profiles;");
  record("RLS: an admin can read every profile", rows.length >= 6, `${rows.length} row(s) visible`);
});

await asUser(db, { role: "anon" }, async () => {
  try {
    await db.query("select id from public.profiles;");
    record("RLS: anon cannot read profiles", false, "anon read succeeded");
  } catch (error) {
    record("RLS: anon cannot read profiles", /permission denied/i.test(String(error.message)), String(error.message).split("\n")[0]);
  }
});

// A user may edit their own display fields.
await asUser(db, { userId: users.customer }, async () => {
  try {
    await db.query("update public.profiles set full_name = 'Renamed' where id = $1", [users.customer]);
    const { rows } = await db.query("select full_name from public.profiles where id = $1", [users.customer]);
    record("RLS: a user can update their own display name", rows[0]?.full_name === "Renamed", rows[0]?.full_name);
  } catch (error) {
    record("RLS: a user can update their own display name", false, String(error.message).split("\n")[0]);
  }
});

// ---------------------------------------------------------------------------
// Privilege-escalation attempts (the core security promise)
// ---------------------------------------------------------------------------
await expectFailure(
  db,
  `begin;
   select set_config('request.jwt.claims', '{"sub":"${users.customer}","role":"authenticated"}', true);
   select set_config('request.jwt.claim.role', 'authenticated', true);
   set local role authenticated;
   update public.profiles set platform_role = 'admin' where id = '${users.customer}';
   commit;`,
  /permission denied|assigned permanently/i,
  "escalation: a user cannot promote themselves to admin",
);

await expectFailure(
  db,
  `begin;
   select set_config('request.jwt.claims', '{"sub":"${users.customer}","role":"authenticated"}', true);
   select set_config('request.jwt.claim.role', 'authenticated', true);
   set local role authenticated;
   update public.profiles set platform_role = 'business_user' where id = '${users.customer}';
   commit;`,
  /permission denied|assigned permanently/i,
  "escalation: a customer cannot become a shop owner",
);

await expectFailure(
  db,
  `begin;
   select set_config('request.jwt.claims', '{"sub":"${users.customer}","role":"authenticated"}', true);
   select set_config('request.jwt.claim.role', 'authenticated', true);
   set local role authenticated;
   update public.profiles set wallet_balance_paise = 100000 where id = '${users.customer}';
   commit;`,
  /permission denied|server ledger/i,
  "escalation: a user cannot credit their own wallet",
);

// RLS filters the target row out rather than raising: the correct, silent
// outcome is that ZERO rows are affected and the victim's data is untouched.
await asUser(db, { userId: users.owner }, async () => {
  const result = await db.query("update public.profiles set full_name = 'Hacked' where id = $1", [
    users.customer,
  ]);
  record(
    "escalation: a cross-user update affects zero rows",
    (result.affectedRows ?? 0) === 0,
    `${result.affectedRows} row(s) affected`,
  );
});

// The RLS predicate silently matches zero rows rather than erroring; confirm
// the target row was genuinely untouched.
{
  const { rows } = await db.query("select full_name from public.profiles where id = $1", [users.customer]);
  record(
    "escalation: another user's row is unchanged after a cross-user update",
    rows[0]?.full_name !== "Hacked",
    `full_name = ${rows[0]?.full_name}`,
  );
}

await expectFailure(
  db,
  `begin;
   select set_config('request.jwt.claims', '{"sub":"${users.sneaky}","role":"authenticated"}', true);
   select set_config('request.jwt.claim.role', 'authenticated', true);
   set local role authenticated;
   select public.assign_platform_role('${users.sneaky}', 'admin');
   commit;`,
  /administrators|permission denied/i,
  "escalation: a non-admin cannot call assign_platform_role",
);

// A user must not insert a privileged row for themselves.
await expectFailure(
  db,
  `begin;
   select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
   select set_config('request.jwt.claim.role', 'authenticated', true);
   set local role authenticated;
   insert into public.profiles (id, full_name, platform_role)
   values ('77777777-7777-4777-8777-777777777777', 'Ghost', 'admin');
   commit;`,
  /assigned permanently|violates|permission denied/i,
  "escalation: a client cannot insert a privileged profile row",
);

// ---------------------------------------------------------------------------
// Constraint + cascade behaviour
// ---------------------------------------------------------------------------
await expectFailure(
  db,
  `update public.profiles set platform_role = 'wizard' where id = '${users.customer}';`,
  /violates check constraint|invalid/i,
  "constraint: an unknown role value is rejected",
);

{
  await db.exec(`delete from auth.users where id = '${users.delivery}';`);
  const { rows } = await db.query("select count(*)::int as n from public.profiles where id = $1", [users.delivery]);
  record("cascade: deleting an auth user removes the profile", rows[0]?.n === 0, `${rows[0]?.n} row(s) remain`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const width = Math.max(...results.map((r) => r.name.length)) + 2;
console.log("\nPhase 1 SQL verification (PGlite / real Postgres engine)\n");
for (const { name, passed, detail } of results) {
  const status = passed ? "PASS" : "FAIL";
  const line = `  ${status}  ${name.padEnd(width)}`;
  console.log(detail && !passed ? `${line} → ${detail}` : line);
}
console.log(`\n  ${results.length - failures}/${results.length} checks passed\n`);

await db.close();
process.exit(failures === 0 ? 0 : 1);
