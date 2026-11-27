"use client"

import React, { useState, useEffect } from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CreditCard, ArrowLeftRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import PageHelpButton from "@/components/help/PageHelpButton"

const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "已付款", color: "default" },
  partially_paid: { label: "部分付款", color: "secondary" },
  overdue: { label: "逾期", color: "destructive" },
  issued: { label: "待付款", color: "outline" },
}

export default function ParentPaymentsPage() {
  const { t } = useLanguage()
  const { children, loading } = useParentPortal()
  const searchParams = useSearchParams()
  const childId = searchParams?.get("child")

  const [invoices, setInvoices] = useState<any[]>([])
  // invoices.paidAmount 这个字段全库是空的，已付金额只能从 payments 明细求和
  const [paidByInvoice, setPaidByInvoice] = useState<Record<string, number>>({})
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
        // 已作废（cancelled）和已删除的票不该出现在家长端
        const filter = `(${studentIds.map((id) => `studentId='${id}'`).join("||")}) && status!='cancelled' && deleted!=true`
        const res = await fetch(
          `/api/pocketbase-proxy/api/collections/invoices/records?perPage=50&sort=-created&filter=${encodeURIComponent(filter)}`
        )
        const data = await res.json()
        const list = data?.items || []
        setInvoices(list)

        // 已付金额：按发票 id 去 payments 汇总（每张票一条，最多 50 张）
        if (list.length > 0) {
          const invFilter = list.map((i: any) => `invoiceId='${i.id}'`).join("||")
          const payRes = await fetch(
            `/api/pocketbase-proxy/api/collections/payments/records?perPage=500&filter=${encodeURIComponent(invFilter + "&&deleted!=true")}`
          )
          const payData = await payRes.json().catch(() => null)
          const sums: Record<string, number> = {}
          for (const pay of payData?.items || []) {
            const key = pay.invoiceId || pay.invoice
            if (!key) continue
            sums[key] = (sums[key] || 0) + Number(pay.amount || 0)
          }
          setPaidByInvoice(sums)
        } else {
          setPaidByInvoice({})
        }
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
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{t('finance.payment_records')}</h1>
        <PageHelpButton title={t('finance.payment_records')} description={t("查看孩子的学费缴纳情况")} />
      </div>
      <p className="text-gray-500">{t("查看孩子的学费缴纳情况")}</p>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">{t("暂无缴费记录")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const student = filteredChildren.find((c) => c.id === inv.studentId)
            const status = STATUS_MAP[inv.status] || { label: inv.status, color: "outline" }
            const paid = paidByInvoice[inv.id] || 0
            const due = Math.max(0, Number(inv.totalAmount || 0) - paid)
            return (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{inv.invoiceNumber || `#${inv.id.slice(0, 8)}`}</span>
                        <Badge variant={status.color}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {student?.name || "未知学生"} · {new Date(inv.created || inv.date).toLocaleDateString("zh-CN")}
                      </div>
                      {(inv.period || inv.dueDate) && (
                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                          {inv.period && <span>{t("账期")} {inv.period}</span>}
                          {inv.dueDate && (
                            <span className={due > 0 && String(inv.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10) ? "text-red-600" : ""}>
                              {t("到期")} {String(inv.dueDate).slice(0, 10)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="whitespace-nowrap text-lg font-bold">
                        RM {Number(inv.totalAmount || 0).toFixed(2)}
                      </div>
                      {paid > 0 && (
                        <div className="text-xs text-gray-500">
                          {t("已付 RM")} {paid.toFixed(2)}
                        </div>
                      )}
                      {paid > 0 && due > 0 && (
                        <div className="text-xs text-orange-600">
                          {t("未收 RM")} {due.toFixed(2)}
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
