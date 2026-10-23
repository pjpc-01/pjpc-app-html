import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'

const stu = []
for (const [n, sid, pts, center] of [['陈小明', 'ZZ C11', 260, 'PU1'], ['林小华', 'ZZ C12', 180, 'PU1'], ['黄小强', 'ZZ C13', 320, 'BATU14'], ['王小雨', 'ZZ C14', 200, 'BATU14']]) {
  const s = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: n, student_id: sid, grade: 'Form 1', center, status: 'active', points: pts }) })).json()
  const uname = sid.replace(/\s/g, '').toLowerCase()
  const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: uname, email: uname + '@student.pjpc.local', password: 'pjpc' + sid.replace(/\s/g, ''), passwordConfirm: 'pjpc' + sid.replace(/\s/g, ''), name: n, role: 'student', student_id: s.id, center }) })).json()
  stu.push({ s, u, uname, center })
}
const item = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 分中心测试', target_points: 9000, current_points: 0, center: 'PU1', status: 'active' }) })).json()

const gives = [100, 60, 80, 20]
for (let i = 0; i < stu.length; i++) {
  const lg = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: stu[i].uname, password: 'pjpc' + stu[i].s.student_id.replace(/\s/g, '') }) })).json()
  await fetch(SITE + '/api/contribution/donate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lg.token }, body: JSON.stringify({ itemId: item.id, points: gives[i] }) })
}

const a = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }) })).json()
const rk = await fetch(SITE + '/api/contribution/ranking', { headers: { Authorization: 'Bearer ' + a.token } }).then(r => r.json())
console.log('全校:', rk.overall.total_points, '分 /', rk.overall.students, '人')
rk.groups.forEach(g => {
  console.log(`中心 ${g.center}: 合计 ${g.total_points} · ${g.students} 人`)
  g.list.forEach(x => console.log(`   ${x.name} ${x.points}分 ${x.percent}%`))
})

// 学生自己看
const lg1 = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'zzc11', password: 'pjpcZZC11' }) })).json()
const sm = await fetch(SITE + '/api/contribution/summary', { headers: { Authorization: 'Bearer ' + lg1.token } }).then(r => r.json())
console.log('陈小明: 本中心', sm.community.my_center_percent, '% | 全校', sm.community.my_percent, '%')

// 截图管理页（切到 PU1）
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1150 }, locale: 'zh-CN', deviceScaleFactor: 1.3 })
const p = await c.newPage()
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', '1234567890')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.locator('button:has-text("PU1")').first().click().catch(() => {})
await p.waitForTimeout(1200)
const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
const i = t.indexOf('学生贡献榜')
console.log('页面片段:', t.slice(i, i + 150))
await p.screenshot({ path: OUT + '/ranking-center.png', fullPage: true })
await b.close()

// 清理
const logs = await (await fetch(PB + '/api/collections/contribution_logs/records?perPage=200', { headers: { Authorization: su } })).json()
for (const l of logs.items || []) await fetch(PB + '/api/collections/contribution_logs/records/' + l.id, { method: 'DELETE', headers: { Authorization: su } })
for (const x of stu) {
  const pl = await (await fetch(PB + '/api/collections/point_logs/records?filter=' + encodeURIComponent(`student="${x.s.id}"`), { headers: { Authorization: su } })).json()
  for (const l of pl.items || []) await fetch(PB + '/api/collections/point_logs/records/' + l.id, { method: 'DELETE', headers: { Authorization: su } })
  await fetch(PB + '/api/collections/users/records/' + x.u.id, { method: 'DELETE', headers: { Authorization: su } })
  await fetch(PB + '/api/collections/students/records/' + x.s.id, { method: 'DELETE', headers: { Authorization: su } })
}
await fetch(PB + '/api/collections/contribution_items/records/' + item.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理')
