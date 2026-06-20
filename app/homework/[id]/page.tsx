"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { useHomework } from "@/hooks/useHomework"
import { useStudents } from "@/hooks/useStudents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  CheckCircle2,
  Clock3,
  Award,
  FileEdit,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  submitted: "bg-blue-100 text-blue-800",
  graded: "bg-green-100 text-green-800",
}

const statusLabels: Record<string, string> = {
  pending: "未提交",
  submitted: "已提交",
  graded: "已批改",
}

export default function HomeworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const homeworkId = params.id as string
  const { homework, submissions, loading, refetch } = useHomework(homeworkId)
  const { students } = useStudents()
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [editingScores, setEditingScores] = useState<Record<string, { score: string; feedback: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Find all students who should have submissions (same grade)
  const matchingStudents = students.filter(
    (s: any) => s.grade === homework?.grade && s.status !== "graduated"
  )

  // Build submission map
  const submissionMap = new Map<string, any>()
  submissions.forEach((sub) => {
    const studentId = typeof sub.studentId === "string" ? sub.studentId : sub.studentId?.id
    if (studentId) submissionMap.set(studentId, sub)
  })

  const getSubmissionForStudent = (studentId: string) => submissionMap.get(studentId)

  const handleGrade = async (submissionId: string, studentId: string) => {
    const edit = editingScores[submissionId]
    if (!edit) return

    setSavingId(submissionId)
    try {
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/homework_submissions/records/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: parseFloat(edit.score) || 0,
            feedback: edit.feedback || "",
            status: "graded",
            gradedDate: new Date().toISOString(),
          }),
        }
      )
      if (!res.ok) throw new Error("Failed to grade")
      toast.success("批改已保存")
      refetch()
    } catch {
      toast.error("保存失败")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <PageLayout title="加载中..." backUrl="/homework" userRole="admin">
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      </PageLayout>
    )
  }

  if (!homework) {
    return (
      <PageLayout title="作业未找到" backUrl="/homework" userRole="admin">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            作业不存在或已被删除
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  const gradedCount = submissions.filter((s) => s.status === "graded").length
  const submittedCount = submissions.filter((s) => s.status === "submitted").length

  return (
    <PageLayout title={homework.title} description={`${homework.subject} · ${homework.grade}`} backUrl="/homework" userRole="admin">
      {/* Homework Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{homework.subject}</Badge>
                <Badge variant="outline">{homework.grade}</Badge>
                {homework.expand?.centerId && (
                  <Badge variant="outline">{homework.expand.centerId.name}</Badge>
                )}
              </div>
              {homework.description && (
                <p className="text-muted-foreground">{homework.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  布置: {new Date(homework.assignedDate).toLocaleDateString("zh-CN")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  截止: {new Date(homework.dueDate).toLocaleDateString("zh-CN")}
                </span>
                {homework.expand?.teacherId && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    教师: {homework.expand.teacherId.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{matchingStudents.length}</div>
                <div className="text-xs text-muted-foreground">应提交</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{submittedCount}</div>
                <div className="text-xs text-muted-foreground">已提交</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
                <div className="text-xs text-muted-foreground">已批改</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <Link href={`/homework/${homework.id}/grade`}>
              <Button variant="default">
                <FileEdit className="h-4 w-4 mr-2" />
                批量批改
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Submission List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            学生提交情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchingStudents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">该年级暂无学生</p>
          ) : (
            <div className="space-y-2">
              {matchingStudents.map((student: any) => {
                const sub = getSubmissionForStudent(student.id)
                const isExpanded = expandedStudent === student.id

                return (
                  <div key={student.id} className="border rounded-lg">
                    <button
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedStudent(isExpanded ? null : student.id)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.grade}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub ? (
                          <>
                            <Badge className={statusColors[sub.status]}>
                              {statusLabels[sub.status]}
                            </Badge>
                            {sub.score !== undefined && sub.score !== null && (
                              <span className="text-sm font-medium flex items-center gap-1">
                                <Award className="h-4 w-4 text-yellow-500" />
                                {sub.score}/100
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            未提交
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && sub && (
                      <div className="px-4 pb-4 border-t pt-3">
                        {sub.status !== "pending" && (
                          <div className="space-y-3">
                            {/* Content */}
                            {sub.content && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">提交内容</label>
                                <p className="text-sm bg-muted rounded p-2">{sub.content}</p>
                              </div>
                            )}

                            {/* Grading form */}
                            {sub.status !== "graded" ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <div className="w-24">
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">分数 (0-100)</label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      placeholder="分数"
                                      value={editingScores[sub.id]?.score ?? ""}
                                      onChange={(e) =>
                                        setEditingScores((prev) => ({
                                          ...prev,
                                          [sub.id]: {
                                            score: e.target.value,
                                            feedback: prev[sub.id]?.feedback ?? "",
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">评语</label>
                                    <Input
                                      placeholder="批改评语..."
                                      value={editingScores[sub.id]?.feedback ?? ""}
                                      onChange={(e) =>
                                        setEditingScores((prev) => ({
                                          ...prev,
                                          [sub.id]: {
                                            score: prev[sub.id]?.score ?? "",
                                            feedback: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button
                                      size="sm"
                                      onClick={() => handleGrade(sub.id, student.id)}
                                      disabled={savingId === sub.id}
                                    >
                                      {savingId === sub.id ? "保存中..." : "批改"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">分数</span>
                                    <div className="flex items-center gap-1">
                                      <Award className="h-4 w-4 text-yellow-500" />
                                      <span className="font-medium">{sub.score}/100</span>
                                    </div>
                                  </div>
                                  {sub.feedback && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">评语</span>
                                      <p className="text-sm">{sub.feedback}</p>
                                    </div>
                                  )}
                                  {sub.expand?.gradedBy && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">批改教师</span>
                                      <p className="text-sm">{sub.expand.gradedBy.name}</p>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingScores((prev) => ({
                                      ...prev,
                                      [sub.id]: {
                                        score: String(sub.score ?? ""),
                                        feedback: sub.feedback ?? "",
                                      },
                                    }))
                                    setExpandedStudent(student.id) // Keep expanded
                                  }}
                                >
                                  重新批改
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {sub.status === "pending" && (
                          <p className="text-sm text-muted-foreground">学生尚未提交</p>
                        )}
                      </div>
                    )}

                    {isExpanded && !sub && (
                      <div className="px-4 pb-4 border-t pt-3">
                        <p className="text-sm text-muted-foreground">学生尚未提交作业</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
