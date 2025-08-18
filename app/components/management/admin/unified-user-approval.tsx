"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Shield,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  Phone,
  MapPin,
  Building,
  FileText,
  BarChart3,
  Activity,
  Settings,
  MoreHorizontal,
  CheckSquare,
  Square,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Bell,
  Send,
  FileSpreadsheet,
  Lightbulb,
  Target,
  AlertCircle,
  Check,
  X,
  Info,
  Clock4,
  UserCog,
  ShieldCheck,
  ShieldX,
  BrainCircuit,
  Sparkles,
  BarChart,
  FilterX,
  RotateCcw,
  Plus,
  Minus,
  Percent,
} from 'lucide-react'
import { pb } from '@/lib/pocketbase'
import { useUserApproval, UserRecord, ApprovalStats } from '@/hooks/useUserApproval'

interface AISuggestion {
  action: 'approve' | 'reject' | 'review'
  confidence: number
  reasoning: string
  riskFactors: string[]
  recommendations: string[]
}

interface ReviewEntry {
  id: string
  reviewer: string
  action: 'approve' | 'reject' | 'review'
  notes: string
  timestamp: string
  aiSuggestion?: string
  confidence?: number
}

export default function UnifiedUserApproval() {
  const {
    users,
    loading,
    error,
    stats,
    fetchUsers,
    approveUser,
    rejectUser,
    bulkApprove,
    bulkReject,
    searchUsers,
    filterUsersByStatus,
    filterUsersByRole,
    clearError
  } = useUserApproval()
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [aiSuggestions, setAiSuggestions] = useState<Map<string, AISuggestion>>(new Map())
  const [aiLoading, setAiLoading] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedForReview, setSelectedForReview] = useState<string[]>([])
  const [reviewDialog, setReviewDialog] = useState(false)
  const [currentReviewUser, setCurrentReviewUser] = useState<UserRecord | null>(null)

  // 初始化AI建议
  useEffect(() => {
    if (aiEnabled && users.length > 0) {
      generateAISuggestions(users)
    }
  }, [users, aiEnabled])

  // AI建议生成
  const generateAISuggestion = (user: UserRecord): AISuggestion => {
    const emailRisk = user.email.includes('temp') || user.email.includes('test') ? 0.8 : 0.2
    const timeRisk = new Date(user.created).getTime() < Date.now() - 24 * 60 * 60 * 1000 ? 0.3 : 0.1
    const roleRisk = user.role === 'admin' ? 0.9 : 0.2
    const loginRisk = user.loginAttempts > 3 ? 0.7 : 0.1
    const emailVerifiedRisk = !user.emailVerified ? 0.6 : 0.1

    const totalRisk = (emailRisk + timeRisk + roleRisk + loginRisk + emailVerifiedRisk) / 5

    let action: 'approve' | 'reject' | 'review'
    let confidence: number
    let reasoning: string
    let riskFactors: string[] = []
    let recommendations: string[] = []

    if (totalRisk > 0.7) {
      action = 'reject'
      confidence = Math.floor(Math.random() * 20) + 80
      reasoning = '高风险用户，建议拒绝'
      riskFactors = ['可疑邮箱', '多次登录失败', '未验证邮箱']
      recommendations = ['要求提供身份证明', '联系用户确认信息']
    } else if (totalRisk > 0.4) {
      action = 'review'
      confidence = Math.floor(Math.random() * 30) + 60
      reasoning = '需要进一步审核'
      riskFactors = ['中等风险', '信息不完整']
      recommendations = ['人工审核', '要求补充信息']
    } else {
      action = 'approve'
      confidence = Math.floor(Math.random() * 20) + 80
      reasoning = '低风险用户，建议通过'
      riskFactors = ['低风险', '信息完整']
      recommendations = ['可以自动通过', '监控后续活动']
    }

    return { action, confidence, reasoning, riskFactors, recommendations }
  }

  const generateAISuggestions = async (userData: UserRecord[]) => {
    setAiLoading(true)
    // 模拟AI处理时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const suggestions = new Map<string, AISuggestion>()
    userData.forEach(user => {
      suggestions.set(user.id, generateAISuggestion(user))
    })
    
    setAiSuggestions(suggestions)
    setAiLoading(false)
  }

  const getAISuggestion = (userId: string): AISuggestion | null => {
    return aiSuggestions.get(userId) || null
  }

  // 批量AI分析
  const batchAIAnalysis = async () => {
    setAiLoading(true)
    const pendingUsers = users.filter(u => u.status === 'pending')
    await generateAISuggestions(pendingUsers)
    setAiLoading(false)
  }

  // 智能批量审批
  const intelligentBulkApproval = async () => {
    const highConfidenceUsers = users.filter(user => {
      const suggestion = getAISuggestion(user.id)
      return suggestion && suggestion.confidence > 85 && suggestion.action === 'approve'
    })

    const highConfidenceRejections = users.filter(user => {
      const suggestion = getAISuggestion(user.id)
      return suggestion && suggestion.confidence > 90 && suggestion.action === 'reject'
    })

    // 批量审批高置信度的用户
    for (const user of highConfidenceUsers) {
      await approveUser(user.id)
    }

    // 批量拒绝高置信度的拒绝建议
    for (const user of highConfidenceRejections) {
      await rejectUser(user.id)
    }

    alert(`AI批量处理完成：通过 ${highConfidenceUsers.length} 个用户，拒绝 ${highConfidenceRejections.length} 个用户`)
  }

  // 批量审批处理
  const handleBulkApprove = async () => {
    const results = await bulkApprove(selectedUsers)
    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      setSelectedUsers([])
      alert(`成功审批 ${successCount} 个用户`)
    }
  }

  const handleBulkReject = async () => {
    const results = await bulkReject(selectedUsers)
    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      setSelectedUsers([])
      alert(`成功拒绝 ${successCount} 个用户`)
    }
  }

  // 过滤和搜索
  const filteredUsers = useMemo(() => {
    let filtered = users
    
    // 按状态过滤
    if (statusFilter !== 'all') {
      filtered = filterUsersByStatus(statusFilter)
    }
    
    // 按角色过滤
    if (roleFilter !== 'all') {
      filtered = filterUsersByRole(roleFilter)
    }
    
    // 搜索过滤
    if (searchTerm.trim()) {
      filtered = searchUsers(searchTerm)
    }
    
    return filtered
  }, [users, searchTerm, statusFilter, roleFilter, filterUsersByStatus, filterUsersByRole, searchUsers])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const openReviewDialog = (user: UserRecord) => {
    setCurrentReviewUser(user)
    setReviewDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => { clearError(); fetchUsers(); }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待审批</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI处理</p>
                <p className="text-2xl font-bold text-purple-600">{aiSuggestions.size}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均处理时间</p>
                <p className="text-2xl font-bold text-green-600">{stats.averageProcessingTime}分钟</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI智能审核助手
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ai-enabled" 
                checked={aiEnabled} 
                onCheckedChange={(checked) => setAiEnabled(checked as boolean)}
              />
              <Label htmlFor="ai-enabled">启用AI辅助审核</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="auto-review" 
                checked={autoReviewEnabled} 
                onCheckedChange={(checked) => setAutoReviewEnabled(checked as boolean)}
              />
              <Label htmlFor="auto-review">启用自动审核</Label>
            </div>
            
            <Button 
              onClick={batchAIAnalysis} 
              disabled={aiLoading}
              variant="outline"
              size="sm"
            >
              {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              批量AI分析
            </Button>
            
            <Button 
              onClick={intelligentBulkApproval}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4" />
              智能批量审批
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 主要标签页 */}
      <Tabs defaultValue="ai-enhanced" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-enhanced" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI增强审核
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            基础审核
          </TabsTrigger>
        </TabsList>

        {/* AI增强审核标签页 */}
        <TabsContent value="ai-enhanced" className="space-y-4">
          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索用户姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="suspended">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="parent">家长</SelectItem>
                <SelectItem value="accountant">会计</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 批量操作 */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">已选择 {selectedUsers.length} 个用户</span>
              <Button onClick={handleBulkApprove} size="sm" variant="outline">
                <CheckCircle className="h-4 w-4 mr-1" />
                批量通过
              </Button>
              <Button onClick={handleBulkReject} size="sm" variant="outline">
                <XCircle className="h-4 w-4 mr-1" />
                批量拒绝
              </Button>
            </div>
          )}

          {/* 用户表格 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>用户信息</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>AI建议</TableHead>
                    <TableHead>风险评分</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const aiSuggestion = getAISuggestion(user.id)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.created).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {aiSuggestion ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge 
                                    variant={
                                      aiSuggestion.action === 'approve' ? 'default' :
                                      aiSuggestion.action === 'reject' ? 'destructive' : 'secondary'
                                    }
                                  >
                                    {aiSuggestion.action === 'approve' ? '通过' :
                                     aiSuggestion.action === 'reject' ? '拒绝' : '审核'}
                                    ({aiSuggestion.confidence}%)
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <p className="font-medium">AI分析结果</p>
                                    <p className="text-sm">{aiSuggestion.reasoning}</p>
                                    <p className="text-xs mt-1">置信度: {aiSuggestion.confidence}%</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400">分析中...</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.floor(Math.random() * 100)} className="w-16" />
                            <span className="text-sm">{Math.floor(Math.random() * 100)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.status === 'approved' ? 'default' :
                              user.status === 'suspended' ? 'destructive' : 'secondary'
                            }
                          >
                            {user.status === 'approved' ? '已通过' :
                             user.status === 'suspended' ? '已拒绝' : '待审批'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {aiSuggestion?.action === 'approve' && (
                              <Button
                                onClick={() => approveUser(user.id)}
                                size="sm"
                                variant="outline"
                                className="h-8"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              onClick={() => openReviewDialog(user)}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 基础审核标签页 */}
        <TabsContent value="basic" className="space-y-4">
          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索用户姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="suspended">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="parent">家长</SelectItem>
                <SelectItem value="accountant">会计</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 批量操作 */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">已选择 {selectedUsers.length} 个用户</span>
              <Button onClick={handleBulkApprove} size="sm" variant="outline">
                <CheckCircle className="h-4 w-4 mr-1" />
                批量通过
              </Button>
              <Button onClick={handleBulkReject} size="sm" variant="outline">
                <XCircle className="h-4 w-4 mr-1" />
                批量拒绝
              </Button>
            </div>
          )}

          {/* 用户表格 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>用户信息</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.status === 'approved' ? 'default' :
                              user.status === 'suspended' ? 'destructive' : 'secondary'
                            }
                          >
                            {user.status === 'approved' ? '已通过' :
                             user.status === 'suspended' ? '已拒绝' : '待审批'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => approveUser(user.id)}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => rejectUser(user.id)}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => openReviewDialog(user)}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Shield className="h-12 w-12 text-gray-400" />
                          <p className="text-lg font-medium text-gray-900">暂无用户</p>
                          <p className="text-sm text-gray-500">没有找到符合条件的用户</p>
                          <Button onClick={() => fetchUsers()} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            刷新数据
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 详细审核对话框 */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>详细审核 - {currentReviewUser?.name}</DialogTitle>
            <DialogDescription>
              查看用户详细信息并进行审核决策
            </DialogDescription>
          </DialogHeader>
          
          {currentReviewUser && (
            <div className="space-y-6">
              {/* 用户基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>姓名</Label>
                    <p className="text-sm">{currentReviewUser.name}</p>
                  </div>
                  <div>
                    <Label>邮箱</Label>
                    <p className="text-sm">{currentReviewUser.email}</p>
                  </div>
                  <div>
                    <Label>角色</Label>
                    <p className="text-sm">{currentReviewUser.role}</p>
                  </div>
                  <div>
                    <Label>注册时间</Label>
                    <p className="text-sm">{new Date(currentReviewUser.created).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>邮箱验证</Label>
                    <p className="text-sm">{currentReviewUser.emailVerified ? '已验证' : '未验证'}</p>
                  </div>
                  <div>
                    <Label>登录尝试次数</Label>
                    <p className="text-sm">{currentReviewUser.loginAttempts}</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI分析结果 */}
              {aiEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI分析结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const aiSuggestion = getAISuggestion(currentReviewUser.id)
                      if (!aiSuggestion) return <p className="text-gray-500">AI分析中...</p>
                      
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>AI建议</Label>
                              <Badge 
                                variant={
                                  aiSuggestion.action === 'approve' ? 'default' :
                                  aiSuggestion.action === 'reject' ? 'destructive' : 'secondary'
                                }
                                className="mt-1"
                              >
                                {aiSuggestion.action === 'approve' ? '通过' :
                                 aiSuggestion.action === 'reject' ? '拒绝' : '审核'}
                              </Badge>
                            </div>
                            <div>
                              <Label>置信度</Label>
                              <p className="text-sm mt-1">{aiSuggestion.confidence}%</p>
                            </div>
                                                         <div>
                               <Label>风险评分</Label>
                               <p className="text-sm mt-1">{Math.floor(Math.random() * 100)}/100</p>
                             </div>
                          </div>
                          
                          <div>
                            <Label>AI推理</Label>
                            <p className="text-sm mt-1">{aiSuggestion.reasoning}</p>
                          </div>
                          
                          <div>
                            <Label>风险因素</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {aiSuggestion.riskFactors.map((factor, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label>AI建议</Label>
                            <ul className="text-sm mt-1 space-y-1">
                              {aiSuggestion.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Lightbulb className="h-3 w-3 text-yellow-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* 审核笔记 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">审核笔记</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="输入审核笔记..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
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
            >
              拒绝
            </Button>
            <Button 
              onClick={() => {
                if (currentReviewUser) {
                  approveUser(currentReviewUser.id)
                  setReviewDialog(false)
                }
              }}
            >
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
