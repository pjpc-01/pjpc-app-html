"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity,
  Calendar,
  MapPin,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import SilentWiFiVerification from "@/components/smart/SilentWiFiVerification"
import TeacherNFCScanner from "@/components/smart/TeacherNFCScanner"

interface Teacher {
  id: string
  name: string
  email: string
  nfc_card_number: string
  position: string
  department: string
  status: string
}

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
  
  // WiFi验证状态（后台静默验证）
  const [isWiFiVerified, setIsWiFiVerified] = useState<boolean | null>(null)
  const [wifiNetworkInfo, setWifiNetworkInfo] = useState<any>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  
  // NFC扫描状态
  const [showNFCScanner, setShowNFCScanner] = useState(false)
  const [scannedTeacher, setScannedTeacher] = useState<Teacher | null>(null)

  // WiFi验证处理回调
  const handleWiFiVerification = (isVerified: boolean, networkInfo?: any) => {
    setIsWiFiVerified(isVerified)
    setWifiNetworkInfo(networkInfo)
    
    console.log('WiFi验证结果:', {
      isVerified,
      networkInfo,
      timestamp: new Date().toISOString()
    })
  }

  // NFC扫描处理 - 直接进行考勤
  const handleTeacherFound = async (teacher: Teacher) => {
    setScannedTeacher(teacher)
    setTeacherId(teacher.id)
    setTeacherName(teacher.name)
    setShowNFCScanner(false)
    
    // 直接执行考勤，无需额外步骤
    try {
      if (todayStatus === 'not_checked_in') {
        await processAttendance('check-in')
      } else if (todayStatus === 'checked_in') {
        await processAttendance('check-out')
      } else {
        setSuccess(`教师 ${teacher.name} 今日考勤已完成`)
      }
    } catch (error) {
      console.error('NFC考勤失败:', error)
    }
  }

  const handleNFCError = (error: string) => {
    setError(error)
  }

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

    // WiFi验证逻辑：NFC考勤需要严格验证
    if (isWiFiVerified === false) {
      setError('网络环境不符合要求，无法进行考勤操作')
      return
    }

    // 如果WiFi验证状态未知，等待验证完成
    if (isWiFiVerified === null) {
      setError('正在验证网络环境，请稍后再试')
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
          method: scannedTeacher ? 'nfc' : 'manual',
          status: 'success',
          wifiNetwork: wifiNetworkInfo?.ssid || '未知网络',
          wifiVerified: isWiFiVerified,
          networkInfo: wifiNetworkInfo
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
          method: scannedTeacher ? 'nfc' : 'manual'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">教师NFC考勤系统</h1>
          <p className="text-gray-600">扫描NFC卡快速完成考勤</p>
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


        {/* NFC考勤区域 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              NFC考勤
            </CardTitle>
            <CardDescription>
              将教师NFC卡靠近设备进行考勤
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Button
                onClick={() => setShowNFCScanner(true)}
                size="lg"
                className="px-8 py-4 text-lg"
              >
                <CreditCard className="h-6 w-6 mr-3" />
                扫描教师NFC卡
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                支持签到和签退，系统会自动识别考勤类型
              </p>
            </div>

            {/* 扫描的教师信息显示 */}
            {scannedTeacher && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">NFC扫描成功</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                  <div>
                    <p><strong>教师:</strong> {scannedTeacher.name}</p>
                    <p><strong>职位:</strong> {scannedTeacher.position}</p>
                  </div>
                  <div>
                    <p><strong>部门:</strong> {scannedTeacher.department}</p>
                    <p><strong>邮箱:</strong> {scannedTeacher.email}</p>
                  </div>
                  <div>
                    <p><strong>中心:</strong> {getCenterDisplayName(centerId)}</p>
                    <p><strong>状态:</strong> {scannedTeacher.status}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 考勤状态 */}
        <Card className="mt-6">
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

        {/* 打卡操作 */}

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

      {/* 静默WiFi验证组件 */}
      <SilentWiFiVerification
        onWiFiVerified={handleWiFiVerification}
        centerId={centerId}
      />

      {/* NFC扫描模态框 */}
      {showNFCScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <TeacherNFCScanner
              onTeacherFound={handleTeacherFound}
              onError={handleNFCError}
              centerId={centerId}
            />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowNFCScanner(false)}
                variant="outline"
                className="w-full"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
