# Customer PWA Integration Package

**Target repo:** `janhvitiwari627-hue/Free-Website-costumer-pwa-app-` (branch `main`)
**Patch:** `supabase-integration.patch` (single commit, 20 files, +1480/−955)
**Verified:** applies cleanly on a fresh clone of `main` (`b4e9ad0`),
`tsc --noEmit` clean, `vite build` clean.

## Task coverage

| Requirement | Delivered by |
|---|---|
| Remove `MOCK_SALONS` | `src/data/mockData.ts` stripped of `MOCK_SALONS` + fake `INITIAL_BOOKINGS`; `src/lib/salonRepository.ts` loads the live approved/published catalog (`salons` + bookable `services` + published-site config: staff/photos/hours/offers) |
| Settings → Supabase | `src/lib/settingsRepository.ts` → `customer_settings` (jsonb, one row per user, realtime sync, one-time legacy import); `SettingsScreen` fully wired |
| Reviews → Supabase | `src/lib/reviewsRepository.ts` → `customer_reviews` (RLS per-user, idempotent upsert, graceful degradation); `SalonDetailScreen` + booking review flow wired; fake seed reviews + fake 4.8 stats removed |
| Payment methods → Supabase | `src/lib/paymentMethodsRepository.ts` → `saved_payment_methods` (UPI ids / masked cards only, never PANs); ProfileScreen, QR scanner, Add-UPI/Card modals wired; fake seeded cards/UPIs removed |
| Support → Supabase | `src/lib/supportRepository.ts` → `support_tickets` (created_by per customer) + `customer_feedback`; fake seeded tickets + fake agent auto-reply removed; new "Rate your app experience" card |

Auth was already real Supabase auth (login/signup + customer role guard) — untouched.
Legacy localStorage business data is imported once then purged (`src/lib/legacyLocalData.ts`).

## Apply

```bash
git clone https://github.com/janhvitiwari627-hue/Free-Website-costumer-pwa-app-.git
cd Free-Website-costumer-pwa-app-
git checkout -b supabase-integration-phase1
git am supabase-integration.patch
cp .env.example .env   # paste VITE_SUPABASE_ANON_KEY from the Supabase dashboard
npm install && npx tsc --noEmit && npm run build && npm run dev
```

## Deploy checklist

1. Backend migrations applied to `qwaehqsmodekbgvnaavz` (idempotent, in this
   repo's `supabase/migrations/`): `20260802_customer_phase1_schema.sql`,
   `20260803_customer_phase1_completion.sql`. Verify:
   `select * from public.verify_customer_phase1_backend();`
2. Host env vars (Vercel): `VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co`,
   `VITE_SUPABASE_ANON_KEY=<anon/publishable key>`. The app refuses to boot
   against any other Supabase project.

## Out of scope (next phase)
Booking write pipeline (`create_customer_booking` + Razorpay 25% advance),
favorites/notifications live tables, rewards/wallet RPCs.
