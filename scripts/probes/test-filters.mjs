// 筛选状态实测：设置筛选 → 离开 → 回来 → 是否还在
import { adminAuth, SITE } from './_auth.mjs'
import { chromium } from 'playwright'

const auth = await adminAuth()
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const c = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' })
const p = await c.newPage()

// 注入登录态（用 localStorage 里的 pocketbase_auth，前端自己读）
await p.goto(SITE + '/login', { waitUntil: 'domcontentloaded' })
await p.evaluate(([t, r]) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, record: r }))
}, [auth.token, auth.record])
await p.waitForTimeout(500)

const readSelects = () => p.evaluate(() =>
  [...document.querySelectorAll('button[role=combobox], select')].map(e => (e.textContent || e.value || '').trim()).filter(Boolean).slice(0, 8)
)

for (const [path, how] of [
  ['/homework', 'select'],
  ['/inventory', 'search'],
]) {
  await p.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(3500)
  console.log(`\n=== ${path} ===`)
  if (how === 'search') {
    const inp = p.locator('input[placeholder*="搜索"], input[type=text]').first()
    if (await inp.count()) { await inp.fill('zzz测试值'); await p.waitForTimeout(800) }
    const before = await inp.inputValue().catch(() => '')
    await p.goto(SITE + '/students', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200)
    await p.goto(SITE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
    const inp2 = p.locator('input[placeholder*="搜索"], input[type=text]').first()
    const after = await inp2.inputValue().catch(() => '')
    console.log(`  搜索框 前="${before}" 后="${after}" → ${after === 'zzz测试值' ? '保住了' : '丢了'}`)
  } else {
    const cb = p.locator('button[role=combobox]').first()
    if (await cb.count()) {
      await cb.click(); await p.waitForTimeout(700)
      const opts = p.locator('[role=option]')
      const n = await opts.count()
      if (n > 1) { await opts.nth(1).click(); await p.waitForTimeout(900) }
      const before = (await cb.textContent() || '').trim()
      await p.goto(SITE + '/students', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200)
      await p.goto(SITE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
      const after = ((await p.locator('button[role=combobox]').first().textContent()) || '').trim()
      console.log(`  第一个下拉 前="${before}" 后="${after}" → ${after === before ? '保住了' : '丢了'}`)
    } else console.log('  没找到下拉')
  }
}

// 薪资页：打开弹窗 → 关闭 → 筛选控件还在不在
console.log('\n=== /finance/payroll ===')
await p.goto(SITE + '/finance/payroll', { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(4500)
const controlsBefore = await readSelects()
console.log('  关闭前控件:', controlsBefore.slice(0, 4))
const triggers = p.locator('button:has-text("生成"), button:has-text("新增"), button:has-text("添加")')
const nt = await triggers.count()
if (nt) {
  await triggers.first().click(); await p.waitForTimeout(2000)
  await p.keyboard.press('Escape'); await p.waitForTimeout(1500)
  const controlsAfter = await readSelects()
  console.log('  关闭后控件:', controlsAfter.slice(0, 4))
  console.log(`  → ${controlsAfter.length >= controlsBefore.length ? '还在' : '消失了'}`)
} else console.log('  没找到弹窗按钮, 跳过')

await b.close()
