"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  Filter, 
  X, 
  Search, 
  Calendar as CalendarIcon,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Save,
  RotateCcw
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface FilterState {
  searchTerm: string
  selectedGrade: string
  selectedStatus: string
  selectedCenter: string
  selectedGender: string
  ageRange: [number, number]
  enrollmentYear: string
  hasPhone: boolean
  hasEmail: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  quickFilters: string[]
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onSaveFilter: (name: string, filters: FilterState) => void
  onLoadFilter: (name: string) => void
  savedFilters: { name: string; filters: FilterState }[]
}

const quickFilterOptions = [
  { id: 'primary', label: '小学生', icon: GraduationCap, color: 'orange' },
  { id: 'secondary', label: '中学生', icon: GraduationCap, color: 'purple' },
  { id: 'active', label: '在读学生', icon: UserCheck, color: 'green' },
  { id: 'inactive', label: '离校学生', icon: UserX, color: 'red' },
  { id: 'recent', label: '最近入学', icon: Clock, color: 'blue' },
  { id: 'excellent', label: '优秀学生', icon: Star, color: 'yellow' },
  { id: 'has-phone', label: '有联系电话', icon: Phone, color: 'gray' },
  { id: 'has-email', label: '有邮箱', icon: Mail, color: 'gray' },
]

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onSaveFilter,
  onLoadFilter,
  savedFilters
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const updateFilter = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      selectedGrade: "all",
      selectedStatus: "all",
      selectedCenter: "",
      selectedGender: "",
      ageRange: [0, 25],
      enrollmentYear: "",
      hasPhone: false,
      hasEmail: false,
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

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim(), filters)
      setFilterName("")
      setShowSaveDialog(false)
    }
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'selectedGrade' || key === 'selectedStatus') {
      return value !== "" && value !== "all"
    }
    if (typeof value === 'string') return value !== ""
    if (typeof value === 'boolean') return value
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== "")
    }
    return false
  })

  return (
    <div className="space-y-4">
      {/* 快速筛选 */}
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
              className={`flex items-center gap-2 ${
                isActive ? `bg-${option.color}-600 hover:bg-${option.color}-700` : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          )
        })}
      </div>

      {/* 主要筛选区域 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                高级筛选
              </CardTitle>
              <CardDescription>
                使用多种条件精确筛选学生数据
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? '收起' : '展开'}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 搜索和基本筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="姓名、学号、年级..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>年级</Label>
              <Select value={filters.selectedGrade} onValueChange={(value) => updateFilter({ selectedGrade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年级</SelectItem>
                  <SelectItem value="一年级">一年级</SelectItem>
                  <SelectItem value="二年级">二年级</SelectItem>
                  <SelectItem value="三年级">三年级</SelectItem>
                  <SelectItem value="四年级">四年级</SelectItem>
                  <SelectItem value="五年级">五年级</SelectItem>
                  <SelectItem value="六年级">六年级</SelectItem>
                  <SelectItem value="初一">初一</SelectItem>
                  <SelectItem value="初二">初二</SelectItem>
                  <SelectItem value="初三">初三</SelectItem>
                  <SelectItem value="高一">高一</SelectItem>
                  <SelectItem value="高二">高二</SelectItem>
                  <SelectItem value="高三">高三</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={filters.selectedStatus} onValueChange={(value) => updateFilter({ selectedStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">在读</SelectItem>
                  <SelectItem value="graduated">已毕业</SelectItem>
                  <SelectItem value="transferred">已转学</SelectItem>
                  <SelectItem value="inactive">非活跃</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>排序</Label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter({ sortBy: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">姓名</SelectItem>
                  <SelectItem value="studentId">学号</SelectItem>
                  <SelectItem value="grade">年级</SelectItem>
                  <SelectItem value="status">状态</SelectItem>
                  <SelectItem value="parentName">家长姓名</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 高级筛选选项 */}
          {showFilters && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 联系信息筛选 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700">联系信息</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has-phone" className="text-sm">有联系电话</Label>
                      <Switch
                        id="has-phone"
                        checked={filters.hasPhone}
                        onCheckedChange={(checked) => updateFilter({ hasPhone: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has-email" className="text-sm">有邮箱地址</Label>
                      <Switch
                        id="has-email"
                        checked={filters.hasEmail}
                        onCheckedChange={(checked) => updateFilter({ hasEmail: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* 日期范围筛选 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700">入学时间</h4>
                  <div className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            filters.dateRange.to ? (
                              <>
                                {format(filters.dateRange.from, "LLL dd, y", { locale: zhCN })} -{" "}
                                {format(filters.dateRange.to, "LLL dd, y", { locale: zhCN })}
                              </>
                            ) : (
                              format(filters.dateRange.from, "LLL dd, y", { locale: zhCN })
                            )
                          ) : (
                            <span>选择日期范围</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange.from}
                          selected={{
                            from: filters.dateRange.from,
                            to: filters.dateRange.to,
                          }}
                          onSelect={(range) => updateFilter({ 
                            dateRange: { 
                              from: range?.from, 
                              to: range?.to 
                            } 
                          })}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 排序方向 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700">排序设置</h4>
                  <div className="space-y-3">
                    <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter({ sortOrder: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            升序
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            降序
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 保存和加载筛选 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存筛选
                  </Button>
                  
                  {savedFilters.length > 0 && (
                    <Select onValueChange={onLoadFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="加载已保存的筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedFilters.map((filter) => (
                          <SelectItem key={filter.name} value={filter.name}>
                            {filter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置筛选
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存筛选对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">保存筛选条件</h3>
            <Input
              placeholder="输入筛选名称"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选标签 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">当前筛选:</span>
          {filters.searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              搜索: {filters.searchTerm}
            </Badge>
          )}
          {filters.selectedGrade && filters.selectedGrade !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              年级: {filters.selectedGrade}
            </Badge>
          )}
          {filters.selectedStatus && filters.selectedStatus !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              状态: {filters.selectedStatus}
            </Badge>
          )}
          {filters.hasPhone && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              有电话
            </Badge>
          )}
          {filters.hasEmail && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              有邮箱
            </Badge>
          )}
          {filters.quickFilters.map((filterId) => {
            const option = quickFilterOptions.find(opt => opt.id === filterId)
            return option ? (
              <Badge key={filterId} variant="secondary" className="flex items-center gap-1">
                <option.icon className="h-3 w-3" />
                {option.label}
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
