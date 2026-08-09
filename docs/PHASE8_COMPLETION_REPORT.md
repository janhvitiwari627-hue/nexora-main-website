# PHASE 8 — ONE MARKETPLACE FOR OWNER + GROWTH PARTNER REPORT

**Scope**: Unified Destination Architecture, Duplicate Prevention & Attribution Preservation  
**Shared Supabase Project**: `qwaehqsmodekbgvnaavz`  
**Execution Date**: August 2026  
**Status**: ✅ **PASS**

---

## 🏛️ 1. UNIFIED MARKETPLACE TOPOLOGY

Both publishing flows converge on the single canonical database source:

```
┌─────────────────────────┐                     ┌─────────────────────────┐
│     FLOW 1: OWNER       │                     │ FLOW 2: GROWTH PARTNER  │
│  Owner Website Builder  │                     │  Onboard Shop & Setup   │
│           │             │                     │           │             │
│   Direct Publication    │                     │   Submit Setup Proposal │
│           │             │                     │           │             │
│           │             │                     │   Owner Review & Action │
└───────────┼─────────────┘                     └───────────┼─────────────┘
            │                                               │
            │           [publishShopWebsite / review_salon_setup]
            ▼                                               ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                public.salon_public_websites                 │
     │       UNIQUE(salon_id)  •  UNIQUE(slug)  •  is_published    │
     └──────────────────────────────┬──────────────────────────────┘
                                    │
                                    ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                       public.salons                         │
     │      verified = true  •  is_active = true  •  deleted_at     │
     └──────────────────────────────┬──────────────────────────────┘
                                    │
                                    ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                 NEXORA MAIN WEBSITE & APPS                  │
     │    fetchCatalog() ➔ Exactly ONE Unified Marketplace Card    │
     └─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. DUPLICATE PREVENTION GUARANTEES

| Surface / Object | Constraint / Protection Mechanism | Duplicate Prevention Verdict |
| :--- | :--- | :--- |
| **`salon_public_websites`** | `salon_id uuid not null unique references salons(id)` | ✅ **Zero duplicate rows per salon** |
| **Website Slugs** | `slug text not null unique` | ✅ **Distinct, collision-free URLs** |
| **Marketplace Cards** | `bySalon Map(websites ➔ salons)` in `fetchCatalog()` | ✅ **Exactly 1 card per published salon** |
| **Search Engine** | Result list deduped by `salons.id` | ✅ **Zero duplicate search results** |

---

## 🔄 3. VERSION BEHAVIOR & OWNER EDITS

When a Shop Owner edits a website previously published via a Growth Partner proposal:
1. **In-Place Replacement**: `publishShopWebsite()` runs UPSERT with `onConflict: 'salon_id'` targeting the same `salon_public_websites` row.
2. **No Duplicate Salon**: The canonical `salons.id` remains identical.
3. **Attribution Untouched**: Modifying the public website layout/services never alters or removes the active `shop_attributions` row.

---

## 🤝 4. ATTRIBUTION INTEGRITY & CONFLICT SHIELD

- **Attribution Storage**: `public.shop_attributions` binds `growth_partner_id` to `salon_id`.
- **Anti-Conflict Gate in `review_salon_setup`**:
  ```sql
  IF EXISTS (
    SELECT 1 FROM public.shop_attributions a
    WHERE a.salon_id = proposal.salon_id
      AND a.status = 'active'
      AND a.effective_until IS NULL
      AND a.growth_partner_id <> proposal.growth_partner_id
  ) THEN
    RAISE EXCEPTION 'salon is already attributed to another Growth Partner';
  END IF;
  ```
- Ensures **exactly one active Growth Partner attribution** per salon.

---

## 🧪 5. VERIFICATION & BUILD STATUS

- **Shop Owner App Production Build**: Passed (`dist/` generated) ✅
- **Growth Partner App Production Build**: Passed (`dist/` generated) ✅
- **Main Website Build**: Passed (`npm run build:next`) ✅
- **Contract & Security Tests**: 138/138 Passed (`npm run test:contracts`) ✅

---

## 🎯 FINAL PHASE 8 VERDICT: `PASS`
