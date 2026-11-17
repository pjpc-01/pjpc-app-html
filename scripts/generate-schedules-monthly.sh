#!/usr/bin/env bash
# 每月自动把排班铺好（幂等：已存在的记录会跳过）
#   1 号 → 铺本月整月 + 下个月整月（月初补齐，防止 1 号当天没开系统漏掉）
#   25 号 → 铺下个月整月（提前排好，老师能提前看到）
# 由 systemd timer pjpc-schedule-generate.timer 调用。
set -uo pipefail
cd /home/pjpc/pjpc-app-prod || exit 1

ENV_FILE=".env.local"
[ -f "$ENV_FILE" ] || { echo "找不到 $ENV_FILE"; exit 1; }
KEY=$(grep -m1 '^PROXY_INTERNAL_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
[ -n "$KEY" ] || { echo "PROXY_INTERNAL_KEY 没配"; exit 1; }

BASE_URL="${SITE_URL:-http://127.0.0.1:3001}"
YEAR=$(date +%Y)
MONTH=$(date +%-m)
DAY=$(date +%-d)

gen() {
  local y=$1 m=$2
  local res
  res=$(curl -s -m 300 -X POST "$BASE_URL/api/schedule/generate-monthly" \
    -H "x-pjpc-internal: $KEY" -H 'Content-Type: application/json' \
    -d "{\"year\":$y,\"month\":$m}")
  echo "$(date '+%F %T') ${y}-${m} -> ${res}"
}

NEXT_YEAR=$YEAR
NEXT_MONTH=$((MONTH + 1))
if [ "$NEXT_MONTH" -gt 12 ]; then NEXT_MONTH=1; NEXT_YEAR=$((YEAR + 1)); fi

if [ "$DAY" -le 7 ]; then
  gen "$YEAR" "$MONTH"
  gen "$NEXT_YEAR" "$NEXT_MONTH"
else
  gen "$NEXT_YEAR" "$NEXT_MONTH"
fi
