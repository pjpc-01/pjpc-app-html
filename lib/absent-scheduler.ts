// Auto-runs absent deduction daily at 18:00 Malaysia time
// Imported once at server startup via instrumentation

const ABSENT_HOUR = 18

async function runAbsentOnce() {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  if (now.getHours() < ABSENT_HOUR) return // not time yet
  if (now.getHours() >= ABSENT_HOUR + 4) return // only run 18:00-22:00 (avoid late-night duplicate runs after restarts)

  // 周末不扣分（安亲班周末不上课）
  const day = now.getDay()
  if (day === 0 || day === 6) {
    console.log(`[ABSENT-SCHEDULER] Weekend, skip absent deduction for ${today}`)
    return
  }

  const autoOn = process.env.ABSENT_AUTO_DEDUCT === '1'
  console.log(`[ABSENT-SCHEDULER] Running absent deduction for ${today}${autoOn ? '' : ' (dry run: ABSENT_AUTO_DEDUCT!=1)'}`)

  try {
    const res = await fetch('http://127.0.0.1:3001/api/attendance/absent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 内部定时器没有用户会话，走内部钥匙头（原来不带任何凭证 → 每次都 401，扣分从没跑成）
        'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '',
      },
      body: JSON.stringify({ dryRun: !autoOn }),
    })
    // 不先看状态码就直接 res.json()，401/500 会变成一行「undefined absent」——
    // 2026-10-22~11-16 缺勤扣分就是这么静默死了 18 个上课日没人发现
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[ABSENT-SCHEDULER] HTTP ${res.status} 扣分没跑成: ${body.slice(0, 200)}`)
      return
    }
    const data = await res.json()
    console.log(`[ABSENT-SCHEDULER] ${data.message || JSON.stringify(data).slice(0, 200)}`)
    if (Array.isArray(data.wouldDeduct) && data.wouldDeduct.length) {
      console.log(`[ABSENT-SCHEDULER] 名单: ${data.wouldDeduct.join(', ')}`)
    }
  } catch (e) {
    console.error('[ABSENT-SCHEDULER] Failed:', e)
  }
}

export function startAbsentScheduler() {
  // 启动时打一行，方便 journalctl 确认自动扣分到底是开还是只预演
  console.log(`[ABSENT-SCHEDULER] armed=${process.env.ABSENT_AUTO_DEDUCT === '1' ? 'yes(自动扣分)' : 'no(只预演)'}`)
  // Check every 5 minutes
  const interval = setInterval(runAbsentOnce, 5 * 60 * 1000)
  // Also run once on startup (the API itself is idempotent via point_logs check)
  setTimeout(runAbsentOnce, 30 * 1000) // delay 30s to let server fully boot
}