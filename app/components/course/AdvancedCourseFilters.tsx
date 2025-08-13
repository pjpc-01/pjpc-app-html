"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  X,
  Save,
  Download,
  Upload,
  BookOpen,
  Users,
  Calendar as CalendarIcon,
  Clock,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Settings,
  GraduationCap,
  Building,
  Target,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface CourseFilterState {
  searchTerm: string
  selectedTeacher: string
  selectedSubject: string
  selectedStatus: string
  selectedLevel: string
  studentRange: [number, number]
  progressRange: [number, number]
  materialRange: [number, number]
  hasSchedule: boolean
  hasMaterials: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: { from?: Date; to?: Date }
  quickFilters: string[]
}

interface AdvancedCourseFiltersProps {
  filters: CourseFilterState
  onFiltersChange: (filters: CourseFilterState) => void
  onSaveFilter?: (name: string, filters: CourseFilterState) => void
  onLoadFilter?: (name: string) => void
  savedFilters?: { name: string; filters: CourseFilterState }[]
}

const subjectOptions = [
  { value: "数学", label: "数学" },
  { value: "语文", label: "语文" },
  { value: "英语", label: "英语" },
  { value: "科学", label: "科学" },
  { value: "历史", label: "历史" },
  { value: "地理", label: "地理" },
  { value: "物理", label: "物理" },
  { value: "化学", label: "化学" },
  { value: "生物", label: "生物" },
  { value: "艺术", label: "艺术" },
  { value: "体育", label: "体育" },
  { value: "音乐", label: "音乐" },
]

const teacherOptions = [
  { value: "张老师", label: "张老师" },
  { value: "李老师", label: "李老师" },
  { value: "王老师", label: "王老师" },
  { value: "陈老师", label: "陈老师" },
  { value: "刘老师", label: "刘老师" },
]

const statusOptions = [
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "paused", label: "已暂停" },
  { value: "planned", label: "计划中" },
]

const levelOptions = [
  { value: "primary", label: "小学" },
  { value: "secondary", label: "中学" },
  { value: "high", label: "高中" },
]

const quickFilterOptions = [
  { id: 'active', label: '进行中课程', icon: Play, color: 'green' },
  { id: 'completed', label: '已完成课程', icon: CheckCircle, color: 'blue' },
  { id: 'paused', label: '已暂停课程', icon: Pause, color: 'yellow' },
  { id: 'popular', label: '热门课程', icon: Star, color: 'orange' },
  { id: 'small-class', label: '小班课程', icon: Users, color: 'purple' },
  { id: 'large-class', label: '大班课程', icon: Building, color: 'indigo' },
  { id: 'high-progress', label: '高进度课程', icon: TrendingUp, color: 'green' },
  { id: 'low-progress', label: '低进度课程', icon: AlertCircle, color: 'red' },
  { id: 'well-resourced', label: '资源丰富', icon: BookOpen, color: 'teal' },
  { id: 'scheduled', label: '已排课', icon: CalendarIcon, color: 'gray' },
]

export default function AdvancedCourseFilters({
  filters,
  onFiltersChange,
  onSaveFilter,
  onLoadFilter,
  savedFilters = []
}: AdvancedCourseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState("")

  const updateFilter = (updates: Partial<CourseFilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      selectedTeacher: "",
      selectedSubject: "",
      selectedStatus: "",
      selectedLevel: "",
      studentRange: [0, 100],
      progressRange: [0, 100],
      materialRange: [0, 50],
      hasSchedule: false,
      hasMaterials: false,
      sortBy: "name",
      sortOrder: 'asc',
      dateRange: { from: undefined, to: undefined },
      quickFilters: []
    })
  }

  const toggleQuickFilter = (filterId: string) => {
    const newQuickFilters = filters.quickFilters.includes(filterId)
      ? filters.quickFilters.filter(id => id !== filterId)
      : [...filters.quickFilters, filterId]
    updateFilter({ quickFilters: newQuickFilters })
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm ||
      filters.selectedTeacher ||
      filters.selectedSubject ||
      filters.selectedStatus ||
      filters.selectedLevel ||
      filters.hasSchedule ||
      filters.hasMaterials ||
      filters.quickFilters.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to ||
      filters.studentRange[0] > 0 ||
      filters.studentRange[1] < 100 ||
      filters.progressRange[0] > 0 ||
      filters.progressRange[1] < 100 ||
      filters.materialRange[0] > 0 ||
      filters.materialRange[1] < 50
    )
  }, [filters])

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim(), filters)
      setFilterName("")
      setShowSaveDialog(false)
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">高级筛选</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {filters.quickFilters.length + 
                 (filters.searchTerm ? 1 : 0) + 
                 (filters.selectedTeacher ? 1 : 0) + 
                 (filters.selectedSubject ? 1 : 0) + 
                 (filters.selectedStatus ? 1 : 0) + 
                 (filters.selectedLevel ? 1 : 0) + 
                 (filters.hasSchedule ? 1 : 0) + 
                 (filters.hasMaterials ? 1 : 0) + 
                 (filters.dateRange.from || filters.dateRange.to ? 1 : 0) + 
                 (filters.studentRange[0] > 0 || filters.studentRange[1] < 100 ? 1 : 0) + 
                 (filters.progressRange[0] > 0 || filters.progressRange[1] < 100 ? 1 : 0) + 
                 (filters.materialRange[0] > 0 || filters.materialRange[1] < 50 ? 1 : 0)} 个筛选
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
            {onSaveFilter && (
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>保存筛选条件</DialogTitle>
                    <DialogDescription>
                      为当前的筛选条件设置一个名称，方便下次使用
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="filterName">筛选名称</Label>
                      <Input
                        id="filterName"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="例如：热门数学课程"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                        保存
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "收起" : "展开"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 快速筛选 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">快速筛选</Label>
          <div className="flex flex-wrap gap-2">
            {quickFilterOptions.map((option) => {
              const Icon = option.icon
              const isActive = filters.quickFilters.includes(option.id)
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleQuickFilter(option.id)}
                  className={cn(
                    "h-8",
                    isActive && `bg-${option.color}-100 text-${option.color}-800 border-${option.color}-200`
                  )}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* 搜索和基础筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索课程名称..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select value={filters.selectedTeacher} onValueChange={(value) => updateFilter({ selectedTeacher: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择教师" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部教师</SelectItem>
              {teacherOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.selectedSubject} onValueChange={(value) => updateFilter({ selectedSubject: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部科目</SelectItem>
              {subjectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.selectedStatus} onValueChange={(value) => updateFilter({ selectedStatus: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 展开的高级筛选 */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* 学生人数范围 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                学生人数范围: {filters.studentRange[0]} - {filters.studentRange[1]} 人
              </Label>
              <Slider
                value={filters.studentRange}
                onValueChange={(value) => updateFilter({ studentRange: value as [number, number] })}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* 进度范围 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                教学进度: {filters.progressRange[0]}% - {filters.progressRange[1]}%
              </Label>
              <Slider
                value={filters.progressRange}
                onValueChange={(value) => updateFilter({ progressRange: value as [number, number] })}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* 教材数量范围 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                教材数量: {filters.materialRange[0]} - {filters.materialRange[1]} 个
              </Label>
              <Slider
                value={filters.materialRange}
                onValueChange={(value) => updateFilter({ materialRange: value as [number, number] })}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* 日期范围和排序 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">创建日期范围</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "开始日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => updateFilter({ dateRange: { ...filters.dateRange, from: date } })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "结束日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => updateFilter({ dateRange: { ...filters.dateRange, to: date } })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">排序方式</Label>
                <div className="flex gap-2">
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter({ sortBy: value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">课程名称</SelectItem>
                      <SelectItem value="teacher">授课教师</SelectItem>
                      <SelectItem value="students">学生人数</SelectItem>
                      <SelectItem value="progress">教学进度</SelectItem>
                      <SelectItem value="materials">教材数量</SelectItem>
                      <SelectItem value="createdAt">创建时间</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>

            {/* 其他筛选条件 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">教育阶段</Label>
                <Select value={filters.selectedLevel} onValueChange={(value) => updateFilter({ selectedLevel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部阶段</SelectItem>
                    {levelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSchedule"
                  checked={filters.hasSchedule}
                  onCheckedChange={(checked) => updateFilter({ hasSchedule: checked as boolean })}
                />
                <Label htmlFor="hasSchedule" className="text-sm">已排课</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasMaterials"
                  checked={filters.hasMaterials}
                  onCheckedChange={(checked) => updateFilter({ hasMaterials: checked as boolean })}
                />
                <Label htmlFor="hasMaterials" className="text-sm">有教材</Label>
              </div>
            </div>
          </div>
        )}

        {/* 已保存的筛选条件 */}
        {savedFilters.length > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">已保存的筛选条件</Label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <Button
                  key={savedFilter.name}
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadFilter?.(savedFilter.name)}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {savedFilter.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
