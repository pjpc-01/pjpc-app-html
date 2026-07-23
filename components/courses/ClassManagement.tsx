"use client"

import { useClassGroups } from '@/hooks/useCourses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from "@/contexts/language-context"
import {
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Filter,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// 年级分组选项
const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  'Peralihan', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5',
]

// 颜色映射
const GRADE_COLORS: Record<string, string> = {
  '一年级': 'bg-red-100 text-red-700',
  '二年级': 'bg-orange-100 text-orange-700',
  '三年级': 'bg-amber-100 text-amber-700',
  '四年级': 'bg-yellow-100 text-yellow-700',
  '五年级': 'bg-lime-100 text-lime-700',
  '六年级': 'bg-green-100 text-green-700',
  'Peralihan': 'bg-cyan-100 text-cyan-700',
  'Form 1': 'bg-blue-100 text-blue-700',
  'Form 2': 'bg-indigo-100 text-indigo-700',
  'Form 3': 'bg-violet-100 text-violet-700',
  'Form 4': 'bg-purple-100 text-purple-700',
  'Form 5': 'bg-pink-100 text-pink-700',
}

function getGradeColor(grade: string): string {
  return GRADE_COLORS[grade] || 'bg-gray-100 text-gray-600'
}

// ============================================================
// ClassManagement 主组件
// ============================================================

interface ClassManagementProps {
  showTitle?: boolean
}

export default function ClassManagement({ showTitle = true }: ClassManagementProps) {
  const { t } = useLanguage()
  const { groups, loading, error, refetch } = useClassGroups()
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  // 按年级分组统计
  const gradeDistribution = groups.reduce((acc, g) => {
    acc[g.grade_level] = (acc[g.grade_level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 筛选
  const filteredGroups = groups.filter((g) => {
    if (searchTerm && !g.courseName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !g.subject?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (gradeFilter !== 'all' && g.grade_level !== gradeFilter) return false
    return true
  })

  // 按年级分组显示
  const groupedByGrade = filteredGroups.reduce((acc, g) => {
    const grade = g.grade_level || '未分组'
    if (!acc[grade]) acc[grade] = []
    acc[grade].push(g)
    return acc
  }, {} as Record<string, typeof groups>)

  // 加载状态
  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">加载班级数据...</p>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
          <h3 className="text-lg font-medium text-red-700 mb-1">{t('course.load_failed')}</h3>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" /> 重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计行 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{groups.length}</div>
              <div className="text-xs text-gray-500">班级总数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(gradeDistribution).length}</div>
              <div className="text-xs text-gray-500">年级覆盖</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {groups.filter(g => g.status === 'active').length}
              </div>
              <div className="text-xs text-gray-500">活跃班级</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Object.keys(GRADE_OPTIONS).length}
              </div>
              <div className="text-xs text-gray-500">可开课年级</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索课程或科目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('course.grade_filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('course.all_grades')}</SelectItem>
            {GRADE_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            onClick={() => setViewMode('card')}
          >
            卡片
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            onClick={() => setViewMode('table')}
          >
            表格
          </Button>
        </div>
      </div>

      {/* 空状态 */}
      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">暂无班级数据</h3>
            <p className="text-sm text-gray-400">
              {searchTerm ? '没有符合搜索条件的班级' : '请先在课程管理中创建课程并设置年级'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 卡片视图 — 按年级分组 */}
      {viewMode === 'card' && filteredGroups.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByGrade).map(([grade, gradeGroups]) => (
            <div key={grade}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getGradeColor(grade) + ' text-sm px-3 py-1'}>
                  {grade}
                </Badge>
                <span className="text-xs text-gray-400">{gradeGroups.length} 个班级</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gradeGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                        {group.courseName}
                      </CardTitle>
                      <CardDescription>{group.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{group.teacherName || '未分配教师'}</span>
                        <Badge
                          variant="secondary"
                          className={
                            group.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }
                        >
                          {group.status === 'active' ? '进行中' : '已暂停'}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {group.studentCount > 0 ? `${group.studentCount} 名学生` : '查看详情'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表格视图 */}
      {viewMode === 'table' && filteredGroups.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('course.course_name')}</TableHead>
                <TableHead>{t('exam.subject')}</TableHead>
                <TableHead>{t('student.grade')}</TableHead>
                <TableHead>{t('teacher.teacher')}</TableHead>
                <TableHead>{t('teacher.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.courseName}</TableCell>
                  <TableCell>{group.subject}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getGradeColor(group.grade_level)}>
                      {group.grade_level}
                    </Badge>
                  </TableCell>
                  <TableCell>{group.teacherName || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        group.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {group.status === 'active' ? '进行中' : '已暂停'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
