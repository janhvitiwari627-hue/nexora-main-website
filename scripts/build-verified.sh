#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

supabase_url="${NEXT_PUBLIC_SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
supabase_anon_key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"

if [[ -z "${supabase_url}" ]]; then
  echo "Set NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL for the production client build." >&2
  exit 78
fi

if [[ -z "${supabase_anon_key}" ]]; then
  echo "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY for the production client build." >&2
  exit 78
fi

export NEXT_PUBLIC_SUPABASE_URL="${supabase_url}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabase_anon_key}"

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
