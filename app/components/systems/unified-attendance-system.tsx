"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Smartphone,
  Activity,
  BarChart3,
  Zap,
  Scan,
  Plus,
  Settings
} from "lucide-react"
import CardManagement from "@/app/components/systems/CardManagement"
import DeviceManagement from "@/app/components/systems/DeviceManagement"
import AttendanceRecords from "@/app/components/systems/AttendanceRecords"
import ReadWriteDialog from "@/app/components/systems/ReadWriteDialog"

// 类型定义
interface AttendanceRecord {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  deviceId: string
  deviceName: string
  timestamp: string
  type: "checkin" | "checkout"
  status: "success" | "failed" | "duplicate"
}

interface NFCCard {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  cardType: "NFC" | "RFID"
  status: "active" | "inactive" | "lost" | "replaced"
  issuedDate: string
  expiryDate?: string
  notes?: string
  lastUsed?: string
}

interface NFCDevice {
  id: string
  name: string
  location: string
  deviceType: "NFC" | "RFID" | "hybrid"
  status: "online" | "offline" | "maintenance"
  ipAddress?: string
  macAddress?: string
  firmwareVersion?: string
  notes?: string
  lastSeen?: string
}

interface AttendanceStats {
  totalCards: number
  activeCards: number
  totalDevices: number
  onlineDevices: number
  todayCheckins: number
  todayCheckouts: number
  systemHealth: number
}

export default function UnifiedAttendanceSystem() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 数据状态
  const [cards, setCards] = useState<NFCCard[]>([])
  const [devices, setDevices] = useState<NFCDevice[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalCards: 0,
    activeCards: 0,
    totalDevices: 0,
    onlineDevices: 0,
    todayCheckins: 0,
    todayCheckouts: 0,
    systemHealth: 95,
  })

  // 对话框状态
  const [readWriteDialog, setReadWriteDialog] = useState(false)
  const [cardDialog, setCardDialog] = useState(false)
  const [deviceDialog, setDeviceDialog] = useState(false)

  // 模拟数据加载
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // 模拟卡片数据
    const mockCards: NFCCard[] = [
      {
        id: "1",
        cardNumber: "NFC001",
        studentId: "STU001",
        studentName: "张三",
        cardType: "NFC",
        status: "active",
        issuedDate: "2024-01-01",
        lastUsed: "2024-01-15 08:30:00",
      },
      {
        id: "2",
        cardNumber: "RFID001",
        studentId: "STU002",
        studentName: "李四",
        cardType: "RFID",
        status: "active",
        issuedDate: "2024-01-02",
        lastUsed: "2024-01-15 08:25:00",
      },
    ]

    // 模拟设备数据
    const mockDevices: NFCDevice[] = [
      {
        id: "1",
        name: "主入口读卡器",
        location: "学校正门",
        deviceType: "hybrid",
        status: "online",
        ipAddress: "192.168.1.100",
        firmwareVersion: "v1.2.3",
        lastSeen: "2024-01-15 08:35:00",
      },
      {
        id: "2",
        name: "侧门读卡器",
        location: "学校侧门",
        deviceType: "NFC",
        status: "online",
        ipAddress: "192.168.1.101",
        firmwareVersion: "v1.2.3",
        lastSeen: "2024-01-15 08:30:00",
      },
    ]

    // 模拟打卡记录
    const mockRecords: AttendanceRecord[] = [
      {
        id: "1",
        cardNumber: "NFC001",
        studentId: "STU001",
        studentName: "张三",
        deviceId: "1",
        deviceName: "主入口读卡器",
        timestamp: "2024-01-15 08:30:00",
        type: "checkin",
        status: "success",
      },
      {
        id: "2",
        cardNumber: "RFID001",
        studentId: "STU002",
        studentName: "李四",
        deviceId: "1",
        deviceName: "主入口读卡器",
        timestamp: "2024-01-15 08:25:00",
        type: "checkin",
        status: "success",
      },
    ]

    setCards(mockCards)
    setDevices(mockDevices)
    setAttendanceRecords(mockRecords)
    
    // 更新统计
    setStats({
      totalCards: mockCards.length,
      activeCards: mockCards.filter(c => c.status === "active").length,
      totalDevices: mockDevices.length,
      onlineDevices: mockDevices.filter(d => d.status === "online").length,
      todayCheckins: mockRecords.filter(r => r.type === "checkin").length,
      todayCheckouts: mockRecords.filter(r => r.type === "checkout").length,
      systemHealth: 95,
    })
  }

  // 导出功能
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            仪表板
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            卡片管理
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            设备管理
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            打卡记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总卡片数</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalCards}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">在线设备</p>
                        <p className="text-2xl font-bold text-green-600">{stats.onlineDevices}</p>
                      </div>
                      <Smartphone className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">今日签到</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.todayCheckins}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">系统健康度</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.systemHealth}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 快速操作 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    快速操作
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => setReadWriteDialog(true)} 
                      className="flex items-center gap-2 h-16"
                      variant="outline"
                    >
                      <Scan className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-medium">读写卡片</div>
                        <div className="text-sm text-gray-500">读取或写入NFC/RFID卡片</div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => setCardDialog(true)} 
                      className="flex items-center gap-2 h-16"
                      variant="outline"
                    >
                      <Plus className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-medium">添加卡片</div>
                        <div className="text-sm text-gray-500">注册新的NFC/RFID卡片</div>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => setDeviceDialog(true)} 
                      className="flex items-center gap-2 h-16"
                      variant="outline"
                    >
                      <Settings className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-medium">添加设备</div>
                        <div className="text-sm text-gray-500">配置新的读卡器设备</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "cards" && (
            <CardManagement
              cards={cards}
              onUpdateCards={setCards}
              onExportCards={() => exportToCSV(cards, 'cards')}
              onAddCard={() => setCardDialog(true)}
              onEditCard={(card) => {
                // 处理编辑卡片逻辑
                console.log('编辑卡片:', card)
              }}
              onScanCard={() => setReadWriteDialog(true)}
            />
          )}

          {activeTab === "devices" && (
            <DeviceManagement
              devices={devices}
              onUpdateDevices={setDevices}
              onExportDevices={() => exportToCSV(devices, 'devices')}
              onAddDevice={() => setDeviceDialog(true)}
              onEditDevice={(device) => {
                // 处理编辑设备逻辑
                console.log('编辑设备:', device)
              }}
            />
          )}

          {activeTab === "records" && (
            <AttendanceRecords
              records={attendanceRecords}
              onUpdateRecords={setAttendanceRecords}
              onExportRecords={() => exportToCSV(attendanceRecords, 'attendance_records')}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* 读写卡片对话框 */}
      <ReadWriteDialog
        open={readWriteDialog}
        onOpenChange={setReadWriteDialog}
      />

      {/* 添加卡片对话框 */}
      {cardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>添加新卡片</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">卡片添加功能开发中...</p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setCardDialog(false)}>
                  取消
                </Button>
                <Button onClick={() => setCardDialog(false)}>
                  确定
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 添加设备对话框 */}
      {deviceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>添加新设备</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">设备添加功能开发中...</p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDeviceDialog(false)}>
                  取消
                </Button>
                <Button onClick={() => setDeviceDialog(false)}>
                  确定
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}