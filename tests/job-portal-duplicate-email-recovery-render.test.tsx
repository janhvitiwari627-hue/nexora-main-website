// Job Portal — duplicate-email recovery UI render test.
//
// Executes the new presentational code with a real React render
// (react-dom/server — no browser, no Supabase): the recovery actions a refused
// sign-up now offers, and the sign-in screen it routes the user to.
//
// Run with: node --import tsx --test tests/job-portal-duplicate-email-recovery-render.test.tsx

import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SignupConflictRecovery } from "../job-portal/src/components/auth/SignupConflictRecovery";
import { LoginScreen } from "../job-portal/src/components/auth/LoginScreen";
import { PortalEmailConflictError } from "../job-portal/src/utils/errors";

const noop = () => undefined;

/** Class list of a portal-selector button, found by its visible label. */
function tabClass(markup: string, label: string): string {
  const labelIndex = markup.indexOf(`>${label}</span>`);
  assert.ok(labelIndex > -1, `${label} tab must render`);
  // The button's own class attribute — not the lucide icon rendered inside it.
  const buttonIndex = markup.lastIndexOf("<button", labelIndex);
  assert.ok(buttonIndex > -1, `${label} tab must be a button`);
  const classIndex = markup.indexOf('class="', buttonIndex);
  assert.ok(classIndex > -1 && classIndex < labelIndex, `${label} tab must carry a class`);
  return markup.slice(classIndex + 7, markup.indexOf('"', classIndex + 7));
}

test("a duplicate email renders the one-tap way out instead of a dead end", () => {
  const conflict = new PortalEmailConflictError({
    email: "jane@example.com",
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: true,
  });

  const html = renderToStaticMarkup(
    <SignupConflictRecovery conflict={conflict} onSignInInstead={noop} />,
  );

  assert.match(html, /Sign in instead/);
  // An already-verified account is not offered a verification link.
  assert.doesNotMatch(html, /Send verification email/);
});

test("an unverified account is offered a verification link first", () => {
  const conflict = new PortalEmailConflictError({
    email: "jane@example.com",
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: false,
  });

  const html = renderToStaticMarkup(
    <SignupConflictRecovery conflict={conflict} onSignInInstead={noop} onResendVerification={noop} />,
  );

  assert.match(html, /Send verification email/);
  assert.match(html, /Sign in instead/);
  const resendIndex = html.indexOf("Send verification email");
  const signInIndex = html.indexOf("Sign in instead");
  assert.ok(resendIndex < signInIndex, "the verification link is the primary action");
});

test("confirmation state unknown (migration not applied) still offers sign-in", () => {
  const conflict = new PortalEmailConflictError({
    email: "ops@salon.com",
    existingRole: "employer",
    requestedRole: "employer",
    emailConfirmed: null,
  });

  const html = renderToStaticMarkup(
    <SignupConflictRecovery conflict={conflict} onSignInInstead={noop} onResendVerification={noop} />,
  );

  assert.match(html, /Sign in instead/);
  assert.doesNotMatch(html, /Send verification email/);
});

test("with no recovery callbacks wired the component renders nothing", () => {
  const conflict = new PortalEmailConflictError({
    email: "jane@example.com",
    existingRole: "job_seeker",
    requestedRole: "seeker",
    emailConfirmed: true,
  });
  assert.equal(renderToStaticMarkup(<SignupConflictRecovery conflict={conflict} />), "");
});

test("the sign-in screen opens prefilled with the email, portal and reason", () => {
  const html = renderToStaticMarkup(
    <LoginScreen
      onLoginSuccess={noop}
      onSignUp={noop}
      onForgotPassword={noop}
      initialEmail="jane@example.com"
      initialRole="employer"
      notice='An account for jane@example.com already exists on the Employer portal. Sign in to continue, or use "Forgot Password?" if you do not remember your password.'
    />,
  );

  assert.match(html, /value="jane@example\.com"/, "the email is prefilled, never retyped");
  assert.match(html, /already exists on the Employer portal/, "the reason is explained");
  assert.match(html, /Forgot Password\?/, "the password escape hatch is one tap away");
  // The portal tab matching the existing account is the selected one.
  const selected = tabClass(html, "Employer");
  const unselected = tabClass(html, "Job Seeker");
  assert.match(selected, /bg-white text-\[#8e004b\]/, "the Employer portal is preselected");
  assert.doesNotMatch(unselected, /bg-white text-\[#8e004b\]/, "the Job Seeker portal is not");
});

test("without a prefill the sign-in screen is untouched", () => {
  const html = renderToStaticMarkup(
    <LoginScreen onLoginSuccess={noop} onSignUp={noop} onForgotPassword={noop} />,
  );
  assert.match(html, /value=""/);
  assert.doesNotMatch(html, /already exists on the/);
});
