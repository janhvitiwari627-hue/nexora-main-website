# Nexora — Post-Deployment Verification Guide

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This guide provides step-by-step verification procedures for post-deployment validation of the Nexora v3 four-deployment architecture.

---

## 1. Pre-Verification Prerequisites

Before starting verification, ensure:

- [ ] All four deployments are live (Main Website, Customer PWA, Owner PWA, Growth Partner PWA)
- [ ] Supabase migrations are applied (all 11 migrations)
- [ ] Environment variables are configured on all deployments
- [ ] Test user accounts are created for each role

### Test Accounts Required

| Role | Email | Purpose |
|------|-------|---------|
| Customer | `customer@test.com` | Booking flow verification |
| Shop Owner | `owner@test.com` | Salon management verification |
| Growth Partner | `partner@test.com` | Referral/proposal verification |

---

## 2. Main Website Verification

### 2.1 Public Pages

| Page | URL | Expected |
|------|-----|----------|
| Homepage | `/` | Hero section, salon categories, featured salons |
| Salon Detail | `/salons/[slug]` | Salon info, services, booking button |
| Terms | `/terms` | Terms of service content |
| Privacy | `/privacy` | Privacy policy content |
| FAQ | `/faq` | Frequently asked questions |

### 2.2 Authentication

| Action | Expected |
|--------|----------|
| Sign up (email) | Email confirmation sent |
| Sign in | Redirect to appropriate portal or dashboard |
| Sign out | Session cleared, redirect to home |

### 2.3 Portal Routing

| URL | Expected Behavior |
|-----|-------------------|
| `/app/customer` | Redirect to Customer PWA |
| `/app/customer/bookings` | Customer bookings page |
| `/app/owner` | Redirect to Owner PWA |
| `/app/owner/salons` | Owner salon management |
| `/app/partner` | Redirect to Growth Partner PWA |
| `/app/partner/referrals` | GP referral dashboard |

---

## 3. Customer PWA Verification

### 3.1 Dashboard

- [ ] Overview tab shows wallet balance, bookings count, loyalty points
- [ ] My Bookings tab shows existing bookings
- [ ] Wallet tab shows transaction history
- [ ] Rewards tab shows loyalty points and redemption options
- [ ] Favorites tab shows favorited salons
- [ ] Addresses tab shows saved addresses
- [ ] Notifications tab shows recent notifications
- [ ] Settings tab allows profile updates

### 3.2 Booking Flow

1. Browse published salons from homepage
2. Select a salon → view details
3. Select a service → view pricing
4. Select appointment time → view available slots
5. Proceed to booking → Razorpay payment (25% advance)
6. Confirm booking → booking appears in My Bookings
7. Verify wallet deduction for advance payment

---

## 4. Owner PWA Verification

### 4.1 Dashboard

- [ ] Salon overview with booking statistics
- [ ] Today's appointments list
- [ ] Pending proposals (if any)
- [ ] Payout history

### 4.2 Salon Management

- [ ] Create/edit salon details
- [ ] Add/edit services with pricing
- [ ] Manage staff members
- [ ] Set opening hours
- [ ] Create/edit offers

### 4.3 Booking Management

- [ ] View upcoming bookings
- [ ] View past bookings
- [ ] Update booking status
- [ ] Process refunds (if applicable)

### 4.4 Proposal Review

- [ ] View incoming shop onboarding applications
- [ ] Review application details
- [ ] Approve/reject with feedback
- [ ] Published salon appears in public catalog

---

## 5. Growth Partner PWA Verification

### 5.1 Dashboard

- [ ] Referral code displayed (server-generated)
- [ ] Referral statistics (clicks, signups, revenue)
- [ ] Commission history
- [ ] Pending/approved proposals

### 5.2 Referral Flow

1. Copy referral code from dashboard
2. Share with potential customers
3. Track referral clicks and conversions
4. Verify commission accrual

### 5.3 Proposal Submission

1. Initiate new shop onboarding
2. Fill in salon details
3. Submit proposal
4. Verify proposal appears in Owner PWA
5. Track proposal status

---

## 6. Database Verification

### 6.1 Business Rules Verification

```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.verify_business_rules();
```

Expected output: All checks return `COMPLETE` or `PASS`

### 6.2 Key Tables Check

```sql
-- Verify critical tables exist and have data
SELECT 
    'profiles' as table_name,
    count(*) as row_count
FROM public.profiles
UNION ALL
SELECT 'salons', count(*) FROM public.salons
UNION ALL
SELECT 'services', count(*) FROM public.services
UNION ALL
SELECT 'bookings', count(*) FROM public.bookings
UNION ALL
SELECT 'wallet_transactions', count(*) FROM public.wallet_transactions
UNION ALL
SELECT 'rewards', count(*) FROM public.rewards;
```

### 6.3 RLS Policy Verification

```sql
-- Check RLS is enabled on critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'salons', 'services', 'bookings',
    'wallet_transactions', 'rewards', 'favorites'
  )
ORDER BY tablename;
```

Expected: `rowsecurity = true` for all tables

---

## 7. Integration Verification

### 7.1 Supabase Connection

```bash
# Test Supabase connectivity
curl -I "https://qwaehqsmodekbgvnaavz.supabase.co/health"
```

Expected: HTTP 200

### 7.2 Edge Functions

```bash
# Test Razorpay order creation function
curl -X POST "https://qwaehqsmodekbgvnaavz.supabase.co/functions/v1/razorpay-create-order" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "currency": "INR"}'
```

Expected: HTTP 200 with order ID

### 7.3 Reverse Proxy

```bash
# Test main website rewrites
curl -I "https://nexora.example.com/app/customer"
curl -I "https://nexora.example.com/app/owner"
curl -I "https://nexora.example.com/app/partner"
```

Expected: HTTP 307/308 redirect to respective PWA origins

---

## 8. Performance Verification

### 8.1 Page Load Times

| Page | Target (p95) | Measurement |
|------|--------------|-------------|
| Homepage | < 2s | Lighthouse / WebPageTest |
| Salon Detail | < 2s | Lighthouse / WebPageTest |
| Customer Dashboard | < 3s | Browser DevTools |
| Owner Dashboard | < 3s | Browser DevTools |
| GP Dashboard | < 3s | Browser DevTools |

### 8.2 API Response Times

| Endpoint | Target (p95) |
|----------|--------------|
| Catalog fetch | < 500ms |
| Booking creation | < 1s |
| Wallet balance | < 300ms |
| Proposal submission | < 1s |

---

## 9. Security Verification

### 9.1 Authentication

- [ ] Unauthenticated users cannot access protected routes
- [ ] Customer cannot access Owner/GP portals
- [ ] Owner cannot access Customer/GP portals
- [ ] GP cannot access Customer/Owner portals
- [ ] Session handling works correctly

### 9.2 Authorization

- [ ] Users can only access their own data (RLS verified)
- [ ] Owners can only manage their own salons
- [ ] GPs can only view their own referrals/commissions

### 9.3 Data Protection

- [ ] No hardcoded credentials in source code
- [ ] Environment variables properly configured
- [ ] API keys not exposed to client-side

---

## 10. Sign-Off

After completing all verifications:

| Checkpoint | Status | Verified By | Date |
|------------|--------|-------------|------|
| Main Website | ☐ PASS / ☐ FAIL | | |
| Customer PWA | ☐ PASS / ☐ FAIL | | |
| Owner PWA | ☐ PASS / ☐ FAIL | | |
| Growth Partner PWA | ☐ PASS / ☐ FAIL | | |
| Database | ☐ PASS / ☐ FAIL | | |
| Integrations | ☐ PASS / ☐ FAIL | | |
| Performance | ☐ PASS / ☐ FAIL | | |
| Security | ☐ PASS / ☐ FAIL | | |

**Overall Status:** ☐ APPROVED / ☐ NEEDS FIXES

**Notes:**
