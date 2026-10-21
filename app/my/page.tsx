"use client"

/**
 * 学生中心（学生账号登录后看到的第一页，也是唯一一页）
 *
 * 铁律：这一页所有数据都靠代理自动加「只看自己」的条件，
 *      前端不需要（也不应该）自己传 studentId —— 传了也会被服务端 AND 掉。
 */
import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatGrade } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

const API = "/api/pocketbase-proxy/api/collections"

type Any_ = Record<string, any>

export default function MyPage() {
  const { t } = useLanguage()
  const [me, setMe] = useState<Any_ | null>(null)
  const [pts, setPts] = useState<Any_ | null>(null)
  const [logs, setLogs] = useState<Any_[]>([])
  const [reports, setReports] = useState<Any_[]>([])
  const [att, setAtt] = useState<Any_[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const [rMe, rPts, rLogs, rRep, rAtt] = await Promise.all([
          fetch(`${API}/students/records?perPage=1`),
          fetch(`${API}/points/records?perPage=1&sort=-updated`),
          fetch(`${API}/point_logs/records?perPage=10&sort=-created`),
          fetch(`${API}/student_reports/records?perPage=20&sort=-created`),
          fetch(`${API}/student_attendance/records?perPage=30&sort=-date`),
        ])
        if (!rMe.ok) {
          const body = await rMe.json().catch(() => ({} as Any_))
          throw new Error(body?.error || body?.message || `加载失败（HTTP ${rMe.status}）`)
        }
        const dMe = await rMe.json()
        setMe(dMe?.items?.[0] || null)
        setPts((await rPts.json().catch(() => ({})))?.items?.[0] || null)
        setLogs((await rLogs.json().catch(() => ({})))?.items || [])
        setReports((await rRep.json().catch(() => ({})))?.items || [])
        setAtt((await rAtt.json().catch(() => ({})))?.items || [])
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const presentDays = att.filter((a) => String(a.status || "") !== "absent").length

  return (
    <PageLayout title={t("我的")} description={t("我的资料、积分、报告与考勤")}>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl">
        {loading ? (
          <p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={() => location.reload()}>
                {t("重新加载")}
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-500">
                  {String(me?.name || "?").slice(0, 1)}
                </div>
                <div>
                  <div className="text-xl font-semibold">{me?.name || "-"}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {me?.student_id || "-"} · {formatGrade(me?.grade, me?.is_peralihan) || "-"} · {me?.center || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("总积分")}</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{pts?.total_points ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("本月积分")}</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{pts?.monthly_points ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("出勤天数")}</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-semibold">{presentDays}</div></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("我的报告")}</CardTitle></CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">{t("还没有报告")}</p>
                ) : (
                  <ul className="divide-y">
                    {reports.map((r) => (
                      <li key={r.id} className="py-2 flex items-center justify-between">
                        <span className="text-sm">
                          {r.term || "-"} · {r.year || "-"}
                        </span>
                        <a className="text-sm text-blue-600 hover:underline" href={`/student-report/${r.id}`}>
                          {t("查看")}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("最近积分变动")}</CardTitle></CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">{t("暂无记录")}</p>
                ) : (
                  <ul className="divide-y">
                    {logs.map((l) => (
                      <li key={l.id} className="py-2 flex items-center justify-between text-sm">
                        <span>{l.reason || "-"}</span>
                        <span className={Number(l.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                          {Number(l.amount) >= 0 ? "+" : ""}{l.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("最近考勤")}</CardTitle></CardHeader>
              <CardContent>
                {att.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">{t("暂无记录")}</p>
                ) : (
                  <ul className="divide-y">
                    {att.slice(0, 10).map((a) => (
                      <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                        <span>{String(a.date || "").slice(0, 10)}</span>
                        <span className="text-gray-500">
                          {String(a.check_in || "").slice(11, 16) || "-"} → {String(a.check_out || "").slice(11, 16) || "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}
