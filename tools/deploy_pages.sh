#!/bin/bash
# 把 dist/web 发布到 gh-pages 分支（GitHub Pages：https://msj1122-jane.github.io/bu-shaoxin-xiaoguan/）
set -e
cd "$(dirname "$0")/.."
node tools/build_web.js
REV=$(git rev-parse --short HEAD)
W=$(mktemp -d)
git fetch -q origin gh-pages
git worktree add -q -f "$W" origin/gh-pages
( cd "$W" && git checkout -q -B gh-pages && git rm -rq . && cp -r "$OLDPWD/dist/web/." . && touch .nojekyll && git add -A && git commit -q -m "网页试玩版更新到 main $REV" && git push -q origin gh-pages )
git worktree remove -f "$W"
echo "已发布 main $REV 到 gh-pages"
