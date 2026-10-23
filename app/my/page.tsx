"use client"

/**
 * 学生首页（总览）。
 *
 * 原来这页用标签页塞了六个模块；现在拆成导航栏里的独立页面，
 * 这里只留「我是谁 + 三个数字 + 今天几节课 + 各页入口」。
 */
import { useState } from "react"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome } from "@/hooks/useStudentHome"
import { formatGrade } from "@/lib/utils"
import { AlertCircle, Calendar, BookOpen, Trophy, Megaphone, CalendarCheck, FileText, ArrowRight, Award } from "lucide-react"

const LINKS = [
  { href: "/my/timetable", label: "我的课表", icon: Calendar },
  { href: "/my/homework", label: "我的作业", icon: BookOpen },
  { href: "/my/points", label: "我的积分", icon: Trophy },
  { href: "/my/notices", label: "公告", icon: Megaphone },
  { href: "/my/leave", label: "请假", icon: CalendarCheck },
  { href: "/my/reports", label: "我的报告", icon: FileText },
  { href: "/my/achievements", label: "我的成就", icon: Award },
]

export default function MyPage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()
  const [bannerClosed, setBannerClosed] = useState(false)

  // 点「知道了」= 记成看过了，下次不再弹
  const dismissBanner = async () => {
    setBannerClosed(true)
    try {
      await fetch("/api/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_seen" }),
      })
    } catch { /* 关掉就算了，不影响页面 */ }
  }

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的")} description={t("我的资料、积分、报告与考勤")}>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)

  if (error || !data) {
    return shell(
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-red-600 font-medium flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />{error || t("加载失败")}
          </p>
          <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={reload}>{t("重新加载")}</button>
        </CardContent>
      </Card>
    )
  }

  const s = data.student
  const today = data.today || { classes: [] }

  const fresh: any[] = (data as any)?.achievements?.fresh || []

  return shell(
    <>
      {fresh.length > 0 && !bannerClosed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="text-2xl leading-none">🎉</div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">{t("你解锁了新成就")}</p>
              <p className="mt-1 text-sm text-amber-800">
                {fresh.map((a: any) => `${a.icon || "🏅"} ${t(a.name)}`).join("　")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/my/achievements" className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
                  {t("去设称号")}
                </Link>
                <button onClick={dismissBanner} className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100">
                  {t("知道了")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-500">
            {String(s?.name || "?").slice(0, 1)}
          </div>
          <div>
            <div className="text-xl font-semibold">{s?.name || "-"}</div>
            <div className="text-sm text-gray-500 mt-1">
              {s?.student_id || "-"} · {formatGrade(s?.grade, s?.is_peralihan) || "-"} · {s?.center || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("总积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.points?.total ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("本月积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.points?.monthly ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("待交作业")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.pending_homework ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("今天")} · {today.weekday_zh}</CardTitle>
        </CardHeader>
        <CardContent>
          {(today.classes || []).length === 0 ? (
            <p className="text-sm text-gray-500">{t("今天没有课")}</p>
          ) : (
            <ul className="divide-y">
              {today.classes.map((c: any) => (
                <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                  <span>{c.course}{c.teacher ? ` · ${c.teacher}` : ""}</span>
                  <span className="text-gray-600">{String(c.start_time || "").slice(0, 5)}–{String(c.end_time || "").slice(0, 5)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/my/timetable" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            {t("看整周课表")}<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LINKS.map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="flex items-center gap-2 rounded-lg border bg-white px-3 py-3 text-sm hover:bg-gray-50"
          >
            <x.icon className="h-4 w-4 text-gray-500" />{t(x.label)}
          </Link>
        ))}
      </div>
    </>
  )
}
