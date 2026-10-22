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

// ─── 守门：谁在调、能碰什么 ─────────────────────────────────────────────
// 原来所有请求都套 superuser token → 不带任何登录就能读工资表/学生/发票（公网实测 200）。
// 现在：除登录类接口与图片文件外，一律要求有效登录，并按角色挡敏感集合。
type Session = { id: string; role: string; studentId?: string; name?: string } | null
const sessionCache = new Map<string, { s: Session; exp: number }>()

async function getSession(request: NextRequest): Promise<Session> {
  const auth = request.headers.get('Authorization') || ''
  // PocketBase JS SDK 发的是裸 token（没有 "Bearer " 前缀），两种都认
  const m = auth.match(/^\s*(?:Bearer\s+)?(\S+)\s*$/i)
  if (!m) return null
  const token = m[1].trim()
  const hit = sessionCache.get(token)
  if (hit && Date.now() < hit.exp) return hit.s
  try {
    const r = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) {
      sessionCache.set(token, { s: null, exp: Date.now() + 30_000 })
      return null
    }
    const d = await r.json()
    const s: Session = {
      id: d?.record?.id || '',
      role: String(d?.record?.role || ''),
      studentId: d?.record?.student_id || '',
      name: String(d?.record?.name || d?.record?.username || d?.record?.email || ''),
    }
    sessionCache.set(token, { s, exp: Date.now() + 60_000 })
    return s
  } catch { return null }
}

/**
 * 写一条代理层审计：补齐「谁改的」。
 *
 * 为什么在代理写：PB 0.39.6 的 pb_hooks 拿不到请求头，钩子里只能记「改了什么」，
 * 记不到人。代理这层既有登录态（id/姓名/角色），又有 IP 和 UA。
 * action 用 `proxy:<method>:<collection>` 前缀，跟钩子自己写的行区分开。
 */
async function writeProxyAudit(opts: {
  method: string
  collection: string
  recordId: string
  actor: { id: string; name: string; role: string }
  request: NextRequest
}) {
  try {
    const tok = await getAdminToken()
    if (!tok) return
    const { method, collection, recordId, actor, request } = opts
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '')
      .split(',')[0].trim().slice(0, 60)
    const who = actor.name || actor.id || '未知'
    await fetch(`${POCKETBASE_URL}/api/collections/audit_logs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({
        action: `proxy:${method.toLowerCase()}:${collection}`,
        description: `${collection} #${recordId || '-'} | ${method} | ${who}`,
        user_id: actor.id || '',
        user_name: actor.name || '',
        ip_address: ip,
        user_agent: String(request.headers.get('user-agent') || '').slice(0, 300),
        metadata: JSON.stringify({ collection, record_id: recordId, method, role: actor.role, via: 'proxy' }),
      }),
    })
  } catch { /* 记日志失败不影响业务 */ }
}

/** 从 /api/collections/<name>/... 取出集合名 */
function collectionOf(pbPath: string): string {
  const m = pbPath.match(/\/api\/collections\/([^/]+)/)
  return m ? m[1] : ''
}

/** 只有 admin 能碰的集合：账号 / 审计 / 工资 / 月结 */
const ADMIN_ONLY = new Set([
  'users', 'audit_logs',
  'teacher_salary_records', 'teacher_salary_structures', 'salary_parameters',
  'monthly_closings',
])

/** 这些角色可以正常用系统（除 ADMIN_ONLY 之外） */
const STAFF_ROLES = new Set(['admin', 'teacher', 'office_admin'])

/**
 * 学生账号：只读，且【只能看自己】。
 * 集合 → 用来判定「是不是他本人」的字段。
 * 请求里原本的 filter 会被 AND 上这个条件，学生改不掉（服务端拼的）。
 */
const STUDENT_SELF_FIELD: Record<string, string> = {
  students: 'id',
  student_reports: 'studentId',
  points: 'studentId',
  point_logs: 'student',
  student_attendance: 'student_id',
  exam_targets: 'student_id',
}
/** 学生可以整表读的（不含个人数据） */
const STUDENT_OPEN_READ = new Set(['courses', 'centers', 'homework', 'report_settings'])

/** 把「只看自己」的条件拼进查询串；返回新的 path+query */
function withStudentFilter(pbPath: string, search: string, field: string, sid: string): string {
  const params = new URLSearchParams(search)
  const mine = `${field} = "${sid.replace(/"/g, '')}"`
  const old = params.get('filter')
  params.set('filter', old ? `(${old}) && ${mine}` : mine)
  const q = params.toString()
  return q ? `${pbPath}?${q}` : pbPath
}

async function proxyRequest(method: string, request: NextRequest) {
  const url = new URL(request.url)
  const pbPath = url.pathname.replace('/api/pocketbase-proxy', '')
  let targetPath = pbPath
  let targetSearch = method === 'GET' ? url.search : ''

  const headers: Record<string, string> = {}
  let auditActor: { id: string; name: string; role: string } | null = null
  let body: any // string | ArrayBuffer（multipart 上传要用 arrayBuffer）

  if (!isAuthEndpoint(pbPath)) {
    // ★ 图片文件（<img> 标签不会带 Authorization）放行，其余必须登录
    const isPublicFile = method === 'GET' && pbPath.startsWith('/api/files/')
    // ★ 服务端自己的接口（/api/students 等）内部转发时没有用户 token → 用内部钥匙识别
    const internalKey = process.env.PROXY_INTERNAL_KEY || ''
    const isInternal = !!internalKey && request.headers.get('x-pjpc-internal') === internalKey
    const session = isInternal ? { id: 'internal', role: 'admin' } : await getSession(request)

    if (!session) {
      // ★ 注册：登录页「注册账户」是未登录状态，必须放行 —— 但只能建 users，且角色由服务端强制
      const isSignup = method === 'POST' && /^\/api\/collections\/users\/records\/?$/.test(pbPath)
      if (!isPublicFile && !isSignup) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }
    } else {
      auditActor = { id: String(session.id || ''), name: String(session.name || ''), role: String(session.role || '') }
      if (isInternal) auditActor.name = '系统内部'
      const col = collectionOf(pbPath)
      if (session.role === 'student') {
        // ★ 学生：只读 + 只看自己（服务端拼条件，前端改不了）
        if (method !== 'GET') {
          return NextResponse.json({ error: '学生账号只能查看' }, { status: 403 })
        }
        const sid = String(session.studentId || '')
        if (!sid) {
          return NextResponse.json({ error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
        }
        const field = col ? STUDENT_SELF_FIELD[col] : undefined
        const rid = pbPath.match(/\/records\/([^/]+)$/)
        if (field) {
          if (rid) {
            // 单条详情：先确认这条是不是他本人
            const tok = await getAdminToken()
            const chk = await fetch(`${POCKETBASE_URL}/api/collections/${col}/records/${rid[1]}`, {
              headers: { Authorization: `Bearer ${tok}` },
            })
            if (!chk.ok) return NextResponse.json({ error: '没有权限访问该数据' }, { status: chk.status === 404 ? 404 : 403 })
            const rec = await chk.json().catch(() => null)
            if (!rec || String(rec[field]) !== sid) {
              return NextResponse.json({ error: '没有权限访问该数据' }, { status: 403 })
            }
          } else {
            targetPath = withStudentFilter(pbPath, targetSearch, field, sid)
            targetSearch = ''
          }
        } else if (!col || !STUDENT_OPEN_READ.has(col)) {
          return NextResponse.json({ error: '没有权限访问该数据' }, { status: 403 })
        }
      } else if (!STAFF_ROLES.has(session.role)) {
        // 未知/未开放角色
        return NextResponse.json({ error: '没有权限' }, { status: 403 })
      } else if (session.role !== 'admin' && col && ADMIN_ONLY.has(col)) {
        return NextResponse.json({ error: '没有权限访问该数据' }, { status: 403 })
      }
    }

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

      // ★ 匿名注册：不让前端决定角色（否则谁都能注册成管理员）
      const isAnonSignup = method === 'POST'
        && /^\/api\/collections\/users\/records\/?$/.test(pbPath)
        && !request.headers.get('authorization')
        && request.headers.get('x-pjpc-internal') !== (process.env.PROXY_INTERNAL_KEY || '')
      if (isAnonSignup) {
        try {
          const raw = JSON.parse(body || '{}')
          body = JSON.stringify({
            email: raw.email,
            password: raw.password,
            passwordConfirm: raw.passwordConfirm ?? raw.password,
            name: raw.name || raw.email,
            role: 'pending',            // 待审核：管理员在「用户管理」里改角色才生效
            emailVisibility: false,
          })
          headers['x-pjpc-signup'] = '1'
        } catch { /* 解析不了就原样发过去，让 PB 自己报错 */ }
      }
    }
  }

  const targetUrl = `${POCKETBASE_URL}${targetPath}${targetSearch}`
  const response = await fetch(targetUrl, { method, headers, body })

  // ★ 统一审计：PB 0.39.6 的 hooks 拿不到请求头，记不到「谁改的」→ 在代理这层补记
  if ((method === 'POST' || method === 'PATCH' || method === 'DELETE') && response.ok) {
    try {
      const col = collectionOf(pbPath)
      if (col && col !== 'audit_logs') {
        let rid = ''
        const m = pbPath.match(/\/records\/([^/?#]+)/)
        if (m) rid = m[1]
        if (!rid && method === 'POST') {
          const cloned = response.clone()
          const d = await cloned.json().catch(() => null)
          rid = d?.id || ''
        }
        await writeProxyAudit({
          method, collection: col, recordId: rid,
          actor: auditActor || { id: '', name: '', role: 'anonymous' },
          request,
        })
      }
    } catch { /* 审计失败绝不影响业务 */ }
  }

  if (response.status === 204) {
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
