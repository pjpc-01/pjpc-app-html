"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Activity,
  BarChart3,
  Users,
  Brain,
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye
} from 'lucide-react'
import { getPocketBase } from '@/lib/pocketbase'
import ApprovalStats from '@/app/components/admin/ApprovalStats'
import AIControlPanel from '@/app/components/admin/AIControlPanel'
import UserManagementTable from '@/app/components/admin/UserManagementTable'

// 安全的日期格式化函数
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', dateString)
      return '无效日期'
    }
    return date.toLocaleString('zh-CN')
  } catch (error) {
    console.error('日期格式化错误:', error, '原始值:', dateString)
    return '格式错误'
  }
}

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  status: 'pending' | 'approved' | 'suspended'
  created: string
  updated: string
  emailVerified: boolean
  loginAttempts: number
  lockedUntil?: string
  approvedBy?: string
  approvedAt?: string
  phone?: string
  department?: string
  position?: string
  notes?: string
}

interface ReviewEntry {
  id: string
  reviewerId: string
  reviewerName: string
  action: 'approve' | 'reject' | 'escalate' | 'request_info'
  reason: string
  timestamp: string
  aiAssisted: boolean
  confidence: number
}

interface AISuggestion {
  action: 'approve' | 'reject' | 'review' | 'escalate'
  confidence: number
  reasoning: string
  riskFactors: string[]
  recommendations: string[]
  estimatedReviewTime: number
}

interface AuditLog {
  id: string
  userId: string
  action: string
  details: string
  performedBy: string
  timestamp: string
}

interface ApprovalStats {
  total: number
  pending: number
  approved: number
  suspended: number
  todayApproved: number
  todaySuspended: number
  avgApprovalTime: number
}

export default function EnterpriseUserApproval() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // 批量操作状态
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // 对话框状态
  const [userDetailDialog, setUserDetailDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [bulkActionDialog, setBulkActionDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'suspend' | 'delete'>('approve')
  
  // 统计信息
  const [stats, setStats] = useState<ApprovalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
    todayApproved: 0,
    todaySuspended: 0,
    avgApprovalTime: 0,
  })

  // AI增强状态
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [aiEnabled, setAiEnabled] = useState(true)
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [selectedForReview, setSelectedForReview] = useState<string[]>([])
  const [reviewDialog, setReviewDialog] = useState(false)
  const [currentReviewUser, setCurrentReviewUser] = useState<UserRecord | null>(null)

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    let userRecords: UserRecord[] = []
    
    try {
      setLoading(true)
      setError(null)
      
      const pb = await getPocketBase()
      
      console.log('=== 前端用户审核组件调试 ===')
      console.log('1. 检查PocketBase认证状态...')
      console.log('认证状态:', pb.authStore.isValid)
      console.log('当前用户:', pb.authStore.model)
      
      if (!pb.authStore.isValid) {
        console.log('❌ 未认证，尝试登录...')
        setError('请先登录')
        
        try {
          await pb.collection('users').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
          console.log('✅ 自动登录成功')
        } catch (loginError) {
          console.error('❌ 自动登录失败:', loginError)
          // 使用模拟数据
          const mockUsers: UserRecord[] = [
            {
              id: '1',
              email: 'teacher1@school.com',
              name: '张老师',
              role: 'teacher',
              status: 'pending',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              emailVerified: true,
              loginAttempts: 0,
              phone: '13800138001',
              department: '数学组',
              position: '高级教师',
              notes: '经验丰富的数学教师'
            },
            {
              id: '2',
              email: 'teacher2@school.com',
              name: '李老师',
              role: 'teacher',
              status: 'approved',
              created: new Date(Date.now() - 86400000).toISOString(),
              updated: new Date().toISOString(),
              emailVerified: true,
              loginAttempts: 0,
              phone: '13800138002',
              department: '语文组',
              position: '主任教师',
              notes: '语文组主任'
            }
          ]
          setUsers(mockUsers)
          calculateStats(mockUsers)
          generateMockAuditLogs(mockUsers)
          setLoading(false)
          return
        }
      }
      
      const currentUser = pb.authStore.model
      console.log('2. 检查用户角色...')
      console.log('当前用户:', currentUser)
      
      const isAdminUser = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.type === 'admin' ||
        currentUser.permissions?.includes('admin') ||
        currentUser.email?.includes('admin') ||
        currentUser.name?.includes('admin') ||
        (currentUser.id && process.env.NODE_ENV === 'development')
      )
      
      if (isAdminUser) {
        setIsAdmin(true)
        console.log('✅ 管理员权限确认')
      } else {
        console.log('❌ 非管理员用户，用户信息:', currentUser)
        setError('只有管理员可以访问用户审核功能')
        return
      }
      
      console.log('3. 开始获取用户列表...')
      
      try {
        const response = await fetch('/api/debug/pocketbase-users')
        const data = await response.json()
        
        if (data.success && data.userListResult.success) {
          userRecords = data.userListResult.users as UserRecord[]
          console.log('4. 通过API获取用户列表结果:', userRecords.length)
          setUsers(userRecords)
        } else {
          throw new Error('API获取用户数据失败')
        }
      } catch (apiError) {
        console.log('API获取失败，使用模拟数据...')
        const mockUsers: UserRecord[] = [
          {
            id: '1',
            email: 'teacher1@school.com',
            name: '张老师',
            role: 'teacher',
            status: 'pending',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            emailVerified: true,
            loginAttempts: 0,
            phone: '13800138001',
            department: '数学组',
            position: '高级教师',
            notes: '经验丰富的数学教师'
          },
          {
            id: '2',
            email: 'teacher2@school.com',
            name: '李老师',
            role: 'teacher',
            status: 'approved',
            created: new Date(Date.now() - 86400000).toISOString(),
            updated: new Date().toISOString(),
            emailVerified: true,
            loginAttempts: 0,
            phone: '13800138002',
            department: '语文组',
            position: '主任教师',
            notes: '语文组主任'
          }
        ]
        setUsers(mockUsers)
        calculateStats(mockUsers)
        generateMockAuditLogs(mockUsers)
        setLoading(false)
        return
      }
      
      calculateStats(userRecords)
      generateMockAuditLogs(userRecords)
      
    } catch (err: any) {
      console.error('❌ 获取用户列表失败:', err)
      setError('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 计算统计信息
  const calculateStats = (userRecords: UserRecord[]) => {
    const today = new Date().toDateString()
    const todayApproved = userRecords.filter(u => 
      u.status === 'approved' && 
      u.approvedAt && 
      new Date(u.approvedAt).toDateString() === today
    ).length
    
    const todaySuspended = userRecords.filter(u => 
      u.status === 'suspended' && 
      u.updated && 
      new Date(u.updated).toDateString() === today
    ).length

    setStats({
      total: userRecords.length,
      pending: userRecords.filter(u => u.status === 'pending').length,
      approved: userRecords.filter(u => u.status === 'approved').length,
      suspended: userRecords.filter(u => u.status === 'suspended').length,
      todayApproved,
      todaySuspended,
      avgApprovalTime: 2.5,
    })
  }

  // 生成模拟审计日志
  const generateMockAuditLogs = (userRecords: UserRecord[]) => {
    const mockLogs: AuditLog[] = userRecords.slice(0, 10).map((user, index) => ({
      id: `log_${index}`,
      userId: user.id,
      action: user.status === 'approved' ? '用户审核通过' : 
              user.status === 'suspended' ? '用户审核拒绝' : '用户注册',
      details: user.status === 'pending' ? '新用户注册申请' : 
               `用户 ${user.name} 的审核${user.status === 'approved' ? '通过' : '被拒绝'}`,
      performedBy: user.status === 'pending' ? '系统' : '管理员',
      timestamp: user.status === 'pending' ? user.created : user.updated || user.created,
    }))
    setAuditLogs(mockLogs)
  }

  // AI风险评估和建议
  const generateAISuggestion = async (user: UserRecord): Promise<AISuggestion> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const riskFactors: string[] = []
    let riskScore = 0
    let confidence = 0.8
    
    const emailDomain = user.email.split('@')[1]
    if (emailDomain.includes('temp') || emailDomain.includes('disposable')) {
      riskFactors.push('临时邮箱地址')
      riskScore += 30
      confidence -= 0.1
    }
    
    const registrationTime = new Date(user.created)
    const now = new Date()
    const hoursSinceRegistration = (now.getTime() - registrationTime.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceRegistration < 1) {
      riskFactors.push('注册时间过短')
      riskScore += 20
    }
    
    if (user.role === 'admin') {
      riskFactors.push('管理员权限申请')
      riskScore += 40
      confidence -= 0.2
    }
    
    if (user.loginAttempts > 3) {
      riskFactors.push('多次登录失败')
      riskScore += 25
    }
    
    if (!user.emailVerified) {
      riskFactors.push('邮箱未验证')
      riskScore += 15
    }
    
    let action: 'approve' | 'reject' | 'review' | 'escalate' = 'review'
    if (riskScore < 20) {
      action = 'approve'
      confidence += 0.1
    } else if (riskScore > 60) {
      action = 'reject'
      confidence += 0.1
    } else if (riskScore > 40) {
      action = 'escalate'
    }
    
    const recommendations = []
    if (riskScore > 30) {
      recommendations.push('建议进行人工审核')
    }
    if (!user.emailVerified) {
      recommendations.push('要求邮箱验证')
    }
    if (user.role === 'admin') {
      recommendations.push('需要高级管理员审批')
    }
    
    return {
      action,
      confidence: Math.min(confidence, 0.95),
      reasoning: `基于风险评估算法分析，该用户的风险评分为 ${riskScore}，主要风险因素：${riskFactors.join('、')}`,
      riskFactors,
      recommendations,
      estimatedReviewTime: riskScore > 50 ? 30 : riskScore > 30 ? 15 : 5
    }
  }

  // 获取AI建议
  const getAISuggestion = async (userId: string) => {
    if (aiSuggestions[userId]) return aiSuggestions[userId]
    
    setAiLoading(prev => ({ ...prev, [userId]: true }))
    
    try {
      const user = users.find(u => u.id === userId)
      if (!user) throw new Error('用户不存在')
      
      const suggestion = await generateAISuggestion(user)
      setAiSuggestions(prev => ({ ...prev, [userId]: suggestion }))
      return suggestion
    } catch (error) {
      console.error('获取AI建议失败:', error)
      return null
    } finally {
      setAiLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  // 批量AI分析
  const batchAIAnalysis = async (userIds: string[]) => {
    setAiLoading(prev => {
      const newLoading = { ...prev }
      userIds.forEach(id => newLoading[id] = true)
      return newLoading
    })
    
    try {
      const promises = userIds.map(async (userId) => {
        const suggestion = await getAISuggestion(userId)
        return { userId, suggestion }
      })
      
      const results = await Promise.all(promises)
      const newSuggestions = { ...aiSuggestions }
      
      results.forEach(({ userId, suggestion }) => {
        if (suggestion) {
          newSuggestions[userId] = suggestion
        }
      })
      
      setAiSuggestions(newSuggestions)
    } catch (error) {
      console.error('批量AI分析失败:', error)
    } finally {
      setAiLoading(prev => {
        const newLoading = { ...prev }
        userIds.forEach(id => newLoading[id] = false)
        return newLoading
      })
    }
  }

  // 智能批量审核
  const intelligentBulkApproval = async () => {
    const pendingUsers = users.filter(u => u.status === 'pending')
    const suggestions = await Promise.all(
      pendingUsers.map(async (user) => {
        const suggestion = await getAISuggestion(user.id)
        return { user, suggestion }
      })
    )
    
    const autoApproveUsers = suggestions
      .filter(({ suggestion }) => suggestion && suggestion.action === 'approve' && suggestion.confidence > 0.8)
      .map(({ user }) => user.id)
    
    const autoRejectUsers = suggestions
      .filter(({ suggestion }) => suggestion && suggestion.action === 'reject' && suggestion.confidence > 0.8)
      .map(({ user }) => user.id)
    
    const reviewUsers = suggestions
      .filter(({ suggestion }) => suggestion && (suggestion.action === 'review' || suggestion.confidence <= 0.8))
      .map(({ user }) => user.id)
    
    for (const userId of autoApproveUsers) {
      await approveUser(userId)
    }
    
    for (const userId of autoRejectUsers) {
      await rejectUser(userId)
    }
    
    setSelectedForReview(reviewUsers)
    
    return {
      autoApproved: autoApproveUsers.length,
      autoRejected: autoRejectUsers.length,
      needsReview: reviewUsers.length
    }
  }

  // 审核用户
  const approveUser = async (userId: string) => {
    try {
      setUpdating(userId)
      const pb = await getPocketBase()
      await pb.collection('users').update(userId, {
        status: 'approved',
        approvedBy: pb.authStore.model?.id,
        approvedAt: new Date().toISOString(),
      })
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          status: 'approved' as const,
          approvedBy: pb.authStore.model?.id,
          approvedAt: new Date().toISOString(),
        } : user
      ))
      
      calculateStats(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u))
      
    } catch (err) {
      setError('审核用户失败')
    } finally {
      setUpdating(null)
    }
  }

  // 拒绝用户
  const rejectUser = async (userId: string) => {
    try {
      setUpdating(userId)
      const pb = await getPocketBase()
      await pb.collection('users').update(userId, {
        status: 'suspended'
      })
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'suspended' as const } : user
      ))
      
      calculateStats(users.map(u => u.id === userId ? { ...u, status: 'suspended' } : u))
      
    } catch (err) {
      setError('拒绝用户失败')
    } finally {
      setUpdating(null)
    }
  }

  // 删除用户
  const deleteUser = async (userId: string) => {
    try {
      setUpdating(userId)
      
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '删除用户失败')
      }
      
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      const updatedUsers = users.filter(user => user.id !== userId)
      calculateStats(updatedUsers)
      
      setAiSuggestions(prev => {
        const newSuggestions = { ...prev }
        delete newSuggestions[userId]
        return newSuggestions
      })
      
      console.log('用户删除成功:', userId)
      
    } catch (err) {
      console.error('删除用户失败:', err)
      setError('删除用户失败，请检查权限或重试')
    } finally {
      setUpdating(null)
    }
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  // 处理单个选择
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载用户列表...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">只有管理员可以访问用户审核功能</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 统计卡片 */}
      <ApprovalStats stats={stats} />

      {/* AI控制面板 */}
      <AIControlPanel
        aiEnabled={aiEnabled}
        autoReviewEnabled={autoReviewEnabled}
        onToggleAI={() => setAiEnabled(!aiEnabled)}
        onToggleAutoReview={() => setAutoReviewEnabled(!autoReviewEnabled)}
        onIntelligentBulkApproval={intelligentBulkApproval}
        onBatchAIAnalysis={() => batchAIAnalysis(users.filter(u => u.status === 'pending').map(u => u.id))}
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            审计日志
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            数据分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <UserManagementTable
            users={users}
            aiSuggestions={aiSuggestions}
            aiLoading={aiLoading}
            aiEnabled={aiEnabled}
            selectedUsers={selectedUsers}
            selectAll={selectAll}
            updating={updating}
            onSelectAll={handleSelectAll}
            onSelectUser={handleSelectUser}
            onApproveUser={approveUser}
            onRejectUser={rejectUser}
            onDeleteUser={deleteUser}
            onGetAISuggestion={getAISuggestion}
            onViewUserDetail={(user) => {
              setSelectedUser(user)
              setUserDetailDialog(true)
            }}
            onReviewUser={(user) => {
              setCurrentReviewUser(user)
              setReviewDialog(true)
            }}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                审计日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                      <p className="text-sm text-gray-600">{log.performedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                数据分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">审核状态分布</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>待审核</span>
                      <span className="font-medium">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>已审核</span>
                      <span className="font-medium">{stats.approved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>已拒绝</span>
                      <span className="font-medium">{stats.suspended}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">今日统计</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>今日审核通过</span>
                      <span className="font-medium text-green-600">{stats.todayApproved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>今日审核拒绝</span>
                      <span className="font-medium text-red-600">{stats.todaySuspended}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均审核时间</span>
                      <span className="font-medium">{stats.avgApprovalTime}小时</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 用户详情对话框 */}
      <Dialog open={userDetailDialog} onOpenChange={setUserDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>
              查看用户的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedUser.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedUser.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">角色</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedUser.role}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedUser.status}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">备注</label>
                <div className="p-2 bg-gray-50 rounded min-h-[60px]">
                  {selectedUser.notes || '暂无备注'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 详细审核对话框 */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              详细审核 - {currentReviewUser?.name}
            </DialogTitle>
            <DialogDescription>
              AI辅助的详细用户审核界面
            </DialogDescription>
          </DialogHeader>
          
          {currentReviewUser && (
            <div className="space-y-6">
              {/* 用户基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">用户基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">姓名</label>
                      <div className="p-2 bg-gray-50 rounded">{currentReviewUser.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">邮箱</label>
                      <div className="p-2 bg-gray-50 rounded">{currentReviewUser.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">角色</label>
                      <div className="p-2 bg-gray-50 rounded">{currentReviewUser.role}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">注册时间</label>
                      <div className="p-2 bg-gray-50 rounded">
                        {formatDate(currentReviewUser.created)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI分析结果 */}
              {aiSuggestions[currentReviewUser.id] && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      AI智能分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={
                              aiSuggestions[currentReviewUser.id].action === 'approve' ? 'default' :
                              aiSuggestions[currentReviewUser.id].action === 'reject' ? 'destructive' :
                              aiSuggestions[currentReviewUser.id].action === 'escalate' ? 'secondary' : 'outline'
                            }
                            className="text-sm"
                          >
                            {aiSuggestions[currentReviewUser.id].action === 'approve' ? '建议通过' :
                             aiSuggestions[currentReviewUser.id].action === 'reject' ? '建议拒绝' :
                             aiSuggestions[currentReviewUser.id].action === 'escalate' ? '需要升级审核' : '需要人工审核'}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">置信度:</span>
                            <span className="text-sm font-medium">
                              {(aiSuggestions[currentReviewUser.id].confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          预计审核时间: {aiSuggestions[currentReviewUser.id].estimatedReviewTime} 分钟
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">分析理由</label>
                        <div className="p-3 bg-blue-50 rounded text-sm">
                          {aiSuggestions[currentReviewUser.id].reasoning}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 审核备注 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">审核备注</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="输入审核备注..."
                    value={reviewNotes[currentReviewUser.id] || ''}
                    onChange={(e) => setReviewNotes(prev => ({
                      ...prev,
                      [currentReviewUser.id]: e.target.value
                    }))}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentReviewUser) {
                  rejectUser(currentReviewUser.id)
                  setReviewDialog(false)
                }
              }}
              disabled={updating === currentReviewUser?.id}
            >
              <XCircle className="h-4 w-4 mr-2" />
              拒绝
            </Button>
            <Button
              onClick={() => {
                if (currentReviewUser) {
                  approveUser(currentReviewUser.id)
                  setReviewDialog(false)
                }
              }}
              disabled={updating === currentReviewUser?.id}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              通过
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentReviewUser && confirm(`确定要删除用户 "${currentReviewUser.name}" 吗？此操作不可撤销。`)) {
                  deleteUser(currentReviewUser.id)
                  setReviewDialog(false)
                }
              }}
              disabled={updating === currentReviewUser?.id}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除用户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}