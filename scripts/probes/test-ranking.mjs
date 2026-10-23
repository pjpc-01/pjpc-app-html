import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const OUT = '/home/pjpc/exports/shots'

// 三个临时学生 + 中心物品
const stu = []
for (const [n, sid, pts] of [['陈小明', 'ZZ R01', 260], ['林小华', 'ZZ R02', 180], ['黄小强', 'ZZ R03', 320]]) {
  const s = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: n, student_id: sid, grade: 'Form 1', center: 'PU1', status: 'active', points: pts }) })).json()
  const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: sid.replace(/\s/g, '').toLowerCase(), email: sid.replace(/\s/g, '').toLowerCase() + '@student.pjpc.local', password: 'pjpc' + sid.replace(/\s/g, ''), passwordConfirm: 'pjpc' + sid.replace(/\s/g, ''), name: n, role: 'student', student_id: s.id, center: 'PU1' }) })).json()
  stu.push({ s, u, sid })
}
const item = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 贡献榜测试物品', target_points: 5000, current_points: 0, center: 'PU1', status: 'active' }) })).json()

// 三个学生各投不同分数
const gives = [100, 40, 60]
for (let i = 0; i < stu.length; i++) {
  const lg = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: stu[i].sid.replace(/\s/g, '').toLowerCase(), password: 'pjpc' + stu[i].sid.replace(/\s/g, '') }) })).json()
  const r = await fetch(SITE + '/api/contribution/donate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lg.token }, body: JSON.stringify({ itemId: item.id, points: gives[i] }) }).then(x => x.json())
  console.log(`${stu[i].s.name} 投 ${gives[i]} →`, r.success ? 'ok' : r.error)
}

// 榜单
const a = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }) })).json()
const ranking = await fetch(SITE + '/api/contribution/ranking', { headers: { Authorization: 'Bearer ' + a.token } }).then(r => r.json())
console.log('榜单单:', ranking.total_points, '分 | 人:', ranking.students)
ranking.list.forEach((x, i) => console.log(`  ${i + 1}. ${x.name} ${x.points}分 ${x.percent}% 次数${x.times}`))

// 学生端看自己的占比
const lg1 = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'zzr01', password: 'pjpcZZR01' }) })).json()
const sum = await fetch(SITE + '/api/contribution/summary', { headers: { Authorization: 'Bearer ' + lg1.token } }).then(r => r.json())
console.log('学生自己看占比:', sum.community.my_percent, '% | 累计', sum.balance.contributed)

// 截图管理页
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1200 }, locale: 'zh-CN', deviceScaleFactor: 1.3 })
const p = await c.newPage()
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', '1234567890')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/contribution-management', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.screenshot({ path: OUT + '/ranking.png', fullPage: true })
console.log('管理页有 学生贡献榜:', (await p.evaluate(() => document.body.innerText)).includes('学生贡献榜'))
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
