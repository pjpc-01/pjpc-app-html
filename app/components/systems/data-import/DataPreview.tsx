'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Calendar } from 'lucide-react'
import { StudentData } from '@/lib/google-sheets'

interface DataPreviewProps {
  previewData: StudentData[]
  stats: { total: number; byGrade: Record<string, number> } | null
}

export function DataPreview({ previewData, stats }: DataPreviewProps) {
  if (previewData.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总记录数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">导入的数据记录</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年级分布</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.byGrade).map(([grade, count]) => (
                  <div key={grade} className="flex justify-between text-sm">
                    <span>{grade}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">数据预览</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{previewData.length}</div>
              <p className="text-xs text-muted-foreground">预览记录数</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>数据预览</CardTitle>
          <CardDescription>预览导入的数据内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>地址</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.slice(0, 10).map((student, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.phone || student.parentPhone}</TableCell>
                    <TableCell>{student.center || 'WX 01'}</TableCell>
                    <TableCell>{student.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {previewData.length > 10 && (
              <div className="text-center text-sm text-muted-foreground mt-2">
                显示前10条记录，共 {previewData.length} 条
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
