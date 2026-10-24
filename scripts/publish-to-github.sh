#!/usr/bin/env bash
# Creates the GitHub repo, pushes main, then opens and merges one pull request per
# feature branch in order, so the repo shows the full feature-branch + PR history.
#
# Needs the GitHub CLI logged in:  gh auth login
# Usage:  bash scripts/publish-to-github.sh [repo-name]
set -euo pipefail

REPO="${1:-text-to-learn}"
BRANCHES=(
  feat/backend-setup
  feat/database-models
  feat/ai-course-generation
  feat/frontend-setup
  feat/auth0
  feat/lesson-rendering
  feat/youtube-videos
  feat/hinglish-tts
  feat/pdf-export
  feat/ci-cd-docs
)

command -v gh >/dev/null || { echo "Install the GitHub CLI first: https://cli.github.com"; exit 1; }
gh auth status >/dev/null || { echo "Run: gh auth login"; exit 1; }

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source . --remote origin --description "Text-to-Learn: AI-powered course generator (React, Express, MongoDB, Auth0, Gemini)"
fi

git push -u origin main

for b in "${BRANCHES[@]}"; do
  echo "== $b"
  git push -u origin "$b"
  title="$(git log -1 --format=%s "$b")"
  body="$(git log --format='- %s' main.."$b")"
  gh pr create --base main --head "$b" --title "$title" --body "$body" || true
  gh pr merge "$b" --merge
  git fetch origin main -q
  git checkout -q main && git merge -q --ff-only origin/main
done

echo "Done. Merged ${#BRANCHES[@]} pull requests into main."
gh repo view --web || true
