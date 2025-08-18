"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Smartphone, Wifi, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export default function MobileNFCTestPage() {
  const [isHttps, setIsHttps] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcPermission, setNfcPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    // 检查当前URL
    const url = window.location.href
    setCurrentUrl(url)
    
    // 检查是否为HTTPS
    setIsHttps(window.location.protocol === 'https:')
    
    // 检查是否为移动设备
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
    
    // 检查NFC支持
    if ('NDEFReader' in window) {
      setNfcSupported(true)
      // 检查NFC权限
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'nfc' as any })
          .then(result => {
            setNfcPermission(result.state)
          })
          .catch(() => {
            setNfcPermission('unknown')
          })
      }
    }
  }, [])

  const switchToHttps = () => {
    const httpsUrl = currentUrl.replace('http://', 'https://')
    window.location.href = httpsUrl
  }

  const getHttpsUrl = () => {
    const baseUrl = currentUrl.replace('http://', 'https://')
    return baseUrl.replace('/mobile-nfc-test', '/mobile-nfc')
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">📱 手机NFC功能测试</h1>
          <p className="text-gray-600">检查您的设备和浏览器是否支持NFC功能</p>
        </div>

        {/* 当前状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              当前状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span>协议:</span>
                <Badge variant={isHttps ? "default" : "destructive"}>
                  {isHttps ? "HTTPS" : "HTTP"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>设备:</span>
                <Badge variant={isMobile ? "default" : "secondary"}>
                  {isMobile ? "移动设备" : "桌面设备"}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              当前URL: {currentUrl}
            </div>
          </CardContent>
        </Card>

        {/* HTTPS检查 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              HTTPS连接检查
            </CardTitle>
            <CardDescription>
              NFC功能需要HTTPS连接才能正常工作
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHttps ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ 您正在使用HTTPS连接，NFC功能应该可以正常工作
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ❌ 您正在使用HTTP连接，NFC功能无法正常工作
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    请使用以下HTTPS链接访问NFC功能：
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
                    {getHttpsUrl()}
                  </div>
                  <Button onClick={switchToHttps} className="w-full">
                    切换到HTTPS
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NFC支持检查 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              NFC支持检查
            </CardTitle>
            <CardDescription>
              检查浏览器和设备是否支持NFC功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span>NFC支持:</span>
                <Badge variant={nfcSupported ? "default" : "destructive"}>
                  {nfcSupported ? "支持" : "不支持"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>权限状态:</span>
                <Badge variant={
                  nfcPermission === 'granted' ? "default" : 
                  nfcPermission === 'denied' ? "destructive" : "secondary"
                }>
                  {nfcPermission === 'granted' ? '已授权' :
                   nfcPermission === 'denied' ? '已拒绝' :
                   nfcPermission === 'prompt' ? '待授权' : '未知'}
                </Badge>
              </div>
            </div>
            
            {!nfcSupported && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ 您的浏览器或设备不支持NFC功能
                </AlertDescription>
              </Alert>
            )}
            
            {nfcSupported && nfcPermission === 'denied' && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ NFC权限已被拒绝，请在浏览器设置中重新授权
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>📋 使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. HTTPS连接</h4>
              <p className="text-sm text-gray-600">
                确保使用HTTPS协议访问应用，NFC功能需要安全连接
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. 移动设备</h4>
              <p className="text-sm text-gray-600">
                在手机或平板电脑上使用支持NFC的浏览器（如Chrome）
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. 权限授权</h4>
              <p className="text-sm text-gray-600">
                首次使用时，浏览器会请求NFC权限，请点击&quot;允许&quot;
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">4. 开始使用</h4>
              <p className="text-sm text-gray-600">
                将NFC卡片靠近设备背面，系统会自动读取卡片信息
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button 
            onClick={() => window.location.href = '/mobile-nfc'} 
            className="flex-1"
            disabled={!isHttps}
          >
            进入NFC签到页面
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
