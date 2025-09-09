"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Search, 
  User, 
  MapPin, 
  GraduationCap, 
  Clock,
  Check,
  ChevronsUpDown,
  Users,
  Star
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  standard?: string
  status: string
  avatar?: string
  parentName?: string
  email?: string
}

interface SmartStudentSelectorProps {
  students: Student[]
  selectedStudent: string
  onStudentSelect: (studentId: string) => void
  placeholder?: string
  label?: string
  required?: boolean
}

export default function SmartStudentSelector({
  students,
  selectedStudent,
  onStudentSelect,
  placeholder = "搜索并选择学生...",
  label = "选择学生",
  required = false
}: SmartStudentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("all")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [recentStudents, setRecentStudents] = useState<string[]>([])

  // 从localStorage加载最近选择的学生
  useEffect(() => {
    const saved = localStorage.getItem('recent-selected-students')
    if (saved) {
      try {
        setRecentStudents(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent students:', error)
      }
    }
  }, [])

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    const centers = Array.from(new Set(students.map(s => s.center).filter(Boolean))).sort()
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort()
    return { centers, grades }
  }, [students])

  // 智能筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    // 搜索筛选
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(lowerSearchTerm) ||
        student.student_id?.toLowerCase().includes(lowerSearchTerm) ||
        student.parentName?.toLowerCase().includes(lowerSearchTerm) ||
        student.email?.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // 中心筛选
    if (selectedCenter !== "all") {
      filtered = filtered.filter(student => student.center === selectedCenter)
    }

    // 年级筛选
    if (selectedGrade !== "all") {
      filtered = filtered.filter(student => student.standard === selectedGrade)
    }

    // 按最近使用和活跃状态排序
    filtered.sort((a, b) => {
      const aRecent = recentStudents.includes(a.id)
      const bRecent = recentStudents.includes(b.id)
      
      if (aRecent && !bRecent) return -1
      if (!aRecent && bRecent) return 1
      
      // 然后按状态排序（活跃的在前）
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      
      // 最后按姓名排序
      return a.student_name.localeCompare(b.student_name)
    })

    return filtered
  }, [students, searchTerm, selectedCenter, selectedGrade, recentStudents])

  // 获取最近选择的学生
  const recentStudentsList = useMemo(() => {
    return students.filter(student => recentStudents.includes(student.id))
  }, [students, recentStudents])

  // 处理学生选择
  const handleStudentSelect = (studentId: string) => {
    onStudentSelect(studentId)
    setOpen(false)
    
    // 更新最近选择的学生
    const newRecent = [studentId, ...recentStudents.filter(id => id !== studentId)].slice(0, 5)
    setRecentStudents(newRecent)
    localStorage.setItem('recent-selected-students', JSON.stringify(newRecent))
  }

  // 获取选中的学生信息
  const selectedStudentInfo = students.find(s => s.id === selectedStudent)

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'graduated': return 'bg-blue-100 text-blue-800'
      case 'transferred': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '在读'
      case 'inactive': return '非活跃'
      case 'graduated': return '已毕业'
      case 'transferred': return '已转学'
      default: return status
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto p-3"
          >
            {selectedStudentInfo ? (
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedStudentInfo.avatar} />
                  <AvatarFallback className="text-xs">
                    {selectedStudentInfo.student_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">{selectedStudentInfo.student_name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedStudentInfo.student_id} • {selectedStudentInfo.center}
                  </div>
                </div>
                <Badge className={getStatusColor(selectedStudentInfo.status)}>
                  {getStatusText(selectedStudentInfo.status)}
                </Badge>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="p-3 border-b">
              <div className="space-y-3">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名、学号、家长..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* 筛选器 */}
                <div className="flex gap-2">
                  <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="中心" />
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
                  
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="年级" />
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
              </div>
            </div>
            
            <CommandList className="max-h-[300px]">
              {/* 最近选择的学生 */}
              {recentStudentsList.length > 0 && !searchTerm && (
                <CommandGroup heading="最近选择">
                  {recentStudentsList.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => handleStudentSelect(student.id)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="text-xs">
                          {student.student_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-gray-500">
                          {student.student_id} • {student.center}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(student.status)}>
                          {getStatusText(student.status)}
                        </Badge>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedStudent === student.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* 所有学生 */}
              <CommandGroup heading={recentStudentsList.length > 0 ? "所有学生" : "学生列表"}>
                {filteredStudents.length === 0 ? (
                  <CommandEmpty>没有找到匹配的学生</CommandEmpty>
                ) : (
                  filteredStudents.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => handleStudentSelect(student.id)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="text-xs">
                          {student.student_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-gray-500">
                          {student.student_id} • {student.center}
                          {student.standard && ` • ${student.standard}`}
                        </div>
                        {student.parentName && (
                          <div className="text-xs text-gray-400">
                            家长: {student.parentName}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(student.status)}>
                          {getStatusText(student.status)}
                        </Badge>
                        {recentStudents.includes(student.id) && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedStudent === student.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* 选中学生的详细信息 */}
      {selectedStudentInfo && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedStudentInfo.avatar} />
              <AvatarFallback>
                {selectedStudentInfo.student_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{selectedStudentInfo.student_name}</div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedStudentInfo.student_id}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedStudentInfo.center}
                  </span>
                  {selectedStudentInfo.standard && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {selectedStudentInfo.standard}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(selectedStudentInfo.status)}>
              {getStatusText(selectedStudentInfo.status)}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
