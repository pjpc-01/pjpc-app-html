"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentReports, StudentReport, ReportSubject } from "@/hooks/useStudentReports"
import { useStudents } from "@/hooks/useStudents"
import {
  ArrowLeft, Printer, Download, Save, Edit3, FileText,
  User, Calendar, Clock, BookOpen, Star, Flag, Heart,
  AlertTriangle, CheckCircle, ChevronRight, Loader2
} from "lucide-react"

const DEFAULT_SUBJECTS = ["语文", "数学", "英语", "科学", "历史", "地理", "道德", "美术", "体育"]

// Convert numeric score to Chinese evaluation
const scoreToEvaluation = (score: number | null): string => {
  if (score === null || score === undefined) return "-"
  if (score >= 90) return "优秀"
  if (score >= 80) return "良好"
  if (score >= 60) return "及格"
  return "待加强"
}

// Color for evaluation badge
const evalColor = (evaluation: string) => {
  switch (evaluation) {
    case "优秀": return "bg-emerald-100 text-emerald-700"
    case "良好": return "bg-blue-100 text-blue-700"
    case "及格": return "bg-amber-100 text-amber-700"
    case "待加强": return "bg-red-100 text-red-700"
    default: return "bg-gray-100 text-gray-600"
  }
}

const formatDate = (d: string) => {
  if (!d) return ""
  const date = new Date(d)
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
}

const calculateAge = (dob: string) => {
  if (!dob) return ""
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function StudentReportContent() {
  const params = useParams()
  const router = useRouter()
  const reportId = params?.id as string
  const { loading, getReport, saveReport, deleteReport } = useStudentReports()
  const { students, loading: studentsLoading } = useStudents()
  const [report, setReport] = useState<StudentReport | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Load report
  useEffect(() => {
    if (!reportId || reportId === "new") return
    loadReport()
  }, [reportId])

  // Fetch student data if not in expand
  useEffect(() => {
    if (!report?.studentId || report?.expand?.studentId) return
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/pocketbase-proxy/api/collections/students/records/${report.studentId}`)
        if (res.ok) {
          const studentData = await res.json()
          setReport(prev => prev ? { ...prev, expand: { ...prev.expand, studentId: studentData } } : prev)
        }
      } catch (e) {}
    }
    fetchStudent()
  }, [report?.studentId])

  const loadReport = async () => {
    const data = await getReport(reportId)
    if (data) setReport(data)
  }

  // Find student by report's studentId
  const student = report?.expand?.studentId || students.find(s => s.id === report?.studentId)

  // Sort subjects for consistent display
  const sortedSubjects = (report?.subjects || []).sort((a, b) => {
    const idxA = DEFAULT_SUBJECTS.indexOf(a.name)
    const idxB = DEFAULT_SUBJECTS.indexOf(b.name)
    if (idxA >= 0 && idxB >= 0) return idxA - idxB
    if (idxA >= 0) return -1
    if (idxB >= 0) return 1
    return a.name.localeCompare(b.name)
  })

  // Compute averages
  const computeAvg = (subjects: ReportSubject[], key: 'midterm' | 'final') => {
    const scores = subjects.map(s => s[key]).filter(s => s !== null) as number[]
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
  }

  const midtermAvg = computeAvg(sortedSubjects, 'midterm')
  const finalAvg = computeAvg(sortedSubjects, 'final')
  const overallAvg = report?.overall_avg ?? 
    (midtermAvg !== null && finalAvg !== null ? Math.round((midtermAvg + finalAvg) / 2 * 10) / 10 : null)

  // Update subject field
  const updateSubject = (idx: number, field: keyof ReportSubject, value: any) => {
    if (!report) return
    const newSubjects = [...report.subjects]
    newSubjects[idx] = { ...newSubjects[idx], [field]: value }
    setReport({ ...report, subjects: newSubjects })
  }

  // Handle save
  const handleSave = async () => {
    if (!report) return
    setSaving(true)
    try {
      await saveReport(report)
      setEditMode(false)
    } catch (e: any) {
      alert("保存失败: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Convert to PDF (simple: print to PDF)
  const handleDownloadPDF = () => {
    // For now, use browser print dialog which can Save as PDF
    window.print()
  }

  // ─── Loading ─────────────────────────────────
  if (loading || studentsLoading) {
    return (
      <PageLayout title="学生报告" backUrl="/student-management">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </PageLayout>
    )
  }

  if (!report) {
    return (
      <PageLayout title="学生报告" backUrl="/student-management">
        <div className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">报告未找到</p>
          <Button onClick={() => router.push("/student-management")} variant="outline" className="mt-4">
            返回学生管理
          </Button>
        </div>
      </PageLayout>
    )
  }

  // ─── Report Content ──────────────────────────
  return (
    <PageLayout 
      title={`${student?.name || "学生"} — 学生报告`} 
      backUrl="/student-management"
      actions={
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>取消</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                保存
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-1" />编辑
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />打印
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* ─── Printable Report Container ─── */}
      <div ref={printRef} className="report-container" id="student-report-print">
        
        {/* ═══ Header ═══ */}
        <div className="text-center mb-6 print:mb-4">
          <div className="inline-flex items-center gap-3">
            <span className="text-gray-300 text-lg">✦</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">学生报告</h1>
            <span className="text-gray-300 text-lg">✦</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">— 全面发展 · 健康成长 · 追求卓越 —</p>
        </div>

        {/* ═══ Student Info + Photo + Growth Message ═══ */}
        <div className="glass-card p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Photo */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                {student?.avatar ? (
                  <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-gray-300" />
                )}
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">姓名：</span>
                <span className="font-semibold text-gray-800">{student?.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">出生日期：</span>
                <span className="text-gray-700">{student?.dob ? formatDate(student.dob) : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">年龄：</span>
                <span className="text-gray-700">{student?.dob ? `${calculateAge(student.dob)}岁` : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">报告日期：</span>
                <span className="text-gray-700">{report.report_date ? formatDate(report.report_date) : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">年级：</span>
                <span className="text-gray-700">{student?.grade || "—"}</span>
              </div>
            </div>
          </div>

          {/* Growth Message */}
          <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
            <span className="text-blue-400 text-xl flex-shrink-0">❝</span>
            {editMode ? (
              <Textarea 
                value={report.growth_message} 
                onChange={e => setReport({...report, growth_message: e.target.value})}
                className="border-0 bg-transparent shadow-none resize-none p-0 text-gray-600 text-sm min-h-[60px]"
                placeholder="成长寄语..."
              />
            ) : (
              <p className="text-gray-600 text-sm">{report.growth_message || "成长不在于做得最好，而在于愿意不断尝试、不断进步。"}</p>
            )}
            <span className="text-blue-400 text-xl flex-shrink-0 self-end">❞</span>
          </div>
        </div>

        {/* ═══ Section 1: Academic Performance ═══ */}
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />一、学业表现
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-4">
            在本学期中，我在各学科的学习中总体表现良好，能够按时完成作业，积极参与课堂讨论，成绩稳中有进。
          </p>

          {/* Subjects Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="px-4 py-2.5 text-left rounded-tl-lg font-medium">学科</th>
                  <th className="px-4 py-2.5 text-center font-medium">期中成绩</th>
                  <th className="px-4 py-2.5 text-center font-medium">期末成绩</th>
                  <th className="px-4 py-2.5 text-center rounded-tr-lg font-medium">学期总体评价</th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.map((subj, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-700">{subj.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      {editMode ? (
                        <Input 
                          type="number" min={0} max={100}
                          value={subj.midterm ?? ""} 
                          onChange={e => updateSubject(idx, 'midterm', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 h-8 text-sm text-center mx-auto"
                        />
                      ) : (
                        <span className={subj.midterm && subj.midterm >= 80 ? "text-emerald-600 font-semibold" : "text-gray-700"}>
                          {subj.midterm ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {editMode ? (
                        <Input 
                          type="number" min={0} max={100}
                          value={subj.final ?? ""} 
                          onChange={e => updateSubject(idx, 'final', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 h-8 text-sm text-center mx-auto"
                        />
                      ) : (
                        <span className={subj.final && subj.final >= 80 ? "text-emerald-600 font-semibold" : "text-gray-700"}>
                          {subj.final ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {editMode ? (
                        <Input 
                          value={subj.evaluation} 
                          onChange={e => updateSubject(idx, 'evaluation', e.target.value)}
                          className="h-8 text-sm text-center mx-auto max-w-[100px]"
                          placeholder="良好/优秀"
                        />
                      ) : (
                        <Badge className={evalColor(subj.evaluation || scoreToEvaluation(subj.final))}>
                          {subj.evaluation || scoreToEvaluation(subj.final)}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Add subject row */}
                {editMode && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center">
                      <Button 
                        size="sm" variant="ghost" 
                        onClick={() => setReport({...report, subjects: [...report.subjects, {name: "新科目", midterm: null, final: null, evaluation: ""}]})}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        + 添加科目
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Analysis */}
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 mb-4">
            <p className="text-sm text-gray-600">
              本学期整体成绩良好，英语和科学科目表现优秀，学习态度认真，能积极吸收课堂知识。建议继续保持良好的学习习惯，进一步加强语文和数学的理解与应用能力。
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-500 text-white rounded-xl p-4 text-center">
              <p className="text-xs opacity-80">平均分</p>
              <p className="text-2xl font-bold mt-1">{overallAvg ?? "—"}</p>
            </div>
            <div className="bg-blue-500 text-white rounded-xl p-4 text-center">
              <p className="text-xs opacity-80">班级排名</p>
              {editMode ? (
                <Input value={report.class_rank} onChange={e => setReport({...report, class_rank: e.target.value})}
                  className="h-8 w-16 mx-auto text-sm bg-white/20 border-white/20 text-white placeholder-white/50 text-center mt-1" />
              ) : (
                <p className="text-2xl font-bold mt-1">{report.class_rank || "—"}</p>
              )}
            </div>
            <div className="bg-blue-500 text-white rounded-xl p-4 text-center">
              <p className="text-xs opacity-80">进步幅度</p>
              {editMode ? (
                <Input value={report.improvement} onChange={e => setReport({...report, improvement: e.target.value})}
                  className="h-8 w-16 mx-auto text-sm bg-white/20 border-white/20 text-white placeholder-white/50 text-center mt-1" />
              ) : (
                <p className="text-2xl font-bold mt-1">{report.improvement || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Section 2: Comprehensive Qualities ═══ */}
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Star className="h-4 w-4" />二、综合素质
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-4">
            在学习之外，我积极参加学校组织的各项活动，注重全面发展，提升自己的综合素质。
          </p>

          {/* Activities */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">活动参与：</p>
            {(report.activities || []).length === 0 && !editMode ? (
              <p className="text-gray-400 text-sm">暂无记录</p>
            ) : (
              <ul className="space-y-1.5">
                {(report.activities || []).map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    {editMode ? (
                      <Input value={act} onChange={e => {
                        const newActs = [...(report.activities || [])]
                        newActs[i] = e.target.value
                        setReport({...report, activities: newActs})
                      }} className="h-7 text-sm flex-1" />
                    ) : act}
                  </li>
                ))}
              </ul>
            )}
            {editMode && (
              <Button size="sm" variant="ghost" className="text-xs text-gray-400 mt-1"
                onClick={() => setReport({...report, activities: [...(report.activities || []), ""]})}>
                + 添加活动
              </Button>
            )}
          </div>

          {/* Self-Evaluation */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">自我评价：</p>
            {editMode ? (
              <Textarea value={report.self_evaluation} onChange={e => setReport({...report, self_evaluation: e.target.value})}
                className="text-sm min-h-[60px]" placeholder="自我评价..." />
            ) : (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600">{report.self_evaluation || "—"}</p>
              </div>
            )}
          </div>

          {/* Teacher Comment */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">老师评语：</p>
            {editMode ? (
              <Textarea value={report.teacher_comment} onChange={e => setReport({...report, teacher_comment: e.target.value})}
                className="text-sm min-h-[60px]" placeholder="老师评语..." />
            ) : (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600">{report.teacher_comment || "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 3 & 4: Problems + Improvements ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Problems */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />三、存在问题
              </div>
            </div>
            {(report.problems || []).length === 0 && !editMode ? (
              <p className="text-gray-400 text-sm">暂无记录</p>
            ) : (
              <ul className="space-y-2">
                {(report.problems || []).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    {editMode ? (
                      <Input value={p} onChange={e => {
                        const arr = [...(report.problems || [])]
                        arr[i] = e.target.value
                        setReport({...report, problems: arr})
                      }} className="h-7 text-sm flex-1" />
                    ) : p}
                  </li>
                ))}
              </ul>
            )}
            {editMode && (
              <Button size="sm" variant="ghost" className="text-xs text-gray-400 mt-1"
                onClick={() => setReport({...report, problems: [...(report.problems || []), ""]})}>
                + 添加问题
              </Button>
            )}
          </div>

          {/* Improvements */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />改进措施与建议
              </div>
            </div>
            {(report.improvements || []).length === 0 && !editMode ? (
              <p className="text-gray-400 text-sm">暂无记录</p>
            ) : (
              <ul className="space-y-2">
                {(report.improvements || []).map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {editMode ? (
                      <Input value={imp} onChange={e => {
                        const arr = [...(report.improvements || [])]
                        arr[i] = e.target.value
                        setReport({...report, improvements: arr})
                      }} className="h-7 text-sm flex-1" />
                    ) : imp}
                  </li>
                ))}
              </ul>
            )}
            {editMode && (
              <Button size="sm" variant="ghost" className="text-xs text-gray-400 mt-1"
                onClick={() => setReport({...report, improvements: [...(report.improvements || []), ""]})}>
                + 添加建议
              </Button>
            )}
          </div>
        </div>

        {/* ═══ Section 5: Future Goals ═══ */}
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Flag className="h-4 w-4" />四、未来目标
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            在今后的学习和生活中，我将继续努力，争取在各方面取得更大的进步。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">学业提升</span>
              </div>
              {editMode ? (
                <Textarea value={report.future_goals_academic} onChange={e => setReport({...report, future_goals_academic: e.target.value})}
                  className="text-sm min-h-[60px] resize-none" placeholder="学业目标..." />
              ) : (
                <p className="text-sm text-gray-600">{report.future_goals_academic || "提高各科成绩，争取进入班级前列。"}</p>
              )}
            </div>
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">综合能力</span>
              </div>
              {editMode ? (
                <Textarea value={report.future_goals_ability} onChange={e => setReport({...report, future_goals_ability: e.target.value})}
                  className="text-sm min-h-[60px] resize-none" placeholder="能力目标..." />
              ) : (
                <p className="text-sm text-gray-600">{report.future_goals_ability || "积极参与更多课外活动，提升自己的组织和沟通能力。"}</p>
              )}
            </div>
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">品格发展</span>
              </div>
              {editMode ? (
                <Textarea value={report.future_goals_character} onChange={e => setReport({...report, future_goals_character: e.target.value})}
                  className="text-sm min-h-[60px] resize-none" placeholder="品格目标..." />
              ) : (
                <p className="text-sm text-gray-600">{report.future_goals_character || "培养良好的学习和生活习惯，做一个全面发展的学生。"}</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Section 6: Summary + Parent Feedback ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Summary */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                <FileText className="h-4 w-4" />五、总结
              </div>
            </div>
            {editMode ? (
              <Textarea value={report.summary} onChange={e => setReport({...report, summary: e.target.value})}
                className="text-sm min-h-[100px]" placeholder="学期总结..." />
            ) : (
              <p className="text-sm text-gray-600">{report.summary || "—"}</p>
            )}
          </div>

          {/* Parent Feedback */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                <Heart className="h-4 w-4" />家长反馈
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">家长意见/建议：</p>
                {editMode ? (
                  <Textarea value={report.parent_feedback} onChange={e => setReport({...report, parent_feedback: e.target.value})}
                    className="text-sm min-h-[50px]" placeholder="家长反馈..." />
                ) : (
                  <div className="min-h-[50px] border-b border-gray-200 text-sm text-gray-600 py-1">
                    {report.parent_feedback || "________________________"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">家长签名：</p>
                {editMode ? (
                  <Input value={report.parent_signature} onChange={e => setReport({...report, parent_signature: e.target.value})}
                    className="text-sm h-8" placeholder="签名" />
                ) : (
                  <div className="min-h-[24px] border-b border-gray-200 text-sm text-gray-600 py-1">
                    {report.parent_signature || "________________________"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">日期：</p>
                {editMode ? (
                  <Input type="date" value={report.parent_date?.split('T')[0] || ""} onChange={e => setReport({...report, parent_date: e.target.value})}
                    className="text-sm h-8" />
                ) : (
                  <div className="min-h-[24px] border-b border-gray-200 text-sm text-gray-600 py-1">
                    {report.parent_date ? formatDate(report.parent_date) : "________________________"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Footer Banner ═══ */}
        <div className="bg-gray-700 text-white text-center py-3 rounded-xl text-sm font-medium">
          自信自强 | 勤学善思 | 合作共进 | 全面发展
        </div>

      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #student-report-print, #student-report-print * {
            visibility: visible;
          }
          #student-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .glass-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
        }
      `}</style>
    </PageLayout>
  )
}
