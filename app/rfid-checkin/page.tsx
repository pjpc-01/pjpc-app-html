"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function RFIDCheckInPage() {
  const [isReading, setIsReading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const startRFIDReading = async () => {
    setIsReading(true)
    setError("")
    setSuccess("")

    try {
      // 模拟RFID读取过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess("RFID读取成功！")
    } catch (err) {
      setError("RFID读取失败，请重试")
    } finally {
      setIsReading(false)
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
            <h1 className="text-2xl font-bold text-gray-900">RFID 打卡系统</h1>
            <p className="text-gray-600">125KHz RFID读卡器 - 传统门禁系统</p>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">RFID支持</span>
              </div>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已支持
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">设备连接</span>
              </div>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已连接
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
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

        {/* 控制按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              RFID控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={startRFIDReading}
                disabled={isReading}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {isReading ? "读取中..." : "开始RFID读取"}
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
            <CardTitle>RFID系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">频率:</span>
                <span className="ml-2 font-medium">125KHz</span>
              </div>
              <div>
                <span className="text-gray-600">读卡距离:</span>
                <span className="ml-2 font-medium">5-10cm</span>
              </div>
              <div>
                <span className="text-gray-600">卡片类型:</span>
                <span className="ml-2 font-medium">EM4100, T5577</span>
              </div>
              <div>
                <span className="text-gray-600">数据格式:</span>
                <span className="ml-2 font-medium">Wiegand 26-bit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
