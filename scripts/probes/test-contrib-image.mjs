import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
import fs from 'fs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'

// 1x1 红色 PNG
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
fs.writeFileSync('/tmp/zz-item.png', png)

const st = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 照片测试', student_id: 'ZZ P01', grade: 'Form 1', center: 'PU1', status: 'active', points: 200 }) })).json()
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: 'zzp01', email: 'zzp01@student.pjpc.local', password: 'pjpcZZP01', passwordConfirm: 'pjpcZZP01', name: 'ZZ 照片测试', role: 'student', student_id: st.id, center: 'PU1' }) })).json()
const item = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 有照片的物品', target_points: 500, current_points: 120, center: 'PU1', status: 'active' }) })).json()

// 传照片
const fd = new FormData()
fd.append('image', new Blob([png], { type: 'image/png' }), 'item.png')
const up = await fetch(PB + '/api/collections/contribution_items/records/' + item.id, { method: 'PATCH', headers: { Authorization: su }, body: fd })
const upj = await up.json().catch(() => ({}))
console.log('上传照片:', up.status, '| 文件名:', upj.image || '(空)')

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1360, height: 1000 }, locale: 'zh-CN' })
const p = await c.newPage()
const bad = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1800)
await p.fill('#login-email', 'zzp01')
await p.fill('#login-password', 'pjpcZZP01')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/my/contribution', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const imgs = await p.locator('img[src*="api/files/"]').count()
const ok = await p.evaluate(() => {
  const im = document.querySelector('img[src*="api/files/"]')
  return im ? im.complete && im.naturalWidth > 0 : false
})
console.log('学生页显示照片数:', imgs, '| 图片真的加载出来:', ok)
await p.screenshot({ path: OUT + '/student-contribution-photo.png', fullPage: true })

// 管理员看管理页
const p2 = await c.newPage()
await p2.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p2.waitForTimeout(1500)
await p2.fill('#login-email', 'admin@pjpc.com')
await p2.fill('#login-password', '1234567890')
await p2.locator('button:has-text("安全登录")').first().click()
await p2.waitForTimeout(8000)
await p2.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p2.waitForTimeout(2500)
const adminImgs = await p2.locator('img[src*="api/files/"]').count()
const navTxt = await p2.evaluate(() => { const a = document.querySelector('aside') || document.querySelector('nav'); return a ? a.innerText.replace(/\s+/g, ' ').slice(0, 160) : '' })
console.log('管理页缩略图:', adminImgs, '| 管理员侧边栏:', navTxt)
await p2.screenshot({ path: OUT + '/staff-contribution-photo.png', fullPage: true })
console.log('失败请求:', [...new Set(bad)].slice(0, 5))
await b.close()

await fetch(PB + '/api/collections/contribution_items/records/' + item.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/students/records/' + st.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理')
