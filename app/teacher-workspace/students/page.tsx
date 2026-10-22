"use client"

import WorkspaceShell from "@/components/teacher/WorkspaceShell"
import StudentProfileView from "@/components/teacher/StudentProfileView"
import { useLanguage } from "@/contexts/language-context"

/** 我的学生（独立页面，不再塞在标签页里） */
export default function TeacherStudentsPage() {
  const { t } = useLanguage()
  return (
    <WorkspaceShell title={t("我的学生")} description={t("我教的年级里的学生")}>
      {(teacher) => <StudentProfileView teacherId={teacher.id} />}
    </WorkspaceShell>
  )
}
