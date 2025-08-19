'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Wifi, WifiOff, Globe, CheckCircle, XCircle } from 'lucide-react'

interface TestResult {
  name: string
  url: string
  status: 'success' | 'error' | 'testing'
  latency?: number
  error?: string
}

export default function MobileConnectionTestPage() {
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [bestConnection, setBestConnection] = useState<string | null>(null)

  // 移动设备优先的测试地址
  const testUrls = [
    { name: 'DDNS (外网)', url: 'http://pjpc.tplinkdns.com:8090' },
    { name: '本地主机', url: 'http://localhost:8090' },
    { name: '本地回环', url: 'http://127.0.0.1:8090' },
    { name: '内网服务器1', url: 'http://192.168.0.59:8090' },
    { name: '路由器', url: 'http://192.168.0.1:8090' },
    { name: '内网服务器2', url: 'http://192.168.0.100:8090' }
  ]

  const runConnectionTest = async () => {
    setIsTesting(true)
    setResults([])
    setBestConnection(null)

    // 初始化测试结果
    const initialResults = testUrls.map(item => ({
      ...item,
      status: 'testing' as const
    }))
    setResults(initialResults)

    // 并行测试所有连接
    const testPromises = testUrls.map(async (item) => {
      try {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 移动网络可能需要更长时间

        const response = await fetch(`${item.url}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const endTime = Date.now()
        const latency = endTime - startTime

        if (response.ok) {
          return {
            ...item,
            status: 'success' as const,
            latency
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        return {
          ...item,
          status: 'error' as const,
          error: error instanceof Error ? error.message : '连接失败'
        }
      }
    })

    const testResults = await Promise.all(testPromises)
    setResults(testResults)

    // 找到最佳连接
    const successfulResults = testResults.filter(r => r.status === 'success')
    if (successfulResults.length > 0) {
      const best = successfulResults.reduce((best, current) => 
        (current.latency || 0) < (best.latency || 0) ? current : best
      )
      setBestConnection(best.url)
    }

    setIsTesting(false)
  }

  useEffect(() => {
    runConnectionTest()
  }, [])

  const getStatusIcon = (status: 'success' | 'error' | 'testing') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  const getStatusColor = (status: 'success' | 'error' | 'testing') => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'testing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const successfulCount = results.filter(r => r.status === 'success').length

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">移动设备连接测试</h1>
        <Button
          onClick={runConnectionTest}
          disabled={isTesting}
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? '测试中...' : '重新测试'}
        </Button>
      </div>

      {/* 测试结果概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5" />
            连接状态概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{results.length}</div>
              <div className="text-xs text-blue-700">总测试数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{successfulCount}</div>
              <div className="text-xs text-green-700">成功连接</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{results.length - successfulCount}</div>
              <div className="text-xs text-red-700">失败连接</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最佳连接 */}
      {bestConnection && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>推荐连接:</strong> {bestConnection}
            {results.find(r => r.url === bestConnection)?.latency && (
              <span className="ml-2 text-sm text-gray-600">
                (延迟: {results.find(r => r.url === bestConnection)?.latency}ms)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 详细测试结果 */}
      <Card>
        <CardHeader>
          <CardTitle>详细连接结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm opacity-75">{result.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result.status === 'success' && result.latency && (
                    <Badge variant="outline">{result.latency}ms</Badge>
                  )}
                  {result.status === 'error' && result.error && (
                    <span className="text-xs text-red-600">{result.error}</span>
                  )}
                  {getStatusIcon(result.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 移动设备使用建议 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">移动设备使用建议</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• 移动设备优先使用DDNS地址访问</li>
            <li>• 确保手机网络连接稳定</li>
            <li>• 如果DDNS连接失败，请检查网络设置</li>
            <li>• 建议使用WiFi网络以获得更好的连接稳定性</li>
            <li>• 如果所有连接都失败，请联系管理员</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
