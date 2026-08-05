#!/usr/bin/env bash
set -euo pipefail

echo "=== Phase 14 Acceptance Environment Validation ==="
echo ""

# Load .env.acceptance file if it exists (for local development)
if [[ -f .env.acceptance ]]; then
  # shellcheck source=/dev/null
  source .env.acceptance
  echo "✓ Loaded .env.acceptance"
fi

# Load .env.acceptance.local if it exists (for local overrides)
if [[ -f .env.acceptance.local ]]; then
  # shellcheck source=/dev/null
  source .env.acceptance.local
  echo "✓ Loaded .env.acceptance.local"
fi

echo ""

# Required environment variables (NEXT_PUBLIC_ preferred, VITE_ as fallback)
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "ACCEPTANCE_BASE_URL"
  "ACCEPTANCE_CUSTOMER_A_EMAIL"
  "ACCEPTANCE_CUSTOMER_A_PASSWORD"
  "ACCEPTANCE_CUSTOMER_B_EMAIL"
  "ACCEPTANCE_CUSTOMER_B_PASSWORD"
  "ACCEPTANCE_OWNER_A_EMAIL"
  "ACCEPTANCE_OWNER_A_PASSWORD"
  "ACCEPTANCE_OWNER_B_EMAIL"
  "ACCEPTANCE_OWNER_B_PASSWORD"
  "ACCEPTANCE_PARTNER_A_EMAIL"
  "ACCEPTANCE_PARTNER_A_PASSWORD"
  "ACCEPTANCE_PARTNER_B_EMAIL"
  "ACCEPTANCE_PARTNER_B_PASSWORD"
)

# Resolve Supabase URL (try multiple formats)
RESOLVED_URL=""
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  RESOLVED_URL="${NEXT_PUBLIC_SUPABASE_URL}"
elif [[ -n "${VITE_SUPABASE_URL:-}" ]]; then
  RESOLVED_URL="${VITE_SUPABASE_URL}"
fi

# Resolve Supabase anon/publishable key (try multiple formats)
RESOLVED_ANON_KEY=""
if [[ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  RESOLVED_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
elif [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  RESOLVED_ANON_KEY="${VITE_SUPABASE_ANON_KEY}"
elif [[ -n "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  RESOLVED_ANON_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
elif [[ -n "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  RESOLVED_ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}"
fi

# Now check all required vars (using resolved values for Supabase)
for var in "${REQUIRED_VARS[@]}"; do
  value="${!var:-}"
  
  # Use resolved fallback for Supabase vars
  if [[ "$var" == "NEXT_PUBLIC_SUPABASE_URL" && -z "$value" && -n "$RESOLVED_URL" ]]; then
    value="$RESOLVED_URL"
  elif [[ "$var" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" && -z "$value" && -n "$RESOLVED_ANON_KEY" ]]; then
    value="$RESOLVED_ANON_KEY"
  fi
  
  if [[ -z "$value" ]]; then
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ ENVIRONMENT: BLOCKED"
  echo ""
  echo "Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Note: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY can serve as"
  echo "fallback for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  echo ""
  echo "Create .env.acceptance file based on .env.acceptance.example"
  echo "DO NOT commit .env.acceptance to git."
  exit 1
else
  echo "✅ ENVIRONMENT: READY"
  echo ""
  echo "All required environment variables are set."
  echo ""
  # Print only non-secret values
  echo "Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
  echo "Deployment URL: ${ACCEPTANCE_BASE_URL}"
  echo ""
  echo "Test accounts configured:"
  echo "  - Customer A: ${ACCEPTANCE_CUSTOMER_A_EMAIL}"
  echo "  - Customer B: ${ACCEPTANCE_CUSTOMER_B_EMAIL}"
  echo "  - Owner A: ${ACCEPTANCE_OWNER_A_EMAIL}"
  echo "  - Owner B: ${ACCEPTANCE_OWNER_B_EMAIL}"
  echo "  - Partner A: ${ACCEPTANCE_PARTNER_A_EMAIL}"
  echo "  - Partner B: ${ACCEPTANCE_PARTNER_B_EMAIL}"
  echo ""
  echo "⚠️  WARNING: Never commit .env.acceptance or print secrets."
  echo "   Anon key is configured but not displayed for security."
  exit 0
fi
