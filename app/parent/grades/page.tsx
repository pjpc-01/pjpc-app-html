"use client"

import React from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart3 } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ParentGradesPage() {
  const { children, loading, error } = useParentPortal()
  const searchParams = useSearchParams()
  const childId = searchParams?.get("child")

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const filtered = childId ? children.filter((c) => c.id === childId) : children

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">成绩查询</h1>
      <p className="text-gray-500">查看孩子的考试成绩与学习进度</p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无数据</p>
          </CardContent>
        </Card>
      ) : (
        filtered.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {child.name} — {child.grade}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {["华文", "国文", "英文", "数学", "科学", "其他"].map((subject) => (
                  <div key={subject} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">{subject}</div>
                    <div className="text-2xl font-bold text-gray-800">—</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * 成绩数据由教师录入，请联系管理员导入
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
