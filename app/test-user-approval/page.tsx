"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useUserApproval } from '@/hooks/useUserApproval'

export default function TestUserApproval() {
  const {
    users,
    loading,
    error,
    stats,
    fetchUsers,
    clearError
  } = useUserApproval()

  const [testResult, setTestResult] = useState<any>(null)

  const runTest = async () => {
    try {
      console.log('开始测试用户审核Hook...')
      
      // 调用fetchUsers
      await fetchUsers()
      
      setTestResult({
        success: true,
        userCount: users.length,
        loading,
        error,
        stats,
        timestamp: new Date().toISOString()
      })
      
    } catch (err) {
      console.error('测试失败:', err)
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : '未知错误',
        timestamp: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    runTest()
  }, [runTest])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户审核Hook测试</h1>
        <Button onClick={runTest} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          重新测试
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {testResult && (
        <div className="space-y-6">
          {/* 测试结果 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                测试结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">测试状态</p>
                  <Badge variant={testResult.success ? 'default' : 'destructive'}>
                    {testResult.success ? '成功' : '失败'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">加载状态</p>
                  <Badge variant={loading ? 'secondary' : 'default'}>
                    {loading ? '加载中' : '完成'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">用户数量</p>
                  <p className="text-sm">{testResult.userCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">测试时间</p>
                  <p className="text-sm">{testResult.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>统计信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总用户</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">待审批</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">已通过</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">已拒绝</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 用户列表 */}
          {users && users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>用户列表 ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.name || '未设置'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge 
                          variant={
                            user.status === 'approved' ? 'default' :
                            user.status === 'suspended' ? 'destructive' : 'secondary'
                          }
                        >
                          {user.status === 'approved' ? '已通过' :
                           user.status === 'suspended' ? '已拒绝' : '待审批'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 错误详情 */}
          {testResult.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">错误详情</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{testResult.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

