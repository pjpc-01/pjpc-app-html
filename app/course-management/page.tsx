"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import CourseManagement from "@/components/courses/CourseManagement"
import ClassManagement from "@/components/courses/ClassManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Users, Calendar, BarChart3, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const TABS = [
  { id: "courses", label: "课程管理", icon: BookOpen, desc: "管理课程设置和教学安排" },
  { id: "classes", label: "班级管理", icon: Users, desc: "按年级分组的班级视图" },
  { id: "schedule", label: "排课管理", icon: Calendar, desc: "教师排班和冲突检测" },
  { id: "analytics", label: "课程分析", icon: BarChart3, desc: "课程效果和学科分布" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function CourseManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams?.get("tab") as TabId) || "courses"
  )

  // Sync tab to URL
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.replaceState({}, "", url.toString())
  }, [activeTab])

  // Sync URL to tab
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as TabId | null
    if (tabFromUrl && tabFromUrl !== activeTab && TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0]

  return (
    <PageLayout
      title={currentTab.label}
      description={currentTab.desc}
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
      {/* Tab 导航 */}
      <div className="flex gap-1 bg-white rounded-lg p-1 border shadow-sm overflow-x-auto">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {/* 课程管理 */}
        {activeTab === "courses" && <CourseManagement />}

        {/* 班级管理 */}
        {activeTab === "classes" && <ClassManagement />}

        {/* 排课管理 */}
        {activeTab === "schedule" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                教师排班管理
              </CardTitle>
              <CardDescription>
                安排课程时间表、检测时间冲突、管理教师排班
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">完整的排课系统在独立的排课管理页面</p>
              <p className="text-xs text-gray-400 mb-6">
                包含冲突检测、日历视图、模板管理等功能
              </p>
              <Button
                onClick={() => router.push('/schedule-management')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                打开排课管理
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 课程分析 */}
        {activeTab === "analytics" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                课程分析
              </CardTitle>
              <CardDescription>
                查看课程效果、学科分布和学生学习数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-indigo-600">{/* 数据来自 useCourseStats */}</div>
                    <div className="text-sm text-gray-500 mt-1">学科覆盖</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-emerald-600">—</div>
                    <div className="text-sm text-gray-500 mt-1">总学生数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-amber-600">—</div>
                    <div className="text-sm text-gray-500 mt-1">平均班额</div>
                  </CardContent>
                </Card>
              </div>
              <p className="text-sm text-gray-400 text-center">
                详细分析功能开发中（需要学生-课程关联数据）
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
