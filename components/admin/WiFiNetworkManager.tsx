"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield
} from "lucide-react"

interface WiFiNetwork {
  id: string
  network_name: string
  description: string
  center_id: string
  is_active: boolean
  created: string
  updated: string
}

export default function WiFiNetworkManager() {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 表单状态
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<WiFiNetwork | null>(null)
  const [formData, setFormData] = useState({
    networkName: '',
    description: '',
    centerId: '',
    isActive: true
  })

  // 加载WiFi网络列表
  const loadNetworks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/wifi-networks')
      const data = await response.json()
      
      if (data.success) {
        setNetworks(data.data)
      } else {
        setError(data.error || '加载WiFi网络配置失败')
      }
    } catch (err: any) {
      setError(err.message || '加载WiFi网络配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存WiFi网络配置
  const saveNetwork = async () => {
    try {
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/wifi-networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(data.message)
        setIsDialogOpen(false)
        resetForm()
        loadNetworks()
      } else {
        setError(data.error || '保存WiFi网络配置失败')
      }
    } catch (err: any) {
      setError(err.message || '保存WiFi网络配置失败')
    }
  }

  // 删除WiFi网络配置
  const deleteNetwork = async (id: string) => {
    if (!confirm('确定要删除这个WiFi网络配置吗？')) {
      return
    }

    try {
      setError(null)
      
      const response = await fetch(`/api/wifi-networks?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(data.message)
        loadNetworks()
      } else {
        setError(data.error || '删除WiFi网络配置失败')
      }
    } catch (err: any) {
      setError(err.message || '删除WiFi网络配置失败')
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      networkName: '',
      description: '',
      centerId: '',
      isActive: true
    })
    setEditingNetwork(null)
  }

  // 编辑网络
  const editNetwork = (network: WiFiNetwork) => {
    setFormData({
      networkName: network.network_name,
      description: network.description,
      centerId: network.center_id,
      isActive: network.is_active
    })
    setEditingNetwork(network)
    setIsDialogOpen(true)
  }

  // 打开新建对话框
  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  useEffect(() => {
    loadNetworks()
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WiFi网络管理</h2>
          <p className="text-gray-600">管理教师打卡时允许的WiFi网络</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          添加WiFi网络
        </Button>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* WiFi网络列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            允许的WiFi网络
          </CardTitle>
          <CardDescription>
            教师只能在这些WiFi网络环境下进行打卡操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>加载中...</span>
            </div>
          ) : networks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无WiFi网络配置</p>
              <p className="text-sm">点击"添加WiFi网络"开始配置</p>
            </div>
          ) : (
            <div className="space-y-3">
              {networks.map((network) => (
                <div key={network.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${network.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Wifi className={`h-5 w-5 ${network.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{network.network_name}</h3>
                      <p className="text-sm text-gray-500">{network.description || '无描述'}</p>
                      {network.center_id && (
                        <p className="text-xs text-blue-600">中心: {network.center_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={network.is_active ? 'default' : 'secondary'}>
                      {network.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          启用
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          禁用
                        </>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editNetwork(network)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNetwork(network.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {editingNetwork ? '编辑WiFi网络' : '添加WiFi网络'}
            </DialogTitle>
            <DialogDescription>
              {editingNetwork ? '修改WiFi网络配置' : '添加新的允许WiFi网络'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="networkName">网络名称 *</Label>
              <Input
                id="networkName"
                value={formData.networkName}
                onChange={(e) => setFormData({ ...formData, networkName: e.target.value })}
                placeholder="例如: PJPC-WiFi, 安亲班WiFi"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持部分匹配，例如输入"PJPC"可以匹配"PJPC-WiFi"、"PJPC-Office"等
              </p>
            </div>
            
            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="例如: 主办公室WiFi"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="centerId">关联中心</Label>
              <Input
                id="centerId"
                value={formData.centerId}
                onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                placeholder="例如: wx01, wx02 (可选)"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">启用此网络</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveNetwork} disabled={!formData.networkName.trim()}>
              {editingNetwork ? '更新' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
