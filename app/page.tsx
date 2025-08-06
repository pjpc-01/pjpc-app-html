"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Bell, Settings, LogOut, UserCheck, Wifi, WifiOff, AlertTriangle, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/enhanced-auth-context"
import SecureLoginForm from "@/components/auth/secure-login-form"
import AdminDashboard from "./components/admin-dashboard"
import TeacherDashboard from "./components/teacher-dashboard"
import ParentDashboard from "./components/parent-dashboard"
import AccountantDashboard from "./components/accountant-dashboard"
import ErrorBoundary from "@/components/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle as AlertTriangleIcon, Mail, Clock } from "lucide-react"

export default function Dashboard() {
  const { user, userProfile, loading, logout, resendVerification, error, connectionStatus, clearError } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  // 添加调试日志
  console.log('Dashboard render state:', { 
    loading, 
    connectionStatus, 
    hasUser: !!user, 
    hasUserProfile: !!userProfile 
  })

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
            <CardDescription>无法连接到服务器，请检查网络连接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                系统无法连接到Firebase服务。请检查：
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>网络连接是否正常</li>
                  <li>Firebase配置是否正确</li>
                  <li>服务器是否在线</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="w-full">
              重新加载
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果用户未登录，显示登录界面
  if (!user || !userProfile) {
    return <SecureLoginForm />
  }

  // 邮箱未验证
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              邮箱验证
            </CardTitle>
            <CardDescription>请验证您的邮箱地址以继续使用系统</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>我们已向 {user.email} 发送了验证邮件。请检查您的邮箱并点击验证链接。</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={resendVerification} variant="outline" className="flex-1 bg-transparent">
                重新发送验证邮件
              </Button>
              <Button onClick={logout} variant="destructive" className="flex-1">
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>
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
        return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "teacher":
        return <TeacherDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "parent":
        return <ParentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      case "accountant":
        return <AccountantDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      default:
        return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
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

  const getRoleBadgeColor = () => {
    switch (userProfile.role) {
      case "admin":
        return "destructive"
      case "teacher":
        return "default"
      case "parent":
        return "secondary"
      case "accountant":
        return "outline"
      default:
        return "outline"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">{getRoleTitle()}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quick Access to Check-in System */}
              <Button variant="outline" size="sm" asChild>
                <a href="/checkin" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">打卡系统</span>
                </a>
              </Button>
              
              {/* Connection Status */}
              <div className="flex items-center gap-1">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{userProfile.name}</span>
                <span className="text-xs text-gray-500">({user.email})</span>
              </div>
              <Badge variant={getRoleBadgeColor() as any}>{getRoleLabel()}</Badge>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
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
  )
}
