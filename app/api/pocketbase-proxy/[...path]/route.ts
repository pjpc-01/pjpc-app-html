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
  changes?: Record<string, { from: any; to: any }>
  before?: any
}) {
  try {
    const tok = await getAdminToken()
    if (!tok) return
    const { method, collection, recordId, actor, request, changes, before } = opts
    const verb = method === 'POST' ? 'create' : method === 'PATCH' ? 'update' : 'delete'
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '')
      .split(',')[0].trim().slice(0, 60)
    const who = actor.name || actor.id || '未知'
    await fetch(`${POCKETBASE_URL}/api/collections/audit_logs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({
        action: `${verb}:${collection}`,
        description: changes
          ? `${collection} #${recordId || '-'} | ${method} | ${who} | ${JSON.stringify(changes).slice(0, 800)}`
          : `${collection} #${recordId || '-'} | ${method} | ${who}`,
        user_id: actor.id || '',
        user_name: actor.name || '',
        ip_address: ip,
        user_agent: String(request.headers.get('user-agent') || '').slice(0, 300),
        metadata: JSON.stringify({
          collection, record_id: recordId, action: verb, method, role: actor.role, via: 'proxy',
          ...(changes ? { changes } : {}),
          ...(before ? { snapshot: before } : {}),
        }),
      }),
    })
  } catch { /* 记日志失败不影响业务 */ }
}

/**
 * 钩子（pb_hooks/main.pb.js）是审计的**唯一写入者** —— 它覆盖所有写操作，
 * 包括服务端 API 直接写 PB 的那些（那些根本不经过代理）。但它拿不到请求头，
 * 记不到「谁」。所以代理在写成功后，把刚才钩子写的那条补上操作人/IP/UA，
 * 而不是再插一条新的 —— 否则同一笔改动两条记录，审计页翻倍、按人筛漏一半。
 *
 * 找不到（还没写完 / 钩子跳过该集合，如 schedules）就自己写一条兜底。
 */
/** pb_hooks/main.pb.js 里排除、不写审计的集合（排班改动由代理这条兜底记录提供） */
const HOOK_SKIPPED = new Set(['schedules', 'audit_logs'])

/** 已经补过操作人的审计行 id，防止同一行被补第二次 */
const PATCHED_AUDIT = new Set<string>()

async function attachActorToAudit(opts: {
  method: string
  collection: string
  recordId: string
  actor: { id: string; name: string; role: string }
  request: NextRequest
  changes?: Record<string, { from: any; to: any }>
  before?: any
}) {
  const verb = opts.method === 'POST' ? 'create' : opts.method === 'PATCH' ? 'update' : 'delete'
  try {
    const tok = await getAdminToken()
    if (!tok) return
    const ip = String(opts.request.headers.get('x-forwarded-for') || opts.request.headers.get('x-real-ip') || '')
      .split(',')[0].trim().slice(0, 60)
    const ua = String(opts.request.headers.get('user-agent') || '').slice(0, 300)

    // 钩子根本不审计这些集合（pb_hooks 里排除了），等也没用 → 直接自己写，别拖慢接口
    if (HOOK_SKIPPED.has(opts.collection)) {
      await writeProxyAudit({ ...opts })
      return
    }

    // 钩子是 PB 保存成功后写的，实测 0.2–1.5 秒才落库（PB 0.39.6 JSVM 慢），
    // 所以最多等约 3 秒；超时才兜底自己写一条，避免同一笔改动两条记录
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const filter = `action = "${verb}:${opts.collection}" && user_name = ""` +
          (opts.recordId ? ` && description ~ "${opts.recordId}"` : '')
        const url = `${POCKETBASE_URL}/api/collections/audit_logs/records?perPage=10&sort=-created&filter=${encodeURIComponent(filter)}`
        const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } })
        if (r.ok) {
          const d = await r.json()
          // 同一条审计只补一次（连续两次改同一条记录时别都补到同一行）
          const row = (d.items || []).find((x: any) => !PATCHED_AUDIT.has(x.id))
          if (row) {
            PATCHED_AUDIT.add(row.id)
            if (PATCHED_AUDIT.size > 500) PATCHED_AUDIT.clear()
            await fetch(`${POCKETBASE_URL}/api/collections/audit_logs/records/${row.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
              body: JSON.stringify({
                user_id: opts.actor.id || '',
                user_name: opts.actor.name || opts.actor.id || '未知',
                ip_address: ip,
                user_agent: ua,
              }),
            })
            return
          }
        }
      } catch { /* 单次失败继续重试 */ }
      await new Promise(res => setTimeout(res, 150))
    }

    // 兜底：钩子没写（例如 schedules 被钩子排除）→ 自己写一条
    await writeProxyAudit({ ...opts })
  } catch { /* 审计失败绝不影响业务 */ }
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
        // 唯一例外：登录成功后前端要把自己的 loginAttempts/lockedUntil 归零（清失败次数），
        // 只允许改这两个字段，改别的一律 403。
        if (method === 'PATCH') {
          const selfUser = (pbPath.match(/^\/api\/collections\/users\/records\/([^/?#]+)\/?$/) || [])[1]
          const rawBody = await request.clone().text().catch(() => '')
          let keys: string[] = []
          try { keys = Object.keys(JSON.parse(rawBody || '{}')) } catch { keys = ['?'] }
          const onlyCounters = keys.length > 0 && keys.every((k) => k === 'loginAttempts' || k === 'lockedUntil')
          if (selfUser && selfUser === String(session.id || '') && onlyCounters) {
            // 放行（下面用超管转发）
          } else {
            return NextResponse.json({ error: '学生账号只能查看' }, { status: 403 })
          }
        } else if (method !== 'GET') {
          return NextResponse.json({ error: '学生账号只能查看' }, { status: 403 })
        }
        const sid = String(session.studentId || '')
        if (!sid) {
          return NextResponse.json({ error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
        }
        // 学生读自己账号资料 / 读页面权限表：只读放行（前端要用来渲染导航）
        const selfRid = (pbPath.match(/\/records\/([^/?#]+)/) || [])[1]
        if (col === 'users' && selfRid && selfRid === String(session.id || '')) {
          // 交给下面用超管转发
        } else if (col === 'role_permissions') {
          // 只读放行
        } else {
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
        }
      } else if (!STAFF_ROLES.has(session.role)) {
        // 未知/未开放角色
        return NextResponse.json({ error: '没有权限' }, { status: 403 })
      } else if (session.role !== 'admin' && col && ADMIN_ONLY.has(col)) {
        // ★ 例外：任何人都能读「自己」的 users 记录（前端要拿姓名/角色/绑定信息）
        const selfId = (pbPath.match(/\/records\/([^/?#]+)/) || [])[1]
        const isSelf = col === 'users' && selfId && selfId === String(session.id || '')
        const isSelfRead = isSelf && method === 'GET'
        // 登录成功后前端把自己那条 users 的失败次数归零（loginAttempts/lockedUntil），只放这两个字段
        let isSelfCounterPatch = false
        if (isSelf && method === 'PATCH') {
          const raw = await request.clone().text().catch(() => '')
          try {
            const keys = Object.keys(JSON.parse(raw || '{}'))
            isSelfCounterPatch = keys.length > 0 && keys.every((k) => k === 'loginAttempts' || k === 'lockedUntil')
          } catch { isSelfCounterPatch = false }
        }
        if (!isSelfRead && !isSelfCounterPatch) {
          return NextResponse.json({ error: '没有权限访问该数据' }, { status: 403 })
        }
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

  // ★ 单点审计（2026-10-26 用户要求）：pb_hooks 不再写审计，全部在代理这层记「谁 + 改了什么」，
  //   否则同一笔改动会落两条（代理一条有操作人、钩子一条没操作人），审计页事件翻倍、按人筛漏一半。
  let auditBefore: any = null
  let auditChanges: Record<string, { from: any; to: any }> | undefined
  const auditCol = collectionOf(pbPath)
  const auditIdMatch = pbPath.match(/\/records\/([^/?#]+)/)
  if ((method === 'PATCH' || method === 'DELETE') && auditCol && auditIdMatch) {
    try {
      const tokForBefore = await getAdminToken()
      if (tokForBefore) {
        const rBefore = await fetch(`${POCKETBASE_URL}/api/collections/${auditCol}/records/${auditIdMatch[1]}`, {
          headers: { Authorization: `Bearer ${tokForBefore}` },
        })
        if (rBefore.ok) auditBefore = await rBefore.json()
      }
    } catch { /* 取旧值失败就不记 changes，不影响业务 */ }
  }
  if (method === 'PATCH' && auditBefore && typeof body === 'string' && body) {
    try {
      const sent = JSON.parse(body)
      const ch: Record<string, { from: any; to: any }> = {}
      for (const k of Object.keys(sent)) {
        if (k === 'updated' || k === 'created' || k === 'id') continue
        if (JSON.stringify(auditBefore[k]) !== JSON.stringify(sent[k])) ch[k] = { from: auditBefore[k], to: sent[k] }
      }
      if (Object.keys(ch).length) auditChanges = ch
    } catch { /* multipart 或非 JSON 就跳过 */ }
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
        await attachActorToAudit({
          method, collection: col, recordId: rid,
          actor: auditActor || { id: '', name: '', role: 'anonymous' },
          request,
          changes: auditChanges,
          before: method === 'DELETE' ? auditBefore : undefined,
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

  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET(req: NextRequest)    { return proxyRequest('GET', req) }
export async function POST(req: NextRequest)   { return proxyRequest('POST', req) }
export async function PATCH(req: NextRequest)  { return proxyRequest('PATCH', req) }
export async function DELETE(req: NextRequest) { return proxyRequest('DELETE', req) }
