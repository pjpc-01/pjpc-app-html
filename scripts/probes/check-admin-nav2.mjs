import { SITE, ADMIN_LOGIN_PASS } from './_auth.mjs'
import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1100 }, locale: 'zh-CN', deviceScaleFactor: 1.3 })
const p = await c.newPage()
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', ADMIN_LOGIN_PASS)
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2500)

// 展开「系统」：找 aside 里文字正好是 系统 的可点元素
const clicked = await p.evaluate(() => {
  const aside = document.querySelector('aside') || document.querySelector('nav')
  if (!aside) return 'no aside'
  const nodes = Array.from(aside.querySelectorAll('button,a,div[role="button"],span'))
  const hit = nodes.find(n => n.textContent.trim() === '系统')
  if (!hit) return 'no 系统'
  hit.click()
  return 'clicked'
})
await p.waitForTimeout(800)
await p.evaluate(() => {
  const aside = document.querySelector('aside') || document.querySelector('nav')
  const nodes = Array.from(aside.querySelectorAll('button,a,div[role="button"],span'))
  const hit = nodes.find(n => n.textContent.trim() === '积分')
  if (hit) hit.click()
})
await p.waitForTimeout(1500)
const txt = await p.evaluate(() => (document.querySelector('aside') || document.querySelector('nav')).innerText.replace(/\s+/g, ' '))
console.log('点击结果:', clicked)
console.log('侧边栏:', txt.slice(0, 260))
console.log('含 积分操作:', txt.includes('积分操作'), '| 含 贡献兑换:', txt.includes('贡献兑换'))
await p.screenshot({ path: '/home/pjpc/exports/shots/admin-nav-points.png' })
await b.close()
