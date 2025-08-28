"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity,
  Calendar,
  MapPin
} from "lucide-react"
import Link from "next/link"

interface TeacherAttendanceRecord {
  id: string
  teacherId: string
  teacherName: string
  centerId: string
  centerName: string
  timestamp: string
  type: 'check-in' | 'check-out'
  status: 'success' | 'failed'
  method: 'manual' | 'nfc' | 'url'
}

export default function TeacherCheckinPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  const urlTeacherId = searchParams.get('teacherId')
  const urlTeacherName = searchParams.get('teacherName')
  
  // 页面状态
  const [teacherId, setTeacherId] = useState(urlTeacherId || "")
  const [teacherName, setTeacherName] = useState(urlTeacherName || "")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([])
  const [todayStatus, setTodayStatus] = useState<'not_checked_in' | 'checked_in' | 'checked_out'>('not_checked_in')
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)

  // 获取中心显示名称
  const getCenterDisplayName = (centerId: string | null) => {
    if (!centerId) return '未指定'
    const centerNames: { [key: string]: string } = {
      'wx01': 'WX 01',
      'wx02': 'WX 02',
      'wx03': 'WX 03',
      'wx04': 'WX 04'
    }
    return centerNames[centerId.toLowerCase()] || centerId
  }

  // 获取今日考勤状态
  useEffect(() => {
    if (teacherId && centerId) {
      fetchTodayStatus()
    }
  }, [teacherId, centerId])

  const fetchTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/teacher-attendance?type=teacher&date=${today}`)
      if (response.ok) {
        const data = await response.json()
        const todayRecords = data.data || []
        
        // 查找当前教师的记录
        const teacherRecord = todayRecords.find((r: any) => r.teacher_id === teacherId)
        
        if (teacherRecord) {
          if (teacherRecord.check_in && teacherRecord.check_out) {
            setTodayStatus('checked_out')
            setCheckInTime(teacherRecord.check_in)
            setCheckOutTime(teacherRecord.check_out)
          } else if (teacherRecord.check_in) {
            setTodayStatus('checked_in')
            setCheckInTime(teacherRecord.check_in)
            setCheckOutTime(null)
          }
        } else {
          setTodayStatus('not_checked_in')
          setCheckInTime(null)
          setCheckOutTime(null)
        }
      }
    } catch (error) {
      console.error('获取今日状态失败:', error)
    }
  }

  const processAttendance = async (type: 'check-in' | 'check-out') => {
    if (!teacherId || !teacherName || !centerId) {
      setError("请填写完整的教师信息")
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/teacher-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacherId,
          teacherName: teacherName,
          centerId: centerId,
          centerName: getCenterDisplayName(centerId),
          branchId: centerId,
          branchName: getCenterDisplayName(centerId),
          type: type,
          timestamp: new Date().toISOString(),
          method: 'manual',
          status: 'success'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 教师考勤记录已保存:', result.data)
        
        // 创建本地记录
        const newRecord: TeacherAttendanceRecord = {
          id: Date.now().toString(),
          teacherId: teacherId,
          teacherName: teacherName,
          centerId: centerId,
          centerName: getCenterDisplayName(centerId),
          timestamp: new Date().toISOString(),
          type: type,
          status: 'success',
          method: 'manual'
        }

        setAttendanceRecords(prev => [newRecord, ...prev])
        
        if (type === 'check-in') {
          setSuccess(`${teacherName} 签到成功！`)
          setTodayStatus('checked_in')
          setCheckInTime(new Date().toISOString())
        } else {
          setSuccess(`${teacherName} 签退成功！`)
          setTodayStatus('checked_out')
          setCheckOutTime(new Date().toISOString())
        }
        
        // 刷新状态
        setTimeout(fetchTodayStatus, 1000)
      } else {
        const errorData = await response.json()
        setError(`考勤记录失败: ${errorData.error}`)
      }
    } catch (err: any) {
      setError(`考勤处理失败: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusDisplay = () => {
    switch (todayStatus) {
      case 'not_checked_in':
        return { text: '未签到', variant: 'secondary' as const, color: 'text-gray-600' }
      case 'checked_in':
        return { text: '已签到', variant: 'default' as const, color: 'text-green-600' }
      case 'checked_out':
        return { text: '已签退', variant: 'default' as const, color: 'text-blue-600' }
      default:
        return { text: '未知', variant: 'secondary' as const, color: 'text-gray-600' }
    }
  }

  const statusInfo = getStatusDisplay()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">教师打卡系统</h1>
          <p className="text-gray-600">请填写教师信息进行签到签退</p>
        </div>

        {/* 返回链接 */}
        <div className="mb-6">
          <Link href="/teacher-workspace" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <XCircle className="h-4 w-4 mr-2 rotate-45" />
            返回教师工作台
          </Link>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 教师信息输入 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                教师信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teacherId">教师ID</Label>
                <Input
                  id="teacherId"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="请输入教师ID"
                />
              </div>
              
              <div>
                <Label htmlFor="teacherName">教师姓名</Label>
                <Input
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="请输入教师姓名"
                />
              </div>

              <div>
                <Label>中心</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{getCenterDisplayName(centerId)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 考勤状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                今日考勤状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge variant={statusInfo.variant} className="text-lg px-4 py-2">
                  {statusInfo.text}
                </Badge>
              </div>

              {checkInTime && (
                <div className="text-center p-3 bg-green-50 rounded-md">
                  <div className="text-sm text-gray-600 mb-1">签到时间</div>
                  <div className="font-mono text-lg text-green-600">
                    {new Date(checkInTime).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              )}

              {checkOutTime && (
                <div className="text-center p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-600 mb-1">签退时间</div>
                  <div className="font-mono text-lg text-blue-600">
                    {new Date(checkOutTime).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 inline mr-1" />
                {new Date().toLocaleDateString('zh-CN')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 打卡操作 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              打卡操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              {todayStatus === 'not_checked_in' && (
                <Button
                  onClick={() => processAttendance('check-in')}
                  disabled={isProcessing || !teacherId || !teacherName}
                  size="lg"
                  className="px-8"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      签到
                    </>
                  )}
                </Button>
              )}

              {todayStatus === 'checked_in' && (
                <Button
                  onClick={() => processAttendance('check-out')}
                  disabled={isProcessing}
                  size="lg"
                  variant="secondary"
                  className="px-8"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 mr-2" />
                      签退
                    </>
                  )}
                </Button>
              )}

              {todayStatus === 'checked_out' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">今日考勤已完成</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 今日考勤记录 */}
        {attendanceRecords.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                今日考勤记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.teacherName}</p>
                      <p className="text-sm text-gray-500">{record.centerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default">
                          {record.type === 'check-in' ? '签到' : '签退'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {record.method === 'manual' ? '手动' : record.method}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
