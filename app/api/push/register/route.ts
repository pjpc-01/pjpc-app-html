import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

/**
 * 手机推送 token 登记。
 *
 * App 拿到 FCM token（或在没有 FCM 时用不到）就调这里，按「账号 + token」去重存一条，
 * 服务器发推送时按账号查出所有 token。
 *
 * POST   { token, platform?, appVersion? }  登记 / 刷新
 * DELETE { token }                           退出登录时注销
 */

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student', 'parent'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 })
  }

  const token = String(body?.token || '').trim()
  if (!token) return NextResponse.json({ success: false, error: '缺 token' }, { status: 400 })
  // FCM token 是长串 ASCII；限制长度和字符，别让乱七八糟的东西进库
  if (token.length < 40 || token.length > 400 || !/^[A-Za-z0-9_:\-]+$/.test(token)) {
    return NextResponse.json({ success: false, error: 'token 格式不对' }, { status: 400 })
  }

  const uid = gate.session.id
  const platform = String(body?.platform || 'android')
  const appVersion = String(body?.appVersion || '')
  const admin = await getAdminToken()
  const H = { 'Content-Type': 'application/json', Authorization: admin }

  try {
    const q = encodeURIComponent(`token="${token}"`)
    const existed = await fetch(`${PB_URL}/api/collections/device_tokens/records?perPage=1&filter=${q}`, { headers: H })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .catch(() => ({ items: [] }))

    // 一个账号最多留 5 台设备，防着有人刷一堆 token 占库
    if (!existed?.items?.[0]) {
      const mine = encodeURIComponent(`user="${uid}"`)
      const list = await fetch(`${PB_URL}/api/collections/device_tokens/records?perPage=50&sort=-last_seen&filter=${mine}`, { headers: H })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .catch(() => ({ items: [] }))
      const extra = (list?.items || []).slice(4)
      for (const row of extra) {
        await fetch(`${PB_URL}/api/collections/device_tokens/records/${row.id}`, { method: 'DELETE', headers: H }).catch(() => {})
      }
    }

    const payload = { user: uid, token, platform, app_version: appVersion, last_seen: new Date().toISOString() }
    const row = existed?.items?.[0]
    const res = row
      ? await fetch(`${PB_URL}/api/collections/device_tokens/records/${row.id}`, {
          method: 'PATCH',
          headers: H,
          body: JSON.stringify(payload),
        })
      : await fetch(`${PB_URL}/api/collections/device_tokens/records`, {
          method: 'POST',
          headers: H,
          body: JSON.stringify(payload),
        })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `保存失败 ${res.status}` }, { status: 500 })
    }
    return NextResponse.json({ success: true, updated: !!row })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '登记失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student', 'parent'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 })
  }
  const token = String(body?.token || '').trim()
  if (!token) return NextResponse.json({ success: false, error: '缺 token' }, { status: 400 })

  const admin = await getAdminToken()
  const H = { Authorization: admin }
  const q = encodeURIComponent(`token="${token}"`)
  const list = await fetch(`${PB_URL}/api/collections/device_tokens/records?perPage=50&filter=${q}`, { headers: H })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .catch(() => ({ items: [] }))

  for (const row of list?.items || []) {
    await fetch(`${PB_URL}/api/collections/device_tokens/records/${row.id}`, { method: 'DELETE', headers: H }).catch(() => {})
  }
  return NextResponse.json({ success: true, removed: (list?.items || []).length })
}
