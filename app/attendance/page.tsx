"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CreditCard, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Monitor,
  Smartphone,
  Settings,
  ArrowLeft,
  Search,
  Globe,
  QrCode,
  Shield,
  Zap,
  Database,
  Activity,
  Smartphone as MobileIcon,
  CreditCard as CardIcon
} from "lucide-react"
import Link from "next/link"

// 考勤记录接口
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  studentUrl?: string
  timestamp: string
  deviceInfo: string
  center: string
  type: 'checkin' | 'checkout'
  status: 'success' | 'failed'
  method: 'nfc' | 'url' | 'manual'
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

export default function AttendancePage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  
  // 页面状态
  const [activeTab, setActiveTab] = useState("nfc")
  const [isNFCSupported, setIsNFCSupported] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isHTTPS, setIsHTTPS] = useState(false)
  
  // 手动打卡相关状态
  const [showManualInput, setShowManualInput] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [isManualProcessing, setIsManualProcessing] = useState(false)
  
  // URL打卡相关状态
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [studentUrl, setStudentUrl] = useState("")
  const [isUrlProcessing, setIsUrlProcessing] = useState(false)
  
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
      
      // 调用真实的PocketBase API获取学生数据
      const response = await fetch('/api/students/list')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('获取学生数据失败:', response.statusText)
        // 如果API失败，使用备用数据
        setStudents([])
      }
    } catch (err) {
      console.error('获取学生数据失败:', err)
      setStudents([])
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
      // 使用真实的Web NFC API
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        // 开始扫描NFC
        await ndef.scan()
        
        // 监听NFC读取事件
        ndef.addEventListener('reading', async (event: any) => {
          try {
            console.log('NFC读取成功:', event)
            
            // 调用NFC API记录考勤
            const response = await fetch('/api/nfc/read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                nfcData: event,
                deviceInfo: {
                  deviceId: navigator.userAgent,
                  deviceName: `${navigator.platform} - ${window.location.hostname}`
                },
                centerId: centerId || 'unknown'
              })
            })

            if (response.ok) {
              const result = await response.json()
              if (result.success) {
                setSuccess(`${result.student.name} NFC打卡成功！`)
                
                // 添加到本地考勤记录
                const newRecord: AttendanceRecord = {
                  id: result.attendance.id,
                  studentId: result.student.studentId,
                  studentName: result.student.name,
                  studentUrl: result.student.studentUrl,
                  timestamp: result.attendance.timestamp,
                  deviceInfo: `${navigator.userAgent} - ${window.location.hostname}`,
                  center: result.student.center || centerId || 'unknown',
                  type: "checkin",
                  status: "success",
                  method: "nfc"
                }
                
                setAttendanceRecords(prev => [newRecord, ...prev])
              } else {
                setError(result.error || 'NFC打卡失败')
              }
            } else {
              const errorData = await response.json()
              setError(errorData.error || 'NFC打卡失败')
            }
          } catch (error: any) {
            setError(`处理NFC数据失败: ${error.message}`)
          } finally {
            setIsReading(false)
          }
        })

        // 监听NFC读取错误
        ndef.addEventListener('readingerror', (error: any) => {
          console.error('NFC读取错误:', error)
          setError('NFC读取失败，请重试')
          setIsReading(false)
        })

        // 设置超时
        setTimeout(() => {
          if (isReading) {
            setError('NFC读取超时，请将卡片贴近设备')
            setIsReading(false)
          }
        }, 30000) // 30秒超时
        
      } else {
        throw new Error('NDEFReader不可用')
      }
      
    } catch (err: any) {
      console.error('NFC读取失败:', err)
      setError(`NFC读取失败: ${err.message}`)
      setIsReading(false)
    }
  }

  // URL打卡功能
  const startUrlCheckIn = async () => {
    if (!studentUrl.trim()) {
      setError("请输入学生URL")
      return
    }

    setIsUrlProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      await processAttendance(studentUrl.trim(), 'url')
      setStudentUrl("")
      setShowUrlInput(false)
    } catch (err: any) {
      setError(`URL打卡失败: ${err.message}`)
    } finally {
      setIsUrlProcessing(false)
    }
  }

  // 手动输入ID打卡
  const handleManualCheckIn = async () => {
    if (!studentId.trim()) {
      setError("请输入学生ID")
      return
    }

    setIsManualProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      await processAttendance(studentId.trim(), 'manual')
      setStudentId("")
      setShowManualInput(false)
    } catch (err: any) {
      setError(`手动打卡失败: ${err.message}`)
    } finally {
      setIsManualProcessing(false)
    }
  }

  // 处理考勤
  const processAttendance = async (identifier: string, method: 'nfc' | 'url' | 'manual') => {
    try {
      let student: Student | undefined

      if (method === 'url') {
        // 通过URL查找学生
        student = students.find(s => s.studentUrl === identifier)
      } else {
        // 通过ID查找学生
        student = students.find(s => s.student_id === identifier || s.id === identifier)
      }
      
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
        studentUrl: student.studentUrl,
        timestamp: new Date().toISOString(),
        deviceInfo: `${navigator.userAgent} - ${window.location.hostname}`,
        center: centerId || '未知中心',
        type: "checkin",
        status: "success",
        method: method
      }

      // 添加到本地状态
      setAttendanceRecords(prev => [newRecord, ...prev])
      
      setSuccess(`${student.student_name} 打卡成功！(${getMethodDisplayName(method)})`)
      
      // 这里应该调用API保存到PocketBase
      console.log('考勤记录:', newRecord)
      
    } catch (err: any) {
      setError(`考勤处理失败: ${err.message}`)
    }
  }

  // 获取方法显示名称
  const getMethodDisplayName = (method: string) => {
    const methodNames = {
      'nfc': 'NFC卡片',
      'url': 'URL识别',
      'manual': '手动输入'
    }
    return methodNames[method as keyof typeof methodNames] || method
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-4">
          <Link href="/checkin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回选择
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">统一打卡系统</h1>
            <p className="text-gray-600">多方式打卡 - 实时数据同步 - 支持NFC、URL、手动输入</p>
            {centerId && (
              <p className="text-sm text-gray-500">中心: {getCenterDisplayName(centerId)}</p>
            )}
          </div>
        </div>

        {/* 系统状态概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">协议状态</span>
              </div>
              <div className="mt-2">
                <Badge variant={isHTTPS ? 'default' : 'secondary'}>
                  {isHTTPS ? 'HTTPS' : 'HTTP'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">网络连接</span>
              </div>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已连接
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">NFC支持</span>
              </div>
              <div className="mt-2">
                {isNFCSupported ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已支持
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    不支持
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">今日打卡</span>
              </div>
              <div className="mt-2">
                <Badge variant="default" className="bg-orange-100 text-orange-800">
                  {attendanceRecords.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 打卡方式选择 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="nfc" className="flex items-center gap-2">
              <CardIcon className="h-4 w-4" />
              NFC卡片打卡
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL识别打卡
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              手动输入打卡
            </TabsTrigger>
          </TabsList>

          {/* NFC打卡标签页 */}
          <TabsContent value="nfc" className="mt-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <QrCode className="h-6 w-6" />
                  NFC考勤打卡
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button 
                    onClick={startNFCReading}
                    disabled={!isNFCSupported || !isHTTPS || isReading}
                    className="w-full h-20 text-xl font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isReading ? (
                      <>
                        <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
                        正在读取NFC...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-6 w-6 mr-3" />
                        将NFC卡片贴近设备
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-green-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>确保设备支持NFC功能</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>使用HTTPS协议访问页面</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>将学生NFC卡片贴近设备</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* URL打卡标签页 */}
          <TabsContent value="url" className="mt-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Globe className="h-6 w-6" />
                  URL识别打卡
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="studentUrl" className="text-sm font-medium text-blue-700">
                    学生专属URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="studentUrl"
                      placeholder="输入学生专属URL..."
                      value={studentUrl}
                      onChange={(e) => setStudentUrl(e.target.value)}
                      className="text-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          startUrlCheckIn()
                        }
                      }}
                    />
                    <Button 
                      onClick={startUrlCheckIn}
                      disabled={!studentUrl.trim() || isUrlProcessing}
                      className="px-6"
                    >
                      {isUrlProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          处理中
                        </>
                      ) : (
                        '确认打卡'
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>输入学生的专属URL进行打卡</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>系统自动识别学生身份</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>支持移动端和桌面端</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 手动输入标签页 */}
          <TabsContent value="manual" className="mt-6">
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <User className="h-6 w-6" />
                  手动输入打卡
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="studentId" className="text-sm font-medium text-purple-700">
                    学生ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="请输入学生ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="text-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleManualCheckIn()
                        }
                      }}
                      disabled={isManualProcessing}
                    />
                    <Button 
                      onClick={handleManualCheckIn}
                      disabled={isManualProcessing || !studentId.trim()}
                      className="px-6"
                    >
                      {isManualProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          处理中
                        </>
                      ) : (
                        '确认打卡'
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-purple-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>手动输入学生ID进行打卡</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>适用于临时打卡或系统故障时</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>支持回车键快速确认</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.studentName}</p>
                      <p className="text-sm text-gray-600">{record.studentId}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default">
                          {record.type === 'checkin' ? '签到' : '签退'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getMethodDisplayName(record.method)}
                        </Badge>
                      </div>
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

        {/* 系统信息 */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Database className="h-5 w-5" />
              系统信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>中心:</span>
                  <span className="font-medium">{getCenterDisplayName(centerId)}</span>
                </div>
                <div className="flex justify-between">
                  <span>协议:</span>
                  <span className="font-mono">{window.location.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span>主机:</span>
                  <span className="font-mono">{window.location.hostname}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>NFC支持:</span>
                  <span className="font-medium">{isNFCSupported ? '支持' : '不支持'}</span>
                </div>
                <div className="flex justify-between">
                  <span>HTTPS状态:</span>
                  <span className="font-medium">{isHTTPS ? '启用' : '未启用'}</span>
                </div>
                <div className="flex justify-between">
                  <span>数据库:</span>
                  <span className="font-medium">PocketBase</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能说明 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Settings className="h-5 w-5" />
              功能说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">NFC卡片打卡</h4>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>需要HTTPS环境</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>设备需支持NFC</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">URL识别打卡</h4>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>输入学生专属URL</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>自动识别学生身份</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">手动输入打卡</h4>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>输入学生ID</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>备用打卡方式</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
