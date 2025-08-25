"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CreditCard, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Settings,
  ArrowLeft,
  Search,
  Globe,
  QrCode,
  Shield,
  Zap,
  Database,
  Activity
} from "lucide-react"
import Link from "next/link"

// 考勤记录接口
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  studentUrl: string
  timestamp: string
  deviceInfo: string
  center: string
  type: 'checkin' | 'checkout'
  status: 'success' | 'failed'
}

// 学生信息接口
interface Student {
  id: string
  student_id?: string
  student_name?: string
  studentUrl?: string
  center?: string
  status?: string
}

export default function MobileCheckinPage() {
  const params = useParams()
  const centerId = params.center as string
  
  // 页面状态
  const [isNFCSupported, setIsNFCSupported] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isHTTPS, setIsHTTPS] = useState(false)
  
  // 手动打卡相关状态
  const [showManualInput, setShowManualInput] = useState(false)
  const [studentUrl, setStudentUrl] = useState("")
  const [isManualProcessing, setIsManualProcessing] = useState(false)
  
  // 考勤记录状态
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  // 检查HTTPS和NFC支持
  useEffect(() => {
    // 检查HTTPS
    setIsHTTPS(window.location.protocol === 'https:')
    
    // 检查NFC支持
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNFCSupported(true)
    }
  }, [])

  // 获取学生数据
  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      // 这里应该调用API获取学生数据
      // 暂时使用模拟数据
      const mockStudents: Student[] = [
        {
          id: "1",
          student_id: "ST001",
          student_name: "张三",
          studentUrl: "https://center1.com/B1",
          center: "WX 01",
          status: "active"
        },
        {
          id: "2",
          student_id: "ST002",
          student_name: "李四",
          studentUrl: "https://center1.com/B2",
          center: "WX 01",
          status: "active"
        }
      ]
      setStudents(mockStudents)
    } catch (err) {
      console.error('获取学生数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // NFC读取功能
  const startNFCReading = async () => {
    if (!isHTTPS) {
      setError("NFC功能需要HTTPS环境，当前页面使用HTTP协议")
      return
    }

    if (!isNFCSupported) {
      setError("当前设备不支持NFC功能")
      return
    }

    setIsReading(true)
    setError(null)
    setSuccess(null)

    try {
      // 这里应该实现真实的NFC读取
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟读取到的URL
      const mockUrl = "https://center1.com/B1"
      await processAttendance(mockUrl)
      
    } catch (err: any) {
      setError(`NFC读取失败: ${err.message}`)
    } finally {
      setIsReading(false)
    }
  }

  // 处理考勤
  const processAttendance = async (url: string) => {
    try {
      // 通过URL查找学生
      const student = students.find(s => s.studentUrl === url)
      
      if (!student) {
        setError("未找到对应的学生信息")
        return
      }

      if (student.status !== 'active') {
        setError(`学生 ${student.student_name} 状态异常: ${student.status}`)
        return
      }

      // 创建考勤记录
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        studentId: student.student_id || student.id,
        studentName: student.student_name || '未知学生',
        studentUrl: url,
        timestamp: new Date().toISOString(),
        deviceInfo: `${navigator.userAgent} - ${window.location.hostname}`,
        center: centerId,
        type: "checkin",
        status: "success",
      }

      // 添加到本地状态
      setAttendanceRecords(prev => [newRecord, ...prev])
      
      setSuccess(`${student.student_name} 打卡成功！`)
      
      // 这里应该调用API保存到PocketBase
      console.log('考勤记录:', newRecord)
      
    } catch (err: any) {
      setError(`考勤处理失败: ${err.message}`)
    }
  }

  // 手动输入URL打卡
  const handleManualCheckIn = async () => {
    if (!studentUrl.trim()) {
      setError("请输入学生URL")
      return
    }

    setIsManualProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      await processAttendance(studentUrl.trim())
      setStudentUrl("")
      setShowManualInput(false)
    } catch (err: any) {
      setError(`手动打卡失败: ${err.message}`)
    } finally {
      setIsManualProcessing(false)
    }
  }

  // 获取中心显示名称
  const getCenterDisplayName = (centerId: string) => {
    const centerNames: { [key: string]: string } = {
      'wx01': 'WX 01',
      'wx02': 'WX 02',
      'wx03': 'WX 03',
      'wx04': 'WX 04'
    }
    return centerNames[centerId.toLowerCase()] || centerId
  }

  // 获取设备信息
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5" />
            <span>返回首页</span>
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getCenterDisplayName(centerId)} 考勤打卡
          </h1>
          <p className="text-gray-600 text-sm">
            移动端NFC考勤系统
          </p>
        </div>

        {/* 系统状态指示器 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">系统状态</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isHTTPS ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {isHTTPS ? 'HTTPS' : 'HTTP'}
                </span>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">NFC支持:</span>
                <Badge variant={isNFCSupported ? 'default' : 'secondary'}>
                  {isNFCSupported ? '支持' : '不支持'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">设备:</span>
                <span className="text-gray-800">{navigator.platform}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">网络:</span>
                <Badge variant={navigator.onLine ? 'default' : 'secondary'}>
                  {navigator.onLine ? '在线' : '离线'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主要打卡区域 */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2 text-green-800">
              <QrCode className="h-6 w-6" />
              NFC考勤打卡
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NFC打卡按钮 */}
            <Button 
              onClick={startNFCReading}
              disabled={!isNFCSupported || !isHTTPS || isReading}
              className="w-full h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isReading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  正在读取NFC...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  将NFC卡片贴近手机
                </>
              )}
            </Button>

            {/* 手动输入选项 */}
            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-sm"
              >
                {showManualInput ? '隐藏' : '手动输入URL'}
              </Button>
            </div>

            {/* 手动输入区域 */}
            {showManualInput && (
              <div className="space-y-3 p-3 bg-white rounded-lg border">
                <Label htmlFor="studentUrl" className="text-sm font-medium text-gray-700">
                  学生专属URL
                </Label>
                <Input
                  id="studentUrl"
                  placeholder="输入学生专属URL..."
                  value={studentUrl}
                  onChange={(e) => setStudentUrl(e.target.value)}
                  className="text-sm"
                />
                <Button 
                  onClick={handleManualCheckIn}
                  disabled={!studentUrl.trim() || isManualProcessing}
                  className="w-full"
                >
                  {isManualProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    '确认打卡'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 状态显示 */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 考勤记录 */}
        {attendanceRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                今日考勤记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.studentName}</p>
                      <p className="text-sm text-gray-600">{record.studentId}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-1">
                        {record.type === 'checkin' ? '签到' : '签退'}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
              <Settings className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>确保手机支持NFC功能</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>使用HTTPS协议访问页面</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>将学生NFC卡片贴近手机背面</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>系统自动读取卡片中的URL并识别学生</p>
            </div>
          </CardContent>
        </Card>

        {/* 技术信息 */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
              <Database className="h-5 w-5" />
              技术信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>协议:</span>
              <span className="font-mono">{window.location.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span>主机:</span>
              <span className="font-mono">{window.location.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span>端口:</span>
              <span className="font-mono">{window.location.port || '80/443'}</span>
            </div>
            <div className="flex justify-between">
              <span>用户代理:</span>
              <span className="font-mono text-xs truncate max-w-32">
                {navigator.userAgent.substring(0, 30)}...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
