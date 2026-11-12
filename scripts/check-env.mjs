#!/usr/bin/env node
/**
 * 启动前/env 自检。
 *
 * 为什么要有：换一台服务器部署时，最费时间的不是装依赖，是
 * 「起来了一片白屏，也不知道少配了什么」。这个脚本一次把缺的项全列出来。
 *
 * 用法
 *   node scripts/check-env.mjs                 # 检查 .env.local
 *   node scripts/check-env.mjs .env.production # 检查指定文件
 *   CHECK_ENV_FILE=/tmp/x node scripts/check-env.mjs  # 也可以这样指定
 *
 * 退出码：0 全部就绪；1 有缺项；2 文件不存在
 */
import fs from 'fs'
import path from 'path'

const REQUIRED = [
  ['POCKETBASE_URL', 'PocketBase 地址，例 http://127.0.0.1:8090'],
  ['POCKETBASE_ADMIN_EMAIL', 'PocketBase 超级管理员邮箱'],
  ['POCKETBASE_ADMIN_PASSWORD', 'PocketBase 超级管理员口令'],
  ['PROXY_INTERNAL_KEY', '内部代理共享密钥（openssl rand -hex 32）'],
  ['PJPC_AGENT_TOKEN', '代理/脚本令牌（openssl rand -hex 32）'],
]

// 只做提示，缺了也能跑
const RECOMMENDED = [
  ['SITE_URL', '对外地址，发票/收据里的链接会用到'],
]

function parseEnv(file) {
  const out = {}
  const txt = fs.readFileSync(file, 'utf8')
  for (const line of txt.split('\n')) {
    const s = line.trim()
    if (!s || s.startsWith('#')) continue
    const m = s.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

const target = process.argv[2] || process.env.CHECK_ENV_FILE || '.env.local'
const file = path.resolve(process.cwd(), target)

if (!fs.existsSync(file)) {
  console.error(`\n[env] 找不到 ${target}`)
  console.error(`[env] 先复制模板：cp .env.example ${target}\n`)
  process.exit(2)
}

const env = { ...parseEnv(file), ...process.env }

const missing = REQUIRED.filter(([k]) => !env[k] || !String(env[k]).trim())
const emptyish = REQUIRED.filter(([k]) => env[k] && /^(changeme|xxx|todo|请填|your-)/i.test(String(env[k])))
const warn = RECOMMENDED.filter(([k]) => !env[k] || !String(env[k]).trim())

if (missing.length === 0 && emptyish.length === 0) {
  console.log(`[env] OK  ${target}  ${REQUIRED.length} 项必需变量齐全`)
  if (warn.length) for (const [k, why] of warn) console.log(`[env] 提示：${k} 没填 —— ${why}`)
  process.exit(0)
}

console.error(`\n[env] ${target} 有 ${missing.length + emptyish.length} 项不能用：\n`)
for (const [k, why] of missing) console.error(`  · ${k}  未填   （${why}）`)
for (const [k] of emptyish) console.error(`  · ${k}  还是示例值，请换成真实值`)
console.error('\n[env] 改完再跑一次：node scripts/check-env.mjs\n')
process.exit(1)
