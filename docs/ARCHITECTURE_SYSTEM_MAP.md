# NEXORA 3-APP INTEGRATION — SYSTEM ARCHITECTURE MAP

**Phase 1 Deliverable**: Full System Audit & Shared Foundation Map  
**Shared Supabase Project**: `qwaehqsmodekbgvnaavz`  
**Host**: `https://qwaehqsmodekbgvnaavz.supabase.co`  
**Date**: August 2026

---

## 🏛️ 1. GLOBAL SYSTEM ARCHITECTURE MAP

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                 FLOW 1: OWNER APP                                ║
║  Owner Register → Canonical Salon → Shop Profile + Location → Website Builder    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                         │
                                         ▼
╔══════════════════════════════════════════════════════════════════════════════════╗
║                              FLOW 2: GROWTH PARTNER APP                          ║
║  Onboard Shop → Resolve Salon → Create Website Setup → Submit Proposal to Owner  ║
║                                        │                                         ║
║  Owner App: Review Proposal ───────────┴───────────► Owner Approves / Publishes  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                         │
                                         │ [GO LIVE / Publish Action]
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   SHARED SUPABASE (Ref: qwaehqsmodekbgvnaavz)                    │
│                                                                                  │
│  1. public.salons                                                                │
│     ├── verified = true, is_active = true, accepts_online_bookings = true        │
│     ├── latitude, longitude, location_address, city, area, zone, landmark        │
│     └── name, phone, starting_price_paise, cover_image_path                      │
│                                                                                  │
│  2. public.salon_public_websites                                                 │
│     ├── salon_id (FK -> salons.id, UNIQUE)                                       │
│     ├── slug (UNIQUE, e.g. 'luxe-salon-jaipur')                                  │
│     ├── template_key ('modern-minimal' | 'classic-elegance' | 'bold-luxury' | ..)│
│     ├── config (JSONB: hero, services, reviews, contact, theme, layoutToggles)   │
│     └── is_published = true, published_at = now()                                │
│                                                                                  │
│  3. Business Security & Ledgers                                                  │
│     ├── organizations & organization_members (Owner role resolution)             │
│     ├── salon_setup_proposals & salon_setup_proposal_versions                    │
│     ├── shop_attributions (GP attribution binding)                               │
│     ├── services, staff, offers, salon_hours (Owner RLS-isolated)                │
│     └── review_salon_setup RPC / update_shop_location RPC                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ Real-Time / Database Projection
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      MAIN NEXORA WEBSITE & MARKETPLACE                           │
│                                                                                  │
│  Catalog Query Contract:                                                         │
│  ├── SELECT * FROM salon_public_websites WHERE is_published = true               │
│  ├── JOIN salons ON salons.id = salon_public_websites.salon_id                   │
│  │   WHERE verified = true AND is_active = true AND deleted_at IS NULL           │
│  └── Automatically renders live salon card & dedicated website preview          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 2. DETAILED REPOSITORY AUDIT MATRIX

| Audit Dimension | Shop Owner App (`PINK-NEXORA-AAP-`) | Growth Partner App (`pink-growth-partner-aap-`) | Main Nexora Website (`nexora-main-website`) |
| :--- | :--- | :--- | :--- |
| **Repository URL** | `promptaivideo4-coder/PINK-NEXORA-AAP-` | `diamondpeomotion-cyber/pink-growth-partner-aap-` | `janhvitiwari627-hue/nexora-main-website` |
| **Supabase Client File** | `src/lib/supabase.ts` | `src/lib/supabaseClient.ts` | `app/lib/supabaseClient.ts` |
| **Project Ref & Host** | `qwaehqsmodekbgvnaavz.supabase.co` | `qwaehqsmodekbgvnaavz.supabase.co` | `qwaehqsmodekbgvnaavz.supabase.co` |
| **Hostname Validation** | Dynamic normalization | Strict: rejects non-`qwaehqsmodekbgvnaavz` | Strict: rejects non-`qwaehqsmodekbgvnaavz` |
| **Auth Flow** | Direct Password / App proxy / OTP | Implicit flow for recovery / Passwords | PKCE flow with singleton client |
| **Primary Platform Role** | `business_user` (Owner) | `growth_partner` / `district_partner` | Public visitor / Customer / Gateway |
| **Role Verification** | `organization_members` (`role='owner'`) | `user_roles` view + `profiles.platform_role` | `profiles.platform_role` |

---

## 📊 3. SCHEMA OBJECTS & FLOW ANALYSIS

### Flow 1: Shop Owner Direct Flow
1. **Bootstrap**: `bootstrap_shop_owner` RPC creates `organization` + `organization_members` (`owner`) + `salons` (`verified=false, is_active=true, accepts_online_bookings=false`).
2. **Shop Location**: `updateShopLocation` in `shopRepository.ts` updates 12 canonical geo fields in `public.salons` with verified coordinate matching.
3. **Website Builder**:
   - Templates: 4 active templates (`modern-minimal`, `classic-elegance`, `bold-luxury`, `summer-vibes`).
   - Config: Structured JSON containing hero, services, reviews, contact details, theme colors, and layout toggles.
   - **Publish Target**: Inserts/updates `public.salon_public_websites` with `is_published: true` and sets `salons.verified: true`.

### Flow 2: Growth Partner Onboarding Flow
1. **Onboarding**: Partner initiates application via `shop_onboarding_applications`.
2. **Setup Proposal**: Partner calls `save_growth_partner_salon_setup` RPC which validates payload, resolves owner account, and creates record in `salon_setup_proposals` + version snapshot in `salon_setup_proposal_versions`.
3. **Review & Publish**: Owner reviews proposal in Owner App and calls `review_salon_setup(proposal_id, 'publish')` RPC.
4. **Execution**:
   - `private.publish_salon_setup` executes.
   - `salons.verified = true`, `salons.is_active = true`, `salons.accepts_online_bookings = true`.
   - `shop_attributions` created for the Growth Partner.
   - Salon is published to `public.salon_public_websites`.

---

## 🔒 4. SECURITY & RLS POLICIES VERIFICATION

1. **`public.salons`**:
   - `salons_owner_read_own`: Owner reads own unverified salon + any verified salon.
   - `salons_owner_update_own`: Owner can update own salon profile.
2. **`public.salon_public_websites`**:
   - `spw_public_read_published`: `anon` and `authenticated` can read rows where `is_published = true`.
   - `spw_owner_read`: Owner can read own unpublished website draft.
3. **`public.services`, `public.staff`, `public.offers`, `public.salon_hours`**:
   - Read: Public for active records.
   - Write: Restricted strictly to salon owner via `private.can_manage_salon_settings(salon_id)`.
4. **Permanent Profile Role Guard**:
   - Profile `platform_role` is immutable by client updates; only system triggers and admin RPCs can set platform roles.

---

## ✅ 5. PHASE 1 VERIFICATION VERDICT

- **Shared Project Ref**: `qwaehqsmodekbgvnaavz` confirmed in all 3 repositories.
- **Config Mismatch Fix**: `owner-app/.env.example` explicitly updated with `https://qwaehqsmodekbgvnaavz.supabase.co`.
- **Database Alignment**: Both Flow 1 and Flow 2 terminate at `public.salons` + `public.salon_public_websites`.
- **Marketplace Consumer**: Main Website `fetchCatalog()` verified to consume the unified destination.

**PHASE 1 STATUS**: `PASS`
