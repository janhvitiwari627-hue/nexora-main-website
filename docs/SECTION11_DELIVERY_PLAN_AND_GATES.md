# Section 11 — Delivery Plan & Gates

**Status:** Locked delivery baseline
**Applies to:** Main Website, Customer PWA, Owner PWA, Growth Partner PWA, and the shared Supabase backend

## 1. Purpose and governing rule

This section defines the ordered delivery plan for the Nexora platform and
the **exit gate** that must be passed before each phase may proceed to the
next. A phase is complete only when its exit gate has demonstrable, recorded
evidence — not when its code has merely been written.

Governing rules:

1. **No phase skipping.** Work on phase *N+1* must not begin until the exit
   gate for phase *N* is signed off with evidence.
2. **Evidence over assertion.** Every gate requires exact, reproducible
   evidence (commands, URLs, screenshots, test runs, SQL output) recorded in a
   report committed to this repository.
3. **No schema redesign during Phase 0.** Phase 0 freezes and inventories the
   world as it is. Changes belong to later phases.
4. **No client-authoritative money.** Any phase touching payments must prove
   that payment state is server/webhook-authoritative.
5. **Regression guard.** A later phase may not silently break an earlier
   gate; gate re-checks run at Phase 5 cutover and Phase 7 release.

## 2. Master phase table

| Phase | Scope | Exit gate |
|---|---|---|
| **0 — Freeze & Evidence** | Record commits/deployments; inventory all schema objects, policies, functions, buckets, env names, current screen/data mapping. No schema redesign. | Signed audit table: COMPLETE / PARTIAL / MISSING / BROKEN / DUPLICATE, with exact evidence per item. |
| **1 — Platform Shell** | Lock domain/path routing, PWA bases/scopes, shared env contract, auth storage, role redirects. | One login on the canonical origin routes each role correctly; direct-URL role tests pass. |
| **2 — Customer Core** | Remove production mocks; live catalog/service/staff/availability; booking list/detail/create/status. | Customer creates one idempotent booking visible only to self and the correct owner. |
| **3 — Owner Core** | Role/membership gate; salon/services/staff/hours/availability; booking operations; proposal approval. | Owner data publishes correctly; owner cannot access another salon. |
| **4 — Partner Core** | Real auth/profile; onboarding; website proposal; attribution; commission projections. | Partner sees only attributed shops; approval lock + attribution survive publish. |
| **5 — Website Cutover** | Remove duplicate private dashboards; route to apps; complete public marketplace surfaces. | Website public data equals approved backend; portal routes + deep links pass. |
| **6 — Payments/Finance** | 25/75 payment, webhook, ledger, refunds, disputes, 90/10 split, partner 1%, holds, payout jobs. | Reconciliation + negative/idempotency tests pass; no client-authoritative money. |
| **7 — Release** | Security, monitoring, backups, legal consent, production env/domain, pilot. | Golden journey + rollback drill pass in a production-like environment. |

## 3. Gate mechanics

### 3.1 Entry conditions

A phase may be started only when:

- The previous phase's exit gate is signed off in the gate tracking table
  below (status `PASSED`, with evidence link).
- The working branch builds: `npm run build` (or the repo's locked
  build/validate script) succeeds at the phase's starting commit.

### 3.2 Exit evidence standard

Each gate's evidence must include, at minimum:

- **What was tested** — exact URLs, roles, accounts-class (never real customer
  PII), and data rows used.
- **How it was tested** — commands, scripts, or manual steps that anyone can
  repeat.
- **Result** — pass/fail per check, with failures resolved or explicitly
  deferred with a tracked reason.
- **Where it is recorded** — a report file committed under the repo root or
  `docs/`, referenced from the tracking table.

### 3.3 Rollback rule

Any phase that touches live data or routing (1, 5, 6, 7) must document its
rollback path in the same report that claims its gate. Phase 7 additionally
requires a *rehearsed* rollback drill.

## 4. Phase detail

### Phase 0 — Freeze & Evidence

- **Scope.** Record the exact commits and deployment URLs for every app;
  inventory all schema objects (tables, RLS policies, functions/triggers,
  RPCs), storage buckets, environment variable names, and the current
  screen-to-data mapping for every app. **No schema redesign.**
- **Exit gate.** A signed audit table marking every item
  COMPLETE / PARTIAL / MISSING / BROKEN / DUPLICATE, with exact evidence per
  item.
- **Required evidence.**
  - Commit SHA + deployment URL matrix per app.
  - Supabase inventory: tables, RLS on/off + policy text, functions, RPCs,
    realtime publication, buckets, pg_cron jobs.
  - Env variable matrix per app (name → purpose → where consumed).
  - Screen-to-data inventory per app (screen → source: live table / mock /
    localStorage / hardcoded).
- **Prior evidence in this repo (re-verify before sign-off):**
  `NEXORA_PHASE0_FREEZE_AND_EVIDENCE_AUDIT.md`, `AUDIT_PHASE0.md`,
  `docs/LIVE_BACKEND_INVENTORY.md`.

### Phase 1 — Platform Shell

- **Scope.** Lock domain/path routing, PWA base paths and service-worker
  scopes, the shared env contract, auth token/session storage, and role
  redirects.
- **Exit gate.** One login on the canonical origin routes each role correctly
  (customer, owner, partner); direct-URL role tests pass (each role hitting
  another role's portal URL is redirected or denied, never served the wrong
  dashboard).
- **Required evidence.**
  - Routing table: canonical origin paths → app (per the locked four-app
    architecture).
  - Per-PWA `VITE_APP_BASE_PATH` / manifest / service-worker scope proof.
  - Auth storage contract (where the session lives, who reads it).
  - Recorded role-redirect matrix: role × landing URL × expected destination,
    all passing.
- **Prior evidence in this repo (re-verify before sign-off):**
  `docs/SECTION3_LOCKED_ARCHITECTURE.md`,
  `docs/PHASE1_PATH_BASED_PORTALS.md`.

### Phase 2 — Customer Core

- **Scope.** Remove all production mocks from the customer surface; live
  catalog, services, staff, and availability; booking list, detail, create,
  and status flows.
- **Exit gate.** A customer creates **one idempotent booking** (double-submit
  does not duplicate) that is visible **only** to that customer and the
  correct salon owner.
- **Required evidence.**
  - Mock/localStorage/hardcoded-data sweep result for the customer app.
  - Booking create test: double-submit → exactly one row (show the idempotency
    key/mechanism and the resulting query output).
  - Isolation test: second customer and unrelated owner queries against the
    booking return zero rows (RLS proof).
- **Prior evidence in this repo (re-verify before sign-off):**
  `docs/PHASE1_CUSTOMER_PWA_COMPLETION_STATUS.md`,
  `docs/CUSTOMER_AUTH_SHARING_FIX.md`,
  `docs/CUSTOMER_LOGIN_INVALID_CREDENTIALS_FIX.md`.

### Phase 3 — Owner Core

- **Scope.** Role/membership gate (only real, approved owners); salon,
  services, staff, hours, and availability management; booking operations
  (confirm/decline/reschedule/complete); proposal approval workflow.
- **Exit gate.** Owner data publishes correctly to the public surface, **and**
  an owner cannot read or write another salon's data.
- **Required evidence.**
  - Membership gate test: unapproved/non-owner account denied.
  - Publish proof: owner edit → visible in public marketplace query.
  - Cross-salon negative test: owner A attempting reads/writes on salon B
    rows fails at RLS/API level.
- **Prior evidence in this repo (re-verify before sign-off):**
  `docs/PHASE2_OWNER_PWA_COMPLETION.md`,
  `docs/PHASE8_SECURITY_DATA_ISOLATION.md`.

### Phase 4 — Partner Core

- **Scope.** Real auth/profile for growth partners; partner onboarding;
  website proposal submission; shop attribution; commission projections.
- **Exit gate.** A partner sees **only** shops attributed to them, and the
  approval lock plus attribution **survive publish** (a published website
  keeps its owner attribution and cannot be re-approved/re-published by a
  non-approver).
- **Required evidence.**
  - Attribution query proof: partner A's attributed shop list excludes
    partner B's shops.
  - Publish-survival test: approve → publish → re-check attribution and lock
    state from the database (not the UI).
  - Commission projection sanity check against the locked split rules.
- **Prior evidence in this repo (re-verify before sign-off):**
  `docs/PHASE3_GROWTH_PARTNER_COMPLETION.md`.

### Phase 5 — Website Cutover

- **Scope.** Remove duplicate private dashboards from the main website (it
  must not re-implement Customer/Owner/Partner apps); route portal traffic to
  the real apps; complete the public marketplace surfaces.
- **Exit gate.** Website public data equals the approved backend data; portal
  routes and deep links pass from the canonical origin.
- **Required evidence.**
  - Deletion inventory: every removed duplicate dashboard path + the route
    that replaces it.
  - Data-parity check: public marketplace renders only approved/published
    backend rows (spot-check N salons against the database).
  - Deep-link matrix: `/app/customer/*`, `/app/owner/*`, `/app/partner/*`
    links resolve correctly for each role, including refresh and direct hit.
- **Prior evidence in this repo (re-verify before sign-off):**
  `docs/FINAL_ARCHITECTURE_SUMMARY.md`.

### Phase 6 — Payments/Finance

- **Scope.** 25/75 payment structure, payment webhooks, ledger, refunds,
  disputes, the 90/10 split, the partner 1% commission, holds, and payout
  jobs.
- **Exit gate.** Reconciliation plus negative/idempotency tests pass; **no
  client-authoritative money** — payment state can only advance via
  server-verified provider events/webhooks.
- **Required evidence.**
  - Reconciliation report: ledger totals = payment-provider truth for the
    test window; 90/10 and partner 1% math verified per fixture.
  - Idempotency: duplicate webhook delivery does not double-credit; duplicate
    refund request does not double-refund.
  - Negative tests: forged/tampered client "payment success" signals are
    rejected (client cannot mark money moved).
  - Hold and payout-job run evidence, including one failure/rollback path.
- **Prior evidence in this repo (re-verify before sign-off):**
  `PHASE6_IMPLEMENTATION_REPORT.md`, `docs/OPERATIONAL_RUNBOOK.md`.

### Phase 7 — Release

- **Scope.** Security hardening, monitoring, backups, legal consent surfaces,
  production environment/domain, and a pilot rollout.
- **Exit gate.** The golden journey (discover → book → pay → fulfil →
  review/refund path) **and a rollback drill** both pass in a
  production-like environment.
- **Required evidence.**
  - Golden journey transcript with screenshots/requests per step, per role.
  - Rollback drill: deploy N → deploy N-1 (or feature-off) executed for real,
    with data integrity confirmed afterwards.
  - Security checklist (RLS coverage, secrets, headers), monitoring/alerts
    live, backup + restore test.
  - Legal consent checklist and production env/domain sign-off.
- **Prior evidence in this repo (re-verify before sign-off):**
  `PHASE7_IMPLEMENTATION_REPORT.md`, `docs/PHASE7_SECURITY_HARDENING.md`,
  `docs/PHASE7_SCALING_STRATEGY.md`, `docs/PHASE4_FINAL_RELEASE_AUDIT.md`,
  `docs/PRODUCTION_RELEASE_SIGNOFF_REPORT.md`,
  `docs/POST_DEPLOYMENT_VERIFICATION.md`.

## 5. Gate tracking

Statuses: `PENDING` (not started) · `IN PROGRESS` · `PASSED` (evidence signed)
· `FAILED` (gate re-opened). Prior-phase reports listed above are **inputs**,
not automatic passes — each gate is re-verified against its definition here.

| Phase | Gate | Status | Evidence report | Signed by | Date |
|---|---|---|---|---|---|
| 0 | Signed audit table with exact evidence per item | PENDING (prior audit on record) | — | — | — |
| 1 | One login routes each role; direct-URL role tests pass | PENDING | — | — | — |
| 2 | One idempotent booking visible only to self + correct owner | PENDING | — | — | — |
| 3 | Owner data publishes; no cross-salon access | PENDING | — | — | — |
| 4 | Partner sees only attributed shops; lock + attribution survive publish | PENDING | — | — | — |
| 5 | Public data equals approved backend; portal routes + deep links pass | PENDING | — | — | — |
| 6 | Reconciliation + negative/idempotency tests pass; no client-authoritative money | PENDING | — | — | — |
| 7 | Golden journey + rollback drill pass in production-like env | PENDING | — | — | — |

## 6. Change control

- This phase order and these exit gates are locked. Changes require an
  explicit, recorded amendment in this file (with date and reason), not an
  informal re-scope.
- Any defect found that blocks a gate is logged with file paths and
  reproduction steps in the phase's evidence report before the gate can be
  re-attempted.
