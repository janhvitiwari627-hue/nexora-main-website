import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260812_phase7_shared_location_security.sql", import.meta.url), "utf8");
const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const routes = await readFile(new URL("../app/lib/portalRoutes.ts", import.meta.url), "utf8");
const access = await readFile(new URL("../packages/auth/src/access.ts", import.meta.url), "utf8");
const roles = await readFile(new URL("../packages/auth/src/roles.ts", import.meta.url), "utf8");
const jobBackend = await readFile(new URL("../job-portal/src/services/backend.ts", import.meta.url), "utf8");
const jobApp = await readFile(new URL("../job-portal/src/App.tsx", import.meta.url), "utf8");
const buildScript = await readFile(new URL("../scripts/build-verified.sh", import.meta.url), "utf8");
const jobBuildScript = await readFile(new URL("../scripts/build-job-portal.sh", import.meta.url), "utf8");

async function sourceTree(relative) {
  const root = new URL(relative, import.meta.url);
  const out = [];
  async function walk(url) {
    for (const entry of await readdir(url, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
      if (entry.isDirectory()) await walk(child);
      else if (/\.(?:ts|tsx|js|mjs|patch|sh)$/.test(entry.name)) out.push(await readFile(child, "utf8"));
    }
  }
  await walk(root);
  return out.join("\n");
}

const frontendSource = [
  await sourceTree("../app/"),
  await sourceTree("../packages/"),
  await sourceTree("../job-portal/src/"),
].join("\n");
const integrationSource = await sourceTree("../integration-packages/");

// Private GPS RLS ----------------------------------------------------------------

test("private location is one auth.users.id row with RLS enabled", () => {
  assert.match(migration, /user_id\s+uuid primary key references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /alter table public\.user_private_locations enable row level security/);
  assert.match(migration, /comment on table public\.user_private_locations[\s\S]*Private last real device GPS fix/);
});

test("users can read/write/delete only their own private location", () => {
  for (const policy of [
    "user_private_location_read_own",
    "user_private_location_insert_own",
    "user_private_location_update_own",
    "user_private_location_delete_own",
  ]) assert.match(migration, new RegExp(policy));
  assert.match(migration, /using \(user_id = auth\.uid\(\)\)/);
  assert.match(migration, /with check \(user_id = auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /user_private_locations[\s\S]{0,300}to anon/);
});

test("save RPC derives identity from auth.uid and accepts no target user", () => {
  const signature = migration.match(/create or replace function public\.save_my_private_location\(([\s\S]*?)\)\s*returns void/i)?.[1] ?? "";
  assert.doesNotMatch(signature, /user_id|p_user/);
  assert.match(migration, /caller uuid := auth\.uid\(\)/);
  assert.match(migration, /insert into public\.user_private_locations[\s\S]*caller/);
  assert.match(migration, /where excluded\.captured_at >= public\.user_private_locations\.captured_at/);
});

test("Owner and Partner roles receive no cross-user private GPS policy", () => {
  const privateSection = migration.split("-- 2. BUSINESS/SALON COORDINATES")[0];
  assert.doesNotMatch(privateSection, /platform_role|business_user|growth_partner|is_admin|can_manage_salon/);
  assert.doesNotMatch(privateSection, /service_role.*to authenticated/i);
});

// Separate approved business locations -------------------------------------------

test("business location is a separate approval-gated table", () => {
  assert.match(migration, /create table if not exists public\.business_locations/);
  assert.match(migration, /approval_status\s+text not null default 'pending'/);
  assert.match(migration, /approval_status in \('pending','approved','rejected'\)/);
  assert.match(migration, /business_location_public_approved/);
  assert.match(migration, /approval_status = 'approved'/);
  assert.match(migration, /s\.verified = true[\s\S]*s\.is_active = true[\s\S]*w\.is_published = true/);
  assert.match(migration, /grant select \(salon_id, slug, template_key, config, is_published, published_at\)[\s\S]*salon_public_websites to anon, authenticated/);
});

test("Owner can submit only for an owned salon and submission resets approval", () => {
  assert.match(migration, /not private\.can_manage_salon_settings\(p_salon_id\)/);
  assert.match(migration, /approval_status = 'pending'/);
  assert.match(migration, /approved_by = null/);
  assert.match(migration, /approved_at = null/);
  assert.match(migration, /revoke all on table public\.business_locations from public, anon, authenticated/);
});

test("only backend service role can approve public business coordinates", () => {
  assert.match(migration, /revoke all on function public\.review_business_location\(uuid,boolean,text\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.review_business_location\(uuid,boolean,text\) to service_role/);
  assert.doesNotMatch(app, /review_business_location|submit_my_business_location/);
});

test("legacy salon coordinate columns are removed from browser grants", () => {
  assert.match(migration, /revoke select on table public\.salons from anon, authenticated/);
  assert.match(migration, /column_name not in \('latitude','longitude','lat','lng','location_latitude','location_longitude'\)/);
  assert.match(migration, /revoke update on table public\.salons from anon, authenticated/);
  assert.match(app, /Legacy salons\.latitude\/longitude are intentionally not readable/);
});

// Role security ------------------------------------------------------------------

test("Customer cannot read Owner or Partner data — RLS and access gates stay server-backed", () => {
  assert.match(app, /no role-home redirects/);
  assert.doesNotMatch(app, /requestedRole && requestedRole !== profileRole/);
  assert.match(access, /requireRole\("business_user"\)/);
  assert.match(access, /requireRole\("growth_partner"\)/);
  assert.match(access, /requireRole\("customer"\)/);
});

test("Owner cannot manage another owner's business", () => {
  assert.match(access, /owner_salon_ids/);
  assert.match(migration, /private\.can_manage_salon_settings\(p_salon_id\)/);
  assert.match(app, /requireOwnerWorkspace\(client\)/);
  assert.doesNotMatch(access, /salonId:\s*string/);
});

test("Partner cannot gain Owner or Admin access from frontend flags", () => {
  assert.match(roles, /profiles\.platform_role.*ONLY role authority/i);
  assert.match(roles, /admin.*never self-service/i);
  assert.match(app, /requirePartnerMembership\(client\)/);
  assert.doesNotMatch(frontendSource, /localStorage\.setItem\([^)]*(?:role|admin|owner|partner)/i);
  assert.doesNotMatch(frontendSource, /sessionStorage\.setItem\([^)]*(?:role|admin|owner|partner)/i);
  assert.doesNotMatch(jobBackend, /nexora_pending_role|applyPendingOAuthRole/);
  assert.match(jobApp, /job_user_roles row; browser metadata\/role flags are ignored/);
});

test("Template route is Owner-gated, not a standalone role flag", () => {
  assert.match(routes, /if \(isTemplatePath\(path\)\) return "business_user"/);
  assert.match(app, /mountKey === "template"/);
  assert.match(app, /requireOwnerWorkspace\(client\)/);
});

// Credential/fallback hygiene -----------------------------------------------------

test("frontend has no fake auth or privileged-key usage", () => {
  assert.doesNotMatch(frontendSource, /fakeSession|mockSession|mockAuth|demoUser/i);
  assert.doesNotMatch(frontendSource, /SUPABASE_SERVICE_ROLE_KEY|service_role_key|sk_live_|rzp_live_|RAZORPAY_KEY_SECRET/i);
});

test("repository contains no exposed JWT and old patches are scrubbed", () => {
  const jwt = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;
  assert.doesNotMatch(frontendSource, jwt);
  assert.doesNotMatch(integrationSource, jwt);
  assert.match(integrationSource, /REMOVED_HARDCODED_ANON_KEY/);
});

test("builds fail closed with no hardcoded Supabase fallback", () => {
  for (const source of [buildScript, jobBuildScript]) {
    assert.doesNotMatch(source, /placeholder\.supabase|placeholder-(?:anon|publishable)/i);
    assert.match(source, /qwaehqsmodekbgvnaavz/);
  }
  assert.match(buildScript, /NEXT_PUBLIC_SUPABASE_URL:\?/);
  assert.match(jobBuildScript, /VITE_SUPABASE_URL:\?/);
});
