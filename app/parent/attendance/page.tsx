"use client"

import React, { useState, useEffect } from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ClipboardCheck, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ParentAttendancePage() {
  const { children, loading } = useParentPortal()
  const searchParams = useSearchParams()
  const childId = searchParams?.get("child")
  const [attendance, setAttendance] = useState<Record<string, any[]>>({})
  const [fetching, setFetching] = useState(false)

  const filteredChildren = childId
    ? children.filter((c) => c.id === childId)
    : children

  useEffect(() => {
    if (filteredChildren.length === 0) return

    const fetchAttendance = async () => {
      setFetching(true)
      try {
        const results: Record<string, any[]> = {}
        for (const child of filteredChildren) {
          const res = await fetch(
            `/api/pocketbase-proxy/api/collections/attendance/records?perPage=20&sort=-created&filter=${encodeURIComponent(`studentId='${child.id}'`)}`
          )
          const data = await res.json()
          results[child.id] = data?.items || []
        }
        setAttendance(results)
      } catch (e) {
        console.error("Failed to fetch attendance:", e)
      } finally {
        setFetching(false)
      }
    }

    fetchAttendance()
  }, [filteredChildren])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">出勤记录</h1>
      <p className="text-gray-500">查看孩子的每日签到情况</p>

      {filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无数据</p>
          </CardContent>
        </Card>
      ) : (
        filteredChildren.map((child) => {
          const records = attendance[child.id] || []
          const present = records.filter((r: any) => r.status === "present").length
          const absent = records.filter((r: any) => r.status === "absent").length

          return (
            <Card key={child.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    {child.name}
                  </CardTitle>
                  {records.length > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> {present}天
                      </span>
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> {absent}天
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {fetching ? (
                  <Skeleton className="h-20 w-full" />
                ) : records.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">暂无出勤记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {records.slice(0, 10).map((rec: any) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-600">
                          {new Date(rec.date || rec.created).toLocaleDateString("zh-CN")}
                        </span>
                        <Badge variant={rec.status === "present" ? "default" : "destructive"}>
                          {rec.status === "present" ? "✅ 已签到" : "❌ 缺勤"}
                        </Badge>
                      </div>
                    ))}
                    {records.length > 10 && (
                      <p className="text-xs text-gray-400 text-center pt-2">
                        仅显示最近 10 条记录
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
