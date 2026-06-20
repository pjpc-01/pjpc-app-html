"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

const SUBJECTS = ["数学", "英文", "华文", "马来文", "科学", "历史", "地理", "道德", "美术", "音乐", "体育", "其他"]
const GRADES = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "预备班", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"]

export default function NewHomeworkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const centerFromUrl = searchParams?.get("center")

  const [centers, setCenters] = useState<{ id: string; name: string; code: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    centerId: centerFromUrl && centerFromUrl !== "all" ? centerFromUrl : "",
    teacherId: "",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "active",
  })

  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records?perPage=20")
      .then((r) => r.json())
      .then((d) => setCenters(d?.items || []))
      .catch(() => {})

    fetch("/api/pocketbase-proxy/api/collections/teachers/records?perPage=50")
      .then((r) => r.json())
      .then((d) => setTeachers(d?.items || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.subject || !form.grade || !form.teacherId || !form.dueDate) {
      toast.error("请填写必填字段")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        assignedDate: new Date(form.assignedDate).toISOString(),
        dueDate: new Date(form.dueDate).toISOString(),
      }
      const res = await fetch("/api/pocketbase-proxy/api/collections/homework/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create")
      toast.success("作业已发布")
      router.push("/homework")
      router.refresh()
    } catch (err) {
      toast.error("发布失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="布置作业" description="为学生布置新的作业" backUrl="/homework" userRole="admin">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>作业信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <Label htmlFor="title">作业标题 *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="例如：单元练习一"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <Label>科目 *</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade */}
              <div>
                <Label>年级 *</Label>
                <Select
                  value={form.grade}
                  onValueChange={(v) => setForm((f) => ({ ...f, grade: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Center */}
              <div>
                <Label>所属中心</Label>
                <Select
                  value={form.centerId}
                  onValueChange={(v) => setForm((f) => ({ ...f, centerId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部中心" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部中心</SelectItem>
                    {centers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher */}
              <div>
                <Label>布置教师 *</Label>
                <Select
                  value={form.teacherId}
                  onValueChange={(v) => setForm((f) => ({ ...f, teacherId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div>
                <Label>布置日期</Label>
                <Input
                  type="date"
                  value={form.assignedDate}
                  onChange={(e) => setForm((f) => ({ ...f, assignedDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>截止日期 *</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label htmlFor="description">作业描述</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="作业内容和要求..."
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "发布中..." : "发布作业"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </PageLayout>
  )
}
