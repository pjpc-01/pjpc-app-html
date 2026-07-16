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
import {
  ArrowLeft, Printer, Download, Save, Edit3, FileText,
  Loader2, Settings, X, PlusCircle
} from "lucide-react"
import ReportSettingsManager, { type ReportSettingsPreset } from "@/app/components/report/ReportSettingsManager"
import { downloadReportPDF, generateReportHTML } from "@/lib/pdf-generator"

const DEFAULT_SUBJECTS = ["华文", "国文", "英文", "数学", "科学", "地理", "历史"]
const SETTINGS_KEY = "student_report_default_subjects"

const loadDefaultSubjects = (): string[] => {
  if (typeof window === "undefined") return DEFAULT_SUBJECTS
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_SUBJECTS
}

const saveDefaultSubjects = async (subjects: string[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(subjects))
  // Also persist to PB report_settings
  try {
    const res = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?filter=(isDefault=true)&perPage=1')
    if (res.ok) {
      const data = await res.json()
      if (data.items?.length > 0) {
        await fetch(`/api/pocketbase-proxy/api/collections/report_settings/records/${data.items[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultSubjects: subjects }),
        })
      }
    }
  } catch (e) { console.error('Save defaultSubjects failed:', e) }
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
  const printRef = useRef<any>(null)

  // Subject settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [defaultSubjects, setDefaultSubjects] = useState<string[]>(loadDefaultSubjects)
  const [newSubjectName, setNewSubjectName] = useState("")

  // ─── Report settings (customizable PDF format) ───
  const [reportSettings, setReportSettings] = useState<ReportSettingsPreset>({
    id: "default", name: "默认", schoolName: "", schoolNameEn: "", schoolLogo: "",
    schoolAddress: "", schoolPhone: "", schoolEmail: "", primaryColor: "#3b82f6",
    headerTitle: "学生报告", headerSubtitle: "— 全面发展 · 健康成长 · 追求卓越 —",
    footerText: "自信自强 | 勤学善思 | 合作共进 | 全面发展",
    defaultSubjects: ["华文","国文","英文","数学","科学","地理","历史","道德","美术","体育"],
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
              schoolLogo: r.schoolLogo || "", schoolAddress: r.schoolAddress || "",
              schoolPhone: r.schoolPhone || "", schoolEmail: r.schoolEmail || "",
              primaryColor: r.primaryColor || "#3b82f6",
              headerTitle: r.headerTitle || "学生报告",
              headerSubtitle: r.headerSubtitle || "— 全面发展 · 健康成长 · 追求卓越 —",
              footerText: r.footerText || "自信自强 | 勤学善思 | 合作共进 | 全面发展",
              defaultSubjects: r.defaultSubjects || ["华文","国文","英文","数学","科学","地理","历史","道德","美术","体育"],
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
              saveDefaultSubjects(r.defaultSubjects)
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
    saveDefaultSubjects(updated)
    setNewSubjectName("")
  }

  const handleRemoveDefaultSubject = (name: string) => {
    const updated = defaultSubjects.filter(s => s !== name)
    setDefaultSubjects(updated)
    setReportSettings(prev => ({ ...prev, defaultSubjects: updated }))
    saveDefaultSubjects(updated)
  }

  const handleResetDefaultSubjects = () => {
    setDefaultSubjects([...DEFAULT_SUBJECTS])
    setReportSettings(prev => ({ ...prev, defaultSubjects: [...DEFAULT_SUBJECTS] }))
    saveDefaultSubjects([...DEFAULT_SUBJECTS])
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
        avatar: student.avatar,
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
              <Button size="sm" variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />格式
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-1" />编辑
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />打印
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                下载PDF
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
            avatar: student?.avatar || '',
          }) : ''}
          className="w-full border-0 rounded-lg bg-white"
          style={{ minHeight: '900px', height: 'auto' }}
          title="学生报告"
          sandbox="allow-same-origin"
        />
      </div>

      {/* ─── Edit Panel (shown only in edit mode) ─── */}
      {editMode && report && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">编辑报告内容</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Growth Message */}
              <div>
                <Label className="text-xs font-semibold">成长寄语</Label>
                <Textarea 
                  value={report.growth_message || ''} 
                  onChange={e => setReport({...report, growth_message: e.target.value})}
                  className="text-sm mt-1" rows={3}
                />
              </div>

              {/* Subjects */}
              <div>
                <Label className="text-xs font-semibold">科目成绩</Label>
                <div className="border rounded-lg mt-1 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">学科</TableHead>
                        <TableHead className="text-center">期中</TableHead>
                        <TableHead className="text-center">期末</TableHead>
                        <TableHead className="text-center">评价</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.subjects || []).map((subj: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input value={subj.name} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], name: e.target.value}; 
                              setReport({...report, subjects: subs});
                            }} className="h-8 text-sm" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" min={0} max={100} value={subj.midterm ?? ''} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], midterm: e.target.value ? parseInt(e.target.value) : null};
                              setReport({...report, subjects: subs});
                            }} className="w-16 h-8 text-sm text-center mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" min={0} max={100} value={subj.final ?? ''} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], final: e.target.value ? parseInt(e.target.value) : null};
                              setReport({...report, subjects: subs});
                            }} className="w-16 h-8 text-sm text-center mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input value={subj.evaluation || ''} onChange={e => {
                              const subs = [...report.subjects]; subs[idx] = {...subs[idx], evaluation: e.target.value};
                              setReport({...report, subjects: subs});
                            }} className="w-20 h-8 text-sm text-center mx-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Problems */}
              <div>
                <Label className="text-xs font-semibold">存在问题</Label>
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
                }}>+ 添加问题</Button>
              </div>

              {/* Improvements */}
              <div>
                <Label className="text-xs font-semibold">改进建议</Label>
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
                }}>+ 添加建议</Button>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">学业目标</Label>
                  <Textarea value={report.future_goals_academic || ''} onChange={e => setReport({...report, future_goals_academic: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">能力目标</Label>
                  <Textarea value={report.future_goals_ability || ''} onChange={e => setReport({...report, future_goals_ability: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">品格目标</Label>
                  <Textarea value={report.future_goals_character || ''} onChange={e => setReport({...report, future_goals_character: e.target.value})} className="text-sm mt-1" rows={3} />
                </div>
              </div>

              {/* Summary */}
              <div>
                <Label className="text-xs font-semibold">学期总结</Label>
                <Textarea value={report.summary || ''} onChange={e => setReport({...report, summary: e.target.value})} className="text-sm mt-1" rows={4} />
              </div>

              {/* Activities */}
              <div>
                <Label className="text-xs font-semibold">活动参与</Label>
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
                }}>+ 添加活动</Button>
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
              <Settings className="h-5 w-5" />学生报告科目设置
            </DialogTitle>
            <DialogDescription>
              设置默认科目列表，新建报告时可快速应用
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDefaultSubject()}
                placeholder="输入新科目名称..."
                className="h-9 text-sm flex-1"
              />
              <Button size="sm" onClick={handleAddDefaultSubject} className="h-9">
                <PlusCircle className="h-4 w-4 mr-1" />添加
              </Button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {defaultSubjects.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无默认科目</p>
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
                恢复默认科目（{DEFAULT_SUBJECTS.join("、")}）
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
              <Settings className="h-5 w-5" />报告格式设置
            </DialogTitle>
            <DialogDescription>自定义学生报告的打印/PDF样式</DialogDescription>
          </DialogHeader>
          <ReportSettingsManager
            onSettingsChange={(s) => {
              setReportSettings(s)
              if (s.defaultSubjects?.length) {
                setDefaultSubjects(s.defaultSubjects)
                saveDefaultSubjects(s.defaultSubjects)
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
