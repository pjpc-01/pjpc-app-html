"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function SimpleTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('开始简单测试...')
      
      const response = await fetch('/api/simple-user-test')
      const data = await response.json()
      
      console.log('测试结果:', data)
      
      if (data.success) {
        setTestResult(data)
      } else {
        setError(data.error || '测试失败')
      }
      
    } catch (err) {
      console.error('测试失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">简单用户测试</h1>
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

          {/* 用户列表 */}
          {testResult.users && testResult.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>用户列表 ({testResult.users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResult.users.map((user: any) => (
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
        </div>
      )}
    </div>
  )
}

