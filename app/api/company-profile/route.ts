import { NextResponse } from 'next/server'

/**
 * 公司资料（抬头、地址、电话、邮箱、口号、logo）。
 *
 * 为什么单独开一个接口：登录页还没登录就要显示机构名字和 logo，
 * 走代理会被 401。这里只返回「对外可以公开」的那几个字段，不返回任何业务数据。
 *
 * 数据源：PocketBase 集合 company_profile 的第一条记录。
 */
export const dynamic = 'force-dynamic'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

export async function GET() {
  try {
    // 跟 /api/students 一个套路：走内部代理 + 内部钥匙，不再自己拼账号口令
    // （原来用 POCKETBASE_ADMIN_* 去 users 表认证，那组凭据不是 users 账号，永远 400）
    const base = process.env.SITE_URL || 'http://127.0.0.1:3001'
    const r = await fetch(
      `${base}/api/pocketbase-proxy/api/collections/company_profile/records?perPage=1`,
      {
        headers: { 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
        cache: 'no-store',
      },
    )
    if (!r.ok) {
      console.error('[company-profile] 内部代理返回', r.status)
      return NextResponse.json({ success: false, data: null }, { status: 200 })
    }
    const j = await r.json()
    const p = (j.items || [])[0] || null
    if (!p) return NextResponse.json({ success: false, data: null })
    const logo = p.logo
      ? `/api/pocketbase-proxy/api/files/${p.collectionId}/${p.id}/${p.logo}`
      : ''
    return NextResponse.json({
      success: true,
      data: {
        name: p.name || '',
        name_en: p.name_en || '',
        address: p.address || '',
        phone: p.phone || '',
        phone2: p.phone2 || '',
        email: p.email || '',
        slogan: p.slogan || '',
        reg_no: p.reg_no || '',
        logo,
      },
    })
  } catch {
    return NextResponse.json({ success: false, data: null })
  }
}
