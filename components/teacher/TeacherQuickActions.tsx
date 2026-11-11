"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import {
  Zap, ClipboardCheck, FileText, BookOpen, Star, UserCheck, CalendarCheck, MessageSquarePlus,
} from "lucide-react"

/**
 * 教师工作台的快速操作。原来长在 TeacherDashboard 里，
 * 工作台只留「排班日历 + 今日待办 + 快速操作」，所以单独拆出来。
 * 七个入口由老板定：教学评估、学生报告、课程、积分、点名、请假、建议箱。
 */
const ACTIONS = [
  { href: "/teacher-teaching-report", key: "教学评估", icon: ClipboardCheck },
  { href: "/student-reports", key: "学生报告", icon: FileText },
  { href: "/teacher-workspace/courses", key: "课程", icon: BookOpen },
  { href: "/points", key: "积分", icon: Star },
  { href: "/attendance/manual", key: "点名", icon: UserCheck },
  { href: "/teacher-workspace/leave", key: "请假", icon: CalendarCheck },
  { href: "/suggestions", key: "建议箱", icon: MessageSquarePlus },
]

export default function TeacherQuickActions() {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {t("快速操作")}
        </CardTitle>
        <CardDescription>{t("常用功能快速访问")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}>
              <Button variant="outline" className="h-20 w-full flex flex-col items-center gap-2">
                <a.icon className="h-6 w-6" />
                <span className="text-sm">{t(a.key)}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
