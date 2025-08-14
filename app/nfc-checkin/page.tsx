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
} from "lucide-react"
import Link from "next/link"

export default function NFCCheckInPage() {
  const [nfcSupported, setNfcSupported] = useState<boolean>(false)
  const [nfcPermission, setNfcPermission] = useState<boolean>(false)
  const [isReading, setIsReading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // 检查NFC支持
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true)
    }
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
      // 模拟NFC读取过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess("NFC读取成功！")
    } catch (err) {
      setError("NFC读取失败，请重试")
    } finally {
      setIsReading(false)
    }
  }

  const requestNFCPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        await ndef.scan()
        setNfcPermission(true)
        setError("")
      }
    } catch (err) {
      setError("NFC权限请求失败")
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* 权限请求 */}
        {nfcSupported && !nfcPermission && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>需要NFC权限才能使用打卡功能</span>
              <Button onClick={requestNFCPermission} size="sm">
                授权NFC
              </Button>
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

