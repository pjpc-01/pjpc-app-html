import { NextRequest, NextResponse } from "next/server"

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "final_admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "final_pass"

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Admin auth failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.token
}

function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ success: false, error: message }, { status })
}

// GET /api/finance/bank-transactions?bankAccountId=xxx&reconciled=true/false
export async function GET(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get("bankAccountId")
    const reconciled = searchParams.get("reconciled")

    // Build PocketBase filter string
    const filters: string[] = []
    if (bankAccountId) {
      filters.push(`bankAccountId="${bankAccountId}"`)
    }
    if (reconciled === "true") {
      filters.push("reconciled=true")
    } else if (reconciled === "false") {
      filters.push("reconciled=false")
    }

    let url = `${PB_URL}/api/collections/bank_transactions/records?perPage=500&sort=-created`
    if (filters.length > 0) {
      url += `&filter=${encodeURIComponent(filters.join(" && "))}`
    }

    const res = await fetch(url, { headers })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch bank transactions: ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json({
      success: true,
      data: data.items || [],
      total: data.totalItems || 0,
      page: data.page || 1,
      perPage: data.perPage || 500,
    })
  } catch (error: any) {
    return errorResponse(error)
  }
}

// POST /api/finance/bank-transactions
// Single create: body = { bankAccountId, date, description, amount, type, ... }
// Bulk import: body = [ { bankAccountId, date, description, amount, type, ... }, ... ]
export async function POST(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    const body = await request.json()

    // Detect bulk import — body is an array
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { success: false, error: "Bulk import array is empty" },
          { status: 400 }
        )
      }

      const results: { index: number; id?: string; success: boolean; error?: string }[] = []

      for (let i = 0; i < body.length; i++) {
        const tx = body[i]
        try {
          // Validate required fields for each transaction
          if (!tx.bankAccountId || !tx.date || !tx.description || tx.amount == null || !tx.type) {
            results.push({
              index: i,
              success: false,
              error: "Missing required fields (bankAccountId, date, description, amount, type)",
            })
            continue
          }

          if (tx.type !== "credit" && tx.type !== "debit") {
            results.push({
              index: i,
              success: false,
              error: "type must be 'credit' or 'debit'",
            })
            continue
          }

          const res = await fetch(`${PB_URL}/api/collections/bank_transactions/records`, {
            method: "POST",
            headers,
            body: JSON.stringify(tx),
          })

          if (!res.ok) {
            const text = await res.text()
            results.push({ index: i, success: false, error: `Create failed: ${res.status} ${text}` })
          } else {
            const record = await res.json()
            results.push({ index: i, id: record.id, success: true })
          }
        } catch (err: any) {
          results.push({ index: i, success: false, error: err.message })
        }
      }

      const allSucceeded = results.every((r) => r.success)
      return NextResponse.json({
        success: allSucceeded,
        data: results,
        imported: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      })
    }

    // Single create
    if (!body.bankAccountId || !body.date || !body.description || body.amount == null || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (bankAccountId, date, description, amount, type)" },
        { status: 400 }
      )
    }

    if (body.type !== "credit" && body.type !== "debit") {
      return NextResponse.json(
        { success: false, error: "type must be 'credit' or 'debit'" },
        { status: 400 }
      )
    }

    const res = await fetch(`${PB_URL}/api/collections/bank_transactions/records`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to create bank transaction: ${text}` },
        { status: res.status }
      )
    }

    const record = await res.json()
    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    return errorResponse(error)
  }
}

// DELETE /api/finance/bank-transactions?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'id' is required" },
        { status: 400 }
      )
    }

    const res = await fetch(`${PB_URL}/api/collections/bank_transactions/records/${id}`, {
      method: "DELETE",
      headers,
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to delete bank transaction: ${text}` },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (error: any) {
    return errorResponse(error)
  }
}
