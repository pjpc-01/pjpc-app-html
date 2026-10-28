/**
 * 站内通知（单源）。
 *
 * 为什么有这个东西：贡献积分、兑换、提议、建议箱这些操作，做完之后
 * 学生/家长只能自己进系统翻，不知道有结果了。这里统一写进 notifications 表，
 * 界面右上角（侧边栏底部）的铃铛显示未读数。
 *
 * 收件人用 users 表（登录账号）。如果只有学生 id，会先按 student_id 找到对应账号。
 */

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

export type NotifyKind = 'contribution' | 'redemption' | 'suggestion' | 'achievement' | 'system'

export interface NotifyOptions {
  /** 收件人登录账号 id（users.id） */
  userId?: string
  /** 或者给学生的 students.id，自动找绑定账号 */
  studentId?: string
  title: string
  body?: string
  kind?: NotifyKind
  /** 点开跳到哪个页面，例如 /my/contribution */
  link?: string
  /** 谁触发的（老师名字 / 系统） */
  actor?: string
  center?: string
}

/** 学生 id → 登录账号 id（没绑定账号就返回空） */
export async function userIdOfStudent(token: string, studentId: string): Promise<string> {
  const q = encodeURIComponent(`student_id="${studentId}"`)
  const r = await fetch(`${PB_URL}/api/collections/users/records?perPage=1&filter=${q}`, {
    headers: { Authorization: token },
  })
  if (!r.ok) return ''
  const d = await r.json().catch(() => ({ items: [] }))
  return d.items?.[0]?.id || ''
}

/** 发一条通知。没找到收件人就静默跳过（不能因为通知失败把业务弄挂） */
export async function notify(token: string, opts: NotifyOptions): Promise<string> {
  try {
    let uid = opts.userId || ''
    if (!uid && opts.studentId) uid = await userIdOfStudent(token, opts.studentId)
    if (!uid) return ''

    const r = await fetch(`${PB_URL}/api/collections/notifications/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({
        user: uid,
        student: opts.studentId || '',
        title: String(opts.title || '').slice(0, 200),
        body: String(opts.body || '').slice(0, 1000),
        kind: opts.kind || 'system',
        link: opts.link || '',
        read: false,
        actor: opts.actor || '',
        center: opts.center || '',
      }),
    })
    if (!r.ok) return ''
    const d = await r.json()
    return d.id || ''
  } catch {
    return ''
  }
}

/** 批量发（同一条内容发给多个学生，例如物品完成入账） */
export async function notifyStudents(token: string, studentIds: string[], opts: Omit<NotifyOptions, 'userId' | 'studentId'>): Promise<number> {
  const uniq = [...new Set(studentIds.filter(Boolean))]
  let sent = 0
  for (const sid of uniq) {
    const id = await notify(token, { ...opts, studentId: sid })
    if (id) sent++
  }
  return sent
}

/** 按角色群发（例如学生提交申请 → 通知所有 admin/teacher） */
export async function notifyRoles(
  token: string,
  roles: string[],
  opts: Omit<NotifyOptions, 'userId' | 'studentId'>,
  center?: string
): Promise<number> {
  const cond = roles.map(r => `role="${r}"`).join(' || ')
  const q = encodeURIComponent(center ? `(${cond}) && center="${center}"` : `(${cond})`)
  const r = await fetch(`${PB_URL}/api/collections/users/records?perPage=50&filter=${q}`, {
    headers: { Authorization: token },
  })
  if (!r.ok) return 0
  const d = await r.json().catch(() => ({ items: [] }))
  let sent = 0
  for (const u of d.items || []) {
    const id = await notify(token, { ...opts, userId: u.id })
    if (id) sent++
  }
  return sent
}
