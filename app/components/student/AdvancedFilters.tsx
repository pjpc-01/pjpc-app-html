"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Filter, 
  X, 
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react"
import { Student } from "@/hooks/useStudents"

export interface FilterState {
  searchTerm: string
  selectedGrade: string
  selectedCenter: string
  selectedStatus: string
  selectedGender: string
  selectedLevel: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  // Legacy fields kept for parent compatibility
  ageRange?: [number, number]
  enrollmentYear?: string
  enrollmentDateRange?: { from: Date | undefined; to: Date | undefined }
  hasPhone?: boolean
  hasEmail?: boolean
  hasAddress?: boolean
  hasGrades?: boolean
  hasAssignments?: boolean
  attendanceRate?: [number, number]
  quickFilters?: string[]
}

interface AdvancedFiltersProps {
  students: Student[]
  value: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  collapsed?: boolean
}

export default function AdvancedFilters({
  students,
  value: filters,
  onChange,
  onClear,
  collapsed = true,
}: AdvancedFiltersProps) {
  // UI-only expanded state
  const [_expanded, _setExpanded] = useState(false)

  const filterOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort()
    const statuses = Array.from(new Set(students.map(s => s.status).filter(Boolean))).sort()
    const centers = Array.from(new Set(students.map(s => s.center).filter(Boolean))).sort()
    const genders = Array.from(new Set(students.map(s => s.gender).filter(Boolean))).sort()
    const levels = Array.from(new Set(students.map(s => s.level).filter(Boolean))).sort()
    return { grades, statuses, centers, genders, levels }
  }, [students])

  const update = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  const hasActive =
    filters.searchTerm !== "" ||
    filters.selectedGrade !== "all" ||
    filters.selectedCenter !== "all" ||
    filters.selectedStatus !== "all" ||
    filters.selectedGender !== "all" ||
    filters.selectedLevel !== "all"

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选
          </CardTitle>
          <div className="flex items-center gap-1">
            {hasActive && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />重置
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => _setExpanded(!_expanded)}>
              {_expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pb-3">
        {/* Always-visible: search + 3 key dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、学号、家长..."
              value={filters.searchTerm}
              onChange={(e) => update('searchTerm', e.target.value)}
              className="pl-8 h-9 text-sm"
            />
            {filters.searchTerm && (
              <button onClick={() => update('searchTerm', '')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={filters.selectedGrade} onValueChange={(v) => update('selectedGrade', v)}>
            <SelectTrigger className="w-[100px] h-9 text-sm">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              {filterOptions.grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.selectedStatus} onValueChange={(v) => update('selectedStatus', v)}>
            <SelectTrigger className="w-[90px] h-9 text-sm">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.selectedCenter} onValueChange={(v) => update('selectedCenter', v)}>
            <SelectTrigger className="w-[100px] h-9 text-sm">
              <SelectValue placeholder="中心" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部中心</SelectItem>
              {filterOptions.centers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Active badges */}
        {hasActive && (
          <div className="flex flex-wrap gap-1">
            {filters.selectedGrade !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                年级: {filters.selectedGrade}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => update('selectedGrade', 'all')} />
              </Badge>
            )}
            {filters.selectedStatus !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                状态: {filters.selectedStatus}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => update('selectedStatus', 'all')} />
              </Badge>
            )}
            {filters.selectedCenter !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                中心: {filters.selectedCenter}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => update('selectedCenter', 'all')} />
              </Badge>
            )}
          </div>
        )}

        {/* Expanded extra filters */}
        {_expanded && (
          <div className="space-y-2.5 pt-2 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">性别</Label>
                <Select value={filters.selectedGender} onValueChange={(v) => update('selectedGender', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {filterOptions.genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">级别</Label>
                <Select value={filters.selectedLevel} onValueChange={(v) => update('selectedLevel', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {filterOptions.levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">排序</Label>
                <Select value={filters.sortBy} onValueChange={(v) => update('sortBy', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">姓名</SelectItem>
                    <SelectItem value="grade">年级</SelectItem>
                    <SelectItem value="status">状态</SelectItem>
                    <SelectItem value="center">中心</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">方向</Label>
                <Select value={filters.sortOrder} onValueChange={(v: 'asc' | 'desc') => update('sortOrder', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">升序</SelectItem>
                    <SelectItem value="desc">降序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
