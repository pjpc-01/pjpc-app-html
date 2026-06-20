"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Plus, Trash2, Search, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { exportReportCardPDF } from "@/lib/pdf-export"
import { getAllStudents } from "@/lib/pocketbase-students"

const SUBJECT_OPTIONS = [
  "华文",
  "马来文",
  "英文",
  "数学",
  "科学",
  "历史",
  "道德教育",
  "体育",
  "美术",
  "音乐",
]

export default function ReportCardsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [period, setPeriod] = useState(new Date().toLocaleString("zh-CN", { year: "numeric", month: "long" }))
  const [subjects, setSubjects] = useState<{ name: string; score: number }[]>([])
  const [teacherComment, setTeacherComment] = useState("")
  const [present, setPresent] = useState("")
  const [absent, setAbsent] = useState("")

  const searchParams = useSearchParams()
  const centerFilter = searchParams.get("center")

  useEffect(() => {
    getAllStudents().then(all => {
      let filtered = all.filter(s => s.status !== "graduated")
      if (centerFilter && centerFilter !== "all") {
        filtered = filtered.filter(s => s.centerId === centerFilter)
      }
      setStudents(filtered)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [centerFilter])

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const addSubject = () => {
    setSubjects(prev => [...prev, { name: "", score: 0 }])
  }

  const removeSubject = (index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: "name" | "score", value: string) => {
    setSubjects(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: field === "score" ? parseFloat(value) || 0 : value } : s
    ))
  }

  const calculateStats = () => {
    if (subjects.length === 0) return { total: 0, average: 0, highest: 0, lowest: 0 }
    const scores = subjects.map(s => s.score)
    return {
      total: scores.reduce((a, b) => a + b, 0),
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    }
  }

  const stats = calculateStats()

  const handleGeneratePDF = () => {
    if (!selectedStudent) {
      toast.error("请选择学生")
      return
    }
    if (subjects.length === 0 || subjects.some(s => !s.name)) {
      toast.error("请添加至少一个科目并填写科目名称")
      return
    }

    try {
      exportReportCardPDF({
        studentName: selectedStudent.student_name || selectedStudent.name || "未知学生",
        grade: selectedStudent.standard || selectedStudent.grade || "",
        center: selectedStudent.center || "WX 01",
        school: selectedStudent.school || "",
        period,
        subjects: subjects.map(s => ({
          name: s.name,
          score: s.score,
          grade: "",
        })),
        attendance: present || absent ? {
          present: parseInt(present) || 0,
          absent: parseInt(absent) || 0,
          total: (parseInt(present) || 0) + (parseInt(absent) || 0),
        } : undefined,
        teacherComment: teacherComment || undefined,
      })
      toast.success("成绩单 PDF 已下载")
    } catch (err) {
      toast.error("生成 PDF 失败")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-indigo-500" />
            成绩单管理
          </h1>
          <p className="text-slate-500">生成并导出学生成绩单 PDF</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Selection & Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择学生</CardTitle>
              <CardDescription>选择要生成成绩单的学生</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-slate-400">加载学生数据...</p>
              ) : (
                <div className="space-y-2">
                  <Label>学生姓名</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.student_name || s.name || "未知"} - {s.standard || s.grade || "未知年级"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedStudent && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-sm">
                  <p><span className="text-slate-500">姓名:</span> <span className="font-medium">{selectedStudent.student_name || selectedStudent.name}</span></p>
                  <p><span className="text-slate-500">年级:</span> <span className="font-medium">{selectedStudent.standard || selectedStudent.grade}</span></p>
                  <p><span className="text-slate-500">中心:</span> <span className="font-medium">{selectedStudent.center}</span></p>
                  {selectedStudent.school && (
                    <p><span className="text-slate-500">学校:</span> <span className="font-medium">{selectedStudent.school}</span></p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>学期</Label>
                <Input value={period} onChange={e => setPeriod(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>出勤记录 (选填)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">出席天数</Label>
                  <Input type="number" value={present} onChange={e => setPresent(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">缺席天数</Label>
                  <Input type="number" value={absent} onChange={e => setAbsent(e.target.value)} placeholder="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Comment */}
          <Card>
            <CardHeader>
              <CardTitle>教师评语 (选填)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={teacherComment}
                onChange={e => setTeacherComment(e.target.value)}
                placeholder="输入对学生的评语..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Subject Scores */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>科目成绩</CardTitle>
                  <CardDescription>添加科目和分数</CardDescription>
                </div>
                <Button onClick={addSubject} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> 添加科目
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>暂无科目，点击「添加科目」开始</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">科目</TableHead>
                      <TableHead className="w-[100px]">分数</TableHead>
                      <TableHead className="w-[60px]">等级</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={subject.name}
                            onValueChange={v => updateSubject(index, "name", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择科目" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECT_OPTIONS.filter(opt =>
                                !subjects.some((s, i) => s.name === opt && i !== index)
                              ).map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={subject.score || ""}
                            onChange={e => updateSubject(index, "score", e.target.value)}
                            className="w-20 font-mono"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`text-lg font-bold ${
                            subject.score >= 80 ? "text-green-600" :
                            subject.score >= 60 ? "text-yellow-600" :
                            subject.score >= 40 ? "text-orange-600" :
                            "text-red-600"
                          }`}>
                            {subject.score ? (
                              subject.score >= 90 ? "A" :
                              subject.score >= 80 ? "B" :
                              subject.score >= 70 ? "C" :
                              subject.score >= 60 ? "D" :
                              subject.score >= 50 ? "E" : "F"
                            ) : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeSubject(index)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Stats Summary */}
              {subjects.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-slate-500">总分</p>
                    <p className="text-lg font-bold text-indigo-600">{stats.total}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-slate-500">平均</p>
                    <p className="text-lg font-bold text-green-600">{stats.average.toFixed(1)}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-slate-500">最高</p>
                    <p className="text-lg font-bold text-blue-600">{stats.highest}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-500">最低</p>
                    <p className="text-lg font-bold text-orange-600">{stats.lowest}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGeneratePDF}
              disabled={!selectedStudent || subjects.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
            >
              <Download className="h-5 w-5 mr-2" />
              生成并下载成绩单 PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
