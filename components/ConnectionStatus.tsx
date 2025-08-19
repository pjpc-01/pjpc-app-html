"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Globe, Home, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { getPocketBase, reinitializePocketBase } from '@/lib/pocketbase'

interface NetworkStatus {
  url: string
  type: 'local' | 'ddns'
  name: string
  latency: number
  status: 'connected' | 'disconnected' | 'checking'
}

export default function ConnectionStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const checkNetworkStatus = async () => {
    setIsChecking(true)
    try {
      const pb = await getPocketBase()
      const url = pb.baseUrl
      
      // 确定网络类型
      let type: 'local' | 'ddns' = 'ddns'
      let name = 'DDNS'
      
      if (url.includes('192.168.0.59')) {
        type = 'local'
        name = '局域网'
      } else if (url.includes('pjpc.tplinkdns.com')) {
        type = 'ddns'
        name = 'DDNS'
      }
      
      // 测试延迟
      const startTime = Date.now()
      await fetch(`${url}/api/health`)
      const latency = Date.now() - startTime
      
      setNetworkStatus({
        url,
        type,
        name,
        latency,
        status: 'connected'
      })
    } catch (error) {
      setNetworkStatus({
        url: '未知',
        type: 'ddns',
        name: '连接失败',
        latency: 0,
        status: 'disconnected'
      })
    } finally {
      setIsChecking(false)
      setLastCheck(new Date())
    }
  }

  const handleReconnect = async () => {
    try {
      await reinitializePocketBase()
      await checkNetworkStatus()
    } catch (error) {
      console.error('重新连接失败:', error)
    }
  }

  useEffect(() => {
    checkNetworkStatus()
    
    // 每30秒检查一次网络状态
    const interval = setInterval(checkNetworkStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (!networkStatus) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        <span className="text-xs text-blue-700">检测中...</span>
      </div>
    )
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    }
    
    switch (networkStatus.status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-red-600" />
      default:
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />
    }
  }

  const getNetworkIcon = () => {
    switch (networkStatus.type) {
      case 'local':
        return <Home className="h-3 w-3 text-blue-600" />
      case 'ddns':
        return <Globe className="h-3 w-3 text-purple-600" />
      default:
        return <Wifi className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (isChecking) return 'bg-blue-100 text-blue-800'
    switch (networkStatus.status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* 状态图标 */}
      {getStatusIcon()}
      
      {/* 网络类型图标 */}
      {getNetworkIcon()}
      
      {/* 网络类型名称 */}
      <span className="text-xs font-medium text-gray-700">
        {networkStatus.name}
      </span>
      
      {/* 连接状态徽章 */}
      <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor()}`}>
        {isChecking ? '检测中' : networkStatus.status === 'connected' ? '已连接' : '未连接'}
      </Badge>
      
      {/* 延迟显示（仅在连接成功时显示） */}
      {networkStatus.status === 'connected' && !isChecking && (
        <span className="text-xs text-gray-500">
          {networkStatus.latency}ms
        </span>
      )}
      
      {/* 重新检测按钮 */}
      <button
        onClick={handleReconnect}
        disabled={isChecking}
        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="重新检测网络"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

