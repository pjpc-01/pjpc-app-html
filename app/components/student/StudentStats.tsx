"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese, calculateAge } from "./utils"

interface StudentStatsProps {
  students: Student[]
}

export default function StudentStats({ students }: StudentStatsProps) {
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const inactiveStudents = students.filter(s => s.status === 'inactive').length
  
  // 按年级统计
  const gradeStats = students.reduce((acc, student) => {
    const grade = student.grade || '未知年级'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 按性别统计
  const genderStats = students.reduce((acc, student) => {
    const gender = student.gender || '未知'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 平均年龄
  const ages = students
    .map(s => s.birthDate ? calculateAge(s.birthDate) : 0)
    .filter(age => age > 0)
  const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 总学生数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总学生数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            所有注册学生
          </p>
        </CardContent>
      </Card>

      {/* 在读学生 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">在读学生</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
          <p className="text-xs text-muted-foreground">
            {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% 在读率
          </p>
        </CardContent>
      </Card>

      {/* 离校学生 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">离校学生</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{inactiveStudents}</div>
          <p className="text-xs text-muted-foreground">
            {totalStudents > 0 ? Math.round((inactiveStudents / totalStudents) * 100) : 0}% 离校率
          </p>
        </CardContent>
      </Card>

      {/* 平均年龄 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均年龄</CardTitle>
          <GraduationCap className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{averageAge}</div>
          <p className="text-xs text-muted-foreground">
            岁
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 