"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import SimpleCourseManagement from "@/app/components/management/simple-course-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Users, Calendar, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CourseManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "schedule")

  // Sync tab changes to URL (when user clicks something inside the page)
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.replaceState({}, "", url.toString())
  }, [activeTab])

  // Sync URL param changes to tab (when user clicks sidebar)
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab")
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Bypass all auth guards for development
  const isAdmin = true
  const userRole = 'admin'
  
  if (false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-600 mb-2">只有管理员和教师可以访问课程管理功能</p>
          <Button onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const pageConfig = {
    schedule: { title: "课程表", desc: "安排和管理课程时间表" },
    courses: { title: "课程管理", desc: "管理课程设置和教学安排" },
    classes: { title: "班级管理", desc: "管理班级设置和学生分组" },
    analytics: { title: "课程分析", desc: "分析课程效果和学生学习情况" },
  }
  const currentPage = pageConfig[activeTab as keyof typeof pageConfig] || pageConfig.schedule

  return (
    <PageLayout
      title={currentPage.title}
      description={currentPage.desc}
      userRole={userProfile?.role || 'admin'}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回仪表板
        </Button>
      }
    >
      <div className="space-y-6">
        {activeTab === "schedule" && (
          <Card>
            <CardHeader>
              <CardTitle>课程表管理</CardTitle>
              <CardDescription>安排和管理课程时间表</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>课程表管理功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        )}
        {activeTab === "courses" && <SimpleCourseManagement />}
        {activeTab === "classes" && (
          <Card>
            <CardHeader>
              <CardTitle>班级管理</CardTitle>
              <CardDescription>管理班级设置和学生分组</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>班级管理功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card>
            <CardHeader>
              <CardTitle>课程分析</CardTitle>
              <CardDescription>分析课程效果和学生学习情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>课程分析功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
