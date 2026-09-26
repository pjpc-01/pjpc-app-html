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
import { GRADE_CANON_ALL, GRADE_LABEL } from "@/lib/grades"
import ReportSettingsManager, { type ReportSettingsPreset } from "@/app/components/report/ReportSettingsManager"
import { REPORT_EN_DEFAULT } from "@/lib/pdf-generator"

// ── 报告「填写进度」：11 个框，哪些填了、哪些还空着 ──
const REPORT_FIELDS: [string, string][] = [
  ["growth_message", "成长寄语"],
  ["subjects", "科目成绩"],
  ["teacher_comment", "老师评语"],
  ["homework_comment", "功课班评语"],
  ["problems", "存在问题"],
  ["improvements", "改进建议"],
  ["future_goals_academic", "学业目标"],
  ["future_goals_ability", "能力目标"],
  ["future_goals_character", "品格目标"],
  ["summary", "学期总结"],
  ["activities", "活动参与"],
]

const isFilled = (v: any, key?: string): boolean => {
  // 科目成绩：模板会预填科目名，必须至少一个科目填了期中/期末分数才算「已填」
  if (key === "subjects") {
    return Array.isArray(v) && v.some(s =>
      !!s && (
        (s.midterm !== null && s.midterm !== undefined && s.midterm !== "") ||
        (s.final !== null && s.final !== undefined && s.final !== "")
      )
    )
  }
  if (Array.isArray(v)) {
    return v.some(x =>
      typeof x === "string"
        ? x.trim() !== ""
        : !!x && typeof x === "object" && Object.values(x).some(y => y !== "" && y !== null && y !== undefined)
    )
  }
  if (typeof v === "string") return v.trim() !== ""
  return v !== null && v !== undefined
}

const reportProgress = (r: any) => {
  const empty = REPORT_FIELDS.filter(([k]) => !isFilled(r[k], k)).map(([, label]) => label)
  return { filled: REPORT_FIELDS.length - empty.length, total: REPORT_FIELDS.length, empty }
}

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
  const [createLang, setCreateLang] = useState<'zh' | 'en'>('zh')

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

    const isEn = createLang === 'en'
    const growthMessage = isEn
      ? REPORT_EN_DEFAULT.growthMessage.replace('{studentName}', studentName)
      : (settings?.growthMessage ? settings.growthMessage.replace('{studentName}', studentName) : `成长不在于做得最好，而在于愿意不断尝试、不断进步。${studentName}，继续加油！`)
    const problems = isEn ? REPORT_EN_DEFAULT.problems : (settings?.problems || ["在理科学习中，解题思路不够灵活，需加强思维训练。","有时会因拖延导致作业完成质量不高。","阅读量不足，知识面有待拓宽。"])
    const improvements = isEn ? REPORT_EN_DEFAULT.improvements : (settings?.improvements || ["制定学习计划，提高学习效率，减少拖延。","多做练习题，总结解题方法和技巧。","每天阅读，拓宽知识面，做好读书笔记。","遇到问题及时请教老师或同学，加强理解与应用。"])
    const goalAcademic = isEn ? REPORT_EN_DEFAULT.goalAcademic : (settings?.futureGoalAcademic || "提高各科成绩，争取进入班级前列。")
    const goalAbility = isEn ? REPORT_EN_DEFAULT.goalAbility : (settings?.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。")
    const goalCharacter = isEn ? REPORT_EN_DEFAULT.goalCharacter : (settings?.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。")
    const summaryText = isEn ? REPORT_EN_DEFAULT.summary : (settings?.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！")

    try {
      setCreating(true)
      const now = new Date()
      const reportData = {
        studentId: student.id,
        term: "Term 1",
        year: now.getFullYear(),
        report_date: now.toISOString().split('T')[0],
        language: createLang,
        growth_message: growthMessage,
        subjects,
        activities: [],
        homework_comment: "",
        problems,
        improvements,
        future_goals_academic: goalAcademic,
        future_goals_ability: goalAbility,
        future_goals_character: goalCharacter,
        summary: summaryText,
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

  // 列表页年级选项 —— 走 @/lib/grades（原来写死一份，漏了 Form 6，且「预备班」措辞与别处不一致）
  const listGradeOptions = GRADE_CANON_ALL

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
                    <option key={g} value={g}>{GRADE_LABEL[g] || g}</option>
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
                    <TableHead>填写进度</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((r: any) => {
                    const av = reportAvatarUrl(r)
                    const stuName = r.expand?.studentId?.name || r.studentName || (students.find((s:any) => s.id === r.studentId)?.name) || "-"
                    const prog = reportProgress(r)
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
                        <span
                          className={`text-xs font-medium whitespace-nowrap ${prog.empty.length === 0 ? "text-green-600" : "text-amber-600"}`}
                          title={prog.empty.length ? `未填：${prog.empty.join("、")}` : "全部已填"}
                        >
                          已填 {prog.filled} · 未填 {prog.empty.length}
                        </span>
                      </TableCell>
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
          <div className="flex gap-2 mb-3 items-center">
            <span className="text-sm text-gray-500 shrink-0">报告语言:</span>
            <select
              value={createLang}
              onChange={(e) => setCreateLang(e.target.value as 'zh' | 'en')}
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 min-w-[120px]"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <span className="text-xs text-gray-400">友族学生建议选 English</span>
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
