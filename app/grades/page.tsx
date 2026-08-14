"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGrades, GradeRecord, GradeStats } from "@/hooks/useGrades"
import { useStudents } from "@/hooks/useStudents"
import { Trophy, BarChart3, Search, Save, AlertCircle, GraduationCap, Building, Download, Loader2, Medal, AlertTriangle, ExternalLink } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const SUBJECTS = ["华文", "国文", "英文", "数学", "科学", "历史", "地理", "道德", "美术", "音乐", "体育", "其他"]
const TERMS = ["Term 1", "Term 2", "Term 3", "Final"]
const CURRENT_YEAR = new Date().getFullYear()

const CENTERS = [
  { code: "PU1", name: "中学" },
  { code: "BATU14", name: "小学" },
]

const gradeBadgeCls = (letter: string) => {
  switch (letter) {
    case "A": return "bg-emerald-100 text-emerald-700"
    case "B": return "bg-blue-100 text-blue-700"
    case "C": return "bg-amber-100 text-amber-700"
    case "D": return "bg-orange-100 text-orange-700"
    case "F": return "bg-red-100 text-red-700"
    default: return "bg-slate-100 text-slate-700"
  }
}
const gradeBarCls = (l: string) => {
  switch (l) { case "A": return "bg-emerald-500"; case "B": return "bg-blue-500"; case "C": return "bg-amber-500"; case "D": return "bg-orange-500"; case "F": return "bg-red-500"; default: return "bg-gray-300" }
}

export default function GradesManagementPage() {
  const { t } = useLanguage()
  const { loading, error, getClassGrades, saveGrade, getStats } = useGrades()
  const { students, loading: studentsLoading, fetchStudents } = useStudents()

  const [subject, setSubject] = useState("数学")
  const [term, setTerm] = useState("Term 1")
  const [reportTerm, setReportTerm] = useState("Term 1")
  const [year, setYear] = useState(CURRENT_YEAR)
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]) // all subjects for analysis
  const [stats, setStats] = useState<GradeStats | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState("")
  const [editComment, setEditComment] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [centerFilter, setCenterFilter] = useState("PU1")
  const [reportGradeFilter, setReportGradeFilter] = useState("all")
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editCellScore, setEditCellScore] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState("")
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [activeTab, setActiveTab] = useState<"entry" | "report">("report")

  const studentMap = useMemo(() => {
    const centerMap: Record<string, string> = {}
    const infoMap: Record<string, { name: string; grade: string }> = {}
    for (const s of students) {
      const id = (s as any).id || (s as any).student_id || ""
      centerMap[id] = (s as any).center || ""
      infoMap[id] = { name: (s as any).name || id, grade: (s as any).grade || "" }
    }
    return { centerMap, infoMap }
  }, [students])

  useEffect(() => { fetchStudents() }, [])

  const loadGrades = useCallback(async () => {
    const [data, allData] = await Promise.all([
      getClassGrades(term, year, subject),
      getClassGrades(term, year),
    ])
    setGrades(data)
    setAllGrades(allData)
    setStats(getStats(data, subject))
  }, [term, year, subject, getClassGrades, getStats])

  useEffect(() => { loadGrades() }, [loadGrades])

  const handleSave = async (record: GradeRecord) => {
    const score = parseInt(editScore)
    if (isNaN(score) || score < 0 || score > 100) return
    await saveGrade({ studentId: record.studentId, subject, term, year, score, teacher_comment: editComment })
    setEditingId(null); setEditScore(""); setEditComment("")
    loadGrades()
  }

  const handleCellSave = async (studentId: string, subj: string) => {
    const score = parseInt(editCellScore)
    if (isNaN(score) || score < 0 || score > 100) { setEditingCell(null); return }
    await saveGrade({ studentId, subject: subj, term: reportTerm, year, score })
    setEditingCell(null); setEditCellScore("")
    loadGrades()
  }

  const handleImport = async () => {
    setImporting(true); setImportMsg("正在从 DataStudio 导入...")
    try {
      const res = await fetch("/api/grades/import-datastudio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ center: centerFilter }) })
      const data = await res.json()
      setImportMsg(data.success ? `✅ 成功 ${data.ok}/${data.total}` : `❌ ${data.message || data.error || "导入失败"}`)
      if (data.success) loadGrades()
    } catch { setImportMsg("❌ 网络错误") } finally { setImporting(false) }
  }

  const filtered = useMemo(() => grades.filter(g => {
    const name = g.expand?.studentId?.name || ""
    if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (centerFilter !== "all" && studentMap.centerMap[g.studentId] !== centerFilter) return false
    return true
  }), [grades, searchTerm, centerFilter, studentMap])

  // Analysis data: all subjects, scored only, center filtered
  const analysisGrades = useMemo(() => allGrades.filter(g => {
    if (g.score == null) return false
    if (centerFilter !== "all" && studentMap.centerMap[g.studentId] !== centerFilter) return false
    return true
  }), [allGrades, centerFilter, studentMap])

  const overallStats = useMemo(() => {
    const scores = analysisGrades.map(g => g.score!)
    if (!scores.length) return null
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    const pass = scores.filter(s => s >= 50).length
    return { avg, high: Math.max(...scores), low: Math.min(...scores), passRate: Math.round(pass / scores.length * 100), students: new Set(analysisGrades.map(g => g.studentId)).size, entries: scores.length }
  }, [analysisGrades])

  const subjectStats = useMemo(() => {
    const map: Record<string, { scores: number[]; dist: Record<string, number> }> = {}
    for (const g of allGrades) {
      if (!map[g.subject]) map[g.subject] = { scores: [], dist: { A: 0, B: 0, C: 0, D: 0, F: 0 } }
      map[g.subject].scores.push(g.score!)
      map[g.subject].dist[g.grade_letter] = (map[g.subject].dist[g.grade_letter] || 0) + 1
    }
    return Object.entries(map).map(([subj, d]) => ({
      subject: subj, avg: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length * 10) / 10,
      count: d.scores.length, passRate: Math.round(d.scores.filter(s => s >= 50).length / d.scores.length * 100), dist: d.dist
    })).sort((a, b) => b.avg - a.avg)
  }, [analysisGrades])

  const studentRanking = useMemo(() => {
    const map: Record<string, { scores: number[]; grade: string; name: string }> = {}
    for (const g of allGrades) {
      if (!map[g.studentId]) {
        const name = g.expand?.studentId?.name || studentMap.infoMap[g.studentId]?.name || g.studentId
        const grade = g.expand?.studentId?.grade || studentMap.infoMap[g.studentId]?.grade || ""
        map[g.studentId] = { scores: [], grade, name }
      }
      map[g.studentId].scores.push(g.score!)
    }
    return Object.entries(map).map(([id, d]) => ({
      id, name: d.name, grade: d.grade,
      avg: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length * 10) / 10,
      subjects: d.scores.length,
    })).sort((a, b) => b.avg - a.avg)
  }, [analysisGrades, studentMap])

  const top10 = studentRanking.slice(0, 10)
  const bottom10 = studentRanking.slice(-10).reverse()

  return (
    <PageLayout title={t('exam.grade_management')} description="录入和分析学生考试成绩">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 border-b pb-0">
        <button onClick={() => setActiveTab("report")} className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-[2px] ${activeTab === "report" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>📊 成绩报表</button>
        <button onClick={() => setActiveTab("entry")} className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-[2px] ${activeTab === "entry" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>📝 录入分析</button>
      </div>

      {/* Center + Import */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {CENTERS.map(c => (
          <Button key={c.code} size="sm" variant={centerFilter === c.code ? "default" : "outline"} onClick={() => setCenterFilter(c.code)} className="h-8 text-xs"><Building className="h-3 w-3 mr-1" />{c.name}</Button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => window.open("https://datastudio.google.com/u/0/reporting/5755410c-43ab-4d79-afa7-a770c11eef2a/page/bEQqD", "_blank")} className="h-8 text-xs text-blue-600"><ExternalLink className="h-3 w-3 mr-1" />DataStudio</Button>
        <Button size="sm" onClick={handleImport} disabled={importing} className="h-8 text-xs bg-green-600 hover:bg-green-700">
          {importing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}从 DataStudio 导入
        </Button>
        {importMsg && <Badge className="text-[10px] bg-blue-50 text-blue-700">{importMsg}</Badge>}
      </div>

      {activeTab === "entry" && (<>
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
        <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || CURRENT_YEAR)} className="w-24" />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="搜索学生..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">{t('report.average_score')}</p><p className="text-2xl font-bold text-indigo-600">{stats.average}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">{t('grade.highest_score')}</p><p className="text-2xl font-bold text-emerald-600">{stats.highest}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">{t('grade.lowest_score')}</p><p className="text-2xl font-bold text-red-600">{stats.lowest}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">{t('exam.pass_rate')}</p><p className="text-2xl font-bold text-blue-600">{stats.passRate}%</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">等级分布</p><div className="flex justify-center gap-1 mt-1">{(["A", "B", "C", "D", "F"] as const).map(l => <span key={l} className={`text-xs px-1.5 py-0.5 rounded ${gradeBadgeCls(l)}`}>{l}:{stats.distribution[l]}</span>)}</div></CardContent></Card>
        </div>
      )}

      {/* Grades Table */}
      {loading || studentsLoading ? (
        <div className="space-y-3 mb-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
      ) : filtered.length === 0 ? (
        <Card className="mb-6"><CardContent className="p-12 text-center text-slate-400"><GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />{subject} · {term} · {year} 暂无成绩记录</CardContent></Card>
      ) : (
        <Card className="mb-6"><div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>{t('common.student')}</TableHead><TableHead className="w-24">{t('student.grade')}</TableHead><TableHead className="w-24">分数</TableHead><TableHead className="w-20">等级</TableHead><TableHead>评语</TableHead><TableHead className="w-24">{t('teacher.actions')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((g, i) => {
                const isEditing = editingId === g.id
                return (
                  <TableRow key={g.id || i} className={g.score && g.score >= 80 ? "bg-emerald-50/50" : ""}>
                    <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">{g.expand?.studentId?.name || studentMap.infoMap[g.studentId]?.name || g.studentId}</TableCell>
                    <TableCell className="text-xs text-slate-500">{g.expand?.studentId?.grade || studentMap.infoMap[g.studentId]?.grade || "-"}</TableCell>
                    <TableCell>{isEditing ? <Input type="number" min={0} max={100} value={editScore} onChange={e => setEditScore(e.target.value)} className="w-16 h-8 text-sm" /> : <span className={g.score && g.score >= 80 ? "text-emerald-600 font-bold" : g.score && g.score < 50 ? "text-red-600" : ""}>{g.score ?? "-"}</span>}</TableCell>
                    <TableCell>{g.grade_letter && <Badge className={gradeBadgeCls(g.grade_letter)}>{g.grade_letter}</Badge>}</TableCell>
                    <TableCell>{isEditing ? <Input value={editComment} onChange={e => setEditComment(e.target.value)} className="h-8 text-sm" placeholder="评语..." /> : <span className="text-xs text-slate-400 truncate max-w-[120px] block">{g.teacher_comment || "-"}</span>}</TableCell>
                    <TableCell>{isEditing ? <div className="flex gap-1"><Button size="sm" onClick={() => handleSave(g)}><Save className="h-3 w-3 mr-1" />{t('report.save')}</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('report.cancel')}</Button></div> : <Button size="sm" variant="outline" onClick={() => { setEditingId(g.id); setEditScore(String(g.score ?? "")); setEditComment(g.teacher_comment || "") }}>编辑</Button>}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div></Card>
      )}
      </>)}  {/* end entry tab */}

      {activeTab === "report" && (() => {
        const gradeSubjects = ["华文", "国文", "英文", "科学", "数学", "历史", "地理", "伊斯兰教育", "道德", "RBT", "美术", "体育", "电脑"]
        // Build per-student subject map
        const studentSubjectMap: Record<string, Record<string, {score:number;letter:string}>> = {}
        for (const g of allGrades) {
          if (g.term !== reportTerm) continue
          if (g.score == null) continue
          if (!studentSubjectMap[g.studentId]) studentSubjectMap[g.studentId] = {}
          studentSubjectMap[g.studentId][g.subject] = { score: g.score!, letter: g.grade_letter }
        }
        const order = {"标准1":1,"标准2":2,"标准3":3,"标准4":4,"标准5":5,"标准6":6,"Peralihan":7,"中一":8,"中二":9,"中三":10,"中四":11,"中五":12}
        const centerStudents = students
          .filter((s) => {
            if (centerFilter !== "all" && s.center !== centerFilter) return false
            if (s.status === "graduated" || s.status === "dropped") return false
            if (reportGradeFilter !== "all" && s.standard !== reportGradeFilter) return false
            return true
          })
          .sort((a, b) => (order[a.standard] || 0) - (order[b.standard] || 0))
        return (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" />成绩报表</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={reportTerm} onValueChange={setReportTerm}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || CURRENT_YEAR)} className="w-20 h-7 text-xs" />
                </div>
                <Select value={reportGradeFilter} onValueChange={setReportGradeFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="全部年级" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    <SelectItem value="Peralihan">Peralihan</SelectItem>
                    <SelectItem value="Form 1">Form 1</SelectItem>
                    <SelectItem value="Form 2">Form 2</SelectItem>
                    <SelectItem value="Form 3">Form 3</SelectItem>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                    <SelectItem value="Form 5">Form 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-10">#</TableHead>
                      <TableHead className="text-xs w-28">学生</TableHead>
                      <TableHead className="text-xs w-16">年级</TableHead>
                      {gradeSubjects.map(s => <TableHead key={s} className="text-xs text-center w-16">{s}</TableHead>)}
                      <TableHead className="text-xs text-right w-14">平均</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centerStudents.map((s, i) => {
                      const subjects = studentSubjectMap[s.id] || {}
                      return (
                        <TableRow key={s.id} className={i < 3 ? "bg-amber-50/30" : i >= centerStudents.length - 3 ? "bg-red-50/30" : ""}>
                          <TableCell className="text-xs font-mono text-slate-400">{i + 1}</TableCell>
                          <TableCell className="text-xs font-medium">{s.name || s.student_name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{s.standard || s.grade}</TableCell>
                          {gradeSubjects.map(subj => {
                            const d = subjects[subj]
                            return (
                              <TableCell key={subj} className="text-center p-1">
                                {(() => {
                              const cellKey = `${s.id}-${subj}`
                              const isEditing = editingCell === cellKey
                              if (isEditing) {
                                return <form onSubmit={e => { e.preventDefault(); handleCellSave(s.id, subj) }} className="flex items-center gap-1"><Input type="number" min={0} max={100} value={editCellScore} onChange={e => setEditCellScore(e.target.value)} className="w-14 h-6 text-xs p-1" autoFocus onBlur={() => handleCellSave(s.id, subj)} /></form>
                              }
                              if (d) {
                                return <span onClick={() => { setEditingCell(cellKey); setEditCellScore(String(d.score)) }} className={`text-xs font-mono cursor-pointer hover:bg-indigo-50 rounded px-1 -mx-1 ${d.score >= 80 ? "text-emerald-600" : d.score >= 50 ? "text-slate-700" : "text-red-600"}`}>{d.score}<span className="text-[10px] ml-0.5 text-slate-400">{d.letter}</span></span>
                              }
                              return <span onClick={() => { setEditingCell(cellKey); setEditCellScore("") }} className="text-xs text-slate-300 cursor-pointer hover:bg-indigo-50 rounded px-1 -mx-1">+</span>
                            })()}
                              </TableCell>
                            )
                          })}
                          <TableCell className={`text-xs text-right font-bold ${s.avg >= 70 ? "text-emerald-600" : s.avg >= 50 ? "text-slate-700" : "text-red-600"}`}>{(() => { const subjects = studentSubjectMap[s.id] || {}; const scores = Object.values(subjects).filter((d) => !isNaN(d.score)).map((d) => d.score); const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : 0; return avg > 0 ? avg : "-" })()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {activeTab === "entry" && (<>
      {/* Analysis: toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)} className="h-7 text-xs text-slate-500">
          <BarChart3 className="h-3 w-3 mr-1" />{showAnalysis ? "隐藏分析" : "显示分析"}
        </Button>
        <span className="text-xs text-slate-400">全部科目 · {term} · {year}</span>
      </div>

      {/* Analysis section */}
      {showAnalysis && !loading && analysisGrades.length > 0 && overallStats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">学生数</p><p className="text-2xl font-bold text-indigo-600">{overallStats.students}</p><p className="text-[10px] text-slate-400">{overallStats.entries} 科次</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">全科均分</p><p className={`text-2xl font-bold ${overallStats.avg >= 60 ? "text-emerald-600" : overallStats.avg >= 40 ? "text-amber-600" : "text-red-600"}`}>{overallStats.avg}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">及格率</p><p className={`text-2xl font-bold ${overallStats.passRate >= 60 ? "text-emerald-600" : overallStats.passRate >= 40 ? "text-amber-600" : "text-red-600"}`}>{overallStats.passRate}%</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">最高分</p><p className="text-2xl font-bold text-emerald-600">{overallStats.high}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">最低分</p><p className="text-2xl font-bold text-red-600">{overallStats.low}</p></CardContent></Card>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />科目分析</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subjectStats.map(s => {
                  const max = Math.max(...Object.values(s.dist), 1)
                  return (
                    <div key={s.subject} className="flex items-center gap-3">
                      <div className="w-20 text-xs font-medium shrink-0 text-right">{s.subject}</div>
                      <div className="flex-1 flex items-center gap-1">
                        {(["A", "B", "C", "D", "F"] as const).map(l => {
                          const c = s.dist[l] || 0
                          return <div key={l} className="flex-1 flex flex-col items-center"><div className="w-full bg-gray-100 rounded h-4 relative"><div className={`h-full rounded ${gradeBarCls(l)}`} style={{ width: `${(c / max) * 100}%`, minWidth: c ? '4px' : '0' }} /></div><span className="text-[10px] text-slate-500 mt-0.5">{l}:{c}</span></div>
                        })}
                      </div>
                      <div className="w-16 text-xs text-right"><span className="font-semibold">{(() => { const subjects = studentSubjectMap[s.id] || {}; const scores = Object.values(subjects).filter((d) => !isNaN(d.score)).map((d) => d.score); const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : 0; return avg > 0 ? avg : "-" })()}</span><span className="text-slate-400 ml-1">{s.passRate}%</span></div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />前十名</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-10 text-xs">#</TableHead><TableHead className="text-xs">学生</TableHead><TableHead className="text-xs w-16">班级</TableHead><TableHead className="text-xs w-14 text-right">平均</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {top10.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-4">暂无</TableCell></TableRow> :
                      top10.map((s, i) => (
                        <TableRow key={s.id} className={i < 3 ? "bg-amber-50/50" : ""}>
                          <TableCell className="text-xs">{i < 3 ? <Medal className={`h-3.5 w-3.5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-orange-400"}`} /> : i + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{s.name || s.student_name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{s.standard || s.grade}</TableCell>
                          <TableCell className={`text-xs text-right font-bold ${s.avg >= 70 ? "text-emerald-600" : s.avg >= 50 ? "text-blue-600" : "text-amber-600"}`}>{(() => { const subjects = studentSubjectMap[s.id] || {}; const scores = Object.values(subjects).filter((d) => !isNaN(d.score)).map((d) => d.score); const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : 0; return avg > 0 ? avg : "-" })()}</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />需关注</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-10 text-xs">#</TableHead><TableHead className="text-xs">学生</TableHead><TableHead className="text-xs w-16">班级</TableHead><TableHead className="text-xs w-14 text-right">平均</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {bottom10.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-4">暂无</TableCell></TableRow> :
                      bottom10.map((s, i) => (
                        <TableRow key={s.id} className={s.avg < 40 ? "bg-red-50/50" : ""}>
                          <TableCell className="text-xs text-slate-400">{studentRanking.length - i}</TableCell>
                          <TableCell className="font-medium text-sm">{s.name || s.student_name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{s.standard || s.grade}</TableCell>
                          <TableCell className={`text-xs text-right font-bold ${s.avg < 40 ? "text-red-600" : "text-amber-600"}`}>{(() => { const subjects = studentSubjectMap[s.id] || {}; const scores = Object.values(subjects).filter((d) => !isNaN(d.score)).map((d) => d.score); const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : 0; return avg > 0 ? avg : "-" })()}</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" />全部排名</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-10 text-xs">#</TableHead><TableHead className="text-xs">学生</TableHead><TableHead className="text-xs w-16">班级</TableHead><TableHead className="text-xs w-14 text-right">平均</TableHead><TableHead className="text-xs w-12 text-right">科数</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {studentRanking.map((s, i) => (
                      <TableRow key={s.id} className={i < 3 ? "bg-amber-50/50" : s.avg < 40 ? "bg-red-50/50" : ""}>
                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{s.name || s.student_name}</TableCell>
                        <TableCell className="text-xs text-slate-500">{s.standard || s.grade}</TableCell>
                        <TableCell className={`text-xs text-right font-bold ${s.avg >= 70 ? "text-emerald-600" : s.avg >= 50 ? "text-blue-600" : s.avg < 40 ? "text-red-600" : "text-amber-600"}`}>{(() => { const subjects = studentSubjectMap[s.id] || {}; const scores = Object.values(subjects).filter((d) => !isNaN(d.score)).map((d) => d.score); const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : 0; return avg > 0 ? avg : "-" })()}</TableCell>
                        <TableCell className="text-xs text-right text-slate-400">{s.subjects}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </>)}  {/* end entry tab (analysis) */}
    </PageLayout>
  )
}
