// Next.js instrumentation — runs once at server startup
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAbsentScheduler } = await import('@/lib/absent-scheduler')
    startAbsentScheduler()
    console.log('[INSTRUMENTATION] Absent scheduler started')
  }
}
