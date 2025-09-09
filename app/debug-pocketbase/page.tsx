"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function PocketBaseDiagnostic() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)
      
      console.log('🔍 开始PocketBase诊断...')
      
      const response = await fetch('/api/test-pocketbase')
      const data = await response.json()
      
      console.log('📊 诊断结果:', data)
      setResults(data)
      
    } catch (err: any) {
      console.error('❌ 诊断失败:', err)
      setError(err.message || '诊断失败')
    } finally {
      setLoading(false)
    }
  }

  const testUserAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 测试用户认证...')
      
      const response = await fetch('/api/simple-user-test')
      const data = await response.json()
      
      console.log('📊 用户认证测试结果:', data)
      setResults(prev => ({
        ...prev,
        userAuthTest: data
      }))
      
    } catch (err: any) {
      console.error('❌ 用户认证测试失败:', err)
      setError(err.message || '用户认证测试失败')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🌐 测试连接...')
      
      // 测试直接连接
      const directResponse = await fetch('http://pjpc.tplinkdns.com:8090/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const directData = {
        status: directResponse.status,
        ok: directResponse.ok,
        statusText: directResponse.statusText,
        url: directResponse.url
      }
      
      console.log('📡 直接连接结果:', directData)
      
      setResults(prev => ({
        ...prev,
        directConnection: directData
      }))
      
    } catch (err: any) {
      console.error('❌ 连接测试失败:', err)
      setError(err.message || '连接测试失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            PocketBase诊断工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? '诊断中...' : '运行完整诊断'}
            </Button>
            <Button onClick={testUserAuth} disabled={loading} variant="outline">
              测试用户认证
            </Button>
            <Button onClick={testConnection} disabled={loading} variant="outline">
              测试连接
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              {/* 连接状态 */}
              {results.connection && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.connection.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      连接状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>状态:</strong> {results.connection.success ? '成功' : '失败'}</div>
                      <div><strong>URL:</strong> {results.connection.url}</div>
                      <div><strong>延迟:</strong> {results.connection.latency}ms</div>
                      {results.connection.error && (
                        <div><strong>错误:</strong> {results.connection.error}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 管理员认证 */}
              {results.adminAuth && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.adminAuth.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      管理员认证
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>状态:</strong> {results.adminAuth.success ? '成功' : '失败'}</div>
                      {results.adminAuth.user && (
                        <div><strong>用户:</strong> {results.adminAuth.user.email}</div>
                      )}
                      {results.adminAuth.error && (
                        <div><strong>错误:</strong> {results.adminAuth.error}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 用户认证测试 */}
              {results.userAuthTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.userAuthTest.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      用户认证测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>状态:</strong> {results.userAuthTest.success ? '成功' : '失败'}</div>
                      {results.userAuthTest.user && (
                        <div><strong>用户:</strong> {results.userAuthTest.user.email}</div>
                      )}
                      {results.userAuthTest.error && (
                        <div><strong>错误:</strong> {results.userAuthTest.error}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 直接连接测试 */}
              {results.directConnection && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.directConnection.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      直接连接测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>状态:</strong> {results.directConnection.status} {results.directConnection.statusText}</div>
                      <div><strong>URL:</strong> {results.directConnection.url}</div>
                      <div><strong>成功:</strong> {results.directConnection.ok ? '是' : '否'}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 集合信息 */}
              {results.collections && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">集合信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>状态:</strong> {results.collections.success ? '成功' : '失败'}</div>
                      {results.collections.info && (
                        <div>
                          <strong>集合数量:</strong> {results.collections.info.length}
                          <div className="mt-2">
                            <strong>集合列表:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {results.collections.info.map((collection: any) => (
                                <li key={collection.name}>{collection.name}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      {results.collections.error && (
                        <div><strong>错误:</strong> {results.collections.error}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 原始数据 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">原始诊断数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}