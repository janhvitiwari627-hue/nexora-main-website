#!/usr/bin/env bash
# One-command application of a Nexora PWA Supabase integration package.
#
# Usage:
#   ./apply.sh customer|owner|growth-partner [/path/to/existing/clone]
#
# Without a path argument the target repo is freshly cloned into ./<repo-dir>.
# The patch lands on a new branch supabase-integration-phase1; deps install,
# typecheck and build run automatically. Requires: git, node >= 18, npm.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TARGET="${1:-}"
CLONE_DIR="${2:-}"

case "$TARGET" in
  customer)
    REPO_URL="https://github.com/janhvitiwari627-hue/Free-Website-costumer-pwa-app-.git"
    PATCH="$HERE/customer-pwa/supabase-integration.patch"
    DIR="${CLONE_DIR:-$HERE/applied/Free-Website-costumer-pwa-app-}"
    ;;
  owner)
    REPO_URL="https://github.com/promptaivideo4-coder/PINK-NEXORA-AAP-.git"
    PATCH="$HERE/owner-pwa/supabase-integration.patch"
    DIR="${CLONE_DIR:-$HERE/applied/PINK-NEXORA-AAP-}"
    ;;
  growth-partner|gp)
    REPO_URL="https://github.com/diamondpeomotion-cyber/pink-growth-partner-aap-.git"
    PATCH="$HERE/growth-partner-pwa/supabase-integration.patch"
    DIR="${CLONE_DIR:-$HERE/applied/pink-growth-partner-aap-}"
    ;;
  *)
    echo "Usage: $0 customer|owner|growth-partner [/path/to/existing/clone]" >&2
    exit 1
    ;;
esac

[ -f "$PATCH" ] || { echo "Patch not found: $PATCH" >&2; exit 1; }

if [ -n "$CLONE_DIR" ]; then
  [ -d "$CLONE_DIR/.git" ] || { echo "$CLONE_DIR is not a git clone" >&2; exit 1; }
else
  if [ -d "$DIR" ]; then
    echo "Reusing existing checkout at $DIR"
  else
    echo "Cloning $REPO_URL -> $DIR"
    git clone "$REPO_URL" "$DIR"
  fi
fi

cd "$DIR"

# git am needs a committer identity; set a local fallback if none exists.
if ! git config user.email >/dev/null 2>&1; then
  git config user.email "integrator@localhost"
  git config user.name "Nexora Integrator"
fi

BRANCH="supabase-integration-phase1"
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Branch $BRANCH already exists — checking it out (patch already applied?)"
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
  git am "$PATCH"
fi

echo
echo "Installing dependencies..."
npm install --no-audit --no-fund

echo
echo "Typecheck..."
npx tsc --noEmit

echo
echo "Build..."
npm run build

cat <<EOF

✅ Applied and verified: $TARGET
   Repo:   $DIR
   Branch: $BRANCH

Next steps:
  1. cp .env.example .env   (paste VITE_SUPABASE_ANON_KEY from the Supabase
     dashboard — project qwaehqsmodekbgvnaavz)
  2. npm run dev            (test locally)
  3. Push the branch and open a PR:
       git push -u origin $BRANCH
EOF
