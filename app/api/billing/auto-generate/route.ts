import { NextRequest, NextResponse } from "next/server"

// 定期账单自动生成 API
// 为所有有活跃学生费用的学生生成当月账单
// 自动检测上期未付清/多付的 invoice，结转差额到本期

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@pjpc.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234567890"

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
    const headers = { Authorization: `${token}`, "Content-Type": "application/json" }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const period = `${year}-${String(month).padStart(2, "0")}`

    // 1. 获取学生的费用分配
    const studentFeesRes = await fetch(
      `${PB_URL}/api/collections/student_fees/records?perPage=500`,
      { headers }
    )
    if (!studentFeesRes.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch student fees" }, { status: 500 })
    }
    const studentFees = await studentFeesRes.json()
    // student_fees uses: students (student ID), fee_items (array), status
    const activeAssignments = studentFees.items.filter((sf: any) =>
      sf.status === "active" || sf.status === "pending"
    )

    // 2. 获取所有学生
    const studentsRes = await fetch(
      `${PB_URL}/api/collections/students/records?perPage=500`,
      { headers }
    )
    const students = studentsRes.ok ? (await studentsRes.json()).items : []
    const studentMap = new Map<string, any>(students.map((s: any) => [s.id, s]))

    // 3. 获取所有未付清的旧 invoice（非本期，状态为 issued/partially_paid/overdue）
    const prevInvoicesRes = await fetch(
      `${PB_URL}/api/collections/invoices/records?perPage=1000&filter=(period!="${period}"%26%26(status="issued"||status="partially_paid"||status="overdue"))`,
      { headers }
    )
    const prevInvoices = prevInvoicesRes.ok ? (await prevInvoicesRes.json()).items : []

    // 4. 获取所有 payments
    const paymentsRes = await fetch(
      `${PB_URL}/api/collections/payments/records?perPage=2000`,
      { headers }
    )
    const payments = paymentsRes.ok ? (await paymentsRes.json()).items : []

    // 按 invoiceId 汇总 payments
    const paymentSumByInvoice = new Map<string, number>()
    for (const p of payments) {
      const invId = p.invoiceId
      paymentSumByInvoice.set(invId, (paymentSumByInvoice.get(invId) || 0) + (p.amount || 0))
    }

    // 计算每个学生的上期结转
    const studentCarryForward = new Map<string, number>()
    const studentCarryDetail = new Map<string, string[]>()

    // 从 student.balance 字段读取手动调整
    for (const s of students) {
      if (s.balance && s.balance !== 0) {
        studentCarryForward.set(s.id, (studentCarryForward.get(s.id) || 0) + s.balance)
      }
    }

    // 从未付清 invoice 计算差额
    for (const inv of prevInvoices) {
      const sid = inv.studentId
      if (!sid) continue
      const invoiceAmount = inv.totalAmount || inv.amount || 0
      const paidAmount = paymentSumByInvoice.get(inv.id) || 0
      const diff = paidAmount - invoiceAmount
      if (diff !== 0) {
        studentCarryForward.set(sid, (studentCarryForward.get(sid) || 0) + diff)
        const detail = studentCarryDetail.get(sid) || []
        detail.push(`${inv.period || "往期"} 差额:${diff > 0 ? "+" : ""}${diff.toFixed(2)}`)
        studentCarryDetail.set(sid, detail)
      }
    }

    // 5. 检查本月已存在的 invoice（避免重复）
    const existingInvoicesRes = await fetch(
      `${PB_URL}/api/collections/invoices/records?perPage=500&filter=(period="${period}")`,
      { headers }
    )
    const existingInvoices = existingInvoicesRes.ok ? (await existingInvoicesRes.json()).items : []
    const existingStudentPeriods = new Set(
      existingInvoices.map((inv: any) => `${inv.studentId}_${inv.period || period}`)
    )

    // 6. 生成新账单
    const created: any[] = []
    const skipped: any[] = []
    const markedSettled: string[] = []

    for (const assignment of activeAssignments) {
      const sid = assignment.students  // student_fees uses "students" field
      if (!sid) {
        skipped.push({ reason: "无学生ID" })
        continue
      }

      const key = `${sid}_${period}`
      if (existingStudentPeriods.has(key)) {
        skipped.push({ student: sid, reason: "本月已存在" })
        continue
      }

      const student = studentMap.get(sid)
      const feeItemsArr = assignment.fee_items || []

      if (feeItemsArr.length === 0) {
        skipped.push({ student: sid, reason: "无费用项目" })
        continue
      }

      // Build invoice items from fee_items array
      const items: { name: string; amount: number }[] = []
      let totalAmount = 0

      for (const fi of feeItemsArr) {
        if (fi.active !== false) {
          items.push({ name: fi.name || "费用", amount: fi.amount || 0 })
          totalAmount += fi.amount || 0
        }
      }

      // 上期结转
      const carryForward = studentCarryForward.get(sid) || 0
      if (carryForward !== 0) {
        if (carryForward > 0) {
          items.push({ name: "上期余额抵扣", amount: -carryForward })
        } else {
          items.push({ name: "上期未清欠款", amount: -carryForward })
        }
        totalAmount -= carryForward
      }

      const invoiceData = {
        studentId: sid,
        studentName: student?.name || "",
        studentGrade: student?.grade || "",
        invoiceNumber: `INV-${period.replace("-", "")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        amount: totalAmount,
        totalAmount: totalAmount,
        items,
        period,
        status: "issued",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(year, month, 15).toISOString().split("T")[0],
        notes: "Auto-generated invoice",
      }

      const createRes = await fetch(`${PB_URL}/api/collections/invoices/records`, {
        method: "POST",
        headers,
        body: JSON.stringify(invoiceData),
      })

      if (createRes.ok) {
        const createdInvoice = await createRes.json()
        created.push({
          id: createdInvoice.id,
          student: sid,
          studentName: invoiceData.studentName,
          amount: totalAmount,
          carryForward,
          items,
        })

        // 标记旧 invoice 为 carried_forward
        if (carryForward !== 0) {
          for (const inv of prevInvoices) {
            if (inv.studentId === sid) {
              const ia = inv.totalAmount || inv.amount || 0
              const pa = paymentSumByInvoice.get(inv.id) || 0
              if (pa !== ia) {
                await fetch(`${PB_URL}/api/collections/invoices/records/${inv.id}`, {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ status: "carried_forward" }),
                })
                markedSettled.push(inv.id)
              }
            }
          }
        }

        // 重置 student.balance
        if (student?.balance && student.balance !== 0) {
          await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ balance: 0 }),
          })
        }
      } else {
        const errText = await createRes.text()
        skipped.push({ student: sid, reason: `创建失败: ${createRes.status}` })
      }
    }

    return NextResponse.json({
      success: true,
      period,
      totalActive: activeAssignments.length,
      created: created.length,
      skipped: skipped.length,
      markedSettled: markedSettled.length,
      details: { created, skipped },
    })
  } catch (error: any) {
    console.error("Auto-billing error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
