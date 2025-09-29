"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import TeachersTab from "@/app/components/dashboards/teachers-tab"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TeacherManagementPage() {
  const router = useRouter()
  const { userProfile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("teachers")

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在验证权限...</p>
        </div>
      </div>
    )
  }

  // 检查权限 - 管理员权限检查
  const isAdmin = userProfile?.role === "admin" || 
                  userProfile?.email?.includes('admin') || 
                  userProfile?.email?.includes('pjpcemerlang')
  
  if (!isAdmin) {
    console.log('❌ 访问被拒绝 - 用户角色检查:', {
      userProfile,
      role: userProfile?.role,
      email: userProfile?.email,
      isAdmin,
      nodeEnv: process.env.NODE_ENV
    })
    
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

  return (
    <PageLayout
      title="教师管理"
      description="管理所有教师信息、权限和教学安排"
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
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">教师管理系统</h1>
          <p className="text-gray-600">统一管理教师基本资料、教学安排和权限设置</p>
        </div>

        {/* 教师管理内容 */}
        <TeachersTab setActiveTab={setActiveTab} />
      </div>
    </PageLayout>
  )
}

