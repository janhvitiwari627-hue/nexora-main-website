#!/usr/bin/env bash
set -euo pipefail

# Builds the imported Distributors Beauty Industry Vite app into
# public/distributors-beauty-industry/ so the root project serves it at
# /distributors-beauty-industry/ (base path is fixed in the app's
# vite.config.ts). Its dependencies stay isolated inside beauty-industry/ and
# are not part of the root workspaces or lockfile.

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
