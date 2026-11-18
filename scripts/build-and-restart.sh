#!/usr/bin/env bash
# 构建 + 重启，失败也不会把站点留在 502
#   0. 先停看门狗、上构建锁 —— 否则看门狗会把「构建中停掉的服务」当故障拉起，
#      而 .next 正在被换走 → 起不来 → systemd 每 4 秒重启一次，一直 crash loop（2026-11-18 踩过）
#   1. 把现有 .next 改名成 .next.bak（瞬间完成，不复制）
#   2. 构建；成功就删掉 .next.bak
#   3. 失败就把 .next 换回旧的那份（否则 .next 被清空 → Cloudflare bad gateway）
#   4. 不管成功失败，最后一定把 pjpc-nextjs 起回来，并打印 /login 状态码
#   5. 收尾：去锁、恢复看门狗
set -uo pipefail
cd /home/pjpc/pjpc-app-prod || exit 1

LOCK=/home/pjpc/.pjpc-build.lock
cleanup() {
  rm -f "$LOCK"
  systemctl --user start pjpc-watchdog.timer >/dev/null 2>&1 || true
}
trap cleanup EXIT

touch "$LOCK"
systemctl --user stop pjpc-watchdog.timer pjpc-watchdog.service >/dev/null 2>&1 || true

systemctl --user stop pjpc-nextjs
rm -rf .next.bak
[ -d .next ] && mv .next .next.bak

npm run build > /tmp/pjpc-build.log 2>&1
ec=$?

if [ $ec -eq 0 ]; then
  rm -rf .next.bak
  echo "BUILD OK"
else
  echo "BUILD FAILED (exit $ec)，回滚到旧的 .next"
  rm -rf .next
  [ -d .next.bak ] && mv .next.bak .next
  tail -20 /tmp/pjpc-build.log
fi

systemctl --user start pjpc-nextjs
sleep 6
curl -s -o /dev/null -w "login %{http_code}\n" http://127.0.0.1:3001/login
exit $ec
