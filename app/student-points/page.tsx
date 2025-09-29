'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  User, 
  Search,
  Loader2,
  AlertCircle,
  Star,
  Trophy,
  Award,
  Calendar,
  Clock
} from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { usePoints } from '@/hooks/usePoints'
import { StudentPoints, PointTransaction } from '@/types/points'
import PageLayout from '@/components/layouts/PageLayout'

export default function StudentPointsPage() {
  const searchParams = useSearchParams()
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showQueryForm, setShowQueryForm] = useState(true)
  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const { students, loading: studentsLoading } = useStudents()
  const { getStudentPoints } = usePoints()

  // 获取学生积分数据
  const fetchStudentPoints = async (studentId: string) => {
    setPointsLoading(true)
    try {
      const data = await getStudentPoints(studentId)
      setStudentPoints(data.student_points)
      setPointTransactions(data.transactions?.items || [])
    } catch (err) {
      console.error('获取学生积分失败:', err)
      setError('获取积分数据失败')
    } finally {
      setPointsLoading(false)
    }
  }

  // 检查URL参数中是否有卡号
  useEffect(() => {
    const urlCardNumber = searchParams.get('card') || searchParams.get('cardNumber')
    if (urlCardNumber) {
      setCardNumber(urlCardNumber)
      // 自动查找学生
      const student = students.find(s => 
        s.cardNumber === urlCardNumber || 
        s.student_id === urlCardNumber ||
        (s.student_name && s.student_name.toLowerCase().includes(urlCardNumber.toLowerCase()))
      )
      if (student) {
        setSelectedStudent(student)
        setShowQueryForm(false)
        setError(null)
        // 获取学生积分数据
        fetchStudentPoints(student.id)
      } else {
        setError('未找到对应的学生信息')
      }
    }
  }, [searchParams, students])

  const handleCardNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber.trim()) {
      setError('请输入学生卡号、学号或姓名')
      return
    }
    
    // 检查卡号、学号或姓名是否存在
    const student = students.find(s => 
      s.cardNumber === cardNumber.trim() || 
      s.student_id === cardNumber.trim() ||
      (s.student_name && s.student_name.toLowerCase().includes(cardNumber.trim().toLowerCase()))
    )
    if (!student) {
      setError('未找到对应的学生信息')
      return
    }
    
    // 直接显示学生积分信息
    setSelectedStudent(student)
    setShowQueryForm(false)
    setError(null)
    // 获取学生积分数据
    fetchStudentPoints(student.id)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(e.target.value)
    if (error) setError(null)
  }

  const handleBackToQuery = () => {
    setSelectedStudent(null)
    setShowQueryForm(true)
    setCardNumber('')
    setError(null)
    setStudentPoints(null)
    setPointTransactions([])
  }

  if (studentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果找到了学生，显示积分信息
  if (selectedStudent && !showQueryForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToQuery}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              返回查询
            </Button>
          </div>

          {/* 学生积分信息 */}
          <div className="grid gap-6">
            {/* 学生基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  学生信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedStudent.student_name}</h3>
                    <p className="text-gray-600">学号: {selectedStudent.student_id}</p>
                    <p className="text-gray-600">中心: {selectedStudent.center}</p>
                    <p className="text-gray-600">年级: {selectedStudent.standard || '未设置'}</p>
                  </div>
                  <div>
                    {selectedStudent.cardNumber && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">NFC卡号: {selectedStudent.cardNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                        {selectedStudent.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 积分统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">当前积分</p>
                      {pointsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      ) : (
                        <p className="text-2xl font-bold text-blue-600">
                          {studentPoints?.current_points || 0}
                        </p>
                      )}
                    </div>
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总获得积分</p>
                      {pointsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                      ) : (
                        <p className="text-2xl font-bold text-green-600">
                          {studentPoints?.total_earned || 0}
                        </p>
                      )}
                    </div>
                    <Trophy className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总消费积分</p>
                      {pointsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                      ) : (
                        <p className="text-2xl font-bold text-orange-600">
                          {studentPoints?.total_spent || 0}
                        </p>
                      )}
                    </div>
                    <Award className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 积分历史 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  积分历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pointsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>加载积分历史中...</span>
                  </div>
                ) : pointTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {pointTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${transaction.transaction_type === 'add_points' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">{transaction.reason}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.created).toLocaleDateString('zh-CN')} {new Date(transaction.created).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {transaction.expand?.teacher_id && (
                              <p className="text-xs text-gray-400">
                                操作教师: {transaction.expand.teacher_id.teacher_name || transaction.expand.teacher_id.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`font-semibold ${transaction.transaction_type === 'add_points' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transaction_type === 'add_points' ? '+' : ''}{transaction.points_change}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无积分记录</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 赛季信息 */}
            {studentPoints && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    积分赛季信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">赛季编号</p>
                      <p className="text-lg font-semibold">第 {studentPoints.season_number} 赛季</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">赛季时间</p>
                      <p className="text-sm">
                        {new Date(studentPoints.season_start_date).toLocaleDateString('zh-CN')} - {new Date(studentPoints.season_end_date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 显示查询表单
  return (
    <PageLayout
      title="学生积分查询"
      description="请输入学生NFC卡号、学号或姓名查询积分信息"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              学生积分查询
            </CardTitle>
            <CardDescription>
              请输入学生NFC卡号、学号或姓名查询积分信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCardNumberSubmit} className="space-y-4">
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  学生信息
                </label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="请输入学生NFC卡号、学号或姓名"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="text-center text-lg"
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !cardNumber.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    查询积分
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">或者</p>
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">将学生NFC卡靠近设备</p>
                <p className="text-sm text-gray-500">
                  系统会自动识别学生信息并显示积分页面
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 学生列表（用于测试） */}
        {students.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">学生列表（点击选择）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {students.slice(0, 10).map((student) => (
                  <div 
                    key={student.id} 
                    className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setCardNumber(student.student_id || '')}
                  >
                    <div>
                      <p className="font-medium text-sm">{student.student_name}</p>
                      <p className="text-xs text-gray-500">学号: {student.student_id}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {student.cardNumber ? `卡号: ${student.cardNumber}` : '无卡号'}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                点击学生卡片可自动填入学号，也可以输入姓名搜索
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
