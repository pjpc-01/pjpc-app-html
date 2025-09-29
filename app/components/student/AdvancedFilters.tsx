"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  Save, 
  Download, 
  Upload,
  Calendar as CalendarIcon,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Star
} from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface AdvancedFiltersProps {
  students: Student[]
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
  onSavePreset?: (name: string, filters: FilterState) => void
  onLoadPreset?: (preset: FilterPreset) => void
}

interface FilterState {
  // 基本信息筛选
  searchTerm: string
  selectedGrade: string
  selectedCenter: string
  selectedStatus: string
  selectedGender: string
  selectedLevel: string
  
  // 年龄和入学筛选
  ageRange: [number, number]
  enrollmentYear: string
  enrollmentDateRange: { from: Date | undefined; to: Date | undefined }
  
  // 联系信息筛选
  hasPhone: boolean
  hasEmail: boolean
  hasAddress: boolean
  
  // 学术信息筛选
  hasGrades: boolean
  hasAssignments: boolean
  attendanceRate: [number, number]
  
  // 排序
  sortBy: string
  sortOrder: 'asc' | 'desc'
  
  // 快速筛选
  quickFilters: string[]
}

interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  createdAt: number
  usageCount: number
}

export default function AdvancedFilters({
  students,
  onFiltersChange,
  onClearFilters,
  onSavePreset,
  onLoadPreset
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([])
  const [presetName, setPresetName] = useState("")
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedGrade: "all",
    selectedCenter: "all",
    selectedStatus: "all",
    selectedGender: "all",
    selectedLevel: "all",
    ageRange: [0, 25],
    enrollmentYear: "",
    enrollmentDateRange: { from: undefined, to: undefined },
    hasPhone: false,
    hasEmail: false,
    hasAddress: false,
    hasGrades: false,
    hasAssignments: false,
    attendanceRate: [0, 100],
    sortBy: "name",
    sortOrder: 'asc',
    quickFilters: []
  })

  // 从localStorage加载预设
  useEffect(() => {
    const saved = localStorage.getItem('student-filter-presets')
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load filter presets:', error)
      }
    }
  }, [])

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort()
    const statuses = Array.from(new Set(students.map(s => s.status).filter(Boolean))).sort()
    const centers = Array.from(new Set(students.map(s => s.center).filter(Boolean))).sort()
    const genders = Array.from(new Set(students.map(s => s.gender).filter(Boolean))).sort()
    const levels = Array.from(new Set(students.map(s => s.level).filter(Boolean))).sort()
    
    // 计算年龄范围
    const ages = students
      .map(s => {
        if (s.dob) {
          const birthYear = new Date(s.dob).getFullYear()
          return new Date().getFullYear() - birthYear
        }
        return null
      })
      .filter(Boolean) as number[]
    
    const minAge = Math.min(...ages, 0)
    const maxAge = Math.max(...ages, 25)
    
    return { grades, statuses, centers, genders, levels, minAge, maxAge }
  }, [students])

  // 更新筛选条件
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 应用筛选 - 只在本地状态变化时通知父组件
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // 清除所有筛选
  const clearAllFilters = () => {
    console.log('🔍 AdvancedFilters: 清除筛选条件...')
    setFilters({
      searchTerm: "",
      selectedGrade: "all",
      selectedCenter: "",
      selectedStatus: "all",
      selectedGender: "all",
      selectedLevel: "all",
      ageRange: [filterOptions.minAge, filterOptions.maxAge],
      enrollmentYear: "",
      enrollmentDateRange: { from: undefined, to: undefined },
      hasPhone: false,
      hasEmail: false,
      hasAddress: false,
      hasGrades: false,
      hasAssignments: false,
      attendanceRate: [0, 100],
      sortBy: "name",
      sortOrder: 'asc',
      quickFilters: []
    })
  }

  // 保存预设
  const savePreset = () => {
    if (!presetName.trim()) return
    
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters },
      createdAt: Date.now(),
      usageCount: 0
    }
    
    const updatedPresets = [...savedPresets, newPreset]
    setSavedPresets(updatedPresets)
    localStorage.setItem('student-filter-presets', JSON.stringify(updatedPresets))
    setPresetName("")
    setShowPresets(false)
    
    onSavePreset?.(presetName, filters)
  }

  // 加载预设
  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
    onLoadPreset?.(preset)
    
    // 更新使用次数
    const updatedPresets = savedPresets.map(p => 
      p.id === preset.id ? { ...p, usageCount: p.usageCount + 1 } : p
    )
    setSavedPresets(updatedPresets)
    localStorage.setItem('student-filter-presets', JSON.stringify(updatedPresets))
  }

  // 删除预设
  const deletePreset = (presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId)
    setSavedPresets(updatedPresets)
    localStorage.setItem('student-filter-presets', JSON.stringify(updatedPresets))
  }

  // 检查是否有活跃筛选
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'ageRange') return value[0] > filterOptions.minAge || value[1] < filterOptions.maxAge
    if (key === 'attendanceRate') return value[0] > 0 || value[1] < 100
    if (key === 'enrollmentDateRange') return value.from || value.to
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value && value !== 'all'
    if (Array.isArray(value)) return value.length > 0
    return false
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            智能筛选
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
            >
              <Star className="h-4 w-4 mr-2" />
              预设
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? '收起' : '展开'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                清除
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 预设面板 */}
        {showPresets && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">筛选预设</h4>
              <Button size="sm" onClick={() => setShowPresets(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 保存新预设 */}
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="预设名称"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={savePreset} disabled={!presetName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>

            {/* 预设列表 */}
            <div className="space-y-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {preset.name}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      使用 {preset.usageCount} 次
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePreset(preset.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快速筛选标签 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">当前筛选:</span>
            {filters.selectedGrade !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                年级: {filters.selectedGrade}
              </Badge>
            )}
            {filters.selectedCenter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                中心: {filters.selectedCenter}
              </Badge>
            )}
            {filters.selectedStatus !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
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
            {(filters.ageRange[0] > filterOptions.minAge || filters.ageRange[1] < filterOptions.maxAge) && (
              <Badge variant="secondary">
                年龄: {filters.ageRange[0]}-{filters.ageRange[1]}岁
              </Badge>
            )}
          </div>
        )}

        {/* 高级筛选面板 */}
        {showFilters && (
          <div className="space-y-6 pt-4 border-t">
            {/* 基本信息筛选 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                基本信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grade-filter">年级</Label>
                  <Select value={filters.selectedGrade} onValueChange={(value) => updateFilter('selectedGrade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部年级</SelectItem>
                      {filterOptions.grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="center-filter">中心</Label>
                  <Select value={filters.selectedCenter} onValueChange={(value) => updateFilter('selectedCenter', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择中心" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部中心</SelectItem>
                      {filterOptions.centers.map((center) => (
                        <SelectItem key={center} value={center}>
                          {center}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter">状态</Label>
                  <Select value={filters.selectedStatus} onValueChange={(value) => updateFilter('selectedStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      {filterOptions.statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gender-filter">性别</Label>
                  <Select value={filters.selectedGender} onValueChange={(value) => updateFilter('selectedGender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部性别</SelectItem>
                      {filterOptions.genders.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level-filter">级别</Label>
                  <Select value={filters.selectedLevel} onValueChange={(value) => updateFilter('selectedLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部级别</SelectItem>
                      {filterOptions.levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* 年龄和入学筛选 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                年龄和入学
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>年龄范围: {filters.ageRange[0]} - {filters.ageRange[1]} 岁</Label>
                  <Slider
                    value={filters.ageRange}
                    onValueChange={(value) => updateFilter('ageRange', value)}
                    min={filterOptions.minAge}
                    max={filterOptions.maxAge}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="enrollment-year">入学年份</Label>
                  <Input
                    id="enrollment-year"
                    placeholder="例如: 2023"
                    value={filters.enrollmentYear}
                    onChange={(e) => updateFilter('enrollmentYear', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 联系信息筛选 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                联系信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-phone"
                    checked={filters.hasPhone}
                    onCheckedChange={(checked) => updateFilter('hasPhone', checked)}
                  />
                  <Label htmlFor="has-phone">有电话号码</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-email"
                    checked={filters.hasEmail}
                    onCheckedChange={(checked) => updateFilter('hasEmail', checked)}
                  />
                  <Label htmlFor="has-email">有邮箱地址</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-address"
                    checked={filters.hasAddress}
                    onCheckedChange={(checked) => updateFilter('hasAddress', checked)}
                  />
                  <Label htmlFor="has-address">有地址信息</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* 排序设置 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                排序设置
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sort-by">排序字段</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">姓名</SelectItem>
                      <SelectItem value="studentId">学号</SelectItem>
                      <SelectItem value="grade">年级</SelectItem>
                      <SelectItem value="status">状态</SelectItem>
                      <SelectItem value="center">中心</SelectItem>
                      <SelectItem value="parentName">家长姓名</SelectItem>
                      <SelectItem value="created">创建时间</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort-order">排序方向</Label>
                  <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}>
                    <SelectTrigger>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}