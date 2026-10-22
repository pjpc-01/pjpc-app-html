import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const OUT = '/home/pjpc/exports/shots'
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1360, height: 1000 }, locale: 'zh-CN', deviceScaleFactor: 1.5 })
const p = await c.newPage()
const bad = [], errs = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
p.on('pageerror', e => errs.push(String(e).slice(0, 90)))

await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2000)
await p.fill('#login-email', 'PUB09')
await p.fill('#login-password', 'pjpcPUB09')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(9000)

const nav = await p.evaluate(() => {
  const aside = document.querySelector('aside') || document.querySelector('nav')
  return aside ? aside.innerText.replace(/\s+/g, ' ').slice(0, 300) : '(找不到侧边栏)'
})
console.log('侧边栏:', nav)

const pages = [
  ['home', '/my'],
  ['timetable', '/my/timetable'],
  ['homework', '/my/homework'],
  ['points', '/my/points'],
  ['notices', '/my/notices'],
  ['leave', '/my/leave'],
  ['reports', '/my/reports'],
]
for (const [name, path] of pages) {
  await p.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(2200)
  const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  console.log(`${path}: ${txt.length} 字 | ${txt.slice(0, 80)}`)
  await p.screenshot({ path: `${OUT}/stu-${name}.png`, fullPage: true })
}
console.log('失败请求:', [...new Set(bad)].slice(0, 8))
console.log('JS 错误:', errs.slice(0, 4))
await b.close()
