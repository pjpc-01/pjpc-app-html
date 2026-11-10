"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"
import { Zap, CreditCard, BarChart3, UserCheck, BookOpen, MessageSquare } from "lucide-react"

/**
 * 教师工作台的快速操作。原来长在 TeacherDashboard 里，
 * 工作台只留「排班日历 + 概览 + 快速操作」，所以单独拆出来。
 */
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/attendance">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">{t("统一考勤")}</span>
            </Button>
          </Link>
          <Link href="/teacher-workspace/courses">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">{t("AI考勤系统")}</span>
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
              <UserCheck className="h-6 w-6" />
              <span className="text-sm">{t("点名")}</span>
            </Button>
          </Link>
          <Link href="/homework/new">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">{t("布置作业")}</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col items-center gap-2"
            onClick={() => {
              toast.info(t("通知功能"), { description: "通知发送功能即将上线" })
            }}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm">{t("发送通知")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
