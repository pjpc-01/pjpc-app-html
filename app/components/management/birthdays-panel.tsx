"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cake, Calendar, MapPin } from "lucide-react"
import { useStudents } from "@/hooks/useStudents"

interface BirthdaysPanelProps {
  center?: string | null
}

function formatDateToMonthDay(dateStr?: string) {
  if (!dateStr) return "--/--"
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}-${day}`
}

export default function BirthdaysPanel({ center }: BirthdaysPanelProps) {
  const { students, loading } = useStudents()

  const { monthBirthdays, next7Days } = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth() // 0-11
    const inSelectedCenter = (s: any) => !center || center === "all" || (s.center || "").toLowerCase() === center.toLowerCase()

    const monthList = students
      .filter((s: any) => inSelectedCenter(s) && !!s.dob)
      .filter((s: any) => new Date(s.dob).getMonth() === thisMonth)
      .map((s: any) => ({
        id: s.id,
        name: s.student_name || s.name || "未知",
        studentId: s.student_id || "",
        center: s.center || "",
        dob: s.dob,
        day: new Date(s.dob).getDate(),
      }))
      .sort((a, b) => a.day - b.day)

    const next7 = students
      .filter((s: any) => inSelectedCenter(s) && !!s.dob)
      .filter((s: any) => {
        const d = new Date(s.dob)
        const next = new Date(now.getFullYear(), d.getMonth(), d.getDate())
        const diff = (next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 7
      })
      .map((s: any) => ({
        id: s.id,
        name: s.student_name || s.name || "未知",
        studentId: s.student_id || "",
        center: s.center || "",
        dob: s.dob,
        day: new Date(s.dob).getDate(),
      }))
      .sort((a, b) => a.day - b.day)

    return { monthBirthdays: monthList, next7Days: next7 }
  }, [students, center])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5" />
          本月生日
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-600 py-6">加载中...</div>
        ) : monthBirthdays.length === 0 ? (
          <div className="text-center text-gray-500 py-6">本月无生日</div>
        ) : (
          <div className="space-y-3">
            {monthBirthdays.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name} <span className="text-gray-500">({s.studentId})</span></div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateToMonthDay(s.dob)}</span>
                    {s.center ? (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.center}</span>
                    ) : null}
                  </div>
                </div>
                <Badge variant="secondary">生日</Badge>
              </div>
            ))}
          </div>
        )}

        {next7Days.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-sm text-gray-500">未来 7 天</div>
            <div className="space-y-2">
              {next7Days.map((s) => (
                <div key={`${s.id}-next`} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="text-sm">
                    {s.name} <span className="text-gray-500">({s.studentId})</span>
                  </div>
                  <div className="text-xs text-gray-600">{formatDateToMonthDay(s.dob)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


