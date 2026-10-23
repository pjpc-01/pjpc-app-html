import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }

// 找一份现成报告
const rep = (await (await fetch(PB + '/api/collections/student_reports/records?perPage=1&sort=-created', { headers: { Authorization: su } })).json()).items[0]
const stu = await (await fetch(PB + '/api/collections/students/records/' + rep.studentId, { headers: { Authorization: su } })).json()
console.log('报告:', rep.id, '| 学生:', stu.name, stu.grade, '| 年份:', rep.year)

// 管理员登录拿 token 调 API
const adm = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }) })).json()
const AH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adm.token }

const rows = []
for (const [subj, m8, m9, m10] of [['华文', 78, 82, 88], ['国文', 70, 75, 80], ['英文', 85, 88, 92]]) {
  rows.push({ studentId: rep.studentId, student_name: stu.name, subject: subj, score: m8, month: 8 })
  rows.push({ studentId: rep.studentId, student_name: stu.name, subject: subj, score: m9, month: 9 })
  rows.push({ studentId: rep.studentId, student_name: stu.name, subject: subj, score: m10, month: 10 })
}
for (const m of [8, 9, 10]) {
  const r = await fetch(SITE + '/api/monthly-tests', {
    method: 'POST', headers: AH,
    body: JSON.stringify({ year: rep.year, month: m, center: stu.center || '', rows: rows.filter(x => x.month === m).map(x => ({ ...x, score: x.score })) }),
  })
  const d = await r.json()
  console.log(`${m} 月保存:`, r.status, JSON.stringify(d))
}

const back = await fetch(SITE + '/api/monthly-tests?studentId=' + rep.studentId + '&year=' + rep.year, { headers: AH }).then(r => r.json())
console.log('读回条数:', (back.rows || []).length)

// 打开报告页看有没有月测区块
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1400, height: 1200 }, locale: 'zh-CN' })
const p = await c.newPage()
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', 'admin@pjpc.com')
await p.fill('#login-password', '1234567890')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(8000)
await p.goto(SITE + '/student-report/' + rep.id, { waitUntil: 'networkidle' })
await p.waitForTimeout(5000)
const iframeText = await p.evaluate(() => {
  const f = document.querySelector('iframe')
  try { return f?.contentDocument?.body?.innerText?.replace(/\s+/g, ' ') || '(读不到)' } catch (e) { return 'ERR ' + e }
})
const i = iframeText.indexOf('安亲班月测')
console.log('报告里月测区块:', i >= 0 ? '有' : '没有')
if (i >= 0) console.log('片段:', iframeText.slice(i, i + 200))
await b.close()

// 清理测试月测数据
const del = await (await fetch(PB + '/api/collections/monthly_test_scores/records?perPage=200&filter=' + encodeURIComponent(`studentId="${rep.studentId}"`), { headers: { Authorization: su } })).json()
for (const x of del.items || []) await fetch(PB + '/api/collections/monthly_test_scores/records/' + x.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理月测测试数据', (del.items || []).length, '条')
