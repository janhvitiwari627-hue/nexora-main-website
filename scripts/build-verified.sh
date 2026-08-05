#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

# Main Website is Next/vinext: use the Next public names only.
supabase_url="${NEXT_PUBLIC_SUPABASE_URL:-}"
supabase_anon_key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

# Use fallback placeholders for local/CI verification builds when credentials are missing.
# Production deployments MUST provide real credentials via Vercel environment variables.
if [[ -z "${supabase_url}" ]]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set. Using fallback placeholder for verification build." >&2
  echo "   For production: set NEXT_PUBLIC_SUPABASE_URL=https://qwaehqsmodekbgvnaavz.supabase.co" >&2
  supabase_url="https://placeholder.supabase.co"
fi

if [[ -z "${supabase_anon_key}" ]]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Using fallback placeholder for verification build." >&2
  echo "   For production: set NEXT_PUBLIC_SUPABASE_ANON_KEY from project qwaehqsmodekbgvnaavz" >&2
  supabase_anon_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key-for-build-verification"
fi

export NEXT_PUBLIC_SUPABASE_URL="${supabase_url}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabase_anon_key}"

# Warn if using fallback values (not real credentials)
if [[ "${supabase_url}" == "https://placeholder.supabase.co" ]] || [[ "${supabase_anon_key}" == *"placeholder"* ]]; then
  echo "" >&2
  echo "⚠️  BUILD USING FALLBACK CREDENTIALS" >&2
  echo "   This build is for verification only. The artifact cannot connect to Supabase." >&2
  echo "   For production deployment, configure real credentials in your hosting environment." >&2
  echo "" >&2
fi

command -v timeout >/dev/null || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded vinext build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

"${script_dir}/validate-artifact.sh"
