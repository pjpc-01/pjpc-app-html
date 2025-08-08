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
import NFCOverviewTab from "./nfc-overview-tab"
import NFCCardsTab from "./nfc-cards-tab"

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

  // 处理添加卡片
  const handleAddCard = async () => {
    try {
      await addCard(newCard)
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
      console.error("添加卡片失败:", error)
    }
  }

  // 处理更新卡片
  const handleUpdateCard = async () => {
    if (!editingCard) return
    try {
      await updateCard(editingCard)
      setEditingCard(null)
    } catch (error) {
      console.error("更新卡片失败:", error)
    }
  }

  // 处理添加设备
  const handleAddDevice = async () => {
    try {
      await addDevice(newDevice)
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
      console.error("添加设备失败:", error)
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'lost':
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
        return <CheckCircle className="h-3 w-3 mr-1" />
      case 'inactive':
        return <XCircle className="h-3 w-3 mr-1" />
      case 'lost':
        return <AlertTriangle className="h-3 w-3 mr-1" />
      case 'replaced':
        return <RefreshCw className="h-3 w-3 mr-1" />
      default:
        return <XCircle className="h-3 w-3 mr-1" />
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
          <NFCOverviewTab
            stats={stats}
            devices={devices}
            selectedDevice={selectedDevice}
            setSelectedDevice={setSelectedDevice}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            simulateAttendance={simulateAttendance}
            loading={loading}
          />
        )
      case "cards":
        return (
          <NFCCardsTab
            cards={cards}
            loading={loading}
            newCardDialog={newCardDialog}
            setNewCardDialog={setNewCardDialog}
            editingCard={editingCard}
            setEditingCard={setEditingCard}
            newCard={newCard}
            setNewCard={setNewCard}
            addCard={handleAddCard}
            updateCard={handleUpdateCard}
            deleteCard={deleteCard}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        )
      case "devices":
        return (
          <div className="space-y-6">
            {/* 设备管理内容 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    设备管理
                  </CardTitle>
                  <Button onClick={() => setNewDeviceDialog(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    添加设备
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 font-medium">✅ 设备管理功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "records":
        return (
          <div className="space-y-6">
            {/* 打卡记录内容 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  打卡记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">✅ 打卡记录功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            概览
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
          {renderTabContent()}
        </TabsContent>
      </Tabs>

      {/* 添加设备对话框 */}
      <Dialog open={newDeviceDialog} onOpenChange={setNewDeviceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新设备</DialogTitle>
            <DialogDescription>配置新的NFC/RFID设备</DialogDescription>
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