import { NextRequest, NextResponse } from "next/server"

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

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function pbUrl(collection: string, id?: string) {
  const base = `${PB_URL}/api/collections/${collection}/records`
  return id ? `${base}/${id}` : base
}

// GET /api/finance/refunds — list all refunds (sorted -created)
export async function GET() {
  try {
    const token = await getAdminToken()
    const res = await fetch(pbUrl("refunds") + "?sort=-created&perPage=500", {
      headers: getHeaders(token),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB GET refunds error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to fetch refunds" }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({ success: true, data: data.items })
  } catch (error: any) {
    console.error("GET /api/finance/refunds error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

// POST /api/finance/refunds — create a refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.invoiceId || !body.amount || !body.reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: invoiceId, amount, reason" },
        { status: 400 }
      )
    }

    const payload: Record<string, any> = {
      invoiceId: body.invoiceId,
      amount: Number(body.amount),
      reason: body.reason,
    }
    if (body.paymentId !== undefined) payload.paymentId = body.paymentId
    if (body.studentId !== undefined) payload.studentId = body.studentId
    if (body.method !== undefined) payload.method = body.method
    if (body.status !== undefined) payload.status = body.status
    if (body.processedBy !== undefined) payload.processedBy = body.processedBy
    if (body.notes !== undefined) payload.notes = body.notes

    const token = await getAdminToken()
    const headers = getHeaders(token)

    // Create the refund record
    const res = await fetch(pbUrl("refunds"), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB POST refunds error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to create refund" }, { status: 500 })
    }
    const record = await res.json()

    // If status is 'completed', perform side effects:
    //   1. Update the original payment to 'refunded' status
    //   2. Update the invoice status back to 'issued'
    const refundStatus = body.status || "pending"
    if (refundStatus === "completed") {
      // --- Update payment status to 'refunded' ---
      if (body.paymentId) {
        const paymentRes = await fetch(pbUrl("payments", body.paymentId), {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "refunded" }),
        })
        if (!paymentRes.ok) {
          const errText = await paymentRes.text()
          console.warn(`Failed to update payment ${body.paymentId} to refunded:`, paymentRes.status, errText)
        }
      }

      // --- Update invoice status back to 'issued' ---
      try {
        const invRes = await fetch(pbUrl("invoices", body.invoiceId), {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "issued" }),
        })
        if (!invRes.ok) {
          const errText = await invRes.text()
          console.warn(`Failed to update invoice ${body.invoiceId} to issued:`, invRes.status, errText)
        }
      } catch (err) {
        console.warn(`Error updating invoice ${body.invoiceId}:`, err)
      }
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/finance/refunds error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
