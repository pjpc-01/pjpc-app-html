"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Filter, Search, X } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"

interface StudentFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedGrade: string
  setSelectedGrade: (grade: string) => void
  students: Student[]
}

export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedGrade,
  setSelectedGrade,
  students
}: StudentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  // 获取年级选项
  const gradeOptions = Array.from(new Set(students.map(student => student.grade))).sort()



  const clearFilters = () => {
    setSearchTerm("")
    setSelectedGrade("")
  }

  const hasActiveFilters = searchTerm || selectedGrade

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">学生筛选</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                清除筛选
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">搜索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="搜索姓名、学号或年级..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="grade-filter">年级筛选</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {convertGradeToChinese(grade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">当前筛选:</span>
              {searchTerm && (
                <Badge variant="secondary">
                  搜索: {searchTerm}
                </Badge>
              )}
              {selectedGrade && (
                <Badge variant="secondary">
                  年级: {convertGradeToChinese(selectedGrade)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 