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

  console.log(`[ABSENT-SCHEDULER] Running absent deduction for ${today}`)

  try {
    const res = await fetch('http://127.0.0.1:3001/api/attendance/absent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    console.log(`[ABSENT-SCHEDULER] ${data.message || data.absent + ' absent'}`)
  } catch (e) {
    console.error('[ABSENT-SCHEDULER] Failed:', e)
  }
}

export function startAbsentScheduler() {
  // Check every 5 minutes
  const interval = setInterval(runAbsentOnce, 5 * 60 * 1000)
  // Also run once on startup (the API itself is idempotent via point_logs check)
  setTimeout(runAbsentOnce, 30 * 1000) // delay 30s to let server fully boot
}