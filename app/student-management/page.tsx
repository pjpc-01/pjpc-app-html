"use client"

import React from "react"
import { useLanguage } from "@/contexts/language-context"
import PageLayout from "@/components/layouts/PageLayout"
import StudentManagementPage from "../components/management/student-management-page"

export default function StudentManagement() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("学生管理系统")}
      description={t("管理学生档案、学习进度和出勤记录")}
      backUrl="/"
      userRole="admin"
      status={t("系统正常")}
    >
      <StudentManagementPage />
    </PageLayout>
  )
}

