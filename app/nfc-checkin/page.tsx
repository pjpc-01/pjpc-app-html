"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  GraduationCap,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity,
  Calendar,
  MapPin,
  Smartphone
} from "lucide-react"
import Link from "next/link"

interface ParsedUrlData {
  studentId?: string | null
  studentName?: string | null
  teacherId?: string | null
  teacherName?: string | null
  centerId?: string | null
  type?: string | null
  method?: string | null
}

export default function NFCCheckinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const nfcUrl = searchParams.get('url')
  const centerId = searchParams.get('center') || 'wx01'
  
  // 页面状态
  const [parsedData, setParsedData] = useState<ParsedUrlData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userType, setUserType] = useState<'student' | 'teacher' | 'unknown'>('unknown')

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

  // 解析NFC URL
  useEffect(() => {
    if (nfcUrl) {
      parseNFCUrl(nfcUrl)
    }
  }, [nfcUrl])

  const parseNFCUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams(urlObj.search)
      
      const data: ParsedUrlData = {
        studentId: params.get('student_id') || params.get('id'),
        studentName: params.get('student_name') || params.get('name'),
        teacherId: params.get('teacher_id'),
        teacherName: params.get('teacher_name'),
        centerId: params.get('center') || params.get('center_id') || centerId,
        type: params.get('type') || 'check-in',
        method: params.get('method') || 'nfc'
      }
      
      setParsedData(data)
      
      // 判断用户类型
      if (data.studentId || data.studentName) {
        setUserType('student')
      } else if (data.teacherId || data.teacherName) {
        setUserType('teacher')
      } else {
        setUserType('unknown')
      }
      
      console.log('✅ NFC URL解析成功:', data)
    } catch (error) {
      console.error('❌ NFC URL解析失败:', error)
      setError('NFC URL格式错误，无法解析')
    }
  }

  // 自动跳转到相应页面
  const autoRedirect = () => {
    if (!parsedData) return
    
    if (userType === 'student') {
      // 跳转到学生考勤页面
      const studentUrl = `/attendance?center=${parsedData.centerId}&student=${parsedData.studentId || parsedData.studentName}`
      router.push(studentUrl)
    } else if (userType === 'teacher') {
      // 跳转到教师考勤页面
      const teacherUrl = `/teacher-checkin?center=${parsedData.centerId}&teacherId=${parsedData.teacherId}&teacherName=${parsedData.teacherName}`
      router.push(teacherUrl)
    }
  }

  // 手动选择页面
  const goToStudentPage = () => {
    router.push(`/attendance?center=${parsedData?.centerId || centerId}`)
  }

  const goToTeacherPage = () => {
    router.push(`/teacher-checkin?center=${parsedData?.centerId || centerId}`)
  }

  if (!nfcUrl) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">NFC打卡系统</h1>
            <p className="text-gray-600">请使用NFC卡片或设备进行打卡</p>
            <div className="mt-6 space-x-4">
              <Button onClick={goToStudentPage} variant="default">
                <User className="h-4 w-4 mr-2" />
                学生打卡
              </Button>
              <Button onClick={goToTeacherPage} variant="outline">
                <GraduationCap className="h-4 w-4 mr-2" />
                教师打卡
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <Smartphone className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NFC打卡识别</h1>
          <p className="text-gray-600">系统已识别您的NFC信息，正在处理...</p>
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

        {/* NFC信息显示 */}
        {parsedData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                NFC信息识别结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={userType === 'student' ? 'default' : userType === 'teacher' ? 'secondary' : 'outline'}>
                      {userType === 'student' ? '学生' : userType === 'teacher' ? '教师' : '未知'}
                    </Badge>
                    <span className="text-sm text-gray-600">用户类型</span>
                  </div>
                  
                  {parsedData.studentId && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">学生ID:</span>
                      <span className="ml-2 font-mono">{parsedData.studentId}</span>
                    </div>
                  )}
                  
                  {parsedData.studentName && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">学生姓名:</span>
                      <span className="ml-2">{parsedData.studentName}</span>
                    </div>
                  )}
                  
                  {parsedData.teacherId && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">教师ID:</span>
                      <span className="ml-2 font-mono">{parsedData.teacherId}</span>
                    </div>
                  )}
                  
                  {parsedData.teacherName && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">教师姓名:</span>
                      <span className="ml-2">{parsedData.teacherName}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">中心:</span>
                    <span className="ml-2">{getCenterDisplayName(parsedData.centerId)}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">打卡类型:</span>
                    <span className="ml-2">{parsedData.type === 'check-in' ? '签到' : '签退'}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">打卡方式:</span>
                    <span className="ml-2">{parsedData.method === 'nfc' ? 'NFC卡片' : parsedData.method}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">识别时间:</span>
                    <span className="ml-2">{new Date().toLocaleTimeString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="text-center space-y-4">
          {userType === 'student' && (
            <div>
              <Button onClick={autoRedirect} size="lg" className="px-8">
                <User className="h-5 w-5 mr-2" />
                自动跳转学生打卡页面
              </Button>
              <p className="text-sm text-gray-600 mt-2">系统将自动跳转到学生考勤页面</p>
            </div>
          )}
          
          {userType === 'teacher' && (
            <div>
              <Button onClick={autoRedirect} size="lg" className="px-8">
                <GraduationCap className="h-5 w-5 mr-2" />
                自动跳转教师打卡页面
              </Button>
              <p className="text-sm text-gray-600 mt-2">系统将自动跳转到教师考勤页面</p>
            </div>
          )}
          
          {userType === 'unknown' && (
            <div className="space-y-4">
              <p className="text-red-600">无法识别用户类型，请手动选择</p>
              <div className="space-x-4">
                <Button onClick={goToStudentPage} variant="default">
                  <User className="h-4 w-4 mr-2" />
                  学生打卡
                </Button>
                <Button onClick={goToTeacherPage} variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  教师打卡
                </Button>
              </div>
            </div>
          )}
          
          <div className="pt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

