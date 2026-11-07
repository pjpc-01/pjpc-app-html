#!/usr/bin/env node
/**
 * 学生积分每日体检（普通积分 students.points）。
 *
 * 为什么要有：财务那边有 12 条不变量每天跑，积分一条都没有。
 * 之前 /api/points 加分只改分数不写流水，导致 147 人里 113 人「总分 ≠ 流水合计」，
 * 谁都看不出来。这个脚本就是那条底线。
 *
 * 退出码 0 = 通过（cron watchdog 模式：没输出就不推送）
 * 退出码 1 = 有问题
 */
const PB = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@pjpc.com'
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '1234567890'

const money = (n) => Math.round((Number(n) || 0) * 100) / 100

async function main() {
  const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  })
  if (!auth.ok) {
    console.log('❌ 体检失败：PocketBase 认证不通过')
    process.exit(1)
  }
  const { token } = await auth.json()
  const H = { Authorization: token }

  async function all(collection) {
    const out = []
    for (let page = 1; page <= 60; page++) {
      const r = await fetch(
        `${PB}/api/collections/${collection}/records?perPage=500&page=${page}`,
        { headers: H }
      )
      if (!r.ok) break
      const d = await r.json()
      out.push(...(d.items || []))
      if (page >= (d.totalPages || 1)) break
    }
    return out
  }

  const [students, logs] = await Promise.all([all('students'), all('point_logs')])

  const fails = []
  const infos = []

  // ── 1. 每个学生：总分必须等于流水合计 ──
  const sumByStudent = new Map()
  for (const l of logs) {
    const sid = String(l.student || '')
    if (!sid) continue
    sumByStudent.set(sid, money((sumByStudent.get(sid) || 0) + Number(l.amount || 0)))
  }
  const drift = []
  for (const s of students) {
    const sum = sumByStudent.get(s.id) || 0
    const diff = money(Number(s.points || 0) - sum)
    if (Math.abs(diff) > 0.01) drift.push({ name: s.name, points: Number(s.points || 0), sum, diff })
  }
  drift.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  if (drift.length) {
    fails.push(`【1. 总分 ≠ 流水合计】${drift.length} 人`)
    for (const d of drift.slice(0, 12)) {
      fails.push(`   - ${d.name}：总分 ${money(d.points)}，流水 ${money(d.sum)}（差 ${money(d.diff)}）`)
    }
    if (drift.length > 12) fails.push(`   …… 另有 ${drift.length - 12} 人`)
  }

  // ── 2. 单条流水自身必须自洽：amount = after - before ──
  const broken = logs.filter((l) => {
    if (l.points_before === null || l.points_before === undefined) return false
    if (l.points_after === null || l.points_after === undefined) return false
    return Math.abs(Number(l.amount || 0) - (Number(l.points_after) - Number(l.points_before))) > 0.01
  })
  if (broken.length) {
    fails.push(`【2. 流水金额与前后值不符】${broken.length} 条`)
    for (const b of broken.slice(0, 8)) {
      fails.push(`   - ${b.id}：amount ${b.amount}，before ${b.points_before} → after ${b.points_after}`)
    }
  }

  // ── 3. 流水指向不存在的学生 ──
  const stuIds = new Set(students.map((s) => s.id))
  const orphan = logs.filter((l) => l.student && !stuIds.has(String(l.student)))
  if (orphan.length) {
    fails.push(`【3. 流水指向不存在的学生】${orphan.length} 条`)
    for (const o of orphan.slice(0, 5)) fails.push(`   - ${o.id} student=${o.student} amount=${o.amount}`)
  }

  // ── 4. 单笔异常大额（|amount| > 1000 基本是误输入）──
  const huge = logs.filter((l) => Math.abs(Number(l.amount || 0)) > 1000)
  if (huge.length) {
    fails.push(`【4. 单笔超过 ±1000 的流水】${huge.length} 条（历史上的千万级测试数据也算在这）`)
    for (const h of huge.slice(0, 5)) {
      fails.push(`   - ${String(h.created).slice(0, 10)} ${h.amount} reason="${h.reason || ''}"`)
    }
  }

  // ── 5. 废弃 points 集合今天还有没有人写 ──
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
  const dead = await fetch(
    `${PB}/api/collections/points/records?perPage=1&sort=-created&filter=${encodeURIComponent(`created >= "${today} 00:00:00.000Z"`)}`,
    { headers: H }
  )
    .then((r) => (r.ok ? r.json() : { totalItems: 0 }))
    .catch(() => ({ totalItems: 0 }))
  if ((dead.totalItems || 0) > 0) {
    fails.push(`【5. 废弃的 points 集合今天又写了 ${dead.totalItems} 行】应该 0 行 —— 说明还有代码在写老表`)
  }

  // ── 信息项（不判失败）──
  const negative = students.filter((s) => Number(s.points || 0) < 0)
  if (negative.length) infos.push(`负分学生 ${negative.length} 人（最低 ${money(Math.min(...negative.map((s) => Number(s.points))))}）`)
  const emptyReason = logs.filter((l) => !String(l.reason || '').trim())
  if (emptyReason.length) infos.push(`没有写原因的流水 ${emptyReason.length} 条`)
  const deadTotal = await fetch(`${PB}/api/collections/points/records?perPage=1`, { headers: H })
    .then((r) => (r.ok ? r.json() : { totalItems: 0 }))
    .catch(() => ({ totalItems: 0 }))
  infos.push(`废弃 points 集合历史遗留 ${deadTotal.totalItems || 0} 行（已停止写入，暂未删除）`)

  const totalPoints = money(students.reduce((a, s) => a + Number(s.points || 0), 0))
  console.log('=== 学生积分体检 ===')
  console.log(`学生 ${students.length} 人 · 流水 ${logs.length} 条 · 总分合计 ${totalPoints}`)
  if (infos.length) {
    console.log('')
    console.log('【参考】')
    for (const i of infos) console.log(`   · ${i}`)
  }

  if (fails.length) {
    console.log('')
    for (const f of fails) console.log(f)
    process.exit(1)
  }

  console.log('')
  console.log('全部通过，没有发现问题')
}

main().catch((e) => {
  console.log('体检脚本自身出错：', e?.message || e)
  process.exit(1)
})
