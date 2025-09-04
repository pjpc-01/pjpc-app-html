"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Zap,
  Shield
} from "lucide-react"

export default function NFCTestPage() {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [nfcPermission, setNfcPermission] = useState<PermissionState | null>(null)
  const [isHttps, setIsHttps] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [nfcStatus, setNfcStatus] = useState<string>('检测中...')
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    runNFCDiagnostics()
  }, [])

  const runNFCDiagnostics = async () => {
    const results = []
    
    // 1. 检查HTTPS
    const https = window.location.protocol === 'https:'
    setIsHttps(https)
    results.push({
      test: 'HTTPS连接',
      status: https ? 'success' : 'error',
      message: https ? '✅ 使用HTTPS连接' : '❌ 需要HTTPS连接才能使用NFC'
    })

    // 2. 检查移动设备
    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
    results.push({
      test: '移动设备',
      status: mobile ? 'success' : 'warning',
      message: mobile ? '✅ 检测到移动设备' : '⚠️ 建议在移动设备上使用NFC功能'
    })

    // 3. 检查NFC API支持
    const nfcSupported = 'NDEFReader' in window
    setNfcSupported(nfcSupported)
    results.push({
      test: 'NFC API支持',
      status: nfcSupported ? 'success' : 'error',
      message: nfcSupported ? '✅ 浏览器支持Web NFC API' : '❌ 浏览器不支持Web NFC API'
    })

    // 4. 检查NFC权限
    if (nfcSupported) {
      try {
        const permission = await navigator.permissions.query({ name: 'nfc' as PermissionName })
        setNfcPermission(permission.state)
        results.push({
          test: 'NFC权限',
          status: permission.state === 'granted' ? 'success' : 
                  permission.state === 'prompt' ? 'warning' : 'error',
          message: permission.state === 'granted' ? '✅ NFC权限已授予' :
                   permission.state === 'prompt' ? '⚠️ 需要用户授权NFC权限' :
                   '❌ NFC权限被拒绝'
        })
      } catch (error) {
        results.push({
          test: 'NFC权限',
          status: 'error',
          message: '❌ 无法检查NFC权限'
        })
      }
    }

    // 5. 检查NFC硬件
    if (nfcSupported) {
      try {
        const reader = new (window as any).NDEFReader()
        results.push({
          test: 'NFC硬件',
          status: 'success',
          message: '✅ NFC硬件可用'
        })
      } catch (error) {
        results.push({
          test: 'NFC硬件',
          status: 'error',
          message: '❌ NFC硬件不可用或未启用'
        })
      }
    }

    setTestResults(results)
    
    // 更新状态
    if (!https) {
      setNfcStatus('需要HTTPS连接')
    } else if (!nfcSupported) {
      setNfcStatus('浏览器不支持NFC')
    } else if (nfcPermission === 'denied') {
      setNfcStatus('NFC权限被拒绝')
    } else if (nfcPermission === 'granted') {
      setNfcStatus('NFC功能可用')
    } else {
      setNfcStatus('需要用户授权')
    }
  }

  const requestNFCPermission = async () => {
    if (!nfcSupported) return

    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()
      setNfcPermission('granted')
      setNfcStatus('NFC功能可用')
      runNFCDiagnostics()
    } catch (error) {
      console.error('NFC权限请求失败:', error)
      setNfcPermission('denied')
      setNfcStatus('NFC权限被拒绝')
    }
  }

  const testNFCRead = async () => {
    if (!nfcSupported || nfcPermission !== 'granted') {
      alert('NFC功能不可用，请先解决上述问题')
      return
    }

    try {
      const reader = new (window as any).NDEFReader()
      await reader.scan()
      
      reader.addEventListener('reading', (event: any) => {
        console.log('NFC读取成功:', event)
        alert(`NFC读取成功！\n\nUID: ${event.serialNumber}\n消息: ${JSON.stringify(event.message)}`)
      })

      reader.addEventListener('readingerror', (event: any) => {
        console.error('NFC读取错误:', event)
        alert('NFC读取失败，请重试')
      })

      alert('请将NFC卡片靠近设备...')
    } catch (error) {
      console.error('NFC测试失败:', error)
      alert('NFC测试失败: ' + error.message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-700">通过</Badge>
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-700">警告</Badge>
      case 'error': return <Badge className="bg-red-100 text-red-700">失败</Badge>
      default: return <Badge className="bg-blue-100 text-blue-700">检测中</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            NFC功能诊断工具
          </h1>
          <p className="text-gray-600 text-lg">检测和测试NFC功能是否正常工作</p>
        </div>

        {/* 总体状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              NFC功能状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {nfcStatus === 'NFC功能可用' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className="text-lg font-semibold">{nfcStatus}</span>
              </div>
              <Button onClick={runNFCDiagnostics} variant="outline">
                重新检测
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 检测结果 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              系统检测结果
            </CardTitle>
            <CardDescription>检查NFC功能所需的各种条件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{result.message}</span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 解决方案 */}
        {nfcStatus !== 'NFC功能可用' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                解决方案
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isHttps && (
                  <Alert>
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      <strong>HTTPS连接问题：</strong><br />
                      1. 确保使用HTTPS协议访问网站<br />
                      2. 如果使用本地开发，请使用 https://localhost:3000<br />
                      3. 生产环境必须使用HTTPS证书
                    </AlertDescription>
                  </Alert>
                )}

                {!nfcSupported && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>浏览器不支持NFC：</strong><br />
                      1. 使用Chrome 89+浏览器（推荐）<br />
                      2. 确保浏览器版本是最新的<br />
                      3. 在Android设备上使用Chrome浏览器<br />
                      4. iOS设备暂不支持Web NFC API
                    </AlertDescription>
                  </Alert>
                )}

                {nfcSupported && nfcPermission !== 'granted' && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>NFC权限问题：</strong><br />
                      1. 点击下方的"请求NFC权限"按钮<br />
                      2. 在浏览器弹出的权限对话框中点击"允许"<br />
                      3. 确保设备NFC功能已开启
                    </AlertDescription>
                  </Alert>
                )}

                {!isMobile && (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      <strong>设备建议：</strong><br />
                      1. NFC功能主要在移动设备上使用<br />
                      2. 建议在Android手机或平板上测试<br />
                      3. 确保设备的NFC功能已开启
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          {nfcSupported && nfcPermission !== 'granted' && (
            <Button onClick={requestNFCPermission} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              请求NFC权限
            </Button>
          )}

          {nfcStatus === 'NFC功能可用' && (
            <Button onClick={testNFCRead} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Zap className="h-4 w-4" />
              测试NFC读取
            </Button>
          )}

          <Button 
            onClick={() => window.location.href = '/points-management'} 
            variant="outline"
            className="flex items-center gap-2"
          >
            返回积分管理
          </Button>
        </div>

        {/* 使用说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              NFC功能使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>1. 环境要求：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>使用HTTPS协议访问网站</li>
                <li>Chrome 89+浏览器（Android设备推荐）</li>
                <li>设备支持NFC功能且已开启</li>
              </ul>
              
              <p><strong>2. 权限设置：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>首次使用需要授权NFC权限</li>
                <li>在浏览器设置中允许NFC访问</li>
                <li>确保网站有NFC权限</li>
              </ul>
              
              <p><strong>3. 使用方法：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>将NFC卡片靠近设备背面</li>
                <li>保持卡片稳定，等待读取完成</li>
                <li>听到提示音或看到成功提示</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
