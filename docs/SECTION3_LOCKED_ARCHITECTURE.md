# Section 3 — Locked four-deployment architecture evidence

## Ownership

| Path | Owner |
|---|---|
| `/` and public routes | Main Website |
| `/app/customer/*` | Customer PWA |
| `/app/owner/*` | Shop Owner PWA |
| `/app/partner/*` | Growth Partner PWA |
| `/admin/*` | Reserved for provisioned moderation surface |

The Main Website now owns only marketing, the public marketplace, salon
storefronts, legal pages, authentication, and the portal gateway. It does not
render a Customer, Owner, or Partner dashboard and it does not create bookings,
process Razorpay orders, submit proposals, or review proposals.

## Reverse proxy

`next.config.ts` maps the three `NEXORA_*_PWA_ORIGIN` server variables to the
canonical `/app/*` paths. The destination is never exposed to the browser; the
browser remains on the apex origin.

If a portal origin is missing, the gateway shows an explicit unavailable state.
It never falls back to a copied dashboard implementation.

## Path base and service workers

The three PWA integration patches set `VITE_APP_BASE_PATH` and update the
manifest/index asset paths. Each worker registers with its base path as scope:

- Customer: `/app/customer/`
- Owner: `/app/owner/`
- Partner: `/app/partner/`

The Main Website no longer registers a root-scope service worker or owns the
role PWA manifests. This prevents a portal worker from intercepting public or
sibling-portal traffic.

## Environment contract

- Main Website (Next/vinext): `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- Customer, Owner, Partner (Vite): `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` only.
- Optional raw-deployment diagnostics: `VITE_CANONICAL_ORIGIN`; when set in a
  production build, the PWA redirects its raw origin to the apex origin while
  preserving the portal path.
- All values must target `qwaehqsmodekbgvnaavz`; no service-role key is used in
  any browser bundle.

## Verification

`tests/path-routing-contract.test.mjs` checks route ownership, proxy mounts,
PWA base/scope contracts, and absence of the Main Website dashboard/booking
implementation. The three PWA patches were applied and built in fresh locked
repository checkouts during Phase 3 verification.
