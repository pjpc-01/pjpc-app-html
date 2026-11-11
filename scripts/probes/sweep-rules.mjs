import { chromium } from 'playwright'
const B = 'http://127.0.0.1:3001'
const PAGES = ['/', '/attendance/manual', '/contribution-management', '/finance/invoices', '/finance/payments',
  '/student-management', '/teacher-management', '/teacher-workspace', '/notifications', '/settings',
  '/finance/fee-management', '/finance/reports', '/salary', '/audit-logs', '/schedules']

const b = await chromium.launch({ headless: true })
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, locale: 'zh-CN' })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 120)))
p.on('response', (r) => {
  const u = r.url()
  if (r.status() >= 400 && (u.includes('/api/') || u.includes('pocketbase-proxy')) && !u.includes('/api/notifications')) {
    errs.push(`${r.status()} ${u.replace(B, '').slice(0, 80)}`)
  }
})

await p.goto(B + '/login', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1500)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', '1234567890')
await p.click('button[type=submit]')
await p.waitForTimeout(9000)

for (const path of PAGES) {
  errs.length = 0
  const res = await p.goto(B + path, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(3500)
  const txt = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 60)
  console.log(`${res.status()} ${path} | ${errs.length ? 'ERR ' + errs.slice(0, 2).join(' ; ') : 'ok'} | ${txt}`)
}
await b.close()
