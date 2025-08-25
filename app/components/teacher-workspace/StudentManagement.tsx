"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStudents } from "@/hooks/useStudents"

interface StudentManagementProps {
  teacherId?: string
}

export default function StudentManagement({ teacherId }: StudentManagementProps) {
  const { students, loading, error, refetch } = useStudents()
  
  useEffect(() => {
    console.log('TeacherWorkspace StudentManagement: 学生数据状态:', {
      totalStudents: students.length,
      loading,
      error
    })
  }, [students, loading, error])

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading students: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">
            学生管理
          </h3>
          <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium">
              {loading ? '加载中...' : `总学生数: ${students.length}`}
            </p>
            {students.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                第一个学生: {students[0]?.student_name || '未知'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
