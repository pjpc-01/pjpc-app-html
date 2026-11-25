import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { generateInvoiceHTML } from '@/lib/pdf-generator'

/**
 * 发票 PDF（系统自己的模板，唯一出口）
 *
 * 为什么要这条路由：网页里「打印发票」是前端排版（lib/pdf-generator 的 generateInvoiceHTML）
 * 再用 Chromium 出 PDF。别的程序（院长助理、脚本、bot）没有浏览器，拿不到票，
 * 就会自己去写一套排版脚本 —— 2026-11-24 就是这么长出一份第二套发票模板的。
 * 现在统一走这里：系统模板 → 服务端 Chromium → 矢量 PDF。
 *
 * 用法：
 *   POST /api/invoice/render  {"invoiceNumber":"INV-202701-001"}
 *   GET  /api/invoice/render?invoiceNumber=INV-202701-001
 * 鉴权：登录角色（admin/office_admin/teacher）或 x-pjpc-internal 内部令牌
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PB_URL = 'http://127.0.0.1:8090'

let browserPromise: Promise<any> | null = null
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
  return browserPromise
}

async function pbGet(token: string, collection: string, query: Record<string, string>) {
  const params = new URLSearchParams(query)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, {
    headers: { Authorization: token },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PB ${collection} ${res.status}`)
  return res.json()
}

/** 按学生分行选发票抬头；没有对应就退回默认设置 */
function pickPreset(settings: any[], center: string) {
  if (!settings.length) return null
  const byCenter = settings.find((s) => String(s.name || '').toUpperCase() === String(center || '').toUpperCase())
  if (byCenter) return byCenter
  return settings.find((s) => s.isDefault) || settings[0]
}

async function renderPdf(invoiceNumber: string): Promise<{ pdf: Buffer; name: string }> {
  const token = await getAdminToken()

  const inv = await pbGet(token, 'invoices', {
    filter: `invoiceNumber="${invoiceNumber}" && deleted!=true`,
    perPage: '1',
  })
  const invoice = inv?.items?.[0]
  if (!invoice) throw Object.assign(new Error(`找不到发票 ${invoiceNumber}`), { code: 404 })

  // 学生分行 → 抬头
  let center = ''
  if (invoice.studentId) {
    try {
      const st = await fetch(`${PB_URL}/api/collections/students/records/${invoice.studentId}`, {
        headers: { Authorization: token },
        cache: 'no-store',
      })
      if (st.ok) center = (await st.json())?.center || ''
    } catch {
      /* 学生查不到就用默认抬头 */
    }
  }

  const settingsRes = await pbGet(token, 'invoice_settings', { perPage: '50', sort: '-created' })
  const preset = pickPreset(settingsRes?.items || [], center)
  if (!preset) throw Object.assign(new Error('没有发票设置'), { code: 500 })

  const html = generateInvoiceHTML(invoice as any, preset as any)

  const browser = await getBrowser()
  const ctx = await browser.newContext()
  try {
    const page = await ctx.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    // 等图片（logo 是 base64，通常瞬时；字体给一点时间）
    await page.waitForTimeout(250)
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })
    return { pdf: Buffer.from(pdf), name: `Invoice_${invoiceNumber}.pdf` }
  } finally {
    await ctx.close().catch(() => {})
  }
}

function respond(entry: { pdf: Buffer; name: string }) {
  return new NextResponse(new Uint8Array(entry.pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${entry.name}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(req: NextRequest) {
  const gate = await requireRoles(req, ['admin', 'office_admin', 'teacher'])
  if ('error' in gate) return gate.error
  const number = req.nextUrl.searchParams.get('invoiceNumber') || ''
  if (!number) return NextResponse.json({ error: 'invoiceNumber required' }, { status: 400 })
  try {
    return respond(await renderPdf(number))
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'render failed' }, { status: e?.code || 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireRoles(req, ['admin', 'office_admin', 'teacher'])
  if ('error' in gate) return gate.error
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    /* 空 body → 下面报 400 */
  }
  const number = String(body?.invoiceNumber || '').trim()
  if (!number) return NextResponse.json({ error: 'invoiceNumber required' }, { status: 400 })
  try {
    return respond(await renderPdf(number))
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'render failed' }, { status: e?.code || 500 })
  }
}
