"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Clock } from "lucide-react"

/** 我的排班/打卡记录（从教师工作台标签页搬出来，独立成一页） */
export default function AttendanceAndPoints({ teacherId }: { teacherId: string }) {
  const { t } = useLanguage()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const month = new Date().toISOString().slice(0, 7)
        const res = await fetch(
          `/api/attendance/person-calendar?person_id=${encodeURIComponent(teacherId)}&person_type=teacher&month=${month}`
        )
        const data = await res.json()
        if (data.success && data.calendar) {
          setRecords(Object.entries(data.calendar))
        } else if (data.error) {
          setError(data.error)
        }
      } catch (e: any) {
        setError(e?.message || "加载失败")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teacherId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("我的排班/打卡记录")}
        </CardTitle>
        <CardDescription>{t("查看您本月的签到与签退记录")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t("本月暂无打卡记录")}</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-x-auto">
            {records.map(([date, info]: any) => (
              <div key={date} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg min-w-[320px]">
                <span className="text-sm text-gray-600">{date}</span>
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="outline" className="text-green-600">{t("进")} {info.check_ins?.length || 0}</Badge>
                  <Badge variant="outline" className="text-blue-600">{t("出")} {info.check_outs?.length || 0}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
