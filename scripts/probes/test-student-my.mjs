import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1600, height: 1100 }, locale: 'zh-CN' })
const p = await c.newPage()
const bad = [], errs = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
p.on('pageerror', e => errs.push(String(e).slice(0, 90)))

await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2500)
await p.fill('#login-email', 'PUB09')
await p.fill('#login-password', 'pjpcPUB09')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)

const tabs = ['今日', '我的作业', '我的积分', '公告', '请假', '我的报告']
for (const t of tabs) {
  const btn = p.locator(`button:has-text("${t}")`).first()
  if (await btn.count()) {
    await btn.click(); await p.waitForTimeout(1500)
    const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
    console.log(`标签 ${t}: 长度 ${txt.length} | ${txt.slice(txt.indexOf(t), txt.indexOf(t) + 110)}`)
  } else console.log(`标签 ${t}: 找不到按钮`)
}

console.log('失败请求:', [...new Set(bad)].slice(0, 6))
console.log('JS 错误:', errs.slice(0, 3))
await b.close()
