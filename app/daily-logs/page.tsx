"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import PageLayout from '@/components/layouts/PageLayout'
import { useDailyLogs, MOOD_EMOJI, MEAL_EMOJI, MEAL_LABELS, MOOD_LABELS, type DailyLogFormData } from '@/hooks/useDailyLogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Moon,
  Utensils,
  Heart,
  MessageSquare,
  Users,
  Plus,
  Edit,
  Eye,
} from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

// 获取今天日期
function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// 格式化日期显示
function fmtDate(d: string): string {
  const date = new Date(d)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return `${diff} 天前`
  return format(date, 'MM月dd日 EEE', { locale: zhCN })
}

export default function DailyLogsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(today())
  const { logs, loading, error, refetch, createLog, updateLog } = useDailyLogs(selectedDate)

  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [newLogMode, setNewLogMode] = useState(false)
  const [editingLog, setEditingLog] = useState<string | null>(null)

  // 加载学生列表
  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)
    try {
      const res = await fetch('/api/students?limit=200')
      const data = await res.json()
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students)
      }
    } catch {
      toast.error('加载学生失败')
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  // 哪个学生还没日志
  const loggedIds = new Set(logs.map(l => l.studentId))
  const studentsWithout = students.filter(s => !loggedIds.has(s.id))
  const studentsWith = students.filter(s => loggedIds.has(s.id))

  // 快速创建日志
  const handleQuickCreate = async (studentId: string) => {
    const teacherId = userProfile?.id || ''
    if (!teacherId) { toast.error('请先登录'); return }
    try {
      await createLog({
        studentId,
        teacherId,
        date: selectedDate,
        homework_done: false,
        nap: false,
        meal: '',
        mood: '',
        behavior_note: '',
      })
      toast.success('日志已创建')
    } catch (err: any) {
      if (err.message === 'EXISTING_LOG') {
        toast('该学生已有今日日志')
      } else {
        toast.error(err.message || '创建失败')
      }
    }
  }

  // 快速切换字段
  const handleQuickToggle = async (logId: string, field: string, value: any) => {
    try {
      await updateLog(logId, { [field]: value } as any)
    } catch (err: any) {
      toast.error(err.message || '更新失败')
    }
  }

  const dateDisplay = format(new Date(selectedDate + 'T00:00:00'), 'yyyy年MM月dd日 EEEE', { locale: zhCN })

  return (
    <PageLayout
      title={t('dailylog.daily_logs')}
      description="记录学生每天的学习、用餐和情绪状态"
      userRole={userProfile?.role || 'teacher'}
      status=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(selectedDate + 'T00:00:00')
            d.setDate(d.getDate() - 1)
            setSelectedDate(format(d, 'yyyy-MM-dd'))
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant={selectedDate === today() ? "default" : "outline"} size="sm" onClick={() => setSelectedDate(today())}>
            <Calendar className="h-4 w-4 mr-1" />
            {dateDisplay}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(selectedDate + 'T00:00:00')
            d.setDate(d.getDate() + 1)
            if (d <= new Date()) setSelectedDate(format(d, 'yyyy-MM-dd'))
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><div className="text-xl font-bold">{loggedIds.size}</div><div className="text-xs text-gray-500">已记录</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg"><Plus className="h-5 w-5 text-amber-600" /></div>
              <div><div className="text-xl font-bold">{studentsWithout.length}</div><div className="text-xs text-gray-500">待记录</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div><div className="text-xl font-bold">{logs.filter(l => l.homework_done).length}</div><div className="text-xs text-gray-500">功课完成</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><Moon className="h-5 w-5 text-purple-600" /></div>
              <div><div className="text-xl font-bold">{logs.filter(l => l.nap).length}</div><div className="text-xs text-gray-500">午睡了</div></div>
            </CardContent>
          </Card>
        </div>

        {/* 加载状态 */}
        {(loading || studentsLoading) && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">{t('teacher.loading')}</p>
          </div>
        )}

        {/* 已记录的学生 — 卡片视图 */}
        {!loading && logs.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">已记录 ({logs.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {logs.map((log) => {
                const student = log.expand?.studentId
                const isEditing = editingLog === log.id

                return (
                  <Card key={log.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{student?.name || '未知学生'}</CardTitle>
                          <CardDescription>{student?.grade || ''}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => setEditingLog(isEditing ? null : log.id)}>
                          {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 快速切换组 */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 功课 */}
                        <Button
                          variant={log.homework_done ? "default" : "outline"}
                          size="sm"
                          className={log.homework_done ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                          onClick={() => handleQuickToggle(log.id, 'homework_done', !log.homework_done)}
                        >
                          {log.homework_done ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                          功课
                        </Button>
                        {/* 午睡 */}
                        <Button
                          variant={log.nap ? "default" : "outline"}
                          size="sm"
                          className={log.nap ? "bg-indigo-500 hover:bg-indigo-600" : ""}
                          onClick={() => handleQuickToggle(log.id, 'nap', !log.nap)}
                        >
                          {log.nap ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                          午睡
                        </Button>
                      </div>

                      {/* 用餐 */}
                      <div className="flex gap-1.5">
                        {['ate_all', 'ate_some', 'refused'].map((m) => (
                          <Button
                            key={m}
                            variant={log.meal === m ? "default" : "outline"}
                            size="sm"
                            className={`flex-1 text-xs ${log.meal === m ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                            onClick={() => handleQuickToggle(log.id, 'meal', log.meal === m ? '' : m)}
                          >
                            {MEAL_EMOJI[m]} {MEAL_LABELS[m].split(' ')[1]}
                          </Button>
                        ))}
                      </div>

                      {/* 心情 */}
                      <div className="flex gap-1.5">
                        {['happy', 'neutral', 'upset'].map((md) => (
                          <Button
                            key={md}
                            variant={log.mood === md ? "default" : "outline"}
                            size="sm"
                            className={`flex-1 text-xs ${log.mood === md ? 
                              md === 'happy' ? 'bg-emerald-500' : md === 'upset' ? 'bg-red-500' : 'bg-gray-500'
                              : ''}`}
                            onClick={() => handleQuickToggle(log.id, 'mood', log.mood === md ? '' : md)}
                          >
                            {MOOD_EMOJI[md]} {MOOD_LABELS[md].split(' ')[1]}
                          </Button>
                        ))}
                      </div>

                      {/* 编辑模式 — 备注 */}
                      {isEditing && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-xs">{t('teacher.notes')}</Label>
                          <Textarea
                            value={log.behavior_note}
                            onChange={(e) => handleQuickToggle(log.id, 'behavior_note', e.target.value)}
                            placeholder="行为表现、特别事项..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 待记录学生 */}
        {!loading && studentsWithout.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-amber-600 mb-3">待记录 ({studentsWithout.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {studentsWithout.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => handleQuickCreate(s.id)}
                >
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.grade || s.standard}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && logs.length === 0 && studentsWithout.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-500">暂无可记录的学生</h3>
              <p className="text-sm text-gray-400 mt-1">请确保学生已分配到中心</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
