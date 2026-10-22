"use client"

import WorkspaceShell from "@/components/teacher/WorkspaceShell"
import TeacherLeavePanel from "@/components/teacher/TeacherLeavePanel"
import { useLanguage } from "@/contexts/language-context"

/** 请假 */
export default function TeacherLeavePage() {
  const { t } = useLanguage()
  return (
    <WorkspaceShell title={t("请假")} description={t("提交请假申请并查看审批状态")}>
      {(teacher) => <TeacherLeavePanel teacherId={teacher.id} />}
    </WorkspaceShell>
  )
}
