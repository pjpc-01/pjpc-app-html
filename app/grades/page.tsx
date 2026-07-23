"use client"

import { useState, useEffect, useCallback } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGrades, GradeRecord, GradeStats } from "@/hooks/useGrades"
import { useStudents } from "@/hooks/useStudents"
import { Trophy, TrendingUp, TrendingDown, BarChart3, Search, Save, AlertCircle, GraduationCap, BookOpen } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const SUBJECTS = ["华文", "国文", "英文", "数学", "科学", "历史", "地理", "道德", "美术", "音乐", "体育", "其他"]
const TERMS = ["Term 1", "Term 2", "Term 3", "Final"]
const CURRENT_YEAR = new Date().getFullYear()

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

export default function GradesManagementPage() {
  const { t } = useLanguage()
  const { loading, error, getClassGrades, saveGrade, getStats } = useGrades()
  const { students, loading: studentsLoading, fetchStudents } = useStudents()

  const [subject, setSubject] = useState("数学")
  const [term, setTerm] = useState("Term 1")
  const [year, setYear] = useState(CURRENT_YEAR)
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [stats, setStats] = useState<GradeStats | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState("")
  const [editComment, setEditComment] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Load students
  useEffect(() => { fetchStudents() }, [])

  // Load grades
  const loadGrades = useCallback(async () => {
    const data = await getClassGrades(term, year, subject)
    setGrades(data)
    setStats(getStats(data, subject))
  }, [term, year, subject, getClassGrades, getStats])

  useEffect(() => { loadGrades() }, [loadGrades])

  // Save single grade
  const handleSave = async (record: GradeRecord) => {
    const score = parseInt(editScore)
    if (isNaN(score) || score < 0 || score > 100) return
    await saveGrade({
      studentId: record.studentId,
      subject,
      term,
      year,
      score,
      teacher_comment: editComment,
    })
    setEditingId(null)
    setEditScore("")
    setEditComment("")
    loadGrades()
  }

  // Filter students by search
  const filtered = grades.filter(g => {
    const name = g.expand?.studentId?.name || ""
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <PageLayout title={t('exam.grade_management')} description="录入和分析学生考试成绩">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || CURRENT_YEAR)} className="w-24" placeholder={t('teacher.year')} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="搜索学生..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">{t('report.average_score')}</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.average}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">{t('grade.highest_score')}</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.highest}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">{t('grade.lowest_score')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowest}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">{t('exam.pass_rate')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.passRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">等级分布</p>
              <div className="flex justify-center gap-1 mt-1">
                {(["A","B","C","D","F"] as const).map(l => (
                  <span key={l} className={`text-xs px-1.5 py-0.5 rounded ${gradeColor(l)}`}>
                    {l}:{stats.distribution[l]}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades Table */}
      {loading || studentsLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : error ? (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-slate-400"><GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />{subject} · {term} · {year} 暂无成绩记录</CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('common.student')}</TableHead>
                  <TableHead className="w-24">{t('student.grade')}</TableHead>
                  <TableHead className="w-24">分数</TableHead>
                  <TableHead className="w-20">等级</TableHead>
                  <TableHead>评语</TableHead>
                  <TableHead className="w-24">{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g, i) => {
                  const isEditing = editingId === g.id
                  return (
                    <TableRow key={g.id || i} className={g.score && g.score >= 80 ? "bg-emerald-50/50" : ""}>
                      <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium">{g.expand?.studentId?.name || g.studentId}</TableCell>
                      <TableCell className="text-xs text-slate-500">{g.expand?.studentId?.grade || "-"}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" min={0} max={100} value={editScore} onChange={e => setEditScore(e.target.value)} className="w-16 h-8 text-sm" />
                        ) : (
                          <span className={g.score && g.score >= 80 ? "text-emerald-600 font-bold" : g.score && g.score < 50 ? "text-red-600" : ""}>
                            {g.score ?? "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {g.grade_letter && <Badge className={gradeColor(g.grade_letter)}>{g.grade_letter}</Badge>}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={editComment} onChange={e => setEditComment(e.target.value)} className="h-8 text-sm" placeholder="评语..." />
                        ) : (
                          <span className="text-xs text-slate-400 truncate max-w-[120px] block">{g.teacher_comment || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSave(g)}><Save className="h-3 w-3 mr-1" />{t('report.save')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('report.cancel')}</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setEditingId(g.id); setEditScore(String(g.score ?? "")); setEditComment(g.teacher_comment || ""); }}>
                            编辑
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </PageLayout>
  )
}
