"use client"
import { gradeLabel } from '@/lib/grades'

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
import { RowActions } from '@/components/ui/row-actions'
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
  Save,
  PenLine,
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
  // 手写表单（也方便以后 AI 调同一个接口填）
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DailyLogFormData>({
    studentId: '', teacherId: '', date: today(),
    homework_done: false, nap: false, meal: '', mood: '', behavior_note: '',
  })

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
      toast.error(t("加载学生失败"))
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
    // teacherId 是 teachers 表的关系字段：只能用绑定的 teacher_id，用 users.id 会被 PB 拒绝
    const teacherId = (userProfile as any)?.teacher_id || ''
    if (!teacherId) { toast.error(t("请先登录")); return }
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
      toast.success(t("日志已创建"))
    } catch (err: any) {
      if (err.message === 'EXISTING_LOG') {
        toast(t("该学生已有今日日志"))
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

  // 手写表单保存：同一学生同一天已有日志就更新，没有才新建
  const handleSaveForm = async () => {
    if (!form.studentId) { toast.error(t("先选学生")); return }
    const teacherId = form.teacherId || (userProfile as any)?.teacher_id || ''
    setSaving(true)
    try {
      const sameDay = logs.find(l => l.studentId === form.studentId && String(l.date || '').slice(0, 10) === form.date)
      if (sameDay) {
        await updateLog(sameDay.id, {
          homework_done: form.homework_done, nap: form.nap, meal: form.meal,
          mood: form.mood, behavior_note: form.behavior_note,
        } as any)
        toast.success(t("已更新这一天的日志"))
      } else {
        await createLog({ ...form, teacherId })
        toast.success(t("日志已保存"))
      }
      setFormOpen(false)
      setForm({ studentId: '', teacherId: '', date: selectedDate, homework_done: false, nap: false, meal: '', mood: '', behavior_note: '' })
      refetch()
    } catch (err: any) {
      if (err.message === 'EXISTING_LOG') toast(t("该学生已有今日日志"))
      else toast.error(err.message || t("保存失败"))
    } finally {
      setSaving(false)
    }
  }

  const dateDisplay = format(new Date(selectedDate + 'T00:00:00'), 'yyyy年MM月dd日 EEEE', { locale: zhCN })

  return (
    <PageLayout
      title={t('dailylog.daily_logs')}
      description={t("记录学生每天的学习、用餐和情绪状态")}
      userRole={userProfile?.role || 'teacher'}
      status=""
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(selectedDate + 'T00:00:00')
            d.setDate(d.getDate() - 1)
            setSelectedDate(format(d, 'yyyy-MM-dd'))
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant={selectedDate === today() ? "default" : "outline"} size="sm" onClick={() => setSelectedDate(today())}>
            <Calendar className="h-4 w-4 mr-1" />
            {/* 手机端用短日期，避免长日期把工具栏顶出屏幕 */}
            <span className="hidden sm:inline">{dateDisplay}</span>
            <span className="sm:hidden">{format(new Date(selectedDate + 'T00:00:00'), 'MM/dd EEE', { locale: zhCN })}</span>
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
          <Button size="sm" variant={formOpen ? "secondary" : "default"}
            onClick={() => {
              setForm(f => ({ ...f, teacherId: (userProfile as any)?.teacher_id || '', date: selectedDate }))
              setFormOpen(o => !o)
            }}>
            <PenLine className="h-4 w-4 mr-1" />{t("写日志")}
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
              <div><div className="text-xl font-bold">{loggedIds.size}</div><div className="text-xs text-gray-500">{t("已记录")}</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg"><Plus className="h-5 w-5 text-amber-600" /></div>
              <div><div className="text-xl font-bold">{studentsWithout.length}</div><div className="text-xs text-gray-500">{t("待记录")}</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div><div className="text-xl font-bold">{logs.filter(l => l.homework_done).length}</div><div className="text-xs text-gray-500">{t("功课完成")}</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><Moon className="h-5 w-5 text-purple-600" /></div>
              <div><div className="text-xl font-bold">{logs.filter(l => l.nap).length}</div><div className="text-xs text-gray-500">{t("午睡了")}</div></div>
            </CardContent>
          </Card>
        </div>

        {/* 手写表单 */}
        {formOpen && (
          <Card className="border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("写一篇日志")}</CardTitle>
              <CardDescription>{t("同一学生同一天已有日志会直接更新；照片之后加")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("学生")}</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.studentId}
                    onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  >
                    <option value="">{t("— 请选择 —")}</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.grade ? ` · ${gradeLabel(s.grade)}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("日期")}</Label>
                  <input
                    type="date"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.date}
                    max={today()}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={form.homework_done}
                    onChange={e => setForm(f => ({ ...f, homework_done: e.target.checked }))} />
                  {t("功课完成")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={form.nap}
                    onChange={e => setForm(f => ({ ...f, nap: e.target.checked }))} />
                  {t("午睡了")}
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("用餐")}</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.meal}
                    onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
                  >
                    <option value="">{t("未记餐")}</option>
                    <option value="ate_all">{t("吃完")}</option>
                    <option value="ate_some">{t("吃一半")}</option>
                    <option value="refused">{t("不吃")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("情绪")}</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.mood}
                    onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
                  >
                    <option value="">{t("未记心情")}</option>
                    <option value="happy">{t("开心")}</option>
                    <option value="neutral">{t("一般")}</option>
                    <option value="upset">{t("不开心")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t("行为表现、特别事项")}</Label>
                <Textarea
                  rows={3}
                  className="text-sm"
                  placeholder={t("例如：今天主动帮同学、写字有进步")}
                  value={form.behavior_note}
                  onChange={e => setForm(f => ({ ...f, behavior_note: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveForm} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {t("保存日志")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>{t("取消")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <h3 className="text-sm font-medium text-gray-600 mb-3">{t("已记录 (")}{logs.length})</h3>
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
                          <CardDescription>{student?.grade ? gradeLabel(student.grade) : ''}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => setEditingLog(isEditing ? null : log.id)}>
                          {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 当前状态一览 */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={log.homework_done ? "default" : "outline"} className={log.homework_done ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {t("功课")}{t("：")}{log.homework_done ? "已记" : "未记"}
                        </Badge>
                        <Badge variant={log.nap ? "default" : "outline"} className={log.nap ? "bg-indigo-500 hover:bg-indigo-600" : ""}>
                          {t("午睡")}{t("：")}{log.nap ? "已记" : "未记"}
                        </Badge>
                        <Badge variant={log.meal ? "default" : "outline"} className={log.meal ? "bg-amber-500 hover:bg-amber-600" : ""}>
                          {log.meal ? `${MEAL_EMOJI[log.meal]} ${MEAL_LABELS[log.meal].split(' ')[1]}` : "未记餐"}
                        </Badge>
                        <Badge variant={log.mood ? "default" : "outline"} className={log.mood ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {log.mood ? `${MOOD_EMOJI[log.mood]} ${MOOD_LABELS[log.mood].split(' ')[1]}` : "未记心情"}
                        </Badge>
                      </div>

                      {/* 备注预览：AI 或老师写的内容不用点编辑也看得到 */}
                      {log.behavior_note && !isEditing && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 line-clamp-3 whitespace-pre-wrap">
                          {log.behavior_note}
                        </p>
                      )}

                      {/* 行内操作：功课为最常用主操作，其余进「⋯」 */}
                      <RowActions
                        primary={{
                          label: t("功课"),
                          icon: log.homework_done ? CheckCircle2 : XCircle,
                          variant: log.homework_done ? "default" : "outline",
                          onClick: () => handleQuickToggle(log.id, 'homework_done', !log.homework_done),
                        }}
                        actions={[
                          { label: log.nap ? "取消午睡" : "标记午睡", icon: Moon, onClick: () => handleQuickToggle(log.id, 'nap', !log.nap) },
                          { label: `记餐 · ${MEAL_LABELS.ate_all.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'meal', log.meal === 'ate_all' ? '' : 'ate_all') },
                          { label: `记餐 · ${MEAL_LABELS.ate_some.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'meal', log.meal === 'ate_some' ? '' : 'ate_some') },
                          { label: `记餐 · ${MEAL_LABELS.refused.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'meal', log.meal === 'refused' ? '' : 'refused') },
                          { label: `记心情 · ${MOOD_LABELS.happy.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'mood', log.mood === 'happy' ? '' : 'happy') },
                          { label: `记心情 · ${MOOD_LABELS.neutral.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'mood', log.mood === 'neutral' ? '' : 'neutral') },
                          { label: `记心情 · ${MOOD_LABELS.upset.split(' ')[1]}`, onClick: () => handleQuickToggle(log.id, 'mood', log.mood === 'upset' ? '' : 'upset') },
                        ]}
                      />

                      {/* 编辑模式 — 备注 */}
                      {isEditing && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-xs">{t('teacher.notes')}</Label>
                          <Textarea
                            value={log.behavior_note}
                            onChange={(e) => handleQuickToggle(log.id, 'behavior_note', e.target.value)}
                            placeholder={t("行为表现、特别事项...")}
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
            <h3 className="text-sm font-medium text-amber-600 mb-3">{t("待记录 (")}{studentsWithout.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {studentsWithout.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 whitespace-normal hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => handleQuickCreate(s.id)}
                >
                  <span className="font-medium text-sm text-center break-words w-full">{s.name}</span>
                  <span className="text-xs text-gray-400">{gradeLabel(s.grade || s.standard)}</span>
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
              <h3 className="text-lg font-medium text-gray-500">{t("暂无可记录的学生")}</h3>
              <p className="text-sm text-gray-400 mt-1">{t("请确保学生已分配到中心")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
