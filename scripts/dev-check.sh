#!/usr/bin/env bash
# PJPC 一键体检 —— 改完代码后跑这一条，替代手工那十几条命令
#
# 用法:
#   bash scripts/dev-check.sh           # 构建 + 重启 + 全量体检（默认）
#   bash scripts/dev-check.sh --no-build # 跳过构建，只体检当前运行的服务
#
# 检查项:
#   1. 构建（可选）
#   2. 重启 Next.js（prod 3001）+ 等就绪
#   3. 全部页面 HTTP 状态（只列非 200）
#   4. 全部 API HTTP 状态（列出 5xx，忽略 400/405/426 这类"缺参数/方法不符/需 websocket"）
#   5. 重启后日志里的 error/失败
#   6. 服务存活（PB 8090 / Next 3001）

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
PASS=0; WARN=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$1"; }

echo "═══ PJPC 体检 $(date '+%Y-%m-%d %H:%M:%S') ═══"
echo

# ── 1. 构建 ───────────────────────────────────────────
if [[ "${1:-}" != "--no-build" ]]; then
  echo "▶ 构建..."
  BUILD_LOG=$(npm run build 2>&1)
  if echo "$BUILD_LOG" | grep -qE "Compiled successfully"; then
    green "  ✅ 构建通过 $(echo "$BUILD_LOG" | grep -oE 'in [0-9.]+s' | head -1)"
    PASS=$((PASS+1))
  else
    red "  ❌ 构建失败"
    echo "$BUILD_LOG" | grep -E "Failed|Type error|Error:" | head -10
    echo
    red "构建失败，终止后续检查"
    exit 1
  fi
  # 杀掉可能残留的旧进程（否则新服务起不来）
  OLD=$(ss -ltnp 2>/dev/null | grep ':3001' | grep -oP 'pid=\K[0-9]+' | sort -u)
  [[ -n "$OLD" ]] && kill $OLD 2>/dev/null && sleep 2
  systemctl --user restart pjpc-nextjs
  sleep 4
else
  echo "▶ 跳过构建（--no-build）"
fi

# ── 2. 服务存活 ───────────────────────────────────────
echo "▶ 服务状态"
PB=$(curl -s -o /dev/null -w "%{http_code}" -m 5 http://127.0.0.1:8090/api/health)
NX=$(curl -s -o /dev/null -w "%{http_code}" -m 8 http://127.0.0.1:3001/)
[[ "$PB" == "200" ]] && green "  ✅ PocketBase 8090" || { red "  ❌ PocketBase 8090 ($PB)"; WARN=$((WARN+1)); }
[[ "$NX" == "200" ]] && green "  ✅ Next.js 3001" || { red "  ❌ Next.js 3001 ($NX)"; WARN=$((WARN+1)); }
echo

# ── 3. 页面 ───────────────────────────────────────────
echo "▶ 页面检查"
BAD_PAGES=0
for f in $(find app -name page.tsx | sort); do
  r=$(dirname "$f" | sed 's|^app||')
  [[ "$r" == "." ]] && continue
  case "$r" in *"["*) continue;; esac
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 8 "http://127.0.0.1:3001$r")
  if [[ "$code" != "200" ]]; then red "  ❌ GET $r → $code"; BAD_PAGES=$((BAD_PAGES+1)); fi
done
[[ $BAD_PAGES -eq 0 ]] && { green "  ✅ 全部页面 200"; PASS=$((PASS+1)); } || WARN=$((WARN+1))
echo

# ── 4. API ────────────────────────────────────────────
echo "▶ API 检查（只报 5xx）"
BAD_API=0
for f in $(find app/api -name route.ts | sort); do
  ep=$(echo "$f" | sed 's|app/api||; s|/route.ts||')
  case "$ep" in *"["*) continue;; esac
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 8 "http://127.0.0.1:3001/api${ep}")
  if [[ "$code" =~ ^5 ]]; then red "  ❌ GET /api${ep} → $code"; BAD_API=$((BAD_API+1)); fi
done
[[ $BAD_API -eq 0 ]] && { green "  ✅ 无 5xx"; PASS=$((PASS+1)); } || WARN=$((WARN+1))
echo

# ── 5. 日志 ───────────────────────────────────────────
echo "▶ 日志（最近 3 分钟）"
ERR=$(journalctl --user -u pjpc-nextjs --since "3 minutes ago" --no-pager 2>/dev/null \
      | grep -iE "失败|error|unhandled|TypeError|ReferenceError" \
      | grep -vE "localStorage is not defined|window is not defined|NFC Reader" | tail -8)
if [[ -z "$ERR" ]]; then
  green "  ✅ 无新错误"
  PASS=$((PASS+1))
else
  yellow "  ⚠️ 有错误输出:"; echo "$ERR" | sed 's/^/     /'
  WARN=$((WARN+1))
fi
echo

# ── 6. 审计钩子存活 ───────────────────────────────────
echo "▶ 审计钩子"
if [[ -f pb_hooks/main.pb.js ]]; then
  A=$(curl -s -m 8 "http://127.0.0.1:3001/api/pocketbase-proxy/api/collections/audit_logs/records?perPage=1" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalItems','?'))" 2>/dev/null)
  green "  ✅ 已启用（audit_logs: ${A:-?} 条）"
else
  yellow "  ⚠️ pb_hooks/main.pb.js 不存在"
fi
echo

# ── 汇总 ──────────────────────────────────────────────
echo "═══ 汇总: 通过 $PASS 项，异常 $WARN 项 ═══"
[[ $WARN -eq 0 ]] && green "全部正常" || yellow "有异常项，见上方 ⚠️/❌"
exit 0
