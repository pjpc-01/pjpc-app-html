"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import ClassManagement from "@/components/courses/ClassManagement"
import CourseScheduling from "@/components/courses/CourseScheduling"
import GradeGanttChart from "@/components/courses/GradeGanttChart"
import GradeTimetableGrid from "@/components/courses/GradeTimetableGrid"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { goBackForRole } from "@/lib/back"

export default function CourseManagementPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { userProfile } = useAuth()
  // 课表两种看法：表格（各年级并排）/ 甘特图（统一时间轴）
  const [view, setView] = useState<"grid" | "gantt">("grid")

  return (
    <PageLayout
      title={t('course.course_management')}
      description={t("管理课程设置和教学安排")}
      userRole={userProfile?.role || "admin"}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button
          variant="outline"
          onClick={() => goBackForRole(userProfile?.role)}
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t(userProfile?.role === "teacher" ? "返回工作台" : "返回仪表板")}
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">{t("排课管理")}</h2>
          <CourseScheduling />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{view === "grid" ? t("各年级课表") : t("年级时间表（甘特图）")}</h2>
            <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setView("grid")}
                className={`rounded-md px-3 py-1 text-sm ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >{t("课表")}</button>
              <button
                onClick={() => setView("gantt")}
                className={`rounded-md px-3 py-1 text-sm ${view === "gantt" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >{t("甘特图")}</button>
            </div>
          </div>
          {view === "grid" ? <GradeTimetableGrid /> : <GradeGanttChart />}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t('course.course_management')}</h2>
          <ClassManagement />
        </section>
      </div>
    </PageLayout>
  )
}