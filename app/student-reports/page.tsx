"use client"

import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"
import { FileText, Eye, Settings, Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStudents } from "@/hooks/useStudents"
import { formatGrade } from "@/lib/utils"
import ReportSettingsManager, { type ReportSettingsPreset } from "@/app/components/report/ReportSettingsManager"

export default function StudentReportsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { students, loading: studentsLoading, refetch } = useStudents()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reportSettings, setReportSettings] = useState<ReportSettingsPreset>({
    id: "default", name: "默认", schoolName: "", schoolNameEn: "", schoolLogo: "",
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

  // 新建报告：选择学生 dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGrade, setFilterGrade] = useState("")
  const [creating, setCreating] = useState(false)

  // 列表页按年级筛选
  const [listGrade, setListGrade] = useState("")

  // 学生年级映射（normalize 便于匹配）
  const studentGradeMap = (() => {
    const m: Record<string, string> = {}
    for (const s of students || []) {
      m[(s as any).id] = formatGrade((s as any).grade, (s as any).is_peralihan) || (s as any).grade || ''
    }
    return m
  })()

  // 从 report 关联学生拼完整头像 URL
  const reportAvatarUrl = (r: any): string | undefined => {
    const stu = r.expand?.studentId
    const av = stu?.avatar || (students.find((s:any) => s.id === r.studentId) as any)?.avatar
    if (!av) return undefined
    if (String(av).startsWith('http')) return av
    const cid = stu?.collectionId || 'students'
    return `/api/pocketbase-proxy/api/files/${cid}/${r.studentId}/${av}`
  }

  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/student_reports/records?sort=-created&perPage=200&expand=studentId")
      .then(r => r.json())
      .then(d => {
        setReports(d.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statusMap: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    archived: "已归档",
  }

  // 选择学生 → 创建报告（复用学生管理页 handleViewReport 的创建逻辑）
  const handleCreateReport = async (student: any) => {
    try {
      // 检查该学生是否已有今年报告
      const year = new Date().getFullYear()
      const res = await fetch(`/api/pocketbase-proxy/api/collections/student_reports/records?filter=(studentId="${student.id}"%26%26year=${year})&sort=-year&perPage=1`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        router.push(`/student-report/${data.items[0].id}`)
        return
      }
    } catch (e) {}

    // Fetch default report settings
    let settings: any = null
    try {
      const settingsRes = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?filter=(isDefault=true)&perPage=1')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.items?.length > 0) settings = settingsData.items[0]
      }
    } catch (e) {}

    const studentName = student.student_name || student.name || "学生"
    const subjectNames = settings?.defaultSubjects?.length > 0
      ? settings.defaultSubjects
      : ["华文", "国文", "英文", "科学", "数学"]
    const subjects = subjectNames.map((name: string) => ({ name, midterm: null, final: null, evaluation: "" }))

    const growthMessage = settings?.growthMessage
      ? settings.growthMessage.replace('{studentName}', studentName)
      : `成长不在于做得最好，而在于愿意不断尝试、不断进步。${studentName}，继续加油！`

    try {
      setCreating(true)
      const now = new Date()
      const reportData = {
        studentId: student.id,
        term: "Term 1",
        year: now.getFullYear(),
        report_date: now.toISOString().split('T')[0],
        growth_message: growthMessage,
        subjects,
        activities: [],
        homework_comment: "",
        problems: settings?.problems || ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"],
        improvements: settings?.improvements || ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"],
        future_goals_academic: settings?.futureGoalAcademic || "提高各科成绩，争取进入班级前列。",
        future_goals_ability: settings?.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。",
        future_goals_character: settings?.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。",
        summary: settings?.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
        status: "draft",
      }
      const createRes = await fetch("/api/pocketbase-proxy/api/collections/student_reports/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      })
      const created = await createRes.json()
      setCreateOpen(false)
      setSearchTerm("")
      refetch()
      router.push(`/student-report/${created.id}`)
    } catch (e: any) {
      alert("创建报告失败: " + (e.message || "未知错误"))
    } finally {
      setCreating(false)
    }
  }

  // 年级列表（去重 + 排序）—— 用于选择学生 dialog
  const gradeOptions = Array.from(new Set((students || []).map((s: any) => formatGrade(s.grade, s.is_peralihan) || s.grade).filter(Boolean))) as string[]

  // 列表页年级选项 —— 固定完整列表（不依赖 students 加载时序）
  const ALL_GRADES = ["Standard 1","Standard 2","Standard 3","Standard 4","Standard 5","Standard 6","Peralihan","Form 1","Form 2","Form 3","Form 4","Form 5","明年新生"]
  const GRADE_LABELS: Record<string,string> = { "Standard 1":"1年级","Standard 2":"2年级","Standard 3":"3年级","Standard 4":"4年级","Standard 5":"5年级","Standard 6":"6年级","Peralihan":"Peralihan","Form 1":"中一","Form 2":"中二","Form 3":"中三","Form 4":"中四","Form 5":"中五","明年新生":"明年新生" }
  const listGradeOptions = ALL_GRADES

  // 过滤报告列表（按年级）
  const filteredReports = reports.filter((r: any) => {
    if (!listGrade) return true
    const g = formatGrade(r.expand?.studentId?.grade, r.expand?.studentId?.is_peralihan) || studentGradeMap[r.studentId] || ''
    return g === listGrade
  })

  const filteredStudents = (students || [])
    .filter((s: any) => s.status === 'active' || s.status === undefined)
    .filter((s: any) => {
      if (filterGrade && s.grade !== filterGrade) return false
      if (!searchTerm.trim()) return true
      const q = searchTerm.toLowerCase()
      return (s.name || '').toLowerCase().includes(q) || (s.student_id || '').toLowerCase().includes(q)
    })
    .slice(0, 30)

  return (
    <PageLayout
      title="学生报告"
      description="教师填写学生的学期成绩与评语"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button size="sm" onClick={() => { setSearchTerm(""); setFilterGrade(""); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          新建报告
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          报告格式设置
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            学生报告列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">{t('teacher.loading')}</p>
          ) : filteredReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{listGrade ? `该年级(${listGrade})暂无学生报告。` : `暂无学生报告。点击右上角「新建报告」选择学生开始填写。`}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm text-gray-500 shrink-0">按年级筛选：</label>
                <select
                  value={listGrade}
                  onChange={(e) => setListGrade(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 min-w-[140px]"
                >
                  <option value="">全部年级</option>
                  {listGradeOptions.map((g) => (
                    <option key={g} value={g}>{GRADE_LABELS[g] || g}</option>
                  ))}
                </select>
                {listGrade && (
                  <Button size="sm" variant="ghost" onClick={() => setListGrade("")} className="text-xs">清除</Button>
                )}
                <span className="text-xs text-gray-400 ml-auto">{filteredReports.length} 份报告</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">照片</TableHead>
                    <TableHead>学生</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>学期</TableHead>
                    <TableHead>年份</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((r: any) => {
                    const av = reportAvatarUrl(r)
                    const stuName = r.expand?.studentId?.name || r.studentName || (students.find((s:any) => s.id === r.studentId)?.name) || "-"
                    return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={av} alt={stuName} />
                          <AvatarFallback className="bg-gray-200 text-gray-500 text-xs">{stuName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{stuName}</TableCell>
                      <TableCell className="text-xs text-gray-500">{formatGrade(r.expand?.studentId?.grade, r.expand?.studentId?.is_peralihan) || studentGradeMap[r.studentId] || r.expand?.studentId?.grade || "-"}</TableCell>
                      <TableCell>{r.term || "-"}</TableCell>
                      <TableCell>{r.year || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "published" ? "default" : "secondary"}>
                          {statusMap[r.status] || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(r.created).toLocaleDateString("zh-CN")}</TableCell>
                      <TableCell>
                        <Link href={`/student-report/${r.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />查看/填写
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── 新建报告：选择学生 Dialog ─── */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!creating) setCreateOpen(v) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />选择学生 — 新建学期报告
            </DialogTitle>
            <DialogDescription>按班级筛选或搜索学生，为其创建本学期的成绩与评语报告</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 min-w-[140px]"
            >
              <option value="">全部班级</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入学生姓名或学号搜索..."
                className="pl-9 h-10"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
            {studentsLoading ? (
              <p className="text-gray-500 text-center py-8">
                <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" />加载学生...
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">没有找到匹配的学生</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>学号</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s: any) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.student_id || s.code || "-"}</TableCell>
                      <TableCell>{s.grade || "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleCreateReport(s)} disabled={creating}>
                          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          新建/打开
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Format Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />报告格式设置
            </DialogTitle>
            <DialogDescription>自定义学生报告的打印/PDF样式，所有报告统一应用</DialogDescription>
          </DialogHeader>
          <ReportSettingsManager
            onSettingsChange={(s) => setReportSettings(s)}
            activePresetId={reportSettings.id}
          />
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
