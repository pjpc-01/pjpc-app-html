"use client"

import PageLayout from "@/components/layouts/PageLayout"
import TeacherScheduleSection from "@/app/components/attendance/TeacherScheduleSection"
import TeacherLeaveManagement from "@/components/teacher/TeacherLeaveManagement"
import { useLanguage } from "@/contexts/language-context"

/**
 * 教师考勤与排班页
 * - 教师排班管理（月视图 + 工时面板）
 * - 请假管理
 * 考勤记录查询已迁移到「考勤中心」的统一筛选报表，本页不再重复显示。
 */
export default function TeacherAttendanceReportsPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("教师排班")}
      description={t("教师排班管理 + 请假管理，考勤记录查询请到考勤中心")}
      backUrl="/"
      userRole="admin"
      status={t("系统正常")}
      background="from-green-50 to-emerald-100"
    >
      <div className="space-y-6">
        {/* 排班管理（月视图 + 工时面板） */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t("教师排班管理")}</h2>
          <TeacherScheduleSection />
        </section>

        {/* 请假管理 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t("请假管理")}</h2>
          <TeacherLeaveManagement />
        </section>
      </div>
    </PageLayout>
  )
}