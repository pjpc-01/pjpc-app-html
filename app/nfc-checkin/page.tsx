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
  ArrowLeft,
  Radio,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"

export default function NFCCheckInPage() {
  const [nfcSupported, setNfcSupported] = useState<boolean>(false)
  const [nfcPermission, setNfcPermission] = useState<boolean>(false)
  const [isReading, setIsReading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [browserInfo, setBrowserInfo] = useState<any>({})
  const [deviceInfo, setDeviceInfo] = useState<any>({})

  // 检查NFC支持和浏览器信息
  useEffect(() => {
    const checkNFCSupport = () => {
      const info: any = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      }

      // 检查Web NFC API支持
      const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window
      const hasNDEF = typeof window !== 'undefined' && 'NDEF' in window
      
      // 检查浏览器类型
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
      const isEdge = /Edge/.test(navigator.userAgent)
      const isFirefox = /Firefox/.test(navigator.userAgent)
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      info.browser = {
        isChrome,
        isEdge,
        isFirefox,
        isSafari,
        isMobile,
        version: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[2] || 'unknown'
      }

      info.nfc = {
        hasNDEFReader,
        hasNDEF,
        supported: hasNDEFReader || hasNDEF
      }

      // 检查设备信息
      info.device = {
        isMobile,
        isAndroid: /Android/.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
        isTablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/.test(navigator.userAgent),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }

      setBrowserInfo(info)
      setDeviceInfo(info.device)
      setNfcSupported(info.nfc.supported)

      console.log('NFC检测信息:', info)
    }

    checkNFCSupport()
  }, [])

  const startNFCReading = async () => {
    if (!nfcSupported) {
      setError("此设备不支持NFC功能")
      return
    }

    if (!nfcPermission) {
      setError("需要NFC权限，请允许浏览器访问NFC")
      return
    }

    setIsReading(true)
    setError("")
    setSuccess("")

    try {
      // 尝试使用Web NFC API
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        await ndef.scan({
          recordType: "text",
          mediaType: "application/json",
        })

        ndef.addEventListener("reading", (event: any) => {
          console.log("NFC读取成功:", event)
          setSuccess("NFC读取成功！")
          setIsReading(false)
        })

        ndef.addEventListener("readingerror", (event: any) => {
          console.error("NFC读取错误:", event)
          setError("NFC读取失败，请重试")
          setIsReading(false)
        })

        // 模拟读取过程（实际使用时删除）
        setTimeout(() => {
          setSuccess("NFC读取成功！（模拟）")
          setIsReading(false)
        }, 2000)
      }
    } catch (err) {
      console.error("NFC读取错误:", err)
      setError("NFC读取失败，请重试")
      setIsReading(false)
    }
  }

  const requestNFCPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        // 尝试扫描以请求权限
        await ndef.scan()
        setNfcPermission(true)
        setError("")
        setSuccess("NFC权限已获得！")
      }
    } catch (err) {
      console.error("NFC权限请求失败:", err)
      setError("NFC权限请求失败，请检查浏览器设置")
    }
  }

  const getBrowserSupportStatus = () => {
    if (!browserInfo.browser) return "检测中..."
    
    const { browser, nfc } = browserInfo
    
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

  const getDeviceSupportStatus = () => {
    if (!deviceInfo.isMobile) {
      return "桌面设备通常不支持NFC"
    }
    
    if (deviceInfo.isAndroid && parseInt(deviceInfo.screenWidth) > 0) {
      return "Android设备通常支持NFC"
    }
    
    if (deviceInfo.isIOS) {
      return "iOS设备支持NFC（需要iOS 13+）"
    }
    
    return "设备类型未知"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4">
          <Link href="/checkin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回选择
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NFC 打卡系统</h1>
            <p className="text-gray-600">13.56MHz NFC读卡器 - 现代智能系统</p>
          </div>
        </div>

        {/* 系统状态 */}
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
                <Radio className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">NFC权限</span>
              </div>
              <div className="mt-2">
                {nfcPermission ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已授权
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    未授权
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">读取状态</span>
              </div>
              <div className="mt-2">
                {isReading ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    读取中...
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    待机中
                  </Badge>
                )}
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

        {/* 详细诊断信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              系统诊断
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">浏览器:</span>
                <span className="ml-2 font-medium">
                  {browserInfo.browser?.isChrome ? 'Chrome' : 
                   browserInfo.browser?.isEdge ? 'Edge' : 
                   browserInfo.browser?.isFirefox ? 'Firefox' : 
                   browserInfo.browser?.isSafari ? 'Safari' : '未知'}
                  {browserInfo.browser?.version && ` ${browserInfo.browser.version}`}
                </span>
              </div>
              <div>
                <span className="text-gray-600">浏览器支持:</span>
                <span className="ml-2 font-medium">{getBrowserSupportStatus()}</span>
              </div>
              <div>
                <span className="text-gray-600">设备类型:</span>
                <span className="ml-2 font-medium">
                  {deviceInfo.isMobile ? '移动设备' : '桌面设备'}
                  {deviceInfo.isAndroid && ' (Android)'}
                  {deviceInfo.isIOS && ' (iOS)'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">设备支持:</span>
                <span className="ml-2 font-medium">{getDeviceSupportStatus()}</span>
              </div>
              <div>
                <span className="text-gray-600">Web NFC API:</span>
                <span className="ml-2 font-medium">
                  {browserInfo.nfc?.hasNDEFReader ? 'NDEFReader ✓' : 'NDEFReader ✗'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">网络类型:</span>
                <span className="ml-2 font-medium">{deviceInfo.connection}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 权限请求 */}
        {nfcSupported && !nfcPermission && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span>需要NFC权限才能使用打卡功能</span>
                <div className="text-xs text-gray-500 mt-1">
                  点击下方按钮请求NFC权限，或检查浏览器设置
                </div>
              </div>
              <Button onClick={requestNFCPermission} size="sm">
                授权NFC
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 不支持NFC的提示 */}
        {!nfcSupported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <strong>NFC功能不可用</strong>
                <div className="text-sm mt-1">
                  <p>• 确保使用支持的浏览器（Chrome 89+ 或 Edge 89+）</p>
                  <p>• 确保设备支持NFC功能</p>
                  <p>• 确保使用HTTPS协议（Web NFC需要安全上下文）</p>
                  <p>• 移动设备通常支持NFC，桌面设备通常不支持</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 控制按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              NFC控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={startNFCReading}
                disabled={isReading || !nfcSupported || !nfcPermission}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                {isReading ? "读取中..." : "开始NFC读取"}
              </Button>
              
              {!nfcSupported && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  重新检测
                </Button>
              )}
              
              <Link href="/nfc-test">
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  NFC诊断工具
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>NFC系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">频率:</span>
                <span className="ml-2 font-medium">13.56MHz</span>
              </div>
              <div>
                <span className="text-gray-600">读卡距离:</span>
                <span className="ml-2 font-medium">1-4cm</span>
              </div>
              <div>
                <span className="text-gray-600">卡片类型:</span>
                <span className="ml-2 font-medium">ISO14443, FeliCa</span>
              </div>
              <div>
                <span className="text-gray-600">数据格式:</span>
                <span className="ml-2 font-medium">NDEF, NFC-A/B/F</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>确保设备支持NFC功能（Android 4.4+ 或 iOS 11+）</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>使用支持的浏览器（Chrome 89+ 或 Edge 89+）</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>确保使用HTTPS协议（Web NFC需要安全上下文）</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>允许浏览器访问NFC权限</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>将NFC卡片或手机靠近读卡器（距离1-4cm）</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>等待读取完成，系统会自动记录考勤</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

