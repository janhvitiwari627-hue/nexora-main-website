#!/usr/bin/env bash
set -euo pipefail

echo "=== Phase 14 Acceptance Environment Validation ==="
echo ""

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

MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
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
  echo "Create .env.acceptance file based on .env.acceptance.example"
  echo "DO NOT commit .env.acceptance to git."
  exit 1
else
  echo "✅ ENVIRONMENT: READY"
  echo ""
  echo "All required environment variables are set."
  echo ""
  echo "Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL}"
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
  exit 0
fi
