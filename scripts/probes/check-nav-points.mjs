import { SITE, suToken, ADMIN_LOGIN_PASS } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
// 临时教师账号（绑 GAN SOH YEE）
const te = await (await fetch(PB + '/api/collections/teachers/records?perPage=1&filter=' + encodeURIComponent('name="GAN SOH YEE"'), { headers: { Authorization: su } })).json()
const uname = 'zz_nav_t'
const old = await (await fetch(PB + '/api/collections/users/records?filter=' + encodeURIComponent(`username="${uname}"`), { headers: { Authorization: su } })).json()
for (const o of old.items || []) await fetch(PB + '/api/collections/users/records/' + o.id, { method: 'DELETE', headers: { Authorization: su } })
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: uname, email: uname + '@pjpc.local', password: 'TempNav123', passwordConfirm: 'TempNav123', name: 'ZZ 导航测试', role: 'teacher', teacher_id: te.items[0].id, center: 'PU1' }) })).json()

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1000 }, locale: 'zh-CN' })
const navOf = async (page) => page.evaluate(() => {
  const a = document.querySelector('aside') || document.querySelector('nav')
  return a ? a.innerText.replace(/\s+/g, ' ') : ''
})

// 管理员
const p1 = await c.newPage()
await p1.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p1.waitForTimeout(1600)
await p1.fill('#login-email', 'admin@pjpc.com')
await p1.fill('#login-password', ADMIN_LOGIN_PASS)
await p1.locator('button:has-text("安全登录")').first().click()
await p1.waitForTimeout(8000)
console.log('管理员侧边栏:', (await navOf(p1)).slice(0, 120))
// 展开 系统 → 积分
await p1.locator('aside button:has-text("系统"), nav button:has-text("系统")').first().click().catch(() => {})
await p1.waitForTimeout(1200)
const sysTxt = await p1.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
console.log('系统分组里有积分/贡献兑换:', sysTxt.includes('积分操作'), sysTxt.includes('贡献兑换'))

// 教师
const p2 = await c.newPage()
await p2.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p2.waitForTimeout(1500)
await p2.fill('#login-email', uname)
await p2.fill('#login-password', 'TempNav123')
await p2.locator('button:has-text("安全登录")').first().click()
await p2.waitForTimeout(8000)
console.log('教师侧边栏:', (await navOf(p2)).slice(0, 120))
await b.close()
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('临时账号已删')
