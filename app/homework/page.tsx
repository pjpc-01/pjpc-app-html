"use client"

import React, { useState } from "react"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { useHomeworkList } from "@/hooks/useHomework"
import { useCenters } from "@/hooks/useCenters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import {
  Plus,
  BookOpen,
  Users,
  Calendar,
  Clock,
  FileText,
  Search,
  Filter,
} from "lucide-react"

const SUBJECTS = ["数学", "英文", "华文", "马来文", "科学", "历史", "地理", "道德", "美术", "音乐", "体育", "其他"]
const GRADES = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "预备班", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"]

const subjectColors: Record<string, string> = {
  "数学": "bg-blue-100 text-blue-800",
  "英文": "bg-green-100 text-green-800",
  "华文": "bg-red-100 text-red-800",
  "马来文": "bg-yellow-100 text-yellow-800",
  "科学": "bg-purple-100 text-purple-800",
  "历史": "bg-orange-100 text-orange-800",
  "地理": "bg-teal-100 text-teal-800",
  "道德": "bg-indigo-100 text-indigo-800",
  "美术": "bg-pink-100 text-pink-800",
  "音乐": "bg-cyan-100 text-cyan-800",
  "体育": "bg-lime-100 text-lime-800",
}

export default function HomeworkPage() {
  const { t } = useLanguage()
  const { homeworkList, loading, error } = useHomeworkList()
  const { centers } = useCenters()
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = homeworkList.filter((hw) => {
    if (filterSubject !== "all" && hw.subject !== filterSubject) return false
    if (filterGrade !== "all" && hw.grade !== filterGrade) return false
    if (searchQuery && !hw.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getCenterName = (centerId?: string) => {
    if (!centerId) return ""
    const c = centers?.find((c: any) => c.id === centerId)
    return c?.name || c?.code || ""
  }

  return (
    <PageLayout
      title={t('teacher.homework_management')}
      description="布置、查看和批改学生作业"
      backUrl="/"
      userRole="admin"
    >
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索作业..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder={t('exam.subject')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('course.all_subjects')}</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('student.grade')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('course.all_grades')}</SelectItem>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/homework/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            布置作业
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">{t('teacher.loading')}</div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">还没有作业</p>
            <p className="text-muted-foreground mb-4">点击上方按钮布置第一份作业</p>
            <Link href="/homework/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                布置作业
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Homework List */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hw) => (
            <Link key={hw.id} href={`/homework/${hw.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base line-clamp-2">{hw.title}</CardTitle>
                  </div>
                  <Badge className={subjectColors[hw.subject] || "bg-gray-100"} variant="secondary">
                    {hw.subject}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{hw.grade}</span>
                    {getCenterName(hw.centerId) && (
                      <>
                        <span>·</span>
                        <span>{getCenterName(hw.centerId)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>截止: {new Date(hw.dueDate).toLocaleDateString("zh-CN")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>提交: {hw.submissionCount ?? 0} 份</span>
                  </div>
                  {hw.expand?.teacherId && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{hw.expand.teacherId.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
