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

  // 规则 2、4 只看最近 30 天：历史里那批 2026-07 的 ±1 亿测试流水已经停止产生，
  // 天天报它只会让告警变成背景噪音（真出问题时反而没人看）。
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 19).replace('T', ' ')
  const recent = logs.filter((l) => String(l.created || '') >= since)

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
  const broken = recent.filter((l) => {
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
  // 最近 30 天的大额流水：不直接判失败（老师之间互相玩、当天下班前又抵回去的很多），
  // 真正的红线是「有学生分数被搞成天文数字」，见规则 4b。
  const huge = recent.filter((l) => Math.abs(Number(l.amount || 0)) > 1000)
  if (huge.length) {
    infos.push(`最近 30 天有 ${huge.length} 条超过 ±1000 的流水（最大 ${money(Math.max(...huge.map((h) => Math.abs(Number(h.amount)))))}）`)
    const worst = huge.slice().sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))[0]
    if (worst) infos.push(`   最大一条：${String(worst.created).slice(0, 10)} ${worst.amount} reason="${worst.reason || ''}"`)
  }

  // ── 4b. 分数本身不能是天文数字 ──
  const absurd = students.filter((s) => Math.abs(Number(s.points || 0)) > 10000)
  if (absurd.length) {
    fails.push(`【4b. 学生分数超过 ±10000】${absurd.length} 人（几乎一定是误输入或测试数据）`)
    for (const a of absurd.slice(0, 5)) fails.push(`   - ${a.name}：${money(a.points)}`)
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
  const oldHuge = logs.length - recent.length ? logs.filter((l) => Math.abs(Number(l.amount || 0)) > 1000 && String(l.created || '') < since).length : 0
  if (oldHuge) infos.push(`30 天前遗留的异常大额流水 ${oldHuge} 条（2026-07 测试数据，已不影响每日判定）`)
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
