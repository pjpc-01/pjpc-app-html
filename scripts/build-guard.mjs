#!/usr/bin/env node
/**
 * 构建闸门：任何 `npm run build` 都会先过这里（package.json 的 prebuild / postbuild）。
 *
 * 为什么要有它：2026-11-17 和 11-19 两次 bad gateway，都是别的 agent 直接
 * `systemctl stop pjpc-nextjs && npm run build`，绕过 scripts/build-and-restart.sh：
 *   - 看门狗没停 → 构建中途把服务拉起来，`.next` 正被换走，next start 立刻退出 → crash loop
 *   - 构建失败也没人回滚、没人重启 → 站点一直 502
 * 挂到 npm 的 prebuild/postbuild 上，谁建都跑同一套闸门，不用记得去调脚本。
 *
 * 用法：node scripts/build-guard.mjs start|end
 */
import fs from 'fs'
import { execSync } from 'child_process'

const LOCK = '/home/pjpc/.pjpc-build.lock'
const app = process.argv[2]

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim()
  } catch {
    return ''
  }
}

if (app === 'start') {
  fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, at: Date.now(), by: sh('whoami') }))
  sh('systemctl --user stop pjpc-watchdog.timer pjpc-watchdog.service')
  console.log('[build-guard] 已上锁，看门狗暂停（构建完自动恢复）')
} else if (app === 'end') {
  try { fs.unlinkSync(LOCK) } catch {}
  sh('systemctl --user start pjpc-watchdog.timer')
  console.log('[build-guard] 已解锁，看门狗恢复')
} else {
  console.error('用法: node scripts/build-guard.mjs start|end')
  process.exit(2)
}
