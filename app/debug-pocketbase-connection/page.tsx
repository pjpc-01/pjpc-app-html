"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function PocketBaseConnectionTest() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testDirectFetch = async () => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)
      
      console.log('🌐 测试直接fetch到PocketBase...')
      
      const startTime = Date.now()
      const response = await fetch('http://pjpc.tplinkdns.com:8090/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()
      
      const result = {
        type: 'direct_fetch',
        url: 'http://pjpc.tplinkdns.com:8090/',
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 直接fetch结果:', result)
      setResults(result)
      
    } catch (err: any) {
      console.error('❌ 直接fetch失败:', err)
      setError(err.message || '直接fetch失败')
    } finally {
      setLoading(false)
    }
  }

  const testAPIEndpoint = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 测试PocketBase API端点...')
      
      const startTime = Date.now()
      const response = await fetch('http://pjpc.tplinkdns.com:8090/api/collections', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()
      
      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = { error: '无法解析JSON响应' }
      }
      
      const result = {
        type: 'api_endpoint',
        url: 'http://pjpc.tplinkdns.com:8090/api/collections',
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 API端点测试结果:', result)
      setResults(prev => ({
        ...prev,
        apiTest: result
      }))
      
    } catch (err: any) {
      console.error('❌ API端点测试失败:', err)
      setError(err.message || 'API端点测试失败')
    } finally {
      setLoading(false)
    }
  }

  const testUserAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 测试用户认证...')
      
      const startTime = Date.now()
      const response = await fetch('http://pjpc.tplinkdns.com:8090/api/collections/users/auth-with-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: 'test@example.com',
          password: 'testpassword'
        })
      })
      const endTime = Date.now()
      
      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = { error: '无法解析JSON响应' }
      }
      
      const result = {
        type: 'user_auth',
        url: 'http://pjpc.tplinkdns.com:8090/api/collections/users/auth-with-password',
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 用户认证测试结果:', result)
      setResults(prev => ({
        ...prev,
        authTest: result
      }))
      
    } catch (err: any) {
      console.error('❌ 用户认证测试失败:', err)
      setError(err.message || '用户认证测试失败')
    } finally {
      setLoading(false)
    }
  }

  const testProxyEndpoint = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 测试代理端点...')
      
      const startTime = Date.now()
      const response = await fetch('/api/pocketbase-proxy/collections', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()
      
      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = { error: '无法解析JSON响应' }
      }
      
      const result = {
        type: 'proxy_endpoint',
        url: '/api/pocketbase-proxy/collections',
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 代理端点测试结果:', result)
      setResults(prev => ({
        ...prev,
        proxyTest: result
      }))
      
    } catch (err: any) {
      console.error('❌ 代理端点测试失败:', err)
      setError(err.message || '代理端点测试失败')
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
            PocketBase连接诊断
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testDirectFetch} disabled={loading}>
              {loading ? '测试中...' : '测试直接连接'}
            </Button>
            <Button onClick={testAPIEndpoint} disabled={loading} variant="outline">
              测试API端点
            </Button>
            <Button onClick={testUserAuth} disabled={loading} variant="outline">
              测试用户认证
            </Button>
            <Button onClick={testProxyEndpoint} disabled={loading} variant="outline">
              测试代理端点
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
              {/* 直接连接测试 */}
              {results.type === 'direct_fetch' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      直接连接测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.url}</div>
                      <div><strong>状态:</strong> {results.status} {results.statusText}</div>
                      <div><strong>成功:</strong> {results.ok ? '是' : '否'}</div>
                      <div><strong>延迟:</strong> {results.latency}ms</div>
                      <div><strong>时间:</strong> {results.timestamp}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API端点测试 */}
              {results.apiTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.apiTest.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      API端点测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.apiTest.url}</div>
                      <div><strong>状态:</strong> {results.apiTest.status} {results.apiTest.statusText}</div>
                      <div><strong>延迟:</strong> {results.apiTest.latency}ms</div>
                      <div><strong>数据:</strong></div>
                      <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">
                        {JSON.stringify(results.apiTest.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 用户认证测试 */}
              {results.authTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.authTest.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      用户认证测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.authTest.url}</div>
                      <div><strong>状态:</strong> {results.authTest.status} {results.authTest.statusText}</div>
                      <div><strong>延迟:</strong> {results.authTest.latency}ms</div>
                      <div><strong>数据:</strong></div>
                      <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">
                        {JSON.stringify(results.authTest.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 代理端点测试 */}
              {results.proxyTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.proxyTest.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      代理端点测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.proxyTest.url}</div>
                      <div><strong>状态:</strong> {results.proxyTest.status} {results.proxyTest.statusText}</div>
                      <div><strong>延迟:</strong> {results.proxyTest.latency}ms</div>
                      <div><strong>数据:</strong></div>
                      <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">
                        {JSON.stringify(results.proxyTest.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 原始数据 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">原始测试数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
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
