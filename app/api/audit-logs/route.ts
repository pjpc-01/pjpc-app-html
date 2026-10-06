import { NextResponse } from "next/server"
import { getAdminToken } from "@/lib/pb-admin-token"

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"

export const dynamic = "force-dynamic"

export async function GET() {
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
    const logs = (data.items || []).map((r: any) => ({
      id: r.id,
      created: r.created,
      user: r.user_name || r.user_id || "-",
      action: r.action || "-",
      detail: r.description || "",
      description: r.description || "",
      collection: r.collectionName || "",
      ip: r.ip_address || "-",
    }))
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
