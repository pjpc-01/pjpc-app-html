#!/usr/bin/env node
/**
 * PJPC 本机看门狗（每 5 分钟跑一次，由 systemd user timer 拉起）。
 *
 * 查什么：
 *   1. 三个服务在不在（pjpc-nextjs / pjpc-pocketbase / pjpc-tunnel）
 *   2. 站点和 PocketBase 健不健康（HTTP 200）
 *   3. 最近 5 分钟有没有 5xx
 *   4. 磁盘用了多少（85% 报警）
 *
 * 怎么报：Telegram。只在「状态变化」时报，坏了报一次、好了报一次，
 * 还坏着每 60 分钟提醒一次，不刷屏。
 *
 * 免打扰：01:00–06:15 是计划内关机时段，不报（除非出现白天不该有的错误）。
 *
 * 用法：node scripts/watchdog.mjs          正常检查
 *       node scripts/watchdog.mjs --print  只打印，不发 Telegram
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'

const HOME = process.env.HOME || '/home/sacrafix'
const STATE_DIR = path.join(HOME, '.hermes/state')
const STATE_FILE = path.join(STATE_DIR, 'pjpc-watchdog.json')
const PRINT_ONLY = process.argv.includes('--print')

// ── Telegram 配置（从 ~/.hermes/.env 读，不写死）──
function readEnvFile(file) {
  const out = {}
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
    }
  } catch { /* 没有就算了 */ }
  return out
}
const env = { ...readEnvFile(path.join(HOME, '.hermes/.env')), ...process.env }
const TG_TOKEN = env.TELEGRAM_BOT_TOKEN || ''
const TG_CHAT = env.TELEGRAM_HOME_CHANNEL || ''

async function notify(text) {
  if (PRINT_ONLY || !TG_TOKEN || !TG_CHAT) {
    console.log('[watchdog] 通知内容:\n' + text)
    return
  }
  // 用 curl 而不是 fetch：WSL 里 Node 的 fetch 会先走 IPv6，telegram 只有 v6 记录时
  // 经常直接 ECONNREFUSED/fetch failed；curl 会自己回落到 v4，实测稳。
  try {
    const payload = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true })
    const out = execFileSync('curl', [
      '-s', '-m', '20', '-X', 'POST',
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      '-H', 'Content-Type: application/json',
      '--data-binary', payload,
    ], { encoding: 'utf8', timeout: 25000 })
    if (!/"ok":true/.test(out)) console.error('[watchdog] Telegram 回执异常:', out.slice(0, 160))
  } catch (e) {
    console.error('[watchdog] Telegram 发不出去:', String(e).slice(0, 120))
  }
}

const sh = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', timeout: 15000 }).trim() } catch { return '' }
}

// ── 计划内关机时段 ──
function inQuietHours(d = new Date()) {
  const mins = d.getHours() * 60 + d.getMinutes()
  return mins >= 60 && mins < 375 // 01:00 – 06:15
}

async function httpCode(url) {
  try {
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 10000)
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' })
    clearTimeout(t)
    return r.status
  } catch { return 0 }
}

async function main() {
  const now = new Date()

  if (process.argv.includes('--test')) {
    await notify(`<b>PJPC 看门狗测试</b>\n这是一条测试通知，收到就说明告警通道是通的。\n${now.toLocaleString('zh-CN')}`)
    console.log('[watchdog] 已发送测试通知')
    return
  }
  const problems = []
  const notes = []

  // 1. 服务
  for (const svc of ['pjpc-nextjs', 'pjpc-pocketbase', 'pjpc-tunnel']) {
    const st = sh('systemctl', ['--user', 'is-active', svc])
    if (st !== 'active') problems.push(`服务 ${svc} 状态：${st || '未知'}`)
  }

  // 2. 站点 + 数据库
  const site = await httpCode('http://127.0.0.1:3001/login')
  if (site !== 200) problems.push(`站点 /login 返回 ${site || '连不上'}`)
  const pb = await httpCode('http://127.0.0.1:8090/api/health')
  if (pb !== 200) problems.push(`PocketBase 健康检查返回 ${pb || '连不上'}`)

  // 3. 最近 5 分钟 5xx
  const logs = sh('journalctl', ['--user', '-u', 'pjpc-nextjs', '--since', '5 min ago', '--no-pager', '-o', 'cat'])
  const err5xx = logs.split('\n').filter((l) => /(status|code)"?\s*[:=]\s*5\d\d|\s5\d\d\s/.test(l)).length
  if (err5xx >= 5) problems.push(`最近 5 分钟 5xx/错误日志 ${err5xx} 条`)

  // 4. 磁盘
  for (const [label, p] of [['根分区', '/'], ['备份盘', '/mnt/d']]) {
    const out = sh('df', ['-P', p])
    const line = out.split('\n')[1] || ''
    const pct = Number((line.match(/(\d+)%/) || [])[1] || 0)
    if (pct >= 85) problems.push(`${label} 已用 ${pct}%`)
    if (pct >= 70 && pct < 85) notes.push(`${label} 已用 ${pct}%`)
  }

  // 5. 备份新鲜度（18:30 之后应有一份今天的）
  const backupDir = '/mnt/d/pjpc-backup'
  if (fs.existsSync(backupDir)) {
    const newest = fs.readdirSync(backupDir)
      .map((f) => ({ f, t: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]
    if (newest) {
      const hours = (Date.now() - newest.t) / 3600000
      if (hours > 36) problems.push(`备份最新一份已是 ${Math.round(hours)} 小时前（${newest.f}）`)
    } else problems.push('备份目录是空的')
  }

  // ── 状态对比 ──
  fs.mkdirSync(STATE_DIR, { recursive: true })
  let prev = {}
  try { prev = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) } catch { /* 第一次 */ }
  const wasBad = !!prev.bad
  const lastNotify = Number(prev.lastNotify || 0)
  const bad = problems.length > 0
  const quiet = inQuietHours(now)

  if (bad && quiet && !prev.badDuringQuiet) {
    // 计划内关机时段：只记状态，不吵人
    console.log('[watchdog] 免打扰时段，问题先记下：', problems.join(' / '))
  } else if (bad && (!wasBad || Date.now() - lastNotify > 3600000)) {
    const lines = problems.map((p) => `• ${p}`).join('\n')
    const host = os.hostname()
    await notify(`<b>PJPC 系统异常</b>\n${lines}\n\n主机 ${host} · ${now.toLocaleString('zh-CN')}`)
  } else if (!bad && wasBad) {
    await notify(`<b>PJPC 恢复正常</b>\n服务和页面都回来了 · ${now.toLocaleString('zh-CN')}`)
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify({
    bad,
    problems,
    lastNotify: bad && (!wasBad || Date.now() - lastNotify > 3600000) ? Date.now() : lastNotify,
    badDuringQuiet: bad && quiet,
    checkedAt: now.toISOString(),
  }))

  console.log(`[watchdog] ${now.toLocaleString('zh-CN')} ${bad ? '异常' : '正常'}${notes.length ? ' | ' + notes.join(' / ') : ''}`)
  if (bad) console.log('  · ' + problems.join('\n  · '))
}

main().catch((e) => {
  console.error('[watchdog] 自己挂了:', e)
  process.exit(1)
})
