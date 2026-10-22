// 学生账号全面自测（只读 + 隔离检查），结果打到 stdout
import { adminAuth, suToken, SITE } from './_auth.mjs'

const PB = 'http://127.0.0.1:8090'
const out = []
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s) }
let fail = 0
const ok = (m) => log('  OK   ' + m)
const bad = (m) => { fail++; log('  FAIL ' + m) }

const su = await suToken()
const H = { Authorization: su }

const stu = await (await fetch(`${PB}/api/collections/students/records?perPage=500`, { headers: H })).json()
const us = await (await fetch(`${PB}/api/collections/users/records?perPage=500&filter=${encodeURIComponent('role="student"')}`, { headers: H })).json()
const students = stu.items || []
const accounts = us.items || []
const byId = new Map(students.map(s => [s.id, s]))

log(`=== A. 数据完整性（${accounts.length} 个学生账号）===`)

// A1 绑定检查
const seen = new Set()
for (const u of accounts) {
  const s = byId.get(u.student_id)
  if (!s) { bad(`${u.username} 绑定的学生不存在 (${u.student_id})`); continue }
  if (seen.has(u.student_id)) bad(`${u.username} 与别人绑了同一个学生`)
  seen.add(u.student_id)
  if (String(s.grade || '') !== '' && u.center && s.center && u.center !== s.center) {
    bad(`${u.username} 中心不一致 账号=${u.center} 学生=${s.center}`)
  }
}
if (!fail) ok(`${accounts.length} 个账号绑定全部有效，无重复、无孤儿`)

// A2 学号能否登录
let authFail = 0
const tokens = new Map()
for (const u of accounts) {
  const r = await fetch(`${PB}/api/collections/users/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: u.username, password: 'pjpc' + u.username }),
  })
  if (r.status !== 200) { authFail++; bad(`${u.username} 登录失败 ${r.status}`); continue }
  const d = await r.json()
  tokens.set(u.username, d.token)
  if (d.record.role !== 'student') bad(`${u.username} 角色不对: ${d.record.role}`)
}
if (!authFail) ok(`${accounts.length} 个账号用「学号 + pjpc学号」全部登录成功`)

// A3 年级分布
const dist = {}
for (const u of accounts) { const g = byId.get(u.student_id)?.grade || '?' ; dist[g] = (dist[g] || 0) + 1 }
ok('年级分布: ' + JSON.stringify(dist))

log('\n=== B. 权限隔离（抽 4 个账号）===')
const samples = accounts.slice(0, 4)
for (const u of samples) {
  const tk = tokens.get(u.username)
  const AH = { Authorization: 'Bearer ' .concat(tk) }
  const me = byId.get(u.student_id)

  // B1 学生列表只返回自己
  const list = await (await fetch(`${SITE}/api/pocketbase-proxy/api/collections/students/records?perPage=100`, { headers: AH })).json()
  const n = (list.items || []).length
  if (n === 1 && list.items[0].id === me.id) ok(`${u.username} 学生列表只看到自己`)
  else bad(`${u.username} 学生列表看到 ${n} 条（应为 1）`)

  // B2 直读别人 → 403/404
  const other = accounts.find(x => x.student_id !== me.id)
  const otherStu = byId.get(other.student_id)
  const r2 = await fetch(`${SITE}/api/pocketbase-proxy/api/collections/students/records/${otherStu.id}`, { headers: AH })
  if ([403, 404].includes(r2.status)) ok(`${u.username} 直读别人档案被挡 (${r2.status})`)
  else bad(`${u.username} 直读别人档案返回 ${r2.status}`)

  // B3 写操作 → 403
  const r3 = await fetch(`${SITE}/api/pocketbase-proxy/api/collections/students/records/${me.id}`, {
    method: 'PATCH', headers: { ...AH, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'HACKED' }),
  })
  if (r3.status === 403) ok(`${u.username} 改档案被挡`)
  else {
    bad(`${u.username} 改档案返回 ${r3.status}  ← 严重`)
    // 回滚
    await fetch(`${PB}/api/collections/students/records/${me.id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: me.name }) })
  }

  // B4 员工接口
  for (const api of ['/api/students/list?limit=5', '/api/points?page=1&per_page=5', '/api/users', '/api/announcements']) {
    const r = await fetch(SITE + api, { headers: AH })
    if (r.status === 200) {
      bad(`${u.username} 能打员工接口 ${api} → 200 ← 严重`)
    }
  }
}
ok('员工接口抽查完成（有 FAIL 会在上面）')

log('\n=== C. 越权边界：学生打财务/薪资 ===')
for (const u of samples.slice(0, 2)) {
  const AH = { Authorization: 'Bearer ' + tokens.get(u.username) }
  for (const api of ['/api/finance/debts', '/api/salary-settings', '/api/audit-logs?limit=1', '/api/users/reset-password']) {
    const r = await fetch(SITE + api, { method: api.includes('reset') ? 'POST' : 'GET', headers: { ...AH, 'Content-Type': 'application/json' }, body: api.includes('reset') ? JSON.stringify({ userId: 'x', newPassword: '12345678' }) : undefined })
    if (r.status === 200) bad(`${u.username} 能打 ${api} → 200 ← 严重`)
    else ok(`${u.username} ${api} → ${r.status}`)
  }
}

log('\n=== D. 登录负例 ===')
{
  const r1 = await fetch(`${PB}/api/collections/users/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: samples[0].username, password: 'wrongpass123' }),
  })
  if (r1.status === 400) ok('错密码被拒 (400)'); else bad(`错密码返回 ${r1.status}`)

  const r2 = await fetch(`${PB}/api/collections/users/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'NOTEXIST99', password: 'whatever123' }),
  })
  if (r2.status === 400) ok('不存在的学号被拒 (400)'); else bad(`不存在学号返回 ${r2.status}`)
}

log('\n=== E. 员工账号没被牵连 ===')
{
  const a = await adminAuth()
  const r = await fetch(`${SITE}/api/students/list?limit=3`, { headers: { Authorization: 'Bearer ' + a.token } })
  if (r.status === 200) ok('管理员读学生列表正常'); else bad(`管理员读学生列表 ${r.status}`)
}

log(`\n结论: ${fail === 0 ? '全部通过' : fail + ' 项不合格'}`)
process.exit(fail === 0 ? 0 : 1)
