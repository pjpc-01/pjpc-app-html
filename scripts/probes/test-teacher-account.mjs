// 教师账号实测：有绑定 vs 没绑定的工作台差异
import { suToken, SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }

async function mkUser(username, extra = {}) {
  const body = { email: username + '@pjpc.local', username, password: 'Test123456', passwordConfirm: 'Test123456', name: username, role: 'teacher', emailVisibility: false, ...extra }
  const r = await fetch(`${PB}/api/collections/users/records`, { method: 'POST', headers: H, body: JSON.stringify(body) })
  const d = await r.json()
  return { status: r.status, id: d.id, username }
}

async function delUser(id) { await fetch(`${PB}/api/collections/users/records/${id}`, { method: 'DELETE', headers: H }) }

// 取一个真教师
const teachers = (await (await fetch(`${PB}/api/collections/teachers/records?perPage=1&filter=${encodeURIComponent('status="active"')}`, { headers: H })).json()).items || []
const realTeacher = teachers[0]

const noBind = await mkUser('zz_t_nobind')
const withBind = await mkUser('zz_t_bind', { teacher_id: realTeacher?.id || '' })
console.log('临时账号:', noBind.status, withBind.status, '| 真教师:', realTeacher?.name)

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

async function probe(acc, label) {
  const c = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
  const p = await c.newPage()
  const bad = [], errs = []
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
  p.on('pageerror', e => errs.push(String(e).slice(0, 70)))

  await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(2500)
  await p.fill('#login-email', acc)
  await p.fill('#login-password', 'Test123456')
  await p.locator('button:has-text("安全登录")').first().click()
  await p.waitForTimeout(9000)

  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  console.log(`\n=== ${label} (${acc}) ===`)
  console.log('  URL:', p.url().replace(SITE, ''))
  console.log('  正文长度:', t.length)
  console.log('  片段:', JSON.stringify(t.slice(0, 260)))
  console.log('  导航可见:', /我的工作台|教务|学生列表|作业管理/.test(t) ? '有' : '无')
  console.log('  报错文案:', (t.match(/没有|未绑定|错误|失败|请联系|找不到/g) || []).slice(0, 3))
  console.log('  失败请求:', [...new Set(bad)].slice(0, 5))
  console.log('  JS 错误:', errs.slice(0, 2))
  await c.close()
}

await probe('zz_t_nobind', '没绑定教师档案')
await probe('zz_t_bind', '已绑定教师档案')

// 顺带看侧边栏配置里教师能看到哪些链接
await b.close()
await delUser(noBind.id)
await delUser(withBind.id)
console.log('\n临时账号已删除')
