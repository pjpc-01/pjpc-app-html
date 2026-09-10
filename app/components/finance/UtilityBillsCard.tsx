"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Droplets, Building2, Home, School } from "lucide-react"

type Bill = {
  id: string
  provider: string
  account_name: string
  account_number: string
  branch: string
  amount: number
  bill_date?: string
  due_date?: string
  status?: string
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  "TNB": <Zap className="h-4 w-4 text-yellow-500" />,
  "Air Selangor": <Droplets className="h-4 w-4 text-blue-500" />,
}

const PROVIDER_LABELS: Record<string, string> = {
  "TNB": "电费",
  "Air Selangor": "水费",
}

const BRANCH_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  "Primary": { label: "小学", icon: <Home className="h-4 w-4 text-blue-500" /> },
  "Secondary": { label: "中学", icon: <School className="h-4 w-4 text-green-500" /> },
}

export default function UtilityBillsCard() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/utility-bills")
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data.bills)) setBills(data.bills)
        else if (data.error) setError(data.error)
      })
      .catch(() => setError("读取失败"))
      .finally(() => setLoading(false))
  }, [])

  // Show only the LATEST bill per account (by bill_date, fallback due_date)
  function billKey(b: Bill) { return `${b.provider}|${b.account_number}` }
  function billPeriodNum(b: Bill): number {
    const d = b.bill_date || b.due_date || ''
    const t = Date.parse(d)
    return isNaN(t) ? 0 : t
  }
  const latestByKey = new Map<string, Bill>()
  for (const b of bills) {
    const k = billKey(b)
    const prev = latestByKey.get(k)
    if (!prev || billPeriodNum(b) > billPeriodNum(prev)) latestByKey.set(k, b)
  }
  const latestBills = Array.from(latestByKey.values())

  // Group bills by branch → provider
  const branches: Record<string, { provider: string; bills: Bill[] }[]> = {}
  for (const b of latestBills) {
    const branch = b.branch || "Other"
    if (!branches[branch]) branches[branch] = []
    const provIdx = branches[branch].findIndex(p => p.provider === b.provider)
    if (provIdx >= 0) {
      branches[branch][provIdx].bills.push(b)
    } else {
      branches[branch].push({ provider: b.provider, bills: [b] })
    }
  }
  const total = latestBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            公用事业
          </span>
          {loading ? (
            <Badge variant="outline" className="text-base font-bold">加载中...</Badge>
          ) : (
            <Badge variant="outline" className="text-base font-bold">
              RM {total.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && bills.length === 0 && (
          <p className="text-sm text-gray-400">暂无账单数据</p>
        )}
        <div className="space-y-4">
          {Object.entries(branches).map(([branch, providers]) => {
            const branchTotal = providers
              .flatMap(p => p.bills)
              .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
            return (
              <div key={branch} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    {BRANCH_LABELS[branch]?.icon || null}
                    {BRANCH_LABELS[branch]?.label || branch}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    RM {branchTotal.toFixed(2)}
                  </Badge>
                </div>

                {providers.map(p => (
                  <div key={p.provider} className="ml-2 mt-2">
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                      {PROVIDER_ICONS[p.provider] || null}
                      <span>{PROVIDER_LABELS[p.provider] || p.provider}</span>
                      <span className="text-gray-400">({p.bills.length})</span>
                    </div>

                    {p.bills.map(bill => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{bill.account_name}</span>
                          <span className="text-xs text-gray-400">
                            {bill.account_number}
                            {bill.bill_date && ` · ${bill.bill_date}`}
                            {bill.due_date && ` · Due ${bill.due_date}`}
                          </span>
                        </div>
                        <div className="text-right ml-2">
                          <span className={`font-medium ${(Number(bill.amount) || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            RM {(Number(bill.amount) || 0).toFixed(2)}
                          </span>
                          {bill.status && bill.status !== 'Active' && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                              {bill.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}