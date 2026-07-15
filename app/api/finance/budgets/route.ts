import { NextRequest, NextResponse } from "next/server"

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "final_admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "final_pass"

const VALID_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salary",
  "Supplies",
  "Food",
  "Transport",
  "Marketing",
  "Maintenance",
  "Other",
]

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

function getHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function pbUrl(collection: string, id?: string): string {
  const base = `${PB_URL}/api/collections/${collection}/records`
  return id ? `${base}/${id}` : base
}

/** Build a date-range filter for expenses matching a given (category, month, year) */
function buildExpenseFilter(category: string, month: number, year: number): string {
  const paddedMonth = String(month).padStart(2, "0")
  const startDate = `${year}-${paddedMonth}-01 00:00:00`
  // End date is exclusive — first day of next month
  const endDate =
    month === 12
      ? `${year + 1}-01-01 00:00:00`
      : `${year}-${String(month + 1).padStart(2, "0")}-01 00:00:00`

  return encodeURIComponent(
    `category="${category}" && date>="${startDate}" && date<"${endDate}"`
  )
}

/** Compute spent amount for a single budget category / month / year from the expenses collection */
async function computeSpent(
  headers: Record<string, string>,
  category: string,
  month: number,
  year: number
): Promise<number> {
  const filter = buildExpenseFilter(category, month, year)
  const url = `${pbUrl("expenses")}?perPage=500&filter=${filter}`
  const res = await fetch(url, { headers })
  if (!res.ok) return 0
  const data = await res.json()
  const items: any[] = data.items || []
  return items.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
}

// ──────────────────────────────────────────────
// GET /api/finance/budgets?month=&year=
// Lists budgets with optional month/year filters and computes spent from expenses.
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const headers = getHeaders(token)

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")
    const yearParam = searchParams.get("year")

    // Build PocketBase filter for budgets
    const budgetFilters: string[] = []
    if (monthParam) {
      const m = Number(monthParam)
      if (m < 1 || m > 12) {
        return NextResponse.json(
          { success: false, error: "month must be between 1 and 12" },
          { status: 400 }
        )
      }
      budgetFilters.push(`month=${m}`)
    }
    if (yearParam) {
      budgetFilters.push(`year=${Number(yearParam)}`)
    }

    let url = `${pbUrl("budgets")}?perPage=500&sort=category`
    if (budgetFilters.length > 0) {
      url += `&filter=${encodeURIComponent(budgetFilters.join(" && "))}`
    }

    const res = await fetch(url, { headers })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch budgets: ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const budgets: any[] = data.items || []

    // Compute spent for each budget (parallel fetch)
    const enriched = await Promise.all(
      budgets.map(async (budget: any) => {
        const month = Number(budget.month)
        const year = Number(budget.year)
        const category = budget.category
        const budgetAmount = Number(budget.budgetAmount) || 0

        const spent = await computeSpent(headers, category, month, year)
        const variance = budgetAmount - spent

        return {
          ...budget,
          spent,
          variance,
        }
      })
    )

    // Build summary
    const totalBudget = enriched.reduce(
      (sum: number, b: any) => sum + (Number(b.budgetAmount) || 0),
      0
    )
    const totalSpent = enriched.reduce(
      (sum: number, b: any) => sum + (b.spent || 0),
      0
    )
    const categories = enriched.map((b: any) => {
      const budgetAmt = Number(b.budgetAmount) || 0
      const spentAmt = b.spent || 0
      return {
        category: b.category,
        budget: budgetAmt,
        spent: spentAmt,
        variance: budgetAmt - spentAmt,
        percentage: budgetAmt > 0 ? Math.round((spentAmt / budgetAmt) * 100) : 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        budgets: enriched,
        summary: {
          totalBudget,
          totalSpent,
          variance: totalBudget - totalSpent,
          categories,
        },
      },
    })
  } catch (error: any) {
    console.error("GET /api/finance/budgets error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────
// POST /api/finance/budgets — create a budget
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const errors: string[] = []
    if (!body.category) errors.push("category is required")
    else if (!VALID_CATEGORIES.includes(body.category)) {
      errors.push(
        `category must be one of: ${VALID_CATEGORIES.join(", ")}`
      )
    }
    if (body.month == null) errors.push("month is required")
    else if (body.month < 1 || body.month > 12) errors.push("month must be between 1 and 12")
    if (body.year == null) errors.push("year is required")
    if (body.budgetAmount == null) errors.push("budgetAmount is required")

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join("; ") }, { status: 400 })
    }

    const payload: Record<string, any> = {
      category: body.category,
      month: Number(body.month),
      year: Number(body.year),
      budgetAmount: Number(body.budgetAmount),
    }
    if (body.notes !== undefined) payload.notes = body.notes
    if (body.status !== undefined) payload.status = body.status
    else payload.status = "active"

    const token = await getAdminToken()
    const res = await fetch(pbUrl("budgets"), {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to create budget: ${text}` },
        { status: res.status }
      )
    }

    const record = await res.json()
    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/finance/budgets error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────
// PATCH /api/finance/budgets?id=xxx — update a budget
// ──────────────────────────────────────────────
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

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          {
            success: false,
            error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        )
      }
      payload.category = body.category
    }
    if (body.month !== undefined) {
      const m = Number(body.month)
      if (m < 1 || m > 12) {
        return NextResponse.json(
          { success: false, error: "month must be between 1 and 12" },
          { status: 400 }
        )
      }
      payload.month = m
    }
    if (body.year !== undefined) payload.year = Number(body.year)
    if (body.budgetAmount !== undefined) payload.budgetAmount = Number(body.budgetAmount)
    if (body.notes !== undefined) payload.notes = body.notes
    if (body.status !== undefined) payload.status = body.status

    const token = await getAdminToken()
    const res = await fetch(pbUrl("budgets", id), {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to update budget: ${text}` },
        { status: res.status }
      )
    }

    const record = await res.json()
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("PATCH /api/finance/budgets error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────
// DELETE /api/finance/budgets?id=xxx — delete a budget
// ──────────────────────────────────────────────
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
    const res = await fetch(pbUrl("budgets", id), {
      method: "DELETE",
      headers: getHeaders(token),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Failed to delete budget: ${text}` },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (error: any) {
    console.error("DELETE /api/finance/budgets error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
