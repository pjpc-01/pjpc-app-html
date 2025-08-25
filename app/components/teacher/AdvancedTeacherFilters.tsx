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
  Users,
  BookOpen,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  Star,
  Clock,
  UserCheck,
  UserX,
  GraduationCap,
  Building,
  MapPin,
  Award,
  TrendingUp,
  Settings,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface TeacherFilterState {
  searchTerm: string
  selectedSubject: string
  selectedDepartment: string
  selectedStatus: string
  selectedExperience: string
  experienceRange: [number, number]
  hasPhone: boolean
  hasEmail: boolean
  emailVerified: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: { from?: Date; to?: Date }
  quickFilters: string[]
}

interface AdvancedTeacherFiltersProps {
  filters: TeacherFilterState
  onFiltersChange: (filters: TeacherFilterState) => void
  onSaveFilter?: (name: string, filters: TeacherFilterState) => void
  onLoadFilter?: (name: string) => void
  savedFilters?: { name: string; filters: TeacherFilterState }[]
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

const departmentOptions = [
  { value: "数学组", label: "数学组" },
  { value: "语文组", label: "语文组" },
  { value: "英语组", label: "英语组" },
  { value: "理科组", label: "理科组" },
  { value: "文科组", label: "文科组" },
  { value: "艺术组", label: "艺术组" },
  { value: "体育组", label: "体育组" },
  { value: "行政组", label: "行政组" },
]

const statusOptions = [
  { value: "approved", label: "已批准" },
  { value: "pending", label: "待审核" },
  { value: "suspended", label: "已暂停" },
]

const experienceOptions = [
  { value: "0-2", label: "0-2年" },
  { value: "3-5", label: "3-5年" },
  { value: "6-10", label: "6-10年" },
  { value: "11-15", label: "11-15年" },
  { value: "16+", label: "16年以上" },
]

const quickFilterOptions = [
  { id: 'approved', label: '已批准教师', icon: UserCheck, color: 'green' },
  { id: 'pending', label: '待审核教师', icon: Clock, color: 'yellow' },
  { id: 'suspended', label: '已暂停教师', icon: UserX, color: 'red' },
  { id: 'experienced', label: '资深教师', icon: Award, color: 'purple' },
  { id: 'new', label: '新教师', icon: GraduationCap, color: 'blue' },
  { id: 'verified', label: '已验证邮箱', icon: Mail, color: 'gray' },
  { id: 'has-phone', label: '有联系电话', icon: Phone, color: 'gray' },
  { id: 'department-heads', label: '部门主管', icon: Building, color: 'indigo' },
]

export default function AdvancedTeacherFilters({
  filters,
  onFiltersChange,
  onSaveFilter,
  onLoadFilter,
  savedFilters = []
}: AdvancedTeacherFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState("")

  const updateFilter = (updates: Partial<TeacherFilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      selectedSubject: "",
      selectedDepartment: "",
      selectedStatus: "",
      selectedExperience: "",
      experienceRange: [0, 30],
      hasPhone: false,
      hasEmail: false,
      emailVerified: false,
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
      filters.selectedSubject ||
      filters.selectedDepartment ||
      filters.selectedStatus ||
      filters.selectedExperience ||
      filters.hasPhone ||
      filters.hasEmail ||
      filters.emailVerified ||
      filters.quickFilters.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to ||
      filters.experienceRange[0] > 0 ||
      filters.experienceRange[1] < 30
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
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">高级筛选</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filters.quickFilters.length + 
                 (filters.searchTerm ? 1 : 0) + 
                 (filters.selectedSubject ? 1 : 0) + 
                 (filters.selectedDepartment ? 1 : 0) + 
                 (filters.selectedStatus ? 1 : 0) + 
                 (filters.selectedExperience ? 1 : 0) + 
                 (filters.hasPhone ? 1 : 0) + 
                 (filters.hasEmail ? 1 : 0) + 
                 (filters.emailVerified ? 1 : 0) + 
                 (filters.dateRange.from || filters.dateRange.to ? 1 : 0) + 
                 (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 30 ? 1 : 0)} 个筛选
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
                        placeholder="例如：资深数学教师"
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
              placeholder="搜索教师姓名、邮箱..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select value={filters.selectedSubject} onValueChange={(value) => updateFilter({ selectedSubject: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {subjectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.selectedDepartment} onValueChange={(value) => updateFilter({ selectedDepartment: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择部门" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部部门</SelectItem>
              {departmentOptions.map((option) => (
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
              <SelectItem value="all">全部状态</SelectItem>
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
            {/* 教龄范围 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                教龄范围: {filters.experienceRange[0]} - {filters.experienceRange[1]} 年
              </Label>
              <Slider
                value={filters.experienceRange}
                onValueChange={(value) => updateFilter({ experienceRange: value as [number, number] })}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* 日期范围 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">入职日期范围</Label>
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
                      <SelectItem value="name">姓名</SelectItem>
                      <SelectItem value="experience">教龄</SelectItem>
                      <SelectItem value="subject">科目</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                      <SelectItem value="createdAt">入职时间</SelectItem>
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

            {/* 联系信息筛选 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">联系信息</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPhone"
                    checked={filters.hasPhone}
                    onCheckedChange={(checked) => updateFilter({ hasPhone: checked as boolean })}
                  />
                  <Label htmlFor="hasPhone" className="text-sm">有联系电话</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEmail"
                    checked={filters.hasEmail}
                    onCheckedChange={(checked) => updateFilter({ hasEmail: checked as boolean })}
                  />
                  <Label htmlFor="hasEmail" className="text-sm">有邮箱地址</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailVerified"
                    checked={filters.emailVerified}
                    onCheckedChange={(checked) => updateFilter({ emailVerified: checked as boolean })}
                  />
                  <Label htmlFor="emailVerified" className="text-sm">邮箱已验证</Label>
                </div>
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
