import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'

// 临时数据
const st = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '陈小明', student_id: 'ZZ C02', grade: 'Form 1', center: 'PU1', status: 'active', points: 180 }) })).json()
const uname = 'zzc02'
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: uname, email: uname + '@student.pjpc.local', password: 'pjpcZZC02', passwordConfirm: 'pjpcZZC02', name: '陈小明', role: 'student', student_id: st.id, center: 'PU1' }) })).json()
const i1 = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '电子琴', description: '中心大厅用，学生可以练琴', target_points: 2000, current_points: 640, center: 'PU1', status: 'active' }) })).json()
const i2 = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '懒人椅', description: '阅读角', target_points: 800, current_points: 800, center: 'PU1', status: 'achieved' }) })).json()
const r1 = await (await fetch(PB + '/api/collections/reward_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '自己的笔记本', description: '自选款式', cost_points: 120, stock: 10, status: 'active' }) })).json()
const r2 = await (await fetch(PB + '/api/collections/reward_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '耳机', cost_points: 300, stock: 3, status: 'active' }) })).json()

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1360, height: 1100 }, locale: 'zh-CN', deviceScaleFactor: 1.4 })
const p = await c.newPage()
const bad = [], errs = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
p.on('pageerror', e => errs.push(String(e).slice(0, 100)))

await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1800)
await p.fill('#login-email', uname)
await p.fill('#login-password', 'pjpcZZC02')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
const nav = await p.evaluate(() => { const a = document.querySelector('aside') || document.querySelector('nav'); return a ? a.innerText.replace(/\s+/g, ' ') : '' })
console.log('学生侧边栏:', nav.slice(0, 200))
await p.goto(SITE + '/my/contribution', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const t1 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
console.log('贡献页:', t1.length, '字 |', t1.slice(t1.indexOf('我的贡献'), t1.indexOf('我的贡献') + 200))
await p.screenshot({ path: OUT + '/student-contribution.png', fullPage: true })

// 老师端
const p2 = await c.newPage()
await p2.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p2.waitForTimeout(1500)
await p2.fill('#login-email', 'admin@pjpc.com')
await p2.fill('#login-password', '1234567890')
await p2.locator('button:has-text("安全登录")').first().click()
await p2.waitForTimeout(8000)
await p2.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p2.waitForTimeout(3000)
const t2 = await p2.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
console.log('管理页:', t2.length, '字 |', t2.slice(t2.indexOf('贡献兑换'), t2.indexOf('贡献兑换') + 180))
await p2.screenshot({ path: OUT + '/staff-contribution.png', fullPage: true })
console.log('失败请求:', [...new Set(bad)].slice(0, 6))
console.log('JS 错误:', errs.slice(0, 3))
await b.close()

// 清理
for (const id of [r1.id, r2.id]) await fetch(PB + '/api/collections/reward_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of [i1.id, i2.id]) await fetch(PB + '/api/collections/contribution_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/students/records/' + st.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('演示数据已清理')
