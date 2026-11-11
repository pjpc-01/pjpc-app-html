/**
 * 极简内存限流（按 key 计数，滑动窗口）。
 *
 * 为什么需要：刷卡相关的两个接口是免登录的（刷卡机/kiosk 没法登录），
 * 卡号又是 8~10 位十六进制，不限制的话可以慢慢枚举出别人的卡，
 * 然后拿 /api/auth/nfc-login 换到那个人的登录票据。
 *
 * 只在单进程内生效（next start 单实例够用）；重启清零，不影响业务。
 */
type Bucket = { hits: number[]; }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 5000

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b) {
    if (buckets.size > MAX_KEYS) buckets.clear() // 防内存涨爆
    b = { hits: [] }
    buckets.set(key, b)
  }
  b.hits = b.hits.filter((t) => now - t < windowMs)
  if (b.hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - b.hits[0])) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }
  b.hits.push(now)
  return { ok: true, remaining: limit - b.hits.length, retryAfter: 0 }
}

/** 取真实来源 IP（经过代理时看 x-forwarded-for） */
export function clientIp(req: Request): string {
  const h = req.headers
  const xf = h.get('x-forwarded-for') || ''
  const first = xf.split(',')[0].trim()
  return (first || h.get('x-real-ip') || 'unknown').slice(0, 60)
}
