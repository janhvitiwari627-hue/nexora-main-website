import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const phase1Schema = await readFile(
  new URL("../supabase/migrations/20260802_customer_phase1_schema.sql", import.meta.url),
  "utf8",
);
const completion = await readFile(
  new URL("../supabase/migrations/20260803_customer_phase1_completion.sql", import.meta.url),
  "utf8",
);
const mainApp = await readFile(
  new URL("../app/nexora-app.tsx", import.meta.url),
  "utf8",
);
const statusDoc = await readFile(
  new URL("../docs/PHASE1_CUSTOMER_PWA_COMPLETION_STATUS.md", import.meta.url),
  "utf8",
);
const patchDoc = await readFile(
  new URL("../docs/phase1-customer-pwa/APPLY_AND_PATCH.md", import.meta.url),
  "utf8",
);

// ---------------------------------------------------------------------------
// The Customer PWA owns booking/payment writes. The Main Website only hands
// salon context to the Customer portal.
// ---------------------------------------------------------------------------
test("main website hands booking to the Customer PWA", () => {
  assert.match(mainApp, /customerPortalBookingPath/);
  assert.match(mainApp, /\/app\/customer\/\?/);
  assert.doesNotMatch(mainApp, /create_customer_booking|razorpay-create-order/);
  assert.doesNotMatch(mainApp, /create table/i);
  assert.doesNotMatch(mainApp, /service_role|RAZORPAY_KEY_SECRET/);
});

test("main website uses only Next Supabase env variables", () => {
  assert.match(mainApp, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(mainApp, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(mainApp, /VITE_PUBLIC_SUPABASE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/);
});

// ---------------------------------------------------------------------------
// Phase-1 base schema (20260802) stays in place — the completion migration
// builds on it, it does not replace it.
// ---------------------------------------------------------------------------
test("20260802 base schema still provides ledger tables and mint RPCs", () => {
  assert.match(phase1Schema, /create table if not exists public\.customer_settings/);
  assert.match(phase1Schema, /create table if not exists public\.saved_payment_methods/);
  assert.match(phase1Schema, /create table if not exists public\.customer_feedback/);
  assert.match(phase1Schema, /alter table public\.reviews\s+add column if not exists salon_id uuid/);
  assert.match(phase1Schema, /create table if not exists public\.rewards/);
  assert.match(phase1Schema, /create table if not exists public\.wallet_transactions/);
  assert.match(phase1Schema, /alter table public\.profiles\s+add column if not exists loyalty_points/);
  assert.match(phase1Schema, /alter table public\.profiles\s+add column if not exists wallet_balance_paise/);
  assert.match(phase1Schema, /create or replace function public\.credit_wallet\(/);
  assert.match(phase1Schema, /create or replace function public\.credit_reward_points\(/);
});

// ---------------------------------------------------------------------------
// Task 7 (reviews) — the app-contract table is provisioned in the shared
// schema with owner RLS and multi-device realtime.
// ---------------------------------------------------------------------------
test("20260803 provisions customer_reviews exactly as the app contract expects", () => {
  assert.match(completion, /create table if not exists public\.customer_reviews \(/);
  assert.match(completion, /id text primary key,/);
  assert.match(completion, /user_id uuid not null references auth\.users \(id\) on delete cascade,/);
  assert.match(completion, /salon_id text not null,/);
  assert.match(completion, /service_name text not null,/);
  assert.match(completion, /rating smallint not null check \(rating between 1 and 5\),/);
  assert.match(completion, /verified_booking boolean not null default false,/);
  assert.match(completion, /alter table public\.customer_reviews enable row level security;/);
  for (const action of ["select", "insert", "update", "delete"]) {
    assert.match(
      completion,
      new RegExp(`create policy "customer_reviews_${action}_own"[\\s\\S]*?auth\\.uid\\(\\) = user_id`),
    );
  }
  // Realtime publication is guarded so re-applying the migration never errors.
  assert.match(completion, /if exists \(select 1 from pg_publication where pubname = 'supabase_realtime'\)/);
  assert.match(completion, /alter publication supabase_realtime add table public\.customer_reviews;/);
});

// ---------------------------------------------------------------------------
// Task 7 (rewards/wallet) — balances become server-managed money.
// ---------------------------------------------------------------------------
test("20260803 guards profile balance columns against direct client writes", () => {
  assert.match(completion, /create or replace function public\.guard_profile_balance_columns\(\)/);
  assert.match(completion, /before update on public\.profiles/);
  assert.match(completion, /execute function public\.guard_profile_balance_columns\(\)/);
  assert.match(completion, /new\.loyalty_points is not distinct from old\.loyalty_points/);
  assert.match(completion, /new\.wallet_balance_paise is not distinct from old\.wallet_balance_paise/);
  // Only marked server RPCs, service_role, or dashboard owner roles may pass.
  assert.match(completion, /current_setting\('nexora\.balance_writer', true\)/);
  assert.match(completion, /v_marker <> 'nexora-server-rpc' and v_role <> 'service_role'/);
  assert.match(completion, /session_user in \('postgres', 'supabase_admin'\)/);
});

test("20260803 re-issues mint RPCs with the marker and locks them to service_role", () => {
  const [, creditWalletBody] = completion.split(/create or replace function public\.credit_wallet\(/)[1].split(/\$fn\$;/);
  assert.match(creditWalletBody, /perform set_config\('nexora\.balance_writer', 'nexora-server-rpc', true\);/);
  assert.match(
    completion,
    /revoke all on function public\.credit_wallet\(uuid, bigint, text, text, uuid\) from anon;/,
  );
  assert.match(
    completion,
    /revoke all on function public\.credit_wallet\(uuid, bigint, text, text, uuid\) from authenticated;/,
  );
  assert.match(
    completion,
    /revoke all on function public\.credit_wallet\(uuid, bigint, text, text, uuid\)\s+from public;/,
  );
  assert.match(
    completion,
    /grant execute on function public\.credit_wallet\(uuid, bigint, text, text, uuid\)\s+to service_role;/,
  );
  assert.match(
    completion,
    /revoke all on function public\.credit_reward_points\(uuid, integer, text, text\) from authenticated;/,
  );
  assert.match(
    completion,
    /grant execute on function public\.credit_reward_points\(uuid, integer, text, text\)\s+to service_role;/,
  );
});

test("20260803 redeem RPC is self-service, balance-checked and tier-locked", () => {
  assert.match(completion, /create or replace function public\.redeem_loyalty_points\(/);
  assert.match(completion, /v_user uuid := auth\.uid\(\);/);
  assert.match(completion, /if v_user is null then[\s\S]*?raise exception 'not authenticated';/);
  // Conversion rate can never be set by the caller.
  assert.match(completion, /if not \(p_points = 500 and p_wallet_credit_paise = 10000\)/);
  assert.match(completion, /and not \(p_points = 1000 and p_wallet_credit_paise = 25000\) then/);
  assert.match(completion, /raise exception 'invalid redemption tier';/);
  // Balance is re-read under a row lock before any money moves.
  assert.match(completion, /select loyalty_points into v_current[\s\S]*?for update;/);
  assert.match(completion, /raise exception 'insufficient points';/);
  // Both ledgers are written server-side.
  assert.match(completion, /insert into public\.rewards \(user_id, type, title, points, status, redeemed_at\)/);
  assert.match(completion, /insert into public\.wallet_transactions \(user_id, amount_paise, tx_type, reason, ref_type\)/);
  assert.match(completion, /revoke all on function public\.redeem_loyalty_points\(integer, bigint, text\)\s+from public;/);
  assert.match(completion, /revoke all on function public\.redeem_loyalty_points\(integer, bigint, text\) from anon;/);
  assert.match(completion, /grant execute on function public\.redeem_loyalty_points\(integer, bigint, text\)\s+to authenticated, service_role;/);
});

test("20260803 ships a runnable self test covering every Phase-1 object", () => {
  assert.match(completion, /create or replace function public\.verify_customer_phase1_backend\(\)/);
  assert.match(completion, /returns table \(\s*check_no integer,\s*check_id text,\s*check_name text,\s*status text,\s*detail text\s*\)/);
  for (const id of [
    "customer_settings",
    "saved_payment_methods",
    "customer_feedback",
    "support_tickets.created_by",
    "reviews.salon_id",
    "customer_reviews",
    "rewards",
    "wallet_transactions",
    "profiles.loyalty_points",
    "profiles.wallet_balance_paise",
    "credit_wallet",
    "credit_reward_points",
    "balance_guard",
    "mint_lockdown",
    "redeem_loyalty_points",
  ]) {
    assert.ok(completion.includes(`'${id}'`), `verify row missing for ${id}`);
  }
  // No new booking/payment objects are invented anywhere in this migration.
  assert.doesNotMatch(completion, /create table if not exists public\.bookings|alter table public\.bookings|alter table public\.payments/);
});

// ---------------------------------------------------------------------------
// Documentation contract — the status report records all 7 tasks with
// evidence, and the app-side patch uses the server RPC.
// ---------------------------------------------------------------------------
// Catalog identifiers used in guards must be real Postgres columns.
test("no catalog column typos in guarded role checks", () => {
  assert.doesNotMatch(completion, /pg_roles where rolename/); // column is rolname
  assert.match(completion, /pg_roles where rolname = 'anon'/);
  assert.match(completion, /pg_roles where rolname = 'authenticated'/);
});

test("status report covers all 7 Phase-1 tasks with verdicts", () => {
  for (let i = 1; i <= 7; i += 1) {
    assert.match(statusDoc, new RegExp(`## Task ${i} —`));
  }
  assert.match(statusDoc, /4eff314/); // inspected Customer PWA revision
  assert.match(statusDoc, /customer_reviews/);
  assert.match(statusDoc, /verify_customer_phase1_backend/);
  assert.match(statusDoc, /20260803_customer_phase1_completion\.sql/);
});

test("app-side patch routes redemption through the server RPC", () => {
  assert.match(patchDoc, /supabase\.rpc\('redeem_loyalty_points', \{/);
  assert.match(patchDoc, /p_wallet_credit_paise: opt\.discount \* 100/);
  // The patch must not duck around the guard with direct balance writes.
  const codeBlocks = patchDoc.split("```");
  for (const block of codeBlocks) {
    if (block.startsWith("tsx")) {
      assert.doesNotMatch(block, /\.update\(\{\s*loyalty_points|wallet_balance_paise:\s*current/);
    }
  }
});

// The dashboard runner is a verbatim concatenation of both migrations plus
// the final self test — it can never drift from the source files.
test("dashboard runner contains both migrations verbatim, in order", async () => {
  const runner = await readFile(
    new URL("../docs/phase1-customer-pwa/PHASE1_BACKEND_RUN_THIS.sql", import.meta.url),
    "utf8",
  );
  const part1 = runner.indexOf(phase1Schema.slice(0, 200));
  const part2 = runner.indexOf(completion.slice(0, 200));
  assert.ok(part1 > 0, "PART 1 (20260802 schema) missing verbatim from the runner");
  assert.ok(part2 > part1, "PART 2 (20260803 completion) must follow PART 1 verbatim");
  assert.ok(runner.includes(phase1Schema.trim().slice(-400)), "PART 1 truncated in the runner");
  assert.ok(runner.includes(completion.trim().slice(-400)), "PART 2 truncated in the runner");
  assert.match(runner, /select \* from public\.verify_customer_phase1_backend\(\);\s*$/);
});
