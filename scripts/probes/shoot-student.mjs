import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const OUT = '/home/pjpc/exports/shots'
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1280, height: 1400 }, locale: 'zh-CN', deviceScaleFactor: 1.5 })
const p = await c.newPage()

await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2000)
await p.fill('#login-email', 'PUB09')
await p.fill('#login-password', 'pjpcPUB09')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(9000)

const shots = [
  ['01-today', '今日'],
  ['02-homework', '我的作业'],
  ['03-points', '我的积分'],
  ['04-leave', '请假'],
]
for (const [file, label] of shots) {
  const btn = p.locator(`button:has-text("${label}")`).first()
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(1800) }
  await p.screenshot({ path: `${OUT}/student-${file}.png`, fullPage: true })
  console.log('已存', `${OUT}/student-${file}.png`)
}
await b.close()
