import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'

/**
 * 学生端全部页面的回归（真账号 PUB09 登录，逐页走一遍）。
 * 页面已从旧的页内 tab 拆成导航栏独立页，所以这里直接按 URL 走。
 */
const PAGES = [
  ['/my', '我的首页'],
  ['/my/timetable', '我的课表'],
  ['/my/homework', '我的作业'],
  ['/my/points', '我的积分'],
  ['/my/contribution', '我的贡献'],
  ['/my/notices', '公告'],
  ['/my/leave', '请假'],
  ['/my/reports', '我的报告'],
  ['/my/achievements', '我的成就'],
  ['/my/suggestions', '我的建议'],
]

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1440, height: 1100 }, locale: 'zh-CN' })
const p = await c.newPage()
let bad = [], errs = []
p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('?')[0].replace(SITE, '')) })
p.on('pageerror', e => errs.push(String(e).slice(0, 90)))

await p.goto(SITE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2500)
await p.fill('#login-email', 'PUB09')
await p.fill('#login-password', 'pjpcPUB09')
await p.locator('button:has-text("安全登录")').first().click()
await p.waitForTimeout(9000)

let fail = 0
for (const [href, name] of PAGES) {
  bad = []; errs = []
  await p.goto(SITE + href, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(2200)
  const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  const stuck = txt.includes('加载中') && txt.length < 200
  const navOk = txt.includes('我的成就') && txt.includes('我的建议')
  const pass = !stuck && bad.length === 0 && errs.length === 0 && navOk && txt.length > 60
  if (!pass) fail++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(6)} ${href}  字數 ${txt.length}  失败请求 ${bad.length}  JS错 ${errs.length}${stuck ? '  卡加载' : ''}${navOk ? '' : '  导航缺项'}`)
  if (bad.length) console.log('    ', [...new Set(bad)].slice(0, 3))
  if (errs.length) console.log('    ', errs.slice(0, 2))
}

// 学生看不到管理端按钮（越权检查）
await p.goto(SITE + '/points/leaderboard', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(2000)
const lb = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
console.log(`学生开管理页 /points/leaderboard: ${lb.includes('积分排行榜') ? '能看到标题' : '被挡/空白'} (${lb.length} 字)`)

console.log(fail === 0 ? '\n结论: 学生端 10 页全部正常' : `\n结论: ${fail} 页有问题`)
await b.close()
