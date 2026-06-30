#!/usr/bin/env bash
# 手動デプロイ: meal-planner を build して gh-pages ブランチへ配信する。
# GitHub Actions を使わないのは、現在のトークンに workflow スコープが無いため。
# （workflow スコープを足せば .github/workflows での自動デプロイに切替可能）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE="https://github.com/hiiirano/public-apps.git"

echo "==> build meal-planner"
npm --prefix "$ROOT/apps/meal-planner" run build

echo "==> build pantry-tracker"
npm --prefix "$ROOT/apps/pantry-tracker" run build

echo "==> build flashcards"
npm --prefix "$ROOT/apps/flashcards" run build

echo "==> build kakeibo"
npm --prefix "$ROOT/apps/kakeibo" run build

STAGE="$(mktemp -d)"
mkdir -p "$STAGE/meal-planner" "$STAGE/pantry-tracker" "$STAGE/flashcards" "$STAGE/kakeibo"
cp -R "$ROOT/apps/meal-planner/dist/." "$STAGE/meal-planner/"
cp -R "$ROOT/apps/pantry-tracker/dist/." "$STAGE/pantry-tracker/"
cp -R "$ROOT/apps/flashcards/dist/." "$STAGE/flashcards/"
cp -R "$ROOT/apps/kakeibo/dist/." "$STAGE/kakeibo/"
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

echo "==> done:"
echo "    https://hiiirano.github.io/public-apps/"
echo "    https://hiiirano.github.io/public-apps/meal-planner/"
echo "    https://hiiirano.github.io/public-apps/pantry-tracker/"
echo "    https://hiiirano.github.io/public-apps/flashcards/"
echo "    https://hiiirano.github.io/public-apps/kakeibo/"
