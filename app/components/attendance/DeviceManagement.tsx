"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Monitor, 
  Smartphone, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Wifi,
  WifiOff
} from "lucide-react"

interface Device {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  status: 'active' | 'inactive'
  location: string
  ipAddress?: string
  lastSeen?: string
  description?: string
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // 初始化设备列表
  useEffect(() => {
    const initialDevices: Device[] = [
      {
        id: 'device-1',
        name: '前台打卡机',
        type: 'desktop',
        status: 'active',
        location: '前台',
        ipAddress: '192.168.1.100',
        lastSeen: new Date().toISOString(),
        description: '前台主要打卡设备'
      },
      {
        id: 'device-2',
        name: '后门打卡机',
        type: 'desktop',
        status: 'active',
        location: '后门',
        ipAddress: '192.168.1.101',
        lastSeen: new Date().toISOString(),
        description: '后门备用打卡设备'
      },
      {
        id: 'device-3',
        name: '移动打卡设备',
        type: 'mobile',
        status: 'active',
        location: '移动',
        ipAddress: '192.168.1.102',
        lastSeen: new Date().toISOString(),
        description: '移动式打卡设备'
      }
    ]
    
    setDevices(initialDevices)
  }, [])

  // 添加设备
  const addDevice = (device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: `device-${Date.now()}`
    }
    setDevices(prev => [...prev, newDevice])
    setShowAddForm(false)
  }

  // 更新设备
  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices(prev => prev.map(device => 
      device.id === id ? { ...device, ...updates } : device
    ))
    setEditingDevice(null)
  }

  // 删除设备
  const deleteDevice = (id: string) => {
    setDevices(prev => prev.filter(device => device.id !== id))
  }

  // 切换设备状态
  const toggleDeviceStatus = (id: string) => {
    setDevices(prev => prev.map(device => 
      device.id === id 
        ? { ...device, status: device.status === 'active' ? 'inactive' : 'active' }
        : device
    ))
  }

  // 获取设备图标
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Monitor className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 设备统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总设备数</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在线设备</p>
                <p className="text-2xl font-bold text-green-600">
                  {devices.filter(d => d.status === 'active').length}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">离线设备</p>
                <p className="text-2xl font-bold text-red-600">
                  {devices.filter(d => d.status === 'inactive').length}
                </p>
              </div>
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">设备类型</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(devices.map(d => d.type)).size}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 设备列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>设备管理</CardTitle>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加设备
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后在线</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <span className="font-medium">{device.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {device.type === 'desktop' ? '桌面' : 
                         device.type === 'mobile' ? '移动' : '平板'}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell className="font-mono">{device.ipAddress}</TableCell>
                    <TableCell>
                      <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                        {device.status === 'active' ? '在线' : '离线'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.lastSeen ? 
                        new Date(device.lastSeen).toLocaleString('zh-CN') : 
                        '未知'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDeviceStatus(device.id)}
                        >
                          {device.status === 'active' ? 
                            <PowerOff className="h-4 w-4" /> : 
                            <Power className="h-4 w-4" />
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDevice(device)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 添加设备表单 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>添加设备</CardTitle>
          </CardHeader>
          <CardContent>
            <AddDeviceForm 
              onAdd={addDevice}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* 编辑设备表单 */}
      {editingDevice && (
        <Card>
          <CardHeader>
            <CardTitle>编辑设备</CardTitle>
          </CardHeader>
          <CardContent>
            <EditDeviceForm 
              device={editingDevice}
              onUpdate={updateDevice}
              onCancel={() => setEditingDevice(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 添加设备表单组件
function AddDeviceForm({ 
  onAdd, 
  onCancel 
}: { 
  onAdd: (device: Omit<Device, 'id'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'desktop' as const,
    location: '',
    ipAddress: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      ...formData,
      status: 'active'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">设备名称</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">设备类型</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">桌面设备</SelectItem>
              <SelectItem value="mobile">移动设备</SelectItem>
              <SelectItem value="tablet">平板设备</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">位置</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="ipAddress">IP地址</Label>
          <Input
            id="ipAddress"
            value={formData.ipAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">描述</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          添加设备
        </Button>
      </div>
    </form>
  )
}

// 编辑设备表单组件
function EditDeviceForm({ 
  device, 
  onUpdate, 
  onCancel 
}: { 
  device: Device
  onUpdate: (id: string, updates: Partial<Device>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: device.name,
    type: device.type,
    location: device.location,
    ipAddress: device.ipAddress || '',
    description: device.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(device.id, formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">设备名称</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">设备类型</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">桌面设备</SelectItem>
              <SelectItem value="mobile">移动设备</SelectItem>
              <SelectItem value="tablet">平板设备</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">位置</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="ipAddress">IP地址</Label>
          <Input
            id="ipAddress"
            value={formData.ipAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">描述</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          更新设备
        </Button>
      </div>
    </form>
  )
}
