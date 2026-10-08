"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudentReports, StudentReport, ReportSubject } from "@/hooks/useStudentReports"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import { scoreToGrade, gradeColorClass, formatGrade } from "@/lib/utils"
import {
  ArrowLeft, Printer, Download, Save, Edit3, FileText,
  Loader2, Settings, X, PlusCircle
} from "lucide-react"
import ReportSettingsManager, { type ReportSettingsPreset } from "@/app/components/report/ReportSettingsManager"
import { downloadReportPDF, generateReportHTML, resolveEnrichment, resolveEnrichmentSubjects } from "@/lib/pdf-generator"
import { useLanguage } from "@/contexts/language-context";

const DEFAULT_SUBJECTS = ["华文", "国文", "英文", "科学", "数学"]
const SETTINGS_KEY = "student_report_default_subjects"

// 科目评价「完毕」判定：写了具体内容（上课认真/态度积极/作业情况…），不是「待加强/微弱」这类简评
const SUBJECT_SIMPLE_WORDS = ["待加强", "微弱", "需加强", "待改进", "需要加强", "较差", "一般"]
const isSubjectEvaluationComplete = (subj: any): boolean => {
  const ev = (subj?.evaluation || "").trim()
  if (!ev) return false
  if (SUBJECT_SIMPLE_WORDS.some(w => ev.includes(w)) && ev.length < 20 && !/[，。.!？,]/.test(ev)) return false
  return true
}

const loadDefaultSubjects = (): string[] => {
  if (typeof window === "undefined") return DEFAULT_SUBJECTS
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_SUBJECTS
}

const saveDefaultSubjects = async (subjects: string[], presetId?: string) => {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(subjects))
  // Also persist to PB report_settings（有 presetId 就写那一份，没有才退回 isDefault）
  try {
    let targetId = presetId
    if (!targetId) {
      const res = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?filter=(isDefault=true)&perPage=1')
      if (res.ok) {
        const data = await res.json()
        targetId = data.items?.[0]?.id
      }
    }
    if (targetId) {
      await fetch(`/api/pocketbase-proxy/api/collections/report_settings/records/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSubjects: subjects }),
      })
    }
  } catch (e) { console.error('Save defaultSubjects failed:', e) }
}

export default function StudentReportContent() {
  const { t } = useLanguage();
  const params = useParams()
  const router = useRouter()
  const reportId = params?.id as string
  const { loading, getReport, saveReport, deleteReport } = useStudentReports()
  const { students, loading: studentsLoading } = useStudents()
  const { user } = useAuth()
  const { teacher: currentTeacher, loading: teacherLoading } = useCurrentTeacher()
  const [report, setReport] = useState<StudentReport | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const printRef = useRef<any>(null)

  // ─── 老师只能改自己教的科目（按科目 + 学生年级）───
  // 从 courses 推导当前老师教的（科目, 年级）对；没该年级课程 → 该科只读
  const isTeacher = !!(user && user.role === 'teacher')
  const [teacherSubjects, setTeacherSubjects] = useState<string[] | null>(null)
  const [teacherCourseGrades, setTeacherCourseGrades] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!isTeacher || !currentTeacher?.id) {
      setTeacherSubjects(null)
      setTeacherCourseGrades({})
      return
    }
    let cancelled = false
    fetch(`/api/pocketbase-proxy/api/collections/courses/records?perPage=200&filter=(teacher_id='${currentTeacher.id}')`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const subs = Array.from(new Set(
          (d.items || []).map((c: any) => c.subject).filter(Boolean)
        )) as string[]
        setTeacherSubjects(subs)
        // 科目 -> 该老师教的年级集合（归一化）
        const gradeMap: Record<string, string[]> = {}
        ;(d.items || []).forEach((c: any) => {
          if (!c.subject) return
          const g = formatGrade(c.grade_level, c.is_peralihan) || ''
          if (!gradeMap[c.subject]) gradeMap[c.subject] = []
          if (g && !gradeMap[c.subject].includes(g)) gradeMap[c.subject].push(g)
        })
        setTeacherCourseGrades(gradeMap)
      })
      .catch(() => { if (!cancelled) { setTeacherSubjects(null); setTeacherCourseGrades({}) } })
    return () => { cancelled = true }
  }, [isTeacher, currentTeacher?.id])

  // 科目是否可被当前用户编辑：老师角色时，只允许自己教的（且匹配该学生年级的）科
  const canEditSubject = (subjName: string) => {
    if (!isTeacher) return true
    if (!teacherSubjects || teacherSubjects.length === 0) return true // 该老师没排课：不限制
    // 需匹配学生年级（student 在渲染时已就绪）
    const stu = student as any
    const stuGrade = formatGrade(stu?.grade, stu?.is_peralihan)
    if (!stuGrade) return true // 学生无年级：不限制（避免误伤）
    const grades = teacherCourseGrades[subjName] || []
    return grades.includes(stuGrade)
  }

  // Subject settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [defaultSubjects, setDefaultSubjects] = useState<string[]>(loadDefaultSubjects)
  const [newSubjectName, setNewSubjectName] = useState("")

  // ─── Report settings (customizable PDF format) ───
  const [reportSettings, setReportSettings] = useState<ReportSettingsPreset>({
    id: "default", name: "默认", schoolName: "", schoolNameEn: "", schoolLogo: "", schoolLogo2: "",
    schoolAddress: "", schoolPhone: "", schoolEmail: "", primaryColor: "#3b82f6",
    headerTitle: "学生报告", headerSubtitle: "— 全面发展 · 健康成长 · 追求卓越 —",
    footerText: "自信自强 | 勤学善思 | 合作共进 | 全面发展",
    defaultSubjects: ["华文","国文","英文","科学","数学"],
    growthMessage: "成长不在于做得最好，而在于愿意不断尝试、不断进步。{studentName}，继续加油！",
    problems: ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"],
    improvements: ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"],
    futureGoalAcademic: "提高各科成绩，争取进入班级前列。",
    futureGoalAbility: "积极参与更多课外活动，提升自己的组织和沟通能力。",
    futureGoalCharacter: "培养良好的学习和生活习惯，做一个全面发展的学生。",
    summary: "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
    sections: [
      { id: "growth", type: "growth", title: "成长寄语", enabled: true },
      { id: "academic", type: "subjects", title: "一、学业表现", enabled: true },
      { id: "problems", type: "problems", title: "二、存在问题", enabled: true },
      { id: "improvements", type: "improvements", title: "三、改进措施与建议", enabled: true },
      { id: "goals", type: "goals", title: "四、未来目标", enabled: true },
      { id: "summary", type: "summary", title: "五、总结", enabled: true },
    ],
    isDefault: true, createdAt: "", updatedAt: "",
  })
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  // Load report settings from PB
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?filter=(isDefault=true)&perPage=1')
        if (res.ok) {
          const data = await res.json()
          if (data.items?.length > 0) {
            const r = data.items[0]
            setReportSettings({
              id: r.id, name: r.name || "默认",
              schoolName: r.schoolName || "", schoolNameEn: r.schoolNameEn || "",
              schoolLogo: r.schoolLogo || "", schoolLogo2: r.schoolLogo2 || "", schoolAddress: r.schoolAddress || "",
              schoolPhone: r.schoolPhone || "", schoolEmail: r.schoolEmail || "",
              primaryColor: r.primaryColor || "#3b82f6",
              headerTitle: r.headerTitle || "学生报告",
              headerSubtitle: r.headerSubtitle || "— 全面发展 · 健康成长 · 追求卓越 —",
              footerText: r.footerText || "自信自强 | 勤学善思 | 合作共进 | 全面发展",
              defaultSubjects: r.defaultSubjects || ["华文", "国文", "英文", "科学", "数学"],
              growthMessage: r.growthMessage || "成长不在于做得最好，而在于愿意不断尝试、不断进步。{studentName}，继续加油！",
              problems: r.problems || ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"],
              improvements: r.improvements || ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"],
              futureGoalAcademic: r.futureGoalAcademic || "提高各科成绩，争取进入班级前列。",
              futureGoalAbility: r.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。",
              futureGoalCharacter: r.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。",
              summary: r.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
              sections: r.sections || [
                { id: "growth", type: "growth", title: "成长寄语", enabled: true },
                { id: "academic", type: "subjects", title: "一、学业表现", enabled: true },
                { id: "problems", type: "problems", title: "二、存在问题", enabled: true },
                { id: "improvements", type: "improvements", title: "三、改进措施与建议", enabled: true },
                { id: "goals", type: "goals", title: "四、未来目标", enabled: true },
                { id: "summary", type: "summary", title: "五、总结", enabled: true },
              ],
              isDefault: true, createdAt: r.created || "", updatedAt: r.updated || "",
            })
            // Also sync defaultSubjects to the editable state
            if (r.defaultSubjects?.length) {
              setDefaultSubjects(r.defaultSubjects)
              saveDefaultSubjects(r.defaultSubjects, r.id)
            }
          }
        }
      } catch {}
    }
    load()
  }, [])

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
  // 返回学生报告列表 + 保持当前年级（4年级→4年级，5年级→5年级）
  const backListUrl = (student as any)?.grade
    ? `/student-reports?grade=${encodeURIComponent(formatGrade((student as any).grade, (student as any).is_peralihan) || (student as any).grade || '')}`
    : "/student-reports"

  // Full avatar URL for report iframe/PDF (PB stores filename, not URL)
  const avatarSrc = (() => {
    const av = (student as any)?.avatar
    if (!av) return ''
    if (String(av).startsWith('http')) return av
    const cid = (student as any)?.collectionId || 'students'
    return `/api/pocketbase-proxy/api/files/${cid}/${report?.studentId}/${av}`
  })()

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

  // Subject settings handlers
  const handleAddDefaultSubject = () => {
    const name = newSubjectName.trim()
    if (!name || defaultSubjects.includes(name)) return
    const updated = [...defaultSubjects, name]
    setDefaultSubjects(updated)
    setReportSettings(prev => ({ ...prev, defaultSubjects: updated }))
    saveDefaultSubjects(updated, reportSettings.id)
    setNewSubjectName("")
  }

  const handleRemoveDefaultSubject = (name: string) => {
    const updated = defaultSubjects.filter(s => s !== name)
    setDefaultSubjects(updated)
    setReportSettings(prev => ({ ...prev, defaultSubjects: updated }))
    saveDefaultSubjects(updated, reportSettings.id)
  }

  const handleResetDefaultSubjects = () => {
    setDefaultSubjects([...DEFAULT_SUBJECTS])
    setReportSettings(prev => ({ ...prev, defaultSubjects: [...DEFAULT_SUBJECTS] }))
    saveDefaultSubjects([...DEFAULT_SUBJECTS], reportSettings.id)
  }

  // Print the iframe content
  const handlePrint = () => {
    const iframe = printRef.current as HTMLIFrameElement | null
    if (iframe?.contentWindow) {
      iframe.contentWindow.print()
    } else {
      window.print()
    }
  }

  // Use shared ENRICHMENT_MAP / resolveEnrichment from pdf-generator (single source of truth)
  const studentName = (student as any)?.name || ''
  // 学生中文名 → 命中的 Enrichment 课程名（未命中则为空 → 不显示栏）
  const matchedEnrichment = resolveEnrichment(studentName)
  const showEnrichment = !!matchedEnrichment
  // Enrichment 各科评价：优先用报告已存的 [{subject, evaluation}]，否则从名单生成（空评价）
  const enrichmentSubjects = ((): { subject: string; evaluation: string }[] => {
    if (!showEnrichment) return []
    if (Array.isArray(report?.enrichment) && report.enrichment.length > 0) return report.enrichment as any
    const defaults = resolveEnrichmentSubjects(studentName)
    // 若报告已有数据但少了名单里的科，补齐（保持已填评价）合并
    const existing = (Array.isArray(report?.enrichment) ? report.enrichment : []) as any[]
    const subjects = defaults.map(d => {
      const found = existing.find((e: any) => e.subject === d.subject)
      return found ? { ...d, evaluation: found.evaluation || '' } : d
    })
    return subjects
  })()

  const REPORT_COLLECTION_ID = "px7z29k647g5697" // student_reports

  // PB file 字段值 → 文件名数组（可能返回 string 或 string[]）
  const normalizePhotos = (p: any): string[] => {
    if (!p) return []
    return Array.isArray(p) ? p : [p]
  }

  // 拼 PB 文件 URL（报告通过 proxy 读）
  const photoUrl = (filename: string, rep: StudentReport) =>
    `/api/pocketbase-proxy/api/files/${REPORT_COLLECTION_ID}/${rep.id}/${encodeURIComponent(filename)}`

  // 上传照片：multipart PATCH 追加到 report_photos 字段
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !report) return
    try {
      setSaving(true)
      const formData = new FormData()
      // report_photos+ 追加，保留已有文件（把已存在文件名一并带上）
      normalizePhotos(report.report_photos).forEach(fn => formData.append("report_photos", fn))
      files.forEach(f => formData.append("report_photos", f))
      const res = await fetch(`/api/pocketbase-proxy/api/collections/student_reports/records/${report.id}`, {
        method: "PATCH",
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setReport(prev => prev ? { ...prev, report_photos: updated.report_photos } : prev)
    } catch (err: any) {
      alert("上传失败: " + (err.message || "未知错误"))
    } finally {
      setSaving(false)
    }
  }

  // 删除指定照片：把剩下的文件名 PATCH 回去
  const removePhoto = async (idx: number) => {
    if (!report) return
    try {
      setSaving(true)
      const remaining = normalizePhotos(report.report_photos).filter((_, i) => i !== idx)
      const res = await fetch(`/api/pocketbase-proxy/api/collections/student_reports/records/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_photos: remaining }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setReport(prev => prev ? { ...prev, report_photos: updated.report_photos } : prev)
    } catch (err: any) {
      alert("删除失败: " + (err.message || "未知错误"))
    } finally {
      setSaving(false)
    }
  }

  // Convert to PDF using generateReportHTML → jsPDF + html2canvas
  const handleDownloadPDF = async () => {
    if (!report || !student) return
    try {
      setSaving(true)
      await downloadReportPDF(report, reportSettings, {
        name: student.name,
        student_id: student.student_id || student.code,
        dob: student.dob,
        grade: student.grade,
        avatar: avatarSrc,
      })
    } catch (e: any) {
      alert("PDF下载失败: " + (e.message || "未知错误"))
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading ─────────────────────────────────
  if (loading || studentsLoading) {
    return (
      <PageLayout title={t("学生报告")} backUrl="/student-reports">
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
      <PageLayout title={t("学生报告")} backUrl="/student-reports">
        <div className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">{t("报告未找到")}</p>
          <Button onClick={() => router.push("/student-reports")} variant="outline" className="mt-4">
            {t("返回学生报告")}
          </Button>
        </div>
      </PageLayout>
    )
  }

  // ─── Report Content ──────────────────────────
  return (
    <PageLayout 
      title={`${student?.name || "学生"} — 学生报告`} 
      backUrl={backListUrl}
      actions={
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>{t("取消")}</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {t("保存")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />{t("格式")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-1" />{t("编辑")}
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />{t("打印")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                {t("下载PDF")}
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* ─── Report Preview (iframe from generateReportHTML) ─── */}
      <div className="report-container" id="student-report-print">
        <iframe
          ref={printRef as any}
          srcDoc={report ? generateReportHTML(report, reportSettings, {
            name: student?.name || '',
            student_id: student?.student_id || student?.code || '',
            dob: student?.dob || '',
            grade: student?.grade || '',
            avatar: avatarSrc,
          }, { hideGrowth: editMode }) : ''}
          className="w-full border-0 rounded-lg bg-white"
          style={{ minHeight: '900px', height: 'auto' }}
          title={t("学生报告")}
          sandbox="allow-same-origin"
        />
      </div>

      {/* ─── Edit Panel (shown only in edit mode) ─── */}
      {editMode && report && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("编辑报告内容")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* 报告语言 */}
              <div>
                <Label className="text-xs font-semibold">{t("报告语言 / Report Language")}</Label>
                <select
                  value={report.language || 'zh'}
                  onChange={e => setReport({ ...report, language: (e.target.value as 'zh' | 'en') })}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 min-w-[140px] mt-1"
                >
                  <option value="zh">{t("中文")}</option>
                  <option value="en">English</option>
                </select>
              </div>
              {/* Growth Message */}
              <div>
                <Label className="text-xs font-semibold">{t("成长寄语")}</Label>
                <Textarea 
                  value={report.growth_message || ''} 
                  onChange={e => setReport({...report, growth_message: e.target.value})}
                  className="text-sm mt-1" rows={3}
                />
              </div>

              {/* Subjects */}
              <div>
                <Label className="text-xs font-semibold">{t("科目成绩")}</Label>
                <div className="border rounded-lg mt-1 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">{t("学科")}</TableHead>
                        <TableHead className="text-center">{t("期中 (等级)")}</TableHead>
                        <TableHead className="text-center">{t("期末 (等级)")}</TableHead>
                        <TableHead className="text-center">{t("评价")}</TableHead>
                        <TableHead className="text-center">{t("状态")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.subjects || []).map((subj: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              value={subj.name}
                              disabled={!canEditSubject(subj.name)}
                              onChange={e => {
                                const subs = [...report.subjects]; subs[idx] = {...subs[idx], name: e.target.value}; 
                                setReport({...report, subjects: subs});
                              }} className="h-8 text-sm" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" min={0} max={100} value={subj.midterm ?? ''} disabled={!canEditSubject(subj.name)} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], midterm: e.target.value ? parseInt(e.target.value) : null};
                              setReport({...report, subjects: subs});
                            }} className="w-16 h-8 text-sm text-center mx-auto" />
                            {subj.midterm != null && (
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColorClass(scoreToGrade(subj.midterm))}`}>
                                {scoreToGrade(subj.midterm)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" min={0} max={100} value={subj.final ?? ''} disabled={!canEditSubject(subj.name)} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], final: e.target.value ? parseInt(e.target.value) : null};
                              setReport({...report, subjects: subs});
                            }} className="w-16 h-8 text-sm text-center mx-auto" />
                            {subj.final != null && (
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColorClass(scoreToGrade(subj.final))}`}>
                                {scoreToGrade(subj.final)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              value={subj.evaluation || ''}
                              placeholder="-"
                              disabled={!canEditSubject(subj.name)}
                              onChange={e => {
                                const subs = [...report.subjects]; subs[idx] = {...subs[idx], evaluation: e.target.value};
                                setReport({...report, subjects: subs});
                              }}
                              className="w-28 h-8 text-sm text-center mx-auto font-medium data-[empty=true]:text-gray-400"
                              data-empty={!subj.evaluation ? "true" : "false"}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {isSubjectEvaluationComplete(subj) ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold whitespace-nowrap">
                                {t("完毕")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold whitespace-nowrap">
                                {t("未完成")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 老师评语 */}
              <div>
                <Label className="text-xs font-semibold">{t("老师评语")}</Label>
                <Textarea
                  value={report.teacher_comment || ''}
                  onChange={e => setReport({...report, teacher_comment: e.target.value})}
                  className="text-sm mt-1" rows={3}
                  placeholder={t("填写老师对学生的评语...")}
                />
              </div>

              {/* 功课班评语 */}
              <div>
                <Label className="text-xs font-semibold">{t("功课班评语")}</Label>
                <Textarea
                  value={report.homework_comment || ''}
                  onChange={e => setReport({...report, homework_comment: e.target.value})}
                  className="text-sm mt-1" rows={3}
                  placeholder={t("填写功课班评语...")}
                />
              </div>

              {/* 上传文档/照片 */}
              <div>
                <Label className="text-xs font-semibold">{t("上传文档/照片")}</Label>
                <p className="text-xs text-gray-400 mt-0.5">{t("上传作业/活动照片，会显示在报告和PDF里")}</p>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handlePhotoUpload}
                    className="text-sm"
                  />
                </div>
                {(report.report_photos && normalizePhotos(report.report_photos).length > 0) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {normalizePhotos(report.report_photos).map((p, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={photoUrl(p, report)}
                          alt={`upload-${i}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center shadow hover:bg-red-600"
                          aria-label="删除"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Enrichment Class（只对名单上的学生显示，逐科写评价） */}
              {showEnrichment && (
                <div>
                  <Label className="text-xs font-semibold">Enrichment Class</Label>
                  <div className="mt-1 space-y-2">
                    {enrichmentSubjects.map((en: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">{t(en)}</span>
                        </div>
                        <Textarea
                          value={en.evaluation || ''}
                          onChange={e => {
                            const list = [...enrichmentSubjects]
                            list[i] = { ...list[i], evaluation: e.target.value }
                            setReport({ ...report, enrichment: list })
                          }}
                          placeholder={t("填写该科评价...")}
                          className="text-sm" rows={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problems */}
              <div>
                <Label className="text-xs font-semibold">{t("存在问题")}</Label>
                {(report.problems || []).map((p: string, i: number) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Textarea value={p} onChange={e => {
                      const probs = [...report.problems]; probs[i] = e.target.value;
                      setReport({...report, problems: probs});
                    }} className="text-sm" rows={2} />
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 mt-1" onClick={() => {
                      setReport({...report, problems: report.problems.filter((_: any, j: number) => j !== i)});
                    }}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-1" onClick={() => {
                  setReport({...report, problems: [...(report.problems || []), '']});
                }}>{t("+ 添加问题")}</Button>
              </div>

              {/* Improvements */}
              <div>
                <Label className="text-xs font-semibold">{t("改进建议")}</Label>
                {(report.improvements || []).map((imp: string, i: number) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Textarea value={imp} onChange={e => {
                      const imps = [...report.improvements]; imps[i] = e.target.value;
                      setReport({...report, improvements: imps});
                    }} className="text-sm" rows={2} />
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 mt-1" onClick={() => {
                      setReport({...report, improvements: report.improvements.filter((_: any, j: number) => j !== i)});
                    }}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-1" onClick={() => {
                  setReport({...report, improvements: [...(report.improvements || []), '']});
                }}>{t("+ 添加建议")}</Button>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">{t("学业目标")}</Label>
                  <Textarea value={report.future_goals_academic || ''} onChange={e => setReport({...report, future_goals_academic: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">{t("能力目标")}</Label>
                  <Textarea value={report.future_goals_ability || ''} onChange={e => setReport({...report, future_goals_ability: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">{t("品格目标")}</Label>
                  <Textarea value={report.future_goals_character || ''} onChange={e => setReport({...report, future_goals_character: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
              </div>

              {/* Summary */}
              <div>
                <Label className="text-xs font-semibold">{t("学期总结")}</Label>
                <Textarea value={report.summary || ''} onChange={e => setReport({...report, summary: e.target.value})} className="text-sm mt-1" rows={4} />
              </div>

              {/* Activities */}
              <div>
                <Label className="text-xs font-semibold">{t("活动参与")}</Label>
                {(report.activities || []).map((a: string, i: number) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={a} onChange={e => {
                      const acts = [...report.activities]; acts[i] = e.target.value;
                      setReport({...report, activities: acts});
                    }} className="text-sm h-8" />
                    <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                      setReport({...report, activities: report.activities.filter((_: any, j: number) => j !== i)});
                    }}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-1" onClick={() => {
                  setReport({...report, activities: [...(report.activities || []), '']});
                }}>{t("+ 添加活动")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Subject Settings Dialog ═══ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />{t("学生报告科目设置")}
            </DialogTitle>
            <DialogDescription>
              {t("设置默认科目列表，新建报告时可快速应用")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDefaultSubject()}
                placeholder={t("输入新科目名称...")}
                className="h-9 text-sm flex-1"
              />
              <Button size="sm" onClick={handleAddDefaultSubject} className="h-9">
                <PlusCircle className="h-4 w-4 mr-1" />{t("添加")}
              </Button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {defaultSubjects.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t("暂无默认科目")}</p>
              ) : (
                defaultSubjects.map((name, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      onClick={() => handleRemoveDefaultSubject(name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 border-t">
              <Button size="sm" variant="outline" onClick={handleResetDefaultSubjects} className="w-full text-xs">
                {t("恢复默认科目（")}{DEFAULT_SUBJECTS.join("、")}{t("）")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Report Format Settings Dialog ═══ */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />{t("报告格式设置")}
            </DialogTitle>
            <DialogDescription>{t("自定义学生报告的打印/PDF样式")}</DialogDescription>
          </DialogHeader>
          <ReportSettingsManager
            onSettingsChange={(s) => {
              setReportSettings(s)
              if (s.defaultSubjects?.length) {
                setDefaultSubjects(s.defaultSubjects)
                saveDefaultSubjects(s.defaultSubjects, reportSettings.id)
              }
            }}
            activePresetId={reportSettings.id}
          />
        </DialogContent>
      </Dialog>

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
          /* Preserve header gradient colors on print */
          #student-report-print > div:first-child {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </PageLayout>
  )
}
