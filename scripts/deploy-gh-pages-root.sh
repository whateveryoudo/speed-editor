#!/usr/bin/env sh

set -e

echo "开始构建示例站点（根目录首页部署）..."

# 使用项目脚本进行构建（与 package.json 保持一致）
npm run build:example

echo "构建完成，准备部署到 GitHub Pages..."

OUTPUT_DIR="example/dist-example"
cd "$OUTPUT_DIR"

# 清理旧的 .git
if [ -d ".git" ]; then
  echo "清除已存在的 .git 目录"
  rm -rf .git
fi

git init
git add -A

if git diff --quiet --cached; then
  echo "❌ 错误：没有文件需要提交"
  exit 1
fi

COMMIT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "部署到 GitHub Pages（根目录） - $COMMIT_TIME"

echo "正在推送到 GitHub..."
REPO_URL="https://github.com/whateveryoudo/speed-editor.git"
git branch -M main
git push -f "$REPO_URL" main:gh-pages

cd -

echo ""
echo "✅ 部署成功（根目录）！"
echo "🌐 访问地址：https://whateveryoudo.github.io/speed-editor/"


