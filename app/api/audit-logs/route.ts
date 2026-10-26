import { requireRoles } from '@/lib/api-auth'
import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/pb-admin-token"

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"

import { NextRequest } from 'next/server'
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin'])
  if ('error' in gate) return gate.error
  try {
    // audit_logs 集合权限规则全为 null（本项目有意设计：读写一律走服务端）
    // → 匿名直连会被 403，必须带管理员 token，否则这里永远读到 0 条
    const token = await getAdminToken()
    const res = await fetch(`${PB_URL}/api/collections/audit_logs/records?sort=-created&perPage=50`, {
      headers: { Authorization: token },
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[audit-logs] PocketBase ${res.status}: ${body.slice(0, 200)}`)
      return NextResponse.json({ success: false, logs: [], error: `PocketBase ${res.status}` })
    }

    const data = await res.json()
    // PB 字段名 → 前端渲染用的字段名（user_name/user_id/ip_address/description）
    // actor_type: 服务端接口/PB 自己算出来的写入（成绩导入、自动出勤、NFC、月批发票）拿不到操作人，
    // 这些不是「不知道谁改的」，而是「系统自动」—— 显式区分，别和管理员操作混在一起。
    const logs = (data.items || []).map((r: any) => {
      let meta: any = {}
      try { meta = JSON.parse(r.metadata || '{}') } catch { meta = {} }
      const who = String(r.user_name || '').trim()
      const changes = meta && meta.changes ? Object.keys(meta.changes) : []
      return {
        id: r.id,
        created: r.created,
        user: who || '',
        actor_type: who ? 'human' : 'system',
        action: r.action || "-",
        // 详情只留「集合 #记录」，改动字段单独给（原来把整段 JSON 塞进描述，表格被撑爆）
        detail: (meta.collection ? `${meta.collection} #${meta.record_id || '-'}` : (r.description || "").split(' | ')[0]) || "-",
        description: r.description || "",
        collection: meta.collection || "",
        record_id: meta.record_id || "",
        changes,
        ip: r.ip_address || "-",
      }
    })
    return NextResponse.json({
      success: true,
      logs,
      total: data.totalItems ?? logs.length,
    })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json({ success: false, logs: [], error: "读取审核日志失败" })
  }
}
