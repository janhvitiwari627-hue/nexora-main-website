#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

# Production and verification builds use explicit environment configuration.
# There is deliberately no hardcoded URL/key fallback: an unconfigured bundle
# must fail closed instead of producing an artifact pointed at a fake project.
: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL is required for project qwaehqsmodekbgvnaavz}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?NEXT_PUBLIC_SUPABASE_ANON_KEY is required (anon/publishable only)}"

if [[ "${NEXT_PUBLIC_SUPABASE_URL%/}" != "https://qwaehqsmodekbgvnaavz.supabase.co" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_URL must use shared project qwaehqsmodekbgvnaavz." >&2
  exit 78
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

echo "Running bounded vinext production build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

"${script_dir}/validate-artifact.sh"
