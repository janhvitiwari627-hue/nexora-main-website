/**
 * Homepage Phase 1 — Section 04 (App Directory) contract tests.
 *
 * Locks the Section 04 deliverables and their hard rules:
 *
 *   • ONE upgraded section (stable id=nexora-apps), never a duplicate.
 *   • EXACTLY six cards with the contract routes — Job Portal included as a
 *     first-class Nexora app, never excluded.
 *   • Auth-aware navigation: logged-out (safe login gate + returnTo),
 *     auth-loading (no role-gated flash) and logged-in (open directly).
 *   • No iframe, no fake route, no hardcoded app origin, no parallel auth.
 *   • Public copy carries no RLS/database/commission internals — backend
 *     behaviour is untouched (routes, middleware and rewrites unchanged).
 *   • Hero secondary CTA still smooth-scrolls to #nexora-apps.
 *   • Legacy card contract preserved: canonical PORTAL_PATHS props on the
 *     RoleCard usages (same component upgraded in place).
 *
 * Static-source assertions. No network, no React renderer.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

const nexoraApp = await read("app/nexora-app.tsx");
const nextConfig = await read("next.config.ts");
const middleware = await read("middleware.ts");

const sectionStart = nexoraApp.indexOf('id="nexora-apps"');
const sectionBlock = nexoraApp.slice(sectionStart, nexoraApp.indexOf("function RoleCard("));
const roleCard = nexoraApp.slice(nexoraApp.indexOf("function RoleCard("), nexoraApp.indexOf("function RoleEntry("));

// ---------------------------------------------------------------------------
// 1 — One upgraded section, stable id, hero scroll target intact
// ---------------------------------------------------------------------------

test("the apps section exists exactly once with the stable id", () => {
  const ids = nexoraApp.match(/id="nexora-apps"/g) ?? [];
  assert.equal(ids.length, 1, "no duplicate apps section");
  assert.match(nexoraApp, /<h2>Aap Nexora Par Kya Karna Chahte Hain\?<\/h2>/);
  assert.match(sectionBlock, /scroll-mt-24/);
});

test("Hero secondary CTA still smooth-scrolls to the section", () => {
  assert.match(nexoraApp, /Nexora Apps Dekhein/);
  assert.match(nexoraApp, /href="#nexora-apps"/);
  assert.match(nexoraApp, /scrollToAppsSection/);
});

// ---------------------------------------------------------------------------
// 2 — Exactly six cards, exact contract routes
// ---------------------------------------------------------------------------

test("exactly six cards with the exact contract titles", () => {
  const cards = sectionBlock.match(/<RoleCard\b/g) ?? [];
  assert.equal(cards.length, 6, "exactly six cards");
  for (const title of [
    "Customer App",
    "Shop Owner App",
    "Growth Partner App",
    "Template Builder",
    "Beauty Distributor",
    "Job Portal",
  ]) {
    assert.ok(sectionBlock.includes(`title="${title}"`), `${title} card present`);
  }
  // Job Portal is never treated as "a different platform".
  const jobsBlock = sectionBlock.slice(sectionBlock.indexOf('title="Job Portal"'));
  assert.ok(!/different platform|external platform|third[- ]party/i.test(jobsBlock.slice(0, 300)));
});

test("card routes match the contract and stay canonical", () => {
  assert.match(sectionBlock, /path=\{PORTAL_PATHS\.customer\}/);
  assert.match(sectionBlock, /path=\{PORTAL_PATHS\.business_user\}/);
  assert.match(sectionBlock, /path=\{PORTAL_PATHS\.growth_partner\}/);
  assert.match(sectionBlock, /path=\{TEMPLATE_PATH\}/);
  assert.match(sectionBlock, /path="\/distributors-beauty-industry"/);
  assert.match(sectionBlock, /path="\/job-portal"/);
  // Growth Partner keeps its contract entry route for signed-out visitors.
  assert.match(sectionBlock, /entryPath="\/growth-partner"/);
  // No retyped portal literals and no invented routes.
  assert.doesNotMatch(sectionBlock, /path="\/app\//);
  assert.doesNotMatch(sectionBlock, /path="\/(app-store|apps|marketplace)/);
});

// ---------------------------------------------------------------------------
// 3 — Auth states: logged-out, loading, logged-in (+ safe returnTo)
// ---------------------------------------------------------------------------

test("logged-out / loading / logged-in states are all expressed", () => {
  assert.match(sectionBlock, /role="status"/);
  assert.match(sectionBlock, /aria-live="polite"/);
  assert.match(sectionBlock, /Checking your Nexora account…/);
  assert.match(sectionBlock, /You are signed out\./);
  assert.match(sectionBlock, /Signed in as \$\{ROLE_LABELS\[authState\.role\]/);
  // Offline is acknowledged without hiding the cards.
  assert.match(sectionBlock, /!online && /);
  // Cards receive the auth state.
  assert.match(sectionBlock, /authLoading=\{authState\.loading\}/);
  assert.match(sectionBlock, /isAuthenticated=\{Boolean\(authState\.session && authState\.role\)\}/);
});

test("RoleCard gates on auth correctly and keeps public apps always open", () => {
  assert.match(roleCard, /const waiting = Boolean\(protectedApp\) && Boolean\(authLoading\);/);
  assert.match(roleCard, /if \(waiting\) return;/);
  assert.match(roleCard, /isAuthenticated \|\| !protectedApp \? path : \(entryPath \?\? path\)/);
  assert.match(roleCard, /if \(external\) window\.location\.assign\(target\);/);
  assert.match(roleCard, /disabled=\{waiting\}/);
  assert.match(roleCard, /!protectedApp\s*\? "Open to everyone"/);
  assert.match(roleCard, /"Nexora login required"/);
  assert.match(roleCard, /"Signed in — opens directly"/);
});

test("signed-out protected apps land on the existing safe login gates", () => {
  // SPA router still serves the legacy role entries (safe returnTo flows).
  assert.match(nexoraApp, /path === "\/customer" \|\| path === "\/owner" \|\| path === "\/growth-partner"/);
  assert.match(nexoraApp, /content = <RoleEntry/);
  assert.match(nexoraApp, /returnTo=\$\{encodeURIComponent\(portalPath\)\}/);
  // PortalGateway keeps the login redirect with the return path.
  assert.match(nexoraApp, /\/auth\/login\?role=\$\{roleQueryForPortalRole\(loginRole\)\}&returnTo=/);
  // No parallel auth invented in the section.
  assert.doesNotMatch(sectionBlock, /signIn|signUp|createClient|supabase/i);
});

// ---------------------------------------------------------------------------
// 4 — Hard rules: no iframe / fake route / hardcoded origin; copy public-safe
// ---------------------------------------------------------------------------

test("no iframe, no hardcoded app origin, no fake routes", () => {
  assert.doesNotMatch(sectionBlock, /<iframe/);
  assert.doesNotMatch(sectionBlock, /https?:\/\//);
  assert.doesNotMatch(roleCard, /https?:\/\//);
  // Every card route is a real, wired surface.
  assert.match(nextConfig, /source: "\/app\/customer"/);
  assert.match(nextConfig, /source: "\/app\/owner"/);
  assert.match(nextConfig, /source: "\/app\/partner"/);
  assert.match(nextConfig, /source: "\/app\/template"/);
  assert.match(nextConfig, /JOB_PORTAL_BASE = "\/job-portal"/);
  assert.match(nextConfig, /DISTRIBUTORS_BEAUTY_INDUSTRY_BASE = "\/distributors-beauty-industry"/);
  assert.match(middleware, /\/growth-partner/);
  assert.match(middleware, /308/);
});

test("public copy drops RLS/database/commission internals", () => {
  assert.doesNotMatch(sectionBlock, /\bRLS\b/);
  assert.doesNotMatch(sectionBlock, /verify_business_rules/);
  assert.doesNotMatch(sectionBlock, /commissions 10% of platform fee/);
  assert.doesNotMatch(sectionBlock, /owner payout daily 22:00 IST/);
  assert.doesNotMatch(sectionBlock, /held 7 days/);
});

// ---------------------------------------------------------------------------
// 5 — Accessibility + existing wiring untouched
// ---------------------------------------------------------------------------

test("cards are keyboard/screen-reader accessible", () => {
  assert.match(roleCard, /aria-hidden="true">\{icon\}/);
  assert.match(roleCard, /aria-label=\{\`\$\{action\} — \$\{title\}\`\}/);
  assert.match(roleCard, /focus-visible:outline-2/);
  assert.match(roleCard, /type="button"/);
});

test("homepage shell, header and six-app routing stay intact", () => {
  assert.match(nexoraApp, /content = <HomePage/);
  assert.match(nexoraApp, /import \{ BackToMainWebsiteButton \}/);
  assert.match(nexoraApp, /isPortalPath\(path\)/);
  assert.match(nexoraApp, /function RoleCard\(\{/);
  assert.match(nexoraApp, /navigate\(PORTAL_PATHS\.customer\)/);
  assert.doesNotMatch(nexoraApp, /<Header\b/);
  assert.doesNotMatch(nexoraApp, /buildSharedNavigation|useNexoraAuthState|NEXORA_APPS\b/);
});
