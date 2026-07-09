"use client"

import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye } from "lucide-react"
import Link from "next/link"

export default function StudentReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            学生报告列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">加载中...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无学生报告。前往「学生列表」为学生创建报告。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学期</TableHead>
                  <TableHead>年份</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
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
    </PageLayout>
  )
}
