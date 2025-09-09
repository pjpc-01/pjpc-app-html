"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Wifi, 
  WifiOff, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  MapPin
} from "lucide-react"

interface WiFiVerificationProps {
  onWiFiVerified: (isVerified: boolean, networkInfo?: any) => void
  allowedNetworks?: string[]
  centerId?: string
}

export default function WiFiVerification({ 
  onWiFiVerified, 
  allowedNetworks = [],
  centerId 
}: WiFiVerificationProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null)
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [configuredNetworks, setConfiguredNetworks] = useState<string[]>([])

  // 默认允许的网络列表（备用）
  const defaultAllowedNetworks = [
    'PJPC-WiFi',
    'PJPC-Office',
    'PJPC-Center',
    '安亲班WiFi',
    'PJPC-Admin',
    'PJPC-Teacher',
    // 可以根据中心ID添加特定网络
    ...(centerId ? [`PJPC-${centerId.toUpperCase()}`, `PJPC-${centerId}`] : [])
  ]

  // 加载配置的网络列表
  const loadConfiguredNetworks = async () => {
    try {
      const response = await fetch('/api/wifi-networks')
      const data = await response.json()
      
      if (data.success && data.data) {
        const activeNetworks = data.data
          .filter((network: any) => network.is_active)
          .map((network: any) => network.network_name)
        setConfiguredNetworks(activeNetworks)
      }
    } catch (error) {
      console.warn('无法加载配置的WiFi网络，使用默认列表:', error)
    }
  }

  // 确定最终允许的网络列表
  const finalAllowedNetworks = configuredNetworks.length > 0 
    ? configuredNetworks 
    : allowedNetworks.length > 0 
      ? allowedNetworks 
      : defaultAllowedNetworks

  const checkWiFiConnection = async () => {
    setIsChecking(true)
    setError(null)
    
    try {
      // 检查是否在HTTPS环境下
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
        throw new Error('WiFi验证需要HTTPS环境')
      }

      // 检查网络连接状态
      if (!navigator.onLine) {
        throw new Error('设备未连接到网络')
      }

      // 尝试获取网络信息
      // 注意：由于浏览器安全限制，无法直接获取WiFi SSID
      // 但我们可以通过其他方式验证
      const networkInfo = await getNetworkInfo()
      
      if (networkInfo) {
        setCurrentNetwork(networkInfo.ssid || '未知网络')
        
        // 检查是否在允许的网络列表中
        const isNetworkAllowed = finalAllowedNetworks.some(allowedNetwork => 
          networkInfo.ssid?.toLowerCase().includes(allowedNetwork.toLowerCase()) ||
          allowedNetwork.toLowerCase().includes(networkInfo.ssid?.toLowerCase() || '')
        )
        
        setIsAllowed(isNetworkAllowed)
        onWiFiVerified(isNetworkAllowed, networkInfo)
        
        if (!isNetworkAllowed) {
          setError(`当前网络 "${networkInfo.ssid}" 不在允许列表中`)
        }
      } else {
        // 如果无法获取网络信息，使用备用验证方法
        const fallbackResult = await fallbackWiFiVerification()
        setIsAllowed(fallbackResult)
        onWiFiVerified(fallbackResult)
        
        if (!fallbackResult) {
          setError('无法验证WiFi网络，请确保连接到安亲班WiFi')
        }
      }
    } catch (err: any) {
      console.error('WiFi验证失败:', err)
      setError(err.message || 'WiFi验证失败')
      setIsAllowed(false)
      onWiFiVerified(false)
    } finally {
      setIsChecking(false)
    }
  }

  // 获取网络信息（受浏览器限制，可能无法获取SSID）
  const getNetworkInfo = async () => {
    try {
      // 尝试使用网络信息API（如果支持）
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        return {
          ssid: connection.effectiveType || '未知',
          type: connection.type || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        }
      }
      
      // 备用方法：通过IP地址范围判断
      const ipInfo = await getIPInfo()
      return {
        ssid: ipInfo.network || '未知网络',
        ip: ipInfo.ip,
        location: ipInfo.location
      }
    } catch (error) {
      console.warn('无法获取网络信息:', error)
      return null
    }
  }

  // 获取IP信息
  const getIPInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        ip: data.ip,
        network: data.org || '未知网络',
        location: `${data.city}, ${data.country}`
      }
    } catch (error) {
      console.warn('无法获取IP信息:', error)
      return {
        ip: '未知',
        network: '未知网络',
        location: '未知位置'
      }
    }
  }

  // 备用WiFi验证方法
  const fallbackWiFiVerification = async () => {
    try {
      // 方法1：检查IP地址范围（如果知道安亲班的IP段）
      const ipInfo = await getIPInfo()
      
      // 方法2：检查网络延迟和速度特征
      const networkSpeed = await testNetworkSpeed()
      
      // 方法3：检查是否在特定地理位置（如果允许）
      const isInAllowedLocation = checkLocation(ipInfo.location)
      
      // 综合判断
      const isLikelyOfficeNetwork = 
        networkSpeed.isStable && 
        networkSpeed.latency < 100 && 
        (isInAllowedLocation || ipInfo.network.includes('PJPC'))
      
      return isLikelyOfficeNetwork
    } catch (error) {
      console.warn('备用验证失败:', error)
      return false
    }
  }

  // 测试网络速度
  const testNetworkSpeed = async () => {
    const startTime = Date.now()
    try {
      // 发送一个小的请求来测试延迟
      await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      })
      const latency = Date.now() - startTime
      
      return {
        latency,
        isStable: latency < 500 // 延迟小于500ms认为是稳定的
      }
    } catch (error) {
      return {
        latency: 999,
        isStable: false
      }
    }
  }

  // 检查位置（可以根据需要配置）
  const checkLocation = (location: string) => {
    const allowedLocations = [
      'Kuala Lumpur',
      'Selangor',
      'Malaysia'
    ]
    
    return allowedLocations.some(allowed => 
      location.toLowerCase().includes(allowed.toLowerCase())
    )
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    checkWiFiConnection()
  }

  useEffect(() => {
    // 加载配置的网络列表
    loadConfiguredNetworks()
    // 自动检查WiFi连接
    checkWiFiConnection()
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          WiFi网络验证
        </CardTitle>
        <CardDescription>
          请确保您已连接到安亲班的WiFi网络
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前网络状态 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {isAllowed === true ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : isAllowed === false ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-medium">
              {currentNetwork || '检查中...'}
            </span>
          </div>
          <Badge variant={isAllowed === true ? 'default' : isAllowed === false ? 'destructive' : 'secondary'}>
            {isAllowed === true ? '已验证' : isAllowed === false ? '未验证' : '检查中'}
          </Badge>
        </div>

        {/* 允许的网络列表 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">允许的网络：</h4>
          <div className="flex flex-wrap gap-2">
            {finalAllowedNetworks.map((network, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {network}
              </Badge>
            ))}
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button 
            onClick={checkWiFiConnection}
            disabled={isChecking}
            className="flex-1"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                检查中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新检查
              </>
            )}
          </Button>
          
          {retryCount > 0 && (
            <Button 
              variant="outline"
              onClick={handleRetry}
              disabled={isChecking}
            >
              重试 ({retryCount})
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 请确保连接到安亲班的WiFi网络</p>
          <p>• 如果无法验证，请联系管理员</p>
          <p>• 系统会自动检测网络环境</p>
        </div>
      </CardContent>
    </Card>
  )
}
