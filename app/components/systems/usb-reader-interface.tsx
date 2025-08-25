"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Usb, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  User,
  Clock,
  MapPin
} from "lucide-react"

export default function USBReaderInterface() {
  const [isConnected, setIsConnected] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [lastCard, setLastCard] = useState<string | null>(null)
  const [lastAttendance, setLastAttendance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  // 模拟连接USB读卡器
  const connectDevice = async () => {
    setIsReading(true)
    setError(null)
    
    try {
      // 模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsConnected(true)
      setDeviceInfo({
        name: "USB NFC Reader",
        vendor: "Generic",
        status: "Connected"
      })
    } catch (err) {
      setError("连接失败，请检查设备连接")
    } finally {
      setIsReading(false)
    }
  }

  // 模拟读取卡片
  const readCard = async () => {
    if (!isConnected) return
    
    setIsReading(true)
    setError(null)
    
    try {
      // 模拟读取过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      const cardId = `CARD_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      setLastCard(cardId)
      
      // 模拟打卡记录
      const attendance = {
        cardId,
        studentName: "张三",
        studentId: "S001",
        timestamp: new Date().toLocaleString(),
        location: "教室A",
        status: "success"
      }
      setLastAttendance(attendance)
      
      // 这里应该调用实际的API
      console.log("打卡记录:", attendance)
      
    } catch (err) {
      setError("读取卡片失败")
    } finally {
      setIsReading(false)
    }
  }

  // 断开连接
  const disconnectDevice = () => {
    setIsConnected(false)
    setDeviceInfo(null)
    setLastCard(null)
    setLastAttendance(null)
  }

  return (
    <div className="space-y-6">
      {/* 设备状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="h-5 w-5" />
            设备状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "已连接" : "未连接"}
              </Badge>
              {deviceInfo && (
                <div className="text-sm text-gray-600">
                  {deviceInfo.name} - {deviceInfo.vendor}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!isConnected ? (
                <Button 
                  onClick={connectDevice} 
                  disabled={isReading}
                  className="flex items-center gap-2"
                >
                  {isReading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Usb className="h-4 w-4" />
                  )}
                  连接设备
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={disconnectDevice}
                >
                  断开连接
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 打卡操作 */}
      <Card>
        <CardHeader>
          <CardTitle>打卡操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={readCard} 
              disabled={!isConnected || isReading}
              className="w-full h-16 text-lg"
            >
              {isReading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  正在读取卡片...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  请将卡片放在读卡器上
                </div>
              )}
            </Button>
            
            {lastCard && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">卡片读取成功</span>
                </div>
                <div className="mt-2 text-sm text-green-600">
                  卡片ID: {lastCard}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最近打卡记录 */}
      {lastAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>最近打卡记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{lastAttendance.studentName}</span>
                  <Badge variant="outline">{lastAttendance.studentId}</Badge>
                </div>
                <Badge variant="default">成功</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastAttendance.timestamp}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lastAttendance.location}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
