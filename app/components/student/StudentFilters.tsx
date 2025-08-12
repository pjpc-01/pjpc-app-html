"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
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
import { Filter, Search, X, Smartphone, MapPin, Calendar as CalendarIcon, Users, GraduationCap } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import QuickFilters from "./QuickFilters"

interface StudentFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedGrade: string
  setSelectedGrade: (grade: string) => void
  students: Student[]
  onFiltersChange?: (filters: FilterState) => void
}

interface FilterState {
  searchTerm: string
  selectedGrade: string
  selectedCenter: string
  selectedGender: string
  selectedLevel: string
  ageRange: [number, number]
  enrollmentYear: string
  hasPhone: boolean
  hasAddress: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedGrade,
  setSelectedGrade,
  students,
  onFiltersChange
}: StudentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25])
  const [enrollmentYear, setEnrollmentYear] = useState("")
  const [hasPhone, setHasPhone] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })

  // 智能搜索建议
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    const centers = Array.from(new Set(students.map(s => s.center))).sort()
    const grades = Array.from(new Set(students.map(s => s.standard || s.grade))).sort()
    const genders = Array.from(new Set(students.map(s => s.gender))).filter(Boolean).sort()
    const levels = Array.from(new Set(students.map(s => s.level))).sort()
    const years = Array.from(new Set(students.map(s => s.enrollmentYear))).filter(Boolean).sort((a, b) => b.localeCompare(a))

    return { centers, grades, genders, levels, years }
  }, [students])

  // 生成搜索建议
  const generateSearchSuggestions = (input: string) => {
    if (!input.trim()) {
      setSearchSuggestions([])
      return
    }

    const suggestions = new Set<string>()
    const lowerInput = input.toLowerCase()

    students.forEach(student => {
      // 姓名匹配
      if (student.name?.toLowerCase().includes(lowerInput)) {
        suggestions.add(student.name)
      }
      // 学号匹配
      if (student.studentId?.toLowerCase().includes(lowerInput)) {
        suggestions.add(student.studentId)
      }
      // 年级匹配
      if (student.standard?.toLowerCase().includes(lowerInput)) {
        suggestions.add(student.standard)
      }
      // 中心匹配
      if (student.center?.toLowerCase().includes(lowerInput)) {
        suggestions.add(student.center)
      }
    })

    setSearchSuggestions(Array.from(suggestions).slice(0, 5))
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    generateSearchSuggestions(value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedGrade("")
    setSelectedCenter("")
    setSelectedGender("")
    setSelectedLevel("")
    setAgeRange([0, 25])
    setEnrollmentYear("")
    setHasPhone(false)
    setHasAddress(false)
    setSortBy("name")
    setSortOrder('asc')
    setDateRange({ from: undefined, to: undefined })
    setSearchSuggestions([])
    setShowSuggestions(false)
  }

  const hasActiveFilters = searchTerm || selectedGrade || selectedCenter || 
                          selectedGender || selectedLevel || enrollmentYear || 
                          hasPhone || hasAddress || ageRange[0] > 0 || ageRange[1] < 25

  // 应用筛选
  const applyFilters = () => {
    const filters: FilterState = {
      searchTerm,
      selectedGrade,
      selectedCenter,
      selectedGender,
      selectedLevel,
      ageRange,
      enrollmentYear,
      hasPhone,
      hasAddress,
      sortBy,
      sortOrder
    }
    onFiltersChange?.(filters)
  }

  // 当筛选条件改变时自动应用
  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedGrade, selectedCenter, selectedGender, selectedLevel, 
      ageRange, enrollmentYear, hasPhone, hasAddress, sortBy, sortOrder])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 智能搜索栏 */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="智能搜索：姓名、学号、年级、中心..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                高级筛选
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
              )}
            </div>
          </div>

          {/* 快速筛选 */}
          <QuickFilters
            onFilterSelect={(filterId) => {
              switch (filterId) {
                case 'primary':
                  setSelectedLevel('primary')
                  break
                case 'secondary':
                  setSelectedLevel('secondary')
                  break
                case 'has-phone':
                  setHasPhone(true)
                  break
                case 'has-address':
                  setHasAddress(true)
                  break
                case 'recent':
                  // 设置最近3个月的日期范围
                  const threeMonthsAgo = new Date()
                  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
                  setDateRange({
                    from: threeMonthsAgo,
                    to: new Date()
                  })
                  break
                case 'new':
                  // 设置本月的日期范围
                  const now = new Date()
                  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                  setDateRange({
                    from: firstDayOfMonth,
                    to: now
                  })
                  break
                case 'all':
                  clearFilters()
                  break
              }
            }}
            activeFilters={[
              ...(selectedLevel ? [selectedLevel] : []),
              ...(hasPhone ? ['has-phone'] : []),
              ...(hasAddress ? ['has-address'] : []),
              ...(dateRange.from ? ['recent'] : [])
            ]}
          />

          {/* 快速筛选标签 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">当前筛选:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  {searchTerm}
                </Badge>
              )}
              {selectedGrade && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {convertGradeToChinese(selectedGrade)}
                </Badge>
              )}
              {selectedCenter && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedCenter}
                </Badge>
              )}
              {selectedGender && (
                <Badge variant="secondary">
                  性别: {selectedGender}
                </Badge>
              )}
              {selectedLevel && (
                <Badge variant="secondary">
                  级别: {selectedLevel === 'primary' ? '小学' : '中学'}
                </Badge>
              )}
              {enrollmentYear && (
                <Badge variant="secondary">
                  入学年份: {enrollmentYear}
                </Badge>
              )}
              {hasPhone && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  有电话
                </Badge>
              )}
              {hasAddress && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  有地址
                </Badge>
              )}
              {(ageRange[0] > 0 || ageRange[1] < 25) && (
                <Badge variant="secondary">
                  年龄: {ageRange[0]}-{ageRange[1]}岁
                </Badge>
              )}
            </div>
          )}

          {/* 高级筛选面板 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {/* 年级筛选 */}
              <div>
                <Label htmlFor="grade-filter">年级</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部年级</SelectItem>
                    {filterOptions.grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {convertGradeToChinese(grade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 中心筛选 */}
              <div>
                <Label htmlFor="center-filter">中心</Label>
                <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择中心" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部中心</SelectItem>
                    {filterOptions.centers.map((center) => (
                      <SelectItem key={center} value={center}>
                        {center}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 性别筛选 */}
              <div>
                <Label htmlFor="gender-filter">性别</Label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部性别</SelectItem>
                    {filterOptions.genders.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 级别筛选 */}
              <div>
                <Label htmlFor="level-filter">级别</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部级别</SelectItem>
                    <SelectItem value="primary">小学</SelectItem>
                    <SelectItem value="secondary">中学</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 入学年份筛选 */}
              <div>
                <Label htmlFor="year-filter">入学年份</Label>
                <Select value={enrollmentYear} onValueChange={setEnrollmentYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部年份</SelectItem>
                    {filterOptions.years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 排序 */}
              <div>
                <Label htmlFor="sort-filter">排序</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">姓名</SelectItem>
                    <SelectItem value="studentId">学号</SelectItem>
                    <SelectItem value="grade">年级</SelectItem>
                    <SelectItem value="age">年龄</SelectItem>
                    <SelectItem value="enrollmentYear">入学年份</SelectItem>
                    <SelectItem value="createdAt">创建时间</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 年龄范围 */}
              <div className="md:col-span-2">
                <Label>年龄范围: {ageRange[0]} - {ageRange[1]} 岁</Label>
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  max={25}
                  min={0}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* 布尔筛选 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-phone"
                    checked={hasPhone}
                    onCheckedChange={setHasPhone}
                  />
                  <Label htmlFor="has-phone">有联系电话</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-address"
                    checked={hasAddress}
                    onCheckedChange={setHasAddress}
                  />
                  <Label htmlFor="has-address">有地址信息</Label>
                </div>
              </div>

              {/* 排序方向 */}
              <div>
                <Label htmlFor="sort-order">排序方向</Label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
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
          )}
        </div>
      </CardContent>
    </Card>
  )
} 