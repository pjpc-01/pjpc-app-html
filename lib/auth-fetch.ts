/**
 * 全局 fetch 拦截器（必须在应用最早期执行，见 app/layout.tsx 第一个 import）
 *
 * 做三件事：
 *  1) 给所有请求带上「操作人」x-actor（供审计记「谁改的」）
 *  2) 给站内 /api 请求补上登录 token
 *     —— 代理已加守门，少一个 token 就是 401，页面会空白或卡「加载中」
 *  3) 撞到 401（登录过期/被踢）时，清掉本地登录态并跳登录页
 *     —— 不加这个，页面会永远停在「加载中」，用户以为系统坏了
 *
 * 幂等：多次 import 也只 patch 一次（window.__pjpcActorPatched）。
 */

const AUTH_STORAGE_KEY = 'pocketbase_auth'
/** 登录类接口自己会回 401（密码错），不能因为它跳登录页 */
const AUTH_NO_REDIRECT = ['/auth-with-password', '/auth-refresh', '/auth-with-oauth2']

let redirecting = false

/** 登录过期：清本地登录态 + 跳登录页（只跳一次，避免并发请求反复跳） */
function handleExpired() {
  if (redirecting) return
  redirecting = true
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch { /* ignore */ }
  try {
    if (!window.location.pathname.startsWith('/login')) {
      const here = window.location.pathname + window.location.search
      window.location.href = `/login?expired=1&next=${encodeURIComponent(here)}`
    }
  } catch { /* ignore */ }
  // 万一没跳成功，40 秒后允许再试一次
  setTimeout(() => { redirecting = false }, 40000)
}

export function installAuthFetchPatch() {
  if (typeof window === 'undefined') return
  if ((window as any).__pjpcActorPatched) return
  ;(window as any).__pjpcActorPatched = true

  const origFetch = window.fetch.bind(window)

  window.fetch = async (input: any, init?: any) => {
    let token = ''
    let sameOriginApi = false
    let url = ''
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const model = parsed?.model
        const who = model?.name || model?.email || model?.id
        token = parsed?.token || ''
        url = typeof input === 'string' ? input : (input?.url || '')
        // 只给站内 /api 带 token，外部域名绝不下发
        sameOriginApi = url.startsWith('/api/') || url.startsWith(`${location.origin}/api/`)
        const base = init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
        const h = new Headers(base as any)
        // HTTP 头只能是 ASCII → 中文名字先 URL 编码，服务端再 decode
        if (who && !h.has('x-actor')) h.set('x-actor', encodeURIComponent(String(who)))
        if (token && sameOriginApi && !h.has('authorization')) {
          h.set('Authorization', `Bearer ${token}`)
        }
        init = { ...(init || {}), headers: h }
      }
    } catch { /* 带不上身份不影响请求本身 */ }

    const response = await origFetch(input, init)

    // 登录态失效 → 别让页面卡在「加载中」
    if (
      response.status === 401 &&
      token &&
      sameOriginApi &&
      !AUTH_NO_REDIRECT.some((p) => url.includes(p))
    ) {
      handleExpired()
    }
    return response
  }
}

// import 即生效
installAuthFetchPatch()
