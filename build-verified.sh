#!/usr/bin/env bash
set -euo pipefail

# Backward-compatible entry point; the canonical fail-closed build lives under
# scripts/ and accepts no hardcoded Supabase fallback.
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/build-verified.sh" "$@"
