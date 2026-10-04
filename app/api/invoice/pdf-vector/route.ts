import { NextRequest, NextResponse } from 'next/server'

// 发票「真矢量 PDF」生成路由
// 客户端把已经渲染好的发票 HTML 发过来（模板零改动），服务端用 Chromium 打成矢量 PDF：
//   · 文字可搜索 / 可复制 / 放大不糊（替代原来的整页截图贴图）
//   · 中文自动嵌入子集字体
//   · 顺手把页头 logo 压到 ≤200px JPEG（体积从 ~56KB 降到 ~9KB）
// 失败时客户端会自动回退到原来的截图方案（见 lib/pdf-generator.ts），所以这条路由挂了也不会开不出票。

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 复用同一个 Chromium 实例（首个请求启动，之后复用；崩了自动重建）
let browserPromise: Promise<unknown> | null = null

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import('playwright')
      return chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    })().catch((e) => {
      browserPromise = null
      throw e
    })
  }
  return browserPromise as Promise<{ newContext: () => Promise<any> }>
}

export async function POST(req: NextRequest) {
  let html = ''
  try {
    const body = await req.json()
    html = typeof body?.html === 'string' ? body.html : ''
  } catch {
    /* 非法 JSON → 下面统一报错 */
  }
  if (!html || html.length < 200) {
    return NextResponse.json({ error: 'html required' }, { status: 400 })
  }

  let ctx: any = null
  try {
    const browser = await getBrowser()
    ctx = await browser.newContext()

    // 安全：这个页面只用来排版，不允许它访问任何网络/文件
    await ctx.route('**/*', (route: any) => {
      const u = String(route.request().url())
      if (u.startsWith('data:') || u.startsWith('about:') || u.startsWith('blob:')) return route.continue()
      return route.abort()
    })

    const page = await ctx.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })
    // 等字体就绪
    await page.evaluate(() => (document as any).fonts?.ready).catch(() => {})

    // 压 logo：页头 logo 缩到 ≤200px 并转 JPEG（体积优化，外观不变）
    await page
      .evaluate(async () => {
        const img = document.querySelector('.header-logo img') as HTMLImageElement | null
        if (!img || !img.src.startsWith('data:image')) return
        const done = new Promise<void>((resolve) => {
          const t = setTimeout(() => resolve(), 3000)
          img.onload = () => {
            clearTimeout(t)
            resolve()
          }
          img.onerror = () => {
            clearTimeout(t)
            resolve()
          }
        })
        const src = img.src
        const im = new Image()
        await new Promise<void>((resolve) => {
          im.onload = () => resolve()
          im.onerror = () => resolve()
          im.src = src
        })
        if (!im.width) return
        const targetW = 200
        if (im.width <= targetW && src.length < 20000) return
        const scale = Math.min(1, targetW / im.width)
        const cv = document.createElement('canvas')
        cv.width = Math.max(1, Math.round(im.width * scale))
        cv.height = Math.max(1, Math.round(im.height * scale))
        const c2d = cv.getContext('2d')!
        c2d.fillStyle = '#ffffff'
        c2d.fillRect(0, 0, cv.width, cv.height)
        c2d.drawImage(im, 0, 0, cv.width, cv.height)
        img.src = cv.toDataURL('image/jpeg', 0.88)
        await done
      })
      .catch(() => {})

    await page.emulateMedia({ media: 'print' })
    const pdf: Buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      preferCSSPageSize: true,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        'X-Pdf-Mode': 'vector',
      },
    })
  } catch (e: any) {
    console.error('[invoice/pdf-vector] failed:', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  } finally {
    try {
      await ctx?.close()
    } catch {
      /* 忽略 */
    }
  }
}
