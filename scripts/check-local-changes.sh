#!/usr/bin/env bash
# 研发云私服专用：检测本地工作区（包含未提交代码与新文件）以及对比研发云私服已发布的最新版本
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REGISTRY="https://gz01-srdart.srdcloud.cn/npm/p26gsw1yf8017/p26gsw1yf8017-da26gsw10020-release-npm-local/"

IGNORE_NAMES=(
  "@speed-tiptap-editor/vue3-demo"
)

is_ignored() {
  local name="$1"
  for ignored in "${IGNORE_NAMES[@]}"; do
    if [[ "$name" == "$ignored" ]]; then
      return 0
    fi
  done
  return 1
}

read_pkg_field() {
  local file="$1"
  local field="$2"
  local abs
  abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
  node -p "require('${abs}').${field}"
}

declare -a CHANGED=()
declare -a UNCHANGED=()

echo ""
echo "=========================================================="
echo "  [研发云私服] 本地代码改动及私服版本对比"
echo "=========================================================="
echo ""

while IFS= read -r pkgfile; do
  if [[ "$(read_pkg_field "$pkgfile" "private" 2>/dev/null || echo false)" == "true" ]]; then
    continue
  fi

  name="$(read_pkg_field "$pkgfile" "name")"
  local_version="$(read_pkg_field "$pkgfile" "version")"
  dir="$(dirname "$pkgfile")"

  if is_ignored "$name"; then
    continue
  fi

  latest_tag="$(git tag -l "${name}@*" | sort -V | tail -1 || true)"

  # 1. 检查 tag 之后的新提交
  committed_count=0
  if [[ -n "$latest_tag" ]] && git rev-parse --verify "$latest_tag" >/dev/null 2>&1; then
    committed_count="$(git log --oneline "${latest_tag}..HEAD" -- "$dir" 2>/dev/null \
      | { grep -Ev '^[0-9a-f]+ chore: (release|version packages)' || true; } \
      | wc -l | tr -d ' ')"
  fi

  # 2. 检查工作区修改与未跟踪新增文件（本地开发重点）
  uncommitted_count="$(git status --porcelain -- "$dir" 2>/dev/null | wc -l | tr -d ' ')"

  # 3. 查询研发云当前已发布版本
  remote_version="$(npm view "$name" version --registry="$REGISTRY" 2>/dev/null || echo '未发布')"

  if [[ "$committed_count" -gt 0 || "$uncommitted_count" -gt 0 ]]; then
    CHANGED+=("$name|$local_version|$remote_version|$dir|$committed_count|$uncommitted_count")
  else
    UNCHANGED+=("$name|$local_version|$remote_version")
  fi
done < <(find packages -name package.json -not -path '*/node_modules/*' | sort)

if [[ ${#CHANGED[@]} -gt 0 ]]; then
  echo "【本地有代码改动 — 建议加入私服发布】"
  echo ""
  for entry in "${CHANGED[@]}"; do
    IFS='|' read -r name local_ver remote_ver dir commit_cnt uncommit_cnt <<<"$entry"
    echo "  ● $name"
    echo "    本地版本: $local_ver  |  研发云线上版本: $remote_ver"
    echo "    改动详情: $commit_cnt 个新提交, $uncommit_cnt 个未提交/新文件 (路径: $dir/)"
    echo ""
  done
else
  echo "【本地工作区干净 — 暂无待发布的本地改动】"
  echo ""
fi

if [[ ${#UNCHANGED[@]} -gt 0 ]]; then
  echo "【无改动的包】"
  for entry in "${UNCHANGED[@]}"; do
    IFS='|' read -r name local_ver remote_ver <<<"$entry"
    echo "  - $name (本地: $local_ver, 研发云: $remote_ver)"
  done
  echo ""
fi

echo "----------------------------------------------------------"
echo "提示: 如需发布到研发云私服，请运行: pnpm srd:release"
echo "----------------------------------------------------------"
echo ""
