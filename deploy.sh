#!/usr/bin/env bash
# 手動デプロイ: meal-planner を build して gh-pages ブランチへ配信する。
# GitHub Actions を使わないのは、現在のトークンに workflow スコープが無いため。
# （workflow スコープを足せば .github/workflows での自動デプロイに切替可能）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE="https://github.com/hiiirano/public-apps.git"

echo "==> build meal-planner"
npm --prefix "$ROOT/apps/meal-planner" run build

STAGE="$(mktemp -d)"
mkdir -p "$STAGE/meal-planner"
cp -R "$ROOT/apps/meal-planner/dist/." "$STAGE/meal-planner/"
cp "$ROOT/deploy/index.html" "$STAGE/index.html"
touch "$STAGE/.nojekyll"

echo "==> push gh-pages"
cd "$STAGE"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="hiiirano" -c user.email="128061664+hiiirano@users.noreply.github.com" commit -qm "deploy"
git remote add origin "$REMOTE"
git push -f -q origin gh-pages

echo "==> done: https://hiiirano.github.io/public-apps/meal-planner/"
