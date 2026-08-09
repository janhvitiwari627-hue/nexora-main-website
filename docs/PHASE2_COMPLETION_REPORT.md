# PHASE 2 — OWNER REGISTRATION + CANONICAL SALON + PROFILE REPORT

**Scope**: Complete Shop Owner Data Foundation  
**Shared Supabase Project**: `qwaehqsmodekbgvnaavz`  
**Execution Date**: August 2026  
**Status**: ✅ **PASS**

---

## 🏗️ 1. ARCHITECTURAL RELATIONSHIP CHAIN

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   auth.users    │ ───►  │ public.profiles │ ───►  │  organizations  │ ───►  │  public.salons  │
│ (User Account)  │       │ (business_user) │       │ & org_members   │       │(Canonical Salon)│
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Signup → `public.profiles`**:
   - Owner creates account with `signup_role: 'business_user'`.
   - Database trigger creates/syncs `public.profiles` row (`id = auth.uid()`, `platform_role = 'business_user'`).
   - Role is guarded by `guard_profile_platform_role()` trigger.

2. **Business Bootstrap → `public.organizations`**:
   - `bootstrap_shop_owner(p_business_name, p_business_category, p_contact_number)` creates the legal business organization entity.

3. **Ownership → `public.organization_members`**:
   - Membership record linked: `organization_id`, `user_id = auth.uid()`, `role = 'owner'`, `status = 'active'`.
   - Serves as the immutable server-side ownership resolver for RLS `private.can_manage_salon_settings(salon_id)`.

4. **Shop → `public.salons` (Canonical Salon Record)**:
   - Initial canonical salon created under the organization with `verified = false`, `is_active = true`, `accepts_online_bookings = false`.

---

## 🔒 2. HARD REQUIREMENT: ONE SHOP = ONE `salons.id`

| Scenario | Protection Mechanism | Duplicate Prevention Verdict |
| :--- | :--- | :--- |
| **Login** | `fetchMyShop` resolves existing salon via `organization_members (role='owner')` | ✅ No duplicate created |
| **Page Refresh** | Reads existing salon from Supabase via session token | ✅ No duplicate created |
| **Repeated Bootstrap** | `bootstrapMyShop` checks `fetchMyShop` before RPC call; returns existing `salon.id` | ✅ Idempotent — No duplicate created |
| **Profile Edit** | `updateShopProfile` performs UPDATE on `salons.id = salonId` | ✅ Updates existing row in place |

---

## 📝 3. SHOP PROFILE REAL FIELDS PERSISTENCE

All 10 required canonical profile fields are mapped and persisted in `public.salons`:

| Field Name | Database Column in `public.salons` | Persistence Handler | Status |
| :--- | :--- | :--- | :--- |
| **Shop Name** | `name` | `updateShopProfile` / `salons.name` | ✅ Persisted |
| **Business Category** | `business_category` | `updateShopProfile` / `salons.business_category` | ✅ Persisted |
| **Phone** | `phone` | `updateShopProfile` / `salons.phone` | ✅ Persisted |
| **Description** | `description` | `updateShopProfile` / `salons.description` | ✅ Persisted |
| **Address** | `address`, `location_address` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |
| **City** | `city`, `location_city` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |
| **Area / Locality** | `area`, `location_area` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |
| **Zone** | `location_zone` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |
| **Landmark** | `location_landmark` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |
| **Pincode** | `location_pincode` | `updateShopProfile` / `updateShopLocation` | ✅ Persisted |

*Note: Unconfirmed / draft setup is marked `verified = false` and `location_confirmed = false` until real data and location are explicitly submitted.*

---

## 🧪 4. VERIFICATION & TEST RESULTS

- **Contract Tests**: 138/138 Passed (`npm run test:contracts`) ✅
- **Owner App Build**: Clean Vite + PWA production build (`dist/` generated) ✅
- **Partner App Build**: Clean Vite production build (`dist/` generated) ✅
- **Main Website Build**: Clean Next.js 16 + Turbopack build ✅

---

## 🎯 FINAL PHASE 2 VERDICT: `PASS`
