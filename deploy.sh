#!/usr/bin/env bash
# 手動デプロイ: deploy/apps.json のアプリを build して gh-pages ブランチへ配信する。
# GitHub Actions を使わないのは、現在のトークンに workflow スコープが無いため。
# （workflow スコープを足せば .github/workflows での自動デプロイに切替可能）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE="https://github.com/hiiirano/public-apps.git"

# アプリの一覧は deploy/apps.json が唯一の正。新しいアプリはそこに1行足せば
# ビルド・配信・スクショ・mujinline.com の一覧まで自動で反映される。
SLUGS="$(node -e 'for (const a of require(process.argv[1])) console.log(a.slug)' "$ROOT/deploy/apps.json")"

STAGE="$(mktemp -d)"
for slug in $SLUGS; do
  echo "==> build $slug"
  npm --prefix "$ROOT/apps/$slug" run build
  mkdir -p "$STAGE/$slug"
  cp -Rf "$ROOT/apps/$slug/dist/." "$STAGE/$slug/"
done
cp "$ROOT/deploy/index.html" "$STAGE/index.html"
cp "$ROOT/deploy/apps.json" "$STAGE/apps.json"

echo "==> screenshots"
[ -d "$ROOT/deploy/node_modules/playwright" ] || npm --prefix "$ROOT/deploy" install --silent
(cd "$ROOT/deploy" && npx playwright install chromium >/dev/null && node shoot.mjs "$STAGE")
touch "$STAGE/.nojekyll"

echo "==> push gh-pages"
cd "$STAGE"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="hiiirano" -c user.email="128061664+hiiirano@users.noreply.github.com" commit -qm "deploy"
git remote add origin "$REMOTE"
git push -f -q origin gh-pages

echo "==> done: https://hiiirano.github.io/public-apps/"
