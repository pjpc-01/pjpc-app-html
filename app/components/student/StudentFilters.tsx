"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X, TrendingUp, BarChart3 } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import SmartSearch from "./SmartSearch"
import AdvancedFilters from "./AdvancedFilters"
import FilterAnalytics from "./FilterAnalytics"
import QuickFilters from "./QuickFilters"

interface StudentFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedGrade: string
  setSelectedGrade: (grade: string) => void
  students: Student[]
  filteredStudents: Student[]
  onFiltersChange?: (filters: FilterState) => void
}

interface FilterState {
  searchTerm: string
  selectedGrade: string
  selectedCenter: string
  selectedStatus: string
  selectedGender: string
  selectedLevel: string
  ageRange: [number, number]
  enrollmentYear: string
  enrollmentDateRange: { from: Date | undefined; to: Date | undefined }
  hasPhone: boolean
  hasEmail: boolean
  hasAddress: boolean
  hasGrades: boolean
  hasAssignments: boolean
  attendanceRate: [number, number]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  quickFilters: string[]
}

export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedGrade,
  setSelectedGrade,
  students,
  filteredStudents,
  onFiltersChange
}: StudentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25])
  const [enrollmentYear, setEnrollmentYear] = useState("")
  const [hasPhone, setHasPhone] = useState(false)
  const [hasEmail, setHasEmail] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const [hasGrades, setHasGrades] = useState(false)
  const [hasAssignments, setHasAssignments] = useState(false)
  const [attendanceRate, setAttendanceRate] = useState<[number, number]>([0, 100])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [enrollmentDateRange, setEnrollmentDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [quickFilters, setQuickFilters] = useState<string[]>([])

  // 当前筛选状态
  const currentFilters: FilterState = {
    searchTerm,
    selectedGrade,
    selectedCenter,
    selectedStatus,
    selectedGender,
    selectedLevel,
    ageRange,
    enrollmentYear,
    enrollmentDateRange,
    hasPhone,
    hasEmail,
    hasAddress,
    hasGrades,
    hasAssignments,
    attendanceRate,
    sortBy,
    sortOrder,
    quickFilters
  }

  // 清除所有筛选
  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedGrade("all")
    setSelectedCenter("all")
    setSelectedStatus("all")
    setSelectedGender("")
    setSelectedLevel("")
    setAgeRange([0, 25])
    setEnrollmentYear("")
    setHasPhone(false)
    setHasEmail(false)
    setHasAddress(false)
    setHasGrades(false)
    setHasAssignments(false)
    setAttendanceRate([0, 100])
    setEnrollmentDateRange({ from: undefined, to: undefined })
    setQuickFilters([])
  }

  // 检查是否有活跃筛选
  const hasActiveFilters = searchTerm || 
    (selectedGrade && selectedGrade !== "all") || 
    (selectedCenter && selectedCenter !== "all") || 
    (selectedStatus && selectedStatus !== "all") || 
    selectedGender || selectedLevel || 
    enrollmentYear || hasPhone || hasEmail || hasAddress || 
    hasGrades || hasAssignments ||
    (ageRange[0] > 0 || ageRange[1] < 25) ||
    (attendanceRate[0] > 0 || attendanceRate[1] < 100) ||
    enrollmentDateRange.from || enrollmentDateRange.to ||
    quickFilters.length > 0

  // 应用筛选
  const applyFilters = () => {
    onFiltersChange?.(currentFilters)
  }

  // 当筛选条件改变时自动应用
  useEffect(() => {
    applyFilters()
  }, [currentFilters, onFiltersChange])

  return (
    <div className="space-y-4">
      {/* 智能搜索 */}
      <SmartSearch
        students={students}
        onSearch={setSearchTerm}
        onClear={() => setSearchTerm("")}
      />

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
            case 'has-email':
              setHasEmail(true)
              break
            case 'has-address':
              setHasAddress(true)
              break
            case 'recent':
              // 设置最近3个月的日期范围
              const threeMonthsAgo = new Date()
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
              setEnrollmentDateRange({
                from: threeMonthsAgo,
                to: new Date()
              })
              break
            case 'new':
              // 设置本月的日期范围
              const now = new Date()
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
              setEnrollmentDateRange({
                from: firstDayOfMonth,
                to: now
              })
              break
            case 'all':
              clearAllFilters()
              break
          }
        }}
        activeFilters={[
          ...(selectedLevel ? [selectedLevel] : []),
          ...(hasPhone ? ['has-phone'] : []),
          ...(hasEmail ? ['has-email'] : []),
          ...(hasAddress ? ['has-address'] : []),
          ...(enrollmentDateRange.from ? ['recent'] : [])
        ]}
      />

      {/* 控制按钮 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? '收起筛选' : '高级筛选'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showAnalytics ? '隐藏统计' : '筛选统计'}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4 mr-2" />
            清除筛选
          </Button>
        )}
      </div>

      {/* 高级筛选 */}
      {showFilters && (
        <AdvancedFilters
          students={students}
          onFiltersChange={(newFilters) => {
            // 更新本地状态
            if (newFilters.selectedGrade !== undefined) setSelectedGrade(newFilters.selectedGrade)
            if (newFilters.selectedCenter !== undefined) setSelectedCenter(newFilters.selectedCenter)
            if (newFilters.selectedStatus !== undefined) setSelectedStatus(newFilters.selectedStatus)
            if (newFilters.selectedGender !== undefined) setSelectedGender(newFilters.selectedGender)
            if (newFilters.selectedLevel !== undefined) setSelectedLevel(newFilters.selectedLevel)
            if (newFilters.ageRange !== undefined) setAgeRange(newFilters.ageRange)
            if (newFilters.enrollmentYear !== undefined) setEnrollmentYear(newFilters.enrollmentYear)
            if (newFilters.enrollmentDateRange !== undefined) setEnrollmentDateRange(newFilters.enrollmentDateRange)
            if (newFilters.hasPhone !== undefined) setHasPhone(newFilters.hasPhone)
            if (newFilters.hasEmail !== undefined) setHasEmail(newFilters.hasEmail)
            if (newFilters.hasAddress !== undefined) setHasAddress(newFilters.hasAddress)
            if (newFilters.hasGrades !== undefined) setHasGrades(newFilters.hasGrades)
            if (newFilters.hasAssignments !== undefined) setHasAssignments(newFilters.hasAssignments)
            if (newFilters.attendanceRate !== undefined) setAttendanceRate(newFilters.attendanceRate)
            if (newFilters.sortBy !== undefined) setSortBy(newFilters.sortBy)
            if (newFilters.sortOrder !== undefined) setSortOrder(newFilters.sortOrder)
            if (newFilters.quickFilters !== undefined) setQuickFilters(newFilters.quickFilters)
          }}
          onClearFilters={clearAllFilters}
        />
      )}

      {/* 筛选统计 */}
      {showAnalytics && (
        <FilterAnalytics
          students={students}
          filteredStudents={filteredStudents}
          filters={currentFilters}
        />
      )}
    </div>
  )
} 