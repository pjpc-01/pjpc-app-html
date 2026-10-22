"use client"

import Link from "next/link"
import WorkspaceShell from "@/components/teacher/WorkspaceShell"
import ClassSchedule from "@/components/teacher/ClassSchedule"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { FileEdit, BookOpen } from "lucide-react"

/** 我的课程：整周课表 + 作业入口 */
export default function TeacherCoursesPage() {
  const { t } = useLanguage()
  return (
    <WorkspaceShell title={t("我的课程")} description={t("我教的课和作业")}>
      {(teacher) => (
        <div className="space-y-6">
          <ClassSchedule teacherId={teacher.id} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><FileEdit className="h-4 w-4" />{t("作业管理")}</CardTitle>
              <CardDescription>{t("布置、查看和批改学生作业")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link href="/homework" className="rounded-lg border p-4 hover:bg-gray-50">
                  <FileEdit className="h-5 w-5 text-blue-600 mb-2" />
                  <p className="text-sm font-medium">{t("作业总览")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("查看所有作业和提交状态")}</p>
                </Link>
                <Link href="/homework/new" className="rounded-lg border p-4 hover:bg-gray-50">
                  <BookOpen className="h-5 w-5 text-green-600 mb-2" />
                  <p className="text-sm font-medium">{t("布置新作业")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("为学生布置新的作业和练习")}</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </WorkspaceShell>
  )
}
