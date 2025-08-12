
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Clock, User, Mail, Shield, RefreshCw } from 'lucide-react'
import { pb } from '@/lib/pocketbase'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  status: 'pending' | 'approved' | 'suspended'
  created: string
}

export default function UserApproval() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 检查认证状态
      if (!pb.authStore.isValid) {
        setError('请先登录')
        return
      }
      
      // 检查用户角色
      const currentUser = pb.authStore.model
      if (currentUser && currentUser.role === 'admin') {
        setIsAdmin(true)
      } else {
        setError('只有管理员可以访问用户审核功能')
        return
      }
      
      const records = await pb.collection('users').getList(1, 50, {
        sort: '-created'
      })
      
      setUsers(records.items as unknown as UserRecord[])
    } catch (err: any) {
      let errorMessage = '获取用户列表失败'
      
      if (err.status === 0) {
        errorMessage = '网络连接失败，请检查网络连接'
      } else if (err.status === 403) {
        errorMessage = '权限不足，无法访问用户列表'
      } else if (err.status === 401) {
        errorMessage = '认证失败，请重新登录'
      } else if (err.status === 400) {
        errorMessage = '请求参数错误，请检查字段设置'
      } else if (err.data) {
        errorMessage = `获取失败: ${err.data.message || err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 审核用户
  const approveUser = async (userId: string) => {
    try {
      setUpdating(userId)
      await pb.collection('users').update(userId, {
        status: 'approved'
      })
      
      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'approved' as const } : user
      ))
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
      await pb.collection('users').update(userId, {
        status: 'suspended'
      })
      
      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'suspended' as const } : user
      ))
    } catch (err) {
      setError('拒绝用户失败')
    } finally {
      setUpdating(null)
    }
  }

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

  useEffect(() => {
    fetchUsers()
  }, [])

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
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">用户审核</h2>
            <p className="text-gray-600">管理新注册用户的审核状态</p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {users.map(user => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  注册时间: {new Date(user.created).toLocaleString('zh-CN')}
                </div>
                {user.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveUser(user.id)}
                      disabled={updating === user.id}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectUser(user.id)}
                      disabled={updating === user.id}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      拒绝
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户</h3>
          <p className="text-gray-600">目前没有需要审核的用户</p>
          <div className="mt-4">
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新列表
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
