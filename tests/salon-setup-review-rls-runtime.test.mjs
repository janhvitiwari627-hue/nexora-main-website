import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const reviewMigration = await readFile(
  new URL("../supabase/migrations/20260729_complete_salon_proposal_publish.sql", import.meta.url),
  "utf8",
);
const invitedByIndexMigration = await readFile(
  new URL("../supabase/migrations/20260813_organization_members_invited_by_index.sql", import.meta.url),
  "utf8",
);

const reviewFunctionMatch = reviewMigration.match(
  /create or replace function public\.review_salon_setup\([\s\S]*?\$function\$;/,
);
assert.ok(reviewFunctionMatch, "review_salon_setup must remain extractable from its canonical migration");
const reviewFunction = reviewFunctionMatch[0];

const CUSTOMER = "00000000-0000-0000-0000-000000000101";
const OWNER = "00000000-0000-0000-0000-000000000201";
const UNRELATED_OWNER = "00000000-0000-0000-0000-000000000202";
const PARTNER = "00000000-0000-0000-0000-000000000301";
const INACTIVE_OWNER = "00000000-0000-0000-0000-000000000401";
const ORG = "00000000-0000-0000-0000-000000000501";
const OTHER_ORG = "00000000-0000-0000-0000-000000000502";
const SALON = "00000000-0000-0000-0000-000000000601";
const PROPOSAL = "00000000-0000-0000-0000-000000000701";
const PARTNER_ID = "00000000-0000-0000-0000-000000000801";

async function setupDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role authenticated nologin;
    create schema auth;
    create schema private;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;

    create table public.profiles(
      id uuid primary key,
      platform_role text not null,
      is_active boolean not null default true
    );
    create table public.organization_members(
      organization_id uuid not null,
      user_id uuid not null,
      role text not null,
      status text not null,
      invited_by uuid,
      primary key (organization_id, user_id)
    );
    create table public.salons(
      id uuid primary key,
      organization_id uuid not null,
      verified boolean not null default false,
      is_active boolean not null default false,
      accepts_online_bookings boolean not null default false
    );
    create table public.salon_setup_proposals(
      id uuid primary key,
      salon_id uuid,
      growth_partner_id uuid,
      onboarding_application_id uuid,
      status text not null,
      payload jsonb not null default '{}'::jsonb,
      version integer not null default 1,
      owner_reviewed_at timestamptz,
      owner_reviewed_by uuid,
      owner_notes text,
      published_at timestamptz
    );
    create table public.shop_attributions(
      growth_partner_id uuid,
      salon_id uuid,
      onboarding_application_id uuid,
      attribution_method text,
      status text,
      effective_from timestamptz,
      effective_until timestamptz,
      approved_by uuid,
      approved_at timestamptz,
      source_event_id text unique,
      reason text
    );
    create table public.salon_setup_proposal_versions(
      proposal_id uuid,
      version integer,
      payload jsonb,
      changed_by uuid,
      change_source text,
      change_note text
    );
    create table public.growth_partners(id uuid primary key, user_id uuid not null);
    create table public.notifications(
      recipient_user_id uuid,
      salon_id uuid,
      notification_type text,
      title text,
      message text,
      data jsonb,
      channel text
    );

    create function private.can_manage_salon_settings(p_salon_id uuid)
    returns boolean language sql stable security definer set search_path = '' as $$
      select exists (
        select 1
        from public.salons s
        join public.organization_members m on m.organization_id = s.organization_id
        join public.profiles p on p.id = m.user_id
        where s.id = p_salon_id
          and m.user_id = auth.uid()
          and m.role = 'owner'
          and m.status = 'active'
          and p.platform_role = 'business_user'
          and p.is_active
      )
    $$;
    create function private.publish_salon_setup(
      p_proposal public.salon_setup_proposals,
      p_caller uuid
    ) returns void language plpgsql security definer set search_path = '' as $$
    begin
      -- The live implementation is deliberately not re-created here. This
      -- test double isolates the review RPC authorization boundary.
      return;
    end
    $$;

    insert into public.profiles(id, platform_role, is_active) values
      ('${CUSTOMER}', 'customer', true),
      ('${OWNER}', 'business_user', true),
      ('${UNRELATED_OWNER}', 'business_user', true),
      ('${PARTNER}', 'growth_partner', true),
      ('${INACTIVE_OWNER}', 'business_user', true);
    insert into public.organization_members(organization_id, user_id, role, status) values
      ('${ORG}', '${OWNER}', 'owner', 'active'),
      ('${OTHER_ORG}', '${UNRELATED_OWNER}', 'owner', 'active'),
      ('${ORG}', '${INACTIVE_OWNER}', 'owner', 'inactive');
    insert into public.salons(id, organization_id) values ('${SALON}', '${ORG}');
    insert into public.growth_partners(id, user_id) values ('${PARTNER_ID}', '${PARTNER}');
    insert into public.salon_setup_proposals(id, salon_id, growth_partner_id, status, payload)
      values ('${PROPOSAL}', '${SALON}', '${PARTNER_ID}', 'approved', '{"template":"modern"}'::jsonb);
  `);
  await db.exec(reviewFunction);
  await db.exec(invitedByIndexMigration);
  await db.exec(invitedByIndexMigration);
  return db;
}

async function withinRolledBackTransaction(db, userId, callback) {
  await db.exec(`set "request.jwt.claim.sub" = '${userId}'`);
  await db.exec("begin");
  try {
    return await callback();
  } finally {
    await db.exec("rollback; reset \"request.jwt.claim.sub\"");
  }
}

test("review_salon_setup permits only an active owner of the proposal salon to publish", async () => {
  const db = await setupDatabase();
  try {
    const index = await db.query(`
      select indexname from pg_indexes
      where schemaname = 'public'
        and tablename = 'organization_members'
        and indexname = 'organization_members_invited_by_idx'
    `);
    assert.equal(index.rows.length, 1, "invited_by index must be created exactly once");

    const result = await withinRolledBackTransaction(db, OWNER, () =>
      db.query("select public.review_salon_setup($1, 'publish') as status", [PROPOSAL]),
    );
    assert.equal(result.rows[0].status, "published");

    const persisted = await db.query("select status from public.salon_setup_proposals where id = $1", [PROPOSAL]);
    assert.equal(persisted.rows[0].status, "approved", "test mutations must always be rolled back");
  } finally {
    await db.close();
  }
});

for (const [label, userId] of [
  ["customer", CUSTOMER],
  ["growth partner", PARTNER],
  ["unrelated owner", UNRELATED_OWNER],
  ["inactive owner membership", INACTIVE_OWNER],
]) {
  test(`review_salon_setup denies ${label} publish`, async () => {
    const db = await setupDatabase();
    try {
      await assert.rejects(
        () => withinRolledBackTransaction(db, userId, () =>
          db.query("select public.review_salon_setup($1, 'publish')", [PROPOSAL]),
        ),
        /Shop Owner permission required/i,
      );
    } finally {
      await db.close();
    }
  });
}
