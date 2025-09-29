"use client"

import React from "react"
import PageLayout from "@/components/layouts/PageLayout"
import StudentManagementPage from "../components/management/student-management-page"

export default function StudentManagement() {
  return (
    <PageLayout
      title="学生管理系统"
      description="管理学生档案、学习进度和出勤记录"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-blue-50 to-purple-50"
    >
      <StudentManagementPage />
    </PageLayout>
  )
}

