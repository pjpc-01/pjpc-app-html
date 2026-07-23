"use client"

import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { FileText, Eye, Settings } from "lucide-react"
import Link from "next/link"
import ReportSettingsManager, { type ReportSettingsPreset } from "@/app/components/report/ReportSettingsManager"

export default function StudentReportsPage() {
  const { t } = useLanguage()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/student_reports/records?sort=-created&perPage=50")
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

  return (
    <PageLayout
      title="学生报告"
      description="查看和管理学生学期报告"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <div className="flex items-center justify-end mb-4">
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
          ) : reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无学生报告。前往「学生列表」为学生创建报告。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('student.semester')}</TableHead>
                  <TableHead>{t('teacher.year')}</TableHead>
                  <TableHead>{t('teacher.status')}</TableHead>
                  <TableHead>{t('course.created_at')}</TableHead>
                  <TableHead>{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => (
                  <TableRow key={r.id}>
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
                          <Eye className="h-4 w-4 mr-1" />查看
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
