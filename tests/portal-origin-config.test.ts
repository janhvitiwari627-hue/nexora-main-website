import assert from "node:assert/strict";
import test from "node:test";
import { resolvePortalOrigin } from "../config/portalOrigins";

const managedVariables = [
  "NEXORA_CUSTOMER_PWA_ORIGIN",
  "NEXORA_OWNER_PWA_ORIGIN",
  "NEXORA_PARTNER_PWA_ORIGIN",
  "NEXORA_TEMPLATE_PWA_ORIGIN",
  "GROWTH_PARTNER_APP_ORIGIN",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function withEnvironment(values: Partial<Record<(typeof managedVariables)[number], string>>, callback: () => void) {
  const before = Object.fromEntries(managedVariables.map((name) => [name, process.env[name]]));
  try {
    for (const name of managedVariables) delete process.env[name];
    Object.assign(process.env, values);
    callback();
  } finally {
    for (const name of managedVariables) {
      const value = before[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("required PWA origins fail closed when missing", () => {
  withEnvironment({}, () => assert.throws(() => resolvePortalOrigin("customer"), /is required/));
});

test("origins must be origin-only absolute HTTPS URLs", () => {
  for (const value of ["http://customer.example.com", "//customer.example.com", "https://customer.example.com/path", "javascript:alert(1)"]) {
    withEnvironment({ NEXORA_CUSTOMER_PWA_ORIGIN: value }, () => {
      assert.throws(() => resolvePortalOrigin("customer"), /absolute HTTPS|origin-only/);
    });
  }
});

test("approved Partner alias remains compatible but conflicts fail closed", () => {
  withEnvironment({ GROWTH_PARTNER_APP_ORIGIN: "https://partner.example.com" }, () => {
    assert.equal(resolvePortalOrigin("partner"), "https://partner.example.com");
  });
  withEnvironment({
    NEXORA_PARTNER_PWA_ORIGIN: "https://partner.example.com",
    GROWTH_PARTNER_APP_ORIGIN: "https://other.example.com",
  }, () => assert.throws(() => resolvePortalOrigin("partner"), /must resolve to the same origin/));
});

test("self-referential deployment origins are rejected to prevent loops", () => {
  withEnvironment({
    NEXORA_OWNER_PWA_ORIGIN: "https://preview.example.com",
    VERCEL_URL: "preview.example.com",
  }, () => assert.throws(() => resolvePortalOrigin("owner"), /must not point back/));
});

test("Template origin is optional and validated when configured", () => {
  withEnvironment({}, () => assert.equal(resolvePortalOrigin("template"), undefined));
  withEnvironment({ NEXORA_TEMPLATE_PWA_ORIGIN: "https://template.example.com" }, () => {
    assert.equal(resolvePortalOrigin("template"), "https://template.example.com");
  });
});
