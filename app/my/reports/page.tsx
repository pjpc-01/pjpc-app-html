"use client"

import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, FileText } from "lucide-react"

/**
 * 我的报告。
 * 走代理读 student_reports —— 代理会按登录学生自动加「只看自己」的条件。
 */
export default function MyReportsPage() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/pocketbase-proxy/api/collections/student_reports/records?perPage=50&sort=-created")
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.message || d?.error || `加载失败（HTTP ${r.status}）`)
      setRows(d?.items || [])
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <PageLayout title={t("我的报告")} description={t("每个学期的成绩报告")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">
        {loading ? (
          <p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>
        ) : error ? (
          <Card><CardContent className="py-10 text-center">
            <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>
            <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={load}>{t("重新加载")}</button>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />{t("报告列表")}</CardTitle></CardHeader>
            <CardContent>
              {rows.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("还没有报告")}</p> : (
                <ul className="divide-y">
                  {rows.map((r) => (
                    <li key={r.id} className="py-2.5 flex items-center justify-between">
                      <span className="text-sm">{r.term || "-"} · {r.year || "-"}</span>
                      <a className="text-sm text-blue-600 hover:underline" href={`/student-report/${r.id}`}>{t("查看")}</a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
