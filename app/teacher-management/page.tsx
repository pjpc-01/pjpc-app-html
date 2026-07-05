"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import TeachersTab from "@/app/components/dashboards/teachers-tab"
import TeacherLeaveManagement from "@/components/teacher/TeacherLeaveManagement"
import TeacherPerformanceManagement from "@/components/teacher/TeacherPerformanceManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, CalendarCheck, BarChart3 } from "lucide-react"

type TabKey = "teachers" | "leave" | "performance"

export default function TeacherManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile, loading } = useAuth()

  // Read tab from URL param — sidebar links use ?tab=leave / ?tab=performance
  const tabParam = searchParams?.get("tab") as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "teachers")

  // Sync URL param changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // ===========================================================================
  // DEV MODE: FULL AUTH BYPASS
  // ===========================================================================
  const devUser = { id: 'dev-admin', email: 'admin@pjpc.com' }
  const devProfile = {
    id: 'dev-admin',
    name: 'Dev Admin',
    role: 'admin',
    status: 'active',
    email: 'admin@pjpc.com'
  }
  const effectiveProfile = userProfile?.role ? userProfile : devProfile
  // ===========================================================================

  // 显示加载状态
  if (loading && !userProfile?.role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在验证权限...</p>
        </div>
      </div>
    )
  }

  // 检查权限 - 管理员权限检查
  const isAdmin = effectiveProfile?.role === "admin" || 
                  effectiveProfile?.email?.includes('admin') || 
                  effectiveProfile?.email?.includes('pjpcemerlang')
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-600 mb-2">只有管理员可以访问教师管理功能</p>
          <p className="text-sm text-gray-500 mb-4">
            当前角色: {userProfile?.role || '未识别'} | 
            邮箱: {userProfile?.email || '未识别'}
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push('/login')} className="w-full">
              登录管理员账户
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              返回首页
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Page config by tab — no tab bar UI, controlled entirely by sidebar URL
  const tabConfig: Record<TabKey, { title: string; description: string }> = {
    teachers: { title: "教师列表", description: "管理所有教师信息、权限和教学安排" },
    leave:    { title: "请假管理", description: "审核和管理教师请假申请" },
    performance: { title: "绩效管理", description: "查看和管理教师绩效考核" },
  }
  const current = tabConfig[activeTab]

  return (
    <PageLayout
      title={current.title}
      description={current.description}
      userRole="admin"
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
      {/* No Tabs bar — switching is done via sidebar navigation */}
      {activeTab === "teachers" && <TeachersTab setActiveTab={setActiveTab} />}
      {activeTab === "leave" && <TeacherLeaveManagement />}
      {activeTab === "performance" && <TeacherPerformanceManagement />}
    </PageLayout>
  )
}
