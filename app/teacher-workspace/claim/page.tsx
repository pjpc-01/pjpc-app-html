"use client"

import WorkspaceShell from "@/components/teacher/WorkspaceShell"
import TeacherClaimPanel from "@/components/teacher/TeacherClaimPanel"
import { useLanguage } from "@/contexts/language-context"

/** 报销单 */
export default function TeacherClaimPage() {
  const { t } = useLanguage()
  return (
    <WorkspaceShell title={t("报销单")} description={t("提交开销报销并查看审批状态")}>
      {(teacher) => <TeacherClaimPanel teacherId={teacher.id} />}
    </WorkspaceShell>
  )
}
