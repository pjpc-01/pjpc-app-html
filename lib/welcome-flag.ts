/**
 * 登录后的「欢迎」一次性标记。
 *
 * 为什么不放 URL 参数：登录成功 → router.push("/")，URL 会被各种 replace 覆盖，
 * 而且 ?welcome=1 会被家长发出去的链接带进别人的浏览器。
 * 用 sessionStorage：只在这一个标签页、这一次登录后生效，关掉标签就没了。
 *
 * 时效 30 秒：防「登录后卡住很久才回到首页」时突然弹欢迎页。
 */

const KEY = 'pjpc_welcome_at'
const MAX_AGE_MS = 30_000

export function markWelcome() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* 隐私模式下不可写，忽略：就只是没有欢迎动效 */
  }
}

/** 读取并消费（只弹一次）。返回 true 表示这次该播欢迎动效。 */
export function consumeWelcome(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return false
    sessionStorage.removeItem(KEY)
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < MAX_AGE_MS
  } catch {
    return false
  }
}
