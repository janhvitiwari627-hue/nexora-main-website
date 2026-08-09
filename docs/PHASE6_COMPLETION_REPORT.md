# PHASE 6 — GROWTH PARTNER WEBSITE BUILDER + DRAFT + SUBMISSION REPORT

**Scope**: Growth Partner Website Setup, Canonical Proposals Draft & Submission Workflow  
**Shared Supabase Project**: `qwaehqsmodekbgvnaavz`  
**Execution Date**: August 2026  
**Status**: ✅ **PASS**

---

## 🎨 1. GROWTH PARTNER WEBSITE BUILDER CAPABILITIES

The Growth Partner can configure and manage the full digital storefront setup:
- **Shop / Application Selection**: Select onboarding application / assigned shop.
- **Template Selection**: Choose visual theme (`modern-salon`, `royal-luxe`, `professional`).
- **Business Content Editing**: Shop name, about description, timings, weekly off.
- **Allowed Services & Pricing**: Configure service menu with pricing and duration.
- **Branding & Visuals**: Logo, cover photo, interior photos, social media & online links.
- **Storefront Live Preview**: Interactive mobile & desktop viewports.

---

## 📄 2. CANONICAL DRAFT & SUBMISSION PIPELINE

Canonical proposal data persists in `public.salon_setup_proposals` using RPC `save_growth_partner_salon_setup`:

```
Growth Partner Action
  ├── Save Draft
  │     ├── Calls save_growth_partner_salon_setup(application_id, payload, p_submit=false)
  │     ├── Sets salon_setup_proposals.status = 'draft'
  │     └── Message: "Website draft saved successfully in proposals."
  │
  └── Submit & Onboard
        ├── Calls save_growth_partner_salon_setup(application_id, payload, p_submit=true)
        ├── Sets salon_setup_proposals.status = 'submitted'
        ├── Records version snapshot in public.salon_setup_proposal_versions
        ├── Dispatches in-app notification to Owner
        └── User Message: "Website sent to Shop Owner for approval."
```

---

## 🔒 3. CRITICAL PUBLICATION BOUNDARY

| Action by Growth Partner | Public State in Database | Marketplace Visibility |
| :--- | :--- | :--- |
| **Save Draft** | `salon_setup_proposals.status = 'draft'` | ❌ Hidden |
| **Submit Proposal** | `salon_setup_proposals.status = 'submitted'`, `salons.verified = false` | ❌ Hidden (Pending Owner Approval) |
| **Owner Review & Approval** | Owner calls `review_salon_setup(proposal_id, 'publish')` | ✅ **Live on Marketplace** (`verified=true, is_published=true`) |

> **Important**: Growth Partner pressing *Submit* **NEVER** makes the salon public directly. The Shop Owner must explicitly approve and publish through their own verified portal.

---

## 📜 4. PROPOSAL VERSIONING AUDIT

- `public.salon_setup_proposal_versions` records every change incrementally:
  - `proposal_id`: UUID
  - `version`: Monotonically incrementing integer (`version + 1`)
  - `payload`: Full JSONB snapshot of salon setup configuration
  - `changed_by`: Auth user ID of the Growth Partner or Shop Owner
  - `change_source`: `'growth_partner'` | `'shop_owner'`
  - `created_at`: Timestamp

---

## 🧪 5. VERIFICATION & BUILD STATUS

- **Growth Partner App Production Build**: Clean build (`dist/` generated) ✅
- **Shop Owner App Production Build**: Clean build ✅
- **Main Website Build**: Clean Next.js 16 build ✅
- **Contract & Security Tests**: 138/138 Passed (`npm run test:contracts`) ✅

---

## 🎯 FINAL PHASE 6 VERDICT: `PASS`
