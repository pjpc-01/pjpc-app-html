import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }

// 临时学生 + 账号
const s = await (await fetch(PB + '/api/collections/students/records', { method: 'POST', headers: H, body: JSON.stringify({ name: 'ZZ 建议测试生', student_id: 'ZZ S01', grade: 'Form 1', center: 'PU1', status: 'active', points: 50 }) })).json()
const uname = 'zzs01'
const u = await (await fetch(PB + '/api/collections/users/records', { method: 'POST', headers: H, body: JSON.stringify({ username: uname, email: uname + '@student.pjpc.local', password: 'pjpcZZS01', passwordConfirm: 'pjpcZZS01', name: 'ZZ 建议测试生', role: 'student', student_id: s.id, center: 'PU1' }) })).json()
const slug = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: uname, password: 'pjpcZZS01' }) })).json()
const SH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + slug.token }

// 1) 学生提两条建议
for (const [target, content] of [['center', '希望中心多办户外活动'], ['app', '积分页面希望可以看历史记录']]) {
  const r = await fetch(SITE + '/api/suggestions', { method: 'POST', headers: SH, body: JSON.stringify({ target, content }) })
  console.log(`学生提交(${target}):`, r.status, (await r.json()).success ? 'ok' : 'fail')
}
// 2) 学生只看自己的
const mine = await fetch(SITE + '/api/suggestions?mine=1', { headers: SH }).then(r => r.json())
console.log('学生自己看到:', mine.items.length, '条 | 名字:', mine.items[0]?.submitter_name, '| 中心:', mine.items[0]?.center)

// 3) 学生不能审批
const forbid = await fetch(SITE + '/api/suggestions', { method: 'PATCH', headers: SH, body: JSON.stringify({ id: mine.items[0].id, status: 'done' }) })
console.log('学生自己审批:', forbid.status, '(应 403)')

// 4) 老师/管理员看全部 + 回复
const adm = await (await fetch(PB + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }) })).json()
const AH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adm.token }
const all = await fetch(SITE + '/api/suggestions', { headers: AH }).then(r => r.json())
console.log('管理员看到:', all.items.length, '条 | 待处理:', all.counts.new)
const pid = mine.items.find(x => x.target === 'center').id
const pr = await fetch(SITE + '/api/suggestions', { method: 'PATCH', headers: AH, body: JSON.stringify({ id: pid, status: 'done', reply: '好，下个月安排一次户外活动' }) })
console.log('管理员回复:', pr.status)

const after = await fetch(SITE + '/api/suggestions?mine=1', { headers: SH }).then(r => r.json())
const got = after.items.find(x => x.id === pid)
console.log('学生看到回复:', got?.status, '|', got?.reply)

// 5) 匿名不能提
const anon = await fetch(SITE + '/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'app', content: '匿名应该进不来' }) })
console.log('匿名提交:', anon.status, '(应 401)')

// 6) 学生 UI
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1280, height: 1100 }, locale: 'zh-CN' })
const p = await c.newPage()
const bad = [], errs = []
p.on('pageerror', e => errs.push(String(e).slice(0, 80)))
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(1600)
await p.fill('#login-email', uname)
await p.fill('#login-password', 'pjpcZZS01')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(7000)
await p.goto(SITE + '/my/suggestions', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
console.log('学生页有表单:', txt.includes('写建议'), '| 看到回复:', txt.includes('户外活动'), '| 导航有我的建议:', txt.includes('我的建议'))
await b.close()

// 清理
const rows = await (await fetch(PB + '/api/collections/suggestions/records?perPage=200&filter=' + encodeURIComponent(`user="${u.id}"`), { headers: { Authorization: su } })).json()
for (const x of rows.items || []) await fetch(PB + '/api/collections/suggestions/records/' + x.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
await fetch(PB + '/api/collections/students/records/' + s.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理 | 失败请求:', [...new Set(bad)].slice(0, 3), '| JS 错:', errs.slice(0, 2))
