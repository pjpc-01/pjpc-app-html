// Auto-runs absent deduction daily at 18:00 Malaysia time
// Imported once at server startup via instrumentation

const ABSENT_HOUR = 18
let lastRunDate = ''

async function runAbsentOnce() {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  if (now.getHours() < ABSENT_HOUR) return // not time yet
  if (lastRunDate === today) return // already done today

  lastRunDate = today
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
  setInterval(runAbsentOnce, 5 * 60 * 1000)
  // Also run once on startup
  runAbsentOnce()
}
