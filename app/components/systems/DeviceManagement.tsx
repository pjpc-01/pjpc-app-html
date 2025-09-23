"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Smartphone,
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react"

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

interface DeviceManagementProps {
  devices: NFCDevice[]
  onUpdateDevices: (devices: NFCDevice[]) => void
  onExportDevices: () => void
  onAddDevice: () => void
  onEditDevice: (device: NFCDevice) => void
}

export default function DeviceManagement({
  devices,
  onUpdateDevices,
  onExportDevices,
  onAddDevice,
  onEditDevice
}: DeviceManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])

  // 过滤设备
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (device.ipAddress && device.ipAddress.includes(searchTerm))
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesType = typeFilter === "all" || device.deviceType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'offline': return <XCircle className="h-3 w-3 mr-1" />
      case 'maintenance': return <AlertTriangle className="h-3 w-3 mr-1" />
      default: return <XCircle className="h-3 w-3 mr-1" />
    }
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(filteredDevices.map(d => d.id))
    } else {
      setSelectedDevices([])
    }
  }

  // 处理单个选择
  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId])
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId))
    }
  }

  // 批量更新状态
  const bulkUpdateStatus = (status: "online" | "offline" | "maintenance") => {
    const updatedDevices = devices.map(device => 
      selectedDevices.includes(device.id) ? { ...device, status } : device
    )
    onUpdateDevices(updatedDevices)
    setSelectedDevices([])
  }

  // 批量删除
  const bulkDeleteDevices = () => {
    const updatedDevices = devices.filter(device => !selectedDevices.includes(device.id))
    onUpdateDevices(updatedDevices)
    setSelectedDevices([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            设备管理
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onExportDevices} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
            <Button onClick={onAddDevice} className="flex items-center gap-2">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
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
            <Button onClick={() => bulkUpdateStatus("online")} size="sm" variant="outline">
              <CheckCircle className="h-3 w-3 mr-1" />
              批量上线
            </Button>
            <Button onClick={() => bulkUpdateStatus("offline")} size="sm" variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              批量下线
            </Button>
            <Button onClick={() => bulkUpdateStatus("maintenance")} size="sm" variant="outline">
              <AlertTriangle className="h-3 w-3 mr-1" />
              批量维护
            </Button>
            <Button onClick={bulkDeleteDevices} size="sm" variant="destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              批量删除
            </Button>
          </div>
        )}

        {/* 设备表格 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                  onCheckedChange={handleSelectAll}
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
                    <Button size="sm" variant="outline" onClick={() => onEditDevice(device)}>
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

        {filteredDevices.length === 0 && (
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无设备</h3>
            <p className="text-gray-600">没有找到符合条件的设备</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

