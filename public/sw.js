/**
 * PJPC PWA service worker —— 只做两件事：
 *  1) 让浏览器认定「可安装」（Chrome 要求有 fetch 处理器 + manifest）
 *  2) 断网时给一个壳，不要把白屏丢给用户
 *
 * 刻意不做：不预缓存页面、不缓存 /api/*、不做后台同步。
 * 这系统页面天天改，缓存旧页面比断网更麻烦。
 */
const CACHE = 'pjpc-shell-v1'
const OFFLINE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE, '/icon-192.png'])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // 接口、鉴权、PocketBase 一律走网络，绝不缓存
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  // 页面：网络优先，断网才回离线壳
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || new Response('离线中', { status: 503 })))
    )
    return
  }

  // 静态资源（图片/字体）：缓存优先，命中就快
  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        }).catch(() => hit || Response.error())
      )
    )
  }
})
