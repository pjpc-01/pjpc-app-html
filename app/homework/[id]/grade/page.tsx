"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle2, Award } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SubmissionItem {
  id: string
  studentName: string
  studentId: string
  status: string
  score?: number
  feedback?: string
  content?: string
  dirty?: boolean
}

export default function BatchGradingPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const homeworkId = params.id as string

  const [homework, setHomework] = useState<any>(null)
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch homework info
        const hwRes = await fetch(
          `/api/pocketbase-proxy/api/collections/homework/records/${homeworkId}?expand=teacherId,centerId`
        )
        const hwData = await hwRes.json()
        setHomework(hwData)

        // Fetch submissions
        const subRes = await fetch(
          `/api/pocketbase-proxy/api/collections/homework_submissions/records?filter=homeworkId%3D%27${homeworkId}%27&expand=studentId&perPage=200`
        )
        const subData = await subRes.json()
        const subs: any[] = subData?.items || []

        // Build items list
        const list: SubmissionItem[] = subs
          .filter((s) => s.status !== "pending")
          .map((s) => {
            const studentName = s.expand?.studentId?.name || "Unknown"
            return {
              id: s.id,
              studentName,
              studentId: typeof s.studentId === "string" ? s.studentId : s.studentId?.id,
              status: s.status,
              score: s.score,
              feedback: s.feedback,
              content: s.content,
              dirty: false,
            }
          })

        // If no submissions match, try fetching all students of this grade
        if (list.length === 0 && hwData?.grade) {
          const stuRes = await fetch(
            `/api/pocketbase-proxy/api/collections/students/records?filter=grade%3D%27${encodeURIComponent(hwData.grade)}%27%26%26status%3D%27active%27&perPage=200`
          )
          const stuData = await stuRes.json()
          const allStudents: any[] = stuData?.items || []

          allStudents.forEach((student) => {
            const existing = subs.find(
              (s) => (typeof s.studentId === "string" ? s.studentId : s.studentId?.id) === student.id
            )
            if (existing) {
              list.push({
                id: existing.id,
                studentName: student.name,
                studentId: student.id,
                status: existing.status,
                score: existing.score,
                feedback: existing.feedback,
                content: existing.content,
                dirty: false,
              })
            } else {
              // No submission, still show for manual grading
              // Actually skip - can't grade a non-existent submission
            }
          })
        }

        // Sort: ungraded first
        list.sort((a, b) => {
          if (a.status === "submitted" && b.status !== "submitted") return -1
          if (a.status !== "submitted" && b.status === "submitted") return 1
          return 0
        })

        setItems(list)
      } catch (e) {
        toast.error("加载失败")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [homeworkId])

  const updateItem = (id: string, field: keyof SubmissionItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value, dirty: true } : item))
    )
  }

  const handleSaveAll = async () => {
    const dirtyItems = items.filter((i) => i.dirty && i.status !== "graded")
    if (dirtyItems.length === 0) {
      toast.info("没有需要保存的变更")
      return
    }

    setSaving(true)
    let success = 0
    let failed = 0

    for (const item of dirtyItems) {
      try {
        const res = await fetch(
          `/api/pocketbase-proxy/api/collections/homework_submissions/records/${item.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: item.score || 0,
              feedback: item.feedback || "",
              status: "graded",
              gradedDate: new Date().toISOString(),
            }),
          }
        )
        if (res.ok) {
          success++
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, dirty: false, status: "graded" } : i))
          )
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setSaving(false)

    if (failed === 0) {
      toast.success(`全部 ${success} 份批改已保存`)
    } else {
      toast.warning(`${success} 份成功，${failed} 份失败`)
    }
  }

  if (loading) {
    return (
      <PageLayout title="批量批改" backUrl={`/homework/${homeworkId}`} userRole="admin">
        <div className="text-center py-12 text-muted-foreground">{t('teacher.loading')}</div>
      </PageLayout>
    )
  }

  const ungradedCount = items.filter((i) => i.status !== "graded").length

  return (
    <PageLayout
      title="批量批改"
      description={homework ? `${homework.title} · ${ungradedCount} 份待批改` : ""}
      backUrl={`/homework/${homeworkId}`}
      userRole="admin"
    >
      {/* Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">共 </span>
            <span className="font-bold">{items.length}</span>
            <span className="text-muted-foreground"> 份提交</span>
          </div>
          <div className="text-sm">
            <span className="text-yellow-600 font-bold">{ungradedCount}</span>
            <span className="text-muted-foreground"> 待批改</span>
          </div>
          <div className="text-sm">
            <span className="text-green-600 font-bold">{items.length - ungradedCount}</span>
            <span className="text-muted-foreground"> 已批改</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/homework/${homeworkId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回详情
            </Button>
          </Link>
          <Button onClick={handleSaveAll} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存全部批改"}
          </Button>
        </div>
      </div>

      {/* Grading Cards */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无学生提交作业
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`border-l-4 ${
                item.status === "graded"
                  ? "border-l-green-500"
                  : item.dirty
                  ? "border-l-yellow-500"
                  : "border-l-blue-500"
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{item.studentName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.studentName}</span>
                        <Badge
                          className="ml-2"
                          variant={item.status === "graded" ? "default" : "secondary"}
                        >
                          {item.status === "graded" ? "已批改" : item.dirty ? "待保存" : "待批改"}
                        </Badge>
                      </div>
                      {item.status === "graded" && !item.dirty && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    {item.content && (
                      <div className="bg-muted rounded p-2 text-sm">{item.content}</div>
                    )}

                    <div className="flex gap-2 items-start">
                      <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          <Award className="h-3 w-3 inline mr-1" />
                          分数
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.score ?? ""}
                          onChange={(e) => updateItem(item.id, "score", parseFloat(e.target.value) || 0)}
                          placeholder="0-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">评语</label>
                        <Textarea
                          value={item.feedback ?? ""}
                          onChange={(e) => updateItem(item.id, "feedback", e.target.value)}
                          placeholder="批改评语..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
