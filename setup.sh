#!/usr/bin/env bash
# Stacknoah blog — one-shot local setup
# 실행: bash setup.sh   (이 폴더 안에서)
set -euo pipefail

echo "==> git 저장소 초기화"
[ -d .git ] || git init

echo "==> PaperMod 테마 submodule 추가"
if [ ! -d themes/PaperMod/.git ] && [ ! -f themes/PaperMod/theme.toml ]; then
  git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod || true
fi
git submodule update --init --recursive

echo "==> Hugo 설치 확인"
if ! command -v hugo >/dev/null 2>&1; then
  echo "Hugo가 없습니다. 설치 후 다시 실행하세요:"
  echo "  macOS:   brew install hugo"
  echo "  Windows: winget install Hugo.Hugo.Extended"
  echo "  Linux:   sudo snap install hugo  (또는 공식 릴리스 tar)"
  exit 1
fi
hugo version

echo ""
echo "✅ 준비 완료. 로컬 미리보기:"
echo "   hugo server -D     # 초안(draft) 포함, http://localhost:1313"
