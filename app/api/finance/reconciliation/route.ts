import { NextRequest, NextResponse } from "next/server"

// Bank reconciliation auto-match API
// Matches unreconciled bank transactions against invoices, payments, and expenses

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "final_admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "final_pass"

const AMOUNT_TOLERANCE = 0.02 // allow ±$0.02 difference

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error("Admin auth failed")
  const data = await res.json()
  return data.token
}

async function getAdminHeaders(): Promise<Record<string, string>> {
  const token = await getAdminToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function pbGet(headers: Record<string, string>, collection: string, options: Record<string, string> = {}): Promise<any> {
  const params = new URLSearchParams(options)
  const url = `${PB_URL}/api/collections/${collection}/records${params.toString() ? "?" + params.toString() : ""}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PB GET ${collection} failed: ${res.status} — ${text}`)
  }
  return res.json()
}

async function pbUpdate(headers: Record<string, string>, collection: string, id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PB PATCH ${collection}/${id} failed: ${res.status} — ${text}`)
  }
  return res.json()
}

async function pbCreate(headers: Record<string, string>, collection: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PB POST ${collection} failed: ${res.status} — ${text}`)
  }
  return res.json()
}

/** Compare two amounts within a small tolerance */
function amountsMatch(a: number, b: number, tolerance: number = AMOUNT_TOLERANCE): boolean {
  return Math.abs(a - b) <= tolerance
}

/** Check if two dates are within N days of each other */
function datesWithin(dateA: string, dateB: string, maxDays: number): boolean {
  const dA = new Date(dateA).getTime()
  const dB = new Date(dateB).getTime()
  if (isNaN(dA) || isNaN(dB)) return false
  const diffDays = Math.abs(dA - dB) / (1000 * 60 * 60 * 24)
  return diffDays <= maxDays
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bankAccountId, startDate, endDate, startingBalance, endingBalance } = body

    // --- Validate required fields ---
    if (!bankAccountId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bankAccountId, startDate, endDate" },
        { status: 400 }
      )
    }

    const headers = await getAdminHeaders()

    // --- 1. Fetch all unreconciled bank transactions for this account in date range ---
    const filterStr = `bankAccountId="${bankAccountId}" && reconciled=false && date>="${startDate}" && date<="${endDate}"`
    const txResult = await pbGet(headers, "bank_transactions", {
      filter: filterStr,
      perPage: "500",
      sort: "date",
    })
    const transactions = txResult.items || []

    let matchedCount = 0
    let unmatchedCount = 0
    const matchedDetails: Array<{
      transactionId: string
      matchType: "invoice" | "payment" | "expense"
      matchedTo: string
      amount: number
    }> = []

    // --- 2. For each bank transaction, try to auto-match ---
    for (const tx of transactions) {
      const txAmount = tx.amount || 0
      const txDate = tx.date || tx.created
      let matched = false

      // --- 2a. Try to match against invoices (totalAmount ≈ amount) ---
      if (!matched) {
        try {
          const invFilter = `totalAmount~${txAmount} && status!="paid"`
          const invResult = await pbGet(headers, "invoices", {
            filter: invFilter,
            perPage: "50",
          })
          for (const invoice of invResult.items || []) {
            const invAmount = invoice.totalAmount || 0
            if (amountsMatch(txAmount, invAmount)) {
              // Update the bank transaction
              await pbUpdate(headers, "bank_transactions", tx.id, {
                matchedTo: invoice.id,
                matchType: "invoice",
                reconciled: true,
              })
              matched = true
              matchedCount++
              matchedDetails.push({
                transactionId: tx.id,
                matchType: "invoice",
                matchedTo: invoice.id,
                amount: txAmount,
              })
              break
            }
          }
        } catch (err) {
          console.warn(`Invoice match error for tx ${tx.id}:`, err)
        }
      }

      // --- 2b. Try to match against payments (amount ≈ amount, date within 3 days) ---
      if (!matched) {
        try {
          const pmtFilter = `amount~${txAmount}`
          const pmtResult = await pbGet(headers, "payments", {
            filter: pmtFilter,
            perPage: "50",
          })
          for (const payment of pmtResult.items || []) {
            const pmtAmount = payment.amount || 0
            const pmtDate = payment.payment_date || payment.created
            if (amountsMatch(txAmount, pmtAmount) && datesWithin(txDate, pmtDate, 3)) {
              await pbUpdate(headers, "bank_transactions", tx.id, {
                matchedTo: payment.id,
                matchType: "payment",
                reconciled: true,
              })
              matched = true
              matchedCount++
              matchedDetails.push({
                transactionId: tx.id,
                matchType: "payment",
                matchedTo: payment.id,
                amount: txAmount,
              })
              break
            }
          }
        } catch (err) {
          console.warn(`Payment match error for tx ${tx.id}:`, err)
        }
      }

      // --- 2c. Try to match against expenses (amount ≈ amount, date within 3 days) ---
      if (!matched) {
        try {
          const expFilter = `amount~${txAmount}`
          const expResult = await pbGet(headers, "expenses", {
            filter: expFilter,
            perPage: "50",
          })
          for (const expense of expResult.items || []) {
            const expAmount = expense.amount || 0
            const expDate = expense.expense_date || expense.created
            if (amountsMatch(txAmount, expAmount) && datesWithin(txDate, expDate, 3)) {
              await pbUpdate(headers, "bank_transactions", tx.id, {
                matchedTo: expense.id,
                matchType: "expense",
                reconciled: true,
              })
              matched = true
              matchedCount++
              matchedDetails.push({
                transactionId: tx.id,
                matchType: "expense",
                matchedTo: expense.id,
                amount: txAmount,
              })
              break
            }
          }
        } catch (err) {
          console.warn(`Expense match error for tx ${tx.id}:`, err)
        }
      }

      // If still unmatched after all three attempts
      if (!matched) {
        unmatchedCount++
      }
    }

    // --- 3. Create reconciliation_runs record ---
    const runRecord = await pbCreate(headers, "reconciliation_runs", {
      bankAccountId: bankAccountId,
      runDate: new Date().toISOString(),
      startDate: startDate,
      endDate: endDate,
      startingBalance: startingBalance || 0,
      endingBalance: endingBalance || 0,
      totalTransactions: transactions.length,
      matchedTransactions: matchedCount,
      unmatchedTransactions: unmatchedCount,
      status: matchedCount > 0 ? "completed" : "no_matches",
    })

    // --- 4. Return summary ---
    return NextResponse.json({
      success: true,
      data: {
        matched: matchedCount,
        unmatched: unmatchedCount,
        total: transactions.length,
        runId: runRecord.id,
        startingBalance: startingBalance || 0,
        endingBalance: endingBalance || 0,
        details: matchedDetails,
      },
    })
  } catch (error: any) {
    console.error("Reconciliation error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
