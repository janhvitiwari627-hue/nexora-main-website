# Sub-app Supabase Sync Report

Date: 2026-08-23

Implemented locally for all 6 repositories:

- `.env` added with shared Supabase URL, anon key, and storage key.
- Supabase client updated to PKCE + persistent `nexora.auth.qwaehqsmodekbgvnaavz` storage.
- `useLocationSync` hook added and wired into authenticated shells.
- Main Website redirect helper added for sign-out / lost-session handling.
- Build verification completed locally.

## Repository status

### promptaivideo4-coder/PINK-NEXORA-AAP-
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `bb81c7e`
- Patch: `subapp-sync-artifacts/patches/repo1.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

### diamondpeomotion-cyber/pink-growth-partner-aap-
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `f45ffe5`
- Patch: `subapp-sync-artifacts/patches/repo2.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

### freewebsite859-sudo/custmer-Fresh-app-
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `8098457`
- Patch: `subapp-sync-artifacts/patches/repo3.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

### templateapp67-oss/FINAL-NEW-APP-TEMPLETE-
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `4812ecc`
- Patch: `subapp-sync-artifacts/patches/repo4.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

### portaljob492-creator/Job-Portal-
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `b51a952`
- Patch: `subapp-sync-artifacts/patches/repo5.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

### prdnexora-svg/beauty-shop-2
- Local branch: `arena/01a02f23-nexora-main-website`
- Local commit: `1f94f72`
- Patch: `subapp-sync-artifacts/patches/repo6.patch`
- Push status: retried after GitHub reconnect, still blocked by GitHub 403 (no write permission for arena-ai-coding-agent[bot])

## Build verification

- repo1: `npm run build` ✅
- repo2: `npm run build` ✅
- repo3: `npm run build` ✅
- repo4: `npm run build` ✅
- repo5: `npm run build` ✅
- repo6: `npm run build` ✅

## Next step

GitHub auth is active, but the Arena bot still lacks write/fork permission on these repositories. Grant write access to arena-ai-coding-agent[bot] (or reconnect with a token/account that has contents+pull_requests write access), then the local branches/patches can be pushed and PRs opened.