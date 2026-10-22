"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome } from "@/hooks/useStudentHome"
import { AlertCircle, Trophy } from "lucide-react"

/** 我的积分：总分、本月、流水（只能看自己） */
export default function MyPointsPage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的积分")} description={t("我的积分和每一次变动")}>
      <div className="p-4 md:p-6 max-w-4xl">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)
  if (error || !data) {
    return shell(
      <Card><CardContent className="py-10 text-center">
        <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error || t("加载失败")}</p>
        <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={reload}>{t("重新加载")}</button>
      </CardContent></Card>
    )
  }

  const p = data.points || { total: 0, monthly: 0, recent: [] }

  return shell(
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("总积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{p.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("本月积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{p.monthly}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" />{t("积分流水")}</CardTitle>
          <CardDescription>{t("最近")} {(p.recent || []).length} {t("条")}</CardDescription>
        </CardHeader>
        <CardContent>
          {(p.recent || []).length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂无记录")}</p> : (
            <ul className="divide-y">
              {(p.recent || []).map((x: any) => (
                <li key={x.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p>{x.reason || "-"}</p>
                    <p className="text-xs text-gray-400">{String(x.created || "").slice(0, 10)}</p>
                  </div>
                  <span className={Number(x.amount) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {Number(x.amount) > 0 ? "+" : ""}{x.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
