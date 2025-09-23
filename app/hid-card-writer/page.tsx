'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, XCircle, CreditCard, Users, Search } from 'lucide-react'
import { Student } from '@/lib/pocketbase-students'
import HIDCardReader from '@/components/hid-reader/HIDCardReader'

interface Teacher {
  id: string
  teacher_id: string
  teacher_name: string
  name: string
  center: string
  status: string
  cardNumber?: string
}

export default function HIDCardWriter() {
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [scannedCardNumber, setScannedCardNumber] = useState<string>("")
  const [isHttps, setIsHttps] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [groupByCenter, setGroupByCenter] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  
  // HID读卡器相关状态
  const [cardInput, setCardInput] = useState("")

  // 初始化检查
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:")
      setIsOnline(navigator.onLine)
    }
    
    fetchData()
  }, [])

  // 获取学生和教师数据
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取学生数据
      const studentsResponse = await fetch('/api/students')
      const studentsData = await studentsResponse.json()
      
      if (studentsData.success) {
        setStudents(studentsData.students || [])
        console.log(`✅ 获取到 ${studentsData.students?.length || 0} 个学生数据`)
      } else {
        console.error('❌ 获取学生数据失败:', studentsData.error)
        showMessage('error', `获取学生数据失败: ${studentsData.error}`)
      }
      
      // 获取教师数据
      try {
        const teachersResponse = await fetch('/api/teachers')
        const teachersData = await teachersResponse.json()
        
        if (teachersData.success) {
          setTeachers(teachersData.teachers || [])
          console.log(`✅ 获取到 ${teachersData.teachers?.length || 0} 个教师数据`)
        } else {
          console.error('❌ 获取教师数据失败:', teachersData.error || '未知错误')
          console.error('详细错误信息:', teachersData.details || '无详细信息')
          // 不显示错误消息，只是记录日志，让页面继续工作
          console.log('⚠️ 教师数据获取失败，将使用空数组')
          setTeachers([])
        }
      } catch (teacherError) {
        console.error('❌ 教师API请求异常:', teacherError)
        console.log('⚠️ 教师数据获取异常，将使用空数组')
        setTeachers([])
      }
    } catch (error) {
      console.error('❌ 获取数据异常:', error)
      showMessage('error', '网络连接失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  // 过滤学生和教师
  const filteredStudents = students.filter(student =>
    (student.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredTeachers = teachers.filter(teacher =>
    (teacher.teacher_name || teacher.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacher_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 按中心分组学生和教师
  const groupedStudents = groupByCenter 
    ? filteredStudents.reduce((groups, student) => {
        const center = student.center || '未知中心'
        if (!groups[center]) {
          groups[center] = []
        }
        groups[center].push(student)
        return groups
      }, {} as Record<string, Student[]>)
    : { '所有学生': filteredStudents }
    
  const groupedTeachers = groupByCenter 
    ? filteredTeachers.reduce((groups, teacher) => {
        const center = teacher.center || '未知中心'
        if (!groups[center]) {
          groups[center] = []
        }
        groups[center].push(teacher)
        return groups
      }, {} as Record<string, Teacher[]>)
    : { '所有教师': filteredTeachers }

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 处理HID读卡器读取的卡号
  const handleCardRead = (cardNumber: string) => {
    setScannedCardNumber(cardNumber)
    showMessage('success', `成功读取卡号: ${cardNumber}`)
  }

  // 处理HID读卡器错误
  const handleCardError = (error: string) => {
    showMessage('error', `读卡器错误: ${error}`)
  }

  // 关联卡号与教师
  const associateCardWithTeacher = async () => {
    if (!selectedTeacher || !scannedCardNumber) {
      showMessage('error', '请先选择教师和扫描卡号')
      return
    }

    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTeacher.id,
          cardNumber: scannedCardNumber
        }),
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `成功为教师 ${selectedTeacher.teacher_name || selectedTeacher.name} 关联卡号 ${scannedCardNumber}`)
        
        // 更新本地教师数据
        setTeachers(prev => prev.map(t => 
          t.id === selectedTeacher.id 
            ? { ...t, cardNumber: scannedCardNumber }
            : t
        ))
        
        // 重置状态
        setSelectedTeacher(null)
        setScannedCardNumber("")
        setCardInput("")
      } else {
        showMessage('error', `关联失败: ${data.message}`)
      }
    } catch (error) {
      console.error('关联卡号失败:', error)
      showMessage('error', '网络连接失败，请重试')
    }
  }

  // 选择学生
  const selectStudent = (student: Student) => {
    setSelectedStudent(student)
    showMessage('success', `已选择学生: ${student.student_name}`)
  }

  // 选择教师
  const selectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    showMessage('success', `已选择教师: ${teacher.teacher_name || teacher.name}`)
  }

  // 关联卡号
  const associateCard = async () => {
    if (userType === 'student') {
      if (!selectedStudent || !scannedCardNumber) {
        showMessage('error', '请先选择学生和扫描卡号')
        return
      }

      try {
        const response = await fetch('/api/students', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            cardNumber: scannedCardNumber,
            nfc_tag_id: scannedCardNumber
          }),
        })

        const data = await response.json()

        if (data.success) {
          showMessage('success', `成功为学生 ${selectedStudent.student_name} 关联卡号 ${scannedCardNumber}`)
          
          // 更新本地学生数据
          setStudents(prev => prev.map(s => 
            s.id === selectedStudent.id 
              ? { ...s, cardNumber: scannedCardNumber, nfc_tag_id: scannedCardNumber }
              : s
          ))
          
          // 重置状态
          setSelectedStudent(null)
          setScannedCardNumber("")
          setCardInput("")
        } else {
          showMessage('error', `关联失败: ${data.message}`)
        }
      } catch (error) {
        console.error('关联卡号失败:', error)
        showMessage('error', '网络连接失败，请重试')
      }
    } else {
      // 教师关联逻辑
      await associateCardWithTeacher()
    }
  }

  // 清除状态
  const clearAll = () => {
    setSelectedStudent(null)
    setSelectedTeacher(null)
    setScannedCardNumber("")
    setCardInput("")
    showMessage('success', '已清除所有状态')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HID读卡器 - 卡号关联工具
          </h1>
          <p className="text-gray-600">
            使用HID读卡器关联NFC卡号
          </p>
        </div>

        {/* 用户类型切换 */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm font-medium text-gray-700">选择用户类型:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setUserType('student')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'student'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  学生
                </button>
                <button
                  onClick={() => setUserType('teacher')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'teacher'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  教师
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 状态检查 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={isHttps ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isHttps ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isHttps ? 'HTTPS连接' : 'HTTP连接'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className={isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isOnline ? '网络连接正常' : '网络连接异常'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className={navigator.userAgent.includes('Chrome') ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${navigator.userAgent.includes('Chrome') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">
                  {navigator.userAgent.includes('Chrome') ? 'Chrome浏览器' : '其他浏览器'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* 卡号扫描区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              HID读卡器扫描
            </CardTitle>
            <CardDescription>
              使用HID读卡器自动读取10位数字卡片，或手动输入卡号
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HID读卡器组件 */}
            <HIDCardReader
              onCardRead={handleCardRead}
              onError={handleCardError}
              placeholder="将卡片放在HID读卡器上..."
            />

            {/* 当前扫描的卡号 */}
            {scannedCardNumber && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">已扫描卡号</p>
                    <p className="text-2xl font-mono text-blue-600">{scannedCardNumber}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScannedCardNumber("")
                      setCardInput("")
                    }}
                  >
                    清除
                  </Button>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={associateCard}
                disabled={
                  (userType === 'student' && (!selectedStudent || !scannedCardNumber)) ||
                  (userType === 'teacher' && (!selectedTeacher || !scannedCardNumber))
                }
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                关联卡号
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                className="flex-1"
              >
                清除所有
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {userType === 'student' ? '学生' : '教师'}列表
            </CardTitle>
            <CardDescription>
              {scannedCardNumber ? `点击${userType === 'student' ? '学生' : '教师'}进行卡号关联` : "请先扫描NFC卡片"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              <Input
                placeholder={`搜索${userType === 'student' ? '学生' : '教师'}姓名或ID`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="groupByCenter"
                  checked={groupByCenter}
                  onChange={(e) => setGroupByCenter(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="groupByCenter" className="text-sm text-gray-600">
                  按中心分组显示
                </label>
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userType === 'student' ? (
                Object.entries(groupedStudents).map(([centerName, centerStudents]) => (
                  <div key={centerName}>
                    {groupByCenter && (
                      <div className="sticky top-0 bg-gray-100 px-3 py-2 rounded-lg mb-2">
                        <h3 className="font-medium text-gray-900">{centerName}</h3>
                        <p className="text-sm text-gray-600">
                          {centerStudents.length} 个学生
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {centerStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStudent?.id === student.id
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          } ${!scannedCardNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => scannedCardNumber && selectStudent(student)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {(student.student_name || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name}</p>
                                <p className="text-sm text-gray-500">
                                  {student.student_id} | {student.center}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {student.cardNumber ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已有卡号
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  无卡号
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                Object.entries(groupedTeachers).map(([centerName, centerTeachers]) => (
                  <div key={centerName}>
                    {groupByCenter && (
                      <div className="sticky top-0 bg-gray-100 px-3 py-2 rounded-lg mb-2">
                        <h3 className="font-medium text-gray-900">{centerName}</h3>
                        <p className="text-sm text-gray-600">
                          {centerTeachers.length} 个教师
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {centerTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTeacher?.id === teacher.id
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          } ${!scannedCardNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => scannedCardNumber && selectTeacher(teacher)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {(teacher.teacher_name || teacher.name).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{teacher.teacher_name || teacher.name}</p>
                                <p className="text-sm text-gray-500">
                                  {teacher.teacher_id} | {teacher.center}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {teacher.cardNumber ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已有卡号
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  无卡号
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {userType === 'student' ? students.length : teachers.length}
                  </p>
                  <p className="text-sm text-gray-600">总{userType === 'student' ? '学生' : '教师'}数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {userType === 'student' 
                      ? students.filter(s => s.cardNumber).length
                      : teachers.filter(t => t.cardNumber).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">已有卡号</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {userType === 'student' 
                      ? students.filter(s => !s.cardNumber).length
                      : teachers.filter(t => !t.cardNumber).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">待关联</p>
                </div>
              </div>
              
              {/* 按中心统计 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">各中心统计</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(
                    (userType === 'student' ? students : teachers).reduce((centers, user) => {
                      const center = user.center || '未知中心'
                      if (!centers[center]) {
                        centers[center] = { total: 0, withCard: 0, withoutCard: 0 }
                      }
                      centers[center].total++
                      if (user.cardNumber) {
                        centers[center].withCard++
                      } else {
                        centers[center].withoutCard++
                      }
                      return centers
                    }, {} as Record<string, {total: number, withCard: number, withoutCard: number}>)
                  ).map(([center, stats]) => (
                    <div key={center} className="bg-white p-3 rounded-lg border">
                      <h5 className="font-medium text-gray-900">{center}</h5>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>总计: {stats.total}</span>
                        <span className="text-green-600">已关联: {stats.withCard}</span>
                        <span className="text-orange-600">待关联: {stats.withoutCard}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
