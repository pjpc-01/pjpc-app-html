import { NextRequest, NextResponse } from 'next/server'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const ADMIN_EMAIL = (process.env.POCKETBASE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'final_admin@test.com')
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '')

// Token cache — avoid re-auth on every request
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAdminToken() {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const response = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!response.ok) return null
  const data = await response.json()
  cachedToken = data.token
  tokenExpiry = now + 120_000 // 2 min cache
  return data.token
}

// Auth endpoints that must NOT be overridden with admin token
const AUTH_ENDPOINTS = [
  '/api/collections/users/auth-with-password',
  '/api/collections/users/auth-refresh',
  '/api/collections/users/request-password-reset',
  '/api/collections/users/confirm-password-reset',
  '/api/collections/users/request-verification',
  '/api/collections/users/confirm-verification',
  '/api/collections/users/request-email-change',
  '/api/collections/users/confirm-email-change',
  '/api/collections/_superusers/auth-with-password',
  '/api/collections/_superusers/auth-refresh',
]

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.some(ep => path.endsWith(ep) || path.includes(ep))
}

async function proxyRequest(method: string, request: NextRequest) {
  const url = new URL(request.url)
  const pbPath = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${pbPath}${method === 'GET' ? url.search : ''}`

  const headers: Record<string, string> = {}
  let body: string | undefined

  if (!isAuthEndpoint(pbPath)) {
    // Non-auth endpoints: use admin token
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
    headers['Authorization'] = `Bearer ${token}`
  }
  // Auth endpoints: pass through WITHOUT admin token — client credentials flow through

  // ★ 操作人：所有方法都带（DELETE 也要 —— 下面记删除日志要用）；前端由 window.fetch 拦截器统一带上
  const actor = request.headers.get('x-actor') || request.headers.get('X-Actor')
  if (actor) headers['x-actor'] = actor.slice(0, 300)

  if (method !== 'GET' && method !== 'DELETE') {
    const ct = request.headers.get('Content-Type') || ''
    if (ct.includes('multipart/form-data')) {
      // Pass through multipart as-is (for file uploads)
      body = await request.arrayBuffer()
      headers['Content-Type'] = ct
    } else {
      headers['Content-Type'] = 'application/json'
      body = await request.text()
    }
  }

  const response = await fetch(targetUrl, { method, headers, body })

  if (response.status === 204) {
    // 删除排班也要记一条：204 没有 body，记录 id 从路径里取
    if (pbPath.includes('/collections/schedules/records') && method === 'DELETE') {
      try {
        const rid = String(pbPath.split('/records/')[1] || '').split('?')[0]
        const adminTok = await getAdminToken()
        if (adminTok) {
          await fetch(`${POCKETBASE_URL}/api/collections/audit_logs/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminTok}` },
            body: JSON.stringify({
              action: 'delete:schedules',
              description: `schedules #${rid} | DELETE via proxy`,
              user_name: headers['x-actor'] || '',
              metadata: JSON.stringify({ collection: 'schedules', record_id: rid, action: 'delete', via: 'proxy' }),
            }),
          })
        }
      } catch { /* 记日志失败不影响删除本身 */ }
    }
    return new NextResponse(null, { status: 204 })
  }

  // File/binary responses: pass through with correct content-type
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
  const isFile = pbPath.includes('/api/files/')
  
  if (isFile || contentType.startsWith('image/') || contentType.startsWith('application/octet-stream')) {
    const blob = await response.arrayBuffer()
    return new NextResponse(blob, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    })
  }

  const data = await response.text()

  // ★ 排班改动日志：PB 钩子拿不到请求头（0.39.6 里 e.httpContext / e.requestInfo 全是 undefined），
  //   所以「谁改的」在代理这一层补记 —— 这里既有 x-actor（前端统一带的操作人），也有刚写入的记录。
  if (response.ok && pbPath.includes('/collections/schedules/records') && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
    try {
      let rec: any = null
      try { rec = JSON.parse(data) } catch { /* DELETE 无 body */ }
      const adminTok = await getAdminToken()
      if (adminTok) {
        const verb = method === 'POST' ? 'create' : method === 'PATCH' ? 'update' : 'delete'
        await fetch(`${POCKETBASE_URL}/api/collections/audit_logs/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminTok}` },
          body: JSON.stringify({
            action: `${verb}:schedules`,
            description: `schedules #${rec?.id || ''} | ${method} via proxy`,
            user_name: headers['x-actor'] || '',
            metadata: JSON.stringify({
              collection: 'schedules',
              record_id: rec?.id || '',
              action: verb,
              via: 'proxy',
              snapshot: rec ? {
                date: rec.date, start_time: rec.start_time, end_time: rec.end_time,
                teacher_id: rec.teacher_id, teacher_name: rec.teacher_name, course_id: rec.course_id,
              } : null,
            }),
          }),
        })
      }
    } catch { /* 记日志失败不影响业务本身 */ }
  }

  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET(req: NextRequest)    { return proxyRequest('GET', req) }
export async function POST(req: NextRequest)   { return proxyRequest('POST', req) }
export async function PATCH(req: NextRequest)  { return proxyRequest('PATCH', req) }
export async function DELETE(req: NextRequest) { return proxyRequest('DELETE', req) }
