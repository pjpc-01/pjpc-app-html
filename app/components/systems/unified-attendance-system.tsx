"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Smartphone,
  Clock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Wifi,
  WifiOff,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Download,
  Upload,
  Shield,
  Zap,
  Database,
  BarChart3,
  Scan,
  Save,
  Loader2,
  UserCheck,
  Calendar,
  MapPin,
  FileText,
  Search,
  Filter,
} from "lucide-react"

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

  // 搜索和过滤状态
  const [cardSearchTerm, setCardSearchTerm] = useState("")
  const [cardStatusFilter, setCardStatusFilter] = useState<string>("all")
  const [cardTypeFilter, setCardTypeFilter] = useState<string>("all")
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("")
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string>("all")
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all")
  const [recordSearchTerm, setRecordSearchTerm] = useState("")
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>("all")
  const [recordStatusFilter, setRecordStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  // 批量操作状态
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  // 对话框状态
  const [cardDialog, setCardDialog] = useState(false)
  const [deviceDialog, setDeviceDialog] = useState(false)
  const [readWriteDialog, setReadWriteDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<NFCCard | null>(null)
  const [editingDevice, setEditingDevice] = useState<NFCDevice | null>(null)

  // 表单状态
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    studentId: "",
    studentName: "",
    cardType: "NFC" as "NFC" | "RFID",
    status: "active" as "active" | "inactive" | "lost" | "replaced",
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    notes: "",
  })

  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
    deviceType: "NFC" as "NFC" | "RFID" | "hybrid",
    status: "online" as "online" | "offline" | "maintenance",
    ipAddress: "",
    macAddress: "",
    firmwareVersion: "",
    notes: "",
  })

  // 读写操作状态
  const [readWriteMode, setReadWriteMode] = useState<"read" | "write">("read")
  const [readWriteData, setReadWriteData] = useState("")
  const [readWriteStatus, setReadWriteStatus] = useState<"idle" | "reading" | "writing" | "success" | "error">("idle")

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

  // 处理读写操作
  const handleReadWrite = async () => {
    setReadWriteStatus(readWriteMode === "read" ? "reading" : "writing")
    
    // 模拟读写操作
    setTimeout(() => {
      if (readWriteMode === "read") {
        setReadWriteData("模拟读取的数据: {studentId: 'STU001', name: '张三', cardType: 'NFC'}")
        setReadWriteStatus("success")
      } else {
        setReadWriteStatus("success")
      }
      
      setTimeout(() => {
        setReadWriteStatus("idle")
        setReadWriteData("")
      }, 2000)
    }, 1500)
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      case 'lost':
      case 'maintenance':
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'replaced':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'success':
        return <CheckCircle className="h-3 w-3 mr-1" />
      case 'inactive':
      case 'offline':
        return <XCircle className="h-3 w-3 mr-1" />
      case 'lost':
      case 'maintenance':
      case 'failed':
        return <AlertTriangle className="h-3 w-3 mr-1" />
      case 'replaced':
        return <RefreshCw className="h-3 w-3 mr-1" />
      default:
        return <XCircle className="h-3 w-3 mr-1" />
    }
  }

  // 过滤函数
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.studentName.toLowerCase().includes(cardSearchTerm.toLowerCase()) ||
                         card.studentId.toLowerCase().includes(cardSearchTerm.toLowerCase()) ||
                         card.cardNumber.toLowerCase().includes(cardSearchTerm.toLowerCase())
    const matchesStatus = cardStatusFilter === "all" || card.status === cardStatusFilter
    const matchesType = cardTypeFilter === "all" || card.cardType === cardTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
                         (device.ipAddress && device.ipAddress.includes(deviceSearchTerm))
    const matchesStatus = deviceStatusFilter === "all" || device.status === deviceStatusFilter
    const matchesType = deviceTypeFilter === "all" || device.deviceType === deviceTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
                         record.cardNumber.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
                         record.deviceName.toLowerCase().includes(recordSearchTerm.toLowerCase())
    const matchesType = recordTypeFilter === "all" || record.type === recordTypeFilter
    const matchesStatus = recordStatusFilter === "all" || record.status === recordStatusFilter
    
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const recordDate = new Date(record.timestamp)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDate = recordDate >= startDate && recordDate <= endDate
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  // 批量操作函数
  const handleSelectAllCards = (checked: boolean) => {
    if (checked) {
      setSelectedCards(filteredCards.map(c => c.id))
    } else {
      setSelectedCards([])
    }
  }

  const handleSelectCard = (cardId: string, checked: boolean) => {
    if (checked) {
      setSelectedCards(prev => [...prev, cardId])
    } else {
      setSelectedCards(prev => prev.filter(id => id !== cardId))
    }
  }

  const handleSelectAllDevices = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(filteredDevices.map(d => d.id))
    } else {
      setSelectedDevices([])
    }
  }

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId])
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId))
    }
  }

  const handleSelectAllRecords = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(r => r.id))
    } else {
      setSelectedRecords([])
    }
  }

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId])
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId))
    }
  }

  // 批量操作
  const bulkUpdateCardStatus = (status: "active" | "inactive" | "lost" | "replaced") => {
    setCards(prev => prev.map(card => 
      selectedCards.includes(card.id) ? { ...card, status } : card
    ))
    setSelectedCards([])
  }

  const bulkUpdateDeviceStatus = (status: "online" | "offline" | "maintenance") => {
    setDevices(prev => prev.map(device => 
      selectedDevices.includes(device.id) ? { ...device, status } : device
    ))
    setSelectedDevices([])
  }

  const bulkDeleteCards = () => {
    setCards(prev => prev.filter(card => !selectedCards.includes(card.id)))
    setSelectedCards([])
  }

  const bulkDeleteDevices = () => {
    setDevices(prev => prev.filter(device => !selectedDevices.includes(device.id)))
    setSelectedDevices([])
  }

  const bulkDeleteRecords = () => {
    setAttendanceRecords(prev => prev.filter(record => !selectedRecords.includes(record.id)))
    setSelectedRecords([])
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
          <AlertTriangle className="h-4 w-4" />
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
                      <UserCheck className="h-8 w-8 text-purple-600" />
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
                      <Activity className="h-8 w-8 text-orange-600" />
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      卡片管理
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => exportToCSV(cards, 'cards')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        导出
                      </Button>
                      <Button onClick={() => setCardDialog(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        添加卡片
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 搜索和过滤 */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="搜索卡片号、学生ID或姓名..."
                          value={cardSearchTerm}
                          onChange={(e) => setCardSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={cardStatusFilter} onValueChange={setCardStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">激活</SelectItem>
                        <SelectItem value="inactive">停用</SelectItem>
                        <SelectItem value="lost">丢失</SelectItem>
                        <SelectItem value="replaced">已替换</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={cardTypeFilter} onValueChange={setCardTypeFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="类型筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="NFC">NFC</SelectItem>
                        <SelectItem value="RFID">RFID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 批量操作 */}
                  {selectedCards.length > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
                      <span className="text-sm font-medium">已选择 {selectedCards.length} 张卡片</span>
                      <Button onClick={() => bulkUpdateCardStatus("active")} size="sm" variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        批量激活
                      </Button>
                      <Button onClick={() => bulkUpdateCardStatus("inactive")} size="sm" variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        批量停用
                      </Button>
                      <Button onClick={() => bulkUpdateCardStatus("lost")} size="sm" variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        标记丢失
                      </Button>
                      <Button onClick={bulkDeleteCards} size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        批量删除
                      </Button>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                            onCheckedChange={handleSelectAllCards}
                          />
                        </TableHead>
                        <TableHead>卡片号</TableHead>
                        <TableHead>学生ID</TableHead>
                        <TableHead>学生姓名</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>发行日期</TableHead>
                        <TableHead>最后使用</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCards.includes(card.id)}
                              onCheckedChange={(checked) => handleSelectCard(card.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono">{card.cardNumber}</TableCell>
                          <TableCell>{card.studentId}</TableCell>
                          <TableCell>{card.studentName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{card.cardType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(card.status)}>
                              {getStatusIcon(card.status)}
                              {card.status === "active" ? "激活" : 
                               card.status === "inactive" ? "停用" :
                               card.status === "lost" ? "丢失" : "已替换"}
                            </Badge>
                          </TableCell>
                          <TableCell>{card.issuedDate}</TableCell>
                          <TableCell>{card.lastUsed || "未使用"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingCard(card)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setReadWriteDialog(true)}>
                                <Scan className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "devices" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      设备管理
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => exportToCSV(devices, 'devices')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        导出
                      </Button>
                      <Button onClick={() => setDeviceDialog(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        添加设备
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 搜索和过滤 */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="搜索设备名称、位置或IP地址..."
                          value={deviceSearchTerm}
                          onChange={(e) => setDeviceSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={deviceStatusFilter} onValueChange={setDeviceStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="online">在线</SelectItem>
                        <SelectItem value="offline">离线</SelectItem>
                        <SelectItem value="maintenance">维护中</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="类型筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="NFC">NFC</SelectItem>
                        <SelectItem value="RFID">RFID</SelectItem>
                        <SelectItem value="hybrid">混合</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 批量操作 */}
                  {selectedDevices.length > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
                      <span className="text-sm font-medium">已选择 {selectedDevices.length} 台设备</span>
                      <Button onClick={() => bulkUpdateDeviceStatus("online")} size="sm" variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        批量上线
                      </Button>
                      <Button onClick={() => bulkUpdateDeviceStatus("offline")} size="sm" variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        批量下线
                      </Button>
                      <Button onClick={() => bulkUpdateDeviceStatus("maintenance")} size="sm" variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        批量维护
                      </Button>
                      <Button onClick={bulkDeleteDevices} size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        批量删除
                      </Button>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                            onCheckedChange={handleSelectAllDevices}
                          />
                        </TableHead>
                        <TableHead>设备名称</TableHead>
                        <TableHead>位置</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>IP地址</TableHead>
                        <TableHead>固件版本</TableHead>
                        <TableHead>最后在线</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDevices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={(checked) => handleSelectDevice(device.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>{device.name}</TableCell>
                          <TableCell>{device.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{device.deviceType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(device.status)}>
                              {getStatusIcon(device.status)}
                              {device.status === "online" ? "在线" : 
                               device.status === "offline" ? "离线" : "维护中"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">{device.ipAddress}</TableCell>
                          <TableCell>{device.firmwareVersion}</TableCell>
                          <TableCell>{device.lastSeen || "未知"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingDevice(device)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "records" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      打卡记录
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => exportToCSV(attendanceRecords, 'attendance_records')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        导出
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 搜索和过滤 */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="搜索学生姓名、卡片号或设备名称..."
                          value={recordSearchTerm}
                          onChange={(e) => setRecordSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="类型筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="checkin">签到</SelectItem>
                        <SelectItem value="checkout">签退</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={recordStatusFilter} onValueChange={setRecordStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="success">成功</SelectItem>
                        <SelectItem value="failed">失败</SelectItem>
                        <SelectItem value="duplicate">重复</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 日期范围筛选 */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div>
                      <Label htmlFor="startDate">开始日期</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">结束日期</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 批量操作 */}
                  {selectedRecords.length > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
                      <span className="text-sm font-medium">已选择 {selectedRecords.length} 条记录</span>
                      <Button onClick={bulkDeleteRecords} size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        批量删除
                      </Button>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                            onCheckedChange={handleSelectAllRecords}
                          />
                        </TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>学生</TableHead>
                        <TableHead>卡片号</TableHead>
                        <TableHead>设备</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRecords.includes(record.id)}
                              onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {new Date(record.timestamp).toLocaleString('zh-CN')}
                          </TableCell>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell className="font-mono">{record.cardNumber}</TableCell>
                          <TableCell>{record.deviceName}</TableCell>
                          <TableCell>
                            <Badge variant={record.type === "checkin" ? "default" : "secondary"}>
                              {record.type === "checkin" ? "签到" : "签退"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusIcon(record.status)}
                              {record.status === "success" ? "成功" : "失败"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 读写卡片对话框 */}
      <Dialog open={readWriteDialog} onOpenChange={setReadWriteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              NFC/RFID 读写操作
            </DialogTitle>
            <DialogDescription>
              读取或写入NFC/RFID卡片数据
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={readWriteMode === "read" ? "default" : "outline"}
                onClick={() => setReadWriteMode("read")}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                读取
              </Button>
              <Button
                variant={readWriteMode === "write" ? "default" : "outline"}
                onClick={() => setReadWriteMode("write")}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                写入
              </Button>
            </div>

            {readWriteMode === "write" && (
              <div>
                <Label htmlFor="writeData">写入数据</Label>
                <Textarea
                  id="writeData"
                  placeholder="输入要写入的数据 (JSON格式)"
                  value={readWriteData}
                  onChange={(e) => setReadWriteData(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {readWriteMode === "read" && readWriteData && (
              <div>
                <Label>读取的数据</Label>
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                  {readWriteData}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReadWriteDialog(false)}>
                取消
              </Button>
              <Button 
                onClick={handleReadWrite} 
                disabled={readWriteStatus !== "idle"}
                className="flex items-center gap-2"
              >
                {readWriteStatus === "idle" && (
                  <>
                    {readWriteMode === "read" ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    {readWriteMode === "read" ? "读取" : "写入"}
                  </>
                )}
                {readWriteStatus === "reading" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    读取中...
                  </>
                )}
                {readWriteStatus === "writing" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    写入中...
                  </>
                )}
                {readWriteStatus === "success" && (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    成功
                  </>
                )}
                {readWriteStatus === "error" && (
                  <>
                    <XCircle className="h-4 w-4" />
                    失败
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加/编辑卡片对话框 */}
      <Dialog open={cardDialog || !!editingCard} onOpenChange={() => {
        setCardDialog(false)
        setEditingCard(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? '编辑卡片' : '添加新卡片'}
            </DialogTitle>
            <DialogDescription>
              {editingCard ? '修改卡片信息' : '创建新的NFC/RFID卡片'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardNumber">卡片号</Label>
                <Input
                  id="cardNumber"
                  value={editingCard ? editingCard.cardNumber : newCard.cardNumber}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, cardNumber: e.target.value})
                    : setNewCard({...newCard, cardNumber: e.target.value})
                  }
                  placeholder="输入卡片号"
                />
              </div>
              <div>
                <Label htmlFor="studentId">学生ID</Label>
                <Input
                  id="studentId"
                  value={editingCard ? editingCard.studentId : newCard.studentId}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, studentId: e.target.value})
                    : setNewCard({...newCard, studentId: e.target.value})
                  }
                  placeholder="输入学生ID"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">学生姓名</Label>
                <Input
                  id="studentName"
                  value={editingCard ? editingCard.studentName : newCard.studentName}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, studentName: e.target.value})
                    : setNewCard({...newCard, studentName: e.target.value})
                  }
                  placeholder="输入学生姓名"
                />
              </div>
              <div>
                <Label htmlFor="cardType">卡片类型</Label>
                <Select 
                  value={editingCard ? editingCard.cardType : newCard.cardType} 
                  onValueChange={(value: "NFC" | "RFID") => editingCard 
                    ? setEditingCard({...editingCard, cardType: value})
                    : setNewCard({...newCard, cardType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">状态</Label>
                <Select 
                  value={editingCard ? editingCard.status : newCard.status} 
                  onValueChange={(value: "active" | "inactive" | "lost" | "replaced") => editingCard 
                    ? setEditingCard({...editingCard, status: value})
                    : setNewCard({...newCard, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">激活</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="replaced">已替换</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="issuedDate">发行日期</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={editingCard ? editingCard.issuedDate : newCard.issuedDate}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, issuedDate: e.target.value})
                    : setNewCard({...newCard, issuedDate: e.target.value})
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiryDate">过期日期 (可选)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={editingCard ? editingCard.expiryDate || "" : newCard.expiryDate}
                onChange={(e) => editingCard 
                  ? setEditingCard({...editingCard, expiryDate: e.target.value})
                  : setNewCard({...newCard, expiryDate: e.target.value})
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={editingCard ? editingCard.notes || "" : newCard.notes}
                onChange={(e) => editingCard 
                  ? setEditingCard({...editingCard, notes: e.target.value})
                  : setNewCard({...newCard, notes: e.target.value})
                }
                placeholder="输入备注信息"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setCardDialog(false)
                setEditingCard(null)
              }}>
                取消
              </Button>
              <Button onClick={() => {
                if (editingCard) {
                  // 更新卡片
                  setCards(prev => prev.map(card => 
                    card.id === editingCard.id ? editingCard : card
                  ))
                } else {
                  // 添加新卡片
                  const newCardData: NFCCard = {
                    id: Date.now().toString(),
                    cardNumber: newCard.cardNumber,
                    studentId: newCard.studentId,
                    studentName: newCard.studentName,
                    cardType: newCard.cardType,
                    status: newCard.status,
                    issuedDate: newCard.issuedDate,
                    expiryDate: newCard.expiryDate || undefined,
                    notes: newCard.notes || undefined,
                  }
                  setCards(prev => [...prev, newCardData])
                  
                  // 重置表单
                  setNewCard({
                    cardNumber: "",
                    studentId: "",
                    studentName: "",
                    cardType: "NFC",
                    status: "active",
                    issuedDate: new Date().toISOString().split('T')[0],
                    expiryDate: "",
                    notes: "",
                  })
                }
                
                // 更新统计
                const updatedCards = editingCard 
                  ? cards.map(card => card.id === editingCard.id ? editingCard : card)
                  : [...cards, {
                      id: Date.now().toString(),
                      cardNumber: newCard.cardNumber,
                      studentId: newCard.studentId,
                      studentName: newCard.studentName,
                      cardType: newCard.cardType,
                      status: newCard.status,
                      issuedDate: newCard.issuedDate,
                      expiryDate: newCard.expiryDate || undefined,
                      notes: newCard.notes || undefined,
                    }]
                
                setStats(prev => ({
                  ...prev,
                  totalCards: updatedCards.length,
                  activeCards: updatedCards.filter(c => c.status === "active").length,
                }))
                
                setCardDialog(false)
                setEditingCard(null)
              }}>
                {editingCard ? "更新" : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加/编辑设备对话框 */}
      <Dialog open={deviceDialog || !!editingDevice} onOpenChange={() => {
        setDeviceDialog(false)
        setEditingDevice(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? '编辑设备' : '添加新设备'}
            </DialogTitle>
            <DialogDescription>
              {editingDevice ? '修改设备信息' : '配置新的NFC/RFID设备'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceName">设备名称</Label>
                <Input
                  id="deviceName"
                  value={editingDevice ? editingDevice.name : newDevice.name}
                  onChange={(e) => editingDevice 
                    ? setEditingDevice({...editingDevice, name: e.target.value})
                    : setNewDevice({...newDevice, name: e.target.value})
                  }
                  placeholder="输入设备名称"
                />
              </div>
              <div>
                <Label htmlFor="location">位置</Label>
                <Input
                  id="location"
                  value={editingDevice ? editingDevice.location : newDevice.location}
                  onChange={(e) => editingDevice 
                    ? setEditingDevice({...editingDevice, location: e.target.value})
                    : setNewDevice({...newDevice, location: e.target.value})
                  }
                  placeholder="输入设备位置"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceType">设备类型</Label>
                <Select 
                  value={editingDevice ? editingDevice.deviceType : newDevice.deviceType} 
                  onValueChange={(value: "NFC" | "RFID" | "hybrid") => editingDevice 
                    ? setEditingDevice({...editingDevice, deviceType: value})
                    : setNewDevice({...newDevice, deviceType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                    <SelectItem value="hybrid">混合</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">状态</Label>
                <Select 
                  value={editingDevice ? editingDevice.status : newDevice.status} 
                  onValueChange={(value: "online" | "offline" | "maintenance") => editingDevice 
                    ? setEditingDevice({...editingDevice, status: value})
                    : setNewDevice({...newDevice, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">在线</SelectItem>
                    <SelectItem value="offline">离线</SelectItem>
                    <SelectItem value="maintenance">维护中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ipAddress">IP地址</Label>
                <Input
                  id="ipAddress"
                  value={editingDevice ? editingDevice.ipAddress || "" : newDevice.ipAddress}
                  onChange={(e) => editingDevice 
                    ? setEditingDevice({...editingDevice, ipAddress: e.target.value})
                    : setNewDevice({...newDevice, ipAddress: e.target.value})
                  }
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <Label htmlFor="macAddress">MAC地址</Label>
                <Input
                  id="macAddress"
                  value={editingDevice ? editingDevice.macAddress || "" : newDevice.macAddress}
                  onChange={(e) => editingDevice 
                    ? setEditingDevice({...editingDevice, macAddress: e.target.value})
                    : setNewDevice({...newDevice, macAddress: e.target.value})
                  }
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="firmwareVersion">固件版本</Label>
              <Input
                id="firmwareVersion"
                value={editingDevice ? editingDevice.firmwareVersion || "" : newDevice.firmwareVersion}
                onChange={(e) => editingDevice 
                  ? setEditingDevice({...editingDevice, firmwareVersion: e.target.value})
                  : setNewDevice({...newDevice, firmwareVersion: e.target.value})
                }
                placeholder="v1.2.3"
              />
            </div>

            <div>
              <Label htmlFor="deviceNotes">备注</Label>
              <Textarea
                id="deviceNotes"
                value={editingDevice ? editingDevice.notes || "" : newDevice.notes}
                onChange={(e) => editingDevice 
                  ? setEditingDevice({...editingDevice, notes: e.target.value})
                  : setNewDevice({...newDevice, notes: e.target.value})
                }
                placeholder="输入备注信息"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setDeviceDialog(false)
                setEditingDevice(null)
              }}>
                取消
              </Button>
              <Button onClick={() => {
                if (editingDevice) {
                  // 更新设备
                  setDevices(prev => prev.map(device => 
                    device.id === editingDevice.id ? editingDevice : device
                  ))
                } else {
                  // 添加新设备
                  const newDeviceData: NFCDevice = {
                    id: Date.now().toString(),
                    name: newDevice.name,
                    location: newDevice.location,
                    deviceType: newDevice.deviceType,
                    status: newDevice.status,
                    ipAddress: newDevice.ipAddress || undefined,
                    macAddress: newDevice.macAddress || undefined,
                    firmwareVersion: newDevice.firmwareVersion || undefined,
                    notes: newDevice.notes || undefined,
                    lastSeen: new Date().toLocaleString(),
                  }
                  setDevices(prev => [...prev, newDeviceData])
                  
                  // 重置表单
                  setNewDevice({
                    name: "",
                    location: "",
                    deviceType: "NFC",
                    status: "online",
                    ipAddress: "",
                    macAddress: "",
                    firmwareVersion: "",
                    notes: "",
                  })
                }
                
                // 更新统计
                const updatedDevices = editingDevice 
                  ? devices.map(device => device.id === editingDevice.id ? editingDevice : device)
                  : [...devices, {
                      id: Date.now().toString(),
                      name: newDevice.name,
                      location: newDevice.location,
                      deviceType: newDevice.deviceType,
                      status: newDevice.status,
                      ipAddress: newDevice.ipAddress || undefined,
                      macAddress: newDevice.macAddress || undefined,
                      firmwareVersion: newDevice.firmwareVersion || undefined,
                      notes: newDevice.notes || undefined,
                      lastSeen: new Date().toLocaleString(),
                    }]
                
                setStats(prev => ({
                  ...prev,
                  totalDevices: updatedDevices.length,
                  onlineDevices: updatedDevices.filter(d => d.status === "online").length,
                }))
                
                setDeviceDialog(false)
                setEditingDevice(null)
              }}>
                {editingDevice ? "更新" : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
