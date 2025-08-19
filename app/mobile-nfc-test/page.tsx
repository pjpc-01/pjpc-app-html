"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Scan,
  RefreshCw,
  Clock,
  User
} from "lucide-react"

export default function SimpleMobileNFCTest() {
  const [nfcSupported, setNfcSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastCard, setLastCard] = useState("")
  const [lastTime, setLastTime] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  // 检查NFC支持
  useEffect(() => {
    const checkNFC = () => {
      if (typeof window === 'undefined') return
      
      const hasNDEFReader = 'NDEFReader' in window
      const isSecure = window.location.protocol === 'https:'
      
      if (hasNDEFReader && isSecure) {
        setNfcSupported(true)
        setStatus("✅ 设备支持NFC，可以开始测试")
      } else {
        setNfcSupported(false)
        setStatus("❌ 设备不支持NFC或需要HTTPS连接")
      }
    }
    
    checkNFC()
  }, [])

  // 开始NFC扫描
  const startScan = async () => {
    if (!nfcSupported) {
      setError("设备不支持NFC功能")
      return
    }

    setIsScanning(true)
    setError("")
    setStatus("📱 正在扫描，请将NFC卡片靠近手机...")

    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        await ndef.scan()

        ndef.addEventListener("reading", (event: any) => {
          const cardId = event.message?.records?.[0]?.data || '未知卡片'
          const timestamp = new Date().toLocaleString()
          
          setLastCard(cardId)
          setLastTime(timestamp)
          setStatus("✅ 打卡成功！")
          setIsScanning(false)
          
          // 发送考勤记录到服务器
          recordAttendance(cardId)
        })

        ndef.addEventListener("readingerror", () => {
          setError("❌ 读取失败，请重试")
          setIsScanning(false)
        })

        // 模拟读取（实际测试时删除）
        setTimeout(() => {
          if (isScanning) {
            const mockCardId = "TEST_CARD_" + Math.floor(Math.random() * 1000)
            const timestamp = new Date().toLocaleString()
            
            setLastCard(mockCardId)
            setLastTime(timestamp)
            setStatus("✅ 模拟打卡成功！")
            setIsScanning(false)
            
            recordAttendance(mockCardId)
          }
        }, 2000)
      }
    } catch (err: any) {
      setError("❌ NFC启动失败: " + err.message)
      setIsScanning(false)
    }
  }

  // 停止扫描
  const stopScan = () => {
    setIsScanning(false)
    setStatus("⏹️ 扫描已停止")
  }

  // 记录考勤
  const recordAttendance = async (cardId: string) => {
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: cardId,
          deviceType: 'NFC',
          deviceId: 'mobile-nfc-test',
          deviceName: '手机NFC测试',
          location: '测试地点',
          frequency: '13.56MHz'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setStatus("✅ 考勤记录已保存到服务器")
      } else {
        setError("⚠️ 考勤记录失败: " + result.error)
      }
    } catch (err) {
      setError("⚠️ 网络错误，考勤记录失败")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto space-y-4">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">手机NFC考勤测试</h1>
          <p className="text-gray-600">简单直接的NFC考勤功能测试</p>
        </div>

        {/* 状态卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              设备状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>NFC支持:</span>
                <Badge variant={nfcSupported ? "default" : "destructive"}>
                  {nfcSupported ? "支持" : "不支持"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>连接:</span>
                <Badge variant={typeof window !== 'undefined' && window.location.protocol === 'https:' ? "default" : "destructive"}>
                  {typeof window !== 'undefined' && window.location.protocol === 'https:' ? "HTTPS" : "HTTP"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              NFC扫描
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={startScan}
              disabled={isScanning || !nfcSupported}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  扫描中...
                </>
              ) : (
                <>
                  <Scan className="h-5 w-5 mr-2" />
                  开始扫描
                </>
              )}
            </Button>

            {isScanning && (
              <Button
                onClick={stopScan}
                variant="outline"
                className="w-full"
              >
                停止扫描
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 状态显示 */}
        {status && (
          <Alert>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 最近记录 */}
        {lastCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                最近打卡
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-mono text-sm">{lastCard}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm text-gray-600">{lastTime}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-1">
            <p>1. 确保在手机设备上访问</p>
            <p>2. 点击"开始扫描"按钮</p>
            <p>3. 将NFC卡片靠近手机背面</p>
            <p>4. 等待读取成功提示</p>
            <p>5. 考勤记录会自动保存</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
