import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");

test("public salon pages hand booking to the Customer PWA", () => {
  assert.match(app, /customerPortalBookingPath/);
  assert.match(app, /\/app\/customer\/\?/);
  assert.match(app, /Continue in Customer app/);
  assert.match(app, /Bookings, payment, history, reviews, and support are owned by the Customer PWA/);
});

test("Main Website does not duplicate the customer booking/payment implementation", () => {
  assert.doesNotMatch(app, /create_customer_booking/);
  assert.doesNotMatch(app, /razorpay-create-order/);
  assert.doesNotMatch(app, /BookingPage/);
  assert.doesNotMatch(app, /RazorpayOrder/);
  assert.match(app, /LegacyBookingHandoff/);
});

test("portal access is role-gated by the permanent profile", () => {
  assert.match(app, /\.from\("profiles"\)/);
  assert.match(app, /platform_role,is_active/);
  assert.match(app, /profile\.is_active !== true/);
  assert.match(app, /requestedRole && requestedRole !== profileRole/);
  assert.match(app, /navigate\(portalPathForRole\(profileRole\)\)/);
});

test("portal links carry safe return paths only", () => {
  assert.match(app, /requestedReturnTo\?\.startsWith\("\/"\)/);
  assert.match(app, /!requestedReturnTo\.startsWith\("\/\/"\)/);
  assert.doesNotMatch(app, /access_token|refresh_token|service_role/i);
});
