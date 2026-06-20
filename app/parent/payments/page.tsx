"use client"

import React, { useState, useEffect } from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CreditCard, ArrowLeftRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useSearchParams } from "next/navigation"

const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "已付款", color: "default" },
  partially_paid: { label: "部分付款", color: "secondary" },
  overdue: { label: "逾期", color: "destructive" },
  issued: { label: "待付款", color: "outline" },
}

export default function ParentPaymentsPage() {
  const { children, loading } = useParentPortal()
  const searchParams = useSearchParams()
  const childId = searchParams?.get("child")

  const [invoices, setInvoices] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  const filteredChildren = childId
    ? children.filter((c) => c.id === childId)
    : children

  useEffect(() => {
    if (filteredChildren.length === 0) return

    const fetchInvoices = async () => {
      setFetching(true)
      try {
        // Fetch invoices for all visible children
        const studentIds = filteredChildren.map((c) => c.id)
        const filter = studentIds.map((id) => `studentId='${id}'`).join("||")
        const res = await fetch(
          `/api/pocketbase-proxy/api/collections/invoices/records?perPage=50&sort=-created&filter=${encodeURIComponent(filter)}`
        )
        const data = await res.json()
        setInvoices(data?.items || [])
      } catch (e) {
        console.error("Failed to fetch invoices:", e)
      } finally {
        setFetching(false)
      }
    }

    fetchInvoices()
  }, [filteredChildren])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">缴费记录</h1>
      <p className="text-gray-500">查看孩子的学费缴纳情况</p>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无缴费记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const student = filteredChildren.find((c) => c.id === inv.studentId)
            const status = STATUS_MAP[inv.status] || { label: inv.status, color: "outline" }
            return (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inv.invoiceNumber || `#${inv.id.slice(0, 8)}`}</span>
                        <Badge variant={status.color}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {student?.name || "未知学生"} · {new Date(inv.created || inv.date).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        RM {Number(inv.totalAmount || inv.amount || 0).toFixed(2)}
                      </div>
                      {inv.paidAmount && (
                        <div className="text-xs text-gray-400">
                          已付 RM {Number(inv.paidAmount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
