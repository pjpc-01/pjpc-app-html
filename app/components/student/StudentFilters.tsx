"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"
import { Badge } from "@/components/ui/badge"

interface StudentFiltersProps {
  dataType: 'primary' | 'secondary'
  setDataType: (type: 'primary' | 'secondary') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedGrade: string
  setSelectedGrade: (grade: string) => void
  students: Student[]
}

export default function StudentFilters({
  dataType,
  setDataType,
  searchTerm,
  setSearchTerm,
  selectedGrade,
  setSelectedGrade,
  students
}: StudentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  // 获取所有年级选项
  const gradeOptions = Array.from(new Set(students.map(student => student.grade).filter(Boolean)))

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedGrade("")
  }

  const hasActiveFilters = searchTerm || selectedGrade

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* 数据类型选择器 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="primary-data"
                  checked={dataType === 'primary'}
                  onChange={() => setDataType('primary')}
                />
                <Label htmlFor="primary-data" className="text-sm">
                  小学数据 (Primary)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="secondary-data"
                  checked={dataType === 'secondary'}
                  onChange={() => setDataType('secondary')}
                />
                <Label htmlFor="secondary-data" className="text-sm">
                  中学数据 (Secondary)
                </Label>
              </div>
            </div>
            
            {/* 临时调试按钮 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/check-secondary-data')
                  const data = await response.json()
                  console.log('Secondary data check:', data)
                  alert(`中学数据检查结果:\n\n${JSON.stringify(data.results, null, 2)}`)
                } catch (error) {
                  console.error('Error checking secondary data:', error)
                  alert('检查中学数据失败')
                }
              }}
            >
              检查中学数据
            </Button>
            
            {/* 添加中学测试数据按钮 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/add-secondary-test-data', {
                    method: 'POST'
                  })
                  const data = await response.json()
                  console.log('Add secondary test data result:', data)
                  alert(data.message)
                } catch (error) {
                  console.error('Error adding secondary test data:', error)
                  alert('添加中学测试数据失败')
                }
              }}
            >
              添加中学测试数据
            </Button>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索学生姓名、学号或年级..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              过滤
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

          {/* 高级过滤选项 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="grade-filter">年级</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有年级</SelectItem>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {convertGradeToChinese(grade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 可以添加更多过滤选项 */}
              <div>
                <Label htmlFor="status-filter">状态</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有状态</SelectItem>
                    <SelectItem value="active">在读</SelectItem>
                    <SelectItem value="inactive">离校</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gender-filter">性别</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有性别</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 活跃过滤条件显示 */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-gray-600">活跃过滤:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  搜索: {searchTerm}
                </Badge>
              )}
              {selectedGrade && (
                <Badge variant="secondary" className="text-xs">
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