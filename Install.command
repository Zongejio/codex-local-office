#!/bin/bash
set -euo pipefail
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
# No Homebrew, global npm installation, sudo or Docker is required.
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"
DATA_DIR="${CODEX_OFFICE_DATA_DIR:-$HOME/Library/Application Support/CodexLocalOffice}"
export CODEX_OFFICE_DATA_DIR="$DATA_DIR"
HEADLESS="${CODEX_OFFICE_INSTALL_TEST:-0}"
message() { if [[ "$HEADLESS" == 1 ]]; then printf '%s\n' "$1"; else /usr/bin/osascript - "$1" <<'APPLESCRIPT'
on run argv
 display dialog (item 1 of argv) with title "Office 本地编辑器" buttons {"好"} default button "好"
end run
APPLESCRIPT
fi; }
failed() { message "安装没有完成。已经完成的下载会保留。请保留此窗口中的错误信息，重新双击安装文件可重试。"; }
trap failed ERR
if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then message '目前只支持 Apple 芯片 Mac。没有开始安装。'; exit 1; fi
if [[ "$HEADLESS" != 1 && "${CODEX_OFFICE_INSTALL_CONFIRMED:-0}" != 1 ]]; then
 /usr/bin/osascript <<'APPLESCRIPT'
display dialog "将自动准备运行环境、下载本地 Office 引擎并安装 Codex 插件。首次下载可能数 GB，需要约 40 GB 可用磁盘空间。文件只在本机处理，不安装 Docker。安装期间请保留终端窗口。" with title "安装 Office 本地编辑器" buttons {"取消", "开始安装"} default button "开始安装" cancel button "取消"
APPLESCRIPT
fi
mkdir -p "$DATA_DIR/downloads" "$DATA_DIR/runtimes" "$DATA_DIR/apps"
bootstrap() {
 local name="$1" url="$2" expected="$3" strip="$4" archive="$DATA_DIR/downloads/$1.tar.gz" target="$DATA_DIR/runtimes/$1.path"
 if [[ -f "$target" ]]; then
  local cached; cached="$(cat "$target")"
  if [[ "$cached" == "$DATA_DIR/runtimes/"* && -d "$cached/bin" ]]; then printf '%s\n' "$cached"; return; fi
 fi
 if [[ ! -f "$archive" ]] || [[ "$(/usr/bin/shasum -a 256 "$archive" | /usr/bin/awk '{print $1}')" != "$expected" ]]; then
  local download; download="$(mktemp "$DATA_DIR/downloads/$name.XXXXXX")"
  /usr/bin/curl --fail --location --retry 3 --connect-timeout 30 --max-time 1800 --proto '=https' --tlsv1.2 "$url" -o "$download" >&2
  [[ "$(/usr/bin/shasum -a 256 "$download" | /usr/bin/awk '{print $1}')" == "$expected" ]] || { echo '下载校验不通过，已停止安装。' >&2; return 1; }
  # Keep any previous interrupted download rather than removing it.
  if [[ -e "$archive" ]]; then /bin/cp "$archive" "$archive.before.$(date +%s)"; fi
  /bin/cp "$download" "$archive"
 fi
 local unpack; unpack="$(mktemp -d "$DATA_DIR/runtimes/$name.XXXXXX")"
 /usr/bin/tar -xzf "$archive" -C "$unpack" --strip-components "$strip"
 if [[ -e "$target" ]]; then /bin/cp "$target" "$target.before.$(date +%s)"; fi
 printf '%s\n' "$unpack" > "$target"
 printf '%s\n' "$unpack"
}
printf '\n[1/5] 正在准备独立运行环境…\n'
NODE_DIR="$(bootstrap node-22.22.0 https://nodejs.org/dist/v22.22.0/node-v22.22.0-darwin-arm64.tar.gz 5ed4db0fcf1eaf84d91ad12462631d73bf4576c1377e192d222e48026a902640 1)"
LIMA_DIR="$(bootstrap lima-2.2.1 https://github.com/lima-vm/lima/releases/download/v2.2.1/lima-2.2.1-Darwin-arm64.tar.gz 9e9eacce88f37e185c346bad73aa6136f738d8cdf8c3bb23cd42b071824bc66e 0)"
export PATH="$NODE_DIR/bin:$LIMA_DIR/bin:/usr/bin:/bin:/usr/sbin:/sbin"
node --version
limactl --version
printf '\n[2/5] 正在安装到固定位置…\n'
APP_DIR="$(mktemp -d "$DATA_DIR/apps/office-0.6.0.XXXXXX")"
for entry in src scripts plugin packaging package.json package-lock.json; do /bin/cp -R "$SOURCE_DIR/$entry" "$APP_DIR/"; done
cd "$APP_DIR"
npm ci --ignore-scripts --no-audit --no-fund
npm run build
printf '\n[3/5] 正在准备本地 Office 引擎，首次运行需要较长时间…\n'
if [[ "$HEADLESS" == 1 ]]; then node scripts/setup.mjs --yes --skip-trust; else node scripts/setup.mjs --yes --gui; fi
printf '\n[4/5] 正在检查服务并自动注册 Codex 插件…\n'
node scripts/finish-install.mjs
printf '\n[5/5] 安装完成。\n'
if [[ "$HEADLESS" == 1 ]]; then message '测试安装完成：未授权系统证书信任。'; else message '安装完成！请先保存 Codex 中的工作，再退出并重新打开一次 Codex。首次打开 Word、Excel、PPT 时，在“打开方式”各选择一次“Office 本地编辑器”。下载的安装包不再是运行依赖。'; fi
