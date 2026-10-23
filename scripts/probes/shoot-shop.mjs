import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
import fs from 'fs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
fs.writeFileSync('/tmp/demo.png', png)

const st = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '陈小明', student_id: 'ZZ S01', grade: 'Form 1', center: 'PU1', status: 'active', points: 260 }) })).json()
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: 'zzs01', email: 'zzs01@student.pjpc.local', password: 'pjpcZZS01', passwordConfirm: 'pjpcZZS01', name: '陈小明', role: 'student', student_id: st.id, center: 'PU1' }) })).json()

const ids = { items: [], rewards: [] }
const items = [
  { name: '电子琴', target_points: 2000, current_points: 640, center: 'PU1' },
  { name: '懒人椅', target_points: 800, current_points: 800, center: 'PU1' },
  { name: '图书角书柜', target_points: 1200, current_points: 310, center: 'PU1' },
  { name: '空气净化器', target_points: 1500, current_points: 120, center: 'PU1' },
]
for (const it of items) {
  const r = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ ...it, status: it.current_points >= it.target_points ? 'achieved' : 'active', description: '中心共用' }) })).json()
  const fd = new FormData(); fd.append('image', new Blob([png], { type: 'image/png' }), 'x.png')
  await fetch(PB + '/api/collections/contribution_items/records/' + r.id, { method: 'PATCH', headers: { Authorization: su }, body: fd })
  ids.items.push(r.id)
}
const rewards = [
  { name: '自己的笔记本', cost_points: 120, stock: 10 },
  { name: '蓝牙耳机', cost_points: 300, stock: 3 },
  { name: '篮球', cost_points: 200, stock: 5 },
  { name: '乐高小盒', cost_points: 450, stock: 2 },
]
for (const rw of rewards) {
  const r = await (await fetch(PB + '/api/collections/reward_items/records', { method: 'POST', headers: H, body: JSON.stringify({ ...rw, status: 'active', description: '自选' }) })).json()
  const fd = new FormData(); fd.append('image', new Blob([png], { type: 'image/png' }), 'y.png')
  await fetch(PB + '/api/collections/reward_items/records/' + r.id, { method: 'PATCH', headers: { Authorization: su }, body: fd })
  ids.rewards.push(r.id)
}

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1100 }, locale: 'zh-CN', deviceScaleFactor: 1.4 })
const p = await c.newPage()
const bad = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1800)
await p.fill('#login-email', 'zzs01')
await p.fill('#login-password', 'pjpcZZS01')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/my/contribution', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
await p.screenshot({ path: OUT + '/shop-student.png', fullPage: true })
const cards = await p.locator('section').first().locator('div.rounded-xl.border').count()
console.log('卡片数(中心物品区):', cards, '| 图片:', await p.locator('img[src*="api/files/"]').count())

// 投放弹窗
await p.locator('button:has-text("贡献积分")').first().click()
await p.waitForTimeout(800)
await p.screenshot({ path: OUT + '/shop-donate-modal.png' })
await p.keyboard.press('Escape').catch(() => {})
await p.locator('button:has-text("取消")').first().click().catch(() => {})

// 管理页
const p2 = await c.newPage()
await p2.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p2.waitForTimeout(1500)
await p2.fill('#login-email', 'admin@pjpc.com')
await p2.fill('#login-password', '1234567890')
await p2.locator('button:has-text("安全登录")').first().click()
await p2.waitForTimeout(8000)
await p2.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p2.waitForTimeout(2500)
await p2.screenshot({ path: OUT + '/shop-staff.png', fullPage: true })
console.log('管理页图片:', await p2.locator('img[src*="api/files/"]').count())
console.log('失败:', [...new Set(bad)].slice(0, 5))
await b.close()

for (const id of ids.rewards) await fetch(PB + '/api/collections/reward_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of ids.items) await fetch(PB + '/api/collections/contribution_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/students/records/' + st.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理演示数据')
