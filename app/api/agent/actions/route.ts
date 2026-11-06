import { NextRequest, NextResponse } from 'next/server'
import { ACTION_CATALOG, openItems, runAgentAction } from '@/lib/agent-actions'

// 院长助理（principal-agent）的有限度改动接口。
// 认证只认 x-pjpc-agent-token（跟任何用户登录态无关）；动作白名单在 lib/agent-actions.ts。
// GET：能做什么 + 现在有哪些待抵余额（只读）
// POST：执行一个白名单动作，必须带 reason，全部写审计
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const expected = process.env.PJPC_AGENT_TOKEN || ''
  const got = request.headers.get('x-pjpc-agent-token') || ''
  if (!expected) return { ok: false, reason: '服务端未配置 PJPC_AGENT_TOKEN' }
  if (got !== expected) return { ok: false, reason: 'token 不对' }
  return { ok: true as const }
}

export async function GET(request: NextRequest) {
  const gate = authorized(request)
  if (!gate.ok) return NextResponse.json({ success: false, error: gate.reason }, { status: 401 })
  try {
    const items = await openItems()
    return NextResponse.json({ success: true, actions: ACTION_CATALOG, ...items })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '读取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = authorized(request)
  if (!gate.ok) return NextResponse.json({ success: false, error: gate.reason }, { status: 401 })

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: '请求体必须是 JSON' }, { status: 400 })
  }

  const action = String(body?.action || '')
  const params = (body?.params || {}) as Record<string, any>
  if (!action) return NextResponse.json({ success: false, error: '缺少 action' }, { status: 400 })

  try {
    const result = await runAgentAction(action, params)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    const status = Number(error?.httpStatus) || 500
    console.error(`POST /api/agent/actions ${action} 失败:`, error?.message)
    return NextResponse.json({ success: false, error: error?.message || '执行失败' }, { status })
  }
}
