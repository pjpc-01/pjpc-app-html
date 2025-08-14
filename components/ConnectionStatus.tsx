"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { checkPocketBaseConnection, detectNetworkEnvironment, updatePocketBaseUrl } from '@/lib/pocketbase'

interface NetworkStatus {
  connected: boolean
  type: 'local' | 'ddns' | 'unknown'
  url: string
  latency: number
  error?: string
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: false,
    type: 'unknown',
    url: '',
    latency: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const checkConnection = async () => {
    setLoading(true)
    try {
      console.log('开始检查网络连接...')
      
      // 检测网络环境
      const networkInfo = await detectNetworkEnvironment()
      
      // 检查连接状态
      const connectionResult = await checkPocketBaseConnection()
      
      setStatus({
        connected: connectionResult.connected,
        type: networkInfo.type,
        url: networkInfo.url,
        latency: networkInfo.latency,
        error: connectionResult.error || undefined
      })
      
      setLastCheck(new Date())
    } catch (error) {
      console.error('连接检查失败:', error)
      setStatus({
        connected: false,
        type: 'unknown',
        url: '',
        latency: 0,
        error: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await checkConnection()
  }

  const handleUpdateUrl = async () => {
    setLoading(true)
    try {
      const result = await updatePocketBaseUrl()
      if (result.success) {
        await checkConnection()
      } else {
        console.error('更新URL失败:', result.error)
      }
    } catch (error) {
      console.error('更新URL时出错:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
    
    // 每5分钟自动检查一次
    const interval = setInterval(checkConnection, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status.connected) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status.error) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusText = () => {
    if (loading) return '检查中...'
    if (status.connected) return '已连接'
    if (status.error) return '连接失败'
    return '未知状态'
  }

  const getNetworkTypeText = () => {
    switch (status.type) {
      case 'local': return '局域网'
      case 'ddns': return 'DDNS'
      default: return '未知'
    }
  }

  const getStatusColor = () => {
    if (loading) return 'bg-gray-100 text-gray-600'
    if (status.connected) return 'bg-green-100 text-green-800'
    if (status.error) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5" />
          网络连接状态
        </CardTitle>
        <CardDescription>
          智能检测局域网和DDNS连接
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 连接状态 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">连接状态:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* 网络类型 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">网络类型:</span>
          <Badge variant="outline">
            {getNetworkTypeText()}
          </Badge>
        </div>

        {/* 服务器地址 */}
        {status.url && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">服务器地址:</span>
            <span className="text-xs text-gray-600 font-mono">
              {status.url.replace('http://', '')}
            </span>
          </div>
        )}

        {/* 延迟 */}
        {status.latency > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">响应延迟:</span>
            <span className="text-xs text-gray-600">
              {status.latency}ms
            </span>
          </div>
        )}

        {/* 错误信息 */}
        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>错误:</strong> {status.error}
            </p>
          </div>
        )}

        {/* 最后检查时间 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">最后检查:</span>
          <span className="text-xs text-gray-600">
            {lastCheck.toLocaleTimeString()}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button 
            onClick={handleUpdateUrl} 
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Wifi className="h-4 w-4 mr-2" />
            切换网络
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
