# Phase 23 — External 6-Repo Push: Authorization Verification & Readiness

Date: 2026-08-25 (UTC) · Session branch: `arena/01a0350d-nexora-main-website`
Predecessor: `PHASE22_EXTERNAL_REPOS_INTEGRATION_REPORT.md`

## 1. Executive summary

All 6 target repositories were live-verified today. **Read access: 6/6 OK.
Write access: 0/6 (GitHub 403 for `arena-ai-coding-agent[bot]`)** — this is an
account-level authorization gap, not a credential plumbing problem, and it
cannot be fixed from inside this sandbox (see §3). Everything except the
authorization grant is now done: every sync artifact applies cleanly on the
**current** `main` of its target, the one drifted artifact was rebased and
build-verified, and a one-shot push script is committed
(`scripts/push-subapp-sync.sh`). The moment the Arena GitHub App is granted
write on the 6 accounts, a single command completes the sync.

## 2. Verified matrix (2026-08-25)

| # | Target repo (`main`) | Artifact | Target HEAD | Applies | Verified head |
|---|---|---|---|---|---|
| 1 | `promptaivideo4-coder/PINK-NEXORA-AAP-` | `patches/repo1.patch` | `47fb48e` | ✅ clean | `5dc0993` |
| 2 | `diamondpeomotion-cyber/pink-growth-partner-aap-` | `patches/repo2.patch` | `e00f0ed` | ✅ clean | `dee28fa` |
| 3 | `freewebsite859-sudo/REMIX-Final-salon-app-` | `phase22/customer-app/*.patch` (3-commit series) | `2977c1b` | ✅ clean | `28e7854` |
| 4 | `templateapp67-oss/FINAL-NEW-APP-TEMPLETE-` | **`patches/repo4-v2.patch` (NEW — rebased)** | `210fde2` | ✅ after conflict resolution | `a746268` |
| 5 | `portaljob492-creator/Job-Portal-` | `patches/repo5.patch` | `12aae27` | ✅ clean | `d7b4b84` |
| 6 | `prdnexora-svg/beauty-shop-2` | `patches/repo6.patch` | `4ed4d59` | ✅ clean | `0d06ca1` |

Notes:

- **Repo #4 drift**: `FINAL-NEW-APP-TEMPLETE-` main advanced on 08-24 (PRs
  #27/#28) after the 08-23 patch cut; `src/App.tsx` conflicted. Resolved by
  keeping main's evolved template/publishing code **and** layering the patch's
  `supabase` client import, `useLocationSync`, and main-website sign-out
  redirect on top. `npm install` + `npm run build` (vite + esbuild server)
  **PASS** on the resolved tree. Exported as `repo4-v2.patch`.
- **Repo #3 mapping**: the original `repo3.patch` targets
  `freewebsite859-sudo/custmer-Fresh-app-` (still applies cleanly there:
  `cdfec89` → `fea717a`). The verified target list names
  `REMIX-Final-salon-app-`, whose correct artifact is the Phase 22
  customer-app series (base `2977c1b` == current main, applies clean).

## 3. Why push is 403 — root cause (exact, re-proven today)

- Credential plumbing is healthy: pushing the session branch to
  `janvitiwari627-hue/nexora-main-website` succeeds through the same token.
- Every write attempt to the 6 targets is rejected:
  `remote: Permission to OWNER/REPO denied to arena-ai-coding-agent[bot]. …
  The requested URL returned error: 403` (dry-run probe, non-destructive,
  scratch ref — no target repo was modified during verification).
- The sandbox egress proxy substitutes its own GitHub App identity
  (`arena-ai-coding-agent[bot]`) for **every** outbound GitHub
  `Authorization` header — PATs embedded in remote URLs are therefore
  overridden before they reach GitHub, and SSH (22/443) is blocked at the
  network layer (documented with evidence in Phase 22 §4). **Do not share
  PATs in chat; they cannot work from here.**
- The App is installed (write-enabled) only on the main-website account.
  Result: `push: false` on all 6 targets until it is granted there.

## 4. The one remaining action (owner-side, ~minutes)

Grant the Arena GitHub App write access on the 6 accounts, by either:

1. **Reconnect GitHub in Arena** with all 6 repositories included, or
2. installing the Arena GitHub App on each account and selecting the repo.

Then, from this project (or any future session on this repo), run:

```bash
bash scripts/push-subapp-sync.sh            # dry-run status report
bash scripts/push-subapp-sync.sh --apply    # apply + push all 6 mains
```

The script pre-flights write permission on every target, applies the correct
artifact per repo, and fast-forward-pushes to `main` only (never force).
Per-repo `push: true/false` is printed at the end.

## 5. Session-repo state

Artifacts committed on `arena/01a0350d-nexora-main-website`:
`subapp-sync-artifacts/patches/repo4-v2.patch` (rebased, build-pass),
`scripts/push-subapp-sync.sh`, and this report. No secrets are stored
anywhere (patches carry only the public Supabase URL/anon key, RLS-protected
by design, per Phase 22 §3).
