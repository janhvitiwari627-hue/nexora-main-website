/**
 * SMOKE TEST — Landing refactor (src/screens/landing/*).
 *
 * Mounts the REAL Landing component (welcome + published dashboard) in jsdom
 * and drives the REAL lazy-loading paths: dashboard shell chunk, tab
 * switching, the New Appointment modal, and forcedActiveTab (the App.tsx
 * screens 18–25 contract). Nothing is mocked except browser APIs jsdom lacks.
 *
 * jsdom caveat (verified against the pre-refactor monolith, see
 * LANDING_REFACTOR_COMPLETION_REPORT.md): framer-motion exit animations never
 * complete in jsdom, so AnimatePresence keeps the previous tab mounted and
 * mode="wait" can gate a *second* consecutive switch. The original monolith
 * exhibits the same (worse) behavior, so every tab scenario below mounts from
 * a fresh tree — which also matches how each lazy path loads in a browser.
 */
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// Supply Vite's import.meta.env to app modules when running under node/tsx.
globalThis.__VITE_ENV__ = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
await import('./lib/vite-env-shim.mjs');

// ---- DOM bootstrap (before React/component imports) ----
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, dispatchEvent() { return false; },
});
dom.window.matchMedia = globalThis.matchMedia;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { render, cleanup, act, fireEvent } = await import('@testing-library/react');
const Landing = (await import('../src/screens/Landing.tsx')).default;
const { initialData } = await import('../src/types.ts');
const { AuthProvider } = await import('../src/lib/useAuth.ts');
const { AuthModalProvider } = await import('../src/components/AuthModalProvider.tsx');

const settle = async (rounds = 12) => {
  for (let i = 0; i < rounds; i += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 12)); });
  }
};

const mountLanding = (props) => render(
  React.createElement(AuthProvider, null,
    React.createElement(AuthModalProvider, null, React.createElement(Landing, props))),
);

let passed = 0;
const ok = (msg) => { passed += 1; console.log(`  ✓ ${msg}`); };

try {
  // ---------- 1) Welcome screen (unpublished) ----------
  {
    const r = mountLanding({
      data: { ...initialData, publishState: 'draft' },
      setData: () => {}, onNext: () => {}, goToStep: () => {},
      onOpenStaffManagement: () => {}, onThemeChange: () => {},
    });
    await settle(3);
    assert.match(r.container.textContent, /Create Your Salon Website/);
    assert.match(r.container.textContent, /Start Onboarding Wizard/);
    assert.equal(r.container.querySelector('[data-testid="screen-skeleton"]'), null);
    ok('welcome screen renders (dashboard never mounts while unpublished)');
    cleanup();
  }

  // ---------- 2) Published dashboard: shell + lazy Overview tab ----------
  {
    const r = mountLanding({
      data: { ...initialData, publishState: 'published' },
      setData: () => {}, onNext: () => {}, goToStep: () => {},
      onOpenStaffManagement: () => {}, onThemeChange: () => {},
    });
    await settle();
    assert.match(r.container.textContent, /New Appointment/, 'sidebar CTA present');
    assert.match(r.container.textContent, /Premium Dashboard/, 'sidebar brand block present');
    assert.equal(r.container.querySelectorAll('[data-testid="tab-skeleton"]').length, 0);
    assert.match(r.container.textContent, /Overview/, 'overview content mounted');
    ok('dashboard shell + lazy OverviewTab mount through DashboardContext');
    cleanup();
  }

  // ---------- 3) Lazy Services tab (fresh mount, real click) ----------
  {
    const r = mountLanding({
      data: { ...initialData, publishState: 'published' },
      setData: () => {}, onNext: () => {}, goToStep: () => {},
      onOpenStaffManagement: () => {}, onThemeChange: () => {},
    });
    await settle();
    const servicesBtn = [...r.container.querySelectorAll('nav button')].find((b) => /Services/.test(b.textContent));
    assert.ok(servicesBtn, 'Services nav button exists');
    await act(async () => { fireEvent.click(servicesBtn); });
    await settle();
    assert.equal(r.container.querySelectorAll('[data-testid="tab-skeleton"]').length, 0);
    assert.match(r.container.textContent, /Services & Catalog|Add Service/i, 'services tab content mounted');
    ok('lazy ServicesTab loads on real tab click');
    cleanup();
  }

  // ---------- 4) New Appointment modal (context-wired) ----------
  {
    const r = mountLanding({
      data: { ...initialData, publishState: 'published' },
      setData: () => {}, onNext: () => {}, goToStep: () => {},
      onOpenStaffManagement: () => {}, onThemeChange: () => {},
    });
    await settle();
    const newApptBtn = [...r.container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'New Appointment');
    await act(async () => { fireEvent.click(newApptBtn); });
    await settle(3);
    assert.match(r.container.textContent, /Add Salon Booking/, 'new-appointment modal opened');
    ok('NewAppointmentModal opens (form state + handler via context)');
    cleanup();
  }

  // ---------- 5) forcedActiveTab contract (App.tsx screens 18–25) ----------
  for (const tab of ['share', 'payments', 'bookings']) {
    const r = mountLanding({
      data: { ...initialData, publishState: 'published' },
      setData: () => {}, onNext: () => {}, goToStep: () => {},
      onOpenStaffManagement: () => {}, onThemeChange: () => {},
      forcedActiveTab: tab,
    });
    await settle();
    assert.equal(r.container.querySelectorAll('[data-testid="tab-skeleton"]').length, 0, `${tab}: no stuck skeleton`);
    const marker = {
      share: /Marketing templates|share|referral/i,
      payments: /Verified|Refunded|Revenue/i,
      bookings: /Booking|Planner/i,
    }[tab];
    assert.match(r.container.textContent, marker, `${tab} tab content mounted`);
    ok(`forcedActiveTab="${tab}" renders ${tab} tab (props contract intact)`);
    cleanup();
  }

  console.log(`\nSMOKE OK — ${passed} checks passed`);
} catch (err) {
  console.error('\nSMOKE FAILED:', err.message);
  process.exitCode = 1;
}
