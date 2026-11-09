import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 院长助理的通用管理通道：管理员账号在页面上能做的，这里都能做。
 *
 * 为什么要有：之前的 /api/agent/actions 是白名单五个动作，院长要办的事一超出这五个
 * （回填中心、改学生资料、补录、改单据…）就只能等人。助理本身就是 admin 账号，
 * 页面上的管理动作凭什么它做不了。
 *
 * 规则（只保留必要的护栏，不做业务白名单）：
 *   - 只认 x-pjpc-agent-token，不在网关里暴露给其他调用方
 *   - 每次调用都写 audit_logs（谁、什么动作、路径、请求体摘要、理由）
 *   - 改数据的请求必须带 reason（≥4 字），查数据不用
 *   - 禁止触碰超级管理员/认证类端点（_superusers、_otp、_mfa）——那不是「管理员」范畴
 */
const BLOCKED = ['_superusers', '_otp', '_mfa', 'auth-with-oauth2']

export async function POST(request: NextRequest) {
  const expected = process.env.PJPC_AGENT_TOKEN
  if (!expected) return NextResponse.json({ success: false, error: '服务端未配置助理令牌' }, { status: 500 })
  if (request.headers.get('x-pjpc-agent-token') !== expected) {
    return NextResponse.json({ success: false, error: '令牌不对' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: '请求格式不对（要 JSON）' }, { status: 400 })
  }

  const method = String(body.method || 'GET').toUpperCase()
  const path = String(body.path || '').trim()
  const reason = String(body.reason || '').trim()
  const payload = body.body ?? null
  const query = body.query ? String(body.query) : ''

  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    return NextResponse.json({ success: false, error: 'method 只能是 GET / POST / PATCH / DELETE' }, { status: 400 })
  }
  if (!path.startsWith('/api/collections/')) {
    return NextResponse.json({ success: false, error: 'path 必须以 /api/collections/ 开头' }, { status: 400 })
  }
  if (BLOCKED.some((b) => path.includes(b))) {
    return NextResponse.json({ success: false, error: '超级管理员与认证端点不在管理员范围内' }, { status: 403 })
  }
  if (method !== 'GET' && reason.length < 4) {
    return NextResponse.json({ success: false, error: '改数据必须写 reason（至少 4 个字）' }, { status: 400 })
  }

  const token = await getAdminToken()
  const url = `${PB_URL}${path}${query ? (path.includes('?') ? '&' : '?') + query : ''}`

  // 改数据前先取一次原值，写审计时能看出改了什么
  let before: any = null
  if (method !== 'GET' && method !== 'POST') {
    try {
      const r = await fetch(url, { headers: { Authorization: token }, cache: 'no-store' })
      if (r.ok) before = await r.json()
    } catch {
      /* 取不到就不记原值，不影响主流程 */
    }
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(payload ?? {}),
      cache: 'no-store',
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: `连不上 PocketBase：${e?.message || e}` }, { status: 502 })
  }

  const text = await res.text().catch(() => '')
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text.slice(0, 500) }
  }

  if (!res.ok) {
    return NextResponse.json(
      { success: false, status: res.status, error: data?.message || `PocketBase 返回 ${res.status}`, detail: data },
      { status: res.status === 404 ? 404 : 400 }
    )
  }

  if (method !== 'GET') {
    const summarize = (v: any) => {
      if (!v || typeof v !== 'object') return null
      const keep: any = {}
      for (const k of ['id', 'name', 'student_id', 'teacher_id', 'amount', 'totalAmount', 'status', 'points', 'contribution_points', 'centerId', 'center', 'month', 'year', 'deleted']) {
        if (v[k] !== undefined) keep[k] = v[k]
      }
      return Object.keys(keep).length ? keep : null
    }
    const desc = `${method} ${path}`
    const meta = { path, method, reason, before: summarize(before), after: summarize(data) }

    // 审计：和 /api/agent/actions 用同一张表，user_name 固定 principal-agent
    fetch(`${PB_URL}/api/collections/audit_logs/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'agent:admin_api', description: desc, metadata: meta, user_name: 'principal-agent' }),
    }).catch(() => {})

    // 汇报留痕：20:00 汇总读的就是这个文件
    ;(async () => {
      try {
        const { appendFile } = await import('fs/promises')
        const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 16)
        await appendFile(
          process.env.PJPC_AGENT_REPORT_FILE || '/home/sacrafix/.hermes/shared/reports/principal-agent.md',
          `- ${stamp} · 院长助理执行 \`${method} ${path}\` · ${JSON.stringify(summarize(data) || {})} · 理由：${reason}\n`,
          'utf8'
        )
      } catch {
        /* 写不进去不影响动作 */
      }
    })()
  }

  return NextResponse.json({ success: true, status: res.status, data })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    usage: 'POST /api/agent/admin  body: { method, path, body?, query?, reason? }',
    note: 'path 用 PB 原生路径，例如 /api/collections/students/records/<id>；改数据必须带 reason',
  })
}
