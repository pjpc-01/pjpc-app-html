"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import ClassManagement from "@/components/courses/ClassManagement"
import CourseScheduling from "@/components/courses/CourseScheduling"
import GradeGanttChart from "@/components/courses/GradeGanttChart"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function CourseManagementPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { userProfile } = useAuth()

  return (
    <PageLayout
      title={t('course.course_management')}
      description="管理课程设置和教学安排"
      userRole={userProfile?.role || "admin"}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回仪表板
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('course.course_management')}</h2>
          <ClassManagement />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">排课管理</h2>
          <CourseScheduling />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">年级时间表（甘特图）</h2>
          <GradeGanttChart />
        </section>
      </div>
    </PageLayout>
  )
}