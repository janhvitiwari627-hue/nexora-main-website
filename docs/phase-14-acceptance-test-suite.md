14. Acceptance Test Suite — Production Release Gate

Execute this phase only after all implementation phases are complete. The current checklist is incomplete unless every test has explicit fixtures, expected results, database evidence, and cleanup steps.

14.1 Test Preconditions

Create isolated test accounts and data:

Anonymous visitor
Customer A and Customer B
Owner A and Owner B
Partner A and unrelated Partner B
Admin account, if an admin role exists
Salon A owned by Owner A
Salon B owned by Owner B
One constrained booking slot
Draft, submitted, approved, rejected, and published proposal fixtures
Test payment, commission, wallet, payout, notification, and review records

Use sandbox/test payment credentials only. Never run destructive acceptance tests against real production users or real payments.

Record:

Deployment URL
Git commit SHA
Supabase project/environment
Migration version
Test timestamp
Tester identity
Browser/device used
14.2 Role and Tenant Isolation

For every role, test every other portal using:

Normal UI navigation
Direct URL entry
Modified route parameters
Direct Supabase REST request
Direct RPC/Edge Function request
Storage object URL or API request
Realtime subscription attempt

Required result:

Unauthenticated requests return 401, redirect to authentication, or return no protected data.
Authenticated but unauthorized requests return 403 or an empty authorized result.
Customer A cannot access Customer B’s records.
Owner A cannot access Salon B or Owner B’s records.
Partner A cannot access unrelated attribution, commission, wallet, or payout data.
Frontend route hiding alone does not count as security.
No unauthorized response may expose protected fields, row counts, metadata, signed URLs, or useful existence information.
14.3 Authentication and Session Security

Verify:

Signup, email confirmation, resend confirmation, login, logout, password recovery, and password reset.
Invalid, expired, reused, and tampered authentication links fail safely.
Disabled OAuth providers are hidden.
Enabled OAuth providers use approved redirect URLs.
Refresh-token rotation works.
Logout clears protected local state, caches, subscriptions, and session-dependent service-worker data.
Expired or revoked sessions cannot perform protected reads or writes.
Changing a user’s role does not preserve old portal access.
Protected pages never briefly render sensitive data before redirecting.
14.4 Partner Publish Workflow

Execute the complete transition:

Draft → Submit → Owner requests changes → Partner edits → Resubmit → Owner approves → Publish → Public visibility

Verify:

Only the authorized partner can edit its draft.
Submitted records cannot be silently changed outside permitted fields.
Owner can act only on submissions belonging to an owned salon/business.
Every status transition is validated server-side.
Invalid or skipped transitions fail.
Approval and publication are separate if the data model treats them separately.
Public data appears only after publication.
Unpublish/archive removes public visibility.
Audit history records actor, timestamp, previous state, new state, and reason.
Repeated submit/approve/publish requests are idempotent.
14.5 Booking Lifecycle

Execute:

Public salon → Service selection → Date/time selection → Availability check → Idempotent booking creation → Owner queue → Confirmation/status updates → Customer history

Verify:

The selected service belongs to the selected salon.
Price, duration, availability, and ownership are recalculated server-side.
Client-supplied price, owner ID, partner ID, commission, or status cannot be trusted.
Duplicate clicks, retries, or repeated requests create only one booking.
Owner sees the booking only for an owned salon.
Customer sees only their own booking.
Every allowed lifecycle transition succeeds.
Every illegal transition fails.
Booking history and audit timestamps remain consistent.
Notifications correspond to committed backend state and are not fabricated by the frontend.
14.6 Concurrency and Double-Booking

Send two genuinely concurrent booking requests from Customer A and Customer B for the same constrained slot.

Required result:

Exactly one request creates a valid booking.
The other request receives a deterministic conflict response.
No duplicate active booking exists after the test.
Availability is enforced by a database constraint, transaction, lock, or equivalent server-side mechanism.
A frontend availability check alone is an automatic failure.
Retry after timeout does not create a second booking.

Repeat this test multiple times to detect race conditions.

14.7 Payment and Webhook Idempotency

Using test-mode payments, verify:

Duplicate order creation does not create multiple payable orders.
Duplicate payment requests do not double-charge.
Duplicate, delayed, and out-of-order webhooks do not double-credit.
Invalid webhook signatures fail.
Replayed webhook event IDs are ignored safely.
Client-supplied “payment successful” state cannot mark an order paid.
Failed and pending payments never credit wallets or commissions.
Refund and cancellation events follow the locked financial rules.
Ledger entries remain immutable and balanced.
Each external payment/event ID maps to no more than one valid internal effect.
14.8 Cancellation and Dispute Matrix

Test every locked rule:

Scenario	Required verification
Customer cancellation within allowed window	Correct status, fee/refund, notification, slot release and ledger result
Customer same-day cancellation	Locked same-day rule applied exactly
Owner cancellation	Correct refund, reason, notification and attribution reversal
Customer no-show	Only authorized actor can mark no-show; financial rule applied
Owner/service-provider no-show	Customer protection and refund rule applied
Cancellation after service start	Blocked or routed to dispute according to policy
Post-start dispute	Evidence, status, authorization and settlement workflow enforced
Duplicate cancellation request	No duplicate refund, fee, credit or notification
Concurrent cancel/complete requests	Only one valid terminal outcome

No cancellation rule may exist only in frontend code.

14.9 Attribution and Commission

Verify:

Eligible Partner A receives exactly the locked commission rate—currently 1%—only after all eligibility conditions and hold periods pass.
Commission is calculated from the explicitly defined base amount.
Partner B receives and sees nothing.
Self-referral and unauthorized attribution attempts fail.
Attribution cannot be changed by editing browser requests.
Cancelled, refunded, disputed, fraudulent, or ineligible bookings do not create payable commission.
Partial refunds produce the defined adjustment.
Duplicate jobs/webhooks do not generate duplicate commission.
Commission moves through only valid states: pending, held, available, paid, reversed, or the project’s locked equivalents.
Wallet balance is derived from immutable ledger entries, not trusted client values.
Payout cannot exceed available balance.
Every payout and reversal is auditable.

If “1%,” the commission base, hold duration, or reversal policy is not formally locked, mark the test BLOCKED instead of guessing.

14.10 Public Privacy

As an anonymous user, attempt direct access to:

Profiles and private contact details
Bookings and booking history
Partner applications and private proposals
Owner/internal salon records
Commission, wallet, ledger and payout records
Notifications
Reviews that are unpublished, moderated, or private
Storage files and signed URLs
Internal audit data
Realtime channels

Required result:

Only explicitly published projection/view fields are readable.
Private base tables are not exposed merely because a public view exists.
Public responses contain no email, phone, internal IDs, payment references, private notes, or ownership metadata unless explicitly approved.
Enumeration using IDs, filters, pagination, joins, or malformed requests reveals nothing protected.
14.11 Storage Security

Verify:

Public assets are intentionally public.
Private objects require authorization or short-lived signed URLs.
A user cannot upload into another user’s or business’s path.
File path manipulation and guessed object names fail.
MIME type, size, extension, and upload limits are enforced.
Replaced or deleted files do not remain accessible through unintended public URLs.
Service-role credentials never appear in browser code, source maps, logs, network responses, or repository history.
14.12 Realtime Security

Verify:

Subscriptions are filtered to the authorized user or business entity.
Customer A receives no Customer B events.
Owner A receives no Salon B events.
Partner A receives no unrelated proposal or commission events.
Subscriptions are removed on logout, role change, route teardown, and account switch.
Reconnecting does not leak stale events from a previous session.
Realtime events never bypass RLS or expose complete private rows unnecessarily.
14.13 Offline Honesty and Retry Safety

Test offline behavior during every important action:

Booking
Cancellation
Proposal submission
Approval
Payment
Review submission
Wallet or payout request

Required result:

The UI never displays completed success before server confirmation.
Read-only cached data shows a visible stale/offline timestamp.
Pending writes are clearly marked as pending.
Only idempotent operations may enter an outbox.
Non-idempotent actions are disabled offline.
Retry uses a stable idempotency key.
Reconnection does not duplicate bookings, payments, commissions, notifications, or reviews.
Failed queued actions remain visible and actionable.
Service workers never inject fake business records.
14.14 Deployment, Routing and PWA

Verify every canonical deep link using a fresh browser request, not client-side navigation:

Public salon and service pages
Authentication and callback routes
Customer portal routes
Owner portal routes
Partner portal routes
Password recovery and confirmation routes
Published proposal/content routes
Valid error and not-found routes

Required result:

Direct loads do not return hosting-level 404.
Assets, manifests, fonts, icons and API requests resolve under the approved base path.
Refreshing a nested route works.
Authentication callbacks return to approved domains only.
Service-worker scope does not control unrelated portals or paths.
Old deployments/service workers do not serve incompatible application code.
PWA cache does not expose protected data after logout.
HTTPS, security headers and canonical redirects work.
No mixed-content or CORS failure exists.
14.15 Abuse and Input Validation

Verify:

Server validates identifiers, enums, dates, money values, quantities and state transitions.
Negative prices, impossible dates, excessive values and malformed UUIDs fail.
Duplicate form submission is safe.
Search, review, profile and proposal inputs are protected against stored or reflected script injection.
Rate limits exist for authentication, booking, application, review, payment and recovery endpoints where appropriate.
Error responses do not reveal SQL, stack traces, secrets, internal schema details or service-role information.
14.16 Observability and Recovery

Verify:

Critical failures produce sanitized logs with correlation/request IDs.
Payment and webhook processing can be traced without exposing secrets.
Unauthorized attempts are detectable.
Retryable and terminal errors are distinguishable.
Failed background jobs are visible and recoverable.
Audit records cannot be modified by ordinary users.
Backup and rollback procedures are documented and tested in a safe environment.
14.17 Test Evidence Required

For every test, record:

Test ID
Requirement
Preconditions and test account role
Exact action/request
Expected result
Actual result
HTTP status
Relevant sanitized response
Database before/after evidence
Screenshot or log reference
PASS, FAIL, BLOCKED, MISSING, or BROKEN
Cleanup performed
Defect/issue reference

A screenshot of the UI alone is insufficient evidence for security, concurrency, payment, commission, or RLS tests.

14.18 Release Decision

Production release is permitted only when:

Every critical test is PASS.
No security, privacy, financial, authentication, concurrency, deployment, or data-isolation test is FAIL, BLOCKED, MISSING, or BROKEN.
Test-created records are cleaned up safely.
The tested commit is the exact commit being deployed.
Any code change after testing triggers reruns of affected tests.
Residual risks are documented and explicitly approved.

PHASE 14 — ACCEPTANCE TEST SUITE

Environment:
Deployment URL:
Git commit SHA:
Supabase environment:
Executed at:

Summary:
PASS:
FAIL:
BLOCKED:
MISSING:
BROKEN:

Critical Results:
[TEST ID] [PASS/FAIL/BLOCKED] — [requirement]
Evidence:
Expected:
Actual:
Issue/Reason:

Security & Role Isolation:
Publish Workflow:
Booking Lifecycle:
Concurrency:
Payments & Webhooks:
Cancellation & Disputes:
Attribution & Commission:
Public Privacy:
Storage:
Realtime:
Offline:
Deployment & PWA:
Abuse Protection:
Observability:

Cleanup Status:
Residual Risks:
Release Decision: GO / NO-GO

Rule:
Never mark a test PASS from code inspection, assumptions, mocked UI behavior, or an unexecuted checklist. If runtime evidence is unavailable, report BLOCKED or MISSING with the exact reason and required action.
