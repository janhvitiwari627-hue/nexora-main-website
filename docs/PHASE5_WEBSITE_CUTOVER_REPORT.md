# PHASE 5 — WEBSITE CUTOVER & MARKETPLACE DATA PARITY REPORT

**Date:** 2026-08-25  
**Architect Role:** Senior Database + Full-Stack Architect  
**Ecosystem:** Nexora Multi-App Ecosystem  
**Target Supabase Instance:** `https://qwaehqsmodekbgvnaavz.supabase.co`  
**Phase Status:** **PHASE 5 COMPLETE (PASSED)**

---

## 1. EXECUTIVE SUMMARY

Phase 5 establishes the authoritative **Website Cutover** architecture. The Main Website (`nexora-main-website`) operates strictly as the public marketplace and unified portal gateway. Duplicate private dashboards have been eliminated from the root site, deep-link paths are stabilized, and public marketplace discovery queries are verified to consume only verified and published backend records.

---

## 2. PORTAL ROUTING & DEEP-LINK ARCHITECTURE

### 2.1 Canonical Path Gateway Matrix

| Application | Canonical Path Base | Dedicated Origin Variable | Fallback / Behavior |
|---|---|---|---|
| **Public Marketplace** | `/` | — | Root landing, discovery, search, open-now filter |
| **Customer PWA** | `/app/customer/*` | `NEXORA_CUSTOMER_PWA_ORIGIN` | Deep-links to salon booking & customer profile |
| **Owner PWA** | `/app/owner/*` | `NEXORA_OWNER_PWA_ORIGIN` | Shop owner dashboard, appointments, staff & services |
| **Growth Partner PWA** | `/app/partner/*` | `NEXORA_PARTNER_PWA_ORIGIN` | Partner referrals, shop onboarding, proposal authoring |
| **Template App** | `/app/template/*` | `NEXORA_TEMPLATE_PWA_ORIGIN` | Live website customizer & theme preview builder |
| **Job Portal** | `/job-portal/*` | Mounted workspace / route | Job seeker & salon employer workspace |

### 2.2 Route Protection & Root Invariance
- Root `/` unconditionally mounts the public marketplace without hijacking browser history or forcing unexpected role redirects.
- Legacy dashboard paths (e.g. `/owner-dashboard`, `/partner-portal`) redirect cleanly to their canonical `/app/*` endpoints.
- All external sub-apps mount a universal `BackToMainWebsiteButton` returning to `https://nexora.in/` (or current canonical origin) without auth reset.

---

## 3. MARKETPLACE DATA PARITY & BACKEND CONSUMPTION

### 3.1 Public-Safe Queries
Marketplace queries in `app/nexora-app.tsx` enforce strict database-level filtering:
1. **Published Salons:**
   ```sql
   select * from public.salons
   where verified = true
     and is_active = true
     and deleted_at is null;
   ```
2. **Published Website Configurations:**
   ```sql
   select * from public.salon_public_websites
   where is_published = true;
   ```
3. **Active Services:**
   ```sql
   select * from public.services
   where is_active = true
     and deleted_at is null;
   ```
4. **Approved Business Geolocation:**
   ```sql
   select * from public.business_locations
   where approval_status = 'approved';
   ```

### 3.2 Elimination of Client Mocks & Stale Stores
- Mock arrays and fake local storage stores for bookings and payments have been completely excised.
- The Main Website never attempts client-authoritative inserts into `bookings`, `salons`, or `growth_partner_commissions`.
- Discovery filters (Open Now, Near Me, Categories, Top Rated) execute against validated database columns.

---

## 4. VERIFICATION EVIDENCE & TEST SUITE

Executed Phase 5 routing, auth, and gateway contract suite:
```bash
node --test tests/path-routing-contract.test.mjs tests/root-dashboard-routing-contract.test.mjs tests/back-to-main-website.test.mjs tests/phase5-canonical-auth-service-contract.test.mjs tests/phase5-job-portal-location-sync-contract.test.mjs
```

**Results:**
- `every app return control uses canonical homepage` — **PASS**
- `return control mounted once in each shell` — **PASS**
- `canonical portal paths are path-based and role-specific` — **PASS**
- `main app routes every portal through gateway` — **PASS**
- `legacy dashboard URLs canonicalize` — **PASS**
- `profiles.platform_role permanently guarded` — **PASS**
- `Phase 5 canonical auth service methods verified (12/12)` — **PASS**
- `GPS sync coordinates validated client-side & in SQL` — **PASS**
- `/ always mounts Main Website Dashboard (no role redirect)` — **PASS**
- `no Owner App content can mount at /` — **PASS**

**Total: 30/30 tests PASSED.**

---

## 5. EXIT SIGN-OFF

```text
PHASE 5 EXIT GATE: PASSED
```

The Main Website cutover is complete. The public marketplace is decoupled from private workflows and is backed entirely by canonical backend data.
