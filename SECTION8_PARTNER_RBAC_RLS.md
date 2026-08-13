# SECTION 8 — GROWTH PARTNER RBAC / RLS

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website`
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE TESTS BLOCKED — static analysis complete

Live ALLOW/DENY evidence requires authenticated Supabase test accounts (Partner A / Partner B, an
Owner, and a Customer) plus a connection to `qwaehqsmodekbgvnaavz`. Neither is available (no CLI /
token / connection string; sandbox egress blocked). **No live PASS is recorded.** No data was
created or modified.

---

## The partner gate (verified statically)

Two `security definer`, `search_path=''` functions anchor all partner authorization from
`auth.uid()` — never a client-supplied partner ID:

**`private.current_growth_partner_id()`** — resolves the caller's `growth_partners.id` only when an
**active** `profiles` row exists with `platform_role = 'growth_partner'`:
```sql
select gp.id from growth_partners gp
join profiles p on p.id = gp.user_id
where gp.user_id = caller and p.is_active = true and p.platform_role = 'growth_partner'
```

**`public.ensure_growth_partner_identity()`** — bootstraps the partner row only for an active
`growth_partner` profile; refuses otherwise (`active Growth Partner role required`).

---

## 8.1 ALLOW (own partner work)

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| P1 | Resolve own partner identity | `current_growth_partner_id()` (auth.uid() + active role) | ✅ | UNVERIFIED |
| P2 | Read assigned salon summary | `shop_attributions` / `salon_setup_proposals` `partner_gate_select` (`growth_partner_id = current_growth_partner_id()`) | ✅ | UNVERIFIED |
| P3 | Create assigned proposal | `save_growth_partner_salon_setup()` — application must be `submitted_by_partner_id = partner_id` | ✅ | UNVERIFIED |
| P4 | Read own assigned proposal | `partner_gate_select` / `partner_proposals_select` (`is_proposal_attributed`) | ✅ | UNVERIFIED |
| P5 | Create/edit own draft version | status must be `draft`/`changes_requested`; version row records `changed_by = caller` | ✅ | UNVERIFIED |
| P6 | Submit proposal | `p_submit` → status `submitted`; requires a resolved active Owner | ✅ | UNVERIFIED |
| P7 | Resubmit after Owner requests changes | `changes_requested` is in the editable set → new version + `submitted` | ✅ | UNVERIFIED |
| P8 | View own attribution | `partner_gate_select` on `shop_attributions` | ✅ | UNVERIFIED |
| P9 | View own commission records | `growth_partner_commissions_owner_read` (`growth_partner_id = current_growth_partner_id()`) | ✅ | UNVERIFIED |
| P10 | View own payout status | `partner_gate_select` on `partner_payouts` (select only) | ✅ | UNVERIFIED |

## 8.2 DENY (other partners / protected state)

| # | Test | Declared rule | Static | Live |
| --- | --- | --- | --- | --- |
| Q1 | Read unrelated proposal | policies scope to `growth_partner_id = current_growth_partner_id()` | ✅ | UNVERIFIED |
| Q2 | Edit another Partner's proposal | `save_…` requires application `submitted_by_partner_id = partner_id` | ✅ | UNVERIFIED |
| Q3 | Edit approved/locked version directly | `save_…` raises unless status in `draft`/`changes_requested` | ✅ | UNVERIFIED |
| Q4 | Approve own proposal as Owner | `review_salon_setup`/`approve_proposal` require `can_manage_salon_settings(proposal.salon_id)` | ✅ | UNVERIFIED |
| Q5 | Directly publish salon website | `publish_salon_website` owner-gated | ✅ | UNVERIFIED |
| Q6 | Change Owner-only salon settings | `salons_owner_update_own` / `can_manage_salon_settings` (business_user) | ✅ | UNVERIFIED |
| Q7 | Manage bookings | `bookings_owner_*` via `can_manage_salon_settings`; `update_booking_status_secure` has no partner branch (partner denied) | ✅ | UNVERIFIED |
| Q8 | Access customer private records | customer tables scoped to `auth.uid()` (owner); partner has no policy/grant | ✅ | UNVERIFIED |
| Q9 | Access Owner bank/payout records | `owner_payouts_owner_read` via `can_manage_salon_settings` (owner-only) | ✅ | UNVERIFIED |
| Q10 | Modify commission/payment state | commission mutation RPCs (`release_`, `mark_…_paid`, `backfill_`) are `service_role`-only; table has only `select` grant | ✅ | UNVERIFIED |
| Q11 | Change proposal owner/salon/partner assignment | `salon_setup_proposals` has **no INSERT/UPDATE/DELETE policy or grant** to `authenticated`; writes only via `security definer` RPC | ✅ | UNVERIFIED |
| Q12 | Bypass status transitions via direct update | no update policy → direct UPDATE denied; transitions only via RPC matrix | ✅ | UNVERIFIED |

---

## 8.3 Proposal workflow — server-side transition enforcement

The status machine is enforced **inside `review_salon_setup()`** (owner side) and
**`save_growth_partner_salon_setup()`** (partner side), not in the client:

| Transition | Enforced by | Rule |
| --- | --- | --- |
| Draft → Submitted | `save_…(p_submit=true)` | `next_status := 'submitted'` |
| Submitted → Changes requested | `review_salon_setup('request_changes')` | `proposal.status in ('submitted','approved')` |
| Changes requested → Resubmitted | `save_…` | editable set `('draft','changes_requested')` → new version, `submitted` |
| Submitted → Approved | `review_salon_setup('approve')` | `proposal.status = 'submitted'` **and** owner gate |
| Submitted/Approved → Rejected | `review_salon_setup('reject')` | owner gate |
| Approved/Submitted → Published | `review_salon_setup('publish')` → `publish_salon_setup` | owner gate + attribution uniqueness check |
| any invalid | — | `raise exception 'invalid setup review transition'` |

Key guarantees:
- **Owner-only** approve/reject/publish: `review_salon_setup` begins with
  `if proposal.salon_id is null or not private.can_manage_salon_settings(proposal.salon_id) then raise 'Shop Owner permission required'`.
- **Partner cannot self-approve/publish**: those actions are not exposed to partner edits; the
  only partner write path is `save_…`, which never sets `approved`/`published`.
- **No direct UPDATE bypass**: `salon_setup_proposals` has no update policy/grant to
  `authenticated`, so the client cannot mutate status directly.
- **Version integrity**: every edit inserts a `salon_setup_proposal_versions` row with
  `changed_by = caller` and `change_source = 'growth_partner'`.
- **Assignment immutability**: `growth_partner_id` / `salon_id` / `owner_user_id` are set from
  server-side resolution (`application.submitted_by_partner_id`, `resolve_setup_owner`), never from
  the client payload.

---

## 8.4 Observations

1. `salon_setup_proposal_versions` (inserted into by `save_…`) still has **no `CREATE TABLE` in the
   repo** (Sections 3/4 gap) — must exist live or the version insert errors.
2. `partner_gate_select` on `salon_setup_proposals` and `partner_proposals_select`
   (`is_proposal_attributed`) are **additive** (both partner-scoped) — confirm no stale duplicates
   live.
3. Commission rows are also visible to the salon **owner** (`… or can_manage_salon_settings(salon_id)`)
   — intentional (owner sees the commission on their salon), not a partner-isolation break.

---

## Ready-to-run live verification (read-only first)

```sql
select proname, prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and proname in
  ('current_growth_partner_id','ensure_growth_partner_identity','save_growth_partner_salon_setup',
   'review_salon_setup','approve_proposal','publish_salon_website','is_proposal_attributed');

select tablename, policyname, cmd, qual, with_check from pg_policies
where schemaname='public' and tablename in
  ('growth_partners','salon_setup_proposals','salon_setup_proposal_versions','shop_attributions',
   'growth_partner_commissions','partner_payouts','partner_payout_accounts','shop_onboarding_applications')
order by tablename, cmd;

select table_name, privilege_type from information_schema.role_table_grants
where table_schema='public' and grantee='authenticated'
  and table_name in ('salon_setup_proposals','growth_partner_commissions','partner_payouts')
order by table_name, privilege_type;
```

Then run the ALLOW/DENY matrix with two partners (Partner A acts on own proposal = ALLOW; on
Partner B's = DENY; Owner approves/rejects/publishes = ALLOW; Partner attempts approve/publish =
DENY; Partner direct `UPDATE salon_setup_proposals` = DENY).

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| GROWTH PARTNER ALLOW TESTS (live) | **BLOCKED** |
| GROWTH PARTNER DENY TESTS (live) | **BLOCKED** |
| PARTNER RBAC RULES (static) | **PASS** |
| PROPOSAL WORKFLOW SERVER-ENFORCED (static) | **PASS** |
| PARTNER CANNOT PUBLISH (static) | **PASS** |
| PARTNER CANNOT MODIFY COMMISSIONS/PAYOUTS (static) | **PASS** |

## EXACT REMAINING BLOCKERS
1. Supabase access + seeded Partner A/B, Owner, Customer accounts + sandbox egress.
2. Live confirmation `salon_setup_proposal_versions` exists (version-insert dependency).
3. Live confirmation no stale duplicate partner policies.

## NEXT REQUIRED ACTION
Provide Supabase read/write access for isolated test records; run the live ALLOW/DENY + workflow
matrix. Phase 6 remains unstarted; no live PASS is recorded.
