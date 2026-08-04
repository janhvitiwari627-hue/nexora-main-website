# Phase 1 — Same-origin portal routing

**Shared project:** `qwaehqsmodekbgvnaavz`  
**Canonical routes:**

- Customer: `/app/customer/*`
- Shop Owner: `/app/owner/*`
- Growth Partner: `/app/partner/*`

## Decision

The v3 portal contract is path-based, not subdomain-based. The public website and
all role portals therefore stay on one browser origin. Supabase Auth can persist
one session without cross-subdomain cookie or storage workarounds.

`app/lib/portalRoutes.ts` is the single route contract. `NexoraApp` sends every
canonical portal path through `DashboardPage`, which reads the authenticated
user's `profiles.platform_role` before rendering the workspace.

## Role gate

1. An anonymous visit to a portal is sent to `/login` with a same-origin,
   encoded `returnTo` path.
2. After authentication, the profile role is read from Supabase.
3. A URL such as `/app/owner` never grants owner access by itself. If the
   permanent profile role is `customer` or `growth_partner`, the user is sent
   to that role's canonical portal.
4. Legacy `/dashboard/*` URLs remain readable for old links but immediately
   canonicalize to `/app/customer`, `/app/owner`, or `/app/partner`.
5. PWA manifests use the matching path as `id`, `start_url`, and `scope`.

The role selector is disabled during login. `profiles.platform_role` remains the
backend source of truth; the route only expresses the requested destination.

## PWA deployment mount

When the three separately deployed PWAs are ready, configure these **server-only
origin** variables on the main website:

```text
NEXORA_CUSTOMER_PWA_ORIGIN=https://<customer-pwa-origin>
NEXORA_OWNER_PWA_ORIGIN=https://<owner-pwa-origin>
NEXORA_PARTNER_PWA_ORIGIN=https://<partner-pwa-origin>
```

`next.config.ts` then proxies each PWA behind its path without changing the
browser origin. If an origin is absent, the Main Website shows an explicit
portal-unavailable state; it never renders a copied PWA dashboard locally. The
PWA builds must use the matching base path (`/app/customer/`, `/app/owner/`, or
`/app/partner/`) when mounted through these rewrites.

## Verification

```bash
node --test tests/path-routing-contract.test.mjs
```

The contract suite checks all three paths, legacy canonicalization, safe internal
return paths, role-gated rendering, and manifest scopes. It does not claim that a
frontend static test replaces Supabase RLS or staging E2E tests.
