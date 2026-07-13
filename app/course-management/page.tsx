"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import CourseManagement from "@/components/courses/CourseManagement"
import ClassManagement from "@/components/courses/ClassManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, ExternalLink, GraduationCap } from "lucide-react"

export default function CourseManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()

  return (
    <PageLayout
      title="课程管理"
      description="管理课程设置和教学安排"
      userRole={userProfile?.role || "admin"}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/schedule-management")}>
            <Calendar className="h-4 w-4 mr-1" /> 排课管理
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回仪表板
          </Button>
        </div>
      }
    >
      <CourseManagement />
      <ClassManagement />
    </PageLayout>
  )
}
