// 学生账号 UI 实测：真登录 → /my → 看导航、数据、越权页
import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const ACCOUNTS = [['PUG05', '黄奕妃'], ['PUT02', '张展铭']]
const ROUTES = ['/my', '/student-management', '/points', '/salary', '/settings', '/user-management']

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
let fail = 0
const ok = m => console.log('  OK   ' + m)
const bad = m => { fail++; console.log('  FAIL ' + m) }

for (const [acc, expectName] of ACCOUNTS) {
  console.log(`\n=== ${acc} (${expectName}) ===`)
  const c = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
  const p = await c.newPage()
  const errs = [], badReqs = []
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) badReqs.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
  p.on('pageerror', e => errs.push(String(e).slice(0, 80)))

  // 真登录
  await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(2500)
  await p.fill('#login-email', acc)
  await p.fill('#login-password', 'pjpc' + acc)
  await p.locator('button:has-text("安全登录")').first().click()
  await p.waitForTimeout(9000)

  const url = p.url().replace(SITE, '')
  if (url.startsWith('/my')) ok('登录后进 /my'); else bad('登录后落在 ' + url)

  const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  if (txt.includes(expectName)) ok('页面显示本人姓名'); else bad('页面没显示本人姓名')
  if (/学生管理|工资|薪资|用户与权限|系统设置/.test(txt)) bad('导航里出现员工菜单: ' + (txt.match(/学生管理|工资|薪资|用户与权限|系统设置/) || [''])[0])
  else ok('导航没有员工菜单')

  // 关键数据块
  const hasPoints = /总积分/.test(txt), hasAtt = /出勤|考勤/.test(txt), hasReport = /我的报告|报告/.test(txt)
  ok(`数据块: 积分=${hasPoints} 考勤=${hasAtt} 报告=${hasReport}`)

  // 越权页
  for (const r of ROUTES.slice(1)) {
    await p.goto(SITE + r, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await p.waitForTimeout(2500)
    const t2 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
    const blocked = /访问被拒绝|没有权限|请先登录|403/.test(t2) || !/学生列表|工资|薪资|用户与权限/.test(t2)
    if (blocked) ok(`越权页 ${r} 被挡`)
    else bad(`越权页 ${r} 竟然能看`)
  }

  if (errs.length) bad('页面 JS 报错: ' + errs.slice(0, 2).join(' | '))
  else ok('无 JS 报错')

  const uniq = [...new Set(badReqs)]
  const serious = uniq.filter(x => !x.includes('401 /api/pocketbase-proxy/api/files/'))
  if (serious.length) console.log('  (失败请求)', serious.slice(0, 5).join(', '))
  else ok('无异常接口请求')

  await c.close()
}

await b.close()
console.log(`\n结论: ${fail === 0 ? '全部通过' : fail + ' 项不合格'}`)
process.exit(fail === 0 ? 0 : 1)
