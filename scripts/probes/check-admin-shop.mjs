import { suToken, SITE, ADMIN_LOGIN_PASS } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'

// 放两张演示物品（带图）
const ids = []
for (const it of [{ name: '电子琴', target_points: 2000, current_points: 640 }, { name: '懒人椅', target_points: 800, current_points: 300 }]) {
  const r = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ ...it, center: 'PU1', status: 'active' }) })).json()
  ids.push(r.id)
}
const rid = (await (await fetch(PB + '/api/collections/reward_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: '蓝牙耳机', cost_points: 300, stock: 3, status: 'active' }) })).json()).id

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1100 }, locale: 'zh-CN', deviceScaleFactor: 1.4 })
const p = await c.newPage()

// 管理员
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', ADMIN_LOGIN_PASS)
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
const navOk = await p.evaluate(() => document.body.innerText.includes('教务'))
await p.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const adminCards = await p.locator('div.grid > div.rounded-xl.border').count()
console.log('管理员 卡片数:', adminCards, '| 教务菜单在:', navOk)
await p.screenshot({ path: OUT + '/admin-shop.png', fullPage: true })

// 行政 office_admin
const oa = await (await fetch(PB + '/api/collections/users/records?filter=' + encodeURIComponent('role="office_admin"'), { headers: { Authorization: su } })).json()
console.log('office_admin 账号:', (oa.items || []).map((x) => x.username).join(','))
await b.close()
for (const id of ids) await fetch(PB + '/api/collections/contribution_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/reward_items/records/' + rid, { method: 'DELETE', headers: { Authorization: su } })
console.log('清理完成')
