"use client"

import React from "react"
import { useParentPortal } from "@/hooks/useParentPortal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  GraduationCap,
  School,
  AlertCircle,
  ChevronRight,
  UserCheck,
  CreditCard,
  BarChart3,
  BookOpen,
  RefreshCw,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

function ChildCard({ child }: { child: any }) {
  const { t } = useLanguage()
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{child.name}</CardTitle>
              <CardDescription>
                {child.grade}
                {child.school ? ` · ${child.school}` : ""}
              </CardDescription>
            </div>
          </div>
          <Badge variant={child.status === "active" ? "default" : "secondary"}>
            {child.status === "active" ? "在读" : "已毕业"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <QuickStat
            icon={<UserCheck className="h-4 w-4" />}
            label={t('attendance.present')}
            value="95%"
            color="text-green-600"
          />
          <QuickStat
            icon={<BarChart3 className="h-4 w-4" />}
            label={t('dashboard.grade')}
            value="查看"
            color="text-blue-600"
          />
          <QuickStat
            icon={<CreditCard className="h-4 w-4" />}
            label="缴费"
            value="查看"
            color="text-amber-600"
          />
          <QuickStat
            icon={<BookOpen className="h-4 w-4" />}
            label={t('teacher.homework')}
            value="查看"
            color="text-purple-600"
            href={`/parent/children/${child.id}/homework`}
          />
          <QuickStat
            icon={<span className="text-lg">📓</span>}
            label={t('dashboard.log')}
            value="查看"
            color="text-teal-600"
            href={`/parent/dailylogs?child=${child.id}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/parent/dailylogs?child=${child.id}`}>
              每日日志 <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/parent/grades?child=${child.id}`}>
              成绩 <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/parent/attendance?child=${child.id}`}>
              出勤 <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/parent/payments?child=${child.id}`}>
              缴费 <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickStat({ icon, label, value, color, href }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  href?: string
}) {
  const content = (
    <div className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors cursor-pointer">
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

export default function ParentDashboardPage() {
  const { parentName, children, loading, error } = useParentPortal()

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {parentName ? `${parentName}，您好 👋` : "家长门户"}
          </h1>
          <p className="text-gray-500 mt-1">查看孩子在安亲班的学习与生活情况</p>
        </div>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">暂无关联孩子</p>
            <p className="text-gray-400 text-sm">请联系管理员关联您的孩子</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  )
}
