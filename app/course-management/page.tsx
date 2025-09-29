"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import SimpleCourseManagement from "@/app/components/management/simple-course-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Users, Calendar, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CourseManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("courses")

  // 检查权限
  const isAdmin = userProfile?.role === "admin" || 
                  userProfile?.email?.includes('admin') || 
                  userProfile?.email?.includes('pjpcemerlang')
  
  if (!isAdmin && userProfile?.role !== 'teacher') {
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

  return (
    <PageLayout
      title="课程管理"
      description="管理课程设置、班级安排和教学计划"
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
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">课程管理系统</h1>
          <p className="text-gray-600">统一管理课程设置、班级安排、教学计划和课程资源</p>
        </div>

        {/* 课程管理标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              课程管理
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              班级管理
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              课程表
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              课程分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <SimpleCourseManagement />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
