"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  Smartphone,
  Activity,
  Shield,
  Zap,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import { NFCCard, AttendanceRecord, NFCDevice } from "@/lib/nfc-rfid"

interface NFCOverviewTabProps {
  stats: any
  devices: NFCDevice[]
  selectedDevice: string
  setSelectedDevice: (device: string) => void
  isSimulating: boolean
  setIsSimulating: (simulating: boolean) => void
  simulateAttendance: () => void
  loading: boolean
}

export default function NFCOverviewTab({
  stats,
  devices,
  selectedDevice,
  setSelectedDevice,
  isSimulating,
  setIsSimulating,
  simulateAttendance,
  loading
}: NFCOverviewTabProps) {
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
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsSimulating(!isSimulating)}
                variant={isSimulating ? "destructive" : "default"}
                disabled={!selectedDevice || loading}
                className="flex items-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <Pause className="h-4 w-4" />
                    停止模拟
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    开始模拟
                  </>
                )}
              </Button>
              
              <Button
                onClick={simulateAttendance}
                disabled={!selectedDevice || !isSimulating || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                模拟打卡
              </Button>
            </div>
            
            {isSimulating && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✅ 正在模拟打卡中... 每30秒自动生成一次打卡记录
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 系统状态监控 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            系统状态监控
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">设备状态</h4>
              <div className="space-y-2">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-green-500' : 
                        device.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{device.location}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">系统指标</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">响应时间</span>
                  <span className="text-sm text-blue-600">平均 45ms</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">成功率</span>
                  <span className="text-sm text-green-600">99.8%</span>
                </div>
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">并发处理</span>
                  <span className="text-sm text-purple-600">支持 100+ 用户</span>
                </div>
                <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">数据同步</span>
                  <span className="text-sm text-orange-600">实时同步</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
