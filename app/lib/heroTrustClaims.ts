/**
 * Homepage Phase 1 · Section 02 — Hero trust claims.
 *
 * Hard rule: every claim a visitor reads under the Hero must be verifiable
 * from the platform's own backend or code. No invented counts, ratings or
 * testimonials. Each claim therefore ships with `verifiedBy` — the exact
 * backend rule, table gate, RPC or code contract that enforces it.
 *
 * If a claim cannot point at such a verification, it must be REMOVED from
 * this list rather than shipped. That already happened once: the earlier
 * "no hidden markup" line was dropped because the platform DOES take a
 * disclosed 10% fee (locked business rule 2) — the honest, verified claim
 * is that the fee rules are locked and server-verified instead.
 *
 * This module is data only (no JSX, no React, no navigation) so contract
 * tests can assert the exact set of claims without rendering anything.
 */

export type HeroTrustClaim = {
  /** The exact sentence rendered in the Hero trust list. */
  claim: string;
  /** Where the claim is enforced — backend gate, RPC or code contract. */
  verifiedBy: string;
};

export const HERO_TRUST_CLAIMS: readonly HeroTrustClaim[] = [
  {
    claim: "Only salon-owner approved, published websites are listed",
    verifiedBy:
      "Public catalog gate — salon_public_websites.is_published=true joined to salons with verified=true, is_active=true, deleted_at null (app/nexora-app.tsx fetchCatalogFromTables); publishing happens only through the owner's review_salon_setup(proposal_id, 'publish') RPC.",
  },
  {
    claim: "Real services, prices and timings set by each salon",
    verifiedBy:
      "Owner-managed tables services, staff and salon_hours (price_paise, duration_minutes, opens_at/closes_at), isolated by RLS and read by the marketplace — never mock data.",
  },
  {
    claim: "Payments follow locked business rules, verified server-side",
    verifiedBy:
      "supabase/BUSINESS_RULES.md — 25% advance / 75% final, owner 90% / platform 10%, GP commission held 7 days, owner payout daily 22:00 IST; self-test via verify_business_rules().",
  },
  {
    claim: "One Nexora account across every Nexora app",
    verifiedBy:
      "Shared @nexora/auth package (packages/auth) — one Supabase project qwaehqsmodekbgvnaavz, one PKCE session and one storage key (NEXORA_STORAGE_KEY) across the Main Website and all six apps.",
  },
];

/** Convenience for renderers and tests: just the display strings. */
export const HERO_TRUST_CLAIM_TEXTS: readonly string[] = HERO_TRUST_CLAIMS.map(
  (entry) => entry.claim,
);
