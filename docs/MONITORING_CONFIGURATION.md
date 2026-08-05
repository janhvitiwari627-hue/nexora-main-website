# Nexora — Monitoring Configuration

**Date:** 2026-08-05
**Shared Supabase project:** `qwaehqsmodekbgvnaavz`

This document outlines the monitoring and observability setup for the Nexora v3 production environment.

---

## 1. Monitoring Stack Overview

| Category | Tool | Purpose |
|----------|------|---------|
| Application Performance | Vercel Analytics | Web vitals, page performance |
| Error Tracking | Sentry (recommended) | Frontend/backend error capture |
| Database Monitoring | Supabase Dashboard | Query performance, connections |
| Uptime Monitoring | UptimeRobot / Pingdom | Service availability |
| Log Aggregation | Vercel Logs + Supabase Logs | Centralized logging |

---

## 2. Key Metrics Dashboard

### 2.1 Business Metrics

| Metric | Description | Target | Measurement |
|--------|-------------|--------|-------------|
| Daily Active Users (DAU) | Unique users per day | Growing | Auth logs |
| Booking Conversion Rate | Bookings / Salon views | > 5% | Analytics |
| Average Order Value | Average booking value | > ₹500 | Bookings table |
| Customer Retention | Repeat bookings / 30 days | > 30% | Bookings table |
| GP Referral Conversion | Referred signups / clicks | > 10% | Referral tracking |

### 2.2 Technical Metrics

| Metric | Description | Target | Measurement |
|--------|-------------|--------|-------------|
| Page Load Time (p95) | Time to interactive | < 3s | Vercel Analytics |
| API Response Time (p95) | Server response time | < 500ms | Application logs |
| Error Rate | 5xx errors / total requests | < 0.1% | Vercel Logs |
| Database Query Time (p95) | Slow queries | < 100ms | Supabase Dashboard |
| Auth Success Rate | Successful logins / attempts | > 95% | Supabase Auth logs |

---

## 3. Alert Configuration

### 3.1 Critical Alerts (Immediate Response)

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Service Down | Any deployment returns 5xx for 5+ minutes | Critical | Page on-call engineer |
| Database Unavailable | Supabase connectivity fails | Critical | Page on-call engineer |
| Payment Failure Spike | > 10 payment failures in 5 minutes | High | Investigate Razorpay + Edge Functions |
| Auth Service Issues | Login failure rate > 20% | High | Check Supabase Auth |

### 3.2 Warning Alerts (Same-Day Response)

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | 5xx rate > 1% for 15 minutes | Warning | Investigate logs |
| Slow API Responses | p95 > 1000ms for 15 minutes | Warning | Check database + functions |
| Unusual Traffic | > 3x normal traffic volume | Warning | Check for DDoS or viral content |
| Database Growth | Table growth > 50% normal rate | Warning | Review data retention policies |

### 3.3 Info Alerts (Weekly Review)

| Alert | Condition | Action |
|-------|-----------|--------|
| New deployment | Any service deployed | Verify in smoke tests |
| Backup completed | Daily backup status | Confirm success |
| Certificate expiry | SSL cert < 30 days | Renew certificate |

---

## 4. Log Configuration

### 4.1 Application Logs

**Vercel Log Settings:**
- Runtime logs: Enabled
- Build logs: Enabled
- Log retention: 7 days (Vercel default)

**Recommended Log Structure:**
```typescript
// Structured logging format
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  service: 'main-website' | 'customer-pwa' | 'owner-pwa' | 'partner-pwa';
  requestId: string;        // Correlation ID
  userId?: string;          // Anonymized user ID
  message: string;
  metadata?: Record<string, unknown>;
}
```

### 4.2 Supabase Logs

**Enable the following in Supabase Dashboard:**
- Auth logs: All events
- Database logs: Errors + slow queries (> 100ms)
- Edge Function logs: All function executions
- Storage logs: File uploads/downloads

### 4.3 Custom Business Events

Track these events for business analytics:

```typescript
// Event tracking examples
trackEvent('booking_created', {
  salonId: string,
  serviceId: string,
  amountPaise: number,
  customerId: string,
});

trackEvent('referral_clicked', {
  growthPartnerId: string,
  referralCode: string,
  source: 'dashboard' | 'share_link' | 'social',
});

trackEvent('wallet_transaction', {
  userId: string,
  type: 'credit' | 'debit',
  amountPaise: number,
  reason: string,
});
```

---

## 5. Health Check Endpoints

### 5.1 API Health Check

Create a simple health check endpoint for monitoring tools:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Check Supabase connectivity
  // Check critical business functions
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      // Add other service checks
    },
  });
}
```

### 5.2 Monitoring URLs

| Service | Health Check URL | Expected |
|---------|------------------|----------|
| Main Website | `https://nexora.example.com/api/health` | 200 OK |
| Customer PWA | `https://custmer-fresh-app.vercel.app/api/health` | 200 OK |
| Owner PWA | `https://pink-nexora-aap.vercel.app/api/health` | 200 OK |
| Growth Partner PWA | `https://pink-growth-partner-aap.vercel.app/api/health` | 200 OK |
| Supabase | `https://qwaehqsmodekbgvnaavz.supabase.co/health` | 200 OK |

---

## 6. Dashboard Setup

### 6.1 Grafana Dashboard (Recommended)

If using Grafana for visualization:

**Data Sources:**
- Supabase: PostgreSQL connector
- Vercel: REST API connector
- Custom metrics: Prometheus/InfluxDB

**Recommended Panels:**

1. **Overview Dashboard**
   - Current active users
   - Today's bookings
   - Today's revenue
   - Error rate (24h)

2. **Business Dashboard**
   - Bookings over time (line chart)
   - Revenue by day (bar chart)
   - Top performing salons
   - GP commission summary

3. **Technical Dashboard**
   - API response times (heatmap)
   - Error rate by service
   - Database query performance
   - Server resource usage

### 6.2 Simple Dashboards

For simpler setups, use:
- **Vercel Analytics**: Built-in web vitals dashboard
- **Supabase Dashboard**: Database metrics
- **Spreadsheets**: Export daily metrics for manual review

---

## 7. Incident Management

### 7.1 Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| SEV-1 | Critical outage, no workaround | 15 minutes | All services down |
| SEV-2 | Major feature broken, workaround exists | 1 hour | Booking flow failing |
| SEV-3 | Minor issue, no user impact | 4 hours | Dashboard display bug |
| SEV-4 | Cosmetic issue | Next business day | Typos, color issues |

### 7.2 Incident Response Process

1. **Detect**: Alert triggers or user report
2. **Triage**: Determine severity and impact
3. **Communicate**: Notify stakeholders
4. **Resolve**: Fix the issue
5. **Verify**: Confirm resolution
6. **Post-mortem**: Document lessons learned

### 7.3 Incident Documentation

```markdown
# Incident Report: [Brief Title]

**Date:** YYYY-MM-DD
**Severity:** SEV-1/2/3/4
**Duration:** X hours Y minutes
**Impact:** X users affected, $Y revenue impact

## Timeline
- HH:MM - Issue detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Issue resolved

## Root Cause
[Description]

## Resolution
[Steps taken]

## Prevention
[How to prevent recurrence]
```

---

## 8. Cost Monitoring

### 8.1 Vercel Usage

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Bandwidth | Monitor monthly | > 80% of plan limit |
| Serverless Function Duration | Monitor monthly | > 80% of plan limit |
| Build Minutes | Monitor monthly | > 80% of plan limit |

### 8.2 Supabase Usage

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Database Size | Monitor weekly | > 80% of plan limit |
| API Requests | Monitor weekly | > 80% of plan limit |
| Storage | Monitor weekly | > 80% of plan limit |
| Edge Function Duration | Monitor weekly | > 80% of plan limit |

---

## 9. Testing Monitoring

### 9.1 Synthetic Tests

Set up automated synthetic transactions:

1. **Login Flow Test**: Daily automated login → dashboard access
2. **Booking Flow Test**: Weekly end-to-end booking test
3. **API Health Test**: 5-minute interval health checks

### 9.2 Chaos Testing (Future)

For mature deployments, consider:
- Database failover testing
- Deployment rollback testing
- Load testing before major releases

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-05 | Initial monitoring configuration |
