/**
 * i18n 覆盖检查 —— 页面把中文包进 t("...") 了，但字典里没有英文条目，
 * 切到英文就会原样显示中文（用户 2026-10-25 反馈「切英文还是华语」）。
 *
 * 本脚本扫全站 .tsx/.jsx 里 t("中文") 的字符串，跟 contexts/i18n-zh-en.ts 的键比，
 * 打印缺失清单；有缺失时退出码 1，方便挂进 npm run check:i18n。
 *
 * 用法: node scripts/i18n-verify.mjs [--quiet]
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const DICT = path.join(ROOT, 'contexts/i18n-zh-en.ts')
const quiet = process.argv.includes('--quiet')

const dictSrc = fs.readFileSync(DICT, 'utf8')
const keys = new Set()
for (const m of dictSrc.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)) {
  keys.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
}

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'out', 'dist'].includes(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(full)
  }
  return out
}

const hasCJK = (s) => /[\u4e00-\u9fff]/.test(s)
const missing = new Map()

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8')
  const found = new Set()
  for (const m of src.matchAll(/\bt\(\s*(["'])((?:\\.|(?!\1).)*)\1\s*\)/g)) {
    const key = m[2].replace(/\\"/g, '"').replace(/\\'/g, "'")
    if (!hasCJK(key)) continue
    if (!keys.has(key)) found.add(key)
  }
  if (found.size) missing.set(path.relative(ROOT, file), [...found])
}

const total = [...missing.values()].reduce((a, v) => a + v.length, 0)
if (!quiet || total > 0) {
  console.log(`i18n 缺失英文条目：${total} 条（涉及 ${missing.size} 个文件）`)
  for (const [file, list] of missing) {
    console.log(`\n${file}  (${list.length})`)
    for (const k of list) console.log(`  - ${k}`)
  }
}

if (total === 0) {
  console.log('全部 t("…") 都有英文条目')
  process.exit(0)
}
process.exit(1)
