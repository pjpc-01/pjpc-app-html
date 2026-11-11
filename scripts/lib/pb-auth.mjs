/**
 * PocketBase 直连工具（给 scripts/ 下的只读审计、对账脚本用）。
 *
 * 为什么单独一份：以前这些东西塞在 scripts/probes/_auth.mjs，
 * 而 probes 是临时脚本目录，删一次就把 finance-invariants、ux-audit、
 * account-audit 全弄挂了。放 lib 下面才是正经位置。
 *
 * 凭据一律走环境变量 / .env.local，不写死在代码里。
 * 只读用途：这些脚本不该改数据。
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())

function readEnvLocal() {
  const out = {}
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = fs.readFileSync(path.join(ROOT, f), 'utf8')
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        out[m[1]] = v
      }
    } catch { /* 没有就算了 */ }
  }
  return out
}

const ENV = { ...readEnvLocal(), ...process.env }

export const PB = ENV.PB_URL || ENV.POCKETBASE_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = ENV.PB_ADMIN_EMAIL || 'admin@pjpc.com'
// .env.local 里 _superusers 的口令放的是 PJPC_ADMIN_LOGIN_PASS（另外两个是别的用途）
const ADMIN_PASS = ENV.PB_ADMIN_PASSWORD || ENV.PJPC_ADMIN_LOGIN_PASS || ENV.POCKETBASE_ADMIN_PASSWORD || ''

let cached = ''

/** PB 超管 token（_superusers） */
export async function suToken() {
  if (cached) return cached
  if (!ADMIN_PASS) throw new Error('没有 PB 管理员口令（设 POCKETBASE_ADMIN_PASSWORD 在 .env.local）')
  const r = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS }),
  })
  if (!r.ok) throw new Error(`PB 超管登录失败: ${r.status}`)
  const d = await r.json()
  cached = d.token || ''
  return cached
}

/** 以某个账号身份进的 token（默认第一个 admin 账号），给 UI 审计用 */
export async function adminAuth() {
  const token = await suToken()
  const q = await fetch(`${PB}/api/collections/users/records?perPage=1&filter=${encodeURIComponent('role="admin"')}`, {
    headers: { Authorization: token },
  }).then(r => r.json())
  const u = (q.items || [])[0]
  if (!u) return {}
  const imp = await fetch(`${PB}/api/collections/users/impersonate/${u.id}`, {
    method: 'POST',
    headers: { Authorization: token },
  })
  if (!imp.ok) return {}
  const d = await imp.json()
  return { token: d.token, record: d.record, model: d.record }
}

/** 超管只读 GET，path 形如 /api/collections/students/records?... */
export async function pbGet(pathname) {
  const token = await suToken()
  const r = await fetch(PB + pathname, { headers: { Authorization: token } })
  if (!r.ok) throw new Error(`${r.status} ${pathname}`)
  return r.json()
}
