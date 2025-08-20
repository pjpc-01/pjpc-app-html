"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFees } from "@/hooks/useFees"

export const FeeDebugger = () => {
  const { fees, loading, error, loadFees } = useFees()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fee Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading 状态 */}
        {loading && <p className="text-blue-500">🔄 Loading fees...</p>}

        {/* Error 状态 */}
        {error && (
          <div className="text-red-500 mb-2">
            ❌ Error: {error}
          </div>
        )}

        {/* 没有数据 */}
        {!loading && !error && fees.length === 0 && (
          <p className="text-gray-500">⚠️ No fees found.</p>
        )}

        {/* 数据列表 */}
        {!loading && !error && fees.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {fees.map((fee) => (
              <li key={fee.id}>
                <span className="font-semibold">{fee.name}</span> —{" "}
                {fee.category || "未分类"} (RM {fee.amount})
              </li>
            ))}
          </ul>
        )}

        {/* Reload 按钮 */}
        <div className="mt-4">
          <Button onClick={loadFees} disabled={loading}>
            {loading ? "Refreshing..." : "Reload Fees"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

