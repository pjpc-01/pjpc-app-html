"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import PocketBase from 'pocketbase'

interface DebugInfo {
  success: boolean
  pocketbaseUrl?: string
  authStatus?: boolean
  currentUser?: any
  userCount?: number
  users?: any[]
  collectionInfo?: any
  healthStatus?: string
  unauthenticatedAccess?: any
  authResult?: any
  authenticatedAccess?: any
  error?: string
  errorDetails?: string
  timestamp?: string
}

export default function DebugPocketBase() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testPocketBase = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('开始测试PocketBase连接...')
      
      // 使用服务器端API避免CORS问题
      const response = await fetch('/api/test-pocketbase')
      const data = await response.json()
      
      console.log('服务器端测试结果:', data)
      
      if (!data.success) {
        throw new Error(data.error || '服务器端测试失败')
      }
      
      // 构建调试信息
      const info: DebugInfo = {
        success: true,
        pocketbaseUrl: data.pocketbaseUrl,
        authStatus: data.authResult.success,
        currentUser: data.authResult.user,
        userCount: data.authenticatedAccess.userCount,
        users: data.authenticatedAccess.users,
        collectionInfo: data.collectionInfo.info,
        healthStatus: data.healthStatus,
        unauthenticatedAccess: data.unauthenticatedAccess,
        authResult: data.authResult,
        authenticatedAccess: data.authenticatedAccess,
        timestamp: data.timestamp
      }
      
      setDebugInfo(info)
      console.log('调试信息:', info)
      
    } catch (err) {
      console.error('PocketBase测试错误:', err)
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      
      setDebugInfo({
        success: false,
        error: errorMessage,
        errorDetails: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testPocketBase()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PocketBase 调试工具</h1>
        <Button onClick={testPocketBase} disabled={loading}>
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

      {debugInfo && (
        <div className="space-y-6">
          {/* 连接状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {debugInfo.success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                连接状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">PocketBase URL</p>
                  <p className="text-sm">{debugInfo.pocketbaseUrl || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">连接状态</p>
                  <Badge variant={debugInfo.healthStatus === 'connected' ? 'default' : 'destructive'}>
                    {debugInfo.healthStatus === 'connected' ? '已连接' : '连接失败'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">认证状态</p>
                  <Badge variant={debugInfo.authStatus ? 'default' : 'secondary'}>
                    {debugInfo.authStatus ? '已认证' : '未认证'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">用户数量</p>
                  <p className="text-sm">{debugInfo.userCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">未认证访问</p>
                  <Badge variant={debugInfo.unauthenticatedAccess?.success ? 'default' : 'secondary'}>
                    {debugInfo.unauthenticatedAccess?.success ? '成功' : '失败'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">测试时间</p>
                  <p className="text-sm">{debugInfo.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          {debugInfo.users && debugInfo.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>用户列表 ({debugInfo.users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.users.map((user) => (
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

          {/* 详细测试结果 */}
          <Card>
            <CardHeader>
              <CardTitle>详细测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 认证测试 */}
                <div>
                  <h4 className="font-medium mb-2">认证测试</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">登录状态:</span>
                      <Badge variant={debugInfo.authResult?.success ? 'default' : 'destructive'} className="ml-2">
                        {debugInfo.authResult?.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">当前用户:</span>
                      <span className="ml-2">{debugInfo.authResult?.user?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">用户角色:</span>
                      <span className="ml-2">{debugInfo.authResult?.user?.role || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">用户状态:</span>
                      <span className="ml-2">{debugInfo.authResult?.user?.status || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 访问测试 */}
                <div>
                  <h4 className="font-medium mb-2">访问测试</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">未认证访问:</span>
                      <Badge variant={debugInfo.unauthenticatedAccess?.success ? 'default' : 'secondary'} className="ml-2">
                        {debugInfo.unauthenticatedAccess?.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">认证后访问:</span>
                      <Badge variant={debugInfo.authenticatedAccess?.success ? 'default' : 'destructive'} className="ml-2">
                        {debugInfo.authenticatedAccess?.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">未认证用户数:</span>
                      <span className="ml-2">{debugInfo.unauthenticatedAccess?.userCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">认证后用户数:</span>
                      <span className="ml-2">{debugInfo.authenticatedAccess?.userCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 错误信息 */}
                {debugInfo.unauthenticatedAccess?.error && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">未认证访问错误</h4>
                    <p className="text-sm text-red-600">{debugInfo.unauthenticatedAccess.error}</p>
                  </div>
                )}
                {debugInfo.authResult?.error && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">认证错误</h4>
                    <p className="text-sm text-red-600">{debugInfo.authResult.error}</p>
                  </div>
                )}
                {debugInfo.authenticatedAccess?.error && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">认证后访问错误</h4>
                    <p className="text-sm text-red-600">{debugInfo.authenticatedAccess.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 集合信息 */}
          {debugInfo.collectionInfo && (
            <Card>
              <CardHeader>
                <CardTitle>集合信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">集合名称</p>
                    <p className="text-sm">{debugInfo.collectionInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">List权限</p>
                    <p className="text-sm">{debugInfo.collectionInfo.listRule || '无'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">View权限</p>
                    <p className="text-sm">{debugInfo.collectionInfo.viewRule || '无'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 错误详情 */}
          {debugInfo.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">错误详情</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{debugInfo.error}</p>
                {debugInfo.errorDetails && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {debugInfo.errorDetails}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
