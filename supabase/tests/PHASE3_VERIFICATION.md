# Phase 3 — RBAC verification

**Migration:** `supabase/migrations/20260812_phase3_rbac_verification.sql`  
**SQL tests:** `supabase/tests/phase3_rbac_tests.sql`  
**Shared project:** `qwaehqsmodekbgvnaavz`

Shell access on the Main Website is no longer role-home gated (Phase 2). Data
access stays on Row Level Security. These helpers give Owner / Partner /
Customer PWAs named, fail-closed RPCs so the browser never decides ownership.

## Helpers

| Function | Who | What |
| --- | --- | --- |
| `public.is_salon_owner(uuid)` | authenticated | `true` when `auth.uid()` is an active `business_user` with an active `organization_members` row for the salon. Wraps `private.can_manage_salon_settings`. |
| `public.is_proposal_attributed(uuid)` | authenticated | `true` when the caller's `growth_partners` row authored the proposal. Uses `private.current_growth_partner_id()`. |
| `public.approve_proposal(uuid, text)` | authenticated owner | Approves a submitted setup proposal. Re-checks `is_salon_owner` then calls `review_salon_setup(..., 'approve')`. |
| `public.publish_salon_website(uuid, text)` | authenticated owner | Publishes an approved/submitted website. Re-checks `is_salon_owner` then calls `review_salon_setup(..., 'publish')`. |

Anon cannot execute the two mutation RPCs. A customer or partner who calls
them receives `Shop Owner permission required`.

## RLS (idempotent add-if-missing)

- Customer: `bookings` select where `customer_id = auth.uid()`
- Customer: `favorite_salons` all where `user_id = auth.uid()`
- Owner: `salon_setup_proposals` select where `is_salon_owner(salon_id)`
- Partner: `salon_setup_proposals` select where `is_proposal_attributed(id)`

Earlier Phase 8 / production-gate policies remain the primary surface. These
rows only appear if a previous apply missed them.

## Apply

```sql
-- In the Supabase SQL editor, paste and run:
--   supabase/migrations/20260812_phase3_rbac_verification.sql
-- Then:
--   supabase/tests/phase3_rbac_tests.sql
```

`select * from public.verify_phase3_rbac();` must return `COMPLETE` for all
four checks. The migration is idempotent and does not drop tables or reset data.
