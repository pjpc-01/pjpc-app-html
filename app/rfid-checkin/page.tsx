"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Activity,
  Users,
  Shield,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  deviceId: string
  deviceName: string
  location: string
  timestamp: Date
  status: "success" | "error" | "pending"
  message?: string
}

export default function RFIDCheckInPage() {
  const [isListening, setIsListening] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<"online" | "offline" | "connecting">("offline")
  const [lastRead, setLastRead] = useState<string>("")
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  // 模拟RFID读取器状态
  useEffect(() => {
    const checkDeviceStatus = async () => {
      try {
        // 这里应该调用实际的设备状态检查API
        setDeviceStatus("online")
      } catch (error) {
        setDeviceStatus("offline")
        setError("设备连接失败")
      }
    }

    checkDeviceStatus()
    const interval = setInterval(checkDeviceStatus, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [])

  // 模拟RFID读取
  useEffect(() => {
    if (!isListening) return

    const simulateRFIDRead = () => {
      // 生成模拟的RFID UID (125KHz格式)
      const uid = `RFID_${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      setLastRead(uid)
      handleCardRead(uid)
    }

    const interval = setInterval(simulateRFIDRead, 3000) // 每3秒模拟一次读取

    return () => clearInterval(interval)
  }, [isListening])

  const handleCardRead = useCallback(async (uid: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          deviceType: 'RFID',
          deviceId: 'rfid_reader_001',
          deviceName: 'RFID Reader (125KHz)',
          location: 'Main Entrance',
          frequency: '125KHz'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`打卡成功: ${data.data.studentName || '未知用户'}`)
        
        // 添加到最近记录
        const newRecord: AttendanceRecord = {
          id: data.data.id,
          cardNumber: uid,
          studentId: data.data.studentId || 'Unknown',
          studentName: data.data.studentName || 'Unknown',
          deviceId: 'rfid_reader_001',
          deviceName: 'RFID Reader (125KHz)',
          location: 'Main Entrance',
          timestamp: new Date(),
          status: 'success',
          message: '打卡成功'
        }

        setRecentRecords(prev => [newRecord, ...prev.slice(0, 9)]) // 保持最近10条记录
      } else {
        setError(data.error || '打卡失败')
        
        const errorRecord: AttendanceRecord = {
          id: Date.now().toString(),
          cardNumber: uid,
          studentId: 'Unknown',
          studentName: 'Unknown',
          deviceId: 'rfid_reader_001',
          deviceName: 'RFID Reader (125KHz)',
          location: 'Main Entrance',
          timestamp: new Date(),
          status: 'error',
          message: data.error || '打卡失败'
        }

        setRecentRecords(prev => [errorRecord, ...prev.slice(0, 9)])
      }
    } catch (error) {
      setError('网络错误，请重试')
      console.error('RFID check-in error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  const toggleListening = () => {
    setIsListening(!isListening)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RFID 打卡系统</h1>
            <p className="text-gray-600">125KHz RFID 读卡器 - 主入口</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={deviceStatus === "online" ? "default" : "destructive"}
              className={
                deviceStatus === "online" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }
            >
              {deviceStatus === "online" ? (
                <Wifi className="h-4 w-4 mr-1" />
              ) : (
                <WifiOff className="h-4 w-4 mr-1" />
              )}
              {deviceStatus === "online" ? "在线" : "离线"}
            </Badge>
            <Button
              onClick={toggleListening}
              disabled={deviceStatus !== "online"}
              className={`flex items-center gap-2 ${
                isListening ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isListening ? (
                <>
                  <Pause className="h-4 w-4" />
                  停止监听
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  开始监听
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">设备状态</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {deviceStatus === "online" ? "正常" : "异常"}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">监听状态</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isListening ? "监听中" : "已停止"}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今日打卡</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {recentRecords.filter(r => r.status === 'success').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Read Display */}
        {lastRead && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                最后读取
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-lg font-mono text-gray-800">{lastRead}</div>
                <div className="text-sm text-gray-500 mt-1">
                  时间: {new Date().toLocaleTimeString('zh-CN')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
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

        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              最近打卡记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无打卡记录
                </div>
              ) : (
                recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <div className="font-medium">{record.studentName}</div>
                        <div className="text-sm text-gray-500">
                          {record.cardNumber} • {record.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatTime(record.timestamp)}
                      </div>
                      <Badge variant="outline" className={getStatusColor(record.status)}>
                        {record.status === "success" ? "成功" : record.status === "error" ? "失败" : "处理中"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              设备信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">设备类型</Label>
                <div className="text-gray-600">RFID Reader (125KHz)</div>
              </div>
              <div>
                <Label className="text-sm font-medium">设备ID</Label>
                <div className="text-gray-600">rfid_reader_001</div>
              </div>
              <div>
                <Label className="text-sm font-medium">位置</Label>
                <div className="text-gray-600">主入口</div>
              </div>
              <div>
                <Label className="text-sm font-medium">频率</Label>
                <div className="text-gray-600">125KHz</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 