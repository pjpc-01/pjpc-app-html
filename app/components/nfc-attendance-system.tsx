"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "lucide-react"
import { useNFC } from "@/hooks/useNFC"
import { NFCCard, AttendanceRecord, NFCDevice } from "@/lib/nfc-rfid"

export default function NFCAttendanceSystem() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [newCardDialog, setNewCardDialog] = useState(false)
  const [newDeviceDialog, setNewDeviceDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<NFCCard | null>(null)
  const [editingDevice, setEditingDevice] = useState<NFCDevice | null>(null)

  const {
    cards,
    devices,
    attendanceRecords,
    stats,
    loading,
    error,
    fetchCards,
    fetchDevices,
    fetchAttendanceRecords,
    addCard,
    updateCard,
    deleteCard,
    addDevice,
    updateDevice,
    simulateAttendance,
    clearError,
  } = useNFC()

  // 新卡表单状态
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

  // 新设备表单状态
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

  // 处理新卡提交
  const handleAddCard = useCallback(async () => {
    try {
      await addCard({
        ...newCard,
        issuedDate: new Date(newCard.issuedDate),
        expiryDate: newCard.expiryDate ? new Date(newCard.expiryDate) : undefined,
        usageCount: 0,
      })
      setNewCardDialog(false)
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
    } catch (error) {
      console.error('Error adding card:', error)
    }
  }, [addCard, newCard])

  // 处理新设备提交
  const handleAddDevice = useCallback(async () => {
    try {
      await addDevice({
        ...newDevice,
        cardCount: 0,
        errorCount: 0,
      })
      setNewDeviceDialog(false)
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
    } catch (error) {
      console.error('Error adding device:', error)
    }
  }, [addDevice, newDevice])

  // 开始模拟打卡
  const startSimulation = useCallback(async () => {
    if (!selectedDevice) return
    
    setIsSimulating(true)
    try {
      await simulateAttendance(selectedDevice)
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setIsSimulating(false)
    }
  }, [selectedDevice, simulateAttendance])

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "online":
      case "success":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "offline":
      case "failed":
        return "bg-red-100 text-red-800"
      case "maintenance":
      case "duplicate":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "online":
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "inactive":
      case "offline":
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "maintenance":
      case "duplicate":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总卡数</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalCards}</p>
                      <p className="text-xs text-gray-500">
                        {stats.activeCards} 张活跃卡
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今日打卡</p>
                      <p className="text-2xl font-bold text-green-600">{stats.todayAttendance}</p>
                      <p className="text-xs text-gray-500">次打卡记录</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">设备总数</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.deviceCount}</p>
                      <p className="text-xs text-gray-500">
                        {stats.onlineDevices} 台在线
                      </p>
                    </div>
                    <Smartphone className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">系统状态</p>
                      <p className="text-2xl font-bold text-orange-600">正常</p>
                      <p className="text-xs text-gray-500">所有设备运行中</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 实时打卡模拟 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  实时打卡模拟
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="device-select">选择设备:</Label>
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="选择打卡设备" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} - {device.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={startSimulation} 
                      disabled={!selectedDevice || isSimulating}
                      className="flex items-center gap-2"
                    >
                      {isSimulating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isSimulating ? "模拟中..." : "开始模拟"}
                    </Button>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 最近打卡记录 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  最近打卡记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className="font-medium">{record.studentName}</span>
                          <Badge variant="outline">{record.cardNumber}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {record.deviceName} - {record.location}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatTime(record.timestamp)}</div>
                        <Badge className={getStatusColor(record.status)}>
                          {record.type === 'check_in' ? '签到' : '签退'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "cards":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">NFC/RFID 卡管理</h2>
              <Button onClick={() => setNewCardDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加新卡
              </Button>
            </div>

            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>卡号</TableHead>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>卡类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发卡日期</TableHead>
                      <TableHead>使用次数</TableHead>
                      <TableHead>最后使用</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono">{card.cardNumber}</TableCell>
                        <TableCell>{card.studentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{card.cardType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(card.status)}>
                            {card.status === 'active' ? '活跃' : 
                             card.status === 'inactive' ? '停用' :
                             card.status === 'lost' ? '丢失' : '已替换'}
                          </Badge>
                        </TableCell>
                        <TableCell>{card.issuedDate.toLocaleDateString()}</TableCell>
                        <TableCell>{card.usageCount}</TableCell>
                        <TableCell>
                          {card.lastUsed ? formatTime(card.lastUsed) : '未使用'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
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
        )

      case "devices":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">设备管理</h2>
              <Button onClick={() => setNewDeviceDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加设备
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status === 'online' ? '在线' : 
                         device.status === 'offline' ? '离线' : '维护中'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.deviceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">今日打卡: {device.cardCount} 次</span>
                      </div>
                      {device.lastActivity && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            最后活动: {formatTime(device.lastActivity)}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "records":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">打卡记录</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  导出记录
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  生成报表
                </Button>
              </div>
            </div>

            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>卡号</TableHead>
                      <TableHead>设备</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatTime(record.timestamp)}</TableCell>
                        <TableCell>{record.studentName}</TableCell>
                        <TableCell className="font-mono">{record.cardNumber}</TableCell>
                        <TableCell>{record.deviceName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.type === 'check_in' ? '签到' : 
                             record.type === 'check_out' ? '签退' :
                             record.type === 'break_start' ? '休息开始' : '休息结束'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status === 'success' ? '成功' : 
                             record.status === 'failed' ? '失败' : '重复'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button size="sm" onClick={clearError} className="ml-auto">
            关闭
          </Button>
        </Alert>
      )}

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="cards">卡管理</TabsTrigger>
          <TabsTrigger value="devices">设备管理</TabsTrigger>
          <TabsTrigger value="records">打卡记录</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>

      {/* 添加新卡对话框 */}
      <Dialog open={newCardDialog} onOpenChange={setNewCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新卡</DialogTitle>
            <DialogDescription>为学生分配新的NFC/RFID卡</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardNumber">卡号</Label>
                <Input
                  id="cardNumber"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                  placeholder="输入卡号"
                />
              </div>
              <div>
                <Label htmlFor="studentId">学生ID</Label>
                <Input
                  id="studentId"
                  value={newCard.studentId}
                  onChange={(e) => setNewCard({...newCard, studentId: e.target.value})}
                  placeholder="输入学生ID"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="studentName">学生姓名</Label>
              <Input
                id="studentName"
                value={newCard.studentName}
                onChange={(e) => setNewCard({...newCard, studentName: e.target.value})}
                placeholder="输入学生姓名"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardType">卡类型</Label>
                <Select value={newCard.cardType} onValueChange={(value: "NFC" | "RFID") => setNewCard({...newCard, cardType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">状态</Label>
                <Select value={newCard.status} onValueChange={(value: "active" | "inactive" | "lost" | "replaced") => setNewCard({...newCard, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="replaced">已替换</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issuedDate">发卡日期</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={newCard.issuedDate}
                  onChange={(e) => setNewCard({...newCard, issuedDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">过期日期</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newCard.expiryDate}
                  onChange={(e) => setNewCard({...newCard, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">备注</Label>
              <Input
                id="notes"
                value={newCard.notes}
                onChange={(e) => setNewCard({...newCard, notes: e.target.value})}
                placeholder="输入备注信息"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewCardDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddCard} disabled={loading}>
                {loading ? "添加中..." : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加新设备对话框 */}
      <Dialog open={newDeviceDialog} onOpenChange={setNewDeviceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新设备</DialogTitle>
            <DialogDescription>添加新的NFC/RFID读卡设备</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceName">设备名称</Label>
                <Input
                  id="deviceName"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="输入设备名称"
                />
              </div>
              <div>
                <Label htmlFor="location">位置</Label>
                <Input
                  id="location"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                  placeholder="输入设备位置"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceType">设备类型</Label>
                <Select value={newDevice.deviceType} onValueChange={(value: "NFC" | "RFID" | "hybrid") => setNewDevice({...newDevice, deviceType: value})}>
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
                <Select value={newDevice.status} onValueChange={(value: "online" | "offline" | "maintenance") => setNewDevice({...newDevice, status: value})}>
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
                  value={newDevice.ipAddress}
                  onChange={(e) => setNewDevice({...newDevice, ipAddress: e.target.value})}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <Label htmlFor="macAddress">MAC地址</Label>
                <Input
                  id="macAddress"
                  value={newDevice.macAddress}
                  onChange={(e) => setNewDevice({...newDevice, macAddress: e.target.value})}
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="firmwareVersion">固件版本</Label>
              <Input
                id="firmwareVersion"
                value={newDevice.firmwareVersion}
                onChange={(e) => setNewDevice({...newDevice, firmwareVersion: e.target.value})}
                placeholder="v1.2.3"
              />
            </div>
            <div>
              <Label htmlFor="deviceNotes">备注</Label>
              <Input
                id="deviceNotes"
                value={newDevice.notes}
                onChange={(e) => setNewDevice({...newDevice, notes: e.target.value})}
                placeholder="输入备注信息"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDeviceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddDevice} disabled={loading}>
                {loading ? "添加中..." : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 