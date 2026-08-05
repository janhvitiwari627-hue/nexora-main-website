#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"

cd "${project_root}"

# Load environment from .env.acceptance
if [[ -f .env.acceptance ]]; then
  set -a
  source .env.acceptance
  set +a
  echo "✓ Loaded .env.acceptance"
fi

# Load .env.acceptance.local if it exists
if [[ -f .env.acceptance.local ]]; then
  set -a
  source .env.acceptance.local
  set +a
  echo "✓ Loaded .env.acceptance.local"
fi

echo ""
echo "=== Running Phase 14 Integration Tests ==="
echo ""

# Run integration tests
node --test tests/phase14/integration/*.test.mjs
