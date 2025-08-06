"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Calendar, GraduationCap, Users2 } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese, calculateAge } from "./utils"

interface StudentStatsProps {
  students: Student[]
}

export default function StudentStats({ students }: StudentStatsProps) {
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const inactiveStudents = students.filter(s => s.status === 'inactive').length
  
  const studentsByGrade = students.reduce((acc, student) => {
    const grade = student.grade || 'Unknown'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const studentsByGender = students.reduce((acc, student) => {
    const gender = student.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const studentsWithAge = students.filter(s => s.age || s.birthDate)
  const totalAge = studentsWithAge.reduce((sum, student) => {
    return sum + (student.age || calculateAge(student.birthDate!))
  }, 0)
  const averageAge = studentsWithAge.length > 0 ? Math.round(totalAge / studentsWithAge.length) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学生数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">所有注册学生</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在读学生</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? `${Math.round((activeStudents / totalStudents) * 100)}%` : '0%'} 在读率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">离校学生</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? `${Math.round((inactiveStudents / totalStudents) * 100)}%` : '0%'} 离校率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均年龄</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{averageAge}</div>
            <p className="text-xs text-muted-foreground">
              {studentsWithAge.length} 名学生有年龄信息
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              年级分布
            </CardTitle>
            <CardDescription>各年级学生人数统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(studentsByGrade).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600">{convertGradeToChinese(grade)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              性别分布
            </CardTitle>
            <CardDescription>学生性别比例</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {Object.entries(studentsByGender).map(([gender, count]) => (
                <div key={gender} className="flex items-center gap-2">
                  <Badge variant="outline">
                    {gender === 'male' ? '男' : gender === 'female' ? '女' : '未知'}
                  </Badge>
                  <span className="text-lg font-semibold">{count}</span>
                  <span className="text-sm text-gray-500">
                    ({totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 