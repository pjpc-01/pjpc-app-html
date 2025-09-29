"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Bell, Settings, LogOut, UserCheck, Wifi, WifiOff, AlertTriangle, CreditCard, Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import SecureLoginForm from "@/app/components/systems/auth/secure-login-form"
import ModernAdminDashboard from "./components/dashboards/modern-admin-dashboard"
import ModernParentDashboard from "./components/dashboards/modern-parent-dashboard"
import AccountantDashboard from "./components/dashboards/accountant-dashboard"
import ErrorBoundary from "@/components/shared/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle as AlertTriangleIcon, Mail, Clock } from "lucide-react"
import ConnectionStatus from "@/components/ConnectionStatus"
import TeacherNavigation from "@/components/shared/TeacherNavigation"
import StaticPage from "./static-page"
import dynamic from "next/dynamic"

// 动态导入TeacherWorkspace以避免水合问题
const TeacherWorkspace = dynamic(() => import('./teacher-workspace/page'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">加载教师工作台...</p>
      </div>
    </div>
  )
})

export default function Dashboard() {
  const { user, userProfile, loading, logout, resendVerification, error, connectionStatus, clearError } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isStaticBuild, setIsStaticBuild] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 检测是否为静态构建
  useEffect(() => {
    // 在静态构建时，window对象可能不存在或PocketBase连接会失败
    if (connectionStatus === 'disconnected') {
      setIsStaticBuild(true)
    }
  }, [connectionStatus])

  // 如果是静态构建，直接显示静态页面
  if (isStaticBuild) {
    return <StaticPage />
  }

  // 显示加载状态 - 只有在真正需要等待时才显示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            检查连接中...
          </p>
        </div>
      </div>
    )
  }

  // 如果连接失败，显示错误
  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <WifiOff className="h-5 w-5" />
              连接失败
            </CardTitle>
            <CardDescription>无法连接到PocketBase服务器，请检查网络连接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                系统无法连接到PocketBase服务。请检查：
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>网络连接是否正常</li>
                  <li>PocketBase服务器是否运行</li>
                  <li>服务器地址是否正确 (pjpc.tplinkdns.com:8090)</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/')} className="w-full">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果用户未登录，显示登录界面
  if (!user && !loading) {
    return <SecureLoginForm />
  }
  
  // 如果用户存在但没有用户资料，等待一下再检查
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            加载用户资料中...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            用户ID: {user?.id || '未知'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            如果长时间停留在此页面，请刷新页面
          </p>
        </div>
      </div>
    )
  }

  // 账户待审核
  if (userProfile?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              账户审核中
            </CardTitle>
            <CardDescription>您的账户正在等待管理员审核</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                您的 {userProfile.role === "teacher" ? "老师" : "家长"} 账户申请已提交，请耐心等待管理员审核。
                审核通过后您将收到邮件通知。
              </AlertDescription>
            </Alert>
            <Button onClick={logout} variant="outline" className="w-full bg-transparent">
              退出登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 账户被暂停
  if (userProfile?.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              账户已暂停
            </CardTitle>
            <CardDescription>您的账户已被管理员暂停使用</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>您的账户已被暂停，如有疑问请联系管理员。</AlertDescription>
            </Alert>
            <Button onClick={logout} variant="outline" className="w-full bg-transparent">
              退出登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (userProfile.role) {
      case "admin":
        return <ModernAdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "teacher":
        return <TeacherWorkspace />
      case "parent":
        return <ModernParentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "accountant":
        return <AccountantDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      default:
        return (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">未知角色</p>
          </div>
        )
    }
  }

  const getRoleTitle = () => {
    switch (userProfile.role) {
      case "admin":
        return "管理员控制台"
      case "teacher":
        return "教师工作台"
      case "parent":
        return "家长服务台"
      case "accountant":
        return "会计工作台"
      default:
        return "安亲班管理系统"
    }
  }

  const getRoleLabel = () => {
    switch (userProfile.role) {
      case "admin":
        return "管理员"
      case "teacher":
        return "老师"
      case "parent":
        return "家长"
      case "accountant":
        return "会计"
      default:
        return userProfile.role
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("登出失败:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {getRoleTitle()}
                </h1>
                <p className="text-xs text-gray-500">智能教育管理系统</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block">
                <ConnectionStatus />
              </div>
              
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userProfile.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/50">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/50">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-0 bg-gray-100 opacity-40"></div>
        
        <div className="relative z-10">
          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600 hover:text-red-700">
                    关闭
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundary>
              {renderDashboard()}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  )
}