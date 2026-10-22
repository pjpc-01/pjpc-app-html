"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome } from "@/hooks/useStudentHome"
import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react"

/** 我的作业：未交 / 已交 / 已批（带分数） */
export default function MyHomeworkPage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的作业")} description={t("老师布置的作业和批改结果")}>
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

  const hw = data.homework || []
  const pending = hw.filter((h: any) => !h.submitted)
  const done = hw.filter((h: any) => h.submitted)

  return shell(
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" />{t("作业清单")}</CardTitle>
        <CardDescription>{t("未交")} {pending.length} {t("项")} · {t("已交")} {done.length} {t("项")}</CardDescription>
      </CardHeader>
      <CardContent>
        {hw.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂时没有作业")}</p> : (
          <ul className="divide-y">
            {hw.map((h: any) => (
              <li key={h.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t(h.subject)} · {t("截止")} {String(h.dueDate || "").slice(0, 10)}</p>
                    {h.description && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{h.description}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    {h.submitted ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {h.submissionStatus === "graded" ? `${t("已批")} ${h.score ?? ""}` : t("已交")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="h-3.5 w-3.5" />{t("未交")}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
