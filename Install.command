#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo '当前安装器仅支持 Apple 芯片 Mac。'; exit 1
fi
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/openssl@3/bin:/opt/homebrew/bin:$PATH"
if ! command -v brew >/dev/null; then
  echo '请先从 https://brew.sh 安装 Homebrew，然后重新运行本文件。'; exit 1
fi
if ! command -v node >/dev/null || ! command -v limactl >/dev/null || ! command -v openssl >/dev/null; then
  read -r -p '需要安装 Node.js、Lima 和 OpenSSL（不安装 Docker）。继续？[y/N] ' answer
  case "$answer" in y|Y|yes|YES) brew install node@22 lima openssl@3 ;; *) exit 0 ;; esac
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw Error("需要 Node.js 22 或更新版本")'
npm ci --ignore-scripts --no-audit --no-fund
npm run build
node scripts/setup.mjs
printf '\n请保留这个项目文件夹，插件运行依赖它。安装说明见 README.md。\n'
