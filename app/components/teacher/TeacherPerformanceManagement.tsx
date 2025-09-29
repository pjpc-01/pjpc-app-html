"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { 
  Star, 
  TrendingUp, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  PieChart,
  Target,
  Award,
  CheckCircle,
  Clock,
  Search,
  Filter
} from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { formatDate } from "@/lib/utils"

// Types
interface TeacherPerformanceEvaluation {
  id: string
  teacher_id: string
  evaluation_period: string
  year: number
  quarter: number
  evaluator_id: string
  teaching_quality: number
  student_satisfaction: number
  attendance_score: number
  punctuality_score: number
  teamwork_score: number
  communication_score: number
  overall_score: number
  strengths: string[]
  areas_for_improvement: string[]
  goals_next_period: string[]
  recommendations: string[]
  status: 'draft' | 'submitted' | 'reviewed' | 'finalized'
  evaluation_date: string
  review_date?: string
  notes?: string
  expand?: {
    teacher_id: {
      name: string
      email: string
    }
    evaluator_id: {
      name: string
      email: string
    }
  }
}

interface Teacher {
  id: string
  name: string
  email: string
  department?: string
  position?: string
}

export default function TeacherPerformanceManagement() {
  const { userProfile } = useAuth()
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [evaluations, setEvaluations] = useState<TeacherPerformanceEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState<TeacherPerformanceEvaluation | null>(null)
  
  // Form states
  const [evaluationForm, setEvaluationForm] = useState({
    teacher_id: '',
    evaluation_period: '',
    year: new Date().getFullYear(),
    quarter: 1,
    teaching_quality: 5,
    student_satisfaction: 5,
    attendance_score: 5,
    punctuality_score: 5,
    teamwork_score: 5,
    communication_score: 5,
    strengths: [] as string[],
    areas_for_improvement: [] as string[],
    goals_next_period: [] as string[],
    recommendations: [] as string[],
    notes: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    teacher_id: '',
    year: new Date().getFullYear(),
    quarter: '',
    status: ''
  })

  // 数据获取
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/teachers')
      const result = await response.json()
      if (result.success && result.data && Array.isArray(result.data.items)) {
        setTeachers(result.data.items)
      } else {
        console.error('获取教师列表失败:', result.error || '数据格式错误')
        setTeachers([])
      }
    } catch (error) {
      console.error('获取教师列表失败:', error)
      setTeachers([])
    }
  }, [])

  const fetchEvaluations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.teacher_id && filters.teacher_id !== 'all') params.append('teacher_id', filters.teacher_id)
      if (filters.year) params.append('year', filters.year.toString())
      if (filters.quarter && filters.quarter !== 'all') params.append('quarter', filters.quarter)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      
      const response = await fetch(`/api/teacher-performance?${params}`)
      const result = await response.json()
      if (result.success) {
        setEvaluations(result.data)
      }
    } catch (error) {
      console.error('获取绩效评估失败:', error)
      setError('获取绩效评估失败')
    }
  }, [filters])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchTeachers(),
        fetchEvaluations()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchTeachers, fetchEvaluations])

  // 计算总分
  const calculateOverallScore = useCallback((scores: {
    teaching_quality: number
    student_satisfaction: number
    attendance_score: number
    punctuality_score: number
    teamwork_score: number
    communication_score: number
  }) => {
    return Math.round(
      (scores.teaching_quality + scores.student_satisfaction + scores.attendance_score + 
       scores.punctuality_score + scores.teamwork_score + scores.communication_score) / 6
    )
  }, [])

  // 处理绩效评估表单
  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const overallScore = calculateOverallScore({
        teaching_quality: evaluationForm.teaching_quality,
        student_satisfaction: evaluationForm.student_satisfaction,
        attendance_score: evaluationForm.attendance_score,
        punctuality_score: evaluationForm.punctuality_score,
        teamwork_score: evaluationForm.teamwork_score,
        communication_score: evaluationForm.communication_score
      })

      const response = await fetch('/api/teacher-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...evaluationForm,
          evaluator_id: userProfile?.id,
          overall_score: overallScore
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setEvaluationDialogOpen(false)
        setEvaluationForm({
          teacher_id: '',
          evaluation_period: '',
          year: new Date().getFullYear(),
          quarter: 1,
          teaching_quality: 5,
          student_satisfaction: 5,
          attendance_score: 5,
          punctuality_score: 5,
          teamwork_score: 5,
          communication_score: 5,
          strengths: [],
          areas_for_improvement: [],
          goals_next_period: [],
          recommendations: [],
          notes: ''
        })
        fetchEvaluations()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('创建绩效评估失败')
    }
  }

  // 统计数据
  const stats = useMemo(() => {
    const totalEvaluations = evaluations.length
    const draftEvaluations = evaluations.filter(evaluation => evaluation.status === 'draft').length
    const submittedEvaluations = evaluations.filter(evaluation => evaluation.status === 'submitted').length
    const reviewedEvaluations = evaluations.filter(evaluation => evaluation.status === 'reviewed').length
    const finalizedEvaluations = evaluations.filter(evaluation => evaluation.status === 'finalized').length
    
    const averageScore = totalEvaluations > 0 
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / totalEvaluations 
      : 0
    
    const scoreDistribution = evaluations.reduce((acc, evaluation) => {
      const range = Math.floor(evaluation.overall_score / 2) * 2
      acc[range] = (acc[range] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalEvaluations,
      draftEvaluations,
      submittedEvaluations,
      reviewedEvaluations,
      finalizedEvaluations,
      averageScore,
      scoreDistribution
    }
  }, [evaluations])

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'reviewed': 'bg-yellow-100 text-yellow-800',
      'finalized': 'bg-green-100 text-green-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  // 获取状态中文名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'submitted': '已提交',
      'reviewed': '已审核',
      'finalized': '已确认'
    }
    return statusMap[status] || status
  }

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 9) return { level: '优秀', color: 'text-green-600' }
    if (score >= 7) return { level: '良好', color: 'text-blue-600' }
    if (score >= 5) return { level: '一般', color: 'text-yellow-600' }
    return { level: '需改进', color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">教师绩效评估</h1>
          <p className="text-gray-600">管理教师绩效评估和考核记录</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEvaluationDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建绩效评估
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总评估数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均评分</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已确认</p>
                <p className="text-2xl font-bold text-gray-900">{stats.finalizedEvaluations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待审核</p>
                <p className="text-2xl font-bold text-gray-900">{stats.submittedEvaluations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="teacher_filter">教师</Label>
              <Select value={filters.teacher_id} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, teacher_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择教师" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部教师</SelectItem>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year_filter">年份</Label>
              <Input
                id="year_filter"
                type="number"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  year: parseInt(e.target.value) || new Date().getFullYear() 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="quarter_filter">季度</Label>
              <Select value={filters.quarter} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, quarter: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择季度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部季度</SelectItem>
                  <SelectItem value="1">第一季度</SelectItem>
                  <SelectItem value="2">第二季度</SelectItem>
                  <SelectItem value="3">第三季度</SelectItem>
                  <SelectItem value="4">第四季度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status_filter">状态</Label>
              <Select value={filters.status} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="submitted">已提交</SelectItem>
                  <SelectItem value="reviewed">已审核</SelectItem>
                  <SelectItem value="finalized">已确认</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 绩效评估列表 */}
      <Card>
        <CardHeader>
          <CardTitle>绩效评估列表</CardTitle>
          <CardDescription>查看和管理教师的绩效评估记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教师</TableHead>
                <TableHead>评估期间</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>评估日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation) => {
                const scoreLevel = getScoreLevel(evaluation.overall_score)
                return (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{evaluation.expand?.teacher_id?.name}</p>
                        <p className="text-sm text-gray-500">{evaluation.expand?.teacher_id?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{evaluation.year}年Q{evaluation.quarter}</p>
                        <p className="text-sm text-gray-500">{evaluation.evaluation_period}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-bold text-lg">{evaluation.overall_score}</span>
                        <span className="text-sm text-gray-500 ml-1">/10</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${scoreLevel.color} bg-opacity-20`}>
                        {scoreLevel.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(evaluation.status)}>
                        {getStatusName(evaluation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 绩效评估对话框 */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建绩效评估</DialogTitle>
            <DialogDescription>对教师进行全面的绩效评估</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEvaluationSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacher_id">选择教师</Label>
                <Select value={evaluationForm.teacher_id} onValueChange={(value) => 
                  setEvaluationForm(prev => ({ ...prev, teacher_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="evaluation_period">评估期间</Label>
                <Input
                  id="evaluation_period"
                  value={evaluationForm.evaluation_period}
                  onChange={(e) => setEvaluationForm(prev => ({ 
                    ...prev, 
                    evaluation_period: e.target.value 
                  }))}
                  placeholder="例如：2024年第一季度"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">年份</Label>
                <Input
                  id="year"
                  type="number"
                  value={evaluationForm.year}
                  onChange={(e) => setEvaluationForm(prev => ({ 
                    ...prev, 
                    year: parseInt(e.target.value) || new Date().getFullYear() 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="quarter">季度</Label>
                <Select value={evaluationForm.quarter.toString()} onValueChange={(value) => 
                  setEvaluationForm(prev => ({ ...prev, quarter: parseInt(value) }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">第一季度</SelectItem>
                    <SelectItem value="2">第二季度</SelectItem>
                    <SelectItem value="3">第三季度</SelectItem>
                    <SelectItem value="4">第四季度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">总分</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculateOverallScore({
                      teaching_quality: evaluationForm.teaching_quality,
                      student_satisfaction: evaluationForm.student_satisfaction,
                      attendance_score: evaluationForm.attendance_score,
                      punctuality_score: evaluationForm.punctuality_score,
                      teamwork_score: evaluationForm.teamwork_score,
                      communication_score: evaluationForm.communication_score
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 评分部分 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">评分项目</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>教学质量 (当前: {evaluationForm.teaching_quality})</Label>
                  <Slider
                    value={[evaluationForm.teaching_quality]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      teaching_quality: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>学生满意度 (当前: {evaluationForm.student_satisfaction})</Label>
                  <Slider
                    value={[evaluationForm.student_satisfaction]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      student_satisfaction: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>出勤情况 (当前: {evaluationForm.attendance_score})</Label>
                  <Slider
                    value={[evaluationForm.attendance_score]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      attendance_score: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>守时情况 (当前: {evaluationForm.punctuality_score})</Label>
                  <Slider
                    value={[evaluationForm.punctuality_score]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      punctuality_score: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>团队合作 (当前: {evaluationForm.teamwork_score})</Label>
                  <Slider
                    value={[evaluationForm.teamwork_score]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      teamwork_score: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>沟通能力 (当前: {evaluationForm.communication_score})</Label>
                  <Slider
                    value={[evaluationForm.communication_score]}
                    onValueChange={([value]) => setEvaluationForm(prev => ({ 
                      ...prev, 
                      communication_score: value 
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">评估备注</Label>
              <Textarea
                id="notes"
                value={evaluationForm.notes}
                onChange={(e) => setEvaluationForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={4}
                placeholder="详细的评估意见和改进建议..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建评估</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
