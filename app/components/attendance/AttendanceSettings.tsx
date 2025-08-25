"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Settings, 
  Clock, 
  Bell, 
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface AttendanceSettingsProps {
  centerId: string
}

interface AttendanceConfig {
  centerId: string
  checkInStartTime: string
  checkInEndTime: string
  checkOutStartTime: string
  checkOutEndTime: string
  enableNotifications: boolean
  notificationEmail: string
  autoCheckOut: boolean
  autoCheckOutTime: string
  description: string
}

export default function AttendanceSettings({ centerId }: AttendanceSettingsProps) {
  const [config, setConfig] = useState<AttendanceConfig>({
    centerId,
    checkInStartTime: "08:00",
    checkInEndTime: "09:00",
    checkOutStartTime: "17:00",
    checkOutEndTime: "18:00",
    enableNotifications: true,
    notificationEmail: "",
    autoCheckOut: false,
    autoCheckOutTime: "22:00",
    description: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载配置
  const loadConfig = async () => {
    try {
      // 这里应该从API加载配置
      // const response = await fetch(`/api/attendance/config?centerId=${centerId}`)
      // const data = await response.json()
      // setConfig(data)
    } catch (err) {
      console.error('加载配置失败:', err)
    }
  }

  // 保存配置
  const saveConfig = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 这里应该调用API保存配置
      // const response = await fetch('/api/attendance/config', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // })
      
      // if (!response.ok) throw new Error('保存失败')
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
    } catch (err) {
      setError('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [centerId])

  return (
    <div className="space-y-6">
      {/* 成功提示 */}
      {saved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>配置已保存</AlertDescription>
        </Alert>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 考勤时间设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            考勤时间设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">签到时间</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkInStart">开始时间</Label>
                  <Input
                    id="checkInStart"
                    type="time"
                    value={config.checkInStartTime}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      checkInStartTime: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="checkInEnd">结束时间</Label>
                  <Input
                    id="checkInEnd"
                    type="time"
                    value={config.checkInEndTime}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      checkInEndTime: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">签退时间</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkOutStart">开始时间</Label>
                  <Input
                    id="checkOutStart"
                    type="time"
                    value={config.checkOutStartTime}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      checkOutStartTime: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOutEnd">结束时间</Label>
                  <Input
                    id="checkOutEnd"
                    type="time"
                    value={config.checkOutEndTime}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      checkOutEndTime: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoCheckOut">自动签退</Label>
                <p className="text-sm text-gray-600">在指定时间自动签退未签退的学生</p>
              </div>
              <Switch
                id="autoCheckOut"
                checked={config.autoCheckOut}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  autoCheckOut: checked
                }))}
              />
            </div>
            
            {config.autoCheckOut && (
              <div className="mt-4">
                <Label htmlFor="autoCheckOutTime">自动签退时间</Label>
                <Input
                  id="autoCheckOutTime"
                  type="time"
                  value={config.autoCheckOutTime}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    autoCheckOutTime: e.target.value
                  }))}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableNotifications">启用邮件通知</Label>
              <p className="text-sm text-gray-600">考勤异常时发送邮件通知</p>
            </div>
            <Switch
              id="enableNotifications"
              checked={config.enableNotifications}
              onCheckedChange={(checked) => setConfig(prev => ({
                ...prev,
                enableNotifications: checked
              }))}
            />
          </div>
          
          {config.enableNotifications && (
            <div>
              <Label htmlFor="notificationEmail">通知邮箱</Label>
              <Input
                id="notificationEmail"
                type="email"
                placeholder="admin@example.com"
                value={config.notificationEmail}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  notificationEmail: e.target.value
                }))}
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 其他设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            其他设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">考勤说明</Label>
            <Textarea
              id="description"
              placeholder="考勤规则说明..."
              value={config.description}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                description: e.target.value
              }))}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button 
          onClick={saveConfig} 
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存配置
            </>
          )}
        </Button>
      </div>

      {/* 配置预览 */}
      <Card>
        <CardHeader>
          <CardTitle>配置预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>签到时间:</strong> {config.checkInStartTime} - {config.checkInEndTime}</p>
              <p><strong>签退时间:</strong> {config.checkOutStartTime} - {config.checkOutEndTime}</p>
            </div>
            <div>
              <p><strong>自动签退:</strong> 
                {config.autoCheckOut ? (
                  <Badge variant="default" className="ml-2">启用 ({config.autoCheckOutTime})</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">禁用</Badge>
                )}
              </p>
              <p><strong>邮件通知:</strong> 
                {config.enableNotifications ? (
                  <Badge variant="default" className="ml-2">启用</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">禁用</Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
