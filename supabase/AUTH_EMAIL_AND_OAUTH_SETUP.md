# Nexora — Supabase Auth: SMTP, Email Templates & Google OAuth Configuration

Project: `qwaehqsmodekbgvnaavz` · Canonical site: `https://nexora.app` (see `docs/PRODUCTION_DEPLOYMENT_TOPOLOGY.md`)
All auth flows in the Main Website are real Supabase Auth (PKCE, `flowType: "pkce"`):
signup + confirm + resend, login, logout, forgot/reset password, OAuth callback, session-expired handling.
There is **no mock auth** in this repository.

Dedicated routes served by `app/nexora-app.tsx`:

| Route | Purpose | Supabase API used |
|---|---|---|
| `/login`, `/signup` | Password auth, role from `profiles.platform_role` only | `signInWithPassword`, `signUp` |
| `/auth/callback` | PKCE code exchange (email confirm + OAuth) | `exchangeCodeForSession` |
| `/forgot-password` | Sends recovery email | `resetPasswordForEmail` |
| `/reset-password` | Sets new password from recovery session | `updateUser({ password })` |
| `/auth/expired` | Session-expired landing, signs out | `signOut` |

---

## 1. Supabase Dashboard — SMTP Configuration Checklist

Apply in: **Dashboard → Project `qwaehqsmodekbgvnaavz` → Authentication → Emails → SMTP Settings**.
Supabase's built-in rate-limited mailer is NOT acceptable for production signups.

| # | Setting | Required value | Verified |
|---|---|---|---|
| 1 | Enable custom SMTP | **ON** (disable "Use default SMTP") | ☐ |
| 2 | Host | Your provider host, e.g. `email-smtp.ap-south-1.amazonaws.com` (SES Mumbai) / `smtp.postmarkapp.com` / `smtp.resend.com` | ☐ |
| 3 | Port | `587` (STARTTLS) or `465` (implicit TLS) | ☐ |
| 4 | Username | Provider SMTP username / API access key id | ☐ |
| 5 | Password | Provider SMTP password / secret (stored in Supabase secret manager only — never in this repo) | ☐ |
| 6 | Minimum interval between emails | `60` seconds | ☐ |
| 7 | Sender email | `no-reply@nexora.app` (must be a verified identity/domain in the provider) | ☐ |
| 8 | Sender name | `Nexora` | ☐ |
| 9 | Provider domain verification | Verify `nexora.app` (SPF, DKIM, DMARC records published in DNS) | ☐ |
| 10 | Test | Send test confirmation email; confirm SPF/DKIM pass (check headers) | ☐ |

DNS records to publish for the sending domain (values from your provider):

```
nexora.app.  TXT  "v=spf1 include:<provider> ~all"
nexora._domainkey.nexora.app.  CNAME  <provider DKIM value>
_dmarc.nexora.app.  TXT  "v=DMARC1; p=quarantine; rua=mailto:postmaster@nexora.app"
```

## 2. Supabase Dashboard — URL Configuration Checklist

Apply in: **Dashboard → Authentication → URL Configuration**.

| # | Setting | Required value | Verified |
|---|---|---|---|
| 1 | Site URL | `https://nexora.app` | ☐ |
| 2 | Redirect URLs allowlist | `https://nexora.app/**` | ☐ |
| 3 | Redirect URLs allowlist | `https://nexora.app/auth/callback` (explicit) | ☐ |
| 4 | Redirect URLs allowlist | `https://nexora.app/reset-password` (explicit) | ☐ |
| 5 | Redirect URLs allowlist | `https://www.nexora.app/**` (only if www is kept; else remove www DNS) | ☐ |
| 6 | Remove | Any `localhost` / preview / staging entries before launch (or keep only staging project) | ☐ |

## 3. Supabase Dashboard — Auth Providers & Sessions Checklist

Apply in: **Dashboard → Authentication → Providers / Sessions**.

| # | Setting | Required value | Verified |
|---|---|---|---|
| 1 | Email provider | **Enabled** | ☐ |
| 2 | Confirm email | **ON** (signup requires confirmed email) | ☐ |
| 3 | One-time passcodes / magic links | OFF (not used by this app) | ☐ |
| 4 | Password minimum length | `6` (matches client validation) | ☐ |
| 5 | Rate limiting — signups | `30/hour` | ☐ |
| 6 | Rate limiting — token resend | `30/hour` | ☐ |
| 7 | Access token lifetime | `1h` | ☐ |
| 8 | Refresh token rotation | ON, reuse interval `10s` | ☐ |
| 9 | Session inactivity timeout | `1 week` | ☐ |
| 10 | Anonymous sign-ins | **OFF** | ☐ |

## 4. Email Templates Checklist

Apply in: **Dashboard → Authentication → Emails → Email Templates**. All links must use `{{ .ConfirmationURL }}` / `{{ .TokenURL }}` and resolve to `nexora.app` routes.

| Template | Subject | Body must contain | Verified |
|---|---|---|---|
| Confirm signup | `Confirm your Nexora account` | `<h2>Confirm your Nexora account</h2><p>Click below to activate your account.</p><a href="{{ .ConfirmationURL }}">Confirm email</a>` — link lands on `/auth/callback` | ☐ |
| Magic link | (disabled — not used) | n/a | ☐ |
| Change email address | `Confirm your new Nexora email` | `{{ .ConfirmationURL }}` | ☐ |
| Reset password | `Reset your Nexora password` | `<h2>Reset your password</h2><p>This link can be used once and expires.</p><a href="{{ .TokenURL }}">Reset password</a>` — link lands on `/reset-password` | ☐ |
| Invite user | `You are invited to Nexora` | `{{ .ConfirmationURL }}` (admin-only flow) | ☐ |

Template variables available: `{{ .Email }}`, `{{ .Token }}`, `{{ .TokenURL }}`, `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .RedirectURL }}`, `{{ .TokenHash }}`, `{{ .Data.full_name }}`, `{{ .Data.signup_role }}` (Nexora passes `full_name` and `signup_role` in signup metadata).

Brand footer to append to every template:

```html
<p style="color:#705a64;font-size:12px">Nexora — one connected platform for salons, customers, owners and growth partners. If you did not request this email, ignore it; the link only works for the account it was sent to.</p>
```

## 5. Verification (end-to-end, after applying the above)

1. Sign up with a fresh email → confirmation mail arrives from `no-reply@nexora.app` within 60s → click → lands on `/auth/callback` → profile role resolved → routed to correct portal.
2. Log in before confirming → error "Please confirm your email first" is shown.
3. "Resend confirmation email" on `/signup` → second email arrives; newest link wins.
4. `/forgot-password` → recovery mail arrives → click → `/reset-password` → set new password → routed to portal. Re-using the same link fails.
5. Log in on a second device, then revoke session from Supabase Dashboard (Authentication → Sessions) → app lands on `/auth/expired` on next navigation.

---

## 6. Section 10.2 — Google OAuth: Google Cloud Console + Supabase Parameters

The Main Website shows "Continue with Google" **only** when `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`
AND the provider responds. If keys are missing/unverified or the provider call fails, the button is
hidden entirely (fail-safe in `app/nexora-app.tsx`, `continueWithGoogle()` + `googleOauthFailed`).
PKCE is enforced end-to-end: the client is created with `flowType: "pkce"` and the OAuth redirect is
`/auth/callback`, where `exchangeCodeForSession` validates the code against the stored `code_verifier`.

### 6.1 Google Cloud Console (`console.cloud.google.com`)

| # | Where | Parameter | Required value | Verified |
|---|---|---|---|---|
| 1 | Project | Project | Dedicated project, e.g. `nexora-auth` | ☐ |
| 2 | APIs & Services → OAuth consent screen | User type | **External** | ☐ |
| 3 | OAuth consent screen | App name | `Nexora` | ☐ |
| 4 | OAuth consent screen | Authorized domains | `nexora.app`, `qwaehqsmodekbgvnaavz.supabase.co` | ☐ |
| 5 | OAuth consent screen | Scopes | `openid`, `email`, `profile` only | ☐ |
| 6 | Credentials → Create OAuth client ID | Application type | **Web application** | ☐ |
| 7 | OAuth client | Authorized JavaScript origins | `https://qwaehqsmodekbgvnaavz.supabase.co` | ☐ |
| 8 | OAuth client | Authorized redirect URI | `https://qwaehqsmodekbgvnaavz.supabase.co/auth/v1/callback` | ☐ |
| 9 | OAuth consent screen | Publishing status | **In production** (publish app) — while in "Testing", only test users can sign in | ☐ |
| 10 | Credentials | Copy **Client ID** + **Client secret** | into Supabase (never commit) | ☐ |

### 6.2 Supabase Dashboard

| # | Where | Parameter | Required value | Verified |
|---|---|---|---|---|
| 1 | Authentication → Providers → Google | Enable Google provider | **ON** | ☐ |
| 2 | Google provider | Client ID (from GCP) | `<google-client-id>.apps.googleusercontent.com` | ☐ |
| 3 | Google provider | Client secret (from GCP) | stored in Supabase secret manager only | ☐ |
| 4 | Google provider | Allowed redirect URLs | `https://nexora.app/auth/callback` | ☐ |
| 5 | Authentication → URL Configuration | Redirect allowlist already contains `/auth/callback` | (see §2 #3) | ☐ |
| 6 | Environment variable (deploy target) | `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `true` only after rows 1–5 verified | ☐ |

### 6.3 Failure contract

- `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` unset/`false` → button never renders.
- Provider disabled in Supabase or call throws → `googleOauthFailed = true` → button hidden for the session, fallback note shown. No silent failure, no mock sign-in.
