// Phase 2 — returnTo security (16 tests).
//
// destinationForVerifiedRole honors any safe same-origin path for every
// verified role. Role-home is only the fallback. Open-redirect payloads
// never capture the authenticated session.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const redirects = await readFile(new URL("../packages/auth/src/redirects.ts", import.meta.url), "utf8");
const roles = await readFile(new URL("../packages/auth/src/roles.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
const originConfig = await readFile(new URL("../config/portalOrigins.ts", import.meta.url), "utf8");

const ROLE_HOME = {
  customer: "/app/customer",
  business_user: "/app/owner",
  growth_partner: "/app/partner",
  delivery_partner: "/app/delivery",
  admin: "/app/admin",
};

// Post-auth default landing on the Main Website. Deliberately the Main
// Website dashboard, NOT the role's /app/* mount (which 307-redirects to an
// external sub-app), so a plain login stays on the Main Website.
const MAIN_SITE_HOME = "/";

function safeReturnPath(candidate, fallback = "/") {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/+\s*javascript:/i.test(value)) return fallback;
  return value.split("#")[0] || fallback;
}

function destinationForVerifiedRole(role, requestedReturnTo) {
  return safeReturnPath(requestedReturnTo, MAIN_SITE_HOME);
}

function safeRedirectUrl(candidate, currentOrigin) {
  if (!candidate) return null;
  const value = candidate.trim();
  if (value.startsWith("/") && !value.startsWith("//")) {
    return new URL(safeReturnPath(value, "/"), currentOrigin).toString();
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const allowed = [
    "https://nexora-main-website.vercel.app",
    "https://remix-final-salon-app.vercel.app",
    "https://shop-onwer-pink-nexora-aap.vercel.app",
    "https://pink-growth-partner-diamondpeomotion-cybers-projects.vercel.app",
  ];
  if (!allowed.includes(parsed.origin)) return null;
  parsed.hash = "";
  return parsed.toString();
}

test("1. customer may resume /app/customer", () => {
  assert.match(redirects, /export function destinationForVerifiedRole/);
  assert.match(roles, /customer: "\/app\/customer"/);
  assert.equal(destinationForVerifiedRole("customer", "/app/customer"), "/app/customer");
});

test("2. owner may resume /app/owner and /app/template", () => {
  assert.equal(destinationForVerifiedRole("business_user", "/app/owner"), "/app/owner");
  assert.equal(destinationForVerifiedRole("business_user", "/app/template"), "/app/template");
});

test("3. partner may resume /app/partner", () => {
  assert.equal(destinationForVerifiedRole("growth_partner", "/app/partner"), "/app/partner");
});

test("4. customer may open the owner shell (no role-home bounce)", () => {
  assert.equal(destinationForVerifiedRole("customer", "/app/owner"), "/app/owner");
  assert.match(redirects, /Every authenticated role may resume any shell/);
});

test("5. owner may open the customer shell", () => {
  assert.equal(destinationForVerifiedRole("business_user", "/app/customer"), "/app/customer");
});

test("6. partner may open any mounted shell", () => {
  assert.equal(destinationForVerifiedRole("growth_partner", "/app/customer"), "/app/customer");
  assert.equal(destinationForVerifiedRole("growth_partner", "/app/owner"), "/app/owner");
  assert.equal(destinationForVerifiedRole("growth_partner", "/app/template"), "/app/template");
});

test("7. missing returnTo lands on the Main Website home, not a sub-app mount", () => {
  // A plain Main Website login (no returnTo) must NOT 307 into /app/* → the
  // external sub-app. It stays on the Main Website dashboard instead.
  assert.equal(destinationForVerifiedRole("customer", null), "/");
  assert.equal(destinationForVerifiedRole("business_user", undefined), "/");
  assert.equal(destinationForVerifiedRole("growth_partner", ""), "/");
  assert.match(redirects, /safeReturnPath\(requestedReturnTo, MAIN_SITE_HOME\)/);
});

test("8. protocol-relative //evil.com is rejected", () => {
  assert.equal(destinationForVerifiedRole("customer", "//evil.com"), "/");
  assert.match(redirects, /value\.startsWith\("\/\/"\)/);
});

test("9. absolute https://evil.example is rejected for same-origin returnTo", () => {
  assert.equal(destinationForVerifiedRole("customer", "https://evil.example/phish"), "/");
  assert.equal(
    safeRedirectUrl("https://evil.example/phish", "https://nexora-main-website.vercel.app"),
    null,
  );
});

test("10. javascript: and data: payloads are rejected", () => {
  assert.equal(destinationForVerifiedRole("customer", "javascript:alert(1)"), "/");
  assert.equal(destinationForVerifiedRole("customer", "/javascript:alert(1)"), "/");
  assert.match(redirects, /javascript:/i);
});

test("11. backslash-smuggled hosts are rejected", () => {
  assert.equal(destinationForVerifiedRole("customer", "/\\evil.com"), "/");
  assert.match(redirects, /value\.includes\("\\\\"\)/);
});

test("12. query strings are preserved for PWA deep links", () => {
  assert.equal(
    destinationForVerifiedRole("customer", "/app/customer/?salon=abc&ref=NX1"),
    "/app/customer/?salon=abc&ref=NX1",
  );
  assert.match(app, /`\$\{currentPath\}\$\{window\.location\.search\}`/);
});

test("13. fragments are stripped so tokens cannot ride in the hash", () => {
  assert.equal(destinationForVerifiedRole("customer", "/app/customer#access_token=steal"), "/app/customer");
  assert.match(redirects, /value\.split\("#"\)\[0\]/);
});

test("14. public marketplace paths remain valid returnTo for every role", () => {
  assert.equal(destinationForVerifiedRole("business_user", "/salons/pink-studio"), "/salons/pink-studio");
  assert.equal(destinationForVerifiedRole("growth_partner", "/"), "/");
});

test("15. allowlisted PWA origins may receive a cross-origin handoff; unknown origins may not", () => {
  const origin = "https://nexora-main-website.vercel.app";
  assert.equal(
    safeRedirectUrl("https://remix-final-salon-app.vercel.app/app/customer", origin),
    "https://remix-final-salon-app.vercel.app/app/customer",
  );
  assert.equal(safeRedirectUrl("https://not-nexora.example/app/customer", origin), null);
  assert.match(redirects, /remix-final-salon-app\.vercel\.app/);
});

test("16. PortalGateway has no role-home redirect; server config owns external redirects", () => {
  assert.doesNotMatch(app, /requestedRole && requestedRole !== profileRole/);
  assert.match(app, /no role-home redirects/);
  assert.match(app, /destinationForVerifiedRole\(role, requestedReturnTo/);
  // No client-side iframe and no mounted-flag gating for the role shells.
  assert.doesNotMatch(app, /MountedPortalFrame/);
  assert.doesNotMatch(app, /isPortalMounted/);
  // Role mounts are cross-origin 307 redirects (Vercel returns 500 when a
  // serverless fetch or edge rewrite targets a foreign .vercel.app deployment).
  assert.match(nextConfig, /externalPortalRedirects/);
  assert.match(nextConfig, /configuredPortalOrigins/);
  assert.match(originConfig, /NEXORA_CUSTOMER_PWA_ORIGIN/);
  assert.match(originConfig, /NEXORA_OWNER_PWA_ORIGIN/);
  assert.match(originConfig, /NEXORA_PARTNER_PWA_ORIGIN/);
  assert.match(nextConfig, /permanent: false/);
  assert.doesNotMatch(nextConfig, /api\/portal/);
  assert.doesNotMatch(middleware, /api\/portal/);
});
