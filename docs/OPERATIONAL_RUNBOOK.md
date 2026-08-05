# Nexora — Operational Runbook

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This runbook provides operational procedures for managing the Nexora v3 production environment.

---

## 1. System Overview

### 1.1 Components

| Component | Technology | Location |
|-----------|------------|----------|
| Main Website | Next.js/Vite (Vercel) | `nexora-main-website` |
| Customer PWA | Vite/Vinext (Vercel) | `custmer-Fresh-app-` |
| Owner PWA | Vite/Vinext (Vercel) | `PINK-NEXORA-AAP-` |
| Growth Partner PWA | Vite/Vinext (Vercel) | `pink-growth-partner-aap-` |
| Database | PostgreSQL (Supabase) | `qwaehqsmodekbgvnaavz` |
| Auth | Supabase Auth | `qwaehqsmodekbgvnaavz` |
| Edge Functions | Supabase Functions | `qwaehqsmodekbgvnaavz` |
| Payments | Razorpay | External |

### 1.2 Architecture Diagram

```
                    ┌──────────────────┐
                    │   Apex Domain    │
                    │ (nexora.example) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Customer  │  │   Owner    │  │    GP      │
     │    PWA     │  │    PWA     │  │    PWA     │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                    ┌───────▼───────┐
                    │    SUPABASE   │
                    │  (qwaehq...)  │
                    └───────────────┘
```

---

## 2. Daily Operations

### 2.1 Health Check

**When:** Every morning before business hours

**Procedure:**
```bash
# 1. Check all deployments
curl -s -o /dev/null -w "%{http_code}" https://nexora.example.com/
curl -s -o /dev/null -w "%{http_code}" https://custmer-fresh-app.vercel.app/
curl -s -o /dev/null -w "%{http_code}" https://pink-nexora-aap.vercel.app/
curl -s -o /dev/null -w "%{http_code}" https://pink-growth-partner-aap.vercel.app/

# 2. Check Supabase
curl -s -o /dev/null -w "%{http_code}" https://qwaehqsmodekbgvnaavz.supabase.co/health

# 3. Verify business rules
# Run in Supabase SQL Editor:
# SELECT * FROM public.verify_business_rules();
```

**Expected:** All HTTP 200, business rules all PASS

### 2.2 Booking Volume Check

**When:** Daily

**Procedure:**
```sql
-- Count bookings in last 24 hours
SELECT 
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(total_amount_paise) / 100.0 as total_revenue_rupees
FROM public.bookings
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 2.3 Pending Proposals Review

**When:** Daily

**Procedure:**
```sql
-- View pending shop onboarding proposals
SELECT 
    s.id,
    s.business_name,
    s.contact_email,
    s.status,
    s.submitted_at,
    gp.email as submitted_by
FROM public.shop_onboarding_applications s
JOIN public.profiles gp ON gp.id = s.submitted_by_growth_partner_id
WHERE s.status = 'pending'
ORDER BY s.submitted_at ASC;
```

---

## 3. Weekly Operations

### 3.1 Payout Processing Check

**When:** Weekly (verify Monday)

**Procedure:**
```sql
-- Check last owner payout run
SELECT 
    pr.id,
    pr.run_at,
    pr.status,
    COUNT(pi.id) as items_processed,
    SUM(pi.amount_paise) / 100.0 as total_paid_rupees
FROM public.owner_payout_runs pr
LEFT JOIN public.payout_items pi ON pi.run_id = pr.id
GROUP BY pr.id, pr.run_at, pr.status
ORDER BY pr.run_at DESC
LIMIT 5;
```

**Expected:** Daily payout runs at 22:00 IST, status = 'completed'

### 3.2 Commission Hold Expiry Check

**When:** Weekly

**Procedure:**
```sql
-- View GP commissions past 7-day hold
SELECT 
    gc.id,
    gc.growth_partner_id,
    gc.amount_paise / 100.0 as amount_rupees,
    gc.held_until,
    CASE 
        WHEN gc.held_until < NOW() THEN 'READY FOR RELEASE'
        ELSE 'ON HOLD'
    END as status
FROM public.growth_partner_commissions gc
WHERE gc.held_until < NOW()
  AND gc.status = 'on_hold'
ORDER BY gc.held_until ASC;
```

---

## 4. Monthly Operations

### 4.1 Revenue Report

**When:** First of each month

**Procedure:**
```sql
-- Monthly revenue summary
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_bookings,
    SUM(total_amount_paise) / 100.0 as gross_revenue_rupees,
    SUM(advance_amount_paise) / 100.0 as advance_collected_rupees
FROM public.bookings
WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### 4.2 Growth Partner Commission Report

**When:** First of each month

**Procedure:**
```sql
-- Monthly GP commission summary
SELECT 
    p.email as growth_partner_email,
    COUNT(DISTINCT gc.id) as commissions_earned,
    SUM(gc.amount_paise) / 100.0 as total_commission_rupees
FROM public.growth_partner_commissions gc
JOIN public.profiles p ON p.id = gc.growth_partner_id
WHERE gc.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND gc.created_at < DATE_TRUNC('month', NOW())
  AND gc.status = 'paid'
GROUP BY p.email
ORDER BY total_commission_rupees DESC;
```

### 4.3 User Growth Report

**When:** First of each month

**Procedure:**
```sql
-- Monthly new user signups by role
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE platform_role = 'customer') as customers,
    COUNT(*) FILTER (WHERE platform_role = 'business_owner') as owners,
    COUNT(*) FILTER (WHERE platform_role = 'growth_partner') as partners
FROM public.profiles
WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 5. Incident Response

### 5.1 Service Outage

**Symptoms:** One or more deployments returning errors or unreachable

**Response:**
1. Check deployment status in Vercel dashboard
2. Check Supabase status page (status.supabase.com)
3. Verify environment variables are correct
4. Check application logs for error messages
5. If deployment issue: trigger manual redeploy
6. If Supabase issue: escalate to Supabase support

### 5.2 Database Issues

**Symptoms:** Slow queries, connection errors, data inconsistencies

**Response:**
1. Check Supabase dashboard for database health
2. Review slow query logs
3. Check connection pool usage
4. Verify no long-running transactions
5. If data issue: restore from backup (see Section 7)

### 5.3 Payment Failures

**Symptoms:** Bookings failing at payment step, Razorpay errors

**Response:**
1. Check Razorpay dashboard for API health
2. Verify Edge Function is deployed
3. Check application logs for specific error
4. Verify Razorpay API keys in environment
5. Test with sandbox credentials if needed

### 5.4 Security Incident

**Symptoms:** Suspicious login attempts, unusual data access, reported vulnerability

**Response:**
1. Document the incident (time, symptoms, affected systems)
2. Rotate affected credentials immediately
3. Review auth logs in Supabase
4. Check for unauthorized data access
5. Notify security team
6. File incident report

---

## 6. Common Tasks

### 6.1 Create Test User

```sql
-- Create a test customer
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test-customer@example.com', crypt('Test123!', gen_salt('bf')), NOW())
RETURNING id;

-- Then create profile via trigger or manually:
INSERT INTO public.profiles (id, email, platform_role, full_name)
VALUES ('{user_id}', 'test-customer@example.com', 'customer', 'Test Customer');
```

### 6.2 Reset User Password

```sql
-- Generate new password hash
-- Then update:
UPDATE auth.users 
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'user@example.com';
```

### 6.3 Grant super admin access (temporary)

```sql
-- Add user to supabase_admin role for debugging
-- Use with caution and revoke after use
ALTER USER "db-user" WITH SUPERUSER;
-- After debugging:
ALTER USER "db-user" WITH NOSUPERUSER;
```

### 6.4 View RLS Policies

```sql
-- List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual::text as condition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 7. Backup & Recovery

### 7.1 Database Backup

Supabase provides automatic daily backups with point-in-time recovery.

**To restore:**
1. Navigate to Supabase Dashboard → Database → Backups
2. Select the backup point
3. Click "Restore"
4. Verify data integrity after restore

### 7.2 Rollback Deployment

**Vercel:**
1. Go to Vercel Dashboard → Project → Deployments
2. Find the last known good deployment
3. Click "..." → "Rollback"
4. Verify the rollback

### 7.3 Migration Rollback

Most migrations are idempotent. For problematic migrations:

1. Export current schema: `pg_dump --schema-only > schema-before.sql`
2. Apply migration
3. Test thoroughly
4. If issues: restore from backup

---

## 8. Escalation Contacts

| Issue Type | First Response | Escalation |
|------------|----------------|------------|
| Deployment/Vercel | Vercel Support | Platform team |
| Database/Supabase | Supabase Support | Platform team |
| Payment/Razorpay | Razorpay Support | Finance team |
| Security | Security team | CTO |
| Business logic | Product team | Project lead |

---

## 9. Maintenance Windows

| Activity | Frequency | Scheduled Time |
|----------|-----------|----------------|
| Database vacuum/analyze | Weekly | Sunday 03:00 IST |
| Deployment updates | As needed | Tuesday/Thursday 02:00 IST |
| Backup verification | Monthly | First Monday 04:00 IST |
| Security patches | As needed | Emergency schedule |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-05 | Initial operational runbook |
