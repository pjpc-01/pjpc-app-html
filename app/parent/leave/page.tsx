"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useParentPortal } from "@/hooks/useParentPortal"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CalendarDays, Loader2, Plane, UserRoundPlus } from "lucide-react"

const LEAVE_TYPES = [
  { value: "sick", label: "病假" },
  { value: "personal", label: "事假" },
  { value: "emergency", label: "紧急请假" },
  { value: "other", label: "其他" },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 1
  const s = new Date(start + "T00:00:00")
  const e = new Date(end + "T00:00:00")
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1
  return Math.max(1, diff)
}

export default function ParentLeavePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { children, loading, error } = useParentPortal()

  const initialChild = searchParams?.get("child") || ""
  const [studentId, setStudentId] = useState(initialChild)
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const selectedChild = children.find((c) => c.id === studentId)
  const totalDays = calcDays(startDate, endDate)

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error(t("请选择孩子"))
      return
    }
    if (!leaveType) {
      toast.error(t("请选择请假类型"))
      return
    }
    if (!startDate || !endDate) {
      toast.error(t("请选择请假日期"))
      return
    }
    if (!reason.trim()) {
      toast.error(t("请填写请假原因"))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/student-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          reason: reason.trim(),
          status: "pending",
          applied_date: todayStr(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(t("请假申请已提交，等待审核"))
        setSubmitting(false)
        router.push("/parent/attendance")
      } else {
        toast.error(data?.error || t("提交失败，请稍后再试"))
        setSubmitting(false)
      }
    } catch (e) {
      console.error("提交请假失败:", e)
      toast.error(t("提交失败，请稍后再试"))
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
        <CalendarDays className="h-5 w-5 text-indigo-600" />
        {t("家长请假申请")}
      </h1>
      <p className="text-sm text-gray-500">{t("为孩子提交请假申请，提交后将等待老师审核")}</p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserRoundPlus className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">{t("暂无孩子信息")}</p>
            <p className="text-gray-400 text-sm mb-4">{t("请联系管理员关联您的孩子后，再提交请假申请")}</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/parent/dashboard")}>
              {t("返回首页")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {t("请假表单")}
            </CardTitle>
            <CardDescription>{t("请填写请假信息")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 选择孩子 */}
            <div className="space-y-2">
              <Label>{t("选择孩子")}</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("请选择孩子")} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.grade || "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 请假类型 */}
            <div className="space-y-2">
              <Label>{t("请假类型")}</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("请选择请假类型")} />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      {t(lt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 日期 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("开始日期")}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("结束日期")}</Label>
                <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* 天数 */}
            {selectedChild && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                {t("共")} <span className="font-semibold text-indigo-600">{totalDays}</span> {t("天")}
              </div>
            )}

            {/* 原因 */}
            <div className="space-y-2">
              <Label>{t("请假原因")}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("请填写请假原因")}
                rows={4}
              />
            </div>

            {/* 提交 */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("提交申请")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/parent/attendance")}
                disabled={submitting}
              >
                {t("取消")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}