# Pull Request — Final Nexora v3 merge

## PR metadata

- **Repository:** `janhvitiwari627-hue/nexora-main-website`
- **Base:** `main`
- **Compare:** `arena/019fcc8c-nexora-main-website`
- **Suggested title:** `feat: finalize Nexora v3 four-deployment architecture`
- **Latest branch commit:** `f3e16cc`
- **Suggested labels:** `enhancement`, `security`, `supabase`, `release`

## Summary

This PR finalizes the Nexora v3 architecture: one apex origin with path-based
reverse-proxy mounts for the Customer, Owner, and Growth Partner PWAs. The Main
Website owns public marketing/marketplace/storefront/legal/auth/gateway only;
booking, operations, proposals, attribution, commissions, and payout views live
in their respective PWA packages.

## Included

- Path-based portal route contract and reverse-proxy configuration.
- Permanent profile role gate and role-immutability migration.
- Customer production cleanup and Customer PWA handoff.
- Shop Owner Supabase integration patch.
- Growth Partner Supabase integration patch.
- Server-generated Growth Partner identity/referral RPC migration.
- Base-path manifests/assets and portal-scoped service workers.
- Main Website root service-worker removal.
- Contract, TypeScript, build, bundle-scan, and patch-application evidence.
- Final release audit at `docs/FINAL_PHASE_EXECUTION_REPORT.md`.

## Required deployment checks before merge approval

1. Apply all pending migrations, especially
   `20260806_growth_partner_identity.sql`.
2. Apply each generated PWA patch to its current locked `main` repository.
3. Configure the three `NEXORA_*_PWA_ORIGIN` variables on the Main Website.
4. Configure matching Vite base paths and Supabase env values on each PWA.
5. Run the live apex-domain golden-path and negative-RLS smoke tests.
6. Confirm SMTP/OAuth redirect allowlists and payment edge-function smoke test.

## Automated evidence

```text
Main contract tests: 55/55 PASS
Main npm test: PASS
Customer patch: apply + tsc + build PASS
Owner patch: apply + tsc + build PASS
Growth Partner patch: apply + tsc + build PASS
```

## Merge note

Merging this PR changes the Main Website and stores the verified PWA patches and
release evidence. The three PWA repositories still require their own patch
application commits/merges; they are not modified by this Main Website PR.
