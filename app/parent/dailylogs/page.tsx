"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useStudentDailyLogs, MEAL_LABELS, MOOD_EMOJI, MOOD_LABELS, MEAL_EMOJI } from "@/hooks/useDailyLogs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle2,
  XCircle,
  Moon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  BookOpen,
  Utensils,
  Heart,
  MessageSquare,
  ArrowLeft,
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function ParentDailyLogsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const childId = searchParams?.get("child") || ""

  const { logs, loading } = useStudentDailyLogs(childId || undefined, 50)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!childId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">请从家长首页选择孩子查看每日日志</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/parent/dashboard")}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 按日期分组
  const groupedByDate = logs.reduce((acc, log) => {
    const d = log.date
    if (!acc[d]) acc[d] = []
    acc[d].push(log)
    return acc
  }, {} as Record<string, typeof logs>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/parent/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">📓 每日日志</h1>
          <p className="text-sm text-gray-500">查看孩子在安亲班的学习和生活记录</p>
        </div>
      </div>

      {/* 最近一级统计 */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="功课完成" value={`${logs.filter(l => l.homework_done).length}/${logs.length}`} />
          <MiniStat icon={<Moon className="h-4 w-4 text-indigo-500" />} label="午睡" value={`${logs.filter(l => l.nap).length}/${logs.length}`} />
          <MiniStat icon={<Utensils className="h-4 w-4 text-amber-500" />} label="吃完" value={`${logs.filter(l => l.meal === 'ate_all').length}`} />
          <MiniStat icon={<Heart className="h-4 w-4 text-pink-500" />} label="开心" value={`${logs.filter(l => l.mood === 'happy').length}`} />
        </div>
      )}

      {/* 加载 */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      )}

      {/* 空 */}
      {!loading && logs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">暂无日志记录</p>
            <p className="text-sm text-gray-400 mt-1">老师会给孩子的每一天做记录</p>
          </CardContent>
        </Card>
      )}

      {/* 按日期排列的日志 */}
      {!loading && sortedDates.map(date => (
        <Card key={date} className="overflow-hidden">
          <CardHeader className="pb-3 bg-gray-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {format(new Date(date + 'T00:00:00'), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {groupedByDate[date].map((log) => {
              const isExpanded = expandedId === log.id
              return (
                <div key={log.id} className="space-y-3">
                  {/* 快速状态条 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* 功课 */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${log.homework_done ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {log.homework_done ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {log.homework_done ? '功课已完成' : '功课未完成'}
                    </div>
                    {/* 午睡 */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${log.nap ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-500'}`}>
                      <Moon className="h-4 w-4" />
                      {log.nap ? '午睡了' : '没午睡'}
                    </div>
                  </div>

                  {/* 用餐和心情 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg text-sm bg-amber-50 text-amber-700">
                      <span className="text-base">{MEAL_EMOJI[log.meal] || '—'}</span>
                      {log.meal ? MEAL_LABELS[log.meal] : '无记录'}
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg text-sm bg-purple-50 text-purple-700">
                      <span className="text-base">{MOOD_EMOJI[log.mood] || '—'}</span>
                      {log.mood ? MOOD_LABELS[log.mood] : '无记录'}
                    </div>
                  </div>

                  {/* 备注 */}
                  {log.behavior_note && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-2 p-2 rounded-lg text-xs bg-blue-50 text-blue-700">
                        <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className={isExpanded ? "" : "line-clamp-1"}>
                          {log.behavior_note}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* 教师 */}
                  {log.expand?.teacherId?.name && (
                    <div className="text-xs text-gray-400">
                      记录：{log.expand.teacherId.name}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="flex justify-center mb-0.5">{icon}</div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}
