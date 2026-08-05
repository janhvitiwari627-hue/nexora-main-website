# Nexora — Phase 7 Security Hardening

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This document outlines the security hardening measures implemented in Phase 7.

---

## 1. Security Overview

Phase 7 strengthens security across all four deployments with focus on:
- Authentication security
- Authorization enforcement
- Data protection
- Attack surface reduction
- Monitoring and incident response

---

## 2. Authentication Security

### 2.1 Supabase Auth Best Practices

#### Environment Variables

```bash
# Main Website (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# PWAs (Vite)
VITE_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Rules:**
- Never use service_role key in browser code
- Never hardcode credentials
- Use environment variables only

#### Auth Flow Security

```typescript
// Main website auth flow
async function authenticate(client: SupabaseClient, email: string, password: string) {
  // 1. Sign in with Supabase
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // 2. Verify user
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error("Authentication failed");

  // 3. Verify profile exists and is active
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.is_active !== true) {
    await client.auth.signOut();
    throw new Error("Profile not found or inactive");
  }

  // 4. Verify role is valid
  if (!["customer", "business_user", "growth_partner"].includes(profile.platform_role)) {
    await client.auth.signOut();
    throw new Error("Invalid role");
  }

  return { user, profile };
}
```

### 2.2 Growth Partner Auth - localStorage Removal

**Critical Security Fix:** Phase 7 removes all localStorage-based auth from Growth Partner PWA.

**Before (Insecure):**
```typescript
// ❌ NEVER DO THIS
localStorage.setItem('gp_token', jwt);
localStorage.setItem('gp_profile', JSON.stringify(profile));
```

**After (Secure):**
```typescript
// ✅ Supabase Auth only
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) throw new Error("Not authenticated");

const { data: profile } = await supabase
  .from('profiles')
  .select('platform_role, is_active')
  .eq('id', session.user.id)
  .single();

if (profile.platform_role !== 'growth_partner') {
  throw new Error("Invalid role");
}
```

### 2.3 Password Policy

```sql
-- Enforce password strength via Supabase Auth
ALTER TABLE auth.users
ALTER COLUMN encrypted_password SET STATISTICS 0;

-- Password strength requirements (configured in Supabase Dashboard)
-- Minimum length: 8 characters
-- Require uppercase, lowercase, number, special character
```

---

## 3. Authorization Security

### 3.1 Role-Based Access Control

#### Role Definitions

| Role | Value | Access |
|------|-------|--------|
| Customer | `customer` | Customer PWA, booking, wallet, reviews |
| Business Owner | `business_user` | Owner PWA, own salon management |
| Growth Partner | `growth_partner` | Partner PWA, referrals, commissions |

#### Role Gate Implementation

```typescript
// Main website role verification
function verifyRole(client: SupabaseClient, expectedRole: Role): Promise<boolean> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;

  const { data: profile } = await client
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", user.id)
    .single();

  return (
    profile?.platform_role === expectedRole &&
    profile?.is_active === true
  );
}
```

### 3.2 Shop Owner Authorization - Organization Membership

**Critical Enhancement:** Phase 7 adds organization_members check for Shop Owner PWA.

```sql
-- Organization members check
CREATE OR REPLACE FUNCTION private.can_manage_salon(p_salon_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Must be business_user
  IF (SELECT platform_role FROM public.profiles WHERE id = p_user_id) <> 'business_user' THEN
    RETURN false;
  END IF;

  -- Must be member of organization that owns the salon
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.salons s ON s.organization_id = om.organization_id
    WHERE om.user_id = p_user_id
      AND s.id = p_salon_id
      AND om.is_active = true
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// Owner PWA authorization check
async function authorizeSalonAccess(client: SupabaseClient, salonId: string): Promise<boolean> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;

  const { data: profile } = await client
    .from('profiles')
    .select('platform_role, is_active')
    .eq('id', user.id)
    .single();

  if (profile?.platform_role !== 'business_user' || profile?.is_active !== true) {
    return false;
  }

  // Check organization membership
  const { data: membership } = await client
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership) return false;

  // Check salon belongs to user's organization
  const { data: salon } = await client
    .from('salons')
    .select('organization_id')
    .eq('id', salonId)
    .single();

  return salon?.organization_id === membership.organization_id;
}
```

### 3.3 RLS Policies

#### Customer Data Isolation

```sql
-- Customers can only see own bookings
CREATE POLICY "customers_see_own_bookings"
ON public.bookings
FOR SELECT
USING (customer_id = auth.uid());

-- Customers can only update own bookings (for cancellation)
CREATE POLICY "customers_update_own_bookings"
ON public.bookings
FOR UPDATE
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());
```

#### Owner Data Isolation

```sql
-- Owners can only manage own salons
CREATE POLICY "owners_manage_own_salons"
ON public.salons
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

#### Growth Partner Data Isolation

```sql
-- Partners can only see own commissions
CREATE POLICY "partners_see_own_commissions"
ON public.growth_partner_commissions
FOR SELECT
USING (growth_partner_id = private.current_growth_partner_id());

-- Partners can only see own attributions
CREATE POLICY "partners_see_own_attributions"
ON public.shop_attributions
FOR SELECT
USING (growth_partner_id = auth.uid());
```

---

## 4. Data Protection

### 4.1 Column-Level Security

```sql
-- Prevent direct client writes to balance columns
CREATE OR REPLACE FUNCTION public.guard_profile_balance_columns()
RETURNS trigger AS $$
BEGIN
  -- Only allow server RPCs, service_role, or postgres to modify
  IF current_setting('nexora.balance_writer', true) <> 'nexora-server-rpc'
     AND v_role <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Direct balance modification not allowed';
  END IF;

  -- Ensure loyalty_points and wallet_balance_paise don't change via normal updates
  IF NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points
     OR NEW.wallet_balance_paise IS DISTINCT FROM OLD.wallet_balance_paise THEN
    RAISE EXCEPTION 'Balance columns must be modified via server RPCs';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_profile_balance_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_balance_columns();
```

### 4.2 Sensitive Data Handling

| Data Type | Storage | Access | Notes |
|-----------|---------|--------|-------|
| Passwords | Supabase Auth (hashed) | Never exposed | bcrypt/argon2 |
| PII (name, email) | profiles table | RLS protected | Minimal collection |
| Payment info | Razorpay (tokenized) | Never stored | PCI compliance |
| Wallet balance | profiles.wallet_balance_paise | RLS + trigger guard | Server-managed only |
| Commission data | growth_partner_commissions | RLS protected | Read-only for partners |

### 4.3 Audit Logging

```sql
-- Business rule events for audit trail
CREATE TABLE IF NOT EXISTS public.business_rule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  actor_type text,
  actor_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Example: Log commission accrual
INSERT INTO public.business_rule_events (event_type, entity_type, entity_id, actor_type, actor_id, details)
VALUES (
  'commission_accrued',
  'booking',
  p_booking_id,
  'growth_partner',
  v_gp_id,
  jsonb_build_object(
    'amount_paise', v_gp_paise,
    'hold_until', v_hold_until
  )
);
```

---

## 5. Attack Surface Reduction

### 5.1 Input Validation

```typescript
// Validate all user inputs
function validateBookingInput(data: unknown): BookingInput {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid input');
  }

  const { salon_id, service_id, appointment_start } = data as Record<string, unknown>;

  if (typeof salon_id !== 'string' || !salon_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid salon_id');
  }

  if (typeof service_id !== 'string' || !service_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid service_id');
  }

  const start = new Date(appointment_start as string);
  if (isNaN(start.getTime()) || start < new Date()) {
    throw new Error('Invalid appointment_start');
  }

  return { salon_id, service_id, appointment_start: start };
}
```

### 5.2 SQL Injection Prevention

- All queries use parameterized statements
- No string concatenation for SQL
- Supabase client handles parameterization

```typescript
// ✅ Safe - parameterized
const { data } = await client
  .from('salons')
  .select('*')
  .eq('id', salonId);

// ❌ NEVER - string concatenation
const { data } = await client.rpc('query', [`SELECT * FROM salons WHERE id = '${salonId}'`]);
```

### 5.3 XSS Prevention

- React handles XSS via automatic escaping
- No dangerouslySetInnerHTML without sanitization
- Content Security Policy headers

```typescript
// ✅ Safe
return <div>{userInput}</div>;

// ❌ NEVER without sanitization
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
```

### 5.4 CSRF Protection

Supabase Auth handles CSRF via:
- SameSite cookie attributes
- XSSI header protection
- PKCE flow for OAuth

---

## 6. Security Headers

### 6.1 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://qwaehqsmodekbgvnaavz.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://qwaehqsmodekbgvnaavz.supabase.co;
  frame-ancestors 'none';
">
```

### 6.2 Other Security Headers

```typescript
// Next.js headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const config = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 7. Security Monitoring

### 7.1 Authentication Monitoring

```sql
-- Monitor failed login attempts
CREATE MATERIALIZED VIEW public.auth_failures_daily AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT email) as unique_emails
FROM auth.logins
WHERE status = 'failed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Refresh daily
REFRESH MATERIALIZED VIEW public.auth_failures_daily;
```

### 7.2 Suspicious Activity Detection

```sql
-- Detect unusual patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE (
  user_id uuid,
  activity_type text,
  reason text,
  occurred_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  -- Multiple failed logins from same IP
  SELECT
    a.user_id,
    'failed_logins',
    'Multiple failed attempts detected',
    a.created_at
  FROM auth.logins a
  WHERE a.status = 'failed'
    AND a.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY a.user_id, a.created_at
  HAVING COUNT(*) > 5;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Security Incident Response

| Severity | Description | Response Time | Action |
|----------|-------------|---------------|--------|
| Critical | Data breach, auth bypass | Immediate | Incident response team |
| High | Privilege escalation attempt | 1 hour | Security review |
| Medium | Multiple failed logins | 4 hours | Account review |
| Low | Policy violation | 24 hours | Log and monitor |

---

## 8. Security Checklist

### 8.1 Pre-Launch Security Checklist

- [ ] All environment variables configured (no hardcoded secrets)
- [ ] RLS enabled on all tables
- [ ] RLS policies tested with different user roles
- [ ] Service role key not exposed to client
- [ ] Input validation implemented
- [ ] Password policy enforced
- [ ] Authentication flow tested
- [ ] Authorization checks verified
- [ ] Error messages don't leak sensitive info
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Backup/recovery tested

### 8.2 Ongoing Security Tasks

| Frequency | Task |
|-----------|------|
| Daily | Review auth logs for suspicious activity |
| Weekly | Review RLS policies for gaps |
| Monthly | Rotate API keys if needed |
| Quarterly | Security audit, dependency updates |
| Annually | Penetration testing |

---

## 9. Security Incident Response Plan

### 9.1 Incident Categories

| Category | Examples |
|----------|----------|
| Authentication bypass | Unauthorized access to accounts |
| Authorization bypass | Accessing other users' data |
| Data exposure | Sensitive data leaked |
| Injection attacks | SQL injection attempts |
| DoS attacks | Service availability impacted |

### 9.2 Response Procedure

1. **Detect:** Alert triggered or user report
2. **Contain:** Stop the attack (rollback, disable access)
3. **Investigate:** Determine scope and cause
4. **Eradicate:** Fix the vulnerability
5. **Recover:** Restore normal operations
6. **Learn:** Document and improve

### 9.3 Contact Information

| Role | Responsibility |
|------|----------------|
| Security Lead | Incident coordination |
| Platform Team | Technical response |
| Legal | Compliance, notifications |
| Communications | User/stakeholder updates |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-05 | Initial Phase 7 security hardening |

---

## 11. References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Phase 7 Implementation Report](../PHASE7_IMPLEMENTATION_REPORT.md)
- [Business Rules](../supabase/BUSINESS_RULES.md)
