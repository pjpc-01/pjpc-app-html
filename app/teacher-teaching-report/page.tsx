"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import { useTeachers } from "@/hooks/useTeachers"
import {
  FileText, Save, Send, Plus, Trash2, Edit, ArrowLeft,
  Users, BookOpen, Target, AlertTriangle,
  ClipboardList, User, Calendar, Image,
} from "lucide-react"
import { toast } from "sonner"

// ── Constants ──
const RATING_OPTIONS = ["优秀", "良好", "中等", "待改善"] as const
type Rating = typeof RATING_OPTIONS[number]

const SUBJECT_OPTIONS = [
  "华文", "国文", "英文", "数学", "科学",
  "历史", "地理", "道德", "美术", "体育", "音乐",
  "电脑", "科学与工艺", "RBT", "会计", "经济",
  "物理", "化学", "生物", "高数",
]

const GRADE_OPTIONS = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "中一", "中二", "中三", "中四", "中五", "中六",
]

// 年级中文显示映射 — 兼容各种 raw grade 格式
const GRADE_DISPLAY: Record<string, string> = {
  "Standard 1": "一年级", "Standard 2": "二年级", "Standard 3": "三年级",
  "Standard 4": "四年级", "Standard 5": "五年级", "Standard 6": "六年级",
  "Form 1": "中一", "Form 2": "中二", "Form 3": "中三",
  "Form 4": "中四", "Form 5": "中五", "Form 6": "中六",
  "Peralihan": "预备班",
  "1": "一年级", "2": "二年级", "3": "三年级",
  "4": "四年级", "5": "五年级", "6": "六年级",
  "7": "中一", "8": "中二", "9": "中三",
  "10": "中四", "11": "中五", "12": "中六",
  "y1": "一年级", "y2": "二年级", "y3": "三年级",
  "y4": "四年级", "y5": "五年级", "y6": "六年级",
  "y7": "中一", "y8": "中二", "y9": "中三",
  "y10": "中四", "y11": "中五", "y12": "中六",
}
const toGradeDisplay = (grade: string): string => GRADE_DISPLAY[grade] || grade

const ASSESSMENT_PERIODS = [
  { value: "first", label: "第一次（1–4月）" },
  { value: "second", label: "第二次（5–8月）" },
  { value: "third", label: "第三次（9–12月）" },
]

const PROGRESS_STATUSES = [
  { value: "on_track", label: "已达到课程进度" },
  { value: "ahead", label: "略快于课程进度" },
  { value: "behind", label: "略慢于课程进度" },
]

const PROBLEM_OPTIONS = [
  "阅读理解", "生字/词汇", "拼音", "写作",
  "数学计算", "应用题", "英文 Grammar", "国文 Tatabahasa",
  "上课专注力", "功课完成率",
]

const PLAN_OPTIONS = [
  "按照教学计划继续进行", "加强基础", "增加练习",
  "进行复习", "安排测验", "加强考试技巧",
]

const PERFORMANCE_COLUMNS: { key: keyof StudentPerformance; label: string }[] = [
  { key: "focus", label: "课堂专注力" },
  { key: "attitude", label: "学习态度" },
  { key: "participation", label: "课堂参与" },
  { key: "homework", label: "功课完成率" },
  { key: "understanding", label: "学习理解能力" },
  { key: "application", label: "应用能力" },
]

// ── Types ──
interface StudentPerformance {
  student_name: string
  student_grade: string
  focus: Rating
  attitude: Rating
  participation: Rating
  homework: Rating
  understanding: Rating
  application: Rating
}

type AnalysisLevel = "" | "excellent" | "attention"

interface TeachingReport {
  id?: string
  teacher_id: string
  teacher_name: string
  subject: string
  grade: string
  date: string
  assessment_period: string
  teaching_content: string
  progress_status: string
  progress_reason: string
  student_performances: StudentPerformance[]
  excellent_students: string
  attention_students: string
  common_problems: string[]
  other_problem: string
  biggest_progress: string
  main_challenge: string
  teaching_effectiveness: string
  next_plan_options: string[]
  next_plan_other: string
  assistance_needed: string
  teacher_signature: string
  reviewer: string
  status: string
  center: string
}

const emptyReport = (teacherId: string, teacherName: string, center: string): TeachingReport => ({
  teacher_id: teacherId,
  teacher_name: teacherName,
  subject: "",
  grade: "",
  date: new Date().toISOString().split("T")[0],
  assessment_period: "",
  teaching_content: "",
  progress_status: "",
  progress_reason: "",
  student_performances: [],
  excellent_students: "",
  attention_students: "",
  common_problems: [],
  other_problem: "",
  biggest_progress: "",
  main_challenge: "",
  teaching_effectiveness: "",
  next_plan_options: [],
  next_plan_other: "",
  assistance_needed: "",
  teacher_signature: "",
  reviewer: "",
  status: "draft",
  center,
})

// ── API helpers ──
const API_BASE = "/api/pocketbase-proxy/api/collections/teacher_teaching_reports"

async function uploadFiles(recordId: string, fieldName: string, files: File[]): Promise<void> {
  if (files.length === 0) return
  const formData = new FormData()
  // Use fieldName+ to append files
  files.forEach(f => formData.append(fieldName + "+", f))
  await fetch(`${API_BASE}/records/${recordId}`, {
    method: "PATCH",
    body: formData,
  })
}

async function saveReport(report: TeachingReport, photoFiles?: File[], docFiles?: File[]): Promise<string> {
  const isNew = !report.id
  const url = isNew ? `${API_BASE}/records` : `${API_BASE}/records/${report.id}`
  const method = isNew ? "POST" : "PATCH"

  const body: any = {
    teacher_id: report.teacher_id,
    teacher_name: report.teacher_name,
    subject: report.subject,
    grade: report.grade,
    date: report.date,
    assessment_period: report.assessment_period,
    teaching_content: report.teaching_content,
    progress_status: report.progress_status,
    progress_reason: report.progress_reason,
    student_performances: report.student_performances,
    excellent_students: report.excellent_students,
    attention_students: report.attention_students,
    common_problems: report.common_problems,
    other_problem: report.other_problem,
    biggest_progress: report.biggest_progress,
    main_challenge: report.main_challenge,
    teaching_effectiveness: report.teaching_effectiveness,
    next_plan_options: report.next_plan_options,
    next_plan_other: report.next_plan_other,
    assistance_needed: report.assistance_needed,
    teacher_signature: report.teacher_signature,
    reviewer: report.reviewer,
    status: report.status,
    center: report.center,
  }

  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error(await resp.text())
  const data = await resp.json()
  return data.id || report.id || ""
}

async function fetchReport(id: string): Promise<TeachingReport | null> {
  const resp = await fetch(`${API_BASE}/records/${id}`)
  if (!resp.ok) return null
  const data = await resp.json()
  return {
    id: data.id,
    teacher_id: data.teacher_id || "",
    teacher_name: data.teacher_name || "",
    subject: data.subject || "",
    grade: data.grade || "",
    date: data.date || "",
    assessment_period: data.assessment_period || "",
    teaching_content: data.teaching_content || "",
    progress_status: data.progress_status || "",
    progress_reason: data.progress_reason || "",
    student_performances: data.student_performances || [],
    excellent_students: data.excellent_students || "",
    attention_students: data.attention_students || "",
    common_problems: data.common_problems || [],
    other_problem: data.other_problem || "",
    biggest_progress: data.biggest_progress || "",
    main_challenge: data.main_challenge || "",
    teaching_effectiveness: data.teaching_effectiveness || "",
    next_plan_options: data.next_plan_options || [],
    next_plan_other: data.next_plan_other || "",
    assistance_needed: data.assistance_needed || "",
    teacher_signature: data.teacher_signature || "",
    reviewer: data.reviewer || "",
    status: data.status || "draft",
    center: data.center || "",
    _photos: (data.photos || []).map((f: string) => 
      `/api/pocketbase-proxy/api/files/teacher_teaching_reports/${data.id}/${f}`
    ),
    _documents: (data.documents || []).map((f: string) =>
      `/api/pocketbase-proxy/api/files/teacher_teaching_reports/${data.id}/${f}`
    ),
  }
}

async function fetchReports(opts: { teacherId?: string; grade?: string; page?: number; perPage?: number; bin?: boolean } = {}): Promise<{ items: any[]; totalPages: number; totalItems: number }> {
  const { teacherId, grade, page = 1, perPage = 15, bin = false } = opts
  // Load ALL matching records, then sort + paginate client-side (PB proxy can't sort by created field)
  const allUrl = `${API_BASE}/records?perPage=500`
  const resp = await fetch(allUrl)
  if (!resp.ok) return { items: [], totalPages: 1, totalItems: 0 }
  const data = await resp.json()
  let items = (data.items || []) as any[]
  
  // Filter deleted/non-deleted
  items = items.filter((r: any) => bin ? r.deleted === true : !r.deleted)
  
  // Filter
  if (teacherId) items = items.filter((r: any) => r.teacher_id === teacherId)
  if (grade) items = items.filter((r: any) => r.grade === grade)
  
  // Sort by date descending, then created descending (newest first)
  items.sort((a: any, b: any) => {
    const dateDiff = new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
    if (dateDiff !== 0) return dateDiff
    return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()
  })
  
  const total = items.length
  const totalPages = Math.ceil(total / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)
  return { items: paged, totalPages, totalItems: total }
}

async function deleteReport(id: string): Promise<void> {
  await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" })
}

// ── Main Component ──
export default function TeacherTeachingReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { teacher } = useCurrentTeacher()
  const { teachers, loading: teachersLoading } = useTeachers()

  // Fetch students directly instead of using useStudents hook
  const [students, setStudents] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/students/records?perPage=500&sort=name")
      .then(r => r.json())
      .then(d => setStudents(d.items || []))
      .catch(e => console.error("Failed to load students:", e))
  }, [])

  const editId = searchParams.get("id")
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<TeachingReport>(
    emptyReport(teacher?.id || "", teacher?.name || teacher?.teacher_name || "", teacher?.center_assignment || "")
  )
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "new" | "edit" | "view">("list")
  const [viewReportId, setViewReportId] = useState<string | null>(null)
  const [analysisLevels, setAnalysisLevels] = useState<Record<number, AnalysisLevel>>({})
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [docFiles, setDocFiles] = useState<File[]>([])
  const [binTab, setBinTab] = useState(false)

  // ── 筛选 + 分页 ──
  const [filterTeacher, setFilterTeacher] = useState("")
  const [filterGrade, setFilterGrade] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const PER_PAGE = 15

  // Set report editing mode
  useEffect(() => {
    if (editId) {
      setViewReportId(editId)
      setViewMode("view")
    }
  }, [editId])

  // Load reports — admin sees all, teachers see only their own
  const loadReports = useCallback(async (pageNum = 1) => {
    setLoading(true)
    const isAdmin = user?.role === "admin"
    const tid = (!isAdmin && (teacher?.id || user?.teacher_id)) ? (teacher?.id || user?.teacher_id) : undefined
    const effTeacherId = filterTeacher && filterTeacher !== '__all__' ? filterTeacher : tid || undefined
    const effGrade = filterGrade && filterGrade !== '__all__' ? filterGrade : undefined
    const { items, totalPages: tp, totalItems: ti } = await fetchReports({
      teacherId: effTeacherId,
      grade: effGrade,
      page: pageNum,
      perPage: PER_PAGE,
      bin: binTab,
    })
    setReports(items)
    setTotalPages(tp)
    setTotalItems(ti)
    setPage(pageNum)
    setLoading(false)
  }, [teacher?.id, user?.teacher_id, user?.role, filterTeacher, filterGrade, binTab])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Load report for viewing/editing
  useEffect(() => {
    if (viewReportId && viewMode === "view") {
      fetchReport(viewReportId).then(r => {
        if (r) {
          setReport(r)
          // Restore analysis levels from excellent/attention fields
          const levels: Record<number, AnalysisLevel> = {}
          const excellentNames = (r.excellent_students || "").split("\n").filter(Boolean).map(s => s.trim())
          const attentionNames = (r.attention_students || "").split("\n").filter(Boolean).map(s => s.trim())
          r.student_performances.forEach((p, i) => {
            if (excellentNames.includes(p.student_name)) levels[i] = "excellent"
            else if (attentionNames.includes(p.student_name)) levels[i] = "attention"
          })
          setAnalysisLevels(levels)
        }
      })
    }
  }, [viewReportId, viewMode])

  // Update report with teacher info
  useEffect(() => {
    if (teacher?.id && !report.teacher_id) {
      setReport(prev => ({
        ...prev,
        teacher_id: teacher.id,
        teacher_name: teacher.name || teacher.teacher_name || "",
        center: teacher.center_assignment || prev.center,
      }))
    }
  }, [teacher, report.teacher_id])

  // All available students
  const centerStudents = students || []

  // Sync analysis levels to excellent_students / attention_students text fields
  const syncAnalysis = (levels: Record<number, AnalysisLevel>) => {
    setAnalysisLevels(levels)
    const excellent: string[] = []
    const attention: string[] = []
    report.student_performances.forEach((p, i) => {
      if (levels[i] === "excellent") excellent.push(p.student_name)
      else if (levels[i] === "attention") attention.push(p.student_name)
    })
    setReport(prev => ({
      ...prev,
      excellent_students: excellent.join("\n"),
      attention_students: attention.join("\n"),
    }))
  }

  // ── Handlers ──
  const updateField = (field: keyof TeachingReport, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: "common_problems" | "next_plan_options", value: string) => {
    setReport(prev => {
      const arr = prev[field] as string[]
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const updatePerformance = (idx: number, key: keyof StudentPerformance, value: string) => {
    setReport(prev => {
      const perfs = [...prev.student_performances]
      perfs[idx] = { ...perfs[idx], [key]: value }
      return { ...prev, student_performances: perfs }
    })
  }

  const addStudentToPerformance = (studentId: string) => {
    if (!studentId) return
    const student: any = centerStudents.find((s: any) => s.id === studentId)
    if (!student) return
    const name = student.name || student.student_name || ""
    if (report.student_performances.some(p => p.student_name === name)) return
    setReport(prev => ({
      ...prev,
      student_performances: [
        ...prev.student_performances,
        {
          student_name: name,
          student_grade: toGradeDisplay(student.grade || ""),
          focus: "优秀", attitude: "优秀", participation: "优秀",
          homework: "优秀", understanding: "优秀", application: "优秀",
        },
      ],
    }))
  }

  const removePerformance = (idx: number) => {
    setReport(prev => ({
      ...prev,
      student_performances: prev.student_performances.filter((_, i) => i !== idx),
    }))
    const newLevels = { ...analysisLevels }
    delete newLevels[idx]
    // Re-index
    const reindexed: Record<number, AnalysisLevel> = {}
    Object.entries(newLevels).forEach(([k, v]) => {
      const oldIdx = parseInt(k)
      if (oldIdx > idx) reindexed[oldIdx - 1] = v
      else if (oldIdx < idx) reindexed[oldIdx] = v
    })
    syncAnalysis(reindexed)
  }

  const setAnalysisForStudent = (idx: number, level: AnalysisLevel) => {
    const newLevels = { ...analysisLevels }
    if (newLevels[idx] === level) {
      delete newLevels[idx]
    } else {
      newLevels[idx] = level
    }
    syncAnalysis(newLevels)
  }

  const handleSave = async (submitStatus: string = "draft") => {
    if (!report.teacher_id) {
      toast.error("请先选择教师")
      return
    }
    setSaving(true)
    try {
      const id = await saveReport({ ...report, status: submitStatus }, photoFiles, docFiles)
      // Upload files if any
      const recordId = id
      if (photoFiles.length > 0) await uploadFiles(recordId, "photos", photoFiles)
      if (docFiles.length > 0) await uploadFiles(recordId, "documents", docFiles)
      setPhotoFiles([])
      setDocFiles([])
      toast.success(submitStatus === "submitted" ? "报告已提交" : "草稿已保存")
      if (submitStatus === "submitted") {
        setViewMode("list")
        loadReports()
      } else {
        if (!report.id && id) {
          setReport(prev => ({ ...prev, id }))
        }
        setViewMode("view")
        setViewReportId(id || report.id || null)
      }
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"))
    } finally {
      setSaving(false)
    }
  }

  // 软删除
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这份报告吗？将移入回收站。")) return
    try {
      await fetch(`${API_BASE}/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      })
      toast.success("已移入回收站")
      loadReports()
    } catch {
      toast.error("删除失败")
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await fetch(`${API_BASE}/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: false }),
      })
      toast.success("已还原")
      loadReports()
    } catch {
      toast.error("还原失败")
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("确定要永久删除吗？此操作不可恢复！")) return
    try {
      await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" })
      toast.success("已永久删除")
      loadReports()
    } catch {
      toast.error("删除失败")
    }
  }

  const handleStartNew = () => {
    setReport(emptyReport(
      teacher?.id || report.teacher_id,
      teacher?.name || teacher?.teacher_name || report.teacher_name,
      teacher?.center_assignment || report.center
    ))
    setAnalysisLevels({})
    setViewMode("new")
  }

  const selectTeacher = (teacherId: string) => {
    const t: any = (teachers || []).find((t: any) => t.id === teacherId)
    if (t) {
      setReport(prev => ({
        ...prev,
        teacher_id: t.id,
        teacher_name: t.teacher_name || t.name || "",
        center: t.center || prev.center,
      }))
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "草稿", variant: "secondary" },
      submitted: { label: "已提交", variant: "default" },
      reviewed: { label: "已审核", variant: "outline" },
    }
    const s = map[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  // ── Render: List View ──
  if (viewMode === "list") {
    return (
      <PageLayout
        title="教学进度与评估报告"
        description="兼职老师教学进展和学生程度评估"
        userRole="admin"
        status="系统正常"
        background="bg-gray-50"
        actions={
          <Button onClick={handleStartNew} className="gap-2">
            <Plus className="h-4 w-4" />
            新建报告
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {binTab ? "🗑️ 回收站" : "报告列表"}
              </CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant={!binTab ? "default" : "ghost"} onClick={() => { setBinTab(false); setPage(1); }}>报告列表</Button>
                <Button size="sm" variant={binTab ? "default" : "ghost"} onClick={() => { setBinTab(true); setPage(1); }}>🗑️ 回收站</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 筛选栏 */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={filterTeacher} onValueChange={(v) => { setFilterTeacher(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="全部教师" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部教师</SelectItem>
                  {teachers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.teacher_name || t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="全部年级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部年级</SelectItem>
                  {GRADE_OPTIONS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => { setFilterTeacher(""); setFilterGrade(""); setPage(1); }}>
                重置
              </Button>
            </div>
            {loading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无教学报告</p>
                <Button onClick={handleStartNew} variant="outline" className="mt-3 gap-2">
                  <Plus className="h-4 w-4" />
                  创建第一份报告
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setViewReportId(r.id)
                      setViewMode("view")
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-medium">
                          {r.subject || "未指定科目"} — {r.grade || "未指定年级"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {r.teacher_name} · {r.date} · {ASSESSMENT_PERIODS.find(p => p.value === r.assessment_period)?.label || r.assessment_period}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(r.status)}
                      {binTab ? (
                        <>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleRestore(r.id); }}>
                            还原
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePermanentDelete(r.id); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(r.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  共 {totalItems} 条，每页 {PER_PAGE} 条
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === page ? "default" : "outline"}
                      onClick={() => loadReports(p)}
                      className="min-w-[32px] h-8"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  // ── Render: View/Edit/New Form ──
  const isView = viewMode === "view"

  // Rating badge variant
  const ratingVariant = (r: string) =>
    r === "优秀" ? "default" : r === "良好" ? "secondary" : r === "中等" ? "outline" : "destructive"

  return (
    <PageLayout
      title={isView ? "查看教学报告" : viewMode === "edit" ? "编辑教学报告" : "新建教学报告"}
      description="兼职老师教学进展和学生程度评估"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      backUrl="#"
      actions={
        <div className="flex gap-2">
          {isView ? (
            <>
              <Button variant="outline" onClick={() => setViewMode("edit")} className="gap-2">
                <Edit className="h-4 w-4" />
                编辑
              </Button>
              <Button variant="outline" onClick={() => setViewMode("list")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回列表
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                保存草稿
              </Button>
              <Button onClick={() => handleSave("submitted")} disabled={saving} className="gap-2">
                <Send className="h-4 w-4" />
                提交报告
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── SECTION 1: Header ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg">教学进度与学生学习评估表</CardTitle>
          </CardHeader>
        </Card>

        {/* ── SECTION 2: 评估期间 + 基本信息 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              评估期间 & 基本信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 评估期间 */}
              <div>
                <Label className="mb-2 block font-semibold">评估期间 Assessment Period</Label>
                <div className="flex gap-4 flex-wrap">
                  {ASSESSMENT_PERIODS.map(p => (
                    <label key={p.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="assessment_period"
                        value={p.value}
                        checked={report.assessment_period === p.value}
                        onChange={() => updateField("assessment_period", p.value)}
                        disabled={isView}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 基本信息 grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>教师 Teacher</Label>
                  {isView ? (
                    <Input value={report.teacher_name} disabled />
                  ) : (
                    <Select
                      value={report.teacher_id || ""}
                      onValueChange={selectTeacher}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择教师..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {(teachers || []).map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.teacher_name || t.name || t.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>科目 Subject</Label>
                  {isView ? (
                    <Input value={report.subject} disabled />
                  ) : (
                    <Select
                      value={report.subject}
                      onValueChange={v => updateField("subject", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择科目..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {SUBJECT_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>年级 Grade</Label>
                  {isView ? (
                    <Input value={report.grade} disabled />
                  ) : (
                    <Select
                      value={report.grade}
                      onValueChange={v => updateField("grade", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择年级..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {GRADE_OPTIONS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>填写日期 Date</Label>
                  <Input
                    type="date"
                    value={report.date}
                    onChange={e => updateField("date", e.target.value)}
                    disabled={isView}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 3: 教学进度 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              教学进度 Teaching Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>本阶段已完成的教学内容</Label>
                <Textarea
                  value={report.teaching_content}
                  onChange={e => updateField("teaching_content", e.target.value)}
                  disabled={isView}
                  placeholder="教材 / 单元 / 章节，每行一个"
                  rows={4}
                />
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block font-semibold">目前教学进度</Label>
                <div className="flex gap-4 flex-wrap mb-3">
                  {PROGRESS_STATUSES.map(p => (
                    <label key={p.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="progress_status"
                        value={p.value}
                        checked={report.progress_status === p.value}
                        onChange={() => updateField("progress_status", p.value)}
                        disabled={isView}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>原因 Reason</Label>
                <Textarea
                  value={report.progress_reason}
                  onChange={e => updateField("progress_reason", e.target.value)}
                  disabled={isView}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 4: 学生整体学习表现 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              学生整体学习表现 Overall Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add student selector — filtered by selected grade */}
            {!isView && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {!report.grade ? (
                  <p className="text-sm text-gray-400">请先在基本信息中选择年级，再添加学生</p>
                ) : (() => {
                  const gradeStudents = centerStudents
                    .filter((s: any) => toGradeDisplay(s.grade) === report.grade)
                    .filter((s: any) => !report.student_performances.some(p => p.student_name === (s.name || s.student_name)))
                  return (
                    <>
                      <Select value="" onValueChange={addStudentToPerformance}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder={`选择 ${report.grade} 的学生添加...（${gradeStudents.length}人）`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {gradeStudents.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-gray-400 text-center">
                              该年级没有可添加的学生
                            </div>
                          ) : (
                            gradeStudents.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name || s.student_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-gray-400 self-center">
                        共 {centerStudents.length} 名学生，{gradeStudents.length} 名匹配 {report.grade}
                      </span>
                    </>
                  )
                })()}
              </div>
            )}

            {report.student_performances.length === 0 ? (
              <p className="text-gray-400 text-center py-4">尚未添加学生</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>年级</TableHead>
                      {PERFORMANCE_COLUMNS.map(col => (
                        <TableHead key={col.key} className="text-center">{col.label}</TableHead>
                      ))}
                      {!isView && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.student_performances.map((perf, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{perf.student_name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{perf.student_grade}</TableCell>
                        {PERFORMANCE_COLUMNS.map(col => (
                          <TableCell key={col.key} className="text-center">
                            {isView ? (
                              <Badge variant={ratingVariant(perf[col.key])}>
                                {perf[col.key]}
                              </Badge>
                            ) : (
                              <Select
                                value={perf[col.key] || "优秀"}
                                onValueChange={v => updatePerformance(idx, col.key, v)}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RATING_OPTIONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        ))}
                        {!isView && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => removePerformance(idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 5: 学生程度分析 (表格形式) ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              学生程度分析 Student Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 学生程度表格 */}
              {report.student_performances.length === 0 ? (
                <p className="text-gray-400 text-center py-4">请先在「学生整体学习表现」中添加学生</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>年级</TableHead>
                        {PERFORMANCE_COLUMNS.map(col => (
                          <TableHead key={col.key} className="text-center">{col.label}</TableHead>
                        ))}
                        <TableHead className="text-center w-32">程度分类</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.student_performances.map((perf, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{perf.student_name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{perf.student_grade}</TableCell>
                          {PERFORMANCE_COLUMNS.map(col => (
                            <TableCell key={col.key} className="text-center">
                              <Badge variant={ratingVariant(perf[col.key])}>
                                {perf[col.key]}
                              </Badge>
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            {isView ? (
                              analysisLevels[idx] === "excellent" ? (
                                <Badge variant="default" className="bg-green-600">掌握良好</Badge>
                              ) : analysisLevels[idx] === "attention" ? (
                                <Badge variant="destructive">需关注</Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant={analysisLevels[idx] === "excellent" ? "default" : "outline"}
                                  className="h-7 text-xs px-2"
                                  onClick={() => setAnalysisForStudent(idx, "excellent")}
                                >
                                  优秀
                                </Button>
                                <Button
                                  size="sm"
                                  variant={analysisLevels[idx] === "attention" ? "destructive" : "outline"}
                                  className="h-7 text-xs px-2"
                                  onClick={() => setAnalysisForStudent(idx, "attention")}
                                >
                                  关注
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator />

              {/* 学生普遍遇到的问题 */}
              <div>
                <Label className="font-semibold mb-2 block">学生普遍遇到的问题</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PROBLEM_OPTIONS.map(problem => (
                    <label key={problem} className="flex items-center gap-2">
                      <Checkbox
                        checked={report.common_problems.includes(problem)}
                        onCheckedChange={() => toggleArrayField("common_problems", problem)}
                        disabled={isView}
                      />
                      <span className="text-sm">{problem}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">其他：</span>
                  <Input
                    value={report.other_problem}
                    onChange={e => updateField("other_problem", e.target.value)}
                    disabled={isView}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 6: 教学总结 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              本阶段教学总结 Teacher&apos;s Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">最大进步</Label>
                <Textarea
                  value={report.biggest_progress}
                  onChange={e => updateField("biggest_progress", e.target.value)}
                  disabled={isView}
                  rows={3}
                />
              </div>
              <div>
                <Label className="font-semibold">主要挑战</Label>
                <Textarea
                  value={report.main_challenge}
                  onChange={e => updateField("main_challenge", e.target.value)}
                  disabled={isView}
                  rows={3}
                />
              </div>
              <div>
                <Label className="font-semibold">教学成效</Label>
                <Textarea
                  value={report.teaching_effectiveness}
                  onChange={e => updateField("teaching_effectiveness", e.target.value)}
                  disabled={isView}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 7: 下一阶段教学计划 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              下一阶段教学计划 Next Teaching Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PLAN_OPTIONS.map(plan => (
                  <label key={plan} className="flex items-center gap-2">
                    <Checkbox
                      checked={report.next_plan_options.includes(plan)}
                      onCheckedChange={() => toggleArrayField("next_plan_options", plan)}
                      disabled={isView}
                    />
                    <span className="text-sm">{plan}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">其他：</span>
                <Input
                  value={report.next_plan_other}
                  onChange={e => updateField("next_plan_other", e.target.value)}
                  disabled={isView}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 8: 需中心协助事项 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              需要中心协助事项 (如有)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={report.assistance_needed}
              onChange={e => updateField("assistance_needed", e.target.value)}
              disabled={isView}
              rows={3}
              placeholder="需要中心协助的事项..."
            />
          </CardContent>
        </Card>

        {/* ── SECTION 9: 签名 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              签名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>教师签名</Label>
                <Input
                  value={report.teacher_signature}
                  onChange={e => updateField("teacher_signature", e.target.value)}
                  disabled={isView}
                  placeholder="教师签名"
                />
              </div>
              <div>
                <Label>审核</Label>
                <Input
                  value={report.reviewer}
                  onChange={e => updateField("reviewer", e.target.value)}
                  disabled={isView}
                  placeholder="审核人"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 10: 照片 & 文档上传 ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Image className="h-4 w-4" />
              照片 & 文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 照片上传 */}
              <div>
                <Label className="font-semibold mb-2 block">照片（课堂活动、学生作业等）</Label>
                {isView ? (
                  <div className="flex gap-2 flex-wrap">
                    {(report as any)._photos?.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`photo-${i}`} className="h-20 w-20 object-cover rounded border" />
                      </a>
                    )) || <span className="text-sm text-gray-400">无照片</span>}
                  </div>
                ) : (
                  <>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setPhotoFiles(prev => [...prev, ...files])
                      }}
                      className="mb-2"
                    />
                    {photoFiles.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {photoFiles.map((f, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              className="h-16 w-16 object-cover rounded border"
                            />
                            <button
                              onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              ×
                            </button>
                            <span className="text-[10px] text-gray-500 truncate block w-16">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(report as any)._photos?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">已有 {(report as any)._photos.length} 张照片（新上传会追加）</p>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* 文档上传 */}
              <div>
                <Label className="font-semibold mb-2 block">文档（教案、习题等）</Label>
                {isView ? (
                  <div className="flex gap-2 flex-wrap">
                    {(report as any)._documents?.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                      >
                        <FileText className="h-4 w-4" />
                        {decodeURIComponent(url.split('/').pop()?.split('_').slice(1).join('_') || `文档${i+1}`)}
                      </a>
                    )) || <span className="text-sm text-gray-400">无文档</span>}
                  </div>
                ) : (
                  <>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setDocFiles(prev => [...prev, ...files])
                      }}
                      className="mb-2"
                    />
                    {docFiles.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {docFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>{f.name}</span>
                            <button
                              onClick={() => setDocFiles(prev => prev.filter((_, j) => j !== i))}
                              className="text-red-500 text-xs hover:underline"
                            >
                              移除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom buttons for non-view mode */}
        {!isView && (
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => setViewMode("list")}>
              取消
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </Button>
            <Button onClick={() => handleSave("submitted")} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              提交报告
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
