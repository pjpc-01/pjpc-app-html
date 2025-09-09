"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function ConnectionTest() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testUrl, setTestUrl] = useState('http://pjpc.tplinkdns.com:8090')

  const testDirectConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)
      
      console.log('🌐 测试直接连接:', testUrl)
      
      const startTime = Date.now()
      const response = await fetch(`${testUrl}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()
      
      const result = {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 连接测试结果:', result)
      setResults(result)
      
    } catch (err: any) {
      console.error('❌ 连接测试失败:', err)
      setError(err.message || '连接测试失败')
    } finally {
      setLoading(false)
    }
  }

  const testPocketBaseHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🏥 测试PocketBase健康检查:', testUrl)
      
      const startTime = Date.now()
      const response = await fetch(`${testUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()
      
      let healthData = null
      try {
        healthData = await response.json()
      } catch (e) {
        healthData = { error: '无法解析JSON响应' }
      }
      
      const result = {
        url: `${testUrl}/api/health`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        data: healthData,
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 健康检查结果:', result)
      setResults(prev => ({
        ...prev,
        healthCheck: result
      }))
      
    } catch (err: any) {
      console.error('❌ 健康检查失败:', err)
      setError(err.message || '健康检查失败')
    } finally {
      setLoading(false)
    }
  }

  const testCORS = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔒 测试CORS配置:', testUrl)
      
      const startTime = Date.now()
      const response = await fetch(`${testUrl}/api/collections`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      })
      const endTime = Date.now()
      
      const result = {
        url: `${testUrl}/api/collections`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        latency: endTime - startTime,
        corsHeaders: {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 CORS测试结果:', result)
      setResults(prev => ({
        ...prev,
        corsTest: result
      }))
      
    } catch (err: any) {
      console.error('❌ CORS测试失败:', err)
      setError(err.message || 'CORS测试失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            PocketBase连接测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testUrl">测试URL</Label>
            <Input
              id="testUrl"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="http://pjpc.tplinkdns.com:8090"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={testDirectConnection} disabled={loading}>
              {loading ? '测试中...' : '测试直接连接'}
            </Button>
            <Button onClick={testPocketBaseHealth} disabled={loading} variant="outline">
              健康检查
            </Button>
            <Button onClick={testCORS} disabled={loading} variant="outline">
              CORS测试
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
              {/* 直接连接结果 */}
              {results.url && (
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

              {/* 健康检查结果 */}
              {results.healthCheck && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.healthCheck.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      健康检查
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.healthCheck.url}</div>
                      <div><strong>状态:</strong> {results.healthCheck.status} {results.healthCheck.statusText}</div>
                      <div><strong>延迟:</strong> {results.healthCheck.latency}ms</div>
                      <div><strong>数据:</strong></div>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
                        {JSON.stringify(results.healthCheck.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CORS测试结果 */}
              {results.corsTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {results.corsTest.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      CORS测试
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {results.corsTest.url}</div>
                      <div><strong>状态:</strong> {results.corsTest.status} {results.corsTest.statusText}</div>
                      <div><strong>延迟:</strong> {results.corsTest.latency}ms</div>
                      <div><strong>CORS头:</strong></div>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
                        {JSON.stringify(results.corsTest.corsHeaders, null, 2)}
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
