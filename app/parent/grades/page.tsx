"use client"

import React, { useEffect, useState } from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { useGrades, GradeRecord } from "@/hooks/useGrades"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BarChart3, BookOpen, TrendingUp } from "lucide-react"
import { useSearchParams } from "next/navigation"

const gradeColor = (letter: string) => {
  switch (letter) {
    case "A": return "bg-emerald-100 text-emerald-700"
    case "B": return "bg-blue-100 text-blue-700"
    case "C": return "bg-amber-100 text-amber-700"
    case "D": return "bg-orange-100 text-orange-700"
    case "F": return "bg-red-100 text-red-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

export default function ParentGradesPage() {
  const { children, loading, error } = useParentPortal()
  const { getStudentGrades, getStats } = useGrades()
  const searchParams = useSearchParams()
  const childId = searchParams?.get("child")

  const [gradesMap, setGradesMap] = useState<Record<string, GradeRecord[]>>({})
  const [loadingGrades, setLoadingGrades] = useState(false)

  const filtered = childId ? children.filter((c) => c.id === childId) : children

  useEffect(() => {
    if (filtered.length === 0) return
    const loadAll = async () => {
      setLoadingGrades(true)
      const map: Record<string, GradeRecord[]> = {}
      for (const child of filtered) {
        const data = await getStudentGrades(child.id)
        map[child.id] = data
      }
      setGradesMap(map)
      setLoadingGrades(false)
    }
    loadAll()
  }, [filtered.length])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Group grades by term
  const groupByTerm = (grades: GradeRecord[]) => {
    const groups: Record<string, GradeRecord[]> = {}
    grades.forEach(g => {
      const key = `${g.term} ${g.year}`
      if (!groups[key]) groups[key] = []
      groups[key].push(g)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">成绩查询</h1>
      <p className="text-gray-500">查看孩子的考试成绩与学习进度</p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无数据</p>
          </CardContent>
        </Card>
      ) : (
        filtered.map((child) => {
          const childGrades = gradesMap[child.id] || []
          const stats = childGrades.length > 0 ? getStats(childGrades) : null
          const terms = groupByTerm(childGrades)

          return (
            <div key={child.id} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    {child.name} — {child.grade}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingGrades ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : childGrades.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">暂无成绩记录</p>
                    </div>
                  ) : (
                    <>
                      {/* Stats */}
                      {stats && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                          <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">科目数</p>
                            <p className="text-lg font-bold text-indigo-600">{stats.count}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">平均分</p>
                            <p className="text-lg font-bold text-blue-600">{stats.average}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">最高</p>
                            <p className="text-lg font-bold text-emerald-600">{stats.highest}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">及格率</p>
                            <p className="text-lg font-bold text-amber-600">{stats.passRate}%</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500">等级</p>
                            <div className="flex justify-center gap-0.5 mt-1">
                              {(["A","B","C","D","F"] as const).map(l => stats.distribution[l] > 0 && (
                                <span key={l} className={`text-xs px-1 py-0.5 rounded ${gradeColor(l)}`}>{l}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Per-term grades */}
                      {terms.map(([termLabel, termGrades]) => (
                        <div key={termLabel} className="mb-4">
                          <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> {termLabel}
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {termGrades.map((g) => (
                              <div key={g.id} className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500">{g.subject}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xl font-bold text-slate-800">{g.score ?? "-"}</span>
                                  {g.grade_letter && (
                                    <Badge className={gradeColor(g.grade_letter)}>{g.grade_letter}</Badge>
                                  )}
                                </div>
                                {g.teacher_comment && (
                                  <p className="text-xs text-slate-400 mt-1 truncate">{g.teacher_comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })
      )}
    </div>
  )
}
