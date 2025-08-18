"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  HelpCircle,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export default function NFCTestPage() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>({})
  const [nfcSupported, setNfcSupported] = useState<boolean>(false)
  const [nfcPermission, setNfcPermission] = useState<boolean>(false)
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false)
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      secureContext: window.isSecureContext,
    }

    // 检查Web NFC API支持
    const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window
    const hasNDEF = typeof window !== 'undefined' && 'NDEF' in window
    
    // 检查浏览器类型和版本
    const userAgent = navigator.userAgent
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent)
    const isEdge = /Edge/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    
    const browserVersion = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[2] || 'unknown'

    info.browser = {
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isMobile,
      version: browserVersion,
      userAgent: userAgent
    }

    info.nfc = {
      hasNDEFReader,
      hasNDEF,
      supported: hasNDEFReader || hasNDEF
    }

    // 检查设备信息
    info.device = {
      isMobile,
      isAndroid: /Android/.test(userAgent),
      isIOS: /iPhone|iPad|iPod/.test(userAgent),
      isTablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/.test(userAgent),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 'unknown'
    }

    // 检查网络信息
    info.network = {
      onLine: navigator.onLine,
      connection: (navigator as any).connection || null,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown'
    }

    // 检查安全上下文
    info.security = {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port
    }

    setDiagnosticInfo(info)
    setNfcSupported(info.nfc.supported)
    setIsSecureContext(window.isSecureContext)

    // 运行测试
    runTests(info)
  }

  const runTests = (info: any) => {
    const tests = [
      {
        name: "安全上下文检查",
        description: "Web NFC API需要HTTPS或localhost",
        passed: info.security.isSecureContext,
        details: `协议: ${info.security.protocol}, 主机: ${info.security.hostname}`
      },
      {
        name: "浏览器支持检查",
        description: "检查浏览器是否支持Web NFC API",
        passed: info.nfc.supported,
        details: `浏览器: ${info.browser.isChrome ? 'Chrome' : info.browser.isEdge ? 'Edge' : info.browser.isFirefox ? 'Firefox' : info.browser.isSafari ? 'Safari' : '未知'} ${info.browser.version}`
      },
      {
        name: "设备类型检查",
        description: "移动设备通常支持NFC",
        passed: info.device.isMobile,
        details: `设备类型: ${info.device.isMobile ? '移动设备' : '桌面设备'}`
      },
      {
        name: "网络连接检查",
        description: "检查网络连接状态",
        passed: info.network.onLine,
        details: `网络状态: ${info.network.onLine ? '在线' : '离线'}`
      },
      {
        name: "NDEFReader API检查",
        description: "检查NDEFReader API是否可用",
        passed: info.nfc.hasNDEFReader,
        details: info.nfc.hasNDEFReader ? 'NDEFReader API可用' : 'NDEFReader API不可用'
      }
    ]

    setTestResults(tests)
  }

  const requestNFCPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        await ndef.scan()
        setNfcPermission(true)
        setTestResults(prev => [...prev, {
          name: "NFC权限检查",
          description: "请求NFC权限",
          passed: true,
          details: "NFC权限已获得"
        }])
      }
    } catch (err) {
      console.error("NFC权限请求失败:", err)
      setTestResults(prev => [...prev, {
        name: "NFC权限检查",
        description: "请求NFC权限",
        passed: false,
        details: `权限请求失败: ${err}`
      }])
    }
  }

  const getBrowserSupportStatus = () => {
    if (!diagnosticInfo.browser) return "检测中..."
    
    const { browser } = diagnosticInfo
    
    if (browser.isChrome && parseInt(browser.version) >= 89) {
      return "完全支持"
    } else if (browser.isEdge && parseInt(browser.version) >= 89) {
      return "完全支持"
    } else if (browser.isFirefox && parseInt(browser.version) >= 79) {
      return "部分支持"
    } else if (browser.isSafari) {
      return "不支持（Safari暂不支持Web NFC）"
    } else {
      return "版本过低"
    }
  }

  const getSolutions = () => {
    const solutions = []
    
    if (!isSecureContext) {
      solutions.push({
        title: "启用HTTPS",
        description: "Web NFC API需要安全上下文（HTTPS或localhost）",
        action: "请联系管理员配置HTTPS证书"
      })
    }
    
    if (!diagnosticInfo.browser?.isChrome && !diagnosticInfo.browser?.isEdge) {
      solutions.push({
        title: "更换浏览器",
        description: "建议使用Chrome 89+或Edge 89+",
        action: "下载最新版本的Chrome或Edge浏览器"
      })
    }
    
    if (!diagnosticInfo.device?.isMobile) {
      solutions.push({
        title: "使用移动设备",
        description: "桌面设备通常不支持NFC功能",
        action: "请在支持NFC的Android或iOS设备上测试"
      })
    }
    
    if (!nfcSupported) {
      solutions.push({
        title: "检查设备NFC",
        description: "确保设备硬件支持NFC功能",
        action: "检查设备设置中的NFC选项"
      })
    }
    
    return solutions
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NFC 功能诊断工具</h1>
          <p className="text-gray-600">检测设备NFC支持情况和问题诊断</p>
        </div>

        {/* 快速状态 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">NFC支持</span>
              </div>
              <div className="mt-2">
                {nfcSupported ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已支持
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    不支持
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">安全上下文</span>
              </div>
              <div className="mt-2">
                {isSecureContext ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    HTTPS
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    非HTTPS
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">浏览器支持</span>
              </div>
              <div className="mt-2">
                <Badge variant="outline">
                  {getBrowserSupportStatus()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {navigator.onLine ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium">网络状态</span>
              </div>
              <div className="mt-2">
                <Badge variant={navigator.onLine ? "default" : "destructive"}>
                  {navigator.onLine ? "在线" : "离线"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 测试结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              诊断测试结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                  </div>
                  <Badge variant={test.passed ? "default" : "destructive"}>
                    {test.passed ? "通过" : "失败"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 解决方案 */}
        {getSolutions().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                解决方案
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSolutions().map((solution, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <strong>{solution.title}</strong>
                        <p className="text-sm mt-1">{solution.description}</p>
                        <p className="text-sm text-blue-600 mt-1">{solution.action}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 详细诊断信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              详细诊断信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">浏览器:</span>
                <span className="ml-2 font-medium">
                  {diagnosticInfo.browser?.isChrome ? 'Chrome' : 
                   diagnosticInfo.browser?.isEdge ? 'Edge' : 
                   diagnosticInfo.browser?.isFirefox ? 'Firefox' : 
                   diagnosticInfo.browser?.isSafari ? 'Safari' : '未知'}
                  {diagnosticInfo.browser?.version && ` ${diagnosticInfo.browser.version}`}
                </span>
              </div>
              <div>
                <span className="text-gray-600">设备类型:</span>
                <span className="ml-2 font-medium">
                  {diagnosticInfo.device?.isMobile ? '移动设备' : '桌面设备'}
                  {diagnosticInfo.device?.isAndroid && ' (Android)'}
                  {diagnosticInfo.device?.isIOS && ' (iOS)'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">协议:</span>
                <span className="ml-2 font-medium">{diagnosticInfo.security?.protocol}</span>
              </div>
              <div>
                <span className="text-gray-600">主机:</span>
                <span className="ml-2 font-medium">{diagnosticInfo.security?.hostname}</span>
              </div>
              <div>
                <span className="text-gray-600">NDEFReader:</span>
                <span className="ml-2 font-medium">
                  {diagnosticInfo.nfc?.hasNDEFReader ? '✓ 可用' : '✗ 不可用'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">网络类型:</span>
                <span className="ml-2 font-medium">{diagnosticInfo.device?.connection}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <Button onClick={runDiagnostics} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            重新诊断
          </Button>
          
          {nfcSupported && !nfcPermission && (
            <Button onClick={requestNFCPermission} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              请求NFC权限
            </Button>
          )}
          
          <Link href="/nfc-checkin">
            <Button variant="outline" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              返回NFC打卡
            </Button>
          </Link>
        </div>

        {/* 帮助信息 */}
        <Card>
          <CardHeader>
            <CardTitle>Web NFC API 支持说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>浏览器要求:</strong> Chrome 89+, Edge 89+, Firefox 79+</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>安全要求:</strong> 必须使用HTTPS或localhost</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>设备要求:</strong> 支持NFC的移动设备（Android/iOS）</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>权限要求:</strong> 用户需要授权NFC访问权限</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>iOS限制:</strong> iOS 13+支持，但功能有限</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
