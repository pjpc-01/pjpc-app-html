"use client"

import WorkspaceShell from "@/components/teacher/WorkspaceShell"
import AttendanceAndPoints from "@/components/teacher/AttendanceAndPoints"
import TeacherStats from "@/components/teacher/TeacherStats"
import { useLanguage } from "@/contexts/language-context"

/** 我的考勤与积分 */
export default function TeacherAttendancePage() {
  const { t } = useLanguage()
  return (
    <WorkspaceShell title={t("我的考勤与积分")} description={t("本月签到记录与教学统计")}>
      {(teacher) => (
        <div className="space-y-6">
          <AttendanceAndPoints teacherId={teacher.id} />
          <TeacherStats teacherId={teacher.id} />
        </div>
      )}
    </WorkspaceShell>
  )
}
