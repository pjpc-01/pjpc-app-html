"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome } from "@/hooks/useStudentHome"
import { AlertCircle, Megaphone } from "lucide-react"

/** 公告：中心发的通知 */
export default function MyNoticesPage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("公告")} description={t("中心发布的通知")}>
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

  const notices = data.notices || []

  return shell(
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" />{t("公告")}</CardTitle></CardHeader>
      <CardContent>
        {notices.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂时没有公告")}</p> : (
          <ul className="divide-y">
            {notices.map((n: any) => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-xs text-gray-400">{String(n.date || "").slice(0, 10)}</span>
                </div>
                {n.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
