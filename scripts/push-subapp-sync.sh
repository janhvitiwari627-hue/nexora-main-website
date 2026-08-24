#!/usr/bin/env bash
# push-subapp-sync.sh — One-shot sync of the 6 external Nexora sub-app repos.
#
# Applies the verified sync artifacts (Supabase PKCE auth + location sync)
# to each target repo's `main` and pushes. Runs only when the current
# GitHub credential has WRITE permission on all targets (e.g. after the
# Arena GitHub App has been installed on / granted access to those repos).
#
# Safety:
#   - pre-flight write check (dry-run) on every target; aborts before any
#     clone+patch work if authorization is missing
#   - fast-forward pushes only — never force-pushes over `main`
#   - no credentials are stored or embedded; git uses the gh credential helper
#
# Usage:  bash scripts/push-subapp-sync.sh [--apply]
#         (default is a dry-run status report; --apply performs real pushes)

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCHES="$ROOT/subapp-sync-artifacts/patches"
PHASE22="$ROOT/subapp-sync-artifacts/phase22"
APPLY="${1:-}"
WORK="${SUBAPP_WORK_DIR:-$(mktemp -d)}"
GIT_ID=("-c" "user.name=Arena Agent" "-c" "user.email=arena-agent@users.noreply.github.com")

# target-slug|owner/repo|artifact  (artifact = single .patch file OR a dir of
# numbered .patch files applied in order)
TARGETS=(
  "repo1|promptaivideo4-coder/PINK-NEXORA-AAP-|$PATCHES/repo1.patch"
  "repo2|diamondpeomotion-cyber/pink-growth-partner-aap-|$PATCHES/repo2.patch"
  "repo3|freewebsite859-sudo/REMIX-Final-salon-app-|$PHASE22/customer-app"
  "repo4|templateapp67-oss/FINAL-NEW-APP-TEMPLETE-|$PATCHES/repo4-v2.patch"
  "repo5|portaljob492-creator/Job-Portal-|$PATCHES/repo5.patch"
  "repo6|prdnexora-svg/beauty-shop-2|$PATCHES/repo6.patch"
)

echo "== Nexora sub-app sync — $(date -u '+%Y-%m-%d %H:%M UTC') | mode: ${APPLY:---dry-run} =="

# --- pre-flight: write permission on every target --------------------------
denied=0
for t in "${TARGETS[@]}"; do
  IFS='|' read -r slug repo _ <<<"$t"
  if git ls-remote "https://github.com/$repo.git" >/dev/null 2>&1; then :; fi
  if ! git push --dry-run "https://github.com/$repo.git" \
       "HEAD:refs/heads/__arena_write_probe__" >/dev/null 2>&1; then
    echo "  WRITE DENIED  $repo  (install/grant the Arena GitHub App on this account)"
    denied=1
  fi
done
# (the probe ref never exists locally; permission errors still surface)
if [ "$denied" -eq 1 ]; then
  echo "RESULT: BLOCKED — at least one target lacks write permission. Nothing was changed."
  exit 2
fi

# --- per-repo apply + push ---------------------------------------------------
declare -A STATUS
for t in "${TARGETS[@]}"; do
  IFS='|' read -r slug repo artifact <<<"$t"
  dir="$WORK/$slug"
  rm -rf "$dir"
  echo "-- $repo"
  if ! git clone -q "https://github.com/$repo.git" "$dir"; then
    STATUS[$repo]="clone:failed"; continue
  fi
  base=$(git -C "$dir" rev-parse --short origin/main)
  if [ -d "$artifact" ]; then
    patches=("$artifact"/*.patch)
  else
    patches=("$artifact")
  fi
  ok=1
  for p in "${patches[@]}"; do
    git -C "$dir" "${GIT_ID[@]}" am --3way "$p" >/dev/null 2>&1 || { git -C "$dir" am --abort >/dev/null 2>&1; ok=0; break; }
  done
  if [ "$ok" -ne 1 ]; then
    STATUS[$repo]="patch:conflicts-on-$base"; continue
  fi
  head=$(git -C "$dir" rev-parse --short HEAD)
  if [ "$APPLY" = "--apply" ]; then
    if git -C "$dir" push origin "HEAD:main" >/dev/null 2>&1; then
      STATUS[$repo]="push:true ($base->$head)"
    else
      STATUS[$repo]="push:rejected ($base->$head, non-FF or denied)"
    fi
  else
    STATUS[$repo]="ready:$base->$head (push:pending --apply)"
  fi
done

echo
echo "== FINAL STATUS =="
for t in "${TARGETS[@]}"; do
  IFS='|' read -r _ repo _ <<<"$t"
  printf '  %-55s %s\n' "$repo" "${STATUS[$repo]:-skipped}"
done
