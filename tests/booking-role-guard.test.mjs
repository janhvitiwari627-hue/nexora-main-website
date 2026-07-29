import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app/nexora-app.tsx", import.meta.url), "utf8");

test("anonymous booking redirects to an empty Customer login with a safe return path", () => {
  assert.match(app, /if \(!authState\.session\)[\s\S]*?navigate\(customerLoginPath\)/);
  assert.match(app, /\/login\?role=customer&returnTo=/);
  assert.match(app, /const \[email, setEmail\] = useState\(""\)/);
  assert.match(app, /const \[password, setPassword\] = useState\(""\)/);
});

test("Customer role can enter booking while non-Customer roles see switch-account UX", () => {
  assert.match(app, /if \(authState\.role === "customer"\)[\s\S]*?intent=book/);
  assert.match(app, /setRoleMismatch\(true\)/);
  assert.match(app, /Booking is only available for Customer accounts\. Please sign out and log in with a Customer account\./);
  assert.match(app, /Sign out and continue as Customer/);
  assert.match(app, /Back to salon/);
  assert.match(app, /Go to my dashboard/);
});

test("switching accounts signs out before opening Customer login", () => {
  assert.match(app, /await signOut\(customerLoginPath\)/);
  assert.match(app, /setAuthState\(\{ loading: false, session: null \}\)[\s\S]*?await getClient\(\)\?\.auth\.signOut\(\)[\s\S]*?navigate\(destination\)/);
  assert.match(app, /profile\.platform_role === "customer" && returnTo/);
});

test("booking guard does not alter roles or payment contracts", () => {
  assert.doesNotMatch(app, /\.from\("profiles"\)\s*\.update/);
  assert.doesNotMatch(app, /updateUser\([\s\S]*platform_role/);
  assert.doesNotMatch(app, /Razorpay|razorpay|payment_intent/);
});
