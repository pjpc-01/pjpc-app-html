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
  Scan,
  Shield,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function MobileNFCPage() {
  const [nfcSupported, setNfcSupported] = useState<boolean>(false)
  const [nfcPermission, setNfcPermission] = useState<boolean>(false)
  const [isReading, setIsReading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [connectionStatus, setConnectionStatus] = useState<string>("")

  // 检查设备和NFC支持
  useEffect(() => {
    const checkDeviceAndNFC = () => {
      const info: any = {
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
        isChrome: /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        isSecure: window.location.protocol === 'https:',
      }

      // 检查Web NFC API支持
      const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window
      const hasNDEF = typeof window !== 'undefined' && 'NDEF' in window
      
      info.nfc = {
        hasNDEFReader,
        hasNDEF,
        supported: hasNDEFReader || hasNDEF
      }

      setDeviceInfo(info)
      setNfcSupported(info.nfc.supported)

      // 检查连接状态
      if (info.isSecure) {
        setConnectionStatus("✅ HTTPS 连接已建立")
      } else {
        setConnectionStatus("❌ 需要 HTTPS 连接才能使用 NFC")
      }

      console.log('移动设备NFC检测信息:', info)
    }

    checkDeviceAndNFC()
  }, [])

  const startNFCReading = async () => {
    if (!nfcSupported) {
      setError("此设备不支持NFC功能")
      return
    }

    if (!deviceInfo.isSecure) {
      setError("NFC功能需要HTTPS连接，请使用HTTPS访问")
      return
    }

    setIsReading(true)
    setError("")
    setSuccess("")

    try {
      // 请求NFC权限并开始扫描
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        await ndef.scan({
          recordType: "text",
          mediaType: "application/json",
        })

        setNfcPermission(true)
        setSuccess("NFC扫描已启动，请将NFC卡片靠近手机背面")

        ndef.addEventListener("reading", (event: any) => {
          console.log("NFC读取成功:", event)
          setSuccess("✅ NFC读取成功！卡片ID: " + (event.message?.records?.[0]?.data || '未知'))
          setIsReading(false)
        })

        ndef.addEventListener("readingerror", (event: any) => {
          console.error("NFC读取错误:", event)
          setError("❌ NFC读取失败，请重试")
          setIsReading(false)
        })

        // 模拟读取过程（实际使用时删除）
        setTimeout(() => {
          if (isReading) {
            setSuccess("✅ NFC读取成功！（模拟）卡片ID: 123456789")
            setIsReading(false)
          }
        }, 3000)
      }
    } catch (err: any) {
      console.error("NFC读取错误:", err)
      if (err.name === 'NotAllowedError') {
        setError("❌ NFC权限被拒绝，请在浏览器设置中允许NFC访问")
      } else if (err.name === 'NotSupportedError') {
        setError("❌ 此设备不支持NFC功能")
      } else {
        setError("❌ NFC读取失败: " + err.message)
      }
      setIsReading(false)
    }
  }

  const stopNFCReading = () => {
    setIsReading(false)
    setSuccess("NFC扫描已停止")
  }

  const getDeviceStatus = () => {
    if (!deviceInfo.isMobile) {
      return { status: "❌", text: "请在手机设备上访问此页面" }
    }
    
    if (deviceInfo.isAndroid && deviceInfo.isChrome) {
      return { status: "✅", text: "Android Chrome 浏览器支持NFC" }
    }
    
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      return { status: "⚠️", text: "iOS Safari 支持NFC（需要iOS 13+）" }
    }
    
    return { status: "❓", text: "设备兼容性未知" }
  }

  const getNFCStatus = () => {
    if (!nfcSupported) {
      return { status: "❌", text: "浏览器不支持Web NFC API" }
    }
    
    if (!deviceInfo.isSecure) {
      return { status: "❌", text: "需要HTTPS连接" }
    }
    
    if (nfcPermission) {
      return { status: "✅", text: "NFC权限已获得" }
    }
    
    return { status: "⚠️", text: "需要请求NFC权限" }
  }

  const deviceStatus = getDeviceStatus()
  const nfcStatus = getNFCStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4">
          <Link href="/checkin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">手机NFC签到</h1>
        </div>

        {/* 设备状态卡片 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              设备状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">设备类型</span>
              <Badge variant={deviceInfo.isMobile ? "default" : "destructive"}>
                {deviceInfo.isMobile ? "移动设备" : "桌面设备"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">设备兼容性</span>
              <span className="text-sm">{deviceStatus.status} {deviceStatus.text}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">NFC支持</span>
              <span className="text-sm">{nfcStatus.status} {nfcStatus.text}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">连接状态</span>
              <span className="text-sm">{connectionStatus}</span>
            </div>
          </CardContent>
        </Card>

        {/* NFC操作卡片 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-5 w-5" />
              NFC签到
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!deviceInfo.isMobile && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  请在手机设备上访问此页面以使用NFC功能
                </AlertDescription>
              </Alert>
            )}

            {deviceInfo.isMobile && !deviceInfo.isSecure && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  NFC功能需要HTTPS连接，请使用HTTPS访问此页面
                </AlertDescription>
              </Alert>
            )}

            {deviceInfo.isMobile && deviceInfo.isSecure && (
              <div className="space-y-3">
                <Button
                  onClick={startNFCReading}
                  disabled={isReading || !nfcSupported}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isReading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      扫描中...
                    </>
                  ) : (
                    <>
                      <Scan className="h-5 w-5 mr-2" />
                      开始NFC签到
                    </>
                  )}
                </Button>

                {isReading && (
                  <Button
                    onClick={stopNFCReading}
                    variant="outline"
                    className="w-full"
                  >
                    停止扫描
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 状态显示 */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. 确保在手机设备上访问此页面</p>
            <p>2. 使用HTTPS连接（已自动配置）</p>
            <p>3. 点击"开始NFC签到"按钮</p>
            <p>4. 将NFC卡片靠近手机背面</p>
            <p>5. 等待读取成功提示</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
