"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, UserCog, BookOpen } from "lucide-react"
import Link from "next/link"

const sections = [
  { label: "学生管理", href: "/student-management", icon: Users, desc: "学生列表、日志、成绩、接送、家长" },
  { label: "教师管理", href: "/teacher-management", icon: UserCog, desc: "教师列表、请假、绩效、排班" },
  { label: "课程管理", href: "/course-management", icon: BookOpen, desc: "课程表、班级、课程分析" },
]

export default function EducationPage() {
  return (
    <PageLayout
      title="教育概览"
      description="教学管理入口"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <s.icon className="h-5 w-5 text-blue-600" />
                  {s.label}
                </CardTitle>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
