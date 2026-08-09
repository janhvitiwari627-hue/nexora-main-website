# PHASE 5 — GROWTH PARTNER ONBOARDING + CANONICAL SALON LINKING REPORT

**Scope**: Growth Partner App Integration & Server-Side Canonical Salon Resolution  
**Shared Supabase Project**: `qwaehqsmodekbgvnaavz`  
**Execution Date**: August 2026  
**Status**: ✅ **PASS**

---

## 🤝 1. GROWTH PARTNER IDENTITY & ROLE GUARDS

1. **Authentication & Session**:
   - Authenticated against shared `auth.users` pool (`flowType: 'implicit'` for seamless recovery link consumption).
2. **Permanent Role Check**:
   - `isGrowthPartnerRole` / `checkGrowthPartnerAccess` queries `user_roles` view and `profiles.platform_role` (`growth_partner` / `district_partner`).
   - Rejects unassigned or mismatched accounts server-side.
3. **Identity Record**:
   - `resolveGrowthPartner` maps `growth_partners` identity (`partner_code`, `referral_code`, `status = 'active'`).

---

## 🏛️ 2. SERVER-SIDE CANONICAL SALON RESOLUTION

```
Growth Partner Form 
  └── Onboarding Application (shop_onboarding_applications)
        └── RPC save_growth_partner_salon_setup(p_application_id, p_payload, p_submit)
              │
              ├── [1] Verify caller = private.current_growth_partner_id()
              ├── [2] Resolve Salon:
              │       ├─ If existing_salon_id present ──► Resolve owner from organization_members
              │       └─ Else ──► private.resolve_setup_owner(owner_email)
              │                     └── Finds active owner profile + single canonical salons.id
              ├── [3] Upsert salon_setup_proposals (status='submitted', version+1)
              ├── [4] Insert immutable snapshot in salon_setup_proposal_versions
              └── [5] Dispatch in-app notification to Owner
```

### 🔒 Zero-Trust Browser Security:
- **No Arbitrary IDs Accepted**: Client cannot supply forged `owner_user_id`, `salon_id`, `organization_id`, or `growth_partner_id`.
- **Server Ownership Verification**: `private.resolve_setup_owner(owner_email)` and `private.current_growth_partner_id()` execute strictly under `security definer` inside PostgreSQL.
- **Duplicate Prevention**: Reuses existing `salons.id` linked to the resolved owner's active organization.

---

## 📋 3. ONBOARDING DATA CAPTURE MATRIX

| Captured Field | Storage Object | Payload Mapping in Proposal |
| :--- | :--- | :--- |
| **Owner Contact** | `shop_onboarding_applications.owner_email`, `owner_phone` | `payload.profile.email`, `payload.profile.phone` |
| **Shop Name** | `shop_onboarding_applications.shop_name` | `payload.profile.name` |
| **Location & Address** | `full_address`, `locality`, `city` | `payload.profile.address`, `payload.profile.area`, `payload.profile.city` |
| **Timings** | `opening_time`, `closing_time` | `payload.profile.opening_hours: { opens, closes }` |
| **Description** | `about_shop` | `payload.profile.description` |
| **Website Template** | `website_template` | `payload.template: { key: websiteTemplate }` |
| **Services List** | `services` array | `payload.services: [ { name, price, duration } ]` |

---

## 🧪 4. VERIFICATION & BUILD STATUS

- **Growth Partner App Build**: Clean production build (`dist/` generated) ✅
- **Shop Owner App Build**: Clean production build ✅
- **Main Website Build**: Clean Next.js 16 build ✅
- **Contract & Security Tests**: 138/138 Passed (`npm run test:contracts`) ✅

---

## 🎯 FINAL PHASE 5 VERDICT: `PASS`
