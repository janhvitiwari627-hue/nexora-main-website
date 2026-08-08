#!/usr/bin/env bash
set -euo pipefail

export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder-publishable-key}}"
export VITE_APP_BASE_PATH="/job-portal/"

if [[ "${VERCEL_ENV:-}" == "production" && ("${VITE_SUPABASE_URL}" == *"placeholder"* || "${VITE_SUPABASE_ANON_KEY}" == *"placeholder"*) ]]; then
  echo "Production Job Portal build requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or matching VITE_* values)." >&2
  exit 78
fi

npm run build:integrated --workspace=@nexora/job-portal
