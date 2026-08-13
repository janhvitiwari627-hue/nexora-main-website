# SECTIONS 13 & 14 — STORAGE & REALTIME SECURITY

Date: 2026-08-13
Repository: `janhvitiwari627-hue/nexora-main-website` (+ `job-portal/` workspace)
Expected Supabase project: `qwaehqsmodekbgvnaavz`

---

## STATUS: LIVE VERIFICATION BLOCKED — static analysis complete

No Supabase access (CLI/token/connection absent; egress blocked). **No live PASS is recorded.**
Everything below is repository truth (migration + client code), not live
`storage.buckets`/`storage.objects`/`pg_publication` truth.

---

# SECTION 13 — STORAGE SECURITY

## 13.1 Bucket inventory (declared)

### Main website (`20260808_production_gates_and_blockers.sql`)
| Bucket | Public | Policies | Verdict |
| --- | --- | --- | --- |
| `salon-media` | **false** | `salon_media_owner_{read,write,update,delete}` (owner via `storage_path_uuid(name,'salon')`), `avatar_self_{read,write}` | ✅ private; owner/self-scoped |
| `identity-documents` | **false** | **none for anon/authenticated** (service_role only, signed URLs after identity check) | ✅ correct |

### Job portal (`20260808170200_jobs_rls_storage.sql`)
| Bucket | Public | Policies | Verdict |
| --- | --- | --- | --- |
| `job-resumes` | false | `job_owner_private_{upload,read,update,delete}` (first path seg = `auth.uid()`), `job_resume_employer_read` (employer of applied job) | ✅ |
| `job-certificates` | false | same owner policies + employer read | ✅ |
| `employer-verification` | false | `job_verification_member_access` (salon member of the folder UUID) | ✅ |
| `job-offers` | false | `job_offer_related_access` (candidate or salon member) | ✅ |
| `job-support-attachments` | false | `job_owner_private_*` | ✅ |
| `job-profile-media` | false | `job_owner_private_*` | ✅ |
| `salon-public-media` | **true** | `job_public_media_read` (anon+auth), `job_public_media_member_write` (salon member) | ⚠️ public bucket, but write is member-scoped |

## 13.2 Checklist

| Requirement | Result |
| --- | --- |
| Public media = only intentional public content | ⚠️ `salon-public-media` is public by design (job listing images). Every other bucket is `public=false` |
| Private media requires auth | ✅ all private buckets require `authenticated` + ownership predicate |
| Path includes verified user/salon ownership | ✅ main uses `private.storage_path_uuid(name,prefix)` (server-parses the 2nd path segment, never a free param); jobs uses `(storage.foldername(name))[1] = auth.uid()` |
| Owner manages only own salon media | ✅ `can_manage_salon_settings(storage_path_uuid(name,'salon'))` |
| Partner manages only assigned draft assets | ⚠️ **no partner-scoped storage policy exists** in main repo — partner draft assets (if any) are not covered by a declared policy; flag for confirmation |
| Customer manages only own allowed files | ✅ avatar `avatar_self_*` (`= auth.uid()`); jobs owner policies |
| Cross-user read/write denied | ✅ all predicates key to `auth.uid()` / `can_manage_salon_settings` / `job_is_active_salon_member` |
| Upsert has INSERT+SELECT+UPDATE | ✅ owner buckets have select/insert/update/delete policies (PostgREST upsert needs select+insert+update) |
| Delete ownership-scoped | ✅ `_delete` policies use the same ownership predicate |
| Signed URLs not permanent public | ⚠️ depends on `public=false` buckets (signed, expiring URLs); `salon-public-media` is the only permanent-public bucket (intended) |
| No service-role key in browser uploads | ✅ `packages/auth/src/env.ts` **rejects** a service-role key in the client (`looksLikeServiceRoleKey` → problem flag). No client upload uses a service key |

## 13.3 Findings

- **F13 (P2):** No partner-scoped storage policy in the main repo. If Growth Partners are expected
  to upload "assigned draft assets", that bucket/policy is missing (or lives in a separate PWA repo
  not in this workspace). Confirm.
- **F14 (P3):** `salon-public-media` is a permanent public bucket. Acceptable only for
  intentionally-public listing images; the "signed URLs do not grant permanent access" rule does
  not apply to it by design. Confirm no private file can be written there (member-only write ✅).

---

# SECTION 14 — REALTIME SECURITY

## 14.1 Realtime publication (declared)

| Workspace | Tables added to `supabase_realtime` | Justified? |
| --- | --- | --- |
| Main | `customer_reviews` (only) | ⚠️ **reviews only** — NOT bookings/notifications/proposals |
| Jobs | `job_notifications`, `job_applications`, `job_interview_requests`, `job_offers`, `job_conversations`, `job_messages` | ✅ pipeline/workflow tables, all RLS-protected |

## 14.2 Client subscriptions (verified in code)

- **Main website app (`app/`, `packages/auth/`)**: **no `postgres_changes` / `.channel()` usage** —
  the main site does not subscribe to any Realtime stream. (AuthProvider only unsubscribes its
  auth-state listener.) So booking status / notifications / proposal status are **not** streamed by
  the main app at all.
- **Jobs SPA (`job-portal/src/App.tsx`)**: one channel `workspace-${currentUserId}` subscribing to
  `job_messages`, `job_applications`, `job_notifications` (all `postgres_changes`, `event:'*'`),
  used only to trigger a 250 ms-debounced `hydrateWorkspace` refresh (no direct row rendering from
  the stream).

## 14.3 Checklist

| Requirement | Result |
| --- | --- |
| Used only where required (booking/notification/proposal) | ⚠️ main app uses **none**; jobs uses messages/applications/notifications. Booking-status/proposal-status Realtime is **not implemented** — verify that's intended (or a gap) |
| Filtered by authorized user/entity | ✅ jobs channel is per-user and the *data* refresh re-fetches through RLS (`hydrateWorkspace` queries scoped by `auth.uid()`); the raw stream is also RLS-filtered server-side |
| No unrestricted table stream | ✅ no `channel('public:*')` / no unfiltered whole-table subscription; subscriptions target RLS tables |
| Cleaned up on sign-out | ✅ auth listener sets `currentUserId=null` → effect cleanup runs `supabase.removeChannel(channel)` |
| Cleaned up on component teardown | ✅ `return () => { …; void supabase.removeChannel(channel); }` |
| Role switch / session expiry clears subscription | ✅ channel keyed to `currentUserId`; effect dependency `[currentUserId, …]` tears down + re-subscribes on change; SIGNED_OUT clears id |
| Unauthorized rows cannot be received | ✅ Realtime respects Postgres RLS (`force row level security` / table policies) |
| No balance/payout/private-customer stream leak | ✅ none of `owner_payouts` / `partner_payouts` / commissions / `payments` / `refunds` are in the publication |

## 14.4 Findings

- **F15 (P3):** The main website declares **no** Realtime for booking status / notifications /
  proposal status despite the requirement naming those three. Either (a) those updates are delivered
  by polling/refetch in the PWAs (separate repos), or (b) Realtime is intentionally limited to the
  Jobs portal. **Not a security hole** (absence of a stream cannot leak), but it is a
  requirement-vs-implementation gap to confirm with the PWA repos.
- Jobs Realtime is **correctly scoped**: per-user channel, RLS-backed tables, full cleanup on
  teardown/sign-out/user-switch.

---

## FINAL STATUS

| Check | Result |
| --- | --- |
| LIVE STORAGE INSPECTION | **BLOCKED** |
| LIVE REALTIME INSPECTION | **BLOCKED** |
| STORAGE SECURITY (static) | **PASS** (F13 P2: missing partner-asset policy; F14 P3: intentional public bucket) |
| REALTIME SECURITY (static) | **PASS** (F15 P3: main-app Realtime absent — confirm intended) |

## EXACT REMAINING BLOCKERS
1. Supabase access (read) + sandbox egress for live bucket/policy/publication confirmation.
2. Confirm partner "assigned draft assets" storage requirement (F13).
3. Confirm booking/notification/proposal Realtime delivery path in the PWA repos (F15).

## NEXT REQUIRED ACTION
Provide Supabase read access; confirm F13/F15 with product/PWA repos. Phase 6 remains unstarted;
no live PASS is recorded.
