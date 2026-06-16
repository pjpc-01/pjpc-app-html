import { NextRequest, NextResponse } from "next/server"

// AR 账龄分析 API
// 返回所有逾期发票按账龄分组

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "final_admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "final_pass"

async function getAdminToken() {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error("Admin auth failed")
  const data = await res.json()
  return data.token
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    // 获取所有待付款/逾期发票
    const res = await fetch(
      `${PB_URL}/api/collections/invoices/records?perPage=500&sort=-created`,
      { headers }
    )
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 })
    }
    const data = await res.json()
    const now = new Date()

    // 按逾期天数分组
    const aging: Record<string, { items: any[]; total: number }> = {
      current: { items: [], total: 0 },
      days1to30: { items: [], total: 0 },
      days31to60: { items: [], total: 0 },
      days61to90: { items: [], total: 0 },
      days90plus: { items: [], total: 0 },
    }

    for (const invoice of data.items) {
      if (invoice.status === "paid") continue

      const dueDate = new Date(invoice.due_date || invoice.created)
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const amount = invoice.amount || invoice.totalAmount || 0

      const item = {
        id: invoice.id,
        student: invoice.student_name || invoice.student_id || "未知",
        amount,
        daysOverdue: Math.max(0, diffDays),
        dueDate: invoice.due_date || invoice.created,
        period: invoice.period || "",
      }

      if (diffDays <= 0) {
        aging.current.items.push(item)
        aging.current.total += amount
      } else if (diffDays <= 30) {
        aging.days1to30.items.push(item)
        aging.days1to30.total += amount
      } else if (diffDays <= 60) {
        aging.days31to60.items.push(item)
        aging.days31to60.total += amount
      } else if (diffDays <= 90) {
        aging.days61to90.items.push(item)
        aging.days61to90.total += amount
      } else {
        aging.days90plus.items.push(item)
        aging.days90plus.total += amount
      }
    }

    return NextResponse.json({
      success: true,
      aging,
      summary: {
        current: aging.current.total,
        days1to30: aging.days1to30.total,
        days31to60: aging.days31to60.total,
        days61to90: aging.days61to90.total,
        days90plus: aging.days90plus.total,
        totalOutstanding: Object.values(aging).reduce((sum, g) => sum + g.total, 0),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
