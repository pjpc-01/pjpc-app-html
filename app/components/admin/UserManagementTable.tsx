"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Shield,
  RefreshCw,
  Search,
  CheckSquare,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Brain,
  Clock
} from "lucide-react"

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
  phone?: string
  department?: string
  position?: string
  notes?: string
}

interface AISuggestion {
  action: 'approve' | 'reject' | 'review' | 'escalate'
  confidence: number
  reasoning: string
  riskFactors: string[]
  recommendations: string[]
  estimatedReviewTime: number
}

interface UserManagementTableProps {
  users: UserRecord[]
  aiSuggestions: Record<string, AISuggestion>
  aiLoading: Record<string, boolean>
  aiEnabled: boolean
  selectedUsers: string[]
  selectAll: boolean
  updating: string | null
  onSelectAll: (checked: boolean) => void
  onSelectUser: (userId: string, checked: boolean) => void
  onApproveUser: (userId: string) => void
  onRejectUser: (userId: string) => void
  onDeleteUser: (userId: string) => void
  onGetAISuggestion: (userId: string) => void
  onViewUserDetail: (user: UserRecord) => void
  onReviewUser: (user: UserRecord) => void
}

export default function UserManagementTable({
  users,
  aiSuggestions,
  aiLoading,
  aiEnabled,
  selectedUsers,
  selectAll,
  updating,
  onSelectAll,
  onSelectUser,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onGetAISuggestion,
  onViewUserDetail,
  onReviewUser
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const userDate = new Date(user.created)
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      if (dateFilter === 'today') {
        matchesDate = userDate.toDateString() === today.toDateString()
      } else if (dateFilter === 'yesterday') {
        matchesDate = userDate.toDateString() === yesterday.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = userDate >= weekAgo
      }
    }
    
    return matchesSearch && matchesStatus && matchesRole && matchesDate
  })

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />待审核</Badge>
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />已审核</Badge>
      case 'suspended':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />已拒绝</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 获取角色徽章
  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string, variant: 'default' | 'secondary' | 'outline' }> = {
      'admin': { label: '管理员', variant: 'default' },
      'teacher': { label: '教师', variant: 'secondary' },
      'parent': { label: '家长', variant: 'outline' },
      'accountant': { label: '会计', variant: 'outline' }
    }
    
    const roleInfo = roleMap[role] || { label: role, variant: 'outline' as const }
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            用户审核管理
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedUsers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                批量操作 ({selectedUsers.length})
              </Button>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索和过滤 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="search">搜索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="搜索姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">状态</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已审核</SelectItem>
                <SelectItem value="suspended">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="role">角色</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
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
          <div>
            <Label htmlFor="date">注册时间</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="yesterday">昨天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 用户表格 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead>用户信息</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>AI建议</TableHead>
              <TableHead>风险评分</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  {aiEnabled && user.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      {aiLoading[user.id] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-xs text-gray-500">分析中...</span>
                        </div>
                      ) : aiSuggestions[user.id] ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant={
                                  aiSuggestions[user.id].action === 'approve' ? 'default' :
                                  aiSuggestions[user.id].action === 'reject' ? 'destructive' :
                                  aiSuggestions[user.id].action === 'escalate' ? 'secondary' : 'outline'
                                }
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <Brain className="h-3 w-3" />
                                {aiSuggestions[user.id].action === 'approve' ? '建议通过' :
                                 aiSuggestions[user.id].action === 'reject' ? '建议拒绝' :
                                 aiSuggestions[user.id].action === 'escalate' ? '需要升级' : '需要审核'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-medium mb-2">AI建议详情</p>
                                <p className="text-sm mb-2">{aiSuggestions[user.id].reasoning}</p>
                                <p className="text-xs text-gray-500">
                                  置信度: {(aiSuggestions[user.id].confidence * 100).toFixed(1)}%
                                </p>
                                {aiSuggestions[user.id].riskFactors.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium">风险因素:</p>
                                    <ul className="text-xs text-gray-500">
                                      {aiSuggestions[user.id].riskFactors.map((factor, idx) => (
                                        <li key={idx}>• {factor}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGetAISuggestion(user.id)}
                          className="flex items-center gap-1"
                        >
                          <Brain className="h-3 w-3" />
                          获取建议
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {aiSuggestions[user.id] ? (
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={aiSuggestions[user.id].action === 'approve' ? 20 : 
                               aiSuggestions[user.id].action === 'reject' ? 80 : 50} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs text-gray-600">
                        {aiSuggestions[user.id].action === 'approve' ? '低风险' :
                         aiSuggestions[user.id].action === 'reject' ? '高风险' : '中风险'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(user.created).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewUserDetail(user)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {user.status === 'pending' && (
                      <>
                        {aiSuggestions[user.id] && (
                          <Button
                            size="sm"
                            variant={aiSuggestions[user.id].action === 'approve' ? 'default' : 'outline'}
                            onClick={() => onApproveUser(user.id)}
                            disabled={updating === user.id}
                            className="flex items-center gap-1"
                            title={`AI建议: ${aiSuggestions[user.id].action === 'approve' ? '通过' : '拒绝'}`}
                          >
                            <Brain className="h-3 w-3" />
                            AI通过
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => onApproveUser(user.id)}
                          disabled={updating === user.id}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRejectUser(user.id)}
                          disabled={updating === user.id}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          拒绝
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReviewUser(user)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          详细审核
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`确定要删除用户 "${user.name}" 吗？此操作不可撤销。`)) {
                          onDeleteUser(user.id)
                        }
                      }}
                      disabled={updating === user.id}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户</h3>
            <p className="text-gray-600">没有找到符合条件的用户</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
