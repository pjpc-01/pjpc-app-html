"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Smartphone, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  User,
  Clock,
  MapPin,
  Wifi,
  WifiOff
} from "lucide-react"

export default function MobileNFCInterface() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastCard, setLastCard] = useState<string | null>(null)
  const [lastAttendance, setLastAttendance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [nfcStatus, setNfcStatus] = useState<string>("检查中...")

  useEffect(() => {
    checkNFCSupport()
  }, [])

  // 检查NFC支持
  const checkNFCSupport = async () => {
    try {
      if ('NDEFReader' in window) {
        setIsSupported(true)
        setNfcStatus("NFC已就绪")
      } else {
        setIsSupported(false)
        setNfcStatus("浏览器不支持NFC")
      }
    } catch (err) {
      setIsSupported(false)
      setNfcStatus("NFC检查失败")
    }
  }

  // 开始扫描NFC
  const startNFCScan = async () => {
    if (!isSupported) return
    
    setIsScanning(true)
    setError(null)
    
    try {
      // 模拟NFC扫描过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟读取到的卡片数据
      const cardId = `NFC_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      setLastCard(cardId)
      
      // 模拟打卡记录
      const attendance = {
        cardId,
        studentName: "李四",
        studentId: "S002",
        timestamp: new Date().toLocaleString(),
        location: "操场",
        status: "success"
      }
      setLastAttendance(attendance)
      
      // 这里应该调用实际的API
      console.log("NFC打卡记录:", attendance)
      
    } catch (err) {
      setError("NFC扫描失败")
    } finally {
      setIsScanning(false)
    }
  }

  // 停止扫描
  const stopNFCScan = () => {
    setIsScanning(false)
    setLastCard(null)
    setLastAttendance(null)
  }

  return (
    <div className="space-y-6">
      {/* NFC状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            NFC状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? "支持NFC" : "不支持NFC"}
              </Badge>
              <div className="text-sm text-gray-600">
                {nfcStatus}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={checkNFCSupport}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新检查
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      {!isSupported && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            您的设备或浏览器不支持NFC功能。请使用支持NFC的手机和现代浏览器（如Chrome、Safari）。
          </AlertDescription>
        </Alert>
      )}

      {/* NFC扫描操作 */}
      <Card>
        <CardHeader>
          <CardTitle>NFC扫描</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={isScanning ? stopNFCScan : startNFCScan} 
              disabled={!isSupported}
              className="w-full h-16 text-lg"
            >
              {isScanning ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  正在扫描NFC卡片...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  开始扫描NFC卡片
                </div>
              )}
            </Button>
            
            {lastCard && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">NFC卡片扫描成功</span>
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

      {/* 使用提示 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">NFC使用提示</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 确保手机NFC功能已开启</li>
                <li>• 将NFC卡片靠近手机背面</li>
                <li>• 保持卡片稳定，直到扫描完成</li>
                <li>• 支持Android和iOS设备</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
