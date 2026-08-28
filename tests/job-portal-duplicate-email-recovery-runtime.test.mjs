// Job Portal — duplicate-email sign-up runtime test.
//
// The contract test greps; this one RUNS the code that changed.
// `authBackend.signUp` is transpiled from source with its Supabase client
// stubbed, so the real pre-check, the real conflict construction and the real
// migration-fallback path are executed — including the two paths that used to
// end in the dead-end "Please sign in through the Job Seeker portal" message.

import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL(`../job-portal/${path}`, import.meta.url), "utf8");

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

/** backend.ts with its two runtime imports pointed at local test doubles. */
async function loadBackend() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-jobs-backend-"));
  const backend = transpile(await read("src/services/backend.ts"))
    .replace(/from '\.\.\/utils\/errors'/, "from './errors.mjs'")
    .replace(/from '\.\.\/lib\/supabase'/, "from './stub-supabase.mjs'");
  await writeFile(join(dir, "errors.mjs"), transpile(await read("src/utils/errors.ts")));
  await writeFile(
    join(dir, "stub-supabase.mjs"),
    "export function requireSupabase() { return globalThis.__fakeSupabase; }\n",
  );
  await writeFile(join(dir, "backend.mjs"), backend);
  return import(pathToFileURL(join(dir, "backend.mjs")).href);
}

const backend = await loadBackend();

/** The same transpiled utils/errors.ts, for the type guard. */
async function loadErrorsModule() {
  const dir = await mkdtemp(join(tmpdir(), "nexora-jobs-errors-"));
  await writeFile(join(dir, "errors.mjs"), transpile(await read("src/utils/errors.ts")));
  return import(pathToFileURL(join(dir, "errors.mjs")).href);
}
const errors = await loadErrorsModule();

/** Stub Supabase client recording every call the service makes. */
function useClient(handlers) {
  const calls = [];
  globalThis.__fakeSupabase = {
    rpc: async (fn, params) => {
      calls.push({ kind: "rpc", fn, params });
      return handlers.rpc ? handlers.rpc(fn, params) : { data: null, error: null };
    },
    auth: {
      signUp: async (payload) => {
        calls.push({ kind: "signUp", payload });
        return handlers.signUp
          ? handlers.signUp(payload)
          : { data: { user: { id: "u1", identities: [{}] }, session: { access_token: "t" } }, error: null };
      },
      resend: async (payload) => {
        calls.push({ kind: "resend", payload });
        return { data: {}, error: null };
      },
    },
  };
  return calls;
}

const password = "Nexora@123";

// ---------------------------------------------------------------------------
// 1. The dead end is gone: an existing account yields an actionable conflict
// ---------------------------------------------------------------------------

test("signing up with an already-registered Job Seeker email throws the recovery conflict", async () => {
  const calls = useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: { portal_role: "job_seeker", email_confirmed: true }, error: null }
        : { data: null, error: null },
  });

  const error = await backend.authBackend
    .signUp({ role: "seeker", email: "jane@example.com", password, name: "Jane Doe", phone: "1" })
    .then(() => null, (thrown) => thrown);

  assert.ok(error, "sign-up must be refused");
  assert.equal(errors.isPortalEmailConflictError(error), true);
  assert.equal(error.email, "jane@example.com");
  assert.equal(error.existingRole, "job_seeker");
  assert.equal(error.requestedRole, "seeker");
  assert.equal(error.emailConfirmed, true);
  assert.match(error.message, /already has a Job Seeker account/);
  assert.match(error.message, /Sign in with your password/);
  assert.doesNotMatch(error.message, /Please sign in through the Job Seeker portal/);
  // No account was created and no verification mail was queued.
  assert.deepEqual(calls.map((c) => c.kind), ["rpc"]);
});

test("an unverified account is reported as unverified so the resend button can render", async () => {
  useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: { portal_role: "job_seeker", email_confirmed: false }, error: null }
        : { data: null, error: null },
  });

  const error = await backend.authBackend
    .signUp({ role: "seeker", email: "jane@example.com", password, name: "Jane Doe" })
    .then(() => null, (thrown) => thrown);

  assert.equal(error.emailConfirmed, false);
  assert.match(error.message, /never verified/);
  assert.match(error.message, /verification link/i);
});

test("a portal mismatch names the linked portal instead of a dead end", async () => {
  useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: { portal_role: "job_seeker", email_confirmed: true }, error: null }
        : { data: null, error: null },
  });

  const error = await backend.authBackend
    .signUp({ role: "employer", email: "jane@example.com", password, name: "Jane", businessName: "B" })
    .then(() => null, (thrown) => thrown);

  assert.equal(error.existingRole, "job_seeker");
  assert.equal(error.requestedRole, "employer");
  assert.match(error.message, /already linked to a Job Seeker account/);
  assert.match(error.message, /cannot be used for the Employer portal/);
});

test("a Nexora account with no Jobs portal yet explains the one-time choice", async () => {
  useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: { portal_role: "unassigned", email_confirmed: true }, error: null }
        : { data: null, error: null },
  });

  const error = await backend.authBackend
    .signUp({ role: "seeker", email: "jane@example.com", password, name: "Jane" })
    .then(() => null, (thrown) => thrown);

  assert.equal(error.existingRole, "unassigned");
  assert.match(error.message, /has not chosen a Jobs portal yet/);
});

// ---------------------------------------------------------------------------
// 2. Deployments without the new migration keep working (graceful fallback)
// ---------------------------------------------------------------------------

test("a missing job_email_portal_state degrades to the role-only lookup", async () => {
  const calls = useClient({
    rpc: (fn) => {
      if (fn === "job_email_portal_state") {
        return {
          data: null,
          error: {
            message: "Could not find the function public.job_email_portal_state(p_email) in the schema cache",
            code: "PGRST202",
            details: "",
            hint: "",
          },
        };
      }
      return { data: "employer", error: null };
    },
  });

  const error = await backend.authBackend
    .signUp({ role: "employer", email: "ops@salon.com", password, name: "Ops", businessName: "Salon" })
    .then(() => null, (thrown) => thrown);

  assert.ok(error, "the duplicate email must still be refused");
  assert.equal(error.existingRole, "employer");
  assert.equal(error.emailConfirmed, null, "confirmation state is unknown without the migration");
  assert.match(error.message, /already has an Employer account/);
  assert.deepEqual(
    calls.filter((c) => c.kind === "rpc").map((c) => c.fn),
    ["job_email_portal_state", "job_email_portal_role"],
  );
});

test("a transport failure on the pre-check still surfaces the real backend message", async () => {
  useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: null, error: { message: "permission denied for function", code: "42501" } }
        : { data: null, error: null },
  });

  const error = await backend.authBackend
    .signUp({ role: "seeker", email: "jane@example.com", password, name: "Jane" })
    .then(() => null, (thrown) => thrown);

  assert.ok(error instanceof Error);
  assert.match(error.message, /permission denied for function/);
  assert.equal(errors.isPortalEmailConflictError(error), false);
});

// ---------------------------------------------------------------------------
// 3. The happy path is unchanged
// ---------------------------------------------------------------------------

test("a fresh email still signs up with the portal metadata", async () => {
  const calls = useClient({});

  const result = await backend.authBackend.signUp({
    role: "seeker",
    email: " new@example.com ",
    password,
    name: "New Person",
    phone: "(555) 000-0000",
  });

  assert.ok(result.session, "the session is returned for onboarding");
  const signUpCall = calls.find((c) => c.kind === "signUp");
  assert.equal(signUpCall.payload.email, "new@example.com", "the email is trimmed");
  assert.equal(signUpCall.payload.options.data.app_context, "jobs");
  assert.equal(signUpCall.payload.options.data.job_role, "job_seeker");
});

test("an obfuscated Supabase duplicate response is converted into the same conflict", async () => {
  const calls = useClient({
    rpc: (fn) =>
      fn === "job_email_portal_state"
        ? { data: null, error: null }
        : { data: null, error: null },
    signUp: () => ({ data: { user: { id: "u1", identities: [] }, session: null }, error: null }),
  });
  // Second pre-check (the race) now sees the account that won the race.
  let lookups = 0;
  globalThis.__fakeSupabase.rpc = async (fn, params) => {
    lookups += 1;
    return lookups === 1
      ? { data: null, error: null }
      : { data: { portal_role: "job_seeker", email_confirmed: true }, error: null };
  };

  const error = await backend.authBackend
    .signUp({ role: "seeker", email: "jane@example.com", password, name: "Jane" })
    .then(() => null, (thrown) => thrown);

  assert.equal(errors.isPortalEmailConflictError(error), true);
  assert.equal(error.existingRole, "job_seeker");
  assert.equal(lookups, 2, "the race is re-checked against the database");
  assert.ok(calls.some((c) => c.kind === "signUp"));
});

// ---------------------------------------------------------------------------
// 4. The migration itself runs against a real Postgres (PGlite)
// ---------------------------------------------------------------------------

const { PGlite } = await import("@electric-sql/pglite");

const migrationSql = await read("supabase/migrations/20260828120000_jobs_email_portal_state.sql");

async function setupPortalDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(
      id uuid primary key default gen_random_uuid(),
      email text not null,
      email_confirmed_at timestamptz,
      deleted_at timestamptz,
      created_at timestamptz not null default now()
    );
    create table public.job_user_roles(
      user_id uuid primary key,
      role text not null
    );
  `);
  await db.exec(migrationSql);
  return db;
}

test("job_email_portal_state reports role and confirmation state", async () => {
  const db = await setupPortalDatabase();
  await db.exec(`
    insert into auth.users(id, email, email_confirmed_at, created_at) values
      ('00000000-0000-0000-0000-000000000001', 'confirmed@example.com', now(), now()),
      ('00000000-0000-0000-0000-000000000002', 'pending@example.com', null, now()),
      ('00000000-0000-0000-0000-000000000003', 'nexora@example.com', now(), now()),
      ('00000000-0000-0000-0000-000000000004', 'deleted@example.com', now(), now());
    update auth.users set deleted_at = now() where id = '00000000-0000-0000-0000-000000000004';
    insert into public.job_user_roles(user_id, role) values
      ('00000000-0000-0000-0000-000000000001', 'job_seeker'),
      ('00000000-0000-0000-0000-000000000002', 'job_seeker'),
      ('00000000-0000-0000-0000-000000000004', 'employer');
  `);

  const lookup = async (email) =>
    (await db.query("select public.job_email_portal_state($1) as state", [email])).rows[0].state;

  assert.deepEqual(await lookup("confirmed@example.com"), {
    portal_role: "job_seeker",
    email_confirmed: true,
  });
  // The state that used to be invisible to the client.
  assert.deepEqual(await lookup("pending@example.com"), {
    portal_role: "job_seeker",
    email_confirmed: false,
  });
  // A Nexora account that has not chosen a Jobs portal.
  assert.deepEqual(await lookup("nexora@example.com"), {
    portal_role: "unassigned",
    email_confirmed: true,
  });
  // No account, and a soft-deleted account, both mean "free to sign up".
  assert.equal(await lookup("nobody@example.com"), null);
  assert.equal(await lookup("deleted@example.com"), null);
  // Email matching is case-insensitive and trims, like the existing function.
  assert.deepEqual(await lookup("  CONFIRMED@Example.COM "), {
    portal_role: "job_seeker",
    email_confirmed: true,
  });

  await db.close();
});

test("the state lookup is callable by anon and authenticated only", async () => {
  const db = await setupPortalDatabase();
  const grants = await db.query(`
    select grantee
    from information_schema.routine_privileges
    where routine_name = 'job_email_portal_state'
      and privilege_type = 'EXECUTE'
    order by grantee
  `);
  const grantees = grants.rows.map((r) => r.grantee);
  // PUBLIC must stay revoked; the owner (postgres) keeps its implicit grant.
  assert.doesNotMatch(grantees.join(","), /\bpublic\b/i);
  assert.ok(grantees.includes("anon"), "anon must be able to validate a signup email");
  assert.ok(grantees.includes("authenticated"), "authenticated must be able to validate a signup email");
  await db.close();
});
