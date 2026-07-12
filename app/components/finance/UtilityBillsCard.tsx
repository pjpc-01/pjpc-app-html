"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Droplets, Building2, Home, School } from "lucide-react"

// Utility bills data - synced from TNB & Air Selangor scrapers
const UTILITY_DATA = {
  Primary: {
    "TNB": [
      { account_name: "BATU14 101A", account_number: "220077881101", amount: 479.92, bill_date: "09-Jul-2026", status: "Active" },
      { account_name: "BATU 98B", account_number: "220077824105", amount: 0.00, bill_date: "28-Jun-2026", status: "Inactive" },
    ],
    "Air Selangor": [
      { account_name: "BATU14 101A", account_number: "9834001000", amount: 115.85, due_date: "21-Jul-2026", status: "Active" },
      { account_name: "BATU14 98B", account_number: "1363880000", amount: 17.85, due_date: "21-Jul-2026", status: "Active" },
    ],
  },
  Secondary: {
    "TNB": [
      { account_name: "PU1 Daycare", account_number: "220104544209", amount: 407.75, bill_date: "08-Jul-2026", status: "Active" },
    ],
    "Air Selangor": [
      { account_name: "PU1", account_number: "2837070000", amount: 145.85, due_date: "20-Jul-2026", status: "Active" },
    ],
  },
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

function calcTotal(data: typeof UTILITY_DATA) {
  let sum = 0
  for (const branch of Object.values(data)) {
    for (const bills of Object.values(branch)) {
      for (const b of bills) {
        sum += b.amount
      }
    }
  }
  return sum
}

export default function UtilityBillsCard() {
  const total = calcTotal(UTILITY_DATA)
  const branches = Object.keys(UTILITY_DATA)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            公用事业
          </span>
          <Badge variant="outline" className="text-base font-bold">
            RM {total.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {branches.map(branch => {
            const providers = UTILITY_DATA[branch as keyof typeof UTILITY_DATA]
            const branchTotal = Object.values(providers)
              .flat()
              .reduce((sum, b) => sum + b.amount, 0)

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

                {Object.entries(providers).map(([provider, bills]) => (
                  <div key={provider} className="ml-2 mt-2">
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                      {PROVIDER_ICONS[provider] || null}
                      <span>{PROVIDER_LABELS[provider] || provider}</span>
                      <span className="text-gray-400">({bills.length})</span>
                    </div>

                    {bills.map((bill, idx) => (
                      <div
                        key={idx}
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
                          <span className={`font-medium ${bill.amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            RM {bill.amount.toFixed(2)}
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
