"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import { useLanguage } from "@/contexts/language-context"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Users, FileEdit, ClipboardCheck, BookOpen, Calendar } from "lucide-react"

/**
 * 教师各页共用的外壳：处理登录态、教师档案、没绑档案的兜底。
 * 子页面只管写内容，不用每页重复写一遍加载/兜底。
 */
export default function WorkspaceShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: (teacher: any) => React.ReactNode
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { teacher, loading, error } = useCurrentTeacher()

  if (loading) {
    return (
      <PageLayout title={title} description={description} userRole="teacher" background="bg-gray-50" backUrl="/teacher-workspace">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("加载中...")}</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !teacher) {
    const links = [
      { href: "/student-management", label: t("学生列表"), icon: Users },
      { href: "/homework", label: t("作业管理"), icon: FileEdit },
      { href: "/grades", label: t("成绩管理"), icon: ClipboardCheck },
      { href: "/course-management", label: t("课程管理"), icon: BookOpen },
      { href: "/student-leave", label: t("学生请假"), icon: Calendar },
    ]
    return (
      <PageLayout title={title} description={description} userRole="teacher" status={t("待绑定档案")} background="bg-gray-50" backUrl="/teacher-workspace">
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("这个账号还没有绑定教师档案，所以看不到课表、学生和考勤。")}
              <br />
              {t("请管理员到「用户管理 → 绑定档案」给你选一位教师；绑定后刷新即可。")}
              {error ? <span className="block text-xs text-gray-500 mt-1">{error}</span> : null}
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("我的账号")}</CardTitle>
              <CardDescription>{user?.email || ""}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-gray-500">{t("姓名")}: </span>{user?.name || "-"}</p>
              <p><span className="text-gray-500">{t("角色")}: </span>{t("教师")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("可以先用的页面")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-gray-50">
                    <l.icon className="h-4 w-4 text-gray-500" />{l.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={title}
      description={description || `欢迎回来，${teacher.name || ""}`}
      userRole="teacher"
      backUrl="/teacher-workspace"
      status="系统正常"
      background="bg-gray-50"
    >
      {children(teacher)}
    </PageLayout>
  )
}
