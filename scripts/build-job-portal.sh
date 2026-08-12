#!/usr/bin/env bash
set -euo pipefail

# The integrated Vite build accepts explicit VITE values or explicit matching
# Next public values. No placeholder backend/key is ever injected.
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required}"
: "${VITE_SUPABASE_ANON_KEY:?VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required}"

if [[ "${VITE_SUPABASE_URL%/}" != "https://qwaehqsmodekbgvnaavz.supabase.co" ]]; then
  echo "Job Portal must use shared project qwaehqsmodekbgvnaavz." >&2
  exit 78
fi

export VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
export VITE_APP_BASE_PATH="/job-portal/"

npm run build:integrated --workspace=@nexora/job-portal
