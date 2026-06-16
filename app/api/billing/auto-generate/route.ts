import { NextRequest, NextResponse } from "next/server"

// 定期账单自动生成 API
// 为所有有活跃学生费用的学生生成当月账单

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

export async function POST(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const period = `${year}-${String(month).padStart(2, "0")}`

    // 获取学生的费用分配
    const studentFeesRes = await fetch(
      `${PB_URL}/api/collections/student_fees/records?perPage=500`,
      { headers }
    )
    if (!studentFeesRes.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch student fees" }, { status: 500 })
    }
    const studentFees = await studentFeesRes.json()
    const activeAssignments = studentFees.items.filter((sf: any) => sf.status === "active")

    // 获取费项详情
    const feeItemsRes = await fetch(
      `${PB_URL}/api/collections/fee_items/records?perPage=500`,
      { headers }
    )
    const feeItems = feeItemsRes.ok ? (await feeItemsRes.json()).items : []
    const feeMap = new Map(feeItems.map((fi: any) => [fi.id, fi]))

    // 检查已存在哪些账单（避免重复）
    const existingInvoicesRes = await fetch(
      `${PB_URL}/api/collections/invoices/records?perPage=500&filter=(period%3D%22${period}%22)`,
      { headers }
    )
    const existingInvoices = existingInvoicesRes.ok ? (await existingInvoicesRes.json()).items : []
    const existingStudentPeriods = new Set(
      existingInvoices.map((inv: any) => `${inv.student_id}_${inv.period}`)
    )

    // 生成新账单
    const created: any[] = []
    const skipped: any[] = []

    for (const assignment of activeAssignments) {
      const key = `${assignment.student}_${period}`
      if (existingStudentPeriods.has(key)) {
        skipped.push({ student: assignment.student, reason: "已存在" })
        continue
      }

      const feeItem = feeMap.get(assignment.fee_item)
      if (!feeItem) {
        skipped.push({ student: assignment.student, reason: "费项不存在" })
        continue
      }

      const invoiceData = {
        student_id: assignment.student,
        student_name: assignment.student_name || "",
        fee_item_id: assignment.fee_item,
        fee_item_name: feeItem.name || "学费",
        amount: feeItem.amount || 0,
        period,
        status: "pending",
        due_date: new Date(year, month, 15).toISOString().split("T")[0],
        created_by: "auto-billing",
      }

      const createRes = await fetch(`${PB_URL}/api/collections/invoices/records`, {
        method: "POST",
        headers,
        body: JSON.stringify(invoiceData),
      })

      if (createRes.ok) {
        const createdInvoice = await createRes.json()
        created.push({ id: createdInvoice.id, student: assignment.student, amount: feeItem.amount })
      } else {
        skipped.push({ student: assignment.student, reason: `创建失败: ${createRes.status}` })
      }
    }

    return NextResponse.json({
      success: true,
      period,
      totalActive: activeAssignments.length,
      created: created.length,
      skipped: skipped.length,
      details: {
        created,
        skipped,
      },
    })
  } catch (error: any) {
    console.error("Auto-billing error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
