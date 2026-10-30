import { suToken, SITE, ADMIN_LOGIN_PASS } from './_auth.mjs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const created = { students: [], users: [], items: [], rewards: [], reds: [], logs: [] }

// 1) 临时学生 + 账号
const st = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 贡献测试', student_id: 'ZZ C01', grade: 'Form 1', center: 'PU1', status: 'active', points: 100 }) })).json()
created.students.push(st.id)
const uname = 'zzc01'
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: uname, email: uname + '@student.pjpc.local', password: 'pjpcZZC01', passwordConfirm: 'pjpcZZC01', name: 'ZZ 贡献测试', role: 'student', student_id: st.id, center: 'PU1' }) })).json()
created.users.push(u.id)
console.log('临时学生', st.id, '账号', u.id, '初始积分 100')

// 2) 临时物品
const item = await (await fetch(PB + '/api/collections/contribution_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 测试中心物品', target_points: 100, current_points: 0, center: 'PU1', status: 'active' }) })).json()
created.items.push(item.id)
const reward = await (await fetch(PB + '/api/collections/reward_items/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 测试奖品', cost_points: 30, stock: 5, status: 'active' }) })).json()
created.rewards.push(reward.id)

// 3) 学生登录
const lg = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: uname, password: 'pjpcZZC01' }) })).json()
const SH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lg.token }

// 4) 投入 40
const d = await fetch(SITE + '/api/contribution/donate', { method: 'POST', headers: SH, body: JSON.stringify({ itemId: item.id, points: 40 }) }).then(r => r.json())
console.log('投入 40 →', JSON.stringify(d).slice(0, 140))

const stu2 = await (await fetch(PB + '/api/collections/students/records/' + st.id, { headers: { Authorization: su } })).json()
const item2 = await (await fetch(PB + '/api/collections/contribution_items/records/' + item.id, { headers: { Authorization: su } })).json()
console.log('  学生积分应为 60 →', stu2.points, '| 物品进度应为 40 →', item2.current_points)

// 5) 超投被拦
const over = await fetch(SITE + '/api/contribution/donate', { method: 'POST', headers: SH, body: JSON.stringify({ itemId: item.id, points: 9999 }) })
console.log('超投 9999 →', over.status, (await over.json()).error)

// 6) 兑换 30
const rd = await fetch(SITE + '/api/contribution/redeem', { method: 'POST', headers: SH, body: JSON.stringify({ itemId: reward.id }) }).then(r => r.json())
console.log('兑换 →', JSON.stringify(rd).slice(0, 140))
created.reds.push(rd.redemption?.id)

// 7) 余额
const summary = await fetch(SITE + '/api/contribution/summary', { headers: SH }).then(r => r.json())
console.log('余额: 累计', summary.balance.contributed, '已用', summary.balance.spent, '可用', summary.balance.available)

// 8) 老师审批
const a = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'PUB09', password: 'pjpcPUB09' }) })).json()
const approve = await fetch(SITE + '/api/contribution/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: JSON.stringify({ id: rd.redemption.id, status: 'approved' }) })
console.log('学生身份审批（应 403）→', approve.status)

// 9) 用管理员审批
const adm = await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'admin@pjpc.com', password: ADMIN_LOGIN_PASS }) }).catch(() => null)
let okApprove = null
if (adm && adm.ok) {
  const aj = await adm.json()
  okApprove = await fetch(SITE + '/api/contribution/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + aj.token }, body: JSON.stringify({ id: rd.redemption.id, status: 'approved' }) })
  console.log('管理员审批 →', okApprove.status, (await okApprove.json()).status)
}
const rew2 = await (await fetch(PB + '/api/collections/reward_items/records/' + reward.id, { headers: { Authorization: su } })).json()
console.log('库存应从 5 变 4 →', rew2.stock)

// 10) 清理
const pl = await (await fetch(PB + '/api/collections/point_logs/records?filter=' + encodeURIComponent(`student="${st.id}"`), { headers: { Authorization: su } })).json()
for (const x of pl.items || []) await fetch(PB + '/api/collections/point_logs/records/' + x.id, { method: 'DELETE', headers: { Authorization: su } })
const cl = await (await fetch(PB + '/api/collections/contribution_logs/records?filter=' + encodeURIComponent(`student="${st.id}"`), { headers: { Authorization: su } })).json()
for (const x of cl.items || []) await fetch(PB + '/api/collections/contribution_logs/records/' + x.id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of created.reds.filter(Boolean)) await fetch(PB + '/api/collections/reward_redemptions/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of created.rewards) await fetch(PB + '/api/collections/reward_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of created.items) await fetch(PB + '/api/collections/contribution_items/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of created.users) await fetch(PB + '/api/collections/users/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
for (const id of created.students) await fetch(PB + '/api/collections/students/records/' + id, { method: 'DELETE', headers: { Authorization: su } })
console.log('清理完成')
