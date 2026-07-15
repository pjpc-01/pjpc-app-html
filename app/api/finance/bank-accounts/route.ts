import { NextRequest, NextResponse } from "next/server"

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "final_admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "final_pass"

async function getAdminToken() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
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

// GET /api/finance/bank-accounts — list all bank accounts
export async function GET() {
  try {
    const token = await getAdminToken()
    const res = await fetch(pbUrl("bank_accounts") + "?sort=-created", {
      headers: getHeaders(token),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB GET bank_accounts error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to fetch bank accounts" }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({ success: true, data: data.items })
  } catch (error: any) {
    console.error("GET /api/finance/bank-accounts error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

// POST /api/finance/bank-accounts — create a new bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.bankName || !body.accountNumber) {
      return NextResponse.json(
        { success: false, error: "bankName and accountNumber are required" },
        { status: 400 }
      )
    }

    const payload: Record<string, any> = {
      bankName: body.bankName,
      accountNumber: body.accountNumber,
    }
    if (body.accountName !== undefined) payload.accountName = body.accountName
    if (body.openingBalance !== undefined) payload.openingBalance = Number(body.openingBalance)
    if (body.currentBalance !== undefined) payload.currentBalance = Number(body.currentBalance)
    if (body.status !== undefined) payload.status = body.status

    const token = await getAdminToken()
    const res = await fetch(pbUrl("bank_accounts"), {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB POST bank_accounts error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to create bank account" }, { status: 500 })
    }
    const record = await res.json()
    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/finance/bank-accounts error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/finance/bank-accounts?id=xxx — update a bank account
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'id' is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const payload: Record<string, any> = {}
    if (body.bankName !== undefined) payload.bankName = body.bankName
    if (body.accountNumber !== undefined) payload.accountNumber = body.accountNumber
    if (body.accountName !== undefined) payload.accountName = body.accountName
    if (body.openingBalance !== undefined) payload.openingBalance = Number(body.openingBalance)
    if (body.currentBalance !== undefined) payload.currentBalance = Number(body.currentBalance)
    if (body.status !== undefined) payload.status = body.status

    const token = await getAdminToken()
    const res = await fetch(pbUrl("bank_accounts", id), {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB PATCH bank_accounts error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to update bank account" }, { status: 500 })
    }
    const record = await res.json()
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("PATCH /api/finance/bank-accounts error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/finance/bank-accounts?id=xxx — delete a bank account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'id' is required" },
        { status: 400 }
      )
    }

    const token = await getAdminToken()
    const res = await fetch(pbUrl("bank_accounts", id), {
      method: "DELETE",
      headers: getHeaders(token),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error("PB DELETE bank_accounts error:", res.status, errBody)
      return NextResponse.json({ success: false, error: "Failed to delete bank account" }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: { id } })
  } catch (error: any) {
    console.error("DELETE /api/finance/bank-accounts error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
