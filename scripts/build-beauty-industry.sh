#!/usr/bin/env bash
set -euo pipefail

# Builds the imported Distributors Beauty Industry Vite app into
# public/distributors-beauty-industry/. Map the root Next public variables to
# the Vite names so every integrated app receives the same project/key pair.
# A production build must never silently fall back to a mock backend.
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required}"
: "${VITE_SUPABASE_ANON_KEY:?VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required}"

if [[ "${VITE_SUPABASE_URL%/}" != "https://qwaehqsmodekbgvnaavz.supabase.co" ]]; then
  echo "Beauty Industry must use shared project qwaehqsmodekbgvnaavz." >&2
  exit 78
fi
export VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"
beauty_dir="${root_dir}/beauty-industry"

if [[ ! -d "${beauty_dir}" ]]; then
  echo "beauty-industry/ is missing; expected at ${beauty_dir}" >&2
  exit 66
fi

if [[ ! -x "${beauty_dir}/node_modules/.bin/vite" ]]; then
  echo "[beauty-industry] installing isolated dependencies"
  (
    cd "${beauty_dir}"
    npm install --no-audit --no-fund
  )
fi

echo "[beauty-industry] building Vite app (base=/distributors-beauty-industry/)"
(
  cd "${beauty_dir}"
  npm run build
)
