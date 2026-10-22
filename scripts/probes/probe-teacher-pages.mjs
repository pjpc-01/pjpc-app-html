import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }

const te = await (await fetch(PB + '/api/collections/teachers/records?perPage=1&filter=' + encodeURIComponent('name="GAN SOH YEE"'), { headers: { Authorization: su } })).json()
const tid = te.items[0].id
const uname = 'zz_probe_t1'
await fetch(PB + '/api/collections/users/records/' + (await (await fetch(PB + '/api/collections/users/records?filter=' + encodeURIComponent(`username="${uname}"`), { headers: { Authorization: su } })).json()).items[0]?.id, { method: 'DELETE', headers: H }).catch(() => {})
const mk = await fetch(PB + '/api/collections/users/records', {
  method: 'POST', headers: H,
  body: JSON.stringify({ username: uname, email: uname + '@pjpc.local', password: 'TempProbe123', passwordConfirm: 'TempProbe123', name: 'ZZ 探测老师', role: 'teacher', teacher_id: tid, center: 'PU1' }),
})
const u = await mk.json()
console.log('临时教师账号:', mk.status, u.id)

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1360, height: 1000 }, locale: 'zh-CN' })
const p = await c.newPage()
const bad = [], errs = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
p.on('pageerror', e => errs.push(String(e).slice(0, 80)))
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2000)
await p.fill('#login-email', uname)
await p.fill('#login-password', 'TempProbe123')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(9000)
console.log('登录后 URL:', new URL(p.url()).pathname)

const nav = await p.evaluate(() => {
  const a = document.querySelector('aside') || document.querySelector('nav')
  return a ? a.innerText.replace(/\s+/g, ' ').slice(0, 260) : '(无侧边栏)'
})
console.log('侧边栏:', nav)

for (const path of ['/teacher-workspace', '/teacher-workspace/students', '/teacher-workspace/courses', '/teacher-workspace/attendance', '/teacher-workspace/leave']) {
  await p.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(2500)
  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  console.log(`${path}: ${t.length} 字 | ${t.slice(t.indexOf('教师工作台') + 5, t.indexOf('教师工作台') + 95)}`)
}
console.log('失败:', [...new Set(bad)].slice(0, 6))
console.log('错误:', errs.slice(0, 3))
await b.close()
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('临时账号已删')
