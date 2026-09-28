"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import TeacherPerformanceManagement from "@/components/teacher/TeacherPerformanceManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function TeacherPerformancePage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { t } = useLanguage()

  return (
    <PageLayout
      title={t("绩效管理")}
      description={t("查看和管理教师绩效考核")}
      userRole="admin"
      status={t("系统正常")}
      background="bg-gray-50"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("返回仪表板")}
        </Button>
      }
    >
      <TeacherPerformanceManagement />
    </PageLayout>
  )
}