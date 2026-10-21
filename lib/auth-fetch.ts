/**
 * 全局 fetch 拦截器（必须在应用最早期执行）
 *
 * 作用：
 *  1) 给所有请求带上「操作人」x-actor（供审计记「谁改的」）
 *  2) 给 /api/pocketbase-proxy 的请求补上登录 token
 *     —— 代理已加守门，SDK 会自带 token，但手写 fetch / 早期请求不会；
 *        少一个 token 就是 401，页面直接空白或卡「加载中」。
 *
 * 幂等：多个模块 import 也只会 patch 一次（window.__pjpcActorPatched）。
 * 注意：这是模块级副作用，必须被最早 import（见 app/layout.tsx 第一行 import）。
 */
export function installAuthFetchPatch() {
  if (typeof window === 'undefined') return
  if ((window as any).__pjpcActorPatched) return
  ;(window as any).__pjpcActorPatched = true

  const origFetch = window.fetch.bind(window)
  window.fetch = (input: any, init?: any) => {
    try {
      const raw = localStorage.getItem('pocketbase_auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const model = parsed?.model
        const token = parsed?.token
        const who = model?.name || model?.email || model?.id
        const url = typeof input === 'string' ? input : (input?.url || '')
        const base = init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
        const h = new Headers(base as any)
        // HTTP 头只能是 ASCII → 中文名字先 URL 编码，服务端再 decode
        if (who && !h.has('x-actor')) h.set('x-actor', encodeURIComponent(String(who)))
        // 站内 /api 请求统一带上登录 token（代理和 app 接口都能据此认人；外部域名绝不带）
        const sameOriginApi = url.startsWith('/api/') || url.startsWith(`${location.origin}/api/`)
        if (token && sameOriginApi && !h.has('authorization')) {
          h.set('Authorization', `Bearer ${token}`)
        }
        init = { ...(init || {}), headers: h }
      }
    } catch { /* 带不上身份不影响请求本身 */ }
    return origFetch(input, init)
  }
}

// import 即生效
installAuthFetchPatch()
