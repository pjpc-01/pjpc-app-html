"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import {
  Smartphone,
  Activity,
  BarChart3,
  Zap,
  Scan,
  Plus,
  Settings,
  AlertTriangle,
  CreditCard,
  FileText
} from "lucide-react"
import DeviceManagement from "@/app/components/systems/DeviceManagement"
import AttendanceRecords from "@/app/components/systems/AttendanceRecords"
import ReadWriteDialog from "@/app/components/systems/ReadWriteDialog"
import CardReplacementManager from "@/app/components/systems/CardReplacementManager"
import IntegratedCardManager from "@/app/components/systems/IntegratedCardManager"

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

  const dashboardStats = [
    {
      title: "在线设备",
      value: devices.filter(d => d.status === 'online').length,
      icon: Smartphone,
      color: "bg-blue-100",
      description: "当前在线设备数"
    },
    {
      title: "今日打卡",
      value: attendanceRecords.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length,
      icon: Activity,
      color: "bg-green-100",
      description: "今日打卡记录数"
    },
    {
      title: "总记录数",
      value: attendanceRecords.length,
      icon: BarChart3,
      color: "bg-purple-100",
      description: "历史记录总数"
    },
    {
      title: "活跃用户",
      value: new Set(attendanceRecords.map(r => r.studentId)).size,
      icon: Zap,
      color: "bg-orange-100",
      description: "活跃用户数量"
    }
  ]

  const tabs = [
    {
      id: 'dashboard',
      label: '仪表板',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <StatsGrid stats={dashboardStats} columns={4} />
          
          {/* 其他仪表板内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  今日打卡记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendanceRecords.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{record.studentName}</span>
                      <span className="text-xs text-gray-500">{record.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  设备状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{device.name}</span>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status === 'online' ? '在线' : '离线'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'devices',
      label: '设备管理',
      icon: Smartphone,
      content: (
        <DeviceManagement
          devices={devices}
          onUpdateDevices={setDevices}
          onExportDevices={() => exportToCSV(devices, 'devices')}
          onAddDevice={() => setDeviceDialog(true)}
          onEditDevice={(device) => {
            console.log('编辑设备:', device)
          }}
        />
      )
    },
    {
      id: 'replacement',
      label: '申请补办',
      icon: AlertTriangle,
      content: (
        <CardReplacementManager
          center="WX 01"
          onReplacementCreated={(replacement) => {
            console.log('补办申请已创建:', replacement)
          }}
          onError={(error) => {
            console.error('补办申请错误:', error)
            setError(error)
          }}
        />
      )
    },
    {
      id: 'records',
      label: '打卡记录',
      icon: Activity,
      content: (
        <AttendanceRecords
          records={attendanceRecords}
          onUpdateRecords={setAttendanceRecords}
          onExportRecords={() => exportToCSV(attendanceRecords, 'attendance_records')}
        />
      )
    },
    {
      id: 'reports',
      label: '考勤报告',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                考勤报告管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">考勤报告系统</h3>
                <p className="text-gray-600 mb-6">查看详细的考勤统计和生成企业级报告</p>
                <Button 
                  onClick={() => window.open('/attendance-reports', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  打开考勤报告
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <PageLayout
      title="统一考勤系统"
      description="NFC/RFID卡片考勤管理、设备监控、打卡记录"
      userRole="admin"
      status="系统正常"
      background="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TabbedPage
        tabs={tabs}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
      />



    </PageLayout>
  )
}