/**
 * 全站回归（API 层）—— 推全分支前跑一遍。
 *
 * 覆盖：匿名拦截、学生越权、月测、成就、建议箱、贡献/兑换/按中心排行、学生首页。
 * 所有临时数据自建自删，不动真实数据。
 */
import { suToken, SITE } from './_auth.mjs'

const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const startedAt = new Date().toISOString().replace('T', ' ')
const out = []
const ok = (name, pass, extra = '') => {
  out.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  →  ' + extra : ''}`)
}

// ── 临时学生 + 账号 ─────────────────────────────
const mk = async () => {
  const s = await (await fetch(PB + '/api/collections/students/records', {
    method: 'POST', headers: H,
    body: JSON.stringify({ name: 'ZZ 回归测试生', student_id: 'ZZ R99', grade: 'Form 1', center: 'PU1', status: 'active', points: 300, points_enabled: true }),
  })).json()
  const uname = 'zzr99'
  const u = await (await fetch(PB + '/api/collections/users/records', {
    method: 'POST', headers: H,
    body: JSON.stringify({ username: uname, email: uname + '@student.pjpc.local', password: 'pjpcZZR99', passwordConfirm: 'pjpcZZR99', name: 'ZZ 回归测试生', role: 'student', student_id: s.id, center: 'PU1' }),
  })).json()
  const lg = await (await fetch(PB + '/api/collections/users/auth-with-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: uname, password: 'pjpcZZR99' }),
  })).json()
  return { s, u, token: lg.token, uname }
}
const t1 = await mk()
const SH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t1.token }

const adm = await (await fetch(PB + '/api/collections/users/auth-with-password', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }),
})).json()
const AH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adm.token }

const get = async (path, headers = AH) => {
  const r = await fetch(SITE + path, { headers })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const send = async (path, method, body, headers = AH) => {
  const r = await fetch(SITE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

try {
  // ── 1) 匿名一律拦 ────────────────────────────
  for (const p of ['/api/students', '/api/points', '/api/teacher-salary', '/api/achievements',
    '/api/suggestions', '/api/monthly-tests?grade=Form%201', '/api/contribution/summary',
    '/api/contribution/ranking', '/api/student/home']) {
    const r = await get(p, {})
    ok(`匿名 ${p.split('?')[0]} = 401`, r.status === 401, `实际 ${r.status}`)
  }
  const anonSug = await send('/api/suggestions', 'POST', { target: 'app', content: '匿名不该进来' }, { 'Content-Type': 'application/json' })
  ok('匿名提建议 = 401', anonSug.status === 401, `实际 ${anonSug.status}`)

  // ── 2) 学生越权 ──────────────────────────────
  const stuStaff = await get('/api/students', SH)
  ok('学生读名册 = 403', stuStaff.status === 403, `实际 ${stuStaff.status}`)
  const stuSal = await get('/api/teacher-salary', SH)
  ok('学生读薪资 = 403', stuSal.status === 403, `实际 ${stuSal.status}`)

  // ── 3) 安亲班月测 ────────────────────────────
  const mtSave = await send('/api/monthly-tests', 'POST', {
    year: 2026, month: 10, center: 'PU1',
    rows: [
      { studentId: t1.s.id, student_name: 'ZZ 回归测试生', subject: '华文', score: 90 },
      { studentId: t1.s.id, student_name: 'ZZ 回归测试生', subject: '英文', score: 70 },
    ],
  })
  ok('月测保存 = 200', mtSave.status === 200 && mtSave.body.saved === 2, JSON.stringify(mtSave.body))
  const mtRead = await get(`/api/monthly-tests?studentId=${t1.s.id}&year=2026`, AH)
  ok('月测读回 2 条', (mtRead.body.rows || []).length === 2, `${(mtRead.body.rows || []).length} 条`)
  const mtGrid = await get('/api/monthly-tests?year=2026&month=10&grade=Form%201&center=PU1', AH)
  ok('月测网格含科目+学生', (mtGrid.body.subjects || []).length >= 5 && (mtGrid.body.students || []).length > 0,
    `${(mtGrid.body.subjects || []).length} 科 / ${(mtGrid.body.students || []).length} 人`)
  const mtStudent = await get(`/api/monthly-tests?studentId=${t1.u.id}&year=2026`, SH)
  ok('学生只能读自己的月测', (mtStudent.body.rows || []).every((x) => x.studentId === t1.s.id), `${(mtStudent.body.rows || []).length} 条`)
  const mtOverwrite = await send('/api/monthly-tests', 'POST', {
    year: 2026, month: 10, center: 'PU1',
    rows: [{ studentId: t1.s.id, student_name: 'ZZ 回归测试生', subject: '华文', score: 55 }],
  })
  const mtAfter = await get(`/api/monthly-tests?studentId=${t1.s.id}&year=2026`, AH)
  const hua = (mtAfter.body.rows || []).find((x) => x.subject === '华文')
  ok('月测重存覆盖不重复', mtOverwrite.body.saved === 1 && (mtAfter.body.rows || []).length === 2 && Number(hua?.score) === 55,
    `华文=${hua?.score}, 共${(mtAfter.body.rows || []).length}条`)

  // ── 4) 成就 ──────────────────────────────────
  const ach0 = await get('/api/achievements', SH)
  ok('成就总数 7 个', (ach0.body.achievements || []).length === 7, `${(ach0.body.achievements || []).length} 个`)
  const lockedSet = await send('/api/achievements', 'PATCH', { code: 'contributor_500' }, SH)
  ok('设未解锁成就 = 403', lockedSet.status === 403, `实际 ${lockedSet.status}`)
  const earnByPoints = await fetch(PB + '/api/collections/students/records/' + t1.s.id, {
    method: 'PATCH', headers: H, body: JSON.stringify({ points: 800 }),
  })
  const ach1 = await get('/api/achievements', SH)
  const got = (ach1.body.achievements || []).filter((a) => a.earned).map((a) => a.code)
  ok('800 分解锁积分富豪', got.includes('points_500'), got.join(','))
  const setTitle = await send('/api/achievements', 'PATCH', { code: 'points_500' }, SH)
  ok('设称号 = 200', setTitle.status === 200 && setTitle.body.title === '积分富豪', JSON.stringify(setTitle.body))
  const home1 = await get('/api/student/home', SH)
  ok('首页有 fresh 成就提示', (home1.body.achievements?.fresh || []).length > 0, JSON.stringify(home1.body.achievements))
  const seen = await send('/api/achievements', 'PATCH', { action: 'mark_seen' }, SH)
  const home2 = await get('/api/student/home', SH)
  ok('标记已读后不再弹', seen.body.success && (home2.body.achievements?.fresh || []).length === 0)

  // ── 5) 建议箱 ────────────────────────────────
  const sug = await send('/api/suggestions', 'POST', { target: 'center', content: '希望多一点户外活动' }, SH)
  ok('学生提建议 = 200', sug.status === 200)
  const mine = await get('/api/suggestions?mine=1', SH)
  ok('学生只看自己的建议', (mine.body.items || []).length === 1 && (mine.body.items || [])[0].submitter_name === 'ZZ 回归测试生',
    `${(mine.body.items || []).length} 条`)
  const stuPatch = await send('/api/suggestions', 'PATCH', { id: mine.body.items[0].id, status: 'done' }, SH)
  ok('学生审批建议 = 403', stuPatch.status === 403, `实际 ${stuPatch.status}`)
  const all = await get('/api/suggestions', AH)
  ok('管理员看到建议', (all.body.items || []).length >= 1, `待处理 ${all.body.counts?.new}`)
  const reply = await send('/api/suggestions', 'PATCH', { id: mine.body.items[0].id, status: 'done', reply: '好，下月安排' }, AH)
  const back = await get('/api/suggestions?mine=1', SH)
  ok('学生看到回复', reply.status === 200 && (back.body.items || [])[0].reply === '好，下月安排')

  // ── 6) 贡献 / 兑换 / 按中心排行 ───────────────
  const item = await (await fetch(PB + '/api/collections/contribution_items/records', {
    method: 'POST', headers: H,
    body: JSON.stringify({ name: 'ZZ 回归测试物品', target_points: 100, current_points: 0, center: 'PU1', status: 'active' }),
  })).json()
  const donate = await send('/api/contribution/donate', 'POST', { itemId: item.id, points: 100 }, SH)
  const stuAfter = await (await fetch(PB + '/api/collections/students/records/' + t1.s.id, { headers: { Authorization: su } })).json()
  const itemAfter = await (await fetch(PB + '/api/collections/contribution_items/records/' + item.id, { headers: { Authorization: su } })).json()
  ok('投 100 分 → 学生扣分、物品加分', donate.status === 200 && Number(stuAfter.points) === 700 && Number(itemAfter.current_points) === 100,
    `学生 ${stuAfter.points} / 物品 ${itemAfter.current_points}`)
  // 新规则（2026-10-28）：物品筹够那一刻才发贡献积分，这里目标=100 所以当场发放
  ok('物品筹够 → 贡献积分当场发放', itemAfter.status === 'achieved' && Number(stuAfter.contribution_points || 0) === 100,
    `状态 ${itemAfter.status} / 贡献积分 ${stuAfter.contribution_points}`)
  const over = await send('/api/contribution/donate', 'POST', { itemId: item.id, points: 99999 }, SH)
  ok('超投被拦', over.status >= 400, `实际 ${over.status}`)

  const reward = await (await fetch(PB + '/api/collections/reward_items/records', {
    method: 'POST', headers: H,
    body: JSON.stringify({ name: 'ZZ 测试奖品', cost_points: 30, stock: 5, status: 'active' }),
  })).json()
  const redeem = await send('/api/contribution/redeem', 'POST', { itemId: reward.id }, SH)
  ok('兑换申请 = 200', redeem.status === 200)
  // 审批列表走 summary 的 pending_redemptions（/requests 只有 PATCH，没有 GET）
  const reds = await get('/api/contribution/summary', AH)
  const myRed = (reds.body.pending_redemptions || []).find((x) => x.student === t1.s.id)
  const approve = await send('/api/contribution/requests', 'PATCH', { id: myRed?.id, status: 'approved' }, AH)
  const rewardAfter = await (await fetch(PB + '/api/collections/reward_items/records/' + reward.id, { headers: { Authorization: su } })).json()
  ok('批准兑换扣库存 5→4', approve.status === 200 && Number(rewardAfter.stock) === 4, `库存 ${rewardAfter.stock}`)
  const stuApprove = await send('/api/contribution/requests', 'PATCH', { id: myRed?.id, status: 'approved' }, SH)
  ok('学生自己批准 = 403', stuApprove.status === 403, `实际 ${stuApprove.status}`)

  const rank = await get('/api/contribution/ranking', AH)
  const g = (rank.body.groups || []).find((x) => x.center === 'PU1')
  const pct = (g?.list || []).reduce((a, x) => a + Number(x.percent || 0), 0)
  ok('按中心排行：PU1 有数据且占比合计≈100', !!g && (g.list || []).length > 0 && Math.abs(pct - 100) < 1.5,
    `PU1 ${g?.total_points} 分 / ${(g?.list || []).length} 人 / 合计 ${pct.toFixed(1)}%`)
  const summary = await get('/api/contribution/summary', SH)
  ok('学生贡献总览带本中心占比', summary.body.success && summary.body.community?.my_center_percent !== undefined,
    `本中心 ${summary.body.community?.my_center_percent}% / 全校 ${summary.body.community?.my_percent}%`)

  // ── 7) 学生首页 ──────────────────────────────
  const home = await get('/api/student/home', SH)
  ok('学生首页 200 且是自己的资料', home.status === 200 && home.body.student?.id === t1.s.id, `${home.body.student?.name}`)
  ok('学生首页含课表/积分/考勤', !!home.body.today && !!home.body.points && !!home.body.attendance,
    `本周 ${(home.body.week_schedule || []).length} 节`)

  // ── 8) 成绩单带月测区块 ──────────────────────
  const rep = await (await fetch(PB + '/api/collections/student_reports/records?perPage=1&sort=-created', { headers: { Authorization: su } })).json()
  const reportId = rep.items?.[0]?.id
  const reportStu = rep.items?.[0]?.studentId
  if (reportStu) {
    await send('/api/monthly-tests', 'POST', {
      year: Number(rep.items[0].year || 2026), month: 9, center: '',
      rows: [{ studentId: reportStu, student_name: rep.items[0].studentName || '', subject: '华文', score: 88 }],
    })
    const rowsBack = await get(`/api/monthly-tests?studentId=${reportStu}&year=${Number(rep.items[0].year || 2026)}`, AH)
    ok('成绩单学生月测可取', (rowsBack.body.rows || []).length >= 1, `${(rowsBack.body.rows || []).length} 条 | 报告 ${reportId}`)
    // 清掉刚塞进去的那条
    for (const r of rowsBack.body.rows || []) {
      await fetch(PB + '/api/collections/monthly_test_scores/records/' + r.id, { method: 'DELETE', headers: { Authorization: su } })
    }
  }
} finally {
  // ── 清理 ────────────────────────────────────
  const cleanup = async (col, filter) => {
    const d = await (await fetch(PB + `/api/collections/${col}/records?perPage=200&filter=${encodeURIComponent(filter)}`, { headers: { Authorization: su } })).json()
    for (const x of d.items || []) await fetch(PB + `/api/collections/${col}/records/${x.id}`, { method: 'DELETE', headers: { Authorization: su } })
  }
  await cleanup('monthly_test_scores', `studentId="${t1.s.id}"`)
  await cleanup('suggestions', `user="${t1.u.id}"`)
  await cleanup('contribution_logs', `student="${t1.s.id}"`)
  // 之前漏了这个集合，测试跑的投入/兑换会留在真实贡献积分流水里（2026-10-28 清出 20 条）
  await cleanup('contribution_point_logs', `student="${t1.s.id}"`)
  await cleanup('contribution_point_logs', `student_name~"ZZ"`)
  // 通知也要清（2026-10-28 加的站内通知，测试会往老师/管理员铃铛里塞消息）
  // 通知：这段时间内产生的一律删（测试会往老师/管理员铃铛塞消息）
  await cleanup('notifications', `created >= "${startedAt}"`)
  await cleanup('contribution_logs', `student_name~"ZZ"`)
  await cleanup('reward_redemptions', `student="${t1.s.id}"`)
  await cleanup('point_logs', `student="${t1.s.id}"`)
  await cleanup('contribution_items', 'name="ZZ 回归测试物品"')
  await cleanup('reward_items', 'name="ZZ 测试奖品"')
  await fetch(PB + '/api/collections/users/records/' + t1.u.id, { method: 'DELETE', headers: { Authorization: su } })
  await fetch(PB + '/api/collections/students/records/' + t1.s.id, { method: 'DELETE', headers: { Authorization: su } })
  console.log('已清理临时数据')
}

const fail = out.filter((x) => !x.pass)
console.log(`\n合计 ${out.length} 项 | 通过 ${out.length - fail.length} | 失败 ${fail.length}`)
if (fail.length) { console.log('失败项:', fail.map((x) => x.name).join(' / ')); process.exit(1) }
