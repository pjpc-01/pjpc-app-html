"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import UserManagementTable from "@/app/components/admin/UserManagementTable"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Shield, UserCheck, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UserManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  
  // 用户管理状态
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
      } else {
        console.error('获取用户数据失败:', data.message)
        setUsers([])
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // 事件处理函数
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleApproveUser = async (user: any) => {
    setUpdating(user.id)
    try {
      // 这里应该调用API来批准用户
      console.log('批准用户:', user.id)
      await fetchUsers() // 重新获取数据
    } catch (error) {
      console.error('批准用户失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleRejectUser = async (user: any) => {
    setUpdating(user.id)
    try {
      // 这里应该调用API来拒绝用户
      console.log('拒绝用户:', user.id)
      await fetchUsers() // 重新获取数据
    } catch (error) {
      console.error('拒绝用户失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteUser = async (user: any) => {
    setUpdating(user.id)
    try {
      // 这里应该调用API来删除用户
      console.log('删除用户:', user.id)
      await fetchUsers() // 重新获取数据
    } catch (error) {
      console.error('删除用户失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleGetAISuggestion = async (userId: string) => {
    setAiLoading(true)
    try {
      // 这里应该调用AI建议API
      console.log('获取AI建议:', userId)
      setAiSuggestions([]) // 模拟空结果
    } catch (error) {
      console.error('获取AI建议失败:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleViewUserDetail = (user: any) => {
    console.log('查看用户详情:', user.id)
  }

  const handleReviewUser = (user: any) => {
    console.log('审核用户:', user.id)
  }

  // 检查权限 - 只有管理员可以访问
  const isAdmin = userProfile?.role === "admin" || 
                  userProfile?.email?.includes('admin') || 
                  userProfile?.email?.includes('pjpcemerlang')

  // 初始化数据
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-600 mb-2">只有管理员可以访问用户管理功能</p>
          <Button onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="用户管理"
      description="管理系统用户、权限和审核"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">用户管理系统</h1>
          <p className="text-gray-600">统一管理用户账户、权限设置、审核流程和系统访问控制</p>
        </div>

        {/* 用户管理标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              用户审核
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              权限管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              系统设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagementTable 
              users={users}
              aiSuggestions={aiSuggestions}
              aiLoading={aiLoading}
              aiEnabled={aiEnabled}
              selectedUsers={selectedUsers}
              selectAll={selectedUsers.size === users.length && users.length > 0}
              updating={updating}
              onSelectAll={handleSelectAll}
              onSelectUser={handleSelectUser}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              onDeleteUser={handleDeleteUser}
              onGetAISuggestion={handleGetAISuggestion}
              onViewUserDetail={handleViewUserDetail}
              onReviewUser={handleReviewUser}
            />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>用户审核</CardTitle>
                <CardDescription>审核新用户注册和权限申请</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>用户审核功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>权限管理</CardTitle>
                <CardDescription>管理系统角色和权限分配</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>权限管理功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>系统设置</CardTitle>
                <CardDescription>配置系统参数和安全设置</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>系统设置功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
